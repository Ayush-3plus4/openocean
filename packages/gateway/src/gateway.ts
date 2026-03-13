import { WebSocketServer, WebSocket } from 'ws'
import { randomUUID } from 'crypto'

// --- Types ---
// A Session is one conversation with one user on one channel
interface Session {
  id: string
  channel: string
  connectedAt: Date
  lastSeen: Date
}

// A Message is anything sent to the Gateway
interface GatewayMessage {
  type: 'ping' | 'message' | 'status'
  sessionId?: string
  payload?: unknown
}

interface GatewayConfig {
  port: number
  host: string // Always 127.0.0.1 in OpenOcean
}

// --- Gateway ---
export function createGateway(config: GatewayConfig) {
  const sessions = new Map<string, Session>()
  const clients = new Map<string, WebSocket>()

  // Audit log — every event is recorded
  function audit(event: string, data?: unknown) {
    const entry = {
      timestamp: new Date().toISOString(),
      event,
      data,
    }
    console.log('[AUDIT]', JSON.stringify(entry))
  }

  function handleMessage(ws: WebSocket, sessionId: string, raw: string) {
    let msg: GatewayMessage

    // Safely parse incoming messages — never trust raw input
    try {
      msg = JSON.parse(raw) as GatewayMessage
    } catch {
      ws.send(JSON.stringify({ error: 'Invalid JSON' }))
      return
    }

    audit('message_received', { sessionId, type: msg.type })

    if (msg.type === 'ping') {
      ws.send(JSON.stringify({ type: 'pong', sessionId }))
      return
    }

    if (msg.type === 'status') {
      ws.send(JSON.stringify({
        type: 'status',
        sessions: sessions.size,
        uptime: process.uptime(),
      }))
      return
    }

    // More message types will be added as we build channels + agent
    ws.send(JSON.stringify({ type: 'ack', sessionId }))
  }

  function start() {
    const wss = new WebSocketServer({
      port: config.port,
      host: config.host, // Security: always 127.0.0.1
    })

    console.log(🌊 OpenOcean Gateway running on :)
    audit('gateway_started', { host: config.host, port: config.port })

    wss.on('connection', (ws) => {
      // Every connection gets a unique session ID
      const sessionId = randomUUID()

      const session: Session = {
        id: sessionId,
        channel: 'unknown',
        connectedAt: new Date(),
        lastSeen: new Date(),
      }

      sessions.set(sessionId, session)
      clients.set(sessionId, ws)

      audit('session_created', { sessionId })

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'welcome',
        sessionId,
        message: 'Connected to OpenOcean Gateway',
      }))

      ws.on('message', (data) => {
        // Update last seen time
        const s = sessions.get(sessionId)
        if (s) s.lastSeen = new Date()

        handleMessage(ws, sessionId, data.toString())
      })

      ws.on('close', () => {
        sessions.delete(sessionId)
        clients.delete(sessionId)
        audit('session_closed', { sessionId })
      })

      ws.on('error', (err) => {
        audit('session_error', { sessionId, error: err.message })
      })
    })
  }

  return { start, sessions, clients }
}

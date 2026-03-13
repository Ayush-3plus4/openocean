import { WebSocketServer, WebSocket } from 'ws'
import { randomUUID } from 'crypto'

interface Session {
  id: string
  channel: string
  connectedAt: Date
  lastSeen: Date
}

interface GatewayMessage {
  type: 'ping' | 'message' | 'status'
  sessionId?: string
  payload?: unknown
}

interface GatewayConfig {
  port: number
  host: string
}

export function createGateway(config: GatewayConfig) {
  const sessions = new Map<string, Session>()
  const clients = new Map<string, WebSocket>()

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

    ws.send(JSON.stringify({ type: 'ack', sessionId }))
  }

  function start() {
    const wss = new WebSocketServer({
      port: config.port,
      host: config.host,
    })

    console.log('[OpenOcean] Gateway running on ' + config.host + ':' + config.port)
    audit('gateway_started', { host: config.host, port: config.port })

    wss.on('connection', (ws) => {
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

      ws.send(JSON.stringify({
        type: 'welcome',
        sessionId,
        message: 'Connected to OpenOcean Gateway',
      }))

      ws.on('message', (data) => {
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

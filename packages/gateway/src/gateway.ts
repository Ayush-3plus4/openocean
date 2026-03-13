import { WebSocketServer, WebSocket } from 'ws'
import { randomUUID } from 'crypto'
import type { Orchestrator } from './orchestrator.ts'

interface Session {
  id: string
  userId: string
  channel: string
  connectedAt: Date
  lastSeen: Date
}

interface GatewayMessage {
  type: 'ping' | 'message' | 'status' | 'reset' | 'spend'
  sessionId?: string
  userId?: string
  text?: string
  channel?: string
  model?: string
}

interface GatewayConfig {
  port: number
  host: string
  orchestrator: Orchestrator
}

export function createGateway(config: GatewayConfig) {
  const sessions = new Map<string, Session>()
  const clients = new Map<string, WebSocket>()

  function audit(event: string, data?: unknown) {
    console.log('[AUDIT]', JSON.stringify({
      timestamp: new Date().toISOString(),
      event,
      data,
    }))
  }

  async function handleMessage(ws: WebSocket, sessionId: string, raw: string) {
    let msg: GatewayMessage
    try {
      msg = JSON.parse(raw) as GatewayMessage
    } catch {
      ws.send(JSON.stringify({ error: 'Invalid JSON' }))
      return
    }

    audit('message_received', { sessionId, type: msg.type })

    // Ping
    if (msg.type === 'ping') {
      ws.send(JSON.stringify({ type: 'pong', sessionId }))
      return
    }

    // Status
    if (msg.type === 'status') {
      ws.send(JSON.stringify({
        type: 'status',
        sessions: sessions.size,
        uptime: process.uptime(),
        spend: config.orchestrator.spendSummary(),
      }))
      return
    }

    // Spend summary
    if (msg.type === 'spend') {
      ws.send(JSON.stringify({
        type: 'spend',
        ...config.orchestrator.spendSummary(),
      }))
      return
    }

    // Reset session conversation
    if (msg.type === 'reset') {
      config.orchestrator.resetSession(sessionId)
      ws.send(JSON.stringify({ type: 'reset', sessionId }))
      return
    }

    // Main message — send to orchestrator
    if (msg.type === 'message' && msg.text) {
      const session = sessions.get(sessionId)
      const userId = msg.userId ?? session?.userId ?? 'unknown'
      const channel = msg.channel ?? session?.channel ?? 'websocket'

      const response = await config.orchestrator.handle({
        userId,
        sessionId,
        text: msg.text,
        channel,
      })

      ws.send(JSON.stringify({
        type: 'reply',
        sessionId,
        text: response.text,
        tokensUsed: response.tokensUsed,
        costUsd: response.costUsd,
        blocked: response.blocked,
        blockReason: response.blockReason,
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
        userId: 'unknown',
        channel: 'websocket',
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

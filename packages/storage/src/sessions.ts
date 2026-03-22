import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs'
import { resolve } from 'path'

export interface StoredMessage {
  id: string
  timestamp: string
  role: 'user' | 'assistant'
  content: string
  model?: string
  provider?: string
  tokensUsed?: number
  costUsd?: number
}

export interface StoredSession {
  id: string
  channel: string
  userId: string
  createdAt: string
  updatedAt: string
  messages: StoredMessage[]
}

export interface SessionStoreConfig {
  dataDir: string
}

export class SessionStore {
  private dataDir: string

  constructor(config: SessionStoreConfig) {
    this.dataDir = config.dataDir + '/sessions'
    mkdirSync(this.dataDir, { recursive: true })
    console.log('[SessionStore] Ready at ' + this.dataDir)
  }

  // Save a message to a session
  addMessage(
    sessionId: string,
    channel: string,
    userId: string,
    message: Omit<StoredMessage, 'id' | 'timestamp'>
  ): void {
    const session = this.getOrCreate(sessionId, channel, userId)

    const stored: StoredMessage = {
      ...message,
      id: Math.random().toString(36).slice(2),
      timestamp: new Date().toISOString(),
    }

    session.messages.push(stored)
    session.updatedAt = new Date().toISOString()
    this.save(session)
  }

  // Get a full session by ID
  getSession(sessionId: string): StoredSession | null {
    const file = this.filePath(sessionId)
    if (!existsSync(file)) return null
    try {
      return JSON.parse(readFileSync(file, 'utf-8'))
    } catch {
      return null
    }
  }

  // List all sessions
  listSessions(): StoredSession[] {
    try {
      const files = readdirSync(this.dataDir).filter(f => f.endsWith('.json'))
      return files.map(f => {
        try {
          return JSON.parse(readFileSync(resolve(this.dataDir, f), 'utf-8'))
        } catch {
          return null
        }
      }).filter(Boolean) as StoredSession[]
    } catch {
      return []
    }
  }

  // Get sessions for a specific user
  getSessionsByUser(userId: string): StoredSession[] {
    return this.listSessions().filter(s => s.userId === userId)
  }

  // Get sessions for a specific channel
  getSessionsByChannel(channel: string): StoredSession[] {
    return this.listSessions().filter(s => s.channel === channel)
  }

  // Format a session as readable text for replay
  formatSession(session: StoredSession): string {
    let text = 'Session: ' + session.id + '\n'
    text += 'Channel: ' + session.channel + '\n'
    text += 'User: ' + session.userId + '\n'
    text += 'Started: ' + session.createdAt + '\n'
    text += 'Messages: ' + session.messages.length + '\n'
    text += '================================\n\n'

    for (const msg of session.messages) {
      const time = new Date(msg.timestamp).toLocaleTimeString()
      const role = msg.role === 'user' ? 'You' : 'OpenOcean'
      text += '[' + time + '] ' + role + ':\n'
      text += msg.content + '\n'
      if (msg.tokensUsed) {
        text += '(' + msg.tokensUsed + ' tokens, $' + (msg.costUsd ?? 0).toFixed(6) + ')\n'
      }
      text += '\n'
    }

    return text
  }

  // Get messages up to a specific point for replay
  getMessagesUpTo(sessionId: string, messageIndex: number): StoredMessage[] {
    const session = this.getSession(sessionId)
    if (!session) return []
    return session.messages.slice(0, messageIndex + 1)
  }

  // Delete a session
  deleteSession(sessionId: string): void {
    const file = this.filePath(sessionId)
    if (existsSync(file)) {
      const { unlinkSync } = require('fs')
      unlinkSync(file)
      console.log('[SessionStore] Deleted session: ' + sessionId)
    }
  }

  private getOrCreate(sessionId: string, channel: string, userId: string): StoredSession {
    const existing = this.getSession(sessionId)
    if (existing) return existing

    return {
      id: sessionId,
      channel,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    }
  }

  private save(session: StoredSession): void {
    try {
      writeFileSync(this.filePath(session.id), JSON.stringify(session, null, 2))
    } catch (err) {
      console.error('[SessionStore] Failed to save:', err)
    }
  }

  private filePath(sessionId: string): string {
    const safe = sessionId.replace(/[^a-zA-Z0-9-_]/g, '_')
    return resolve(this.dataDir, safe + '.json')
  }
}
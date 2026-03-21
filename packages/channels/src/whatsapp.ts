import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
import { Boom } from '@hapi/boom'
import { mkdirSync } from 'fs'

export interface WhatsAppConfig {
  authDir: string
  allowedNumbers: string[]
  onMessage: (msg: WhatsAppIncoming) => Promise<WhatsAppOutgoing>
}

export interface WhatsAppIncoming {
  userId: string
  username: string
  text: string
  jid: string
  channel: 'whatsapp'
}

export interface WhatsAppOutgoing {
  text: string
  blocked?: boolean
}

export class WhatsAppChannel {
  private config: WhatsAppConfig
  private sock: any = null

  constructor(config: WhatsAppConfig) {
    this.config = config
    mkdirSync(config.authDir, { recursive: true })
    console.log('[WhatsApp] Channel initialized')
  }

  private isAllowed(number: string): boolean {
    if (this.config.allowedNumbers.length === 0) return true
    return this.config.allowedNumbers.some(n => number.includes(n))
  }

  async start() {
    console.log('[WhatsApp] Starting...')

    const { state, saveCreds } = await useMultiFileAuthState(this.config.authDir)
    const { version } = await fetchLatestBaileysVersion()

    this.sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      logger: {
        level: 'silent',
        trace: () => {},
        debug: () => {},
        info: () => {},
        warn: () => {},
        error: (msg: any) => console.error('[WhatsApp error]', msg),
        fatal: (msg: any) => console.error('[WhatsApp fatal]', msg),
        child: () => ({
          level: 'silent',
          trace: () => {},
          debug: () => {},
          info: () => {},
          warn: () => {},
          error: () => {},
          fatal: () => {},
          child: () => ({}),
        }),
      },
    })

    this.sock.ev.on('creds.update', saveCreds)

    this.sock.ev.on('connection.update', async (update: any) => {
      const { connection, lastDisconnect, qr } = update

      if (qr) {
        console.log('[WhatsApp] QR code received - open this URL in your browser:')
        console.log('https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' + encodeURIComponent(qr))
        console.log('[WhatsApp] Then scan it: WhatsApp -> Linked Devices -> Link a Device')
      }

      if (connection === 'close') {
        const boom = lastDisconnect ? lastDisconnect.error : null
        const statusCode = boom ? boom.output ? boom.output.statusCode : 0 : 0
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut
        console.log('[WhatsApp] Connection closed. Reconnecting:', shouldReconnect)
        if (shouldReconnect) {
          setTimeout(() => this.start(), 3000)
        }
      }

      if (connection === 'open') {
        console.log('[WhatsApp] Connected! Bot is ready.')
        console.log('[WhatsApp] Send a message to your WhatsApp to start chatting.')
      }
    })

    this.sock.ev.on('messages.upsert', async (upsert: any) => {
      const { messages, type } = upsert
      if (type !== 'notify') return

      for (const msg of messages) {
        if (!msg.message) continue
        if (msg.key.fromMe) continue

        const jid = msg.key.remoteJid
        if (!jid) continue

        const isGroup = jid.endsWith('@g.us')
        if (isGroup) continue

        const msgContent = msg.message
        const extended = msgContent.extendedTextMessage
        const text = msgContent.conversation || (extended ? extended.text : '') || ''

        if (!text) continue

        const number = jid.replace('@s.whatsapp.net', '')
        const userId = 'whatsapp:' + number

        if (!this.isAllowed(number)) {
          await this.sock.sendMessage(jid, {
            text: 'You are not authorized.\nYour number: ' + number,
          })
          continue
        }

        console.log('[WhatsApp] Message from ' + number + ': ' + text)

        try {
          await this.sock.sendPresenceUpdate('composing', jid)

          const response = await this.config.onMessage({
            userId,
            username: number,
            text,
            jid,
            channel: 'whatsapp',
          })

          await this.sock.sendMessage(jid, { text: response.text })
          await this.sock.sendPresenceUpdate('paused', jid)
        } catch (err) {
          const error = err as Error
          console.error('[WhatsApp] Error:', error.message)
          await this.sock.sendMessage(jid, {
            text: 'Something went wrong. Please try again.',
          })
        }
      }
    })
  }

  async stop() {
    if (this.sock) {
      await this.sock.logout()
      console.log('[WhatsApp] Disconnected')
    }
  }
}
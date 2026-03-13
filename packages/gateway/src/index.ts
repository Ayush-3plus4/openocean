import { config } from 'dotenv'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
config({ path: resolve(__dirname, '../../../.env') })

import { createGateway } from './gateway.ts'
import { Orchestrator } from './orchestrator.ts'
import { TelegramChannel } from '../../channels/src/telegram.ts'
import { randomUUID } from 'crypto'

const model = process.env.OPENOCEAN_MODEL ?? 'mock'
const apiKey = process.env.OPENOCEAN_API_KEY ?? 'mock'
const telegramToken = process.env.TELEGRAM_BOT_TOKEN ?? ''
const telegramAllowedUsers = (process.env.TELEGRAM_ALLOWED_USERS ?? '')
  .split(',')
  .map(s => parseInt(s.trim()))
  .filter(n => !isNaN(n))

console.log('[OpenOcean] Starting with model: ' + model)

const orchestrator = new Orchestrator({
  allowedUsers: ['test-user-1', ...telegramAllowedUsers.map(id => 'telegram:' + id)],
  maxTokensPerSession: 50000,
  maxTokensPerDay: 200000,
  maxUsdPerDay: 2.00,
  model,
  apiKey,
  systemPrompt: 'You are OpenOcean, a helpful personal AI assistant. You are clean, secure, and private. Keep responses concise and helpful.',
})

const gateway = createGateway({
  port: 18790,
  host: '127.0.0.1',
  orchestrator,
})

gateway.start()

// Start Telegram if token is configured
if (telegramToken) {
  const telegram = new TelegramChannel({
    token: telegramToken,
    allowedUsers: telegramAllowedUsers,
    onMessage: async (msg) => {
      // Special commands
      if (msg.text === '/reset') {
        orchestrator.resetSession('telegram:' + msg.userId)
        return { text: 'Conversation reset!' }
      }

      if (msg.text === '/spend') {
        const summary = orchestrator.spendSummary()
        return {
          text: 'Spend summary for today (' + summary.date + '):\n' +
            'Tokens used: ' + summary.dailyTokens + '\n' +
            'Cost: $' + summary.dailyUsd.toFixed(6)
        }
      }

      if (msg.text === '/model') {
        return { text: 'Current model: ' + model }
      }

      // Regular message — send through full pipeline
      const sessionId = 'telegram-' + msg.userId
      const response = await orchestrator.handle({
        userId: msg.userId,
        sessionId,
        text: msg.text,
        channel: 'telegram',
      })

      return { text: response.text, blocked: response.blocked }
    },
  })

  telegram.start()
} else {
  console.log('[Telegram] No token found in .env — skipping Telegram channel')
}

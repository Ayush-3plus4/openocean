import { config } from 'dotenv'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
config({ path: resolve(__dirname, '../../../.env') })

import { createGateway } from './gateway.ts'
import { Orchestrator } from './orchestrator.ts'
import { TelegramChannel } from '../../channels/src/telegram.ts'
import { DiscordChannel } from '../../channels/src/discord.ts'

const model = process.env.OPENOCEAN_MODEL ?? 'mock'
const apiKey = process.env.OPENOCEAN_API_KEY ?? 'mock'
const telegramToken = process.env.TELEGRAM_BOT_TOKEN ?? ''
const discordToken = process.env.DISCORD_BOT_TOKEN ?? ''

const telegramAllowedUsers = (process.env.TELEGRAM_ALLOWED_USERS ?? '')
  .split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n))

const discordAllowedUsers = (process.env.DISCORD_ALLOWED_USERS ?? '')
  .split(',').map(s => s.trim()).filter(Boolean)

console.log('[OpenOcean] Starting with model: ' + model)

const orchestrator = new Orchestrator({
  allowedUsers: [
    'test-user-1',
    ...telegramAllowedUsers.map(id => 'telegram:' + id),
    ...discordAllowedUsers.map(id => 'discord:' + id),
  ],
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

// Start Telegram if configured
if (telegramToken) {
  const telegram = new TelegramChannel({
    token: telegramToken,
    allowedUsers: telegramAllowedUsers,
    onMessage: async (msg) => {
      if (msg.text === '/reset') {
        orchestrator.resetSession('telegram-' + msg.userId)
        return { text: 'Conversation reset!' }
      }
      if (msg.text === '/spend') {
        const summary = orchestrator.spendSummary()
        return {
          text: 'Spend today (' + summary.date + '):\nTokens: ' + summary.dailyTokens + '\nCost: $' + summary.dailyUsd.toFixed(6)
        }
      }
      if (msg.text === '/model') {
        return { text: 'Current model: ' + model }
      }
      const response = await orchestrator.handle({
        userId: msg.userId,
        sessionId: 'telegram-' + msg.userId,
        text: msg.text,
        channel: 'telegram',
      })
      return { text: response.text, blocked: response.blocked }
    },
  })
  telegram.start()
} else {
  console.log('[Telegram] No token found — skipping')
}

// Start Discord if configured
if (discordToken) {
  const discord = new DiscordChannel({
    token: discordToken,
    allowedUsers: discordAllowedUsers,
    onMessage: async (msg) => {
      if (msg.text === '/reset') {
        orchestrator.resetSession('discord-' + msg.userId)
        return { text: 'Conversation reset!' }
      }
      if (msg.text === '/spend') {
        const summary = orchestrator.spendSummary()
        return {
          text: 'Spend today (' + summary.date + '):\nTokens: ' + summary.dailyTokens + '\nCost: $' + summary.dailyUsd.toFixed(6)
        }
      }
      if (msg.text === '/model') {
        return { text: 'Current model: ' + model }
      }
      const response = await orchestrator.handle({
        userId: msg.userId,
        sessionId: 'discord-' + msg.userId,
        text: msg.text,
        channel: 'discord',
      })
      return { text: response.text, blocked: response.blocked }
    },
  })
  discord.start()
} else {
  console.log('[Discord] No token found — skipping')
}

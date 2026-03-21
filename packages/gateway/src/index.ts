import { config } from 'dotenv'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
config({ path: resolve(process.cwd(), '.env') })
console.log('[OpenOcean] Env loaded - MODEL:', process.env.OPENOCEAN_MODEL, 'KEY:', process.env.NVIDIA_API_KEY ? 'found' : 'missing')

import { createGateway } from './gateway.ts'
import { Orchestrator } from './orchestrator.ts'
import { TelegramChannel } from '../../channels/src/telegram.ts'
import { DiscordChannel } from '../../channels/src/discord.ts'
import { WhatsAppChannel } from '../../channels/src/whatsapp.ts'

const model = process.env.OPENOCEAN_MODEL ?? 'mock'
const apiKey =
  process.env.NVIDIA_API_KEY ??
  process.env.DEEPSEEK_API_KEY ??
  process.env.GEMINI_API_KEY ??
  process.env.OPENOCEAN_API_KEY ??
  'mock'
const telegramToken = process.env.TELEGRAM_BOT_TOKEN ?? ''
const discordToken = process.env.DISCORD_BOT_TOKEN ?? ''

const telegramAllowedUsers = (process.env.TELEGRAM_ALLOWED_USERS ?? '')
  .split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n))

const discordAllowedUsers = (process.env.DISCORD_ALLOWED_USERS ?? '')
  .split(',').map(s => s.trim()).filter(Boolean)

const whatsappAllowedNumbers = (process.env.WHATSAPP_ALLOWED_NUMBERS ?? '')
  .split(',').map(s => s.trim()).filter(Boolean)

console.log('[OpenOcean] API key starts with: ' + apiKey.slice(0, 10))

const orchestrator = new Orchestrator({
  allowedUsers: [
    'test-user-1',
    ...telegramAllowedUsers.map(id => 'telegram:' + id),
    ...discordAllowedUsers.map(id => 'discord:' + id),
    ...whatsappAllowedNumbers.map(n => 'whatsapp:' + n),
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

// Telegram
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
      if (msg.text === '/report') {
        return { text: orchestrator.spendReport() }
      }
      if (msg.text === '/week') {
        return { text: orchestrator.weeklyReport() }
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

// Discord
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
      if (msg.text === '/report') {
        return { text: orchestrator.spendReport() }
      }
      if (msg.text === '/week') {
        return { text: orchestrator.weeklyReport() }
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
if (process.env.WHATSAPP_ENABLED === 'true') {
  const whatsapp = new WhatsAppChannel({
    authDir: resolve(__dirname, '../../../.openocean/whatsapp-auth'),
    allowedNumbers: whatsappAllowedNumbers,
    onMessage: async (msg) => {
      if (msg.text === '/reset') {
        orchestrator.resetSession('whatsapp-' + msg.userId)
        return { text: 'Conversation reset!' }
      }
      if (msg.text === '/spend') {
        const summary = orchestrator.spendSummary()
        return {
          text: 'Spend today (' + summary.date + '):\nTokens: ' + summary.dailyTokens + '\nCost: $' + summary.dailyUsd.toFixed(6)
        }
      }
      if (msg.text === '/report') {
        return { text: orchestrator.spendReport() }
      }
      if (msg.text === '/model') {
        return { text: 'Current model: ' + model }
      }
      const response = await orchestrator.handle({
        userId: msg.userId,
        sessionId: 'whatsapp-' + msg.userId,
        text: msg.text,
        channel: 'whatsapp',
      })
      return { text: response.text, blocked: response.blocked }
    },
  })
  whatsapp.start()
} else {
  console.log('[WhatsApp] Set WHATSAPP_ENABLED=true in .env to enable')
}
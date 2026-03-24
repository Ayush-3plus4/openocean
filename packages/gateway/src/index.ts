import 'dotenv/config'
import { config } from 'dotenv'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
config({ path: 'C:/Users/dasay/openocean/.env' })

import { createGateway } from './gateway.ts'
import { Orchestrator } from './orchestrator.ts'
import { TelegramChannel } from '../../channels/src/telegram.ts'
import { DiscordChannel } from '../../channels/src/discord.ts'
import { WhatsAppChannel } from '../../channels/src/whatsapp.ts'
import { SlackChannel } from '../../channels/src/slack.ts'

const model = process.env.OPENOCEAN_MODEL ?? 'mock'
const apiKey =
  process.env.NVIDIA_API_KEY ??
  process.env.DEEPSEEK_API_KEY ??
  process.env.GEMINI_API_KEY ??
  process.env.OPENOCEAN_API_KEY ??
  'mock'

const telegramAllowedUsers = (process.env.TELEGRAM_ALLOWED_USERS ?? '')
  .split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n))

const discordAllowedUsers = (process.env.DISCORD_ALLOWED_USERS ?? '')
  .split(',').map(s => s.trim()).filter(Boolean)

const whatsappAllowedNumbers = (process.env.WHATSAPP_ALLOWED_NUMBERS ?? '')
  .split(',').map(s => s.trim()).filter(Boolean)

const slackAllowedUsers = (process.env.SLACK_ALLOWED_USERS ?? '')
  .split(',').map(s => s.trim()).filter(Boolean)

console.log('[OpenOcean] Starting with model: ' + model)
console.log('[OpenOcean] API key starts with: ' + apiKey.slice(0, 10))

const orchestrator = new Orchestrator({
  allowedUsers: [
    'test-user-1',
    ...telegramAllowedUsers.map(id => 'telegram:' + id),
    ...discordAllowedUsers.map(id => 'discord:' + id),
    ...whatsappAllowedNumbers.map(n => 'whatsapp:' + n),
    ...slackAllowedUsers.map(id => 'slack:' + id),
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
if (process.env.TELEGRAM_BOT_TOKEN) {
  const telegram = new TelegramChannel({
    token: process.env.TELEGRAM_BOT_TOKEN,
    allowedUsers: telegramAllowedUsers,
    onMessage: async (msg) => {
      if (msg.text === '/reset') {
        orchestrator.resetSession('telegram-' + msg.userId)
        return { text: 'Conversation reset!' }
      }
      if (msg.text === '/spend') {
        const summary = orchestrator.spendSummary()
        return { text: 'Spend today (' + summary.date + '):\nTokens: ' + summary.dailyTokens + '\nCost: $' + summary.dailyUsd.toFixed(6) }
      }
      if (msg.text === '/report') {
        return { text: orchestrator.spendReport() }
      }
      if (msg.text === '/week') {
        return { text: orchestrator.weeklyReport() }
      }
      if (msg.text === '/history') {
        return { text: orchestrator.sessionHistory('telegram-' + msg.userId) }
      }
      if (msg.text === '/sessions') {
        return { text: orchestrator.listSessions() }
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
if (process.env.DISCORD_BOT_TOKEN) {
  const discord = new DiscordChannel({
    token: process.env.DISCORD_BOT_TOKEN,
    allowedUsers: discordAllowedUsers,
    onMessage: async (msg) => {
      if (msg.text === '/reset') {
        orchestrator.resetSession('discord-' + msg.userId)
        return { text: 'Conversation reset!' }
      }
      if (msg.text === '/spend') {
        const summary = orchestrator.spendSummary()
        return { text: 'Spend today (' + summary.date + '):\nTokens: ' + summary.dailyTokens + '\nCost: $' + summary.dailyUsd.toFixed(6) }
      }
      if (msg.text === '/report') {
        return { text: orchestrator.spendReport() }
      }
      if (msg.text === '/week') {
        return { text: orchestrator.weeklyReport() }
      }
      if (msg.text === '/history') {
        return { text: orchestrator.sessionHistory('discord-' + msg.userId) }
      }
      if (msg.text === '/sessions') {
        return { text: orchestrator.listSessions() }
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

// WhatsApp
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
        return { text: 'Spend today (' + summary.date + '):\nTokens: ' + summary.dailyTokens + '\nCost: $' + summary.dailyUsd.toFixed(6) }
      }
      if (msg.text === '/report') {
        return { text: orchestrator.spendReport() }
      }
      if (msg.text === '/history') {
        return { text: orchestrator.sessionHistory('whatsapp-' + msg.userId) }
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

// Slack
if (process.env.SLACK_BOT_TOKEN && process.env.SLACK_APP_TOKEN) {
  const slack = new SlackChannel({
    botToken: process.env.SLACK_BOT_TOKEN,
    appToken: process.env.SLACK_APP_TOKEN,
    allowedUsers: slackAllowedUsers,
    onMessage: async (msg) => {
      if (msg.text === '/reset') {
        orchestrator.resetSession('slack-' + msg.userId)
        return { text: 'Conversation reset!' }
      }
      if (msg.text === '/spend') {
        const summary = orchestrator.spendSummary()
        return { text: 'Spend today (' + summary.date + '):\nTokens: ' + summary.dailyTokens + '\nCost: $' + summary.dailyUsd.toFixed(6) }
      }
      if (msg.text === '/report') {
        return { text: orchestrator.spendReport() }
      }
      if (msg.text === '/history') {
        return { text: orchestrator.sessionHistory('slack-' + msg.userId) }
      }
      if (msg.text === '/model') {
        return { text: 'Current model: ' + model }
      }
      const response = await orchestrator.handle({
        userId: msg.userId,
        sessionId: 'slack-' + msg.userId,
        text: msg.text,
        channel: 'slack',
      })
      return { text: response.text, blocked: response.blocked }
    },
  })
  slack.start()
} else {
  console.log('[Slack] No tokens found — skipping')
}
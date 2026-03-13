// ============================================
// OpenOcean — Telegram Channel
// Uses grammY (the best Telegram bot library)
// Connects your Telegram bot to the Gateway
// ============================================

import { Bot, Context } from 'grammy'

export interface TelegramConfig {
  token: string
  allowedUsers: number[]   // Telegram user IDs that can use the bot
  onMessage: (msg: TelegramIncoming) => Promise<TelegramOutgoing>
}

export interface TelegramIncoming {
  userId: string
  username: string
  text: string
  chatId: number
  channel: 'telegram'
}

export interface TelegramOutgoing {
  text: string
  blocked?: boolean
}

export class TelegramChannel {
  private bot: Bot
  private config: TelegramConfig

  constructor(config: TelegramConfig) {
    this.config = config
    this.bot = new Bot(config.token)
    this.setupHandlers()
    console.log('[Telegram] Channel initialized')
  }

  private setupHandlers() {
    // Handle /start command
    this.bot.command('start', async (ctx) => {
      const userId = ctx.from?.id
      const username = ctx.from?.username ?? 'friend'

      if (!this.isAllowed(userId)) {
        await ctx.reply(
          'Hi! You are not authorized to use this assistant.\n' +
          'Contact the owner to get access.\n' +
          'Your Telegram ID is: ' + userId
        )
        return
      }

      await ctx.reply(
        'Welcome to OpenOcean, ' + username + '!\n\n' +
        'I am your personal AI assistant. I run entirely on your machine — your data never leaves.\n\n' +
        'Just send me a message to get started.\n\n' +
        'Commands:\n' +
        '/start — show this message\n' +
        '/reset — start a new conversation\n' +
        '/spend — show token usage and cost\n' +
        '/model — show current AI model'
      )
    })

    // Handle /reset command
    this.bot.command('reset', async (ctx) => {
      if (!this.isAllowed(ctx.from?.id)) return
      const response = await this.config.onMessage({
        userId: 'telegram:' + ctx.from?.id,
        username: ctx.from?.username ?? 'user',
        text: '/reset',
        chatId: ctx.chat.id,
        channel: 'telegram',
      })
      await ctx.reply('Conversation reset. Starting fresh!')
    })

    // Handle /spend command
    this.bot.command('spend', async (ctx) => {
      if (!this.isAllowed(ctx.from?.id)) return
      const response = await this.config.onMessage({
        userId: 'telegram:' + ctx.from?.id,
        username: ctx.from?.username ?? 'user',
        text: '/spend',
        chatId: ctx.chat.id,
        channel: 'telegram',
      })
      await ctx.reply(response.text)
    })

    // Handle /model command
    this.bot.command('model', async (ctx) => {
      if (!this.isAllowed(ctx.from?.id)) return
      const response = await this.config.onMessage({
        userId: 'telegram:' + ctx.from?.id,
        username: ctx.from?.username ?? 'user',
        text: '/model',
        chatId: ctx.chat.id,
        channel: 'telegram',
      })
      await ctx.reply(response.text)
    })

    // Handle all regular text messages
    this.bot.on('message:text', async (ctx) => {
      const userId = ctx.from?.id
      const username = ctx.from?.username ?? 'user'

      // Check allowlist
      if (!this.isAllowed(userId)) {
        await ctx.reply(
          'You are not authorized. Your Telegram ID is: ' + userId + '\n' +
          'Share this with the owner to get access.'
        )
        return
      }

      console.log('[Telegram] Message from @' + username + ' (' + userId + '): ' + ctx.message.text)

      // Show typing indicator while processing
      await ctx.replyWithChatAction('typing')

      try {
        const response = await this.config.onMessage({
          userId: 'telegram:' + userId,
          username,
          text: ctx.message.text,
          chatId: ctx.chat.id,
          channel: 'telegram',
        })

        await ctx.reply(response.text)
      } catch (err) {
        const error = err as Error
        console.error('[Telegram] Error handling message:', error.message)
        await ctx.reply('Something went wrong. Please try again.')
      }
    })

    // Log errors
    this.bot.catch((err) => {
      console.error('[Telegram] Bot error:', err.message)
    })
  }

  private isAllowed(userId?: number): boolean {
    if (!userId) return false
    if (this.config.allowedUsers.length === 0) return true
    return this.config.allowedUsers.includes(userId)
  }

  async start() {
    console.log('[Telegram] Starting bot...')
    await this.bot.start({
      onStart: (info) => {
        console.log('[Telegram] Bot running as @' + info.username)
        console.log('[Telegram] Send a message to your bot on Telegram!')
      },
    })
  }

  async stop() {
    await this.bot.stop()
    console.log('[Telegram] Bot stopped')
  }
}

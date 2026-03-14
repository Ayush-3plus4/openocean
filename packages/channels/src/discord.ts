// ============================================
// OpenOcean — Discord Channel
// Uses discord.js — the standard Discord library
// Connects your Discord bot to the Gateway
// ============================================

import { Client, GatewayIntentBits, Events, Message } from 'discord.js'

export interface DiscordConfig {
  token: string
  allowedUsers: string[]    // Discord user IDs
  onMessage: (msg: DiscordIncoming) => Promise<DiscordOutgoing>
}

export interface DiscordIncoming {
  userId: string
  username: string
  text: string
  channelId: string
  guildId: string | null
  channel: 'discord'
}

export interface DiscordOutgoing {
  text: string
  blocked?: boolean
}

export class DiscordChannel {
  private client: Client
  private config: DiscordConfig

  constructor(config: DiscordConfig) {
    this.config = config
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
      ],
    })
    this.setupHandlers()
    console.log('[Discord] Channel initialized')
  }

  private setupHandlers() {
    this.client.once(Events.ClientReady, (client) => {
      console.log('[Discord] Bot running as ' + client.user.tag)
      console.log('[Discord] Send a message to your bot on Discord!')
    })

    this.client.on(Events.MessageCreate, async (message: Message) => {
      // Ignore messages from bots including itself
      if (message.author.bot) return

      // Only respond to DMs or when mentioned in a server
      const isDM = !message.guildId
      const isMentioned = message.mentions.has(this.client.user!)
      if (!isDM && !isMentioned) return

      const userId = message.author.id
      const username = message.author.username

      // Check allowlist
      if (!this.isAllowed(userId)) {
        await message.reply(
          'You are not authorized to use this assistant.\n' +
          'Your Discord ID is: ' + userId + '\n' +
          'Share this with the owner to get access.'
        )
        return
      }

      // Clean up the message text — remove the bot mention if present
      let text = message.content
        .replace(/<@!?\d+>/g, '')
        .trim()

      if (!text) return

      console.log('[Discord] Message from ' + username + ' (' + userId + '): ' + text)

      // Handle commands
      if (text === '/reset') {
        await this.config.onMessage({
          userId: 'discord:' + userId,
          username,
          text: '/reset',
          channelId: message.channelId,
          guildId: message.guildId,
          channel: 'discord',
        })
        await message.reply('Conversation reset. Starting fresh!')
        return
      }

      if (text === '/spend') {
        const response = await this.config.onMessage({
          userId: 'discord:' + userId,
          username,
          text: '/spend',
          channelId: message.channelId,
          guildId: message.guildId,
          channel: 'discord',
        })
        await message.reply(response.text)
        return
      }

      if (text === '/model') {
        const response = await this.config.onMessage({
          userId: 'discord:' + userId,
          username,
          text: '/model',
          channelId: message.channelId,
          guildId: message.guildId,
          channel: 'discord',
        })
        await message.reply(response.text)
        return
      }

      if (text === '/help') {
        await message.reply(
          '**OpenOcean Commands**\n' +
          '/reset — start a new conversation\n' +
          '/spend — show token usage and cost\n' +
          '/model — show current AI model\n' +
          '/help — show this message\n\n' +
          'In a server: mention me to chat\n' +
          'In DMs: just send a message directly'
        )
        return
      }

      // Show typing indicator
      await message.channel.sendTyping()

      try {
        const response = await this.config.onMessage({
          userId: 'discord:' + userId,
          username,
          text,
          channelId: message.channelId,
          guildId: message.guildId,
          channel: 'discord',
        })

        // Discord has a 2000 char limit per message
        if (response.text.length > 1900) {
          const chunks = response.text.match(/.{1,1900}/gs) ?? [response.text]
          for (const chunk of chunks) {
            await message.reply(chunk)
          }
        } else {
          await message.reply(response.text)
        }
      } catch (err) {
        const error = err as Error
        console.error('[Discord] Error handling message:', error.message)
        await message.reply('Something went wrong. Please try again.')
      }
    })

    this.client.on(Events.Error, (err) => {
      console.error('[Discord] Client error:', err.message)
    })
  }

  private isAllowed(userId: string): boolean {
    if (this.config.allowedUsers.length === 0) return true
    return this.config.allowedUsers.includes(userId)
  }

  async start() {
    console.log('[Discord] Starting bot...')
    await this.client.login(this.config.token)
  }

  async stop() {
    await this.client.destroy()
    console.log('[Discord] Bot stopped')
  }
}

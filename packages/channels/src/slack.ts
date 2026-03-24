import { App, LogLevel } from '@slack/bolt'

export interface SlackConfig {
  botToken: string
  appToken: string
  allowedUsers: string[]
  onMessage: (msg: SlackIncoming) => Promise<SlackOutgoing>
}

export interface SlackIncoming {
  userId: string
  username: string
  text: string
  channelId: string
  channel: 'slack'
}

export interface SlackOutgoing {
  text: string
  blocked?: boolean
}

export class SlackChannel {
  private app: App
  private config: SlackConfig

  constructor(config: SlackConfig) {
    this.config = config
    this.app = new App({
      token: config.botToken,
      appToken: config.appToken,
      socketMode: true,
      logLevel: LogLevel.ERROR,
    })
    this.setupHandlers()
    console.log('[Slack] Channel initialized')
  }

  private isAllowed(userId: string): boolean {
    if (this.config.allowedUsers.includes('*')) return true
    if (this.config.allowedUsers.length === 0) return true
    return this.config.allowedUsers.includes(userId)
  }

  private setupHandlers() {
    // Handle direct messages
    this.app.message(async ({ message, say }) => {
      const msg = message as any
      if (msg.bot_id) return
      if (msg.subtype) return

      const userId = msg.user
      const text = msg.text

      if (!userId || !text) return

      if (!this.isAllowed(userId)) {
        await say('You are not authorized to use this assistant.\nYour Slack user ID: ' + userId)
        return
      }

      console.log('[Slack] Message from ' + userId + ': ' + text)

      if (text === '/reset') {
        await this.config.onMessage({
          userId: 'slack:' + userId,
          username: userId,
          text: '/reset',
          channelId: msg.channel,
          channel: 'slack',
        })
        await say('Conversation reset!')
        return
      }

      if (text === '/spend') {
        const response = await this.config.onMessage({
          userId: 'slack:' + userId,
          username: userId,
          text: '/spend',
          channelId: msg.channel,
          channel: 'slack',
        })
        await say(response.text)
        return
      }

      if (text === '/report') {
        const response = await this.config.onMessage({
          userId: 'slack:' + userId,
          username: userId,
          text: '/report',
          channelId: msg.channel,
          channel: 'slack',
        })
        await say(response.text)
        return
      }

      if (text === '/history') {
        const response = await this.config.onMessage({
          userId: 'slack:' + userId,
          username: userId,
          text: '/history',
          channelId: msg.channel,
          channel: 'slack',
        })
        await say(response.text)
        return
      }

      if (text === '/model') {
        const response = await this.config.onMessage({
          userId: 'slack:' + userId,
          username: userId,
          text: '/model',
          channelId: msg.channel,
          channel: 'slack',
        })
        await say(response.text)
        return
      }

      try {
        const response = await this.config.onMessage({
          userId: 'slack:' + userId,
          username: userId,
          text,
          channelId: msg.channel,
          channel: 'slack',
        })
        await say(response.text)
      } catch (err) {
        const error = err as Error
        console.error('[Slack] Error:', error.message)
        await say('Something went wrong. Please try again.')
      }
    })

    // Handle app mentions in channels
    this.app.event('app_mention', async ({ event, say }) => {
      const userId = event.user
      const text = event.text.replace(/<@[A-Z0-9]+>/g, '').trim()

      if (!userId || !text) return

      if (!this.isAllowed(userId)) {
        await say('You are not authorized. Your Slack user ID: ' + userId)
        return
      }

      console.log('[Slack] Mention from ' + userId + ': ' + text)

      try {
        const response = await this.config.onMessage({
          userId: 'slack:' + userId,
          username: userId,
          text,
          channelId: event.channel,
          channel: 'slack',
        })
        await say(response.text)
      } catch (err) {
        const error = err as Error
        console.error('[Slack] Error:', error.message)
        await say('Something went wrong. Please try again.')
      }
    })
  }

  async start() {
    console.log('[Slack] Starting bot...')
    await this.app.start()
    console.log('[Slack] Bot running!')
    console.log('[Slack] DM your bot or mention it in a channel to start chatting.')
  }

  async stop() {
    await this.app.stop()
    console.log('[Slack] Bot stopped')
  }
}
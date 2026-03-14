// ============================================
// OpenOcean Onboarding Wizard
// ============================================

import { select, input, confirm } from '@inquirer/prompts'
import { writeFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const ENV_PATH = resolve(process.cwd(), '.env')

interface OnboardConfig {
  model: string
  apiKey: string
  telegram?: { token: string; allowedUsers: string }
  discord?: { token: string; allowedUsers: string }
}

function printBanner() {
  console.log('')
  console.log('================================================')
  console.log('  OpenOcean - Personal AI Assistant')
  console.log('  Clean. Secure. Yours.')
  console.log('================================================')
  console.log('')
  console.log('This wizard sets up OpenOcean on your machine.')
  console.log('Your API keys stay local - they never leave your PC.')
  console.log('')
}

function printStep(n: number, total: number, title: string) {
  console.log('')
  console.log('Step ' + n + ' of ' + total + ' - ' + title)
  console.log('------------------------------------------------')
}

function writeEnv(config: OnboardConfig) {
  let env = ''
  env += 'OPENOCEAN_MODEL=' + config.model + '\n'
  env += 'OPENOCEAN_API_KEY=' + config.apiKey + '\n'
  if (config.telegram) {
    env += 'TELEGRAM_BOT_TOKEN=' + config.telegram.token + '\n'
    env += 'TELEGRAM_ALLOWED_USERS=' + config.telegram.allowedUsers + '\n'
  }
  if (config.discord) {
    env += 'DISCORD_BOT_TOKEN=' + config.discord.token + '\n'
    env += 'DISCORD_ALLOWED_USERS=' + config.discord.allowedUsers + '\n'
  }
  writeFileSync(ENV_PATH, env)
  console.log('')
  console.log('Saved to .env')
}

export async function runOnboard() {
  printBanner()

  if (existsSync(ENV_PATH)) {
    const overwrite = await confirm({
      message: 'A .env file already exists. Overwrite it?',
      default: false,
    })
    if (!overwrite) {
      console.log('Keeping existing config. Run "pnpm dev" to start.')
      return
    }
  }

  const config: OnboardConfig = { model: 'mock', apiKey: 'mock' }

  // Step 1: Provider
  printStep(1, 4, 'Choose your AI provider')

  const provider = await select({
    message: 'Which AI provider do you want to use?',
    choices: [
      { name: 'Anthropic - Claude (best quality)', value: 'anthropic' },
      { name: 'OpenAI - GPT-4o', value: 'openai' },
      { name: 'Google - Gemini 2.0 Flash (free tier)', value: 'google' },
      { name: 'DeepSeek - cheapest option', value: 'deepseek' },
      { name: 'Qwen - Alibaba', value: 'qwen' },
      { name: 'Mock - no API key needed (for testing)', value: 'mock' },
    ],
  })

  if (provider === 'mock') {
    config.model = 'mock'
    config.apiKey = 'mock'
    console.log('Using mock provider - no API key needed.')
  } else {
    const modelChoices: Record<string, { name: string; value: string }[]> = {
      anthropic: [
        { name: 'Claude Sonnet 4.6 (recommended)', value: 'claude-sonnet-4-6' },
        { name: 'Claude Opus 4.6 (most powerful)', value: 'claude-opus-4-6' },
        { name: 'Claude Haiku 4.5 (fastest)', value: 'claude-haiku-4-5' },
      ],
      openai: [
        { name: 'GPT-4o (recommended)', value: 'gpt-4o' },
        { name: 'GPT-4o Mini (cheaper)', value: 'gpt-4o-mini' },
      ],
      google: [
        { name: 'Gemini 2.0 Flash (recommended)', value: 'gemini-2-flash' },
        { name: 'Gemini 2.0 Pro', value: 'gemini-2-pro' },
      ],
      deepseek: [
        { name: 'DeepSeek Chat (recommended)', value: 'deepseek-chat' },
        { name: 'DeepSeek Reasoner', value: 'deepseek-reasoner' },
      ],
      qwen: [
        { name: 'Qwen Max (recommended)', value: 'qwen-max' },
        { name: 'Qwen Turbo (cheaper)', value: 'qwen-turbo' },
      ],
    }

    const model = await select({
      message: 'Which model?',
      choices: modelChoices[provider],
    })

    config.model = model

    const keyInstructions: Record<string, string> = {
      anthropic: 'Get your key at: https://console.anthropic.com',
      openai: 'Get your key at: https://platform.openai.com',
      google: 'Get your key at: https://aistudio.google.com/apikey',
      deepseek: 'Get your key at: https://platform.deepseek.com',
      qwen: 'Get your key at: https://dashscope.aliyuncs.com',
    }

    console.log('')
    console.log(keyInstructions[provider])
    console.log('')

    const apiKey = await input({
      message: 'Paste your API key:',
      validate: (val) => {
        if (!val || val.length < 10) return 'API key seems too short'
        if (val.includes(' ')) return 'API key should not contain spaces'
        return true
      },
    })

    config.apiKey = apiKey
  }

  // Step 2: Telegram
  printStep(2, 4, 'Telegram (optional)')
  console.log('Connect OpenOcean to Telegram to chat from your phone.')
  console.log('')

  const wantTelegram = await confirm({
    message: 'Set up Telegram?',
    default: true,
  })

  if (wantTelegram) {
    console.log('')
    console.log('1. Open Telegram and search @BotFather')
    console.log('2. Send /newbot and follow the steps')
    console.log('3. Copy the token BotFather gives you')
    console.log('')

    const telegramToken = await input({
      message: 'Paste your Telegram bot token:',
      validate: (val) => {
        if (!val || val.length < 10) return 'Token seems too short'
        return true
      },
    })

    console.log('')
    console.log('Find your Telegram ID by messaging @userinfobot')
    console.log('')

    const telegramUsers = await input({
      message: 'Your Telegram user ID:',
      validate: (val) => (!val ? 'Required' : true),
    })

    config.telegram = { token: telegramToken, allowedUsers: telegramUsers }
  }

  // Step 3: Discord
  printStep(3, 4, 'Discord (optional)')
  console.log('Connect OpenOcean to Discord to chat in your server.')
  console.log('')

  const wantDiscord = await confirm({
    message: 'Set up Discord?',
    default: false,
  })

  if (wantDiscord) {
    console.log('')
    console.log('1. Go to https://discord.com/developers/applications')
    console.log('2. Create a new application named OpenOcean')
    console.log('3. Go to Bot, Reset Token, copy it')
    console.log('4. Enable Message Content Intent')
    console.log('')

    const discordToken = await input({
      message: 'Paste your Discord bot token:',
      validate: (val) => {
        if (!val || val.length < 10) return 'Token seems too short'
        return true
      },
    })

    console.log('')
    console.log('Find your Discord ID: Settings, Advanced, Enable Developer Mode')
    console.log('Then right-click your name, Copy User ID')
    console.log('')

    const discordUsers = await input({
      message: 'Your Discord user ID:',
      validate: (val) => (!val ? 'Required' : true),
    })

    config.discord = { token: discordToken, allowedUsers: discordUsers }
  }

  // Step 4: Save
  printStep(4, 4, 'Saving your config')
  writeEnv(config)

  console.log('')
  console.log('================================================')
  console.log('  OpenOcean is ready!')
  console.log('================================================')
  console.log('')
  console.log('Start your assistant:')
  console.log('')
  console.log('  cd packages/gateway && pnpm dev')
  console.log('')
  console.log('Your config is saved in .env - never share this file.')
  console.log('')
}
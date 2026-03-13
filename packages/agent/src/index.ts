import { config } from 'dotenv'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
config({ path: resolve(__dirname, '../../../.env') })

import { createGateway } from './gateway.ts'
import { Orchestrator } from './orchestrator.ts'

const model = process.env.OPENOCEAN_MODEL ?? 'mock'
const apiKey = process.env.OPENOCEAN_API_KEY ?? 'mock'

console.log('[OpenOcean] Starting with model: ' + model)

const orchestrator = new Orchestrator({
  allowedUsers: ['test-user-1'],
  maxTokensPerSession: 50000,
  maxTokensPerDay: 200000,
  maxUsdPerDay: 2.00,
  model,
  apiKey,
  systemPrompt: 'You are OpenOcean, a helpful personal AI assistant. You are clean, secure, and private.',
})

const gateway = createGateway({
  port: 18790,
  host: '127.0.0.1',
  orchestrator,
})

gateway.start()

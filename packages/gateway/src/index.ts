import { createGateway } from './gateway.ts'
import { Orchestrator } from './orchestrator.ts'

// --- Config ---
// In the future this will come from a config file.
// For now we set it here for testing.
const orchestrator = new Orchestrator({
  // Security
  allowedUsers: ['test-user-1'],
  maxTokensPerSession: 50000,
  maxTokensPerDay: 200000,
  maxUsdPerDay: 2.00,

  // Agent — set your real API key here to test
  model: 'claude-sonnet-4-6',
  apiKey: process.env.ANTHROPIC_API_KEY ?? '',

  systemPrompt: 'You are OpenOcean, a helpful personal AI assistant. You are clean, secure, and private.',
})

const gateway = createGateway({
  port: 18790,
  host: '127.0.0.1',
  orchestrator,
})

gateway.start()

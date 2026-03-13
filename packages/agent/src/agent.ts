// ============================================
// OpenOcean Agent
// Takes a message, calls the right AI,
// respects spend limits, returns a reply.
// ============================================

import { getModel } from './models.ts'
import {
  anthropicAdapter,
  openaiAdapter,
  googleAdapter,
  deepseekAdapter,
  qwenAdapter,
} from './providers.ts'
import type { Message, CompletionRequest } from './providers.ts'

export interface AgentConfig {
  model: string        // e.g. 'claude-sonnet-4-6'
  apiKey: string
  systemPrompt?: string
  maxTokensPerReply?: number
}

export interface AgentResponse {
  content: string
  tokensUsed: number
  costUsd: number
  model: string
  provider: string
}

export class Agent {
  private config: AgentConfig
  private history: Message[] = []

  constructor(config: AgentConfig) {
    this.config = config
    // Validate the model exists immediately
    getModel(config.model)
    console.log('[Agent] Ready using model: ' + config.model)
  }

  async chat(userMessage: string): Promise<AgentResponse> {
    const modelDef = getModel(this.config.model)

    // Add user message to history
    this.history.push({ role: 'user', content: userMessage })

    const request: CompletionRequest = {
      model: modelDef,
      messages: this.history,
      systemPrompt: this.config.systemPrompt,
      maxTokens: this.config.maxTokensPerReply,
    }

    // Pick the right provider adapter
    const adapter = this.getAdapter(modelDef.provider)

    console.log('[Agent] Calling ' + modelDef.provider + ' / ' + modelDef.label + '...')

    const response = await adapter.complete(request, this.config.apiKey)

    // Add assistant reply to history so context is preserved
    this.history.push({ role: 'assistant', content: response.content })

    // Calculate cost
    const inputCost = (response.inputTokens / 1000) * modelDef.costPer1kInputTokens
    const outputCost = (response.outputTokens / 1000) * modelDef.costPer1kOutputTokens
    const costUsd = inputCost + outputCost

    console.log(
      '[Agent] Done | ' +
      response.totalTokens + ' tokens | $' + costUsd.toFixed(6)
    )

    return {
      content: response.content,
      tokensUsed: response.totalTokens,
      costUsd,
      model: response.model,
      provider: response.provider,
    }
  }

  // Reset conversation history
  reset(): void {
    this.history = []
    console.log('[Agent] Conversation reset')
  }

  // Switch to a different model mid-session
  switchModel(modelKey: string): void {
    getModel(modelKey) // validate first
    this.config.model = modelKey
    console.log('[Agent] Switched to model: ' + modelKey)
  }

  // Get current conversation history
  getHistory(): Message[] {
    return [...this.history]
  }

  private getAdapter(provider: string) {
    switch (provider) {
      case 'anthropic': return anthropicAdapter
      case 'openai':    return openaiAdapter
      case 'google':    return googleAdapter
      case 'deepseek':  return deepseekAdapter
      case 'qwen':      return qwenAdapter
      default:
        throw new Error('No adapter for provider: ' + provider)
    }
  }
}

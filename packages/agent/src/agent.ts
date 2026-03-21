import { getModel } from './models.ts'
import {
  anthropicAdapter,
  openaiAdapter,
  googleAdapter,
  deepseekAdapter,
  qwenAdapter,
  nvidiaAdapter,
  mockAdapter,
} from './providers.ts'
import type { Message, CompletionRequest } from './providers.ts'

export interface AgentConfig {
  model: string
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
    if (config.model !== 'mock') getModel(config.model)
    console.log('[Agent] Ready using model: ' + config.model)
  }

  async chat(userMessage: string): Promise<AgentResponse> {
    this.history.push({ role: 'user', content: userMessage })

    const isMock = this.config.model === 'mock'
    const modelDef = isMock ? null : getModel(this.config.model)

    const request: CompletionRequest = {
      model: modelDef ?? {
        provider: 'mock' as any,
        modelId: 'mock',
        label: 'Mock',
        costPer1kInputTokens: 0,
        costPer1kOutputTokens: 0,
        maxTokens: 1000,
      },
      messages: this.history,
      systemPrompt: this.config.systemPrompt,
      maxTokens: this.config.maxTokensPerReply,
    }

    const adapter = this.getAdapter(isMock ? 'mock' : modelDef!.provider)

    console.log('[Agent] Calling ' + (isMock ? 'mock' : modelDef!.provider) + '...')

    const response = await adapter.complete(request, this.config.apiKey)

    this.history.push({ role: 'assistant', content: response.content })

    const costUsd = modelDef
      ? (response.inputTokens / 1000) * modelDef.costPer1kInputTokens +
        (response.outputTokens / 1000) * modelDef.costPer1kOutputTokens
      : 0

    console.log('[Agent] Done | ' + response.totalTokens + ' tokens | $' + costUsd.toFixed(6))

    return {
      content: response.content,
      tokensUsed: response.totalTokens,
      costUsd,
      model: response.model,
      provider: response.provider,
    }
  }

  reset(): void {
    this.history = []
    console.log('[Agent] Conversation reset')
  }

  switchModel(modelKey: string): void {
    if (modelKey !== 'mock') getModel(modelKey)
    this.config.model = modelKey
    console.log('[Agent] Switched to model: ' + modelKey)
  }

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
      case 'mock':      return mockAdapter
      case 'nvidia':    return nvidiaAdapter
      default:
        throw new Error('No adapter for provider: ' + provider)
    }
  }
}

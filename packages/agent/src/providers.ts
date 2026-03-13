// ============================================
// OpenOcean Provider Adapters
// One uniform interface for all AI providers.
// Add a new provider here and it works everywhere.
// ============================================

import type { ModelDefinition } from './models.ts'

// Every message in a conversation
export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

// What we send to any provider
export interface CompletionRequest {
  model: ModelDefinition
  messages: Message[]
  systemPrompt?: string
  maxTokens?: number
}

// What every provider returns — uniform shape
export interface CompletionResponse {
  content: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  model: string
  provider: string
}

// Every provider must implement this interface
export interface ProviderAdapter {
  complete(request: CompletionRequest, apiKey: string): Promise<CompletionResponse>
}


// --------------------------------------------
// Anthropic (Claude)
// --------------------------------------------
export const anthropicAdapter: ProviderAdapter = {
  async complete(request, apiKey) {
    const body = {
      model: request.model.modelId,
      max_tokens: request.maxTokens ?? request.model.maxTokens,
      system: request.systemPrompt ?? 'You are a helpful personal AI assistant called OpenOcean.',
      messages: request.messages
        .filter(m => m.role !== 'system')
        .map(m => ({ role: m.role, content: m.content })),
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error('Anthropic API error ' + res.status + ': ' + err)
    }

    const data = await res.json() as {
      content: { text: string }[]
      usage: { input_tokens: number; output_tokens: number }
      model: string
    }

    return {
      content: data.content[0].text,
      inputTokens: data.usage.input_tokens,
      outputTokens: data.usage.output_tokens,
      totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      model: data.model,
      provider: 'anthropic',
    }
  }
}


// --------------------------------------------
// OpenAI (GPT, O3)
// --------------------------------------------
export const openaiAdapter: ProviderAdapter = {
  async complete(request, apiKey) {
    const messages = [
      {
        role: 'system' as const,
        content: request.systemPrompt ?? 'You are a helpful personal AI assistant called OpenOcean.',
      },
      ...request.messages.map(m => ({ role: m.role, content: m.content })),
    ]

    const body = {
      model: request.model.modelId,
      max_tokens: request.maxTokens ?? request.model.maxTokens,
      messages,
    }

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error('OpenAI API error ' + res.status + ': ' + err)
    }

    const data = await res.json() as {
      choices: { message: { content: string } }[]
      usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number }
      model: string
    }

    return {
      content: data.choices[0].message.content,
      inputTokens: data.usage.prompt_tokens,
      outputTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens,
      model: data.model,
      provider: 'openai',
    }
  }
}


// --------------------------------------------
// Google (Gemini)
// --------------------------------------------
export const googleAdapter: ProviderAdapter = {
  async complete(request, apiKey) {
    const contents = request.messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }))

    const body = {
      contents,
      systemInstruction: {
        parts: [{ text: request.systemPrompt ?? 'You are a helpful personal AI assistant called OpenOcean.' }],
      },
      generationConfig: {
        maxOutputTokens: request.maxTokens ?? request.model.maxTokens,
      },
    }

    const url = 'https://generativelanguage.googleapis.com/v1beta/models/' +
      request.model.modelId + ':generateContent?key=' + apiKey

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error('Google API error ' + res.status + ': ' + err)
    }

    const data = await res.json() as {
      candidates: { content: { parts: { text: string }[] } }[]
      usageMetadata: { promptTokenCount: number; candidatesTokenCount: number; totalTokenCount: number }
    }

    return {
      content: data.candidates[0].content.parts[0].text,
      inputTokens: data.usageMetadata.promptTokenCount,
      outputTokens: data.usageMetadata.candidatesTokenCount,
      totalTokens: data.usageMetadata.totalTokenCount,
      model: request.model.modelId,
      provider: 'google',
    }
  }
}


// --------------------------------------------
// DeepSeek (OpenAI-compatible API)
// --------------------------------------------
export const deepseekAdapter: ProviderAdapter = {
  async complete(request, apiKey) {
    const messages = [
      {
        role: 'system' as const,
        content: request.systemPrompt ?? 'You are a helpful personal AI assistant called OpenOcean.',
      },
      ...request.messages.map(m => ({ role: m.role, content: m.content })),
    ]

    const body = {
      model: request.model.modelId,
      max_tokens: request.maxTokens ?? request.model.maxTokens,
      messages,
    }

    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error('DeepSeek API error ' + res.status + ': ' + err)
    }

    const data = await res.json() as {
      choices: { message: { content: string } }[]
      usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number }
      model: string
    }

    return {
      content: data.choices[0].message.content,
      inputTokens: data.usage.prompt_tokens,
      outputTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens,
      model: data.model,
      provider: 'deepseek',
    }
  }
}


// --------------------------------------------
// Qwen (Alibaba — OpenAI-compatible API)
// --------------------------------------------
export const qwenAdapter: ProviderAdapter = {
  async complete(request, apiKey) {
    const messages = [
      {
        role: 'system' as const,
        content: request.systemPrompt ?? 'You are a helpful personal AI assistant called OpenOcean.',
      },
      ...request.messages.map(m => ({ role: m.role, content: m.content })),
    ]

    const body = {
      model: request.model.modelId,
      max_tokens: request.maxTokens ?? request.model.maxTokens,
      messages,
    }

    const res = await fetch('https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error('Qwen API error ' + res.status + ': ' + err)
    }

    const data = await res.json() as {
      choices: { message: { content: string } }[]
      usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number }
      model: string
    }

    return {
      content: data.choices[0].message.content,
      inputTokens: data.usage.prompt_tokens,
      outputTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens,
      model: data.model,
      provider: 'qwen',
    }
  }
}

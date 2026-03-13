// ============================================
// OpenOcean Model Registry
// Supports: Claude, GPT, Gemini, DeepSeek, Qwen
// Users pick one in their config — OpenOcean
// handles the rest uniformly.
// ============================================

export type ModelProvider =
  | 'anthropic'
  | 'openai'
  | 'google'
  | 'deepseek'
  | 'qwen'

export interface ModelDefinition {
  provider: ModelProvider
  modelId: string        // The exact model string the API expects
  label: string          // Human readable name
  costPer1kInputTokens: number
  costPer1kOutputTokens: number
  maxTokens: number
}

// All supported models — add more here as they release
export const MODELS: Record<string, ModelDefinition> = {

  // --- Anthropic / Claude ---
  'claude-sonnet-4-6': {
    provider: 'anthropic',
    modelId: 'claude-sonnet-4-6',
    label: 'Claude Sonnet 4.6',
    costPer1kInputTokens: 0.003,
    costPer1kOutputTokens: 0.015,
    maxTokens: 8096,
  },
  'claude-opus-4-6': {
    provider: 'anthropic',
    modelId: 'claude-opus-4-6',
    label: 'Claude Opus 4.6',
    costPer1kInputTokens: 0.015,
    costPer1kOutputTokens: 0.075,
    maxTokens: 8096,
  },
  'claude-haiku-4-5': {
    provider: 'anthropic',
    modelId: 'claude-haiku-4-5-20251001',
    label: 'Claude Haiku 4.5',
    costPer1kInputTokens: 0.00025,
    costPer1kOutputTokens: 0.00125,
    maxTokens: 8096,
  },

  // --- OpenAI / GPT ---
  'gpt-4o': {
    provider: 'openai',
    modelId: 'gpt-4o',
    label: 'GPT-4o',
    costPer1kInputTokens: 0.005,
    costPer1kOutputTokens: 0.015,
    maxTokens: 4096,
  },
  'gpt-4o-mini': {
    provider: 'openai',
    modelId: 'gpt-4o-mini',
    label: 'GPT-4o Mini',
    costPer1kInputTokens: 0.00015,
    costPer1kOutputTokens: 0.0006,
    maxTokens: 4096,
  },
  'o3-mini': {
    provider: 'openai',
    modelId: 'o3-mini',
    label: 'O3 Mini',
    costPer1kInputTokens: 0.0011,
    costPer1kOutputTokens: 0.0044,
    maxTokens: 4096,
  },

  // --- Google / Gemini ---
  'gemini-2-flash': {
    provider: 'google',
    modelId: 'gemini-2.0-flash',
    label: 'Gemini 2.0 Flash',
    costPer1kInputTokens: 0.0001,
    costPer1kOutputTokens: 0.0004,
    maxTokens: 8192,
  },
  'gemini-2-pro': {
    provider: 'google',
    modelId: 'gemini-2.0-pro',
    label: 'Gemini 2.0 Pro',
    costPer1kInputTokens: 0.00125,
    costPer1kOutputTokens: 0.005,
    maxTokens: 8192,
  },

  // --- DeepSeek ---
  'deepseek-chat': {
    provider: 'deepseek',
    modelId: 'deepseek-chat',
    label: 'DeepSeek Chat',
    costPer1kInputTokens: 0.00027,
    costPer1kOutputTokens: 0.0011,
    maxTokens: 4096,
  },
  'deepseek-reasoner': {
    provider: 'deepseek',
    modelId: 'deepseek-reasoner',
    label: 'DeepSeek Reasoner',
    costPer1kInputTokens: 0.00055,
    costPer1kOutputTokens: 0.00219,
    maxTokens: 8000,
  },

  // --- Qwen (Alibaba) ---
  'qwen-max': {
    provider: 'qwen',
    modelId: 'qwen-max',
    label: 'Qwen Max',
    costPer1kInputTokens: 0.0016,
    costPer1kOutputTokens: 0.0064,
    maxTokens: 8192,
  },
  'qwen-turbo': {
    provider: 'qwen',
    modelId: 'qwen-turbo',
    label: 'Qwen Turbo',
    costPer1kInputTokens: 0.00005,
    costPer1kOutputTokens: 0.0002,
    maxTokens: 8192,
  },
}

// Get a model definition — throws clear error if unknown
export function getModel(modelKey: string): ModelDefinition {
  const model = MODELS[modelKey]
  if (!model) {
    const available = Object.keys(MODELS).join(', ')
    throw new Error(
      'Unknown model: "' + modelKey + '". Available models: ' + available
    )
  }
  return model
}

// List all models for a specific provider
export function getModelsByProvider(provider: ModelProvider): ModelDefinition[] {
  return Object.values(MODELS).filter(m => m.provider === provider)
}

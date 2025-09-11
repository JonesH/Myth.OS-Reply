// AI Provider Factory - Switches between OpenRouter and EdgeCloud
import { openrouter } from '@openrouter/ai-sdk-provider'
import { createEdgeCloudProvider } from './edgecloud-provider'

export type AIProviderType = 'openrouter' | 'edgecloud'

export interface AIProviderConfig {
  type: AIProviderType
  config: {
    apiKey: string
  }
}

export function createAIProvider(): AIProviderConfig {
  const useOpenRouter = process.env.USE_OPENROUTER === 'true'
  
  if (useOpenRouter) {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY is required when USE_OPENROUTER=true')
    }
    return {
      type: 'openrouter', 
      config: { apiKey: process.env.OPENROUTER_API_KEY }
    }
  } else {
    // Default to EdgeCloud
    if (!process.env.EDGECLOUD_API_KEY) {
      console.warn('EDGECLOUD_API_KEY not found, using default EdgeCloud configuration')
    }
    return {
      type: 'edgecloud',
      config: { apiKey: process.env.EDGECLOUD_API_KEY || 'default' }
    }
  }
}

export function getAIModel(modelId: string) {
  const providerConfig = createAIProvider()
  
  if (providerConfig.type === 'edgecloud') {
    const edgecloud = createEdgeCloudProvider(providerConfig.config)
    return edgecloud(modelId)
  } else {
    // OpenRouter provider - API key is set globally via environment
    return openrouter(modelId)
  }
}

// Convenience function for common free models
export const FREE_MODELS = {
  openrouter: {
    qwen: 'qwen/qwen-2-7b-instruct:free',
    gemma: 'google/gemma-2-9b-it:free',
    phi: 'microsoft/phi-3-mini-128k-instruct:free'
  },
  edgecloud: {
    llama3: 'llama_3_1_70b',
    deepseek: 'deepseek_r1'
  }
} as const
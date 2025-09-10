// Test AIService abstraction with provider switching
import { describe, test, expect, jest } from '@jest/globals'
import { AIService } from '@/lib/services/ai'

// Mock the AI provider factory
jest.mock('@/lib/ai-provider-factory', () => ({
  createAIProvider: jest.fn().mockReturnValue({
    type: 'openrouter',
    config: { apiKey: 'test-api-key' }
  }),
  getAIModel: jest.fn().mockReturnValue({
    specificationVersion: 'v2',
    provider: 'openrouter',
    modelId: 'test-model'
  }),
  FREE_MODELS: {
    openrouter: {
      qwen: 'qwen/qwen-2-7b-instruct:free',
      gemma: 'google/gemma-2-9b-it:free',
      phi: 'microsoft/phi-3-mini-128k-instruct:free'
    },
    edgecloud: {
      llama3: 'llama_3_1_70b',
      deepseek: 'deepseek_r1'
    }
  }
}))

// Mock the OpenRouter service
jest.mock('@/lib/services/openrouter', () => ({
  OpenRouterService: class MockOpenRouterService {
    generateReply = jest.fn().mockResolvedValue('Test reply')
    
    static getAvailableModels = jest.fn().mockReturnValue([
      {
        id: 'qwen/qwen-2-7b-instruct:free',
        name: 'Qwen 2 7B',
        description: 'Test model',
        pricing: { prompt: 0, completion: 0 }
      }
    ])
  }
}))

// Mock the AI SDK
jest.mock('ai', () => ({
  generateText: jest.fn().mockResolvedValue({ text: 'Test completion' })
}))

describe('AIService', () => {
  test('creates AIService instance', () => {
    const aiService = new AIService()
    expect(aiService).toBeDefined()
    expect(aiService.getProviderType()).toBeDefined()
  })

  test('returns available models', () => {
    const aiService = new AIService()
    const models = aiService.getAvailableModels()
    
    expect(models).toBeDefined()
    expect(Array.isArray(models)).toBe(true)
    expect(models.length).toBeGreaterThan(0)
    
    // Each model should have required properties
    models.forEach(model => {
      expect(model.id).toBeDefined()
      expect(model.name).toBeDefined()
      expect(model.description).toBeDefined()
    })
  })

  test('gets default model', () => {
    const aiService = new AIService()
    const defaultModel = aiService.getDefaultModel()
    
    expect(defaultModel).toBeDefined()
    expect(typeof defaultModel).toBe('string')
    expect(defaultModel.length).toBeGreaterThan(0)
  })

  test('generateReply with valid options', async () => {
    const aiService = new AIService()
    
    // Skip if no API keys (for local testing)
    const hasEdgeCloudKey = process.env.EDGECLOUD_API_KEY
    const hasOpenRouterKey = process.env.OPENROUTER_API_KEY
    
    if (!hasEdgeCloudKey && !hasOpenRouterKey) {
      console.log('Skipping AI integration test - no API keys')
      return
    }

    const result = await aiService.generateReply({
      originalTweet: 'Just had an amazing day!',
      tone: 'casual',
      maxLength: 100,
      includeEmojis: false,
      includeHashtags: false
    })
    
    expect(result).toBeDefined()
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
    expect(result.length).toBeLessThanOrEqual(100)
  }, 15000) // 15s timeout for API call

  test('generateCompletion with prompt', async () => {
    const aiService = new AIService()
    
    // Skip if no API keys (for local testing)
    const hasEdgeCloudKey = process.env.EDGECLOUD_API_KEY
    const hasOpenRouterKey = process.env.OPENROUTER_API_KEY
    
    if (!hasEdgeCloudKey && !hasOpenRouterKey) {
      console.log('Skipping AI completion test - no API keys')
      return
    }

    const result = await aiService.generateCompletion({
      prompt: 'Complete this sentence: "The weather today is"',
      maxTokens: 50,
      temperature: 0.7
    })
    
    expect(result).toBeDefined()
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  }, 15000) // 15s timeout for API call

  test('testModelConnection returns boolean', async () => {
    const aiService = new AIService()
    
    // This should always return a boolean, even if connection fails
    const result = await aiService.testModelConnection()
    expect(typeof result).toBe('boolean')
  }, 15000)

  test('provider switching works', () => {
    // Test that AIService respects environment variable
    const aiService = new AIService()
    const providerType = aiService.getProviderType()
    
    // Should be either 'edgecloud' or 'openrouter'
    expect(['edgecloud', 'openrouter']).toContain(providerType)
    
    // If USE_EDGECLOUD is true, should be edgecloud
    if (process.env.USE_EDGECLOUD === 'true') {
      expect(providerType).toBe('edgecloud')
    } else {
      expect(providerType).toBe('openrouter')
    }
  })
})
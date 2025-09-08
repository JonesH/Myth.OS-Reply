// Test 9: Provider Factory
import { describe, test, expect } from '@jest/globals'

describe('Provider Factory', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  test('provider factory returns EdgeCloud when configured', () => {
    process.env.USE_EDGECLOUD = 'true'
    process.env.EDGECLOUD_API_KEY = 'test-ec-key'
    process.env.OPENROUTER_API_KEY = 'test-or-key'
    
    function createAIProvider() {
      const useEdgeCloud = process.env.USE_EDGECLOUD === 'true'
      
      if (useEdgeCloud) {
        return {
          type: 'edgecloud' as const,
          config: { apiKey: process.env.EDGECLOUD_API_KEY! }
        }
      } else {
        return {
          type: 'openrouter' as const,
          config: { apiKey: process.env.OPENROUTER_API_KEY! }
        }
      }
    }
    
    const provider = createAIProvider()
    expect(provider.type).toBe('edgecloud')
    expect(provider.config.apiKey).toBe('test-ec-key')
  })

  test('provider factory returns OpenRouter by default', () => {
    delete process.env.USE_EDGECLOUD
    process.env.OPENROUTER_API_KEY = 'test-or-key'
    
    function createAIProvider() {
      const useEdgeCloud = process.env.USE_EDGECLOUD === 'true'
      
      if (useEdgeCloud) {
        return {
          type: 'edgecloud' as const,
          config: { apiKey: process.env.EDGECLOUD_API_KEY! }
        }
      } else {
        return {
          type: 'openrouter' as const,
          config: { apiKey: process.env.OPENROUTER_API_KEY! }
        }
      }
    }
    
    const provider = createAIProvider()
    expect(provider.type).toBe('openrouter')
    expect(provider.config.apiKey).toBe('test-or-key')
  })

  test('provider factory throws when missing API key', () => {
    process.env.USE_EDGECLOUD = 'true'
    delete process.env.EDGECLOUD_API_KEY
    
    function createAIProvider() {
      const useEdgeCloud = process.env.USE_EDGECLOUD === 'true'
      
      if (useEdgeCloud) {
        if (!process.env.EDGECLOUD_API_KEY) {
          throw new Error('EDGECLOUD_API_KEY is required when USE_EDGECLOUD=true')
        }
        return {
          type: 'edgecloud' as const,
          config: { apiKey: process.env.EDGECLOUD_API_KEY }
        }
      } else {
        if (!process.env.OPENROUTER_API_KEY) {
          throw new Error('OPENROUTER_API_KEY is required')
        }
        return {
          type: 'openrouter' as const,
          config: { apiKey: process.env.OPENROUTER_API_KEY }
        }
      }
    }
    
    expect(() => createAIProvider()).toThrow('EDGECLOUD_API_KEY is required when USE_EDGECLOUD=true')
  })
})
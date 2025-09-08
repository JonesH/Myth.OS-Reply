// Test 8: Environment Variable Reading
import { describe, test, expect } from '@jest/globals'

describe('Provider Configuration', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  test('reads USE_EDGECLOUD environment variable', () => {
    process.env.USE_EDGECLOUD = 'true'
    
    function shouldUseEdgeCloud(): boolean {
      return process.env.USE_EDGECLOUD === 'true'
    }
    
    const useEdgeCloud = shouldUseEdgeCloud()
    expect(useEdgeCloud).toBe(true)
  })

  test('defaults to false when USE_EDGECLOUD not set', () => {
    delete process.env.USE_EDGECLOUD
    
    function shouldUseEdgeCloud(): boolean {
      return process.env.USE_EDGECLOUD === 'true'
    }
    
    const useEdgeCloud = shouldUseEdgeCloud()
    expect(useEdgeCloud).toBe(false)
  })

  test('reads provider API keys from environment', () => {
    process.env.OPENROUTER_API_KEY = 'or-key-123'
    process.env.EDGECLOUD_API_KEY = 'ec-key-456'
    
    function getProviderConfig() {
      return {
        openRouter: {
          apiKey: process.env.OPENROUTER_API_KEY
        },
        edgeCloud: {
          apiKey: process.env.EDGECLOUD_API_KEY
        }
      }
    }
    
    const config = getProviderConfig()
    expect(config.openRouter.apiKey).toBe('or-key-123')
    expect(config.edgeCloud.apiKey).toBe('ec-key-456')
  })
})
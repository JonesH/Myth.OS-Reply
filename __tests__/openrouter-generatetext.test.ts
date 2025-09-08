// Test 2: OpenRouter generateText Integration
import { describe, test, expect } from '@jest/globals'

describe('OpenRouter generateText', () => {
  test('generateText with OpenRouter free model', async () => {
    const { generateText } = require('ai')
    const { openrouter } = require('@openrouter/ai-sdk-provider')
    
    // Skip if no API key (for local testing without secrets)
    if (!process.env.OPENROUTER_API_KEY) {
      console.log('Skipping OpenRouter test - no API key')
      return
    }
    
    const result = await generateText({
      model: openrouter('qwen/qwen-2-7b-instruct:free'),
      prompt: 'Say "test successful"',
    })
    
    expect(result).toBeDefined()
    expect(result.text).toBeDefined()
    expect(result.text.length).toBeGreaterThan(0)
    expect(result.text.toLowerCase()).toContain('test')
  }, 15000) // 15s timeout for API call
})
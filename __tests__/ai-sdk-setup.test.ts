// Test 1: AI SDK Installation Verification with Free Models
import { describe, test, expect } from '@jest/globals'

describe('AI SDK Setup', () => {
  test('can import AI SDK modules', () => {
    expect(() => require('ai')).not.toThrow()
    expect(() => require('@openrouter/ai-sdk-provider')).not.toThrow()
  })

  test('can create OpenRouter provider instance with free model', () => {
    const { openrouter } = require('@openrouter/ai-sdk-provider')
    // Using free Qwen model (as per existing MythosReply setup)
    const provider = openrouter('qwen/qwen-2-7b-instruct:free')
    expect(provider).toBeDefined()
    expect(typeof provider).toBe('object')
    expect(provider.modelId).toBe('qwen/qwen-2-7b-instruct:free')
  })
})
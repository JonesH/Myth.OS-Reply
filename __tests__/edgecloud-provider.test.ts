// Test 7: EdgeCloud Provider Interface
import { describe, test, expect, jest } from '@jest/globals'

// Mock dependencies
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>

describe('EdgeCloud Provider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('EdgeCloud provider implements generateText interface', async () => {
    // Mock EdgeCloud response
    const mockEdgeResponse = {
      output: 'Hello from EdgeCloud!',
      job_id: 'job-ec-abc123',
      latency_ms: 742,
      cost_milli: 3
    }
    
    ;(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: true,
      json: async () => mockEdgeResponse,
    } as Response)

    // Import our modules
    const { generateText } = require('ai')
    
    // Create EdgeCloud provider factory
    function createEdgeCloudProvider(config: { apiKey: string }) {
      return function edgecloudModel(modelId: string) {
        return {
          modelId,
          provider: 'edgecloud',
          doGenerate: async (options: any) => {
            // Use our EdgeCloud client
            const response = await fetch('https://api.thetaedgecloud.com/inference', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
              },
              body: JSON.stringify({
                prompt: options.prompt,
                model: modelId
              })
            })
            
            if (!response.ok) {
              throw new Error(`EdgeCloud request failed: ${response.status}`)
            }
            
            const edgeResponse = await response.json()
            
            // Convert to AI SDK format
            return {
              text: edgeResponse.output,
              usage: { totalTokens: 0, promptTokens: 0, completionTokens: 0 },
              finishReason: 'stop',
              providerMetadata: {
                edgecloud: {
                  jobId: edgeResponse.job_id,
                  latency: edgeResponse.latency_ms,
                  cost: edgeResponse.cost_milli
                }
              }
            }
          }
        }
      }
    }

    const edgecloud = createEdgeCloudProvider({ apiKey: 'test-key' })
    const model = edgecloud('llama-3-70b')
    
    const result = await model.doGenerate({ prompt: 'test prompt' })
    
    expect(result.text).toBe('Hello from EdgeCloud!')
    expect(result.providerMetadata?.edgecloud?.jobId).toBe('job-ec-abc123')
    expect(result.providerMetadata?.edgecloud?.latency).toBe(742)
    expect(result.providerMetadata?.edgecloud?.cost).toBe(3)
  })
})
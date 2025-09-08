// Test 6: EdgeCloud Response Parsing
import { describe, test, expect } from '@jest/globals'

describe('EdgeCloud Response Parser', () => {
  test('parses EdgeCloud response to AI SDK format', () => {
    const edgeResponse = { 
      output: 'AI response', 
      job_id: '123', 
      latency_ms: 500,
      cost_milli: 3
    }
    
    // Response parser function
    function parseEdgeCloudResponse(edgeResponse: any) {
      return {
        text: edgeResponse.output,
        usage: {
          totalTokens: 0, // EdgeCloud doesn't provide token count
          promptTokens: 0,
          completionTokens: 0
        },
        finishReason: 'stop' as const,
        providerMetadata: {
          edgecloud: {
            jobId: edgeResponse.job_id,
            latency: edgeResponse.latency_ms,
            cost: edgeResponse.cost_milli
          }
        }
      }
    }
    
    const parsed = parseEdgeCloudResponse(edgeResponse)
    expect(parsed.text).toBe('AI response')
    expect(parsed.providerMetadata.edgecloud.jobId).toBe('123')
    expect(parsed.providerMetadata.edgecloud.latency).toBe(500)
    expect(parsed.providerMetadata.edgecloud.cost).toBe(3)
    expect(parsed.finishReason).toBe('stop')
  })
})
// Test 5: EdgeCloud HTTP Client
import { describe, test, expect, jest } from '@jest/globals'

// Mock fetch for testing
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>

describe('EdgeCloud Client', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('EdgeCloud client makes HTTP request', async () => {
    // Mock successful response
    const mockResponse = { 
      output: 'AI response', 
      job_id: 'job-ec-2f4b123',
      latency_ms: 742,
      cost_milli: 3
    }
    
    ;(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as Response)

    // This will be our EdgeCloud client class
    class EdgeCloudClient {
      constructor(private config: { apiKey: string }) {}
      
      async makeRequest(endpoint: string, data: any) {
        const response = await fetch(`https://api.thetaedgecloud.com${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`
          },
          body: JSON.stringify(data)
        })
        
        if (!response.ok) {
          throw new Error(`EdgeCloud request failed: ${response.status}`)
        }
        
        return response.json()
      }
    }

    const client = new EdgeCloudClient({ apiKey: 'test-key' })
    const result = await client.makeRequest('/inference', { prompt: 'test' })
    
    expect(result.output).toBe('AI response')
    expect(result.job_id).toBe('job-ec-2f4b123')
    expect(fetch).toHaveBeenCalledWith(
      'https://api.thetaedgecloud.com/inference',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-key'
        })
      })
    )
  })
})
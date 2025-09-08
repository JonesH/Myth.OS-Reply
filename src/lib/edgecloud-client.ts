// EdgeCloud HTTP Client Implementation
export interface EdgeCloudResponse {
  output: string
  job_id: string
  latency_ms: number
  cost_milli: number
}

export interface EdgeCloudRequest {
  prompt: string
  model?: string
  max_tokens?: number
  temperature?: number
}

export class EdgeCloudClient {
  private baseUrl = 'https://api.thetaedgecloud.com'
  
  constructor(private config: { apiKey: string }) {}
  
  async makeRequest(endpoint: string, data: EdgeCloudRequest): Promise<EdgeCloudResponse> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
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
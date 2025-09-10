// EdgeCloud HTTP Client Implementation
export interface EdgeCloudMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface EdgeCloudRequest {
  input: {
    messages: EdgeCloudMessage[]
    max_tokens?: number
    temperature?: number
    top_p?: number
    stream?: boolean
  }
}

export interface EdgeCloudResponse {
  choices: Array<{
    message: {
      content: string
      role: string
    }
    finish_reason: string
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export class EdgeCloudClient {
  private baseUrl = 'https://ondemand.thetaedgecloud.com'
  
  constructor(private config: { apiKey: string }) {}
  
  async makeRequest(modelName: string, data: EdgeCloudRequest): Promise<EdgeCloudResponse> {
    const endpoint = `/infer_request/${modelName}/completions`
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
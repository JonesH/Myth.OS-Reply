// EdgeCloud Response Parser for AI SDK Compatibility
export interface EdgeCloudResponse {
  output: string
  job_id: string
  latency_ms: number
  cost_milli: number
}

export interface AISDKResponse {
  text: string
  usage: {
    totalTokens: number
    promptTokens: number
    completionTokens: number
  }
  finishReason: 'stop' | 'length' | 'content-filter' | 'other'
  providerMetadata: {
    edgecloud: {
      jobId: string
      latency: number
      cost: number
    }
  }
}

export function parseEdgeCloudResponse(edgeResponse: EdgeCloudResponse): AISDKResponse {
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
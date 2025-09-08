// EdgeCloud Provider for Vercel AI SDK
import { EdgeCloudClient, EdgeCloudResponse } from './edgecloud-client'
import { parseEdgeCloudResponse } from './edgecloud-parser'

export interface EdgeCloudProviderConfig {
  apiKey: string
  baseUrl?: string
}

export function createEdgeCloudProvider(config: EdgeCloudProviderConfig) {
  const client = new EdgeCloudClient({ apiKey: config.apiKey })
  
  return function edgecloudModel(modelId: string) {
    return {
      modelId,
      provider: 'edgecloud' as const,
      
      doGenerate: async (options: {
        prompt: string
        maxTokens?: number
        temperature?: number
      }) => {
        try {
          const edgeResponse = await client.makeRequest('/inference', {
            prompt: options.prompt,
            model: modelId,
            max_tokens: options.maxTokens,
            temperature: options.temperature
          })
          
          return parseEdgeCloudResponse(edgeResponse)
        } catch (error) {
          throw new Error(`EdgeCloud generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
    }
  }
}
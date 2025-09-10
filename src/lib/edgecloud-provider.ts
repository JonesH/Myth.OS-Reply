// EdgeCloud Provider for Vercel AI SDK (LanguageModelV2 interface)
import { EdgeCloudClient } from './edgecloud-client'

// Define the minimal LanguageModelV2 interface we need
interface LanguageModelV2 {
  specificationVersion: 'v2'
  provider: string
  modelId: string
  doGenerate: (options: any) => Promise<any>
  doStream: (options: any) => Promise<any>
  supportedUrls?: Record<string, RegExp[]>
}

export interface EdgeCloudProviderConfig {
  apiKey: string
}

export function createEdgeCloudProvider(config: EdgeCloudProviderConfig) {
  const client = new EdgeCloudClient({ apiKey: config.apiKey })
  
  return function edgecloudModel(modelId: string): LanguageModelV2 {
    const doGenerate = async (options: any) => {
        try {
          // Convert AI SDK prompt to EdgeCloud format
          let userMessage = ''
          if (typeof options.prompt === 'string') {
            userMessage = options.prompt
          } else if (Array.isArray(options.prompt)) {
            // Handle message array format
            const lastMessage = options.prompt[options.prompt.length - 1]
            if (lastMessage && 'content' in lastMessage) {
              userMessage = Array.isArray(lastMessage.content) 
                ? lastMessage.content.map((c: any) => c.type === 'text' ? c.text : '').join('') 
                : lastMessage.content
            }
          }

          const edgeResponse = await client.makeRequest(modelId, {
            input: {
              messages: [
                {
                  role: 'user',
                  content: userMessage
                }
              ],
              max_tokens: options.maxTokens || 500,
              temperature: options.temperature || 0.7,
              stream: false
            }
          })
          
          // Convert EdgeCloud response to AI SDK v1 format
          const content = edgeResponse.choices?.[0]?.message?.content || ''
          
          return {
            content: [
              {
                type: 'text',
                text: content
              }
            ],
            usage: {
              inputTokens: edgeResponse.usage?.prompt_tokens || 0,
              outputTokens: edgeResponse.usage?.completion_tokens || 0,
              totalTokens: (edgeResponse.usage?.prompt_tokens || 0) + (edgeResponse.usage?.completion_tokens || 0),
            },
            finishReason: 'stop',
            warnings: [],
            providerMetadata: {
              edgecloud: {
                model: modelId,
                finishReason: edgeResponse.choices?.[0]?.finish_reason || 'stop'
              }
            }
          }
        } catch (error) {
          throw new Error(`EdgeCloud generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
      
    const doStream = async (options: any) => {
        // EdgeCloud doesn't support streaming, so we'll just do a single generate call
        // and return it as a stream with one chunk
        const result = await doGenerate(options)
        
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue({
              type: 'content-delta',
              content: result.content
            })
            controller.enqueue({
              type: 'finish',
              finishReason: result.finishReason,
              usage: result.usage
            })
            controller.close()
          }
        })
        
        return { stream, warnings: [] }
      }

    return {
      specificationVersion: 'v2',
      provider: 'edgecloud',
      modelId,
      doGenerate,
      doStream,
      supportedUrls: {
        // EdgeCloud doesn't support direct URL access for now
      }
    }
  }
}
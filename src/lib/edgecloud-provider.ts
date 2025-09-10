// EdgeCloud Provider for Vercel AI SDK (LanguageModelV2 interface)
import { 
  LanguageModelV2, 
  LanguageModelV2CallOptions,
  LanguageModelV2Content,
  LanguageModelV2FinishReason,
  LanguageModelV2Usage,
  LanguageModelV2CallWarning
} from '@ai-sdk/provider'
import { EdgeCloudClient } from './edgecloud-client'

export interface EdgeCloudProviderConfig {
  apiKey: string
}

export function createEdgeCloudProvider(config: EdgeCloudProviderConfig) {
  const client = new EdgeCloudClient({ apiKey: config.apiKey })
  
  return function edgecloudModel(modelId: string): LanguageModelV2 {
    const doGenerate = async (options: LanguageModelV2CallOptions) => {
        try {
          // Convert AI SDK messages to EdgeCloud format
          const opts = options as any // Type assertion until we understand the exact interface
          let userMessage = ''
          
          if (opts.prompt && typeof opts.prompt === 'string') {
            // Handle string prompt (legacy)
            userMessage = opts.prompt
          } else if (opts.messages && Array.isArray(opts.messages)) {
            // Handle message array format (modern)
            const lastMessage = opts.messages[opts.messages.length - 1]
            if (lastMessage && 'content' in lastMessage) {
              if (typeof lastMessage.content === 'string') {
                userMessage = lastMessage.content
              } else if (Array.isArray(lastMessage.content)) {
                userMessage = lastMessage.content
                  .map((c: any) => c.type === 'text' ? c.text : '')
                  .join('')
              }
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
              max_tokens: opts.maxOutputTokens || 500,
              temperature: opts.temperature || 0.7,
              stream: false
            }
          })
          
          // Convert EdgeCloud response to AI SDK v2 format
          const content = edgeResponse.choices?.[0]?.message?.content || ''
          
          return {
            content: [
              {
                type: 'text' as const,
                text: content
              }
            ] as LanguageModelV2Content[],
            usage: {
              inputTokens: edgeResponse.usage?.prompt_tokens || 0,
              outputTokens: edgeResponse.usage?.completion_tokens || 0,
              totalTokens: (edgeResponse.usage?.prompt_tokens || 0) + (edgeResponse.usage?.completion_tokens || 0),
            } as LanguageModelV2Usage,
            finishReason: 'stop' as LanguageModelV2FinishReason,
            warnings: [] as LanguageModelV2CallWarning[],
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
      supportedUrls: {}
    }
  }
}
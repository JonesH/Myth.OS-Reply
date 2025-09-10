// Unified AI Service - Provider-agnostic AI operations
import { generateText } from 'ai'
import { createAIProvider, getAIModel, FREE_MODELS, AIProviderType } from '@/lib/ai-provider-factory'
import { OpenRouterService, ReplyGenerationOptions, AIModel } from './openrouter'

export interface CompletionOptions {
  prompt: string
  maxTokens?: number
  temperature?: number
  modelId?: string
}

export class AIService {
  private providerConfig: { type: AIProviderType }
  
  constructor() {
    this.providerConfig = createAIProvider()
  }

  /**
   * Generate AI-powered reply to a tweet
   */
  async generateReply(options: ReplyGenerationOptions, modelId?: string): Promise<string> {
    const selectedModel = this.getSelectedModel(modelId)
    
    if (this.providerConfig.type === 'edgecloud') {
      return this.generateReplyWithEdgeCloud(options, selectedModel)
    } else {
      return this.generateReplyWithOpenRouter(options, selectedModel)
    }
  }

  /**
   * Generate AI completion for general text generation (used by keywordGenerator)
   */
  async generateCompletion(options: CompletionOptions): Promise<string> {
    const modelId = options.modelId || this.getDefaultModel()
    
    if (this.providerConfig.type === 'edgecloud') {
      const model = getAIModel(modelId)
      
      const response = await generateText({
        model: model as any,
        prompt: options.prompt,
        temperature: options.temperature || 0.7
      })
      
      return response.text
    } else {
      // Use OpenRouter via generateReply with a fake tweet structure
      const openRouterService = new OpenRouterService()
      return await openRouterService.generateReply({
        originalTweet: options.prompt,
        context: '',
        tone: 'professional',
        maxLength: options.maxTokens || 500,
        customInstructions: 'Return only the requested content'
      }, modelId)
    }
  }

  /**
   * Generate multiple reply variations
   */
  async generateMultipleReplies(options: ReplyGenerationOptions, count: number, modelId?: string): Promise<string[]> {
    const replies: string[] = []
    
    for (let i = 0; i < count; i++) {
      const reply = await this.generateReply(options, modelId)
      replies.push(reply)
    }
    
    return replies
  }

  /**
   * Get available AI models for current provider
   */
  getAvailableModels(): AIModel[] {
    if (this.providerConfig.type === 'edgecloud') {
      return [
        {
          id: FREE_MODELS.edgecloud.llama3,
          name: 'Llama 3.1 70B',
          description: 'Advanced language model optimized for conversation',
          // contextLength: 8192,
          pricing: { prompt: 0, completion: 0 }
        },
        {
          id: FREE_MODELS.edgecloud.deepseek,
          name: 'DeepSeek R1',
          description: 'High-performance reasoning model',
          // contextLength: 8192,
          pricing: { prompt: 0, completion: 0 }
        }
      ]
    } else {
      return OpenRouterService.getAvailableModels()
    }
  }

  /**
   * Test connection to AI provider
   */
  async testModelConnection(modelId?: string): Promise<boolean> {
    try {
      const testOptions: ReplyGenerationOptions = {
        originalTweet: 'Hello, world!',
        maxLength: 50,
        tone: 'casual'
      }
      
      await this.generateReply(testOptions, modelId)
      return true
    } catch (error) {
      console.error('AI model connection test failed:', error)
      return false
    }
  }

  /**
   * Get current provider type
   */
  getProviderType(): AIProviderType {
    return this.providerConfig.type
  }

  /**
   * Get default model for current provider
   */
  getDefaultModel(): string {
    if (this.providerConfig.type === 'edgecloud') {
      return FREE_MODELS.edgecloud.llama3
    } else {
      return OpenRouterService.getAvailableModels()[0].id
    }
  }

  // Private methods
  private getSelectedModel(modelId?: string): string {
    return modelId || this.getDefaultModel()
  }

  private async generateReplyWithEdgeCloud(options: ReplyGenerationOptions, modelId: string): Promise<string> {
    const model = getAIModel(modelId)
    const prompt = this.buildPrompt(options)
    
    const response = await generateText({
      model: model as any,
      prompt,
      temperature: 0.7
    })
    
    return response.text
  }

  private async generateReplyWithOpenRouter(options: ReplyGenerationOptions, modelId: string): Promise<string> {
    const openRouterService = new OpenRouterService()
    return await openRouterService.generateReply(options, modelId)
  }

  private buildPrompt(options: ReplyGenerationOptions): string {
    const { originalTweet, context, tone, maxLength, includeHashtags, includeEmojis, customInstructions } = options
    
    let prompt = `Generate a reply to this tweet: "${originalTweet}"\n\n`
    
    if (context) {
      prompt += `Context: ${context}\n\n`
    }
    
    prompt += `Requirements:\n`
    prompt += `- Tone: ${tone || 'casual'}\n`
    prompt += `- Maximum length: ${maxLength || 280} characters\n`
    prompt += `- Include hashtags: ${includeHashtags ? 'yes' : 'no'}\n`
    prompt += `- Include emojis: ${includeEmojis ? 'yes' : 'no'}\n`
    
    if (customInstructions) {
      prompt += `- Custom instructions: ${customInstructions}\n`
    }
    
    prompt += `\nReply:`
    
    return prompt
  }
}
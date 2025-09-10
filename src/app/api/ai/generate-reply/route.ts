import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/services/auth'
import { OpenRouterService, ReplyGenerationOptions } from '@/lib/services/openrouter'
import { getAIModel, createAIProvider, FREE_MODELS } from '@/lib/ai-provider-factory'

/**
 * @swagger
 * /api/ai/generate-reply:
 *   post:
 *     summary: Generate AI-powered tweet replies
 *     tags: [AI Reply Generation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - originalTweet
 *             properties:
 *               originalTweet:
 *                 type: string
 *                 description: The original tweet to reply to
 *               context:
 *                 type: string
 *                 description: Additional context for the reply
 *               tone:
 *                 type: string
 *                 enum: [professional, casual, humorous, supportive, promotional]
 *                 default: casual
 *                 description: Tone of the reply
 *               maxLength:
 *                 type: number
 *                 default: 280
 *                 description: Maximum character length
 *               includeHashtags:
 *                 type: boolean
 *                 default: false
 *                 description: Whether to include hashtags
 *               includeEmojis:
 *                 type: boolean
 *                 default: false
 *                 description: Whether to include emojis
 *               customInstructions:
 *                 type: string
 *                 description: Custom instructions for reply generation
 *               count:
 *                 type: number
 *                 default: 1
 *                 description: Number of reply variations to generate
 *               modelId:
 *                 type: string
 *                 description: Specific OpenRouter model to use
 *     responses:
 *       200:
 *         description: Generated replies
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 replies:
 *                   type: array
 *                   items:
 *                     type: string
 *                 modelUsed:
 *                   type: string
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

async function getAuthUser(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) {
    throw new Error('No token provided')
  }
  return await AuthService.getUserFromToken(token)
}

async function generateReplyWithProvider(options: ReplyGenerationOptions, modelId: string): Promise<string> {
  const providerConfig = createAIProvider()
  
  if (providerConfig.type === 'edgecloud') {
    // Use EdgeCloud via AI SDK generateText
    const { generateText } = require('ai')
    const model = getAIModel(modelId)
    
    const prompt = buildPrompt(options)
    const response = await generateText({
      model,
      prompt,
      maxTokens: 500,
      temperature: 0.7
    })
    
    return response.text
  } else {
    // Fallback to existing OpenRouter service
    const openRouterService = new OpenRouterService()
    return await openRouterService.generateReply(options, modelId)
  }
}

function buildPrompt(options: ReplyGenerationOptions): string {
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

export async function POST(request: NextRequest) {
  try {
    await getAuthUser(request) // Verify authentication
    
    const body = await request.json()
    const { 
      originalTweet,
      context,
      tone = 'casual',
      maxLength = 280,
      includeHashtags = false,
      includeEmojis = false,
      customInstructions,
      count = 1,
      modelId
    } = body

    if (!originalTweet) {
      return NextResponse.json(
        { error: 'Original tweet is required' },
        { status: 400 }
      )
    }

    if (count < 1 || count > 5) {
      return NextResponse.json(
        { error: 'Count must be between 1 and 5' },
        { status: 400 }
      )
    }

    const options: ReplyGenerationOptions = {
      originalTweet,
      context,
      tone: tone as any,
      maxLength,
      includeHashtags,
      includeEmojis,
      customInstructions
    }

    // Determine model based on provider type
    const providerConfig = createAIProvider()
    let selectedModel: string
    
    if (modelId) {
      selectedModel = modelId
    } else if (providerConfig.type === 'edgecloud') {
      selectedModel = FREE_MODELS.edgecloud.llama3
    } else {
      selectedModel = OpenRouterService.FREE_MODELS[0].id
    }

    let replies: string[]

    if (count === 1) {
      const reply = await generateReplyWithProvider(options, selectedModel)
      replies = [reply]
    } else {
      // For multiple replies, generate them sequentially
      replies = []
      for (let i = 0; i < count; i++) {
        const reply = await generateReplyWithProvider(options, selectedModel)
        replies.push(reply)
      }
    }

    return NextResponse.json({
      replies,
      modelUsed: selectedModel,
      provider: providerConfig.type,
      charactersUsed: replies.map(reply => reply.length)
    })

  } catch (error: any) {
    console.error('Generate reply error:', error)
    
    if (error.message === 'No token provided' || error.message === 'Invalid token') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (error.message.includes('Failed to generate reply')) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

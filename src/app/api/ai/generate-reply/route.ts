import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/services/auth'
import { AIService } from '@/lib/services/ai'
import { ReplyGenerationOptions } from '@/lib/services/openrouter'
import { UsageTrackingService } from '@/lib/services/usageTracking'

export const dynamic = 'force-dynamic'

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
  if (token) return await AuthService.getUserFromToken(token)
  if (process.env.DEMO_MODE === 'true') return await AuthService.getOrCreateDemoUser()
  throw new Error('No token provided')
}

async function generateReplyWithProvider(options: ReplyGenerationOptions, modelId: string): Promise<string> {
  const aiService = new AIService()
  return await aiService.generateReply(options, modelId)
}


export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request) // Verify authentication
    
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

    // Check usage limits before generating replies
    const usageLimit = await UsageTrackingService.checkUsageLimit(user.id, 'reply')
    
    if (!usageLimit.canUseFeature) {
      return NextResponse.json(
        { 
          error: 'Daily usage limit exceeded',
          remainingUsage: usageLimit.remainingUsage,
          dailyLimit: usageLimit.dailyLimit,
          resetTime: usageLimit.resetTime
        },
        { status: 429 }
      )
    }

    // Check if user has access to custom instructions (premium feature)
    if (customInstructions) {
      const hasCustomAccess = await UsageTrackingService.hasPremiumAccess(user.id, 'custom_instructions')
      if (!hasCustomAccess) {
        return NextResponse.json(
          { error: 'Custom instructions require Premium plan' },
          { status: 403 }
        )
      }
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

    // Use AIService for model selection
    const aiService = new AIService()
    const selectedModel = modelId || aiService.getDefaultModel()

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

    // Increment usage count for each reply generated
    for (let i = 0; i < count; i++) {
      await UsageTrackingService.incrementUsage(user.id, 'reply')
    }

    return NextResponse.json({
      replies,
      modelUsed: selectedModel,
      provider: aiService.getProviderType(),
      charactersUsed: replies.map(reply => reply.length),
      remainingUsage: usageLimit.remainingUsage - count,
      dailyLimit: usageLimit.dailyLimit
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

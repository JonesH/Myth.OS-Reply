import { NextRequest, NextResponse } from 'next/server'
import { UsageTrackingService } from '@/lib/services/usageTracking'
import { AuthService } from '@/lib/services/auth'

export const dynamic = 'force-dynamic'

/**
 * @swagger
 * /api/usage/check:
 *   get:
 *     summary: Check user usage limits
 *     tags: [Usage]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: feature
 *         required: true
 *         schema:
 *           type: string
 *           enum: [reply, ai_generation]
 *     responses:
 *       200:
 *         description: Usage limit information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 canUseFeature:
 *                   type: boolean
 *                 remainingUsage:
 *                   type: integer
 *                 dailyLimit:
 *                   type: integer
 *                 resetTime:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = await AuthService.validateToken(token)
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const feature = searchParams.get('feature') as 'reply' | 'ai_generation'

    if (!feature || !['reply', 'ai_generation'].includes(feature)) {
      return NextResponse.json(
        { error: 'Invalid feature. Must be reply or ai_generation' },
        { status: 400 }
      )
    }

    const usageLimit = await UsageTrackingService.checkUsageLimit(user.id, feature)

    return NextResponse.json(usageLimit)
  } catch (error) {
    console.error('Error checking usage limit:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/usage/increment:
 *   post:
 *     summary: Increment usage count
 *     tags: [Usage]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - feature
 *               properties:
 *                 feature:
 *                   type: string
 *                   enum: [reply, ai_generation]
 *     responses:
 *       200:
 *         description: Usage incremented successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       429:
 *         description: Usage limit exceeded
 *       500:
 *         description: Internal server error
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = await AuthService.validateToken(token)
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { feature } = body

    if (!feature || !['reply', 'ai_generation'].includes(feature)) {
      return NextResponse.json(
        { error: 'Invalid feature. Must be reply or ai_generation' },
        { status: 400 }
      )
    }

    // Check usage limit before incrementing
    const usageLimit = await UsageTrackingService.checkUsageLimit(user.id, feature)
    
    if (!usageLimit.canUseFeature) {
      return NextResponse.json(
        { 
          error: 'Usage limit exceeded',
          remainingUsage: usageLimit.remainingUsage,
          dailyLimit: usageLimit.dailyLimit,
          resetTime: usageLimit.resetTime
        },
        { status: 429 }
      )
    }

    // Increment usage
    await UsageTrackingService.incrementUsage(user.id, feature)

    return NextResponse.json({ 
      success: true,
      remainingUsage: usageLimit.remainingUsage - 1,
      dailyLimit: usageLimit.dailyLimit
    })
  } catch (error) {
    console.error('Error incrementing usage:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

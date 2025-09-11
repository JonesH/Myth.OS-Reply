import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { AuthService } from '@/lib/services/auth'
import { ensureUserExists } from '@/lib/utils/ensureUser'
import { isNoDatabaseMode } from '@/lib/inMemoryStorage'

export const dynamic = 'force-dynamic'

/**
 * @swagger
 * /api/subscriptions/status:
 *   get:
 *     summary: Get user subscription status
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 plan:
 *                   type: string
 *                   enum: [free, basic, premium]
 *                 status:
 *                   type: string
 *                   enum: [active, expired, cancelled]
 *                 expiresAt:
 *                   type: string
 *                   format: date-time
 *                 dailyLimit:
 *                   type: integer
 *                 repliesUsedToday:
 *                   type: integer
 *                 daysUntilExpiry:
 *                   type: integer
 *                 canUpgrade:
 *                   type: boolean
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined
    
    // Get user from token
    const user = token 
      ? await AuthService.validateToken(token)
      : await AuthService.getOrCreateDemoUser()
      
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // In no-DB mode, return a virtual subscription
    if (isNoDatabaseMode()) {
      const subscriptionData = {
        plan: 'free',
        status: 'active',
        expiresAt: null,
        dailyLimit: 10,
        repliesUsedToday: 0,
        daysUntilExpiry: null,
        canUpgrade: true,
        walletAddress: '0xNO_DB_MODE',
      }
      return NextResponse.json(subscriptionData)
    }

    // Ensure user exists in database
    await ensureUserExists(user)

    // Get user data from database
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        subscriptionPlan: true,
        subscriptionStatus: true,
        subscriptionExpiresAt: true,
        dailyReplyLimit: true,
        repliesUsedToday: true
      }
    })

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Calculate days until expiry
    const daysUntilExpiry = userData.subscriptionExpiresAt 
      ? Math.ceil((new Date(userData.subscriptionExpiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : null

    // Determine if user can upgrade
    const canUpgrade = userData.subscriptionPlan === 'free' || userData.subscriptionPlan === 'basic'

    const subscriptionData = {
      plan: userData.subscriptionPlan,
      status: userData.subscriptionStatus,
      expiresAt: userData.subscriptionExpiresAt?.toISOString() || null,
      dailyLimit: userData.dailyReplyLimit,
      repliesUsedToday: userData.repliesUsedToday,
      daysUntilExpiry,
      canUpgrade,
      walletAddress: '0x1234...demo' // TODO: Get real wallet address
    }

    return NextResponse.json(subscriptionData)
    
  } catch (error) {
    console.error('Error fetching subscription status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

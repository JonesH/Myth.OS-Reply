import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { AuthService } from '@/lib/services/auth'

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
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = await AuthService.validateToken(token)
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        subscriptions: {
          where: { status: 'active' },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Calculate days until expiry
    let daysUntilExpiry = null
    if (dbUser.subscriptionExpiresAt) {
      const now = new Date()
      const expiry = new Date(dbUser.subscriptionExpiresAt)
      const diffTime = expiry.getTime() - now.getTime()
      daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    }

    // Check if user can upgrade
    const canUpgrade = dbUser.subscriptionPlan !== 'premium'

    return NextResponse.json({
      plan: dbUser.subscriptionPlan,
      status: dbUser.subscriptionStatus,
      expiresAt: dbUser.subscriptionExpiresAt,
      dailyLimit: dbUser.dailyReplyLimit,
      repliesUsedToday: dbUser.repliesUsedToday,
      daysUntilExpiry,
      canUpgrade,
      walletAddress: dbUser.walletAddress
    })
  } catch (error) {
    console.error('Error fetching subscription status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { AuthService } from '@/lib/services/auth'

export const dynamic = 'force-dynamic'

/**
 * @swagger
 * /api/subscriptions/upgrade:
 *   post:
 *     summary: Upgrade user subscription
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - plan
 *                 - transactionHash
 *               properties:
 *                 plan:
 *                   type: string
 *                   enum: [basic, premium]
 *                 transactionHash:
 *                   type: string
 *                   description: Theta blockchain transaction hash
 *                 walletAddress:
 *                   type: string
 *                   description: User's wallet address
 *     responses:
 *       200:
 *         description: Subscription upgraded successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
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
    const { plan, transactionHash, walletAddress } = body

    if (!plan || !transactionHash) {
      return NextResponse.json(
        { error: 'Plan and transaction hash are required' },
        { status: 400 }
      )
    }

    if (!['basic', 'premium'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan. Must be basic or premium' },
        { status: 400 }
      )
    }

    // Plan pricing
    const planPricing = {
      basic: 1,
      premium: 5
    }

    const amount = planPricing[plan as keyof typeof planPricing]

    // Calculate subscription end date (30 days from now)
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 30)

    // Update user subscription
    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionPlan: plan,
        subscriptionStatus: 'active',
        subscriptionExpiresAt: endDate,
        dailyReplyLimit: plan === 'basic' ? 50 : 500,
        walletAddress: walletAddress || undefined
      }
    })

    // Create subscription record
    await prisma.subscription.create({
      data: {
        userId: user.id,
        plan,
        status: 'active',
        amount,
        transactionHash,
        endDate,
        autoRenew: true
      }
    })

    return NextResponse.json({
      success: true,
      message: `Successfully upgraded to ${plan} plan`,
      subscription: {
        plan,
        status: 'active',
        expiresAt: endDate,
        dailyLimit: plan === 'basic' ? 50 : 500
      }
    })
  } catch (error) {
    console.error('Error upgrading subscription:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

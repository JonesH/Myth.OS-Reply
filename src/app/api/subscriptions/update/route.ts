import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { AuthService } from '@/lib/services/auth'

/**
 * @swagger
 * /api/subscriptions/update:
 *   post:
 *     summary: Update user subscription plan immediately
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - plan
 *             properties:
 *               plan:
 *                 type: string
 *                 enum: [free, basic, premium, enterprise]
 *                 description: Subscription plan to update to
 *     responses:
 *       200:
 *         description: Subscription updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 subscription:
 *                   type: object
 *                   properties:
 *                     plan:
 *                       type: string
 *                     status:
 *                       type: string
 *                     expiresAt:
 *                       type: string
 *                     dailyLimit:
 *                       type: integer
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
    const { plan } = body

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan is required' },
        { status: 400 }
      )
    }

    if (!['free', 'basic', 'premium', 'enterprise'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan. Must be free, basic, premium, or enterprise' },
        { status: 400 }
      )
    }

    // Calculate subscription end date (30 days from now for paid plans)
    const endDate = plan === 'free' ? null : new Date()
    if (endDate) {
      endDate.setDate(endDate.getDate() + 30)
    }

    // Calculate daily limits based on plan
    const dailyLimits = {
      free: 10,
      basic: 50,
      premium: 500,
      enterprise: 5000
    }

    const dailyLimit = dailyLimits[plan as keyof typeof dailyLimits]

    // Update user subscription
    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionPlan: plan,
        subscriptionStatus: 'active',
        subscriptionExpiresAt: endDate,
        dailyReplyLimit: dailyLimit,
        repliesUsedToday: 0, // Reset usage when changing plans
        lastUsageReset: new Date()
      }
    })

    // Create subscription record for paid plans
    if (plan !== 'free') {
      const planPricing = {
        basic: 90,
        premium: 240,
        enterprise: 6000
      }

      await prisma.subscription.create({
        data: {
          userId: user.id,
          plan,
          status: 'active',
          amount: planPricing[plan as keyof typeof planPricing] || 0,
          transactionHash: `demo_${Date.now()}`, // Demo transaction hash
          endDate,
          autoRenew: true
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: `Successfully updated to ${plan} plan`,
      subscription: {
        plan,
        status: 'active',
        expiresAt: endDate?.toISOString() || null,
        dailyLimit
      }
    })
  } catch (error) {
    console.error('Error updating subscription:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { AuthService } from '@/lib/services/auth'
import { isNoDatabaseMode } from '@/lib/inMemoryStorage'

export const dynamic = 'force-dynamic'

/**
 * @swagger
 * /api/subscriptions/history:
 *   get:
 *     summary: Get user subscription history
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 subscriptions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       plan:
 *                         type: string
 *                       status:
 *                         type: string
 *                       amount:
 *                         type: number
 *                       transactionHash:
 *                         type: string
 *                       startDate:
 *                         type: string
 *                         format: date-time
 *                       endDate:
 *                         type: string
 *                         format: date-time
 *                       autoRenew:
 *                         type: boolean
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined
    const user = token
      ? await AuthService.validateToken(token)
      : await AuthService.getOrCreateDemoUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (isNoDatabaseMode()) {
      return NextResponse.json({
        subscriptions: [
          {
            id: 'demo-sub-1',
            userId: user.id,
            plan: 'free',
            status: 'active',
            amount: 0,
            transactionHash: 'demo_tx',
            startDate: new Date().toISOString(),
            endDate: null,
            autoRenew: false,
          }
        ]
      })
    }

    const subscriptions = await prisma.subscription.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ subscriptions })
  } catch (error) {
    console.error('Error fetching subscription history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

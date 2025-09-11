import { NextRequest, NextResponse } from 'next/server'
// Removed prisma import - using demo mode only
import { AuthService } from '@/lib/services/auth'

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
// Demo subscription data
const DEMO_SUBSCRIPTION_DATA = {
  plan: 'premium',
  status: 'active',
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
  dailyLimit: 500,
  repliesUsedToday: 47,
  daysUntilExpiry: 30,
  canUpgrade: false,
  walletAddress: '0x1234...demo'
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined
    
    // Always return demo user in demo mode
    const user = token 
      ? await AuthService.validateToken(token)
      : await AuthService.getOrCreateDemoUser()
      
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Return demo subscription data
    return NextResponse.json(DEMO_SUBSCRIPTION_DATA)
    
  } catch (error) {
    console.error('Error fetching subscription status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

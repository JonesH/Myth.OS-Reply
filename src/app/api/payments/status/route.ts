import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/services/auth'
import { ThetaPaymentService } from '@/lib/services/theta'

export const dynamic = 'force-dynamic'

/**
 * @swagger
 * /api/payments/status:
 *   get:
 *     summary: Get user's subscription status
 *     description: Retrieves the current subscription status and payment information for the authenticated user from Theta blockchain
 *     tags: [Payments, Blockchain]
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
 *                 isActive:
 *                   type: boolean
 *                   description: Whether subscription is currently active
 *                   example: true
 *                 planType:
 *                   type: string
 *                   description: Current subscription plan
 *                   example: "basic"
 *                 expiresAt:
 *                   type: string
 *                   format: date-time
 *                   description: Subscription expiration date
 *                   example: "2024-12-31T23:59:59Z"
 *                 daysRemaining:
 *                   type: number
 *                   description: Days until subscription expires
 *                   example: 15
 *                 paymentAddress:
 *                   type: string
 *                   description: User's payment address for renewals
 *                   example: "0x1234567890123456789012345678901234567890"
 *                 userId:
 *                   type: string
 *                   description: User ID
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "No token provided"
 *       500:
 *         description: Server error fetching subscription status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch subscription status"
 */

export async function GET(request: NextRequest) {
  try {
    // Get user from auth token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const user = await AuthService.validateToken(token)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Get user's subscription status from blockchain
    const subscription = await ThetaPaymentService.getUserSubscription(user.id)
    const paymentAddress = ThetaPaymentService.generateUserPaymentAddress(user.id)
    
    return NextResponse.json({
      ...subscription,
      paymentAddress,
      userId: user.id
    })
  } catch (error) {
    console.error('Error fetching subscription status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription status' },
      { status: 500 }
    )
  }
}
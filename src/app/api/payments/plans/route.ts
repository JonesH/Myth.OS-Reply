import { NextRequest, NextResponse } from 'next/server'
import { ThetaPaymentService } from '@/lib/services/theta'

/**
 * @swagger
 * /api/payments/plans:
 *   get:
 *     summary: Get available subscription plans
 *     description: Retrieves all available subscription plans with TFUEL pricing on Theta network
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Subscription plans retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 plans:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: Plan identifier
 *                         example: "basic"
 *                       name:
 *                         type: string
 *                         description: Plan name
 *                         example: "Basic Plan"
 *                       price:
 *                         type: number
 *                         description: Price in TFUEL
 *                         example: 1
 *                       duration:
 *                         type: number
 *                         description: Duration in days
 *                         example: 30
 *                       features:
 *                         type: array
 *                         items:
 *                           type: string
 *                         description: List of plan features
 *                 chainId:
 *                   type: string
 *                   description: Theta network chain ID
 *                   example: "365"
 *                 currency:
 *                   type: string
 *                   description: Payment currency
 *                   example: "TFUEL"
 *       500:
 *         description: Server error fetching plans
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch payment plans"
 */

export async function GET(request: NextRequest) {
  try {
    const plans = ThetaPaymentService.getSubscriptionPlans()
    
    return NextResponse.json({
      plans,
      chainId: process.env.NEXT_PUBLIC_THETA_CHAIN_ID,
      currency: 'TFUEL'
    })
  } catch (error) {
    console.error('Error fetching payment plans:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment plans' },
      { status: 500 }
    )
  }
}

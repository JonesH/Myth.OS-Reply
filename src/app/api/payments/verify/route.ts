import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/services/auth'
import { ThetaPaymentService } from '@/lib/services/theta'

/**
 * @swagger
 * /api/payments/verify:
 *   post:
 *     summary: Verify blockchain payment and activate subscription
 *     description: Verifies a TFUEL payment transaction on Theta blockchain and activates the corresponding subscription plan
 *     tags: [Payments, Blockchain]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - txHash
 *             properties:
 *               txHash:
 *                 type: string
 *                 description: Theta blockchain transaction hash
 *                 example: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
 *     responses:
 *       200:
 *         description: Payment verified and subscription activated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 transaction:
 *                   type: object
 *                   description: Verified transaction details
 *                   properties:
 *                     hash:
 *                       type: string
 *                       example: "0xabcdef..."
 *                     to:
 *                       type: string
 *                       example: "0x1234567890123456789012345678901234567890"
 *                     value:
 *                       type: string
 *                       example: "1000000000000000000"
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                 plan:
 *                   type: object
 *                   description: Activated subscription plan
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "basic"
 *                     name:
 *                       type: string
 *                       example: "Basic Plan"
 *                     durationDays:
 *                       type: number
 *                       example: 30
 *                 subscription:
 *                   type: object
 *                   description: Updated subscription status
 *                   properties:
 *                     isActive:
 *                       type: boolean
 *                       example: true
 *                     planType:
 *                       type: string
 *                       example: "basic"
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-12-31T23:59:59Z"
 *                     lastPayment:
 *                       type: object
 *                       description: Last payment transaction
 *                 message:
 *                   type: string
 *                   example: "Payment verified! Basic Plan activated until 2024-12-31T23:59:59.000Z"
 *       400:
 *         description: Invalid request or payment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   enum:
 *                     - "Transaction hash is required"
 *                     - "Transaction not found or invalid"
 *                     - "Transaction was not sent to your payment address"
 *                     - "Invalid payment amount. Must be 1 TFUEL (Basic) or 5 TFUEL (Premium)"
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
 *         description: Server error verifying payment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to verify payment"
 */

export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json()
    const { txHash } = body

    if (!txHash || typeof txHash !== 'string') {
      return NextResponse.json(
        { error: 'Transaction hash is required' },
        { status: 400 }
      )
    }

    // Verify the transaction exists and is valid
    const transaction = await ThetaPaymentService.verifyTransaction(txHash)
    
    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found or invalid' },
        { status: 400 }
      )
    }

    // Check if transaction was sent to user's payment address
    const expectedAddress = ThetaPaymentService.generateUserPaymentAddress(user.id)
    if (transaction.to.toLowerCase() !== expectedAddress.toLowerCase()) {
      return NextResponse.json(
        { error: 'Transaction was not sent to your payment address' },
        { status: 400 }
      )
    }

    // Check if amount corresponds to a valid plan
    const plan = ThetaPaymentService.getPlanByAmount(transaction.value)
    if (!plan) {
      return NextResponse.json(
        { error: 'Invalid payment amount. Must be 1 TFUEL (Basic) or 5 TFUEL (Premium)' },
        { status: 400 }
      )
    }

    // Calculate subscription expiry
    const expiresAt = new Date(transaction.timestamp.getTime() + (plan.durationDays * 24 * 60 * 60 * 1000))
    const isActive = new Date() < expiresAt

    return NextResponse.json({
      success: true,
      transaction,
      plan,
      subscription: {
        isActive,
        planType: plan.id,
        expiresAt,
        lastPayment: transaction
      },
      message: `Payment verified! ${plan.name} activated until ${expiresAt.toISOString()}`
    })

  } catch (error) {
    console.error('Error verifying payment:', error)
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    )
  }
}

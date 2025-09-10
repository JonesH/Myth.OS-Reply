import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/services/auth'
import { ThetaPaymentService } from '@/lib/services/theta'

export const dynamic = 'force-dynamic'

/**
 * @swagger
 * /api/payments/address:
 *   get:
 *     summary: Generate payment address for user
 *     description: Creates a deterministic Theta blockchain payment address for the authenticated user to receive TFUEL payments for subscription activation
 *     tags: [Payments, Blockchain]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment address generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 paymentAddress:
 *                   type: string
 *                   description: Ethereum-compatible address on Theta network
 *                   example: "0x1234567890123456789012345678901234567890"
 *                 userId:
 *                   type: string
 *                   description: User ID
 *                 chainId:
 *                   type: string
 *                   description: Theta testnet chain ID
 *                   example: "365"
 *                 currency:
 *                   type: string
 *                   description: Payment currency
 *                   example: "TFUEL"
 *                 instructions:
 *                   type: string
 *                   description: Payment instructions for user
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
 *         description: Server error generating payment address
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to generate payment address"
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

    // Generate deterministic payment address for this user
    const paymentAddress = ThetaPaymentService.generateUserPaymentAddress(user.id)
    
    return NextResponse.json({
      paymentAddress,
      userId: user.id,
      chainId: process.env.NEXT_PUBLIC_THETA_CHAIN_ID,
      currency: 'TFUEL',
      instructions: 'Send TFUEL (Theta native gas token) to this address to activate your subscription. 1 TFUEL = Basic (30 days), 5 TFUEL = Premium (30 days). You need a small amount of TFUEL to cover gas when sending from your wallet.'
    })
  } catch (error) {
    console.error('Error generating payment address:', error)
    return NextResponse.json(
      { error: 'Failed to generate payment address' },
      { status: 500 }
    )
  }
}

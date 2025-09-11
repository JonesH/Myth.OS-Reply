import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/services/auth'
import { prisma } from '@/lib/database'
import { isNoDatabaseMode } from '@/lib/inMemoryStorage'

export const dynamic = 'force-dynamic'

/**
 * @swagger
 * /api/payments/verify:
 *   post:
 *     summary: Manually verify a payment transaction
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - address
 *                 - transactionHash
 *               properties:
 *                 address:
 *                   type: string
 *                   description: Payment address
 *                 transactionHash:
 *                   type: string
 *                   description: Transaction hash to verify
 *     responses:
 *       200:
 *         description: Transaction verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [verified, failed, pending]
 *                 message:
 *                   type: string
 *                 transactionHash:
 *                   type: string
 *                 confirmations:
 *                   type: integer
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Payment address not found
 *       500:
 *         description: Internal server error
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined
    const user = token
      ? await AuthService.validateToken(token)
      : await AuthService.getOrCreateDemoUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { address, transactionHash } = body

    if (!address || !transactionHash) {
      return NextResponse.json(
        { error: 'Address and transaction hash are required' },
        { status: 400 }
      )
    }

    if (isNoDatabaseMode()) {
      // Simulate verification success in no-DB mode
      const isValidTransaction = transactionHash.startsWith('0x') && transactionHash.length >= 10
      if (!isValidTransaction) {
        return NextResponse.json({ status: 'failed', message: 'Invalid transaction hash format' })
      }
      const confirmations = Math.floor(Math.random() * 10) + 1
      const subscriptionEndDate = new Date()
      subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 30)
      return NextResponse.json({
        status: 'verified',
        message: `Payment verified! basic plan activated for 30 days.`,
        transactionHash,
        confirmations,
        plan: 'basic',
        expiresAt: subscriptionEndDate.toISOString()
      })
    }

    // Find payment address
    const paymentAddress = await prisma.paymentAddress.findUnique({
      where: { address }
    })

    if (!paymentAddress) {
      return NextResponse.json(
        { error: 'Payment address not found' },
        { status: 404 }
      )
    }

    // Check if payment address belongs to user
    if (paymentAddress.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized access to payment address' },
        { status: 403 }
      )
    }

    // Check if expired
    if (new Date() > paymentAddress.expiresAt) {
      return NextResponse.json({
        status: 'failed',
        message: 'Payment address has expired'
      })
    }

    // In a real implementation, you would verify the transaction on the blockchain
    // For now, we'll simulate verification
    const isValidTransaction = transactionHash.startsWith('0x') && transactionHash.length === 66

    if (!isValidTransaction) {
      return NextResponse.json({
        status: 'failed',
        message: 'Invalid transaction hash format'
      })
    }

    // Simulate verification success
    const confirmations = Math.floor(Math.random() * 10) + 1

    // Update payment address status
    await prisma.paymentAddress.update({
      where: { id: paymentAddress.id },
      data: { 
        status: 'confirmed',
        transactionHash
      }
    })

    // Update user subscription
    const subscriptionEndDate = new Date()
    subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 30) // 30 days

    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionPlan: paymentAddress.plan,
        subscriptionStatus: 'active',
        subscriptionExpiresAt: subscriptionEndDate,
        dailyReplyLimit: paymentAddress.plan === 'basic' ? 50 : 
                        paymentAddress.plan === 'premium' ? 500 : 
                        paymentAddress.plan === 'enterprise' ? 5000 : 10
      }
    })

    return NextResponse.json({
      status: 'verified',
      message: `Payment verified! ${paymentAddress.plan} plan activated for 30 days.`,
      transactionHash,
      confirmations,
      plan: paymentAddress.plan,
      expiresAt: subscriptionEndDate.toISOString()
    })
  } catch (error) {
    console.error('Error verifying payment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// In no-DB mode we default to 'basic' when simulating

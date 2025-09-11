import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/services/auth'
import { prisma } from '@/lib/database'
import { isNoDatabaseMode } from '@/lib/inMemoryStorage'

export const dynamic = 'force-dynamic'

/**
 * @swagger
 * /api/payments/status:
 *   get:
 *     summary: Check payment transaction status
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment address to check
 *     responses:
 *       200:
 *         description: Transaction status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [pending, confirmed, failed, expired]
 *                 transactionHash:
 *                   type: string
 *                 confirmations:
 *                   type: integer
 *                 blockNumber:
 *                   type: integer
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Payment address not found
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

    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')

    if (!address) {
      return NextResponse.json(
        { error: 'Payment address is required' },
        { status: 400 }
      )
    }

    if (isNoDatabaseMode()) {
      // Simulate pending/confirmed status
      const minutesSince = Math.floor((Date.now() % (1000 * 60 * 60)) / (1000 * 60))
      const confirmed = minutesSince > 2
      return NextResponse.json({
        status: confirmed ? 'confirmed' : 'pending',
        transactionHash: confirmed ? `0xNO_DB_${Date.now().toString(16)}` : null,
        confirmations: confirmed ? Math.floor(Math.random() * 10) + 1 : 0,
        blockNumber: confirmed ? Math.floor(Math.random() * 1_000_000) + 1_000_000 : null,
        timestamp: new Date().toISOString()
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
        status: 'expired',
        timestamp: paymentAddress.expiresAt.toISOString()
      })
    }

    // In a real implementation, you would check the blockchain here
    // For now, we'll simulate different statuses based on time
    const timeSinceCreated = Date.now() - paymentAddress.createdAt.getTime()
    const minutesSinceCreated = timeSinceCreated / (1000 * 60)

    let status = 'pending'
    let transactionHash = null
    let confirmations = 0
    let blockNumber = null

    // Simulate confirmation after 2 minutes
    if (minutesSinceCreated > 2 && paymentAddress.status === 'pending') {
      status = 'confirmed'
      transactionHash = `0x${paymentAddress.id.substring(0, 16)}${Date.now().toString(16)}`
      confirmations = Math.floor(Math.random() * 10) + 1
      blockNumber = Math.floor(Math.random() * 1000000) + 1000000

      // Update status in database
      await prisma.paymentAddress.update({
        where: { id: paymentAddress.id },
        data: { status: 'confirmed' }
      })
    }

    return NextResponse.json({
      status,
      transactionHash,
      confirmations,
      blockNumber,
      timestamp: paymentAddress.createdAt.toISOString()
    })
  } catch (error) {
    console.error('Error checking payment status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

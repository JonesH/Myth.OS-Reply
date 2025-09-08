import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/services/auth'
import { ThetaPaymentService } from '@/lib/services/theta'

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
        { error: 'Invalid payment amount. Must be 1 THETA (Basic) or 5 THETA (Premium)' },
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
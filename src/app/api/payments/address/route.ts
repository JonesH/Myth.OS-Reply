import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/services/auth'
import { ThetaPaymentService } from '@/lib/services/theta'

export const dynamic = 'force-dynamic'

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
      currency: 'THETA',
      instructions: 'Send THETA to this address to activate your subscription. 1 THETA = Basic Plan (30 days), 5 THETA = Premium Plan (30 days)'
    })
  } catch (error) {
    console.error('Error generating payment address:', error)
    return NextResponse.json(
      { error: 'Failed to generate payment address' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { ThetaPaymentService } from '@/lib/services/theta'

export async function GET(request: NextRequest) {
  try {
    const plans = ThetaPaymentService.getSubscriptionPlans()
    
    return NextResponse.json({
      plans,
      chainId: process.env.NEXT_PUBLIC_THETA_CHAIN_ID,
      currency: 'THETA'
    })
  } catch (error) {
    console.error('Error fetching payment plans:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment plans' },
      { status: 500 }
    )
  }
}
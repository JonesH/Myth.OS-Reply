import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { AuthService } from '@/lib/services/auth'

/**
 * @swagger
 * /api/subscriptions/plans:
 *   get:
 *     summary: Get available subscription plans
 *     tags: [Subscriptions]
 *     responses:
 *       200:
 *         description: Available plans retrieved successfully
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
 *                       name:
 *                         type: string
 *                       price:
 *                         type: number
 *                       currency:
 *                         type: string
 *                       features:
 *                         type: array
 *                         items:
 *                           type: string
 *                       dailyLimit:
 *                         type: integer
 *                       popular:
 *                         type: boolean
 */
export async function GET(request: NextRequest) {
  try {
    const plans = [
      {
        id: 'free',
        name: 'Free',
        price: 0,
        currency: 'THETA',
        dailyLimit: 10,
        features: [
          '10 AI replies per day limit',
          'Basic AI models only',
          'Limited automation features',
          'Basic analytics'
        ],
        popular: false,
        description: 'Perfect for trying out our service'
      },
      {
        id: 'basic',
        name: 'Basic',
        price: 90,
        currency: 'THETA',
        dailyLimit: 50,
        features: [
          '50 AI replies per day',
          'Standard AI models',
          'Full automation features',
          'Standard analytics',
          'Email support'
        ],
        popular: true,
        description: 'Most popular choice for regular users'
      },
      {
        id: 'premium',
        name: 'Premium',
        price: 240,
        currency: 'THETA',
        dailyLimit: 500,
        features: [
          '500 AI replies per day',
          'Advanced AI models',
          'Custom AI instructions',
          'Advanced analytics and insights',
          'Priority support features',
          'Custom integrations'
        ],
        popular: false,
        description: 'For power users and businesses'
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        price: 6000,
        currency: 'THETA',
        minPrice: 6000,
        maxPrice: 20000,
        dailyLimit: 5000,
        features: [
          '5000+ AI replies per day',
          'Premium AI models',
          'Custom AI instructions',
          'Advanced analytics and insights',
          'Priority support features',
          'Custom integrations',
          'Dedicated account manager',
          'Custom API access',
          'White-label solutions'
        ],
        popular: false,
        description: 'For large enterprises and organizations',
        isEnterprise: true
      }
    ]

    return NextResponse.json({ plans })
  } catch (error) {
    console.error('Error fetching plans:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

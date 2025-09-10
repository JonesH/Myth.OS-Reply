import { NextRequest } from 'next/server'
import { GET } from '@/app/api/payments/plans/route'
import { ThetaPaymentService } from '@/lib/services/theta'

// Mock external dependencies
jest.mock('@/lib/services/theta')

const mockedThetaPaymentService = ThetaPaymentService as jest.Mocked<typeof ThetaPaymentService>

describe('/api/payments/plans', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Set up environment variables for tests
    process.env.NEXT_PUBLIC_THETA_CHAIN_ID = '365'
  })

  describe('GET', () => {
    it('should return subscription plans successfully', async () => {
      // Arrange
      const mockPlans = [
        {
          id: 'basic',
          name: 'Basic Plan',
          priceInTheta: '1',
          durationDays: 30,
        },
        {
          id: 'premium',
          name: 'Premium Plan',
          priceInTheta: '5',
          durationDays: 30,
        }
      ]

      mockedThetaPaymentService.getSubscriptionPlans.mockReturnValue(mockPlans)

      const request = new NextRequest('http://localhost:3000/api/payments/plans')

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data).toEqual({
        plans: mockPlans,
        chainId: '365',
        currency: 'TFUEL'
      })
      
      expect(mockedThetaPaymentService.getSubscriptionPlans).toHaveBeenCalledTimes(1)
    })

    it('should handle missing environment variable gracefully', async () => {
      // Arrange
      delete process.env.NEXT_PUBLIC_THETA_CHAIN_ID
      
      const mockPlans = [
        {
          id: 'basic',
          name: 'Basic Plan',
          priceInTheta: '1',
          durationDays: 30,
        }
      ]

      mockedThetaPaymentService.getSubscriptionPlans.mockReturnValue(mockPlans)

      const request = new NextRequest('http://localhost:3000/api/payments/plans')

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data).toEqual({
        plans: mockPlans,
        chainId: undefined,
        currency: 'TFUEL'
      })
    })

    it('should return 500 when getSubscriptionPlans throws an error', async () => {
      // Arrange
      mockedThetaPaymentService.getSubscriptionPlans.mockImplementation(() => {
        throw new Error('Failed to fetch plans')
      })

      const request = new NextRequest('http://localhost:3000/api/payments/plans')

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data).toEqual({
        error: 'Failed to fetch payment plans'
      })
    })

    it('should handle empty plans array', async () => {
      // Arrange
      mockedThetaPaymentService.getSubscriptionPlans.mockReturnValue([])

      const request = new NextRequest('http://localhost:3000/api/payments/plans')

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data).toEqual({
        plans: [],
        chainId: '365',
        currency: 'TFUEL'
      })
    })

    it('should not require authentication (public endpoint)', async () => {
      // Arrange
      const mockPlans = [
        {
          id: 'basic',
          name: 'Basic Plan',
          priceInTheta: '1',
          durationDays: 30,
        }
      ]

      mockedThetaPaymentService.getSubscriptionPlans.mockReturnValue(mockPlans)

      // Request without authorization header
      const request = new NextRequest('http://localhost:3000/api/payments/plans')

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.plans).toEqual(mockPlans)
      // Should not require authentication - no auth service calls
    })
  })
})
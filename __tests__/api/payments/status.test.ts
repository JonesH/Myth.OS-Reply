import { NextRequest } from 'next/server'
import { GET } from '@/app/api/payments/status/route'
import { AuthService } from '@/lib/services/auth'
import { ThetaPaymentService } from '@/lib/services/theta'

// Mock external dependencies
jest.mock('@/lib/services/auth')
jest.mock('@/lib/services/theta')

const mockedAuthService = AuthService as jest.Mocked<typeof AuthService>
const mockedThetaPaymentService = ThetaPaymentService as jest.Mocked<typeof ThetaPaymentService>

describe('/api/payments/status', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should return subscription status for authenticated user', async () => {
      // Arrange
      const mockUser = { id: 'user123', email: 'test@example.com' }
      const mockAddress = '0x1234567890123456789012345678901234567890'
      const mockSubscription = {
        isActive: true,
        planType: 'basic',
        expiresAt: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25 days from now
        lastPayment: {
          hash: '0xabc123',
          from: '0xuser123',
          to: mockAddress,
          value: '1',
          blockNumber: BigInt(12345),
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
        }
      }
      
      mockedAuthService.validateToken.mockResolvedValue(mockUser)
      mockedThetaPaymentService.generateUserPaymentAddress.mockReturnValue(mockAddress)
      mockedThetaPaymentService.getUserSubscription.mockResolvedValue(mockSubscription)

      const request = new NextRequest('http://localhost:3000/api/payments/status', {
        headers: {
          'authorization': 'Bearer valid-token'
        }
      })

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data).toEqual({
        ...mockSubscription,
        paymentAddress: mockAddress,
        userId: mockUser.id
      })
      
      expect(mockedAuthService.validateToken).toHaveBeenCalledWith('valid-token')
      expect(mockedThetaPaymentService.getUserSubscription).toHaveBeenCalledWith('user123')
      expect(mockedThetaPaymentService.generateUserPaymentAddress).toHaveBeenCalledWith('user123')
    })

    it('should return inactive subscription status', async () => {
      // Arrange
      const mockUser = { id: 'user456', email: 'test2@example.com' }
      const mockAddress = '0x9876543210987654321098765432109876543210'
      const mockSubscription = {
        isActive: false,
        planType: null,
        expiresAt: null,
        lastPayment: null
      }
      
      mockedAuthService.validateToken.mockResolvedValue(mockUser)
      mockedThetaPaymentService.generateUserPaymentAddress.mockReturnValue(mockAddress)
      mockedThetaPaymentService.getUserSubscription.mockResolvedValue(mockSubscription)

      const request = new NextRequest('http://localhost:3000/api/payments/status', {
        headers: {
          'authorization': 'Bearer valid-token'
        }
      })

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data).toEqual({
        isActive: false,
        planType: null,
        expiresAt: null,
        lastPayment: null,
        paymentAddress: mockAddress,
        userId: mockUser.id
      })
    })

    it('should return 401 when no authorization header is provided', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/payments/status')

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data).toEqual({
        error: 'No token provided'
      })
    })

    it('should return 401 when authorization header is malformed', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/payments/status', {
        headers: {
          'authorization': 'Invalid token-format'
        }
      })

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data).toEqual({
        error: 'No token provided'
      })
    })

    it('should return 401 when token is invalid', async () => {
      // Arrange
      mockedAuthService.validateToken.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/payments/status', {
        headers: {
          'authorization': 'Bearer invalid-token'
        }
      })

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data).toEqual({
        error: 'Invalid token'
      })
      expect(mockedAuthService.validateToken).toHaveBeenCalledWith('invalid-token')
    })

    it('should return 500 when getUserSubscription fails', async () => {
      // Arrange
      const mockUser = { id: 'user123', email: 'test@example.com' }
      
      mockedAuthService.validateToken.mockResolvedValue(mockUser)
      mockedThetaPaymentService.getUserSubscription.mockRejectedValue(new Error('Blockchain error'))

      const request = new NextRequest('http://localhost:3000/api/payments/status', {
        headers: {
          'authorization': 'Bearer valid-token'
        }
      })

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data).toEqual({
        error: 'Failed to fetch subscription status'
      })
    })

    it('should return 500 when address generation fails', async () => {
      // Arrange
      const mockUser = { id: 'user123', email: 'test@example.com' }
      
      mockedAuthService.validateToken.mockResolvedValue(mockUser)
      mockedThetaPaymentService.generateUserPaymentAddress.mockImplementation(() => {
        throw new Error('Address generation failed')
      })

      const request = new NextRequest('http://localhost:3000/api/payments/status', {
        headers: {
          'authorization': 'Bearer valid-token'
        }
      })

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data).toEqual({
        error: 'Failed to fetch subscription status'
      })
    })

    it('should handle expired subscription correctly', async () => {
      // Arrange
      const mockUser = { id: 'user789', email: 'expired@example.com' }
      const mockAddress = '0xexpireduser123456789012345678901234'
      const expiredDate = new Date('2023-01-01T00:00:00Z') // Past date
      const mockSubscription = {
        isActive: false, // Should be false for expired subscription
        planType: 'premium',
        expiresAt: expiredDate,
        lastPayment: {
          hash: '0xexpired123',
          from: '0xexpireduser',
          to: mockAddress,
          value: '5',
          blockNumber: BigInt(10000),
          timestamp: new Date('2022-12-01T00:00:00Z')
        }
      }
      
      mockedAuthService.validateToken.mockResolvedValue(mockUser)
      mockedThetaPaymentService.generateUserPaymentAddress.mockReturnValue(mockAddress)
      mockedThetaPaymentService.getUserSubscription.mockResolvedValue(mockSubscription)

      const request = new NextRequest('http://localhost:3000/api/payments/status', {
        headers: {
          'authorization': 'Bearer valid-token'
        }
      })

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.isActive).toBe(false)
      expect(data.planType).toBe('premium')
      expect(new Date(data.expiresAt)).toEqual(expiredDate)
    })
  })
})
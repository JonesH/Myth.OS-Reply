import { NextRequest } from 'next/server'
import { POST } from '@/app/api/payments/verify/route'
import { AuthService } from '@/lib/services/auth'
import { ThetaPaymentService } from '@/lib/services/theta'

// Mock external dependencies
jest.mock('@/lib/services/auth')
jest.mock('@/lib/services/theta')

const mockedAuthService = AuthService as jest.Mocked<typeof AuthService>
const mockedThetaPaymentService = ThetaPaymentService as jest.Mocked<typeof ThetaPaymentService>

describe('/api/payments/verify', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST', () => {
    it('should verify payment and activate subscription successfully', async () => {
      // Arrange
      const mockUser = { id: 'user123', email: 'test@example.com' }
      const mockAddress = '0x1234567890123456789012345678901234567890'
      const mockTransaction = {
        hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        from: '0xsender123',
        to: mockAddress,
        value: '1', // 1 TFUEL for basic plan
        blockNumber: BigInt(12345),
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago (should still be active for 30-day plan)
      }
      const mockPlan = {
        id: 'basic',
        name: 'Basic Plan',
        priceInTheta: '1',
        durationDays: 30
      }
      
      mockedAuthService.validateToken.mockResolvedValue(mockUser)
      mockedThetaPaymentService.verifyTransaction.mockResolvedValue(mockTransaction)
      mockedThetaPaymentService.generateUserPaymentAddress.mockReturnValue(mockAddress)
      mockedThetaPaymentService.getPlanByAmount.mockReturnValue(mockPlan)

      const request = new NextRequest('http://localhost:3000/api/payments/verify', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
        })
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.transaction).toEqual(mockTransaction)
      expect(data.plan).toEqual(mockPlan)
      expect(data.subscription.isActive).toBe(true)
      expect(data.subscription.planType).toBe('basic')
      expect(data.message).toContain('Payment verified! Basic Plan activated')
      
      expect(mockedAuthService.validateToken).toHaveBeenCalledWith('valid-token')
      expect(mockedThetaPaymentService.verifyTransaction).toHaveBeenCalledWith('0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890')
      expect(mockedThetaPaymentService.generateUserPaymentAddress).toHaveBeenCalledWith('user123')
      expect(mockedThetaPaymentService.getPlanByAmount).toHaveBeenCalledWith('1')
    })

    it('should verify premium plan payment', async () => {
      // Arrange
      const mockUser = { id: 'user456', email: 'premium@example.com' }
      const mockAddress = '0x9876543210987654321098765432109876543210'
      const mockTransaction = {
        hash: '0xpremium123456789',
        from: '0xsender456',
        to: mockAddress,
        value: '5', // 5 TFUEL for premium plan
        blockNumber: BigInt(67890),
        timestamp: new Date('2024-12-01T00:00:00Z')
      }
      const mockPlan = {
        id: 'premium',
        name: 'Premium Plan',
        priceInTheta: '5',
        durationDays: 30
      }
      
      mockedAuthService.validateToken.mockResolvedValue(mockUser)
      mockedThetaPaymentService.verifyTransaction.mockResolvedValue(mockTransaction)
      mockedThetaPaymentService.generateUserPaymentAddress.mockReturnValue(mockAddress)
      mockedThetaPaymentService.getPlanByAmount.mockReturnValue(mockPlan)

      const request = new NextRequest('http://localhost:3000/api/payments/verify', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          txHash: '0xpremium123456789'
        })
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.plan.id).toBe('premium')
      expect(data.subscription.planType).toBe('premium')
    })

    it('should return 401 when no authorization header is provided', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/payments/verify', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          txHash: '0xabcdef123'
        })
      })

      // Act
      const response = await POST(request)
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

      const request = new NextRequest('http://localhost:3000/api/payments/verify', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer invalid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          txHash: '0xabcdef123'
        })
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data).toEqual({
        error: 'Invalid token'
      })
    })

    it('should return 400 when txHash is missing', async () => {
      // Arrange
      const mockUser = { id: 'user123', email: 'test@example.com' }
      mockedAuthService.validateToken.mockResolvedValue(mockUser)

      const request = new NextRequest('http://localhost:3000/api/payments/verify', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({})
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data).toEqual({
        error: 'Transaction hash is required'
      })
    })

    it('should return 400 when txHash is not a string', async () => {
      // Arrange
      const mockUser = { id: 'user123', email: 'test@example.com' }
      mockedAuthService.validateToken.mockResolvedValue(mockUser)

      const request = new NextRequest('http://localhost:3000/api/payments/verify', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          txHash: 12345 // Invalid type
        })
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data).toEqual({
        error: 'Transaction hash is required'
      })
    })

    it('should return 400 when transaction is not found', async () => {
      // Arrange
      const mockUser = { id: 'user123', email: 'test@example.com' }
      
      mockedAuthService.validateToken.mockResolvedValue(mockUser)
      mockedThetaPaymentService.verifyTransaction.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/payments/verify', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          txHash: '0xnonexistent123'
        })
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data).toEqual({
        error: 'Transaction not found or invalid'
      })
    })

    it('should return 400 when transaction was not sent to user payment address', async () => {
      // Arrange
      const mockUser = { id: 'user123', email: 'test@example.com' }
      const userAddress = '0x1234567890123456789012345678901234567890'
      const wrongAddress = '0x9999999999999999999999999999999999999999'
      const mockTransaction = {
        hash: '0xwrongtarget123',
        from: '0xsender123',
        to: wrongAddress, // Different address
        value: '1',
        blockNumber: BigInt(12345),
        timestamp: new Date()
      }
      
      mockedAuthService.validateToken.mockResolvedValue(mockUser)
      mockedThetaPaymentService.verifyTransaction.mockResolvedValue(mockTransaction)
      mockedThetaPaymentService.generateUserPaymentAddress.mockReturnValue(userAddress)

      const request = new NextRequest('http://localhost:3000/api/payments/verify', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          txHash: '0xwrongtarget123'
        })
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data).toEqual({
        error: 'Transaction was not sent to your payment address'
      })
    })

    it('should return 400 when payment amount is invalid', async () => {
      // Arrange
      const mockUser = { id: 'user123', email: 'test@example.com' }
      const mockAddress = '0x1234567890123456789012345678901234567890'
      const mockTransaction = {
        hash: '0xinvalidamount123',
        from: '0xsender123',
        to: mockAddress,
        value: '0.5', // Invalid amount (not 1 or 5 TFUEL)
        blockNumber: BigInt(12345),
        timestamp: new Date()
      }
      
      mockedAuthService.validateToken.mockResolvedValue(mockUser)
      mockedThetaPaymentService.verifyTransaction.mockResolvedValue(mockTransaction)
      mockedThetaPaymentService.generateUserPaymentAddress.mockReturnValue(mockAddress)
      mockedThetaPaymentService.getPlanByAmount.mockReturnValue(null) // No plan for this amount

      const request = new NextRequest('http://localhost:3000/api/payments/verify', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          txHash: '0xinvalidamount123'
        })
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data).toEqual({
        error: 'Invalid payment amount. Must be 1 TFUEL (Basic) or 5 TFUEL (Premium)'
      })
    })

    it('should return 500 when transaction verification fails', async () => {
      // Arrange
      const mockUser = { id: 'user123', email: 'test@example.com' }
      
      mockedAuthService.validateToken.mockResolvedValue(mockUser)
      mockedThetaPaymentService.verifyTransaction.mockRejectedValue(new Error('Blockchain error'))

      const request = new NextRequest('http://localhost:3000/api/payments/verify', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          txHash: '0xblockchainerror123'
        })
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data).toEqual({
        error: 'Failed to verify payment'
      })
    })

    it('should calculate correct expiry date for subscription', async () => {
      // Arrange
      const mockUser = { id: 'user123', email: 'test@example.com' }
      const mockAddress = '0x1234567890123456789012345678901234567890'
      const transactionDate = new Date('2024-12-01T12:00:00Z')
      const mockTransaction = {
        hash: '0xexpirytest123',
        from: '0xsender123',
        to: mockAddress,
        value: '1',
        blockNumber: BigInt(12345),
        timestamp: transactionDate
      }
      const mockPlan = {
        id: 'basic',
        name: 'Basic Plan',
        priceInTheta: '1',
        durationDays: 30
      }
      
      mockedAuthService.validateToken.mockResolvedValue(mockUser)
      mockedThetaPaymentService.verifyTransaction.mockResolvedValue(mockTransaction)
      mockedThetaPaymentService.generateUserPaymentAddress.mockReturnValue(mockAddress)
      mockedThetaPaymentService.getPlanByAmount.mockReturnValue(mockPlan)

      const request = new NextRequest('http://localhost:3000/api/payments/verify', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          txHash: '0xexpirytest123'
        })
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      
      // Calculate expected expiry date (30 days from transaction timestamp)
      const expectedExpiry = new Date(transactionDate.getTime() + (30 * 24 * 60 * 60 * 1000))
      expect(new Date(data.subscription.expiresAt)).toEqual(expectedExpiry)
    })
  })
})
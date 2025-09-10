import { NextRequest } from 'next/server'
import { GET } from '@/app/api/payments/address/route'
import { AuthService } from '@/lib/services/auth'
import { ThetaPaymentService } from '@/lib/services/theta'

// Mock external dependencies
jest.mock('@/lib/services/auth')
jest.mock('@/lib/services/theta')

const mockedAuthService = AuthService as jest.Mocked<typeof AuthService>
const mockedThetaPaymentService = ThetaPaymentService as jest.Mocked<typeof ThetaPaymentService>

describe('/api/payments/address', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Set up environment variables for tests
    process.env.NEXT_PUBLIC_THETA_CHAIN_ID = '365'
  })

  describe('GET', () => {
    it('should return payment address for authenticated user', async () => {
      // Arrange
      const mockUser = { id: 'user123', email: 'test@example.com' }
      const mockAddress = '0x1234567890123456789012345678901234567890'
      
      mockedAuthService.validateToken.mockResolvedValue(mockUser)
      mockedThetaPaymentService.generateUserPaymentAddress.mockReturnValue(mockAddress)

      const request = new NextRequest('http://localhost:3000/api/payments/address', {
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
        paymentAddress: mockAddress,
        userId: mockUser.id,
        chainId: '365',
        currency: 'TFUEL',
        instructions: 'Send TFUEL (Theta native gas token) to this address to activate your subscription. 1 TFUEL = Basic (30 days), 5 TFUEL = Premium (30 days). You need a small amount of TFUEL to cover gas when sending from your wallet.'
      })
      
      expect(mockedAuthService.validateToken).toHaveBeenCalledWith('valid-token')
      expect(mockedThetaPaymentService.generateUserPaymentAddress).toHaveBeenCalledWith('user123')
    })

    it('should return 401 when no authorization header is provided', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/payments/address')

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
      const request = new NextRequest('http://localhost:3000/api/payments/address', {
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

      const request = new NextRequest('http://localhost:3000/api/payments/address', {
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

    it('should return 500 when address generation fails', async () => {
      // Arrange
      const mockUser = { id: 'user123', email: 'test@example.com' }
      
      mockedAuthService.validateToken.mockResolvedValue(mockUser)
      mockedThetaPaymentService.generateUserPaymentAddress.mockImplementation(() => {
        throw new Error('Address generation failed')
      })

      const request = new NextRequest('http://localhost:3000/api/payments/address', {
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
        error: 'Failed to generate payment address'
      })
    })

    it('should return 500 when auth service throws an error', async () => {
      // Arrange
      mockedAuthService.validateToken.mockRejectedValue(new Error('Auth service error'))

      const request = new NextRequest('http://localhost:3000/api/payments/address', {
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
        error: 'Failed to generate payment address'
      })
    })
  })
})
import { AuthService } from '@/lib/services/auth'
import { prisma } from '@/lib/database'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// Mock the database
jest.mock('@/lib/database', () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}))

// Mock bcrypt
jest.mock('bcryptjs')
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>

// Mock jsonwebtoken
jest.mock('jsonwebtoken')
const mockedJwt = jwt as jest.Mocked<typeof jwt>

describe('AuthService', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    password: 'hashedpassword123',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockToken = 'mock-jwt-token'

  beforeEach(() => {
    jest.clearAllMocks()
    // Set default JWT mock behavior
    mockedJwt.sign.mockReturnValue(mockToken as any)
    mockedJwt.verify.mockReturnValue({ userId: mockUser.id, email: mockUser.email } as any)
  })

  describe('register', () => {
    const registerData = {
      email: 'newuser@example.com',
      username: 'newuser',
      password: 'password123',
    }

    it('should register a new user successfully', async () => {
      // Setup mocks
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null) // No existing user
      mockedBcrypt.hash.mockResolvedValue('hashed-password' as never)
      ;(prisma.user.create as jest.Mock).mockResolvedValue({
        ...mockUser,
        email: registerData.email,
        username: registerData.username,
      })

      const result = await AuthService.register(registerData)

      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: registerData.email,
          username: registerData.username,
        },
        token: mockToken,
      })

      // Verify bcrypt was called with correct params
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(registerData.password, 12)

      // Verify JWT was signed with correct payload
      expect(mockedJwt.sign).toHaveBeenCalledWith(
        { userId: mockUser.id, email: registerData.email },
        expect.any(String),
        { expiresIn: '7d' }
      )

      // Verify user was created in database
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: registerData.email,
          username: registerData.username,
          password: 'hashed-password',
        },
      })
    })

    it('should throw error if user already exists by email', async () => {
      const existingUser = { ...mockUser, email: registerData.email }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(existingUser)

      await expect(AuthService.register(registerData)).rejects.toThrow(
        'User with this email or username already exists'
      )

      expect(prisma.user.create).not.toHaveBeenCalled()
    })

    it('should throw error if user already exists by username', async () => {
      const existingUser = { ...mockUser, username: registerData.username }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(existingUser)

      await expect(AuthService.register(registerData)).rejects.toThrow(
        'User with this email or username already exists'
      )

      expect(prisma.user.create).not.toHaveBeenCalled()
    })

    it('should query for existing users with OR condition', async () => {
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)
      mockedBcrypt.hash.mockResolvedValue('hashed' as never)
      ;(prisma.user.create as jest.Mock).mockResolvedValue(mockUser)

      await AuthService.register(registerData)

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { email: registerData.email },
            { username: registerData.username }
          ]
        }
      })
    })
  })

  describe('login', () => {
    const loginData = {
      emailOrUsername: 'test@example.com',
      password: 'password123',
    }

    it('should login with email successfully', async () => {
      // Setup mocks
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser)
      mockedBcrypt.compare.mockResolvedValue(true as never)

      const result = await AuthService.login(loginData)

      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          username: mockUser.username,
        },
        token: mockToken,
      })

      // Verify password comparison
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(loginData.password, mockUser.password)

      // Verify JWT was signed
      expect(mockedJwt.sign).toHaveBeenCalledWith(
        { userId: mockUser.id, email: mockUser.email },
        expect.any(String),
        { expiresIn: '7d' }
      )
    })

    it('should login with username successfully', async () => {
      const loginWithUsername = { ...loginData, emailOrUsername: 'testuser' }
      
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser)
      mockedBcrypt.compare.mockResolvedValue(true as never)

      const result = await AuthService.login(loginWithUsername)

      expect(result.user.username).toBe(mockUser.username)
    })

    it('should query for user with OR condition for email/username', async () => {
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser)
      mockedBcrypt.compare.mockResolvedValue(true as never)

      await AuthService.login(loginData)

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { email: loginData.emailOrUsername },
            { username: loginData.emailOrUsername }
          ]
        }
      })
    })

    it('should throw error if user not found', async () => {
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)

      await expect(AuthService.login(loginData)).rejects.toThrow('Invalid credentials')

      expect(mockedBcrypt.compare).not.toHaveBeenCalled()
    })

    it('should throw error if password is invalid', async () => {
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser)
      mockedBcrypt.compare.mockResolvedValue(false as never) // Wrong password

      await expect(AuthService.login(loginData)).rejects.toThrow('Invalid credentials')
    })
  })

  describe('validateToken', () => {
    it('should validate valid token and return user', async () => {
      const mockDecoded = { userId: mockUser.id, email: mockUser.email }
      
      mockedJwt.verify.mockReturnValue(mockDecoded as any)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

      const result = await AuthService.validateToken(mockToken)

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
      })

      expect(mockedJwt.verify).toHaveBeenCalledWith(mockToken, expect.any(String))
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id }
      })
    })

    it('should return null if JWT verification fails', async () => {
      mockedJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token')
      })

      const result = await AuthService.validateToken('invalid-token')

      expect(result).toBeNull()
      expect(prisma.user.findUnique).not.toHaveBeenCalled()
    })

    it('should return null if user not found in database', async () => {
      const mockDecoded = { userId: 'non-existent-user', email: 'test@example.com' }
      
      mockedJwt.verify.mockReturnValue(mockDecoded as any)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await AuthService.validateToken(mockToken)

      expect(result).toBeNull()
    })

    it('should handle database errors gracefully', async () => {
      const mockDecoded = { userId: mockUser.id, email: mockUser.email }
      
      mockedJwt.verify.mockReturnValue(mockDecoded as any)
      ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'))

      const result = await AuthService.validateToken(mockToken)

      expect(result).toBeNull()
    })
  })

  describe('getUserFromToken', () => {
    it('should return user if token is valid', async () => {
      const mockDecoded = { userId: mockUser.id, email: mockUser.email }
      
      mockedJwt.verify.mockReturnValue(mockDecoded as any)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

      const result = await AuthService.getUserFromToken(mockToken)

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
      })
    })

    it('should throw error if token is invalid', async () => {
      mockedJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token')
      })

      await expect(AuthService.getUserFromToken('invalid-token')).rejects.toThrow('Invalid token')
    })

    it('should throw error if user not found', async () => {
      const mockDecoded = { userId: 'non-existent-user', email: 'test@example.com' }
      
      mockedJwt.verify.mockReturnValue(mockDecoded as any)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(AuthService.getUserFromToken(mockToken)).rejects.toThrow('Invalid token')
    })
  })

  describe('Environment variable handling', () => {
    it('should use JWT_SECRET from environment', async () => {
      const originalEnv = process.env.JWT_SECRET
      process.env.JWT_SECRET = 'test-secret'

      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)
      mockedBcrypt.hash.mockResolvedValue('hashed' as never)
      ;(prisma.user.create as jest.Mock).mockResolvedValue(mockUser)

      await AuthService.register({
        email: 'test@example.com',
        username: 'test',
        password: 'password',
      })

      expect(mockedJwt.sign).toHaveBeenCalledWith(
        expect.any(Object),
        'test-secret',
        expect.any(Object)
      )

      // Restore original environment
      process.env.JWT_SECRET = originalEnv
    })

    it('should fallback to default secret if JWT_SECRET not set', async () => {
      const originalEnv = process.env.JWT_SECRET
      delete process.env.JWT_SECRET

      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)
      mockedBcrypt.hash.mockResolvedValue('hashed' as never)
      ;(prisma.user.create as jest.Mock).mockResolvedValue(mockUser)

      await AuthService.register({
        email: 'test@example.com',
        username: 'test',
        password: 'password',
      })

      expect(mockedJwt.sign).toHaveBeenCalledWith(
        expect.any(Object),
        'your-secret-key', // Default fallback
        expect.any(Object)
      )

      // Restore original environment
      process.env.JWT_SECRET = originalEnv
    })
  })
})
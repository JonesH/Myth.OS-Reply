import { NextRequest } from 'next/server'
import { POST as registerPOST } from '@/app/api/auth/register/route'
import { POST as loginPOST } from '@/app/api/auth/login/route'
import { GET as validateGET } from '@/app/api/auth/validate/route'
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

describe('Authentication API Routes', () => {
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
    // Set up default JWT mock
    mockedJwt.sign.mockReturnValue(mockToken as any)
  })

  describe('POST /api/auth/register', () => {
    const validRegisterData = {
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
        email: validRegisterData.email,
        username: validRegisterData.username,
      })

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(validRegisterData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await registerPOST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.user).toEqual({
        id: mockUser.id,
        email: validRegisterData.email,
        username: validRegisterData.username,
      })
      expect(data.token).toBe(mockToken)
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: validRegisterData.email,
          username: validRegisterData.username,
          password: 'hashed-password',
        },
      })
    })

    it('should return 400 for missing required fields', async () => {
      const incompleteData = { email: 'test@example.com' } // Missing username and password

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(incompleteData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await registerPOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Email, username, and password are required')
    })

    it('should return 400 for password too short', async () => {
      const shortPasswordData = {
        ...validRegisterData,
        password: '123', // Too short
      }

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(shortPasswordData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await registerPOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Password must be at least 6 characters long')
    })

    it('should return 409 for existing user', async () => {
      // Setup mock to return existing user
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser)

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(validRegisterData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await registerPOST(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toContain('already exists')
    })

    it('should return 500 for internal server error', async () => {
      // Setup mock to throw unexpected error
      ;(prisma.user.findFirst as jest.Mock).mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(validRegisterData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await registerPOST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })

  describe('POST /api/auth/login', () => {
    const validLoginData = {
      emailOrUsername: 'test@example.com',
      password: 'password123',
    }

    it('should login user with email successfully', async () => {
      // Setup mocks
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser)
      mockedBcrypt.compare.mockResolvedValue(true as never)

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(validLoginData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await loginPOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
      })
      expect(data.token).toBe(mockToken)
    })

    it('should login user with username successfully', async () => {
      const loginWithUsername = {
        emailOrUsername: 'testuser',
        password: 'password123',
      }

      // Setup mocks
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser)
      mockedBcrypt.compare.mockResolvedValue(true as never)

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginWithUsername),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await loginPOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.user.username).toBe(mockUser.username)
    })

    it('should return 400 for missing credentials', async () => {
      const incompleteData = { emailOrUsername: 'test@example.com' } // Missing password

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(incompleteData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await loginPOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Email/username and password are required')
    })

    it('should return 401 for non-existent user', async () => {
      // Setup mock to return no user
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(validLoginData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await loginPOST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Invalid credentials')
    })

    it('should return 401 for wrong password', async () => {
      // Setup mocks
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser)
      mockedBcrypt.compare.mockResolvedValue(false as never) // Wrong password

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(validLoginData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await loginPOST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Invalid credentials')
    })
  })

  describe('GET /api/auth/validate', () => {
    it('should validate valid token successfully', async () => {
      const mockDecoded = { userId: mockUser.id, email: mockUser.email }
      
      // Setup mocks
      mockedJwt.verify.mockReturnValue(mockDecoded as any)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

      const request = new NextRequest('http://localhost:3000/api/auth/validate', {
        method: 'GET',
      })
      
      // Mock the headers.get method to return our token
      jest.spyOn(request.headers, 'get').mockImplementation((headerName: string) => {
        if (headerName.toLowerCase() === 'authorization') {
          return `Bearer ${mockToken}`
        }
        return null
      })

      const response = await validateGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
      })
    })

    it('should return 401 for missing token', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/validate', {
        method: 'GET',
      })

      const response = await validateGET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('No token provided')
    })

    it('should return 401 for invalid token', async () => {
      // Setup mock to throw JWT error
      mockedJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token')
      })

      const request = new NextRequest('http://localhost:3000/api/auth/validate', {
        method: 'GET',
      })
      
      // Mock the headers.get method to return invalid token
      jest.spyOn(request.headers, 'get').mockImplementation((headerName: string) => {
        if (headerName.toLowerCase() === 'authorization') {
          return 'Bearer invalid-token'
        }
        return null
      })

      const response = await validateGET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Invalid token')
    })

    it('should return 401 for valid token but non-existent user', async () => {
      const mockDecoded = { userId: 'non-existent-user', email: 'test@example.com' }
      
      // Setup mocks
      mockedJwt.verify.mockReturnValue(mockDecoded as any)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null) // User not found

      const request = new NextRequest('http://localhost:3000/api/auth/validate', {
        method: 'GET',
      })
      
      // Mock the headers.get method to return our token
      jest.spyOn(request.headers, 'get').mockImplementation((headerName: string) => {
        if (headerName.toLowerCase() === 'authorization') {
          return `Bearer ${mockToken}`
        }
        return null
      })

      const response = await validateGET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Invalid token')
    })
  })
})
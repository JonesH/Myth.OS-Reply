// Global Jest setup for MythosReply tests

// Mock Next.js specific modules
jest.mock('next/server', () => {
  class MockNextRequest {
    url: string
    headers: Map<string, string>
    method: string
    body: any

    constructor(url: string, init?: any) {
      this.url = url
      this.method = init?.method || 'GET'
      this.body = init?.body || '{}'
      
      // Create a proper Headers-like object with get method
      this.headers = {
        get: jest.fn((name: string) => {
          const headers = init?.headers || {}
          return headers[name.toLowerCase()] || null
        }),
        has: jest.fn((name: string) => {
          const headers = init?.headers || {}
          return headers[name.toLowerCase()] !== undefined
        }),
        set: jest.fn(),
        delete: jest.fn(),
        forEach: jest.fn(),
        entries: jest.fn(),
        keys: jest.fn(),
        values: jest.fn()
      } as any
    }

    async json() {
      try {
        return JSON.parse(this.body)
      } catch {
        return {}
      }
    }
  }

  return {
    NextRequest: MockNextRequest,
    NextResponse: {
      json: jest.fn().mockImplementation((data: any, init?: any) => ({
        status: init?.status || 200,
        json: jest.fn().mockResolvedValue(data),
        ...init
      }))
    }
  }
})

// Mock environment variables
process.env = {
  ...process.env,
  THETA_TESTNET_RPC_URL: 'https://eth-rpc-api-testnet.thetatoken.org/rpc',
  NEXT_PUBLIC_THETA_CHAIN_ID: '365',
  THETA_MASTER_SEED: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
}

// Global console suppress for tests (optional)
// Uncomment if you want to suppress console logs during tests
// global.console = {
//   ...console,
//   log: jest.fn(),
//   error: jest.fn(),
//   warn: jest.fn(),
//   info: jest.fn(),
//   debug: jest.fn(),
// }

// Mock fetch globally for API calls
global.fetch = jest.fn()

// Mock crypto module methods
jest.mock('crypto', () => ({
  createHash: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue('mockedHashValue')
  }))
}))

// Export mock utilities for tests
export const createMockRequest = (url: string, options: any = {}) => {
  const { NextRequest } = require('next/server')
  return new NextRequest(url, options)
}

export const createMockResponse = (data: any, status: number = 200) => {
  const { NextResponse } = require('next/server')
  return NextResponse.json(data, { status })
}

// Common test utilities
export const mockUser = {
  id: 'test-user-123',
  email: 'test@example.com'
}

export const mockThetaAddress = '0x1234567890123456789012345678901234567890'

export const mockTransaction = {
  hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
  from: '0xsender123456789012345678901234567890123456',
  to: mockThetaAddress,
  value: '1',
  blockNumber: BigInt(12345),
  timestamp: new Date('2024-12-01T00:00:00Z')
}

export const mockBasicPlan = {
  id: 'basic',
  name: 'Basic Plan',
  priceInTheta: '1',
  durationDays: 30
}

export const mockPremiumPlan = {
  id: 'premium',
  name: 'Premium Plan',
  priceInTheta: '5',
  durationDays: 30
}

// Test helper for mocking authenticated requests
export const createAuthenticatedRequest = (url: string, token: string = 'valid-token', options: any = {}) => {
  const { NextRequest } = require('next/server')
  return new NextRequest(url, {
    ...options,
    headers: {
      'authorization': `Bearer ${token}`,
      'content-type': 'application/json',
      ...options.headers
    }
  })
}

// Test helper for creating POST requests with JSON body
export const createPostRequest = (url: string, body: any, options: any = {}) => {
  const { NextRequest } = require('next/server')
  return new NextRequest(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...options.headers
    },
    body: JSON.stringify(body),
    ...options
  })
}

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks()
})
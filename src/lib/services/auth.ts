import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
// Removed prisma import - using demo mode only

const getJWTSecret = () => {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    console.error('❌ JWT_SECRET environment variable is not set!')
    throw new Error('JWT_SECRET environment variable is required')
  }
  return secret
}

export interface AuthUser {
  id: string
  email: string
  username: string
}

export interface RegisterData {
  email: string
  username: string
  password: string
}

export interface LoginData {
  emailOrUsername: string
  password: string
}

// Demo user data (no database needed)
const DEMO_USERS = [
  {
    id: 'demo-user-1',
    email: 'demo@mythosreply.com',
    username: 'demo_user',
    password: '$2a$12$demo.hash.for.demo.mode.only', // bcrypt hash for 'demo'
    subscriptionPlan: 'premium',
    subscriptionStatus: 'active',
    dailyReplyLimit: 500,
  },
  {
    id: 'test-user-1', 
    email: 'test@example.com',
    username: 'testuser',
    password: '$2a$12$test.hash.for.demo.mode.only', // bcrypt hash for 'test123'
    subscriptionPlan: 'basic',
    subscriptionStatus: 'active',
    dailyReplyLimit: 50,
  }
]

export class AuthService {
  private static isDemoMode() {
    // Always true for now - no database mode
    return true
  }

  static async getOrCreateDemoUser(): Promise<AuthUser> {
    const demoUser = DEMO_USERS[0]
    return { 
      id: demoUser.id, 
      email: demoUser.email, 
      username: demoUser.username 
    }
  }
  static async register(data: RegisterData): Promise<{ user: AuthUser; token: string }> {
    const { email, username, password } = data

    // In demo mode, always succeed and return demo user
    const demoUser = DEMO_USERS[0]
    
    // Generate token
    const token = jwt.sign(
      { userId: demoUser.id, email: demoUser.email },
      getJWTSecret(),
      { expiresIn: '7d' }
    )

    return {
      user: {
        id: demoUser.id,
        email: demoUser.email,
        username: demoUser.username
      },
      token
    }
  }

  static async login(data: LoginData): Promise<{ user: AuthUser; token: string }> {
    const { emailOrUsername, password } = data

    // In demo mode, find matching demo user or return first demo user
    let matchedUser = DEMO_USERS.find(user => 
      user.email === emailOrUsername || user.username === emailOrUsername
    )
    
    // If no match found, use default demo user
    if (!matchedUser) {
      matchedUser = DEMO_USERS[0]
    }

    // Generate token
    const token = jwt.sign(
      { userId: matchedUser.id, email: matchedUser.email },
      getJWTSecret(),
      { expiresIn: '7d' }
    )

    return {
      user: {
        id: matchedUser.id,
        email: matchedUser.email,
        username: matchedUser.username
      },
      token
    }
  }

  static async validateToken(token: string): Promise<AuthUser | null> {
    try {
      const decoded = jwt.verify(token, getJWTSecret()) as any
      
      // Find demo user by ID
      const matchedUser = DEMO_USERS.find(user => user.id === decoded.userId)
      if (!matchedUser) {
        // Fallback to first demo user
        const demoUser = DEMO_USERS[0]
        return {
          id: demoUser.id,
          email: demoUser.email,
          username: demoUser.username
        }
      }

      return {
        id: matchedUser.id,
        email: matchedUser.email,
        username: matchedUser.username
      }
    } catch (error) {
      // Always fall back to demo user in demo mode
      const demoUser = DEMO_USERS[0]
      return {
        id: demoUser.id,
        email: demoUser.email,
        username: demoUser.username
      }
    }
  }

  static async getUserFromToken(token: string): Promise<AuthUser> {
    const user = await this.validateToken(token)
    if (user) return user
    // Always return demo user as fallback
    return this.getOrCreateDemoUser()
  }
}

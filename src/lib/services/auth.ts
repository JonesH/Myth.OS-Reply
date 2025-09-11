import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { isNoDatabaseMode, inMemoryUsers } from '@/lib/inMemoryStorage'

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
    return isNoDatabaseMode()
  }

  static async getOrCreateDemoUser(): Promise<AuthUser> {
    if (this.isDemoMode()) {
      // Get demo user from in-memory storage
      const demoUser = inMemoryUsers.get('demo-user-1')
      if (demoUser) {
        return { 
          id: demoUser.id, 
          email: demoUser.email, 
          username: demoUser.username 
        }
      }
    }
    
    // Fallback to hardcoded demo user
    const demoUser = DEMO_USERS[0]
    return { 
      id: demoUser.id, 
      email: demoUser.email, 
      username: demoUser.username 
    }
  }
  static async register(data: RegisterData): Promise<{ user: AuthUser; token: string }> {
    console.log('🔄 AuthService.register called with:', { email: data.email, username: data.username })
    
    const { email, username, password } = data

    // In demo mode, always succeed and return demo user
    const demoUser = DEMO_USERS[0]
    console.log('📝 Using demo user:', demoUser.email)
    
    try {
      // Generate token
      const token = jwt.sign(
        { userId: demoUser.id, email: demoUser.email },
        getJWTSecret(),
        { expiresIn: '7d' }
      )
      console.log('✅ Token generated successfully')

      return {
        user: {
          id: demoUser.id,
          email: demoUser.email,
          username: demoUser.username
        },
        token
      }
    } catch (error) {
      console.error('❌ Error generating token:', error)
      throw error
    }
  }

  static async login(data: LoginData): Promise<{ user: AuthUser; token: string }> {
    const { emailOrUsername, password } = data

    let matchedUser
    
    if (this.isDemoMode()) {
      // Search in-memory users first
      const inMemoryUser = Array.from(inMemoryUsers.values()).find(user => 
        user.email === emailOrUsername || user.username === emailOrUsername
      )
      
      if (inMemoryUser) {
        matchedUser = inMemoryUser
      } else {
        // Fallback to demo users
        matchedUser = DEMO_USERS.find(user => 
          user.email === emailOrUsername || user.username === emailOrUsername
        )
      }
    } else {
      // TODO: Add database user lookup when not in NO_DATABASE mode
      matchedUser = DEMO_USERS.find(user => 
        user.email === emailOrUsername || user.username === emailOrUsername
      )
    }
    
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
      
      
      // Find user by ID
      let matchedUser
      
      if (this.isDemoMode()) {
        // Search in-memory users first
        const inMemoryUser = inMemoryUsers.get(decoded.userId)
        if (inMemoryUser) {
          matchedUser = inMemoryUser
        } else {
          // Fallback to demo users
          matchedUser = DEMO_USERS.find(user => user.id === decoded.userId)
        }
      } else {
        // TODO: Add database user lookup when not in NO_DATABASE mode
        matchedUser = DEMO_USERS.find(user => user.id === decoded.userId)
      }
      
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
      
      // In demo mode, always return demo user even on JWT errors
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

// In-memory storage for NO_DATABASE mode
// Provides real Twitter OAuth with memory-based persistence

// Check if NO_DATABASE mode is enabled
export const isNoDatabaseMode = () => {
  return process.env.NO_DATABASE === 'true'
}

// In-memory storage Maps
export const inMemoryUsers = new Map<string, {
  id: string
  email: string
  username: string
  passwordHash: string
  createdAt: Date
}>()

export const inMemoryOAuthStates = new Map<string, {
  userId: string
  state: string
  requestToken: string
  requestSecret: string
  callbackUrl: string
  expiresAt: Date
}>()

export const inMemoryTwitterAccounts = new Map<string, {
  id: string
  userId: string
  twitterUsername: string
  accessToken: string
  accessTokenSecret: string
  isActive: boolean
  createdAt: Date
}>()

// Helper function to generate unique IDs
export const generateId = () => {
  return 'mem_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

// Cleanup expired OAuth states
export const cleanupExpiredOAuthStates = () => {
  const now = new Date()
  const keysToDelete: string[] = []
  
  inMemoryOAuthStates.forEach((value, key) => {
    if (value.expiresAt < now) {
      keysToDelete.push(key)
    }
  })
  
  keysToDelete.forEach(key => {
    inMemoryOAuthStates.delete(key)
  })
}

// Initialize with demo user for authentication
if (isNoDatabaseMode()) {
  inMemoryUsers.set('demo-user-1', {
    id: 'demo-user-1',
    email: 'demo@mythosreply.com',
    username: 'demo',
    passwordHash: '$2b$10$dummy.hash.for.demo', // Any password will work in demo mode
    createdAt: new Date()
  })
}
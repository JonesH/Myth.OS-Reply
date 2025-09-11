import { prisma } from '@/lib/database'
import { AuthUser } from '@/lib/services/auth'
import { isNoDatabaseMode } from '@/lib/inMemoryStorage'

/**
 * Ensures a user exists in the database, creating them if they don't exist
 * This is needed for demo mode where users are created in memory but not in the database
 */
export async function ensureUserExists(user: AuthUser) {
  if (isNoDatabaseMode()) {
    // In no-database mode, do nothing and return a minimal shape
    return {
      id: user.id,
      email: user.email,
      username: user.username,
    } as any
  }
  const existingUser = await prisma.user.findUnique({
    where: { id: user.id }
  })

  if (!existingUser) {
    // Create user in database with a default password hash
    await prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        password: '$2a$12$demo.hash.for.demo.mode.only', // Default demo password hash
        subscriptionPlan: 'free',
        subscriptionStatus: 'active',
        dailyReplyLimit: 10,
        repliesUsedToday: 0,
        lastUsageReset: new Date()
      }
    })
  }

  return existingUser || await prisma.user.findUnique({
    where: { id: user.id }
  })
}

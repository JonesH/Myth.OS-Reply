import { prisma } from '@/lib/database'
import { AuthUser } from '@/lib/services/auth'

/**
 * Ensures a user exists in the database, creating them if they don't exist
 * This is needed for demo mode where users are created in memory but not in the database
 */
export async function ensureUserExists(user: AuthUser) {
  const existingUser = await prisma.user.findUnique({
    where: { id: user.id }
  })

  if (!existingUser) {
    // Create user in database
    await prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
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

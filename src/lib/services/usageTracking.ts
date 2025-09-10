import { prisma } from '@/lib/database'

export interface UsageLimit {
  canUseFeature: boolean
  remainingUsage: number
  dailyLimit: number
  resetTime: Date
}

export class UsageTrackingService {
  /**
   * Check if user can use a feature based on their subscription and daily limits
   */
  static async checkUsageLimit(userId: string, feature: 'reply' | 'ai_generation'): Promise<UsageLimit> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Check if subscription is active
    if (user.subscriptionStatus !== 'active') {
      return {
        canUseFeature: false,
        remainingUsage: 0,
        dailyLimit: user.dailyReplyLimit,
        resetTime: new Date()
      }
    }

    // Reset daily usage if it's a new day
    const now = new Date()
    const lastReset = new Date(user.lastUsageReset)
    const isNewDay = now.toDateString() !== lastReset.toDateString()

    if (isNewDay) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          repliesUsedToday: 0,
          lastUsageReset: now
        }
      })
      user.repliesUsedToday = 0
    }

    const remainingUsage = Math.max(0, user.dailyReplyLimit - user.repliesUsedToday)
    const canUseFeature = remainingUsage > 0

    // Calculate next reset time (midnight tomorrow)
    const resetTime = new Date()
    resetTime.setDate(resetTime.getDate() + 1)
    resetTime.setHours(0, 0, 0, 0)

    return {
      canUseFeature,
      remainingUsage,
      dailyLimit: user.dailyReplyLimit,
      resetTime
    }
  }

  /**
   * Increment usage count for a user
   */
  static async incrementUsage(userId: string, feature: 'reply' | 'ai_generation'): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Check if we need to reset daily usage
    const now = new Date()
    const lastReset = new Date(user.lastUsageReset)
    const isNewDay = now.toDateString() !== lastReset.toDateString()

    const newUsageCount = isNewDay ? 1 : user.repliesUsedToday + 1

    await prisma.user.update({
      where: { id: userId },
      data: {
        repliesUsedToday: newUsageCount,
        lastUsageReset: isNewDay ? now : user.lastUsageReset
      }
    })

    // Record usage in tracking table
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    await prisma.usageTracking.upsert({
      where: {
        userId_date: {
          userId,
          date: today
        }
      },
      update: {
        repliesUsed: {
          increment: 1
        }
      },
      create: {
        userId,
        date: today,
        repliesUsed: 1,
        aiGenerations: feature === 'ai_generation' ? 1 : 0
      }
    })
  }

  /**
   * Get usage statistics for a user
   */
  static async getUserUsageStats(userId: string, days: number = 30) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const usageStats = await prisma.usageTracking.findMany({
      where: {
        userId,
        date: {
          gte: startDate
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    return {
      currentPlan: user?.subscriptionPlan || 'free',
      dailyLimit: user?.dailyReplyLimit || 10,
      repliesUsedToday: user?.repliesUsedToday || 0,
      usageHistory: usageStats,
      totalRepliesUsed: usageStats.reduce((sum, stat) => sum + stat.repliesUsed, 0),
      totalAiGenerations: usageStats.reduce((sum, stat) => sum + stat.aiGenerations, 0)
    }
  }

  /**
   * Check if user has access to premium features
   */
  static async hasPremiumAccess(userId: string, feature: 'advanced_ai' | 'custom_instructions' | 'priority_support'): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user || user.subscriptionStatus !== 'active') {
      return false
    }

    switch (feature) {
      case 'advanced_ai':
        return user.subscriptionPlan === 'premium'
      case 'custom_instructions':
        return user.subscriptionPlan === 'premium'
      case 'priority_support':
        return user.subscriptionPlan === 'basic' || user.subscriptionPlan === 'premium'
      default:
        return false
    }
  }
}

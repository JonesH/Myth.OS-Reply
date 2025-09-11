import { NextRequest, NextResponse } from 'next/server'
import { UsageTrackingService } from '@/lib/services/usageTracking'
import { AuthService } from '@/lib/services/auth'
import { ensureUserExists } from '@/lib/utils/ensureUser'
import { isNoDatabaseMode } from '@/lib/inMemoryStorage'

export const dynamic = 'force-dynamic'

/**
 * @swagger
 * /api/usage/stats:
 *   get:
 *     summary: Get user usage statistics
 *     tags: [Usage]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Number of days to include in statistics
 *     responses:
 *       200:
 *         description: Usage statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 currentPlan:
 *                   type: string
 *                 dailyLimit:
 *                   type: integer
 *                 repliesUsedToday:
 *                   type: integer
 *                 usageHistory:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date-time
 *                       repliesUsed:
 *                         type: integer
 *                       aiGenerations:
 *                         type: integer
 *                 totalRepliesUsed:
 *                   type: integer
 *                 totalAiGenerations:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined
    const user = token
      ? await AuthService.validateToken(token)
      : (isNoDatabaseMode() ? await AuthService.getOrCreateDemoUser() : null)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure user exists only when DB mode is enabled
    if (!isNoDatabaseMode()) {
      await ensureUserExists(user)
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    const stats = await UsageTrackingService.getUserUsageStats(user.id, days)

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching usage stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

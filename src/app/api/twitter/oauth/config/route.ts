import { NextRequest, NextResponse } from 'next/server'
import { isNoDatabaseMode } from '@/lib/inMemoryStorage'

export const dynamic = 'force-dynamic'

/**
 * @swagger
 * /api/twitter/oauth/config:
 *   get:
 *     summary: Get Twitter OAuth configuration status
 *     tags: [Twitter]
 *     responses:
 *       200:
 *         description: Twitter OAuth configuration status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hasCredentials:
 *                   type: boolean
 *                 isDemoMode:
 *                   type: boolean
 *                 clientIdSet:
 *                   type: boolean
 *                 clientSecretSet:
 *                   type: boolean
 */
export async function GET(request: NextRequest) {
  try {
    const hasClientId = !!process.env.TWITTER_CLIENT_ID
    const hasClientSecret = !!process.env.TWITTER_CLIENT_SECRET
    const hasCredentials = hasClientId && hasClientSecret
    const noDatabaseMode = isNoDatabaseMode()
    
    return NextResponse.json({
      hasCredentials,
      noDatabaseMode,
      // keep legacy key for backward-compat UIs
      isDemoMode: noDatabaseMode,
      clientIdSet: hasClientId,
      clientSecretSet: hasClientSecret,
      message: hasCredentials 
        ? 'Twitter OAuth is configured for real accounts via NextAuth' 
        : 'Twitter OAuth is missing credentials'
    })
  } catch (error) {
    console.error('Error checking Twitter OAuth config:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

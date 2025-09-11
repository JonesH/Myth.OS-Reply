import { NextRequest, NextResponse } from 'next/server'

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
    const isDemoMode = process.env.TWITTER_OAUTH_DEMO_MODE === 'true'
    
    return NextResponse.json({
      hasCredentials,
      isDemoMode,
      clientIdSet: hasClientId,
      clientSecretSet: hasClientSecret,
      message: hasCredentials && !isDemoMode 
        ? 'Twitter OAuth is configured for real accounts' 
        : 'Twitter OAuth is in demo mode or missing credentials'
    })
  } catch (error) {
    console.error('Error checking Twitter OAuth config:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

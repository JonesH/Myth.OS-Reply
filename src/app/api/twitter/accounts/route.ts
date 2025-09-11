import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/services/auth'
import { isNoDatabaseMode } from '@/lib/inMemoryStorage'

export const dynamic = 'force-dynamic'

/**
 * @swagger
 * /api/twitter/accounts:
 *   get:
 *     summary: Get user's Twitter accounts
 *     tags: [Twitter Accounts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of Twitter accounts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   twitterUsername:
 *                     type: string
 *                   isActive:
 *                     type: boolean
 *                   createdAt:
 *                     type: string
 *   post:
 *     summary: Add a new Twitter account
 *     tags: [Twitter Accounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - twitterUsername
 *               - accessToken
 *               - accessTokenSecret
 *             properties:
 *               twitterUsername:
 *                 type: string
 *                 description: Twitter username
 *               accessToken:
 *                 type: string
 *                 description: Twitter access token
 *               accessTokenSecret:
 *                 type: string
 *                 description: Twitter access token secret
 *     responses:
 *       201:
 *         description: Twitter account added successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */

// Demo Twitter accounts data (used only when NO_DATABASE=true and credentials are missing)
const DEMO_TWITTER_ACCOUNTS = [
  {
    id: 'twitter-account-1',
    twitterUsername: 'demo_account',
    isActive: true,
    createdAt: new Date().toISOString()
  }
]

async function getAuthUser(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (token) {
    return await AuthService.getUserFromToken(token)
  }
  // Always return demo user in no-DB mode
  return await AuthService.getOrCreateDemoUser()
}

export async function GET(request: NextRequest) {
  try {
    // Prefer NextAuth session if configured (real Twitter Connect)
    const { getToken } = await import('next-auth/jwt')
    const jwt = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    const hasTwitterCreds = !!process.env.TWITTER_CLIENT_ID && !!process.env.TWITTER_CLIENT_SECRET

    if (jwt && (jwt as any).twitterId) {
      // Expose a virtual account based on the authenticated Twitter user
      const username = (jwt as any).twitterId as string
      return NextResponse.json([
        {
          id: 'twitter-session-account',
          twitterUsername: username,
          isActive: true,
          createdAt: new Date().toISOString(),
        }
      ])
    }

    // Fallback to legacy token-based auth if present
    try { await getAuthUser(request) } catch {}

    // If NO_DATABASE and missing credentials, return demo accounts
    if (isNoDatabaseMode() && !hasTwitterCreds) {
      return NextResponse.json(DEMO_TWITTER_ACCOUNTS)
    }

    // Otherwise, require NextAuth session (not logged in to Twitter)
    return NextResponse.json({ error: 'Not connected to Twitter' }, { status: 401 })
    
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Real flow uses NextAuth Twitter; creating accounts manually is not supported.
    return NextResponse.json({ error: 'Use /api/twitter/oauth or /auth/signin to connect Twitter' }, { status: 405 })
    
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('id')

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      )
    }

    // In session-based model, disconnecting is a no-op (user can sign out)
    return NextResponse.json({ 
      success: true, 
      message: 'Twitter account disconnected successfully' 
    })
    
  } catch (error: any) {
    console.error('Error disconnecting Twitter account:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

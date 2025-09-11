import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * @swagger
 * /api/twitter/oauth:
 *   get:
 *     summary: Get Twitter OAuth authorization URL
 *     tags: [Twitter OAuth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OAuth authorization URL generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 authUrl:
 *                   type: string
 *                   description: Twitter authorization URL
 *                 state:
 *                   type: string
 *                   description: State parameter for security
 *   post:
 *     summary: Complete Twitter OAuth flow
 *     tags: [Twitter OAuth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oauth_token
 *               - oauth_verifier
 *               - state
 *             properties:
 *               oauth_token:
 *                 type: string
 *               oauth_verifier:
 *                 type: string
 *               state:
 *                 type: string
 *     responses:
 *       201:
 *         description: Twitter account connected successfully
 */

export async function GET(request: NextRequest) {
  // Redirect directly into NextAuth's Twitter provider sign-in flow
  const { searchParams } = new URL(request.url)
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  const redirectUrl = new URL('/api/auth/signin/twitter', request.url)
  redirectUrl.searchParams.set('callbackUrl', callbackUrl)
  return NextResponse.redirect(redirectUrl, { status: 302 })
}

export async function POST(request: NextRequest) {
  // For compatibility, POST also initiates the login by redirecting
  const { searchParams } = new URL(request.url)
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  const redirectUrl = new URL('/api/auth/signin/twitter', request.url)
  redirectUrl.searchParams.set('callbackUrl', callbackUrl)
  return NextResponse.redirect(redirectUrl, { status: 302 })
}

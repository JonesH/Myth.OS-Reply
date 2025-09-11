import { NextRequest, NextResponse } from 'next/server'

/**
 * @swagger
 * /api/debug/auth:
 *   get:
 *     summary: Debug authentication configuration
 *     tags: [Debug]
 *     responses:
 *       200:
 *         description: Authentication debug information
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    return NextResponse.json({
      environment: process.env.NODE_ENV,
      jwtSecret: process.env.JWT_SECRET ? 'SET' : 'MISSING',
      databaseUrl: process.env.DATABASE_URL ? 'SET' : 'MISSING',
      nextauthSecret: process.env.NEXTAUTH_SECRET ? 'SET' : 'MISSING',
      nextauthUrl: process.env.NEXTAUTH_URL ? 'SET' : 'MISSING',
      authHeader: authHeader ? 'PRESENT' : 'MISSING',
      timestamp: new Date().toISOString(),
      message: 'Debug information for authentication troubleshooting'
    })
  } catch (error) {
    console.error('Debug auth error:', error)
    return NextResponse.json(
      { error: 'Debug failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

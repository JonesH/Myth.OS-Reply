import { NextRequest, NextResponse } from 'next/server'

/**
 * @swagger
 * /api/test/env:
 *   get:
 *     summary: Test environment variables (public endpoint)
 *     tags: [Test]
 *     responses:
 *       200:
 *         description: Environment variables status
 */
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      environment: process.env.NODE_ENV,
      jwtSecret: process.env.JWT_SECRET ? 'SET' : 'MISSING',
      databaseUrl: process.env.DATABASE_URL ? 'SET' : 'MISSING',
      nextauthSecret: process.env.NEXTAUTH_SECRET ? 'SET' : 'MISSING',
      nextauthUrl: process.env.NEXTAUTH_URL ? 'SET' : 'MISSING',
      timestamp: new Date().toISOString(),
      message: 'Environment variables status check'
    })
  } catch (error) {
    console.error('Test env error:', error)
    return NextResponse.json(
      { error: 'Test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

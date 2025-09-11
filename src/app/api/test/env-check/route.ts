import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Test if JWT_SECRET is accessible
    let jwtSecretStatus = 'MISSING'
    try {
      const secret = process.env.JWT_SECRET
      if (secret) {
        jwtSecretStatus = `SET (${secret.length} chars)`
      }
    } catch (error) {
      jwtSecretStatus = 'ERROR'
    }

    return NextResponse.json({
      environment: process.env.NODE_ENV,
      jwtSecret: jwtSecretStatus,
      databaseUrl: process.env.DATABASE_URL ? 'SET' : 'MISSING',
      nextauthSecret: process.env.NEXTAUTH_SECRET ? 'SET' : 'MISSING',
      nextauthUrl: process.env.NEXTAUTH_URL ? 'SET' : 'MISSING',
      timestamp: new Date().toISOString(),
      message: 'Environment check - this should be accessible without auth'
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Environment check failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

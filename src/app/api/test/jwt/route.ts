import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest) {
  try {
    const jwtSecret = process.env.JWT_SECRET
    
    if (!jwtSecret) {
      return NextResponse.json({
        error: 'JWT_SECRET not configured',
        jwtSecretSet: false,
        recommendation: 'Set JWT_SECRET environment variable'
      }, { status: 500 })
    }

    // Test JWT generation and verification
    const testPayload = { userId: 'test', email: 'test@example.com' }
    const token = jwt.sign(testPayload, jwtSecret, { expiresIn: '1h' })
    const decoded = jwt.verify(token, jwtSecret) as any

    return NextResponse.json({
      success: true,
      jwtSecretSet: true,
      jwtSecretLength: jwtSecret.length,
      testTokenGenerated: !!token,
      testTokenVerified: decoded.userId === 'test',
      environment: process.env.NODE_ENV
    })
  } catch (error: any) {
    return NextResponse.json({
      error: 'JWT test failed',
      message: error.message,
      jwtSecretSet: !!process.env.JWT_SECRET
    }, { status: 500 })
  }
}

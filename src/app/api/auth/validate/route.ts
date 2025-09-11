import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/services/auth'

export const dynamic = 'force-dynamic'

/**
 * @swagger
 * /api/auth/validate:
 *   get:
 *     summary: Validate JWT token
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     username:
 *                       type: string
 *       401:
 *         description: Invalid token
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Auth validation - Token exists:', !!token)
      console.log('🔍 Auth validation - Token length:', token?.length || 0)
    }
    
    const user = token
      ? await AuthService.validateToken(token)
      : (process.env.DEMO_MODE === 'true' ? await AuthService.getOrCreateDemoUser() : null)
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Auth validation - User found:', !!user)
      console.log('🔍 Auth validation - User email:', user?.email)
    }
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    return NextResponse.json({ user })
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Auth validation error:', error)
    }
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    )
  }
}

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
    const user = token
      ? await AuthService.validateToken(token)
      : (process.env.DEMO_MODE === 'true' ? await AuthService.getOrCreateDemoUser() : null)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    return NextResponse.json({ user })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    )
  }
}

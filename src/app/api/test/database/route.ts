import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'

// Check if demo mode is enabled
const isDemoMode = () => {
  return process.env.DEMO_MODE === 'true' || process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
}

export async function GET(request: NextRequest) {
  // In demo mode, return mock data
  if (isDemoMode()) {
    return NextResponse.json({
      success: true,
      message: 'Demo mode - Database test successful (simulated)',
      userCount: 2,
      demoMode: true,
      databaseUrl: 'Demo mode - no database required',
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    })
  }

  try {
    // Test database connection
    await prisma.$connect()
    
    // Try a simple query
    const userCount = await prisma.user.count()
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      userCount,
      demoMode: false,
      databaseUrl: process.env.DATABASE_URL || 'Not set',
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Database test error:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      demoMode: false,
      databaseUrl: process.env.DATABASE_URL || 'Not set',
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

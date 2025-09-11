import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { isNoDatabaseMode } from '@/lib/inMemoryStorage'

export async function GET(request: NextRequest) {
  // In no-database mode, return mock data
  if (isNoDatabaseMode()) {
    return NextResponse.json({
      success: true,
      message: 'NO_DATABASE mode - Database test successful (simulated)',
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

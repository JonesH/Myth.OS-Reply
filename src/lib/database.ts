import { PrismaClient } from '@prisma/client'
import { existsSync, mkdirSync } from 'fs'
import { dirname } from 'path'
import { initializeDatabase } from './db-init'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Use different database paths for different environments
const getDatabaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    // In production (Vercel), use the temporary directory
    return 'file:/tmp/prisma/dev.db'
  } else {
    // In development, use the local prisma directory
    return 'file:./prisma/dev.db'
  }
}

// Ensure database directory exists
const ensureDatabaseDirectory = () => {
  const dbUrl = getDatabaseUrl()
  if (dbUrl.startsWith('file:')) {
    const dbPath = dbUrl.replace('file:', '')
    const dbDir = dirname(dbPath)
    
    if (!existsSync(dbDir)) {
      try {
        mkdirSync(dbDir, { recursive: true })
        console.log(`✅ Created database directory: ${dbDir}`)
      } catch (error) {
        console.error(`❌ Failed to create database directory: ${dbDir}`, error)
      }
    }
  }
}

// Ensure database directory exists before creating Prisma client
ensureDatabaseDirectory()

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: getDatabaseUrl()
    }
  }
})

// Check if demo mode is enabled
const isDemoMode = () => {
  return process.env.DEMO_MODE === 'true' || process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
}

// Initialize database tables if they don't exist (only in production and not in demo mode)
if (process.env.NODE_ENV === 'production' && !isDemoMode()) {
  initializeDatabase(prisma).catch(console.error)
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
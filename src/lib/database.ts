import { PrismaClient } from '@prisma/client'
import { existsSync, mkdirSync } from 'fs'
import { dirname } from 'path'
import { execSync } from 'child_process'

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

// Ensure database directory exists and run migrations
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
    
    // In production, run migrations if database doesn't exist
    if (process.env.NODE_ENV === 'production' && !existsSync(dbPath)) {
      try {
        console.log('🔄 Running migrations in production...')
        execSync('npx prisma migrate deploy', {
          env: {
            ...process.env,
            DATABASE_URL: dbUrl
          },
          stdio: 'inherit'
        })
        console.log('✅ Migrations completed successfully')
      } catch (error) {
        console.error('❌ Migration failed:', error)
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

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
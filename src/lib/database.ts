import { PrismaClient } from '@prisma/client'

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

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: getDatabaseUrl()
    }
  }
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
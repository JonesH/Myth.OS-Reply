import { PrismaClient } from '@prisma/client'

// Database initialization function that creates tables if they don't exist
export const initializeDatabase = async (prisma: PrismaClient) => {
  try {
    // Try to query the users table to see if it exists
    await prisma.$queryRaw`SELECT 1 FROM users LIMIT 1`
    console.log('✅ Database tables already exist')
    return true
  } catch (error: any) {
    if (error.message.includes('no such table: users')) {
      console.log('🔄 Database tables don\'t exist, creating them...')
      
      try {
        // Create users table
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS "users" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "email" TEXT NOT NULL UNIQUE,
            "username" TEXT NOT NULL UNIQUE,
            "password" TEXT NOT NULL,
            "walletAddress" TEXT,
            "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "subscriptionPlan" TEXT NOT NULL DEFAULT 'free',
            "subscriptionStatus" TEXT NOT NULL DEFAULT 'active',
            "subscriptionExpiresAt" DATETIME,
            "dailyReplyLimit" INTEGER NOT NULL DEFAULT 10,
            "repliesUsedToday" INTEGER NOT NULL DEFAULT 0,
            "lastUsageReset" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `
        
        // Create payment_addresses table
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS "payment_addresses" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "userId" TEXT NOT NULL,
            "address" TEXT NOT NULL,
            "amount" REAL NOT NULL,
            "plan" TEXT NOT NULL,
            "status" TEXT NOT NULL DEFAULT 'pending',
            "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "expiresAt" DATETIME NOT NULL,
            "transactionHash" TEXT,
            "verifiedAt" DATETIME,
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
          )
        `
        
        // Create waitlist table
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS "waitlist" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "email" TEXT NOT NULL UNIQUE,
            "name" TEXT,
            "company" TEXT,
            "useCase" TEXT,
            "twitterHandle" TEXT,
            "referralSource" TEXT,
            "replyStyle" TEXT,
            "preferredTemplates" TEXT,
            "customSymbols" TEXT,
            "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `
        
        // Create twitter_accounts table
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS "twitter_accounts" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "userId" TEXT NOT NULL,
            "twitterUsername" TEXT NOT NULL,
            "accessToken" TEXT NOT NULL,
            "accessTokenSecret" TEXT NOT NULL,
            "isActive" BOOLEAN NOT NULL DEFAULT true,
            "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
            UNIQUE("userId", "twitterUsername")
          )
        `
        
        // Create oauth_states table
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS "oauth_states" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "userId" TEXT NOT NULL,
            "state" TEXT NOT NULL UNIQUE,
            "requestToken" TEXT NOT NULL,
            "requestSecret" TEXT NOT NULL,
            "callbackUrl" TEXT,
            "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "expiresAt" DATETIME NOT NULL,
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
          )
        `
        
        console.log('✅ Database tables created successfully')
        return true
      } catch (createError) {
        console.error('❌ Failed to create database tables:', createError)
        return false
      }
    } else {
      console.error('❌ Database error:', error)
      return false
    }
  }
}

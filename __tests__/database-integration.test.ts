import { PrismaClient } from '@prisma/client'
import { prisma } from '@/lib/database'

// Test against actual database schema but clean up after each test
describe('Database Integration Tests', () => {
  beforeEach(async () => {
    // Clean up database before each test
    await prisma.reply.deleteMany()
    await prisma.tweetAnalysis.deleteMany()
    await prisma.scrapedTweet.deleteMany()
    await prisma.profileAnalytics.deleteMany()
    await prisma.replyJob.deleteMany()
    await prisma.twitterAccount.deleteMany()
    await prisma.replyTemplate.deleteMany()
    await prisma.waitlistEntry.deleteMany()
    await prisma.user.deleteMany()
  })

  afterAll(async () => {
    // Clean up database after all tests
    await prisma.reply.deleteMany()
    await prisma.tweetAnalysis.deleteMany()
    await prisma.scrapedTweet.deleteMany()
    await prisma.profileAnalytics.deleteMany()
    await prisma.replyJob.deleteMany()
    await prisma.twitterAccount.deleteMany()
    await prisma.replyTemplate.deleteMany()
    await prisma.waitlistEntry.deleteMany()
    await prisma.user.deleteMany()
    await prisma.$disconnect()
  })

  describe('User Model', () => {
    it('should create a user with all required fields', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashedpassword123',
      }

      const user = await prisma.user.create({
        data: userData
      })

      expect(user.id).toBeDefined()
      expect(user.email).toBe(userData.email)
      expect(user.username).toBe(userData.username)
      expect(user.password).toBe(userData.password)
      expect(user.createdAt).toBeInstanceOf(Date)
      expect(user.updatedAt).toBeInstanceOf(Date)
    })

    it('should enforce unique constraints on email and username', async () => {
      const userData = {
        email: 'unique@example.com',
        username: 'uniqueuser',
        password: 'password',
      }

      // Create first user
      await prisma.user.create({ data: userData })

      // Try to create user with same email
      await expect(
        prisma.user.create({
          data: { ...userData, username: 'differentuser' }
        })
      ).rejects.toThrow()

      // Try to create user with same username
      await expect(
        prisma.user.create({
          data: { ...userData, email: 'different@example.com' }
        })
      ).rejects.toThrow()
    })

    it('should find user by email or username using OR condition', async () => {
      const userData = {
        email: 'findme@example.com',
        username: 'findmeuser',
        password: 'password',
      }

      await prisma.user.create({ data: userData })

      // Find by email
      const userByEmail = await prisma.user.findFirst({
        where: {
          OR: [
            { email: 'findme@example.com' },
            { username: 'nonexistent' }
          ]
        }
      })
      expect(userByEmail?.email).toBe(userData.email)

      // Find by username
      const userByUsername = await prisma.user.findFirst({
        where: {
          OR: [
            { email: 'nonexistent@example.com' },
            { username: 'findmeuser' }
          ]
        }
      })
      expect(userByUsername?.username).toBe(userData.username)
    })
  })

  describe('TwitterAccount Model', () => {
    let userId: string

    beforeEach(async () => {
      const user = await prisma.user.create({
        data: {
          email: 'twitteruser@example.com',
          username: 'twitteruser',
          password: 'password',
        }
      })
      userId = user.id
    })

    it('should create a Twitter account with user relationship', async () => {
      const twitterAccountData = {
        userId,
        twitterUsername: '@testtwitter',
        accessToken: 'access-token-123',
        accessTokenSecret: 'access-secret-123',
      }

      const twitterAccount = await prisma.twitterAccount.create({
        data: twitterAccountData,
        include: { user: true }
      })

      expect(twitterAccount.id).toBeDefined()
      expect(twitterAccount.userId).toBe(userId)
      expect(twitterAccount.twitterUsername).toBe(twitterAccountData.twitterUsername)
      expect(twitterAccount.isActive).toBe(true) // Default value
      expect(twitterAccount.user.email).toBe('twitteruser@example.com')
    })

    it('should enforce unique constraint on userId + twitterUsername', async () => {
      const twitterAccountData = {
        userId,
        twitterUsername: '@unique_twitter',
        accessToken: 'token1',
        accessTokenSecret: 'secret1',
      }

      // Create first account
      await prisma.twitterAccount.create({ data: twitterAccountData })

      // Try to create duplicate
      await expect(
        prisma.twitterAccount.create({
          data: {
            ...twitterAccountData,
            accessToken: 'different-token'
          }
        })
      ).rejects.toThrow()
    })

    it('should cascade delete when user is deleted', async () => {
      // Create Twitter account
      await prisma.twitterAccount.create({
        data: {
          userId,
          twitterUsername: '@cascade_test',
          accessToken: 'token',
          accessTokenSecret: 'secret',
        }
      })

      // Verify account exists
      const accountsBefore = await prisma.twitterAccount.findMany({
        where: { userId }
      })
      expect(accountsBefore).toHaveLength(1)

      // Delete user
      await prisma.user.delete({ where: { id: userId } })

      // Verify account was cascade deleted
      const accountsAfter = await prisma.twitterAccount.findMany({
        where: { userId }
      })
      expect(accountsAfter).toHaveLength(0)
    })
  })

  describe('ReplyJob Model', () => {
    let userId: string
    let twitterAccountId: string

    beforeEach(async () => {
      const user = await prisma.user.create({
        data: {
          email: 'replyuser@example.com',
          username: 'replyuser',
          password: 'password',
        }
      })
      userId = user.id

      const twitterAccount = await prisma.twitterAccount.create({
        data: {
          userId,
          twitterUsername: '@replytest',
          accessToken: 'token',
          accessTokenSecret: 'secret',
        }
      })
      twitterAccountId = twitterAccount.id
    })

    it('should create a reply job with all fields', async () => {
      const replyJobData = {
        userId,
        twitterAccountId,
        targetUsername: '@target_user',
        keywords: JSON.stringify(['crypto', 'blockchain']),
        replyText: 'This is a test reply',
        useAI: true,
        aiTone: 'professional',
        aiIncludeHashtags: true,
        aiIncludeEmojis: false,
        maxReplies: 10,
        currentReplies: 0,
        isActive: true,
      }

      const replyJob = await prisma.replyJob.create({
        data: replyJobData,
        include: {
          user: true,
          twitterAccount: true
        }
      })

      expect(replyJob.id).toBeDefined()
      expect(replyJob.keywords).toBe(JSON.stringify(['crypto', 'blockchain']))
      expect(replyJob.useAI).toBe(true)
      expect(replyJob.aiTone).toBe('professional')
      expect(replyJob.user.email).toBe('replyuser@example.com')
      expect(replyJob.twitterAccount.twitterUsername).toBe('@replytest')
    })

    it('should handle JSON fields for keywords and target usernames', async () => {
      const keywords = ['defi', 'nft', 'web3']
      const targetUsernames = ['@user1', '@user2', '@user3']

      const replyJob = await prisma.replyJob.create({
        data: {
          userId,
          twitterAccountId,
          keywords: JSON.stringify(keywords),
          targetUsernames: JSON.stringify(targetUsernames),
          replyText: 'Test reply',
          maxReplies: 5,
          currentReplies: 0,
          isActive: true,
        }
      })

      const savedJob = await prisma.replyJob.findUnique({
        where: { id: replyJob.id }
      })

      expect(JSON.parse(savedJob!.keywords)).toEqual(keywords)
      expect(JSON.parse(savedJob!.targetUsernames!)).toEqual(targetUsernames)
    })

    it('should cascade delete when user is deleted', async () => {
      await prisma.replyJob.create({
        data: {
          userId,
          twitterAccountId,
          keywords: JSON.stringify(['test']),
          replyText: 'Test',
          maxReplies: 1,
          currentReplies: 0,
          isActive: true,
        }
      })

      // Delete user
      await prisma.user.delete({ where: { id: userId } })

      // Verify reply job was cascade deleted
      const jobs = await prisma.replyJob.findMany({
        where: { userId }
      })
      expect(jobs).toHaveLength(0)
    })
  })

  describe('Reply Model', () => {
    let replyJobId: string

    beforeEach(async () => {
      const user = await prisma.user.create({
        data: {
          email: 'replytest@example.com',
          username: 'replytest',
          password: 'password',
        }
      })

      const twitterAccount = await prisma.twitterAccount.create({
        data: {
          userId: user.id,
          twitterUsername: '@reply_account',
          accessToken: 'token',
          accessTokenSecret: 'secret',
        }
      })

      const replyJob = await prisma.replyJob.create({
        data: {
          userId: user.id,
          twitterAccountId: twitterAccount.id,
          keywords: JSON.stringify(['test']),
          replyText: 'Test reply',
          maxReplies: 5,
          currentReplies: 0,
          isActive: true,
        }
      })
      replyJobId = replyJob.id
    })

    it('should create successful and failed replies', async () => {
      // Create successful reply
      const successfulReply = await prisma.reply.create({
        data: {
          replyJobId,
          tweetId: 'tweet-123',
          replyTweetId: 'reply-456',
          content: 'This is a successful reply',
          successful: true,
        }
      })

      // Create failed reply
      const failedReply = await prisma.reply.create({
        data: {
          replyJobId,
          tweetId: 'tweet-789',
          replyTweetId: '',
          content: 'This reply failed',
          successful: false,
          errorMessage: 'Rate limit exceeded',
        }
      })

      expect(successfulReply.successful).toBe(true)
      expect(successfulReply.errorMessage).toBeNull()
      expect(failedReply.successful).toBe(false)
      expect(failedReply.errorMessage).toBe('Rate limit exceeded')
    })

    it('should relate replies to reply jobs', async () => {
      await prisma.reply.createMany({
        data: [
          {
            replyJobId,
            tweetId: 'tweet-1',
            replyTweetId: 'reply-1',
            content: 'Reply 1',
            successful: true,
          },
          {
            replyJobId,
            tweetId: 'tweet-2',
            replyTweetId: 'reply-2',
            content: 'Reply 2',
            successful: true,
          },
        ]
      })

      const jobWithReplies = await prisma.replyJob.findUnique({
        where: { id: replyJobId },
        include: { replies: true }
      })

      expect(jobWithReplies!.replies).toHaveLength(2)
      expect(jobWithReplies!.replies[0].content).toContain('Reply')
    })
  })

  describe('ScrapedTweet Model', () => {
    it('should create scraped tweet with analysis data', async () => {
      const tweetData = {
        tweetId: 'tweet-123456',
        authorId: 'author-789',
        authorUsername: '@test_author',
        content: 'This is a test tweet about #crypto and #blockchain',
        createdAt: new Date('2023-01-01T12:00:00Z'),
        likeCount: 100,
        retweetCount: 25,
        replyCount: 10,
        quoteCount: 5,
        sentiment: 'positive',
        sentimentScore: 0.8,
        topics: JSON.stringify(['crypto', 'blockchain']),
        hashtags: JSON.stringify(['crypto', 'blockchain']),
        mentions: JSON.stringify(['@someone']),
        urls: JSON.stringify(['https://example.com']),
        language: 'en',
        isRetweet: false,
      }

      const scrapedTweet = await prisma.scrapedTweet.create({
        data: tweetData
      })

      expect(scrapedTweet.tweetId).toBe(tweetData.tweetId)
      expect(scrapedTweet.sentiment).toBe('positive')
      expect(JSON.parse(scrapedTweet.topics!)).toEqual(['crypto', 'blockchain'])
      expect(scrapedTweet.scrapedAt).toBeInstanceOf(Date)
    })

    it('should handle optional fields correctly', async () => {
      const minimalTweet = await prisma.scrapedTweet.create({
        data: {
          tweetId: 'minimal-tweet',
          authorId: 'author-123',
          authorUsername: '@minimal',
          content: 'Minimal tweet',
          createdAt: new Date('2023-01-01T10:00:00Z'),
          likeCount: 0,
          retweetCount: 0,
          replyCount: 0,
          quoteCount: 0,
          sentiment: 'neutral',
        }
      })

      expect(minimalTweet.sentimentScore).toBeNull()
      expect(minimalTweet.topics).toBeNull()
      expect(minimalTweet.sourceJobId).toBeNull()
    })
  })

  describe('Database Transaction Handling', () => {
    it('should rollback transaction on error', async () => {
      const userData = {
        email: 'transaction@example.com',
        username: 'transactionuser',
        password: 'password',
      }

      // Create user first
      await prisma.user.create({ data: userData })

      // Try to create another user with same email in transaction
      // This should fail and rollback
      await expect(
        prisma.$transaction(async (tx) => {
          await tx.user.create({
            data: {
              email: 'new@example.com',
              username: 'newuser',
              password: 'password',
            }
          })
          
          // This should fail due to unique constraint
          await tx.user.create({
            data: userData
          })
        })
      ).rejects.toThrow()

      // Verify the first user in the transaction wasn't created
      const users = await prisma.user.findMany({
        where: { email: 'new@example.com' }
      })
      expect(users).toHaveLength(0)
    })

    it('should commit transaction on success', async () => {
      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: 'success@example.com',
            username: 'successuser',
            password: 'password',
          }
        })

        const twitterAccount = await tx.twitterAccount.create({
          data: {
            userId: user.id,
            twitterUsername: '@success',
            accessToken: 'token',
            accessTokenSecret: 'secret',
          }
        })

        return { user, twitterAccount }
      })

      expect(result.user.id).toBeDefined()
      expect(result.twitterAccount.userId).toBe(result.user.id)

      // Verify both records were created
      const userExists = await prisma.user.findUnique({
        where: { id: result.user.id }
      })
      const accountExists = await prisma.twitterAccount.findUnique({
        where: { id: result.twitterAccount.id }
      })

      expect(userExists).toBeTruthy()
      expect(accountExists).toBeTruthy()
    })
  })
})
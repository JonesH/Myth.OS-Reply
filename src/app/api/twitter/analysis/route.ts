import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/services/auth'
import { TwitterAnalysisService } from '@/lib/services/twitterAnalysis'
import { prisma } from '@/lib/database'
import { isNoDatabaseMode } from '@/lib/inMemoryStorage'

export const dynamic = 'force-dynamic'

/**
 * @swagger
 * /api/twitter/analysis:
 *   get:
 *     summary: Get Twitter analysis data
 *     tags: [Twitter Analysis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [trending, sentiment, profile]
 *         description: Type of analysis to retrieve
 *       - in: query
 *         name: topic
 *         schema:
 *           type: string
 *         description: Topic for sentiment analysis
 *       - in: query
 *         name: username
 *         schema:
 *           type: string
 *         description: Username for profile analysis
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [hour, day, week, month]
 *         description: Timeframe for analysis
 *     responses:
 *       200:
 *         description: Analysis data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 type:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */

async function getAuthUser(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (token) return await AuthService.getUserFromToken(token)
  if (isNoDatabaseMode()) return await AuthService.getOrCreateDemoUser()
  throw new Error('No token provided')
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const topic = searchParams.get('topic')
    const username = searchParams.get('username')
    const timeframe = searchParams.get('timeframe') as 'hour' | 'day' | 'week' | 'month' || 'day'

    const analysisService = new TwitterAnalysisService()

    switch (type) {
      case 'trending':
        if (isNoDatabaseMode()) {
          // Return mock trending data for demo mode
          return NextResponse.json({
            type: 'trending',
            data: {
              topics: [
                { topic: 'ai', count: 1250, sentiment: 0.45 },
                { topic: 'crypto', count: 890, sentiment: 0.12 },
                { topic: 'startups', count: 675, sentiment: 0.38 },
                { topic: 'blockchain', count: 543, sentiment: 0.28 },
                { topic: 'web3', count: 432, sentiment: 0.15 },
                { topic: 'technology', count: 387, sentiment: 0.52 },
                { topic: 'innovation', count: 298, sentiment: 0.61 },
                { topic: 'programming', count: 234, sentiment: 0.33 }
              ],
              timeframe
            }
          })
        }

        const trendingTopics = await analysisService.getTrendingTopics(timeframe as 'hour' | 'day' | 'week')
        return NextResponse.json({
          type: 'trending',
          data: {
            topics: trendingTopics,
            timeframe
          }
        })

      case 'sentiment':
        if (!topic) {
          return NextResponse.json(
            { error: 'Topic parameter is required for sentiment analysis' },
            { status: 400 }
          )
        }

        if (isNoDatabaseMode()) {
          // Return mock sentiment data for demo mode
          return NextResponse.json({
            type: 'sentiment',
            data: {
              topic,
              timeframe,
              overall: {
                sentiment: 'positive',
                score: 0.34,
                confidence: 0.72
              },
              timeline: [
                { date: '2025-01-08', sentiment: 0.28, count: 45 },
                { date: '2025-01-09', sentiment: 0.31, count: 52 },
                { date: '2025-01-10', sentiment: 0.38, count: 67 },
                { date: '2025-01-11', sentiment: 0.34, count: 58 }
              ]
            }
          })
        }

        const sentimentData = await analysisService.getTopicSentiment(topic, timeframe as "day" | "week" | "month")
        return NextResponse.json({
          type: 'sentiment',
          data: {
            topic,
            timeframe,
            ...sentimentData
          }
        })

      case 'profile':
        if (!username) {
          return NextResponse.json(
            { error: 'Username parameter is required for profile analysis' },
            { status: 400 }
          )
        }

        if (isNoDatabaseMode()) {
          // Return mock profile data for demo mode
          return NextResponse.json({
            type: 'profile',
            data: {
              id: 'demo_profile_1',
              username,
              userId: 'demo_user',
              displayName: `Demo User @${username}`,
              bio: 'This is a demo profile for testing purposes.',
              followersCount: 12500,
              followingCount: 890,
              tweetCount: 3420,
              listedCount: 45,
              verified: false,
              avgLikesPerTweet: 23.5,
              avgRepliesPerTweet: 4.2,
              avgRetweetsPerTweet: 8.7,
              engagementRate: 0.034,
              mostActiveHours: [9, 12, 15, 18],
              postingFrequency: 2.3,
              topTopics: ['technology', 'startups', 'AI', 'programming'],
              sentimentTrend: [0.2, 0.3, 0.1, 0.4, 0.25],
              lastUpdated: new Date()
            }
          })
        }

        const profileData = await prisma.profileAnalytics.findUnique({
          where: { username }
        })
        
        if (!profileData) {
          return NextResponse.json(
            { error: 'Profile analytics not found' },
            { status: 404 }
          )
        }

        return NextResponse.json({
          type: 'profile',
          data: {
            ...profileData,
            mostActiveHours: JSON.parse(profileData.mostActiveHours || '[]'),
            topTopics: JSON.parse(profileData.topTopics || '[]'),
            sentimentTrend: JSON.parse(profileData.sentimentTrend || '[]')
          }
        })

      case 'overview':
        // General overview of all scraped data
        if (isNoDatabaseMode()) {
          // Return mock data for demo mode
          return NextResponse.json({
            type: 'overview',
            data: {
              totalTweets: 1250,
              recentTweets: 85,
              averageSentiment: 0.23,
              topProfiles: [
                { username: 'elonmusk', tweetCount: 45 },
                { username: 'sundarpichai', tweetCount: 32 },
                { username: 'satyanadella', tweetCount: 28 },
                { username: 'tim_cook', tweetCount: 21 },
                { username: 'jeffbezos', tweetCount: 18 }
              ]
            }
          })
        }

        const totalTweets = await prisma.scrapedTweet.count()
        const recentTweets = await prisma.scrapedTweet.count({
          where: {
            scrapedAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          }
        })
        
        const avgSentiment = await prisma.scrapedTweet.aggregate({
          _avg: {
            sentimentScore: true
          }
        })

        const topProfiles = await prisma.scrapedTweet.groupBy({
          by: ['authorUsername'],
          _count: {
            authorUsername: true
          },
          orderBy: {
            _count: {
              authorUsername: 'desc'
            }
          },
          take: 10
        })

        return NextResponse.json({
          type: 'overview',
          data: {
            totalTweets,
            recentTweets,
            averageSentiment: avgSentiment._avg.sentimentScore || 0,
            topProfiles: topProfiles.map(p => ({
              username: p.authorUsername,
              tweetCount: p._count.authorUsername
            }))
          }
        })

      default:
        return NextResponse.json(
          { error: 'Invalid analysis type. Use: trending, sentiment, profile, or overview' },
          { status: 400 }
        )
    }

  } catch (error: any) {
    if (error.message === 'No token provided' || error.message === 'Invalid token') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.error('Analysis API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/twitter/analysis:
 *   post:
 *     summary: Trigger analysis for specific content
 *     tags: [Twitter Analysis]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [analyze_profile, analyze_tweets, manual_scrape]
 *               username:
 *                 type: string
 *                 description: Username to analyze
 *               tweetIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Tweet IDs to analyze
 *               keywords:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Keywords to search and analyze
 *     responses:
 *       200:
 *         description: Analysis triggered successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    const body = await request.json()
    const { action, username, tweetIds, keywords } = body

    const analysisService = new TwitterAnalysisService()

    switch (action) {
      case 'analyze_profile':
        if (!username) {
          return NextResponse.json(
            { error: 'Username is required for profile analysis' },
            { status: 400 }
          )
        }

        // This would trigger background analysis
        // For now, just return success
        return NextResponse.json({
          message: `Profile analysis for @${username} has been queued`,
          username
        })

      case 'analyze_tweets':
        if (!tweetIds || !Array.isArray(tweetIds)) {
          return NextResponse.json(
            { error: 'Tweet IDs array is required' },
            { status: 400 }
          )
        }

        return NextResponse.json({
          message: `Analysis for ${tweetIds.length} tweets has been queued`,
          tweetIds
        })

      case 'manual_scrape':
        if (!keywords || !Array.isArray(keywords)) {
          return NextResponse.json(
            { error: 'Keywords array is required for manual scraping' },
            { status: 400 }
          )
        }

        return NextResponse.json({
          message: `Manual scraping for keywords: ${keywords.join(', ')} has been queued`,
          keywords
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: analyze_profile, analyze_tweets, or manual_scrape' },
          { status: 400 }
        )
    }

  } catch (error: any) {
    if (error.message === 'No token provided' || error.message === 'Invalid token') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.error('Analysis POST API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

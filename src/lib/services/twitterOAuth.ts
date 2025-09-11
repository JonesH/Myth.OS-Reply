import { TwitterService } from './twitter'
import { prisma } from '@/lib/database'
import crypto from 'crypto'
import { 
  isNoDatabaseMode, 
  inMemoryOAuthStates,
  cleanupExpiredOAuthStates
} from '@/lib/inMemoryStorage'

export class TwitterOAuthService {
  
  /**
   * Step 1: Get authorization URL for user
   */
  static async getAuthorizationUrl(userId: string, callbackUrl: string): Promise<{
    authUrl: string
    state: string
  }> {
    const apiKey = process.env.TWITTER_API_KEY!
    const apiSecret = process.env.TWITTER_API_SECRET!
    
    const requestTokenData = await TwitterService.getRequestToken(
      apiKey, 
      apiSecret, 
      callbackUrl
    )
    
    // Generate secure state parameter
    const state = crypto.randomBytes(32).toString('hex')
    
    // Store OAuth state temporarily (expires in 10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
    
    if (isNoDatabaseMode()) {
      // Store in memory
      inMemoryOAuthStates.set(state, {
        userId,
        state,
        requestToken: requestTokenData.oauth_token,
        requestSecret: requestTokenData.oauth_token_secret,
        callbackUrl,
        expiresAt
      })
    } else {
      // Store in database
      await prisma.oAuthState.create({
        data: {
          userId,
          state,
          requestToken: requestTokenData.oauth_token,
          requestSecret: requestTokenData.oauth_token_secret,
          callbackUrl,
          expiresAt
        }
      })
    }
    
    const authUrl = `https://api.twitter.com/oauth/authorize?oauth_token=${requestTokenData.oauth_token}`
    
    return {
      authUrl,
      state
    }
  }
  
  /**
   * Step 2: Exchange callback tokens for access tokens
   */
  static async completeOAuth(
    state: string,
    oauthToken: string,
    oauthVerifier: string
  ): Promise<{
    accessToken: string
    accessSecret: string
    userId: string
    screenName: string
    twitterUserId: string
  }> {
    // Retrieve and validate OAuth state
    let oauthState
    
    if (isNoDatabaseMode()) {
      cleanupExpiredOAuthStates()
      oauthState = inMemoryOAuthStates.get(state)
    } else {
      oauthState = await prisma.oAuthState.findUnique({
        where: { state }
      })
    }
    
    if (!oauthState) {
      throw new Error('Invalid OAuth state')
    }
    
    if (oauthState.expiresAt < new Date()) {
      // Clean up expired state
      if (isNoDatabaseMode()) {
        inMemoryOAuthStates.delete(state)
      } else {
        await prisma.oAuthState.delete({ where: { state } })
      }
      throw new Error('OAuth state expired')
    }
    
    if (oauthState.requestToken !== oauthToken) {
      throw new Error('OAuth token mismatch')
    }
    
    const apiKey = process.env.TWITTER_API_KEY!
    const apiSecret = process.env.TWITTER_API_SECRET!
    
    const accessTokenData = await TwitterService.getAccessToken(
      apiKey,
      apiSecret,
      oauthState.requestToken,
      oauthState.requestSecret,
      oauthVerifier
    )
    
    // Clean up OAuth state
    if (isNoDatabaseMode()) {
      inMemoryOAuthStates.delete(state)
    } else {
      await prisma.oAuthState.delete({ where: { state } })
    }
    
    return {
      accessToken: accessTokenData.oauth_token,
      accessSecret: accessTokenData.oauth_token_secret,
      userId: oauthState.userId,
      screenName: accessTokenData.screen_name,
      twitterUserId: accessTokenData.user_id
    }
  }
  
  /**
   * Clean up expired OAuth states
   */
  static async cleanupExpiredStates(): Promise<void> {
    if (isNoDatabaseMode()) {
      cleanupExpiredOAuthStates()
    } else {
      await prisma.oAuthState.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      })
    }
  }
}

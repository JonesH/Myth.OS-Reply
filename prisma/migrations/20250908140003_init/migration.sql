-- CreateTable
CREATE TABLE "scraped_tweets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tweetId" TEXT NOT NULL,
    "authorUsername" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL,
    "scrapedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "retweetCount" INTEGER NOT NULL DEFAULT 0,
    "replyCount" INTEGER NOT NULL DEFAULT 0,
    "quoteCount" INTEGER NOT NULL DEFAULT 0,
    "sentiment" TEXT,
    "sentimentScore" REAL,
    "topics" TEXT,
    "hashtags" TEXT,
    "mentions" TEXT,
    "urls" TEXT,
    "language" TEXT,
    "isRetweet" BOOLEAN NOT NULL DEFAULT false,
    "retweetedFrom" TEXT,
    "sourceJobId" TEXT,
    "sourceKeywords" TEXT
);

-- CreateTable
CREATE TABLE "tweet_analyses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tweetId" TEXT NOT NULL,
    "analysisType" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "confidence" REAL,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tweet_analyses_tweetId_fkey" FOREIGN KEY ("tweetId") REFERENCES "scraped_tweets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "profile_analytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT,
    "bio" TEXT,
    "followersCount" INTEGER NOT NULL DEFAULT 0,
    "followingCount" INTEGER NOT NULL DEFAULT 0,
    "tweetCount" INTEGER NOT NULL DEFAULT 0,
    "listedCount" INTEGER NOT NULL DEFAULT 0,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "avgLikesPerTweet" REAL,
    "avgRepliesPerTweet" REAL,
    "avgRetweetsPerTweet" REAL,
    "engagementRate" REAL,
    "mostActiveHours" TEXT,
    "postingFrequency" REAL,
    "topTopics" TEXT,
    "sentimentTrend" TEXT,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "oauth_states" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "requestToken" TEXT NOT NULL,
    "requestSecret" TEXT NOT NULL,
    "callbackUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "waitlist_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "company" TEXT,
    "useCase" TEXT,
    "twitterHandle" TEXT,
    "referralSource" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "preferredTemplates" TEXT,
    "customSymbols" TEXT,
    "replyStyle" TEXT,
    "formatPreferences" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "invitedAt" DATETIME
);

-- CreateTable
CREATE TABLE "reply_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "variables" TEXT NOT NULL,
    "symbols" TEXT,
    "tone" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "scraped_tweets_tweetId_key" ON "scraped_tweets"("tweetId");

-- CreateIndex
CREATE UNIQUE INDEX "profile_analytics_username_key" ON "profile_analytics"("username");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_states_state_key" ON "oauth_states"("state");

-- CreateIndex
CREATE UNIQUE INDEX "waitlist_entries_email_key" ON "waitlist_entries"("email");

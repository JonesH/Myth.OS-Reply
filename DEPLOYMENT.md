# Myth.OS-Reply Deployment Guide

## Vercel Deployment

### Prerequisites
1. **Database**: You need a PostgreSQL database for production. Recommended options:
   - [Neon](https://neon.tech/) (Free tier available)
   - [Supabase](https://supabase.com/) (Free tier available)
   - [PlanetScale](https://planetscale.com/) (Free tier available)

### Environment Variables
Set these in your Vercel dashboard:

#### Required
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Random secret key for NextAuth
- `NEXTAUTH_URL` - Your Vercel app URL (e.g., https://your-app.vercel.app)
- `JWT_SECRET` - Random secret key for JWT tokens

#### Twitter API (Required for Twitter features)
- `TWITTER_CLIENT_ID` - Twitter OAuth client ID
- `TWITTER_CLIENT_SECRET` - Twitter OAuth client secret

#### Optional
- `OPENROUTER_API_KEY` - For AI features
- `TWITTERIO_KEY` - For advanced Twitter analytics

### Database Setup
1. Create a PostgreSQL database
2. Copy the connection string to `DATABASE_URL`
3. The app will automatically run migrations on first deployment

### Deployment Steps
1. Connect your GitHub repository to Vercel
2. Set all environment variables
3. Deploy - the build process will:
   - Install dependencies
   - Generate Prisma client
   - Run database migrations
   - Build the Next.js app

### Local Development
For local development, the app uses SQLite. To switch to PostgreSQL:
1. Set `DATABASE_URL` in your `.env` file
2. Run `npx prisma migrate dev` to create migrations
3. Run `npx prisma generate` to update the client

## Features Included
- ✅ Subscription Management (Free/Basic/Premium tiers)
- ✅ Payment Flow with Theta blockchain integration
- ✅ Twitter OAuth integration
- ✅ AI-powered reply generation
- ✅ Real-time subscription status updates
- ✅ Professional responsive UI
- ✅ Usage tracking and analytics

# Myth.OS-Reply Deployment Guide

## Vercel Deployment (SQLite)

### Prerequisites
- No external database required! We're using SQLite with in-memory storage for Vercel.

### Environment Variables
Set these in your Vercel dashboard:

#### Required
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
- **Local Development**: Uses SQLite file (`./dev.db`)
- **Vercel Production**: Uses in-memory SQLite (data resets on each deployment)
- **No external database required!**

### Deployment Steps
1. Connect your GitHub repository to Vercel
2. Set environment variables (no DATABASE_URL needed)
3. Deploy - the build process will:
   - Install dependencies
   - Generate Prisma client
   - Build the Next.js app
   - Use in-memory SQLite for production

### Local Development
1. Create `.env.local` file with:
   ```
   DATABASE_URL="file:./dev.db"
   NEXTAUTH_SECRET=your-secret-key
   NEXTAUTH_URL=http://localhost:3000
   JWT_SECRET=your-jwt-secret
   TWITTER_CLIENT_ID=your-twitter-client-id
   TWITTER_CLIENT_SECRET=your-twitter-client-secret
   ```
2. Run `npx prisma migrate dev` to create migrations
3. Run `npm run dev` to start development server

### Important Notes
- **Vercel**: Data resets on each deployment (in-memory database)
- **Local**: Data persists in `./dev.db` file
- **For persistent data**: Consider upgrading to PostgreSQL later

## Features Included
- ✅ Subscription Management (Free/Basic/Premium tiers)
- ✅ Payment Flow with Theta blockchain integration
- ✅ Twitter OAuth integration
- ✅ AI-powered reply generation
- ✅ Real-time subscription status updates
- ✅ Professional responsive UI
- ✅ Usage tracking and analytics

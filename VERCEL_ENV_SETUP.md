# Vercel Environment Variables Setup

## Required Environment Variables

Set these in your Vercel Dashboard → Settings → Environment Variables:

### 1. DATABASE_URL (Required)
Use a managed Postgres instance (e.g., Neon, Supabase, Vercel Postgres):
```
file:/tmp/prisma/dev.db
```
**Note**: Use `/tmp/prisma/dev.db` for Vercel production (not `./prisma/dev.db`)

### 2. JWT_SECRET (Required)
```
your-super-secret-jwt-key-here-make-it-long-and-random
```

### 3. Demo Mode Variables (Required for deployment)
Enable demo mode to run without database:
```
DEMO_MODE=true
NEXT_PUBLIC_DEMO_MODE=true
```

### 5. NEXTAUTH_SECRET (Optional - for compatibility)
```
your-nextauth-secret-key-here
```

### 6. NEXTAUTH_URL (Optional - for compatibility)
```
https://your-domain.vercel.app
```

### 5. OPENROUTER_API_KEY (Required for AI features)
```
your-openrouter-api-key
```

### 6. TWITTER_API_KEY (Required for Twitter features)
```
your-twitter-api-key
```

### 7. TWITTER_CLIENT_ID (Required for Twitter OAuth)
```
your-twitter-client-id
```

## Steps to Set Environment Variables:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `Myth.OS-Reply`
3. Click **Settings** tab
4. Click **Environment Variables** in the sidebar
5. Add each variable above with the **Production** environment selected
6. Click **Save**
7. Go to **Deployments** tab and click **Redeploy** on the latest deployment

## Important Notes:

- **Demo Mode** is recommended for deployment - no database setup required
- **DATABASE_URL** must start with `file:` for SQLite (only needed if demo mode disabled)
- **Use `/tmp/prisma/dev.db` for Vercel production** (not `./prisma/dev.db`)
- **JWT_SECRET** must be set for authentication to work
- **DEMO_MODE and NEXT_PUBLIC_DEMO_MODE** should both be set to `true` for deployment
- All variables should be set for **Production** environment
- After setting variables, redeploy your project

## Demo Mode vs Database Mode

**Demo Mode (Recommended for deployment):**
- Set `DEMO_MODE=true` and `NEXT_PUBLIC_DEMO_MODE=true`
- No database setup required
- Uses in-memory demo data
- Perfect for showcasing functionality

**Database Mode (Development/Production with real data):**
- Set `DEMO_MODE=false` or omit the variable
- Requires proper DATABASE_URL configuration
- Uses real database with Prisma

## Troubleshooting:

If you still get DATABASE_URL errors:
1. Make sure DATABASE_URL is set to `file:/tmp/prisma/dev.db` (not `./prisma/dev.db`)
2. Check that the variable is set for **Production** environment
3. Redeploy after setting the variable
4. Check Vercel logs for any other missing variables

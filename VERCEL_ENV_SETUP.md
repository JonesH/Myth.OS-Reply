# Vercel Environment Variables Setup

## Required Environment Variables

Set these in your Vercel Dashboard → Settings → Environment Variables:

### 1. DATABASE_URL (Required)
Use a managed Postgres instance (e.g., Neon, Supabase, Vercel Postgres):
```
postgresql://USER:PASSWORD@HOST:PORT/DB_NAME?schema=public
```

### 2. JWT_SECRET (Required)
```
your-super-secret-jwt-key-here-make-it-long-and-random
```

### 3. NEXTAUTH_SECRET (Optional - for compatibility)
```
your-nextauth-secret-key-here
```

### 4. NEXTAUTH_URL (Optional - for compatibility)
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

- Use Postgres in Production. SQLite is only for quick local experiments.
- Set a strong `JWT_SECRET` even if demo mode is enabled.
- All variables should be set for the Production environment.
- After setting variables, redeploy your project.

## Optional: Demo Mode (no auth)

To showcase the app without authentication, you can enable demo mode:
```
DEMO_MODE=true
NEXT_PUBLIC_DEMO_MODE=true
```
In demo mode, protected API routes return a mock demo user and simulate success where needed.

## Troubleshooting:

If you still get DATABASE_URL errors:
1. Confirm the Postgres connection string is valid and reachable from Vercel
2. Check that the variable is set for the correct environment (Production/Preview/Development)
3. Redeploy after setting the variable
4. Check Vercel logs for any other missing variables

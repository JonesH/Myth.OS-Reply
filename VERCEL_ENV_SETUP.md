# Vercel Environment Variables Setup

## Required Environment Variables

Set these in your Vercel Dashboard → Settings → Environment Variables:

### 1. NO_DATABASE (Recommended for demo)
Use a single switch to avoid any database usage:
```
NO_DATABASE=true
```

### 2. JWT_SECRET (Required)
```
your-super-secret-jwt-key-here-make-it-long-and-random
```

### 3. DATABASE_URL (Only if NO_DATABASE=false)
If you run with a database, configure a proper connection string. For SQLite on Vercel:
```
file:/tmp/prisma/dev.db
```
Note: Use `/tmp/prisma/dev.db` for Vercel production (not `./prisma/dev.db`).

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

### 6. TWITTER_CLIENT_ID (Required for Twitter OAuth)
```
your-twitter-client-id
```
### 7. TWITTER_CLIENT_SECRET (Required for Twitter OAuth)
```
your-twitter-client-secret
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

- Set `NO_DATABASE=true` to run without any Prisma calls.
- If `NO_DATABASE=false`, ensure `DATABASE_URL` is set correctly.
- Use `/tmp/prisma/dev.db` for Vercel production (not `./prisma/dev.db`).
- JWT_SECRET must be set for authentication to work.
- All variables should be set for Production environment.
- After setting variables, redeploy your project.

## Modes

**No-DB Mode (Recommended for demo):**
- Set `NO_DATABASE=true`.
- No database setup required; in-memory/demo data is used where needed.
- Twitter OAuth via NextAuth remains real.

**Database Mode (Development/Production with real data):**
- Set `NO_DATABASE=false`.
- Requires proper `DATABASE_URL` configuration.
- Uses real database with Prisma.

## Troubleshooting:

If you still get DATABASE_URL errors with `NO_DATABASE=true`:
1. Double-check that `NO_DATABASE` is set for Production.
2. Redeploy after setting the variable.
3. If running with a DB, ensure `DATABASE_URL` is set to `file:/tmp/prisma/dev.db` on Vercel.

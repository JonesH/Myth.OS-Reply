# Vercel Deployment Guide

## Required Environment Variables

For authentication to work in production, you **MUST** set these environment variables in your Vercel dashboard:

### 🔐 Authentication (REQUIRED)
```bash
JWT_SECRET=your_secure_jwt_secret_key_here
NEXTAUTH_SECRET=your_secure_nextauth_secret_here
NEXTAUTH_URL=https://your-domain.vercel.app
```

### 🗄️ Database (REQUIRED)
```bash
DATABASE_URL=file::memory:?cache=shared
```

### 🤖 AI Configuration (OPTIONAL)
```bash
USE_OPENROUTER=false
EDGECLOUD_API_KEY=your_edgecloud_api_key
```

### 🐦 Twitter Integration (OPTIONAL)
```bash
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret
```

## How to Set Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable with the following settings:
   - **Name**: The variable name (e.g., `JWT_SECRET`)
   - **Value**: The actual value
   - **Environment**: Select **Production** (and Preview if needed)

## Common Issues & Solutions

### ❌ "Cannot login or register in production"

**Cause**: Missing `JWT_SECRET` environment variable

**Solution**: 
1. Set `JWT_SECRET` in Vercel environment variables
2. Use a secure, random string (at least 32 characters)
3. Redeploy your application

### ❌ "Database connection failed"

**Cause**: Missing `DATABASE_URL` or incorrect database configuration

**Solution**:
1. Set `DATABASE_URL=file::memory:?cache=shared` for SQLite
2. Ensure Prisma is configured correctly
3. Check that `prisma generate` runs during build

### ❌ "NextAuth configuration error"

**Cause**: Missing NextAuth environment variables

**Solution**:
1. Set `NEXTAUTH_SECRET` (secure random string)
2. Set `NEXTAUTH_URL` to your production domain
3. Ensure Twitter OAuth credentials are set if using Twitter login

## Testing Authentication

After setting environment variables:

1. **Test Registration**: Try creating a new account
2. **Test Login**: Try logging in with existing credentials
3. **Test Token Validation**: Check if dashboard loads correctly
4. **Debug Endpoint**: Visit `/api/debug/auth` to check configuration

## Security Notes

- **Never commit secrets to git**
- **Use different secrets for development and production**
- **Rotate secrets regularly**
- **Use strong, random strings for JWT_SECRET and NEXTAUTH_SECRET**

## Generate Secure Secrets

You can generate secure secrets using:

```bash
# Generate JWT secret
openssl rand -base64 32

# Generate NextAuth secret
openssl rand -base64 32
```

Or use online tools like:
- https://generate-secret.vercel.app/32
- https://www.allkeysgenerator.com/Random/Security-Encryption-Key-Generator.aspx

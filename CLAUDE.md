# CLAUDE.md

This file provides personalized guidance for Claude Code (claude.ai/code) when working with the MythosReply project.

## Project Overview

MythosReply is a sophisticated Twitter reply automation system built with Next.js 14 and TypeScript. It allows multiple users to manage automated AI-powered responses across multiple Twitter accounts using free OpenRouter models.

## Technology Stack & Architecture

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, React Hook Form
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: SQLite (dev), PostgreSQL (production)
- **Authentication**: JWT-based system with bcryptjs
- **Twitter Integration**: OAuth 1.0a with oauth-1.0a library
- **AI**: OpenRouter API with multiple free models (Gemma 2, Phi-3, Qwen 2)
- **API Documentation**: Swagger/OpenAPI integration

## Development Environment

- Use Node.js 18+
- Package manager: npm (standard Node.js approach)
- Environment: Next.js development server with hot reload

## Common Commands

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Production server
npm start

# Linting
npm run lint

# Database operations
npx prisma migrate dev
npx prisma generate
npx prisma studio
```

## Code Style and Best Practices

### TypeScript Configuration
- Use strict TypeScript settings enabled in tsconfig.json
- Leverage path aliases: `@/*` maps to `./src/*`
- Target ES5 with modern lib support

### Next.js App Router Patterns
- Use App Router (src/app/) structure
- API routes in `src/app/api/`
- Pages in `src/app/[route]/page.tsx`
- Layouts in `src/app/layout.tsx` and `src/app/[route]/layout.tsx`
- Use TypeScript for all files (.ts/.tsx)

### Component Structure
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   └── layout.tsx         # Root layout
├── components/            # Reusable components (if exists)
├── lib/                   # Utilities and configurations (if exists)
├── types/                 # TypeScript type definitions
└── middleware.ts          # Next.js middleware
```

### Database & Prisma Patterns
- Use Prisma schema in `prisma/schema.prisma`
- Models follow camelCase in schema, snake_case for table names with `@@map()`
- Relationships properly defined with cascade deletes
- Use cuid() for IDs
- JSON fields for complex data (keywords, usernames arrays)

### API Route Patterns
- Use Next.js 14 Route Handlers (app/api/)
- Proper HTTP methods (GET, POST, PUT, DELETE)
- JWT authentication middleware
- Error handling with appropriate status codes
- TypeScript for request/response types

### Authentication Flow
- JWT-based authentication system
- Password hashing with bcryptjs
- OAuth 1.0a for Twitter integration
- State management for OAuth flows

### Twitter Integration
- OAuth 1.0a flow with proper callback handling
- Rate limiting compliance (built-in delays)
- Multiple account support per user
- Tweet monitoring and automated replies

### AI Integration
- OpenRouter API for multiple free models
- Configurable AI tones and features
- Template-based reply generation
- Custom instructions support

## Environment Variables

Required environment variables (see env.example):

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/mythos_reply"

# Twitter API
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret  
TWITTER_BEARER_TOKEN=your_twitter_bearer_token

# NextAuth
NEXTAUTH_SECRET=your_nextauth_secret_key
NEXTAUTH_URL=http://localhost:3000

# JWT
JWT_SECRET=your_jwt_secret_key

# OpenRouter
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

## Database Schema Overview

Key models and relationships:
- **User**: Core user accounts with authentication
- **TwitterAccount**: Connected Twitter accounts per user
- **ReplyJob**: Automation job configurations with AI settings
- **Reply**: History of automated replies
- **ScrapedTweet**: Tweet data for monitoring
- **WaitlistEntry**: User registration waitlist
- **ReplyTemplate**: Predefined reply templates

## Key Features Implementation

### Multi-User System
- User registration and authentication
- Multiple Twitter accounts per user
- Isolated data per user with proper foreign keys

### Reply Automation
- Job-based system for automated replies
- Keyword monitoring and user targeting
- AI-powered response generation
- Rate limiting and compliance features

### Analytics & Monitoring
- Tweet scraping and analysis
- Profile analytics tracking
- Reply success/failure tracking
- Real-time dashboard updates

## Development Guidelines

### File Organization
- Keep API routes organized by feature (`/api/twitter/`, `/api/auth/`)
- Use descriptive component and page names
- Follow Next.js naming conventions

### Error Handling
- Use try/catch blocks in API routes
- Return appropriate HTTP status codes
- Log errors appropriately for debugging
- User-friendly error messages

### Security Practices
- Validate all inputs
- Use environment variables for secrets
- Implement proper authentication checks
- Rate limiting on API endpoints
- Secure credential storage

### Database Operations
- Use Prisma Client for type-safe database access
- Implement proper relationships and constraints
- Use transactions for multi-step operations
- Regular migrations for schema changes

## Testing & Quality

### Linting
- ESLint configuration with Next.js rules
- Run `npm run lint` before commits

### Development Workflow
1. Start development server: `npm run dev`
2. Make changes and test in browser
3. Check database with Prisma Studio: `npx prisma studio`
4. Run linting: `npm run lint`
5. Build and test: `npm run build`

## API Documentation

- Interactive API docs available at `/docs`
- Swagger/OpenAPI 3.0 specification
- Includes authentication, endpoints, and schemas
- Try-it-out functionality for testing

## Production Deployment

### Database Migration
```bash
npx prisma migrate deploy
npx prisma generate
```

### Build Process
```bash
npm run build
npm start
```

### Environment Setup
- Switch DATABASE_URL to PostgreSQL for production
- Ensure all environment variables are set
- Configure NEXTAUTH_URL for production domain

## Git Guidelines

### CRITICAL RULES - NEVER BREAK THESE:
- **NEVER** use `git add -A` or `git add .` - these are dangerous and can add unintended files
- **ALWAYS** add files explicitly by name: `git add src/specific_file.tsx`
- **ALWAYS** check `git status` and `git diff --staged` before committing
- **NEVER** commit without reviewing exactly what is being staged

### Safe Git Workflow:
```bash
# Check what's changed
git status

# Add specific files only
git add src/app/api/specific-route.ts
git add src/app/dashboard/page.tsx

# Review what will be committed
git diff --staged

# Commit with descriptive message
git commit -m "feat: add Twitter reply automation endpoint"
```

## Common Development Tasks

### Adding a New API Route
1. Create file in `src/app/api/[feature]/route.ts`
2. Implement proper HTTP methods
3. Add TypeScript types
4. Include authentication if needed
5. Test with API documentation page

### Adding a New Page
1. Create `src/app/[route]/page.tsx`
2. Add proper TypeScript props
3. Implement responsive design with Tailwind
4. Add to navigation if needed

### Database Schema Changes
1. Modify `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name describe_change`
3. Update related TypeScript types
4. Test with Prisma Studio

### Adding AI Features
1. Check OpenRouter model availability
2. Implement in reply generation logic
3. Add configuration options
4. Test with different tones and settings

## Final Notes

- Follow Next.js 14 App Router conventions
- Use TypeScript strictly for type safety
- Prioritize user experience and responsive design
- Respect Twitter API rate limits and terms of service
- Keep AI model usage efficient and cost-effective
- Maintain comprehensive API documentation
- Use this guide to maintain consistency across the MythosReply codebase
- You are acting as my blockchain integration assistant for the MythosReply project at the Theta BlockJam hackathon.
    •    Focus only on the smart contract + on-chain side: Solidity contracts, Foundry setup, deployment to Theta testnet, wallet/viem integration in Next.js API routes, Prisma schema fields for on-chain data, and receipt hashing.
    •    Ignore or leave placeholders for frontend (TypeScript/React, Tailwind), backend AI logic, or product/PM tasks — those are for my teammates.
    •    Keep your answers KISS (minimal contracts, event-only where possible, avoid unnecessary complexity).
    •    Output should be short, technical, and actionable: code snippets, command examples, and .env setup for on-chain parts.
    •    Assume I’m working on Theta testnet (chainId 365) with TFUEL gas, using Foundry for contracts and viem for integration.

Always check: “does this directly help me ship the blockchain integration for MythosReply?” If no → skip.
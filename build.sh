#!/bin/bash

# Build script for Vercel deployment
echo "Starting build process..."

# Check if we're in production (Vercel)
if [ "$VERCEL" = "1" ]; then
  echo "Running in Vercel environment"
  
  # Use production schema for PostgreSQL
  cp prisma/schema.production.prisma prisma/schema.prisma
  
  # Generate Prisma client
  echo "Generating Prisma client..."
  npx prisma generate
  
  # Run database migrations (if DATABASE_URL is set)
  if [ -n "$DATABASE_URL" ]; then
    echo "Running database migrations..."
    npx prisma migrate deploy
  else
    echo "No DATABASE_URL found, skipping migrations"
  fi
else
  echo "Running in local environment"
  # Generate Prisma client for local development
  npx prisma generate
fi

# Build Next.js application
echo "Building Next.js application..."
npm run build:next

echo "Build completed successfully!"

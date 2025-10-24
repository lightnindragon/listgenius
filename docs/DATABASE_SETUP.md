# Database Setup Guide

This guide explains how to set up the database and Redis for the ListGenius Keyword Research Engine.

## Prerequisites

1. **PostgreSQL Database** (local or cloud)
2. **Redis Instance** (Upstash recommended for Vercel deployment)

## Environment Variables

Add these environment variables to your `.env.local` file:

### Database Configuration
```env
# PostgreSQL Database URL
DATABASE_URL="postgresql://username:password@localhost:5432/listgenius?schema=public"
```

### Redis Configuration
```env
# Upstash Redis (recommended for production)
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_redis_token_here
```

## Database Setup Options

### Option 1: Local PostgreSQL

1. **Install PostgreSQL**:
   ```bash
   # macOS with Homebrew
   brew install postgresql
   brew services start postgresql

   # Ubuntu/Debian
   sudo apt-get install postgresql postgresql-contrib
   sudo systemctl start postgresql

   # Windows - download from postgresql.org
   ```

2. **Create Database**:
   ```sql
   CREATE DATABASE listgenius;
   CREATE USER listgenius_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE listgenius TO listgenius_user;
   ```

3. Leave `ETSY_MOCK_MODE=true` for development.

### Option 2: Supabase (Recommended for Production)

1. **Create Supabase Project**:
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Get your database URL from Settings > Database

2. **Use Supabase URL**:
   ```env
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
   ```

### Option 3: Neon (Serverless PostgreSQL)

1. **Create Neon Database**:
   - Go to [neon.tech](https://neon.tech)
   - Create a new database
   - Get your connection string

2. **Use Neon URL**:
   ```env
   DATABASE_URL="postgresql://[user]:[password]@[neon-hostname]/[database]?sslmode=require"
   ```

## Redis Setup Options

### Option 1: Upstash Redis (Recommended)

1. **Create Upstash Account**:
   - Go to [upstash.com](https://upstash.com)
   - Create a new Redis database
   - Get your REST URL and token

2. **Add to Environment**:
   ```env
   UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your_redis_token_here
   ```

### Option 2: Local Redis (Development Only)

1. **Install Redis**:
   ```bash
   # macOS with Homebrew
   brew install redis
   brew services start redis

   # Ubuntu/Debian
   sudo apt-get install redis-server
   sudo systemctl start redis-server

   # Windows - use WSL or Docker
   ```

2. **Update Redis Client**:
   ```typescript
   // For local development, you might need to modify lib/redis.ts
   // to use a different Redis client for local connections
   ```

## Database Migration

Once your database is set up:

1. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

2. **Run Database Migrations**:
   ```bash
   npx prisma migrate dev --name init
   ```

3. **Seed Initial Data** (optional):
   ```bash
   npx prisma db seed
   ```

## Verification

1. **Check Database Connection**:
   ```bash
   npx prisma studio
   ```

2. **Test Redis Connection**:
   ```bash
   # Add a test script to verify Redis connectivity
   ```

## Production Deployment

### Vercel Deployment

1. **Add Environment Variables** in Vercel dashboard:
   - `DATABASE_URL`
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

2. **Run Migrations**:
   ```bash
   npx prisma migrate deploy
   ```

3. **Generate Client**:
   ```bash
   npx prisma generate
   ```

### Database Schema

The database includes these main models:

- **Keyword**: Core keyword data
- **KeywordMetricsDaily**: Daily metrics for each keyword
- **KeywordSimilar**: Related keywords
- **KeywordSerpSample**: SERP analysis data
- **UserKeywordEvent**: User interaction tracking
- **CompetitorShop**: Competitor tracking
- **CompetitorSnapshot**: Competitor performance snapshots
- **ListingPerformance**: Listing performance metrics
- **KeywordRankTracking**: Rank tracking data
- **WeightsConfig**: Scoring algorithm weights

## Troubleshooting

### Common Issues

1. **Connection Refused**:
   - Check if PostgreSQL is running
   - Verify connection string format
   - Check firewall settings

2. **Authentication Failed**:
   - Verify username/password
   - Check user permissions
   - Ensure database exists

3. **Redis Connection Issues**:
   - Verify Upstash credentials
   - Check network connectivity
   - Ensure Redis instance is active

### Performance Optimization

1. **Connection Pooling**:
   - Use connection pooling for high-traffic applications
   - Monitor connection usage

2. **Indexing**:
   - Add indexes for frequently queried fields
   - Monitor query performance

3. **Caching Strategy**:
   - Use Redis for frequently accessed data
   - Implement cache invalidation strategies

## Security Considerations

1. **Environment Variables**:
   - Never commit `.env.local` to version control
   - Use strong passwords
   - Rotate credentials regularly

2. **Database Security**:
   - Use SSL connections in production
   - Limit database user permissions
   - Enable connection encryption

3. **Redis Security**:
   - Use authentication tokens
   - Enable TLS encryption
   - Restrict network access

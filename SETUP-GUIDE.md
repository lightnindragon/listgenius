# ListGenius Setup Guide - Manual Configuration Required

This document outlines everything YOU need to do to set up ListGenius. These are tasks that cannot be automated and require manual account creation, API key generation, and configuration.

---

## Table of Contents

1. [Core Services (Required for MVP)](#1-core-services-required-for-mvp)
2. [Phase 1-3: Customer & Social](#2-phase-1-3-customer--social)
3. [Phase 4: Chrome Extension](#3-phase-4-chrome-extension)
4. [Phase 11: Etsy Ads](#4-phase-11-etsy-ads)
5. [Phase 13: Social Media Expansion](#5-phase-13-social-media-expansion)
6. [Phase 16: Translation Services](#6-phase-16-translation-services)
7. [Phase 21: Print-on-Demand & Multi-Channel](#7-phase-21-print-on-demand--multi-channel)
8. [Phase 23: Video Services](#8-phase-23-video-services)
9. [Phase 24: Shipping Labels](#9-phase-24-shipping-labels)
10. [Database Setup](#10-database-setup)
11. [Deployment Configuration](#11-deployment-configuration)
12. [Webhook Configuration](#12-webhook-configuration)

---

## 1. Core Services (Required for MVP)

### OpenAI API Key

**What:** AI model access for listing generation, rewriting, alt text, etc.

**Steps:**
1. Go to https://platform.openai.com/
2. Sign up or log in
3. Navigate to "API Keys" section
4. Click "Create new secret key"
5. Copy the key (starts with `sk-`)
6. Add to `.env.local`:
   ```env
   OPENAI_API_KEY=sk-your-key-here
   OPENAI_MODEL_GENERATE=gpt-4o
   OPENAI_MODEL_FREE=gpt-4o-mini
   ```

**Cost:** Pay-as-you-go (~$5-$50/month depending on usage)

**Notes:** 
- Keep your API key secure - never commit to git
- Set usage limits in OpenAI dashboard to prevent unexpected charges
- Monitor usage in OpenAI dashboard

---

### Clerk Authentication

**What:** User authentication and management

**Steps:**
1. Go to https://clerk.com/
2. Sign up for an account (free tier available)
3. Create a new application
4. Copy "Publishable Key" and "Secret Key" from dashboard
5. Add to `.env.local`:
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your-key
   CLERK_SECRET_KEY=sk_test_your-key
   ```
6. Configure allowed domains in Clerk dashboard
7. Set up OAuth providers if desired (Google, GitHub, etc.)
8. Configure user metadata fields:
   - `plan` (string)
   - `dailyGenCount` (number)
   - `lastGenReset` (string/date)
   - `rewriteCount` (number)
   - `lastRewriteReset` (string/date)
   - `preferredTone` (string)
   - `preferredNiche` (string)
   - `etsyAccessToken` (string, encrypted)
   - `etsyRefreshToken` (string, encrypted)
   - `etsyShopId` (string)

**Cost:** Free for up to 10,000 monthly active users

**Notes:**
- Production keys are different from test keys
- Update keys in Vercel when deploying

---

### Stripe Payment Processing

**What:** Subscription billing and payment processing

**Steps:**
1. Go to https://stripe.com/
2. Sign up for an account
3. Navigate to "Developers" → "API Keys"
4. Copy "Publishable Key" and "Secret Key"
5. Create products and pricing plans:
   - Navigate to "Products" → "Add Product"
   - Create 4 products:
     - **Free** (no Stripe product needed)
     - **Pro** - $29/month
     - **Business** - $79/month
     - **Agency** - $199/month
6. Copy Price IDs for each plan
7. Add to `.env.local`:
   ```env
   STRIPE_SECRET_KEY=sk_test_your-key
   NEXT_PUBLIC_STRIPE_PRICE_ID_PRO=price_xxxxx
   NEXT_PUBLIC_STRIPE_PRICE_ID_BUSINESS=price_xxxxx
   NEXT_PUBLIC_STRIPE_PRICE_ID_AGENCY=price_xxxxx
   ```
8. Set up webhook endpoint (see [Webhook Configuration](#12-webhook-configuration))

**Cost:** 2.9% + $0.30 per successful charge

**Notes:**
- Use test mode during development
- Switch to live mode for production
- Configure tax settings if needed
- Set up billing portal settings

---

### Etsy Integration

**What:** Connect to Etsy API for listing management

**Steps:**
1. Go to https://www.etsy.com/developers/
2. Sign in with your Etsy account
3. Click "Register as a Developer"
4. Create a new app:
   - App Name: "ListGenius"
   - App Description: Brief description of your app
   - Expected use: Select appropriate option
5. Wait for approval (can take 1-2 weeks)
6. Once approved, get credentials:
   - Keystring (Client ID)
   - Shared Secret (Client Secret)
7. Add to `.env.local`:
   ```env
   ETSY_CLIENT_ID=your_keystring
   ETSY_CLIENT_SECRET=your_shared_secret
   ETSY_REDIRECT_URI=https://yourdomain.com/api/etsy/oauth
   ETSY_API_BASE=https://openapi.etsy.com/v3
   ETSY_MOCK_MODE=false
   ```
8. Configure OAuth redirect URI in Etsy app settings

**Cost:** Free

**Notes:**
- Keep `ETSY_MOCK_MODE=true` until app is approved
- Etsy approval process can be slow
- Must have active Etsy shop to apply
- Production redirect URI must match exactly

---

### Encryption Key

**What:** Encrypt sensitive data like Etsy tokens

**Steps:**
1. Generate a 32-byte hex key:
   ```bash
   # On Windows PowerShell:
   -join ((48..57) + (97..102) | Get-Random -Count 64 | ForEach-Object {[char]$_})
   
   # On Mac/Linux:
   openssl rand -hex 32
   ```
2. Add to `.env.local`:
   ```env
   ENCRYPTION_KEY=your_64_character_hex_key
   ```

**Cost:** Free

**Notes:**
- NEVER commit this to git
- Store securely - losing this means losing encrypted data
- Use different keys for development and production

---

### App URL

**What:** Base URL for your application

**Steps:**
1. For local development:
   ```env
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_PUBLIC_ENV=development
   ```
2. For production (after deploying to Vercel):
   ```env
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   NEXT_PUBLIC_ENV=production
   ```

**Cost:** Free

**Notes:**
- Must be exact URL including https://
- No trailing slash
- Update when domain changes

---

## 2. Phase 1-3: Customer & Social

### SendGrid (Email Service)

**What:** Send transactional and marketing emails

**Steps:**
1. Go to https://sendgrid.com/
2. Sign up for account
3. Navigate to "Settings" → "API Keys"
4. Create new API key with "Full Access"
5. Verify sender email address
6. Add to `.env.local`:
   ```env
   SENDGRID_API_KEY=SG.your-key-here
   SENDGRID_FROM_EMAIL=noreply@yourdomain.com
   SENDGRID_FROM_NAME=ListGenius
   ```

**Cost:** Free for up to 100 emails/day

**Alternatives:** Mailgun, Resend, Amazon SES

---

### Pinterest API

**What:** Post pins and track analytics

**Steps:**
1. Go to https://developers.pinterest.com/
2. Create a developer account
3. Create a new app
4. Get OAuth credentials:
   - App ID
   - App Secret
5. Configure redirect URI
6. Add to `.env.local`:
   ```env
   PINTEREST_APP_ID=your-app-id
   PINTEREST_APP_SECRET=your-app-secret
   PINTEREST_REDIRECT_URI=https://yourdomain.com/api/pinterest/oauth
   ```

**Cost:** Free

**Notes:**
- Requires business Pinterest account
- Users connect their own Pinterest via OAuth

---

## 3. Phase 4: Chrome Extension

### Chrome Web Store Account

**What:** Publish Chrome extension

**Steps:**
1. Go to https://chrome.google.com/webstore/devconsole
2. Pay one-time $5 developer fee
3. Create developer account
4. Prepare extension assets:
   - Icon (128x128, 48x48, 16x16)
   - Screenshots (1280x800 or 640x400)
   - Promotional images
   - Privacy policy URL
   - Description and marketing copy
5. Submit extension for review
6. Wait for approval (1-3 days typically)

**Cost:** $5 one-time developer fee

**Notes:**
- Review process can reject for various reasons
- Need privacy policy URL
- Keep extension updated

---

## 4. Phase 11: Etsy Ads

### Etsy Ads Access

**What:** Analyze and optimize Etsy Ads performance

**Steps:**
1. Must have Etsy shop with active Etsy Ads
2. No separate API key needed
3. Access via Etsy OAuth token (same as listings)
4. Etsy Ads data available through Etsy API v3

**Cost:** Free (requires Etsy Ads spend)

**Notes:**
- Can only access data for connected shops
- Etsy Ads budget managed separately in Etsy

---

## 5. Phase 13: Social Media Expansion

### Instagram Business API

**What:** Post to Instagram and track analytics

**Steps:**
1. Convert Instagram to Business Account
2. Connect to Facebook Page
3. Go to https://developers.facebook.com/
4. Create app
5. Add Instagram Basic Display API
6. Get access tokens
7. Add to `.env.local`:
   ```env
   INSTAGRAM_APP_ID=your-app-id
   INSTAGRAM_APP_SECRET=your-app-secret
   INSTAGRAM_REDIRECT_URI=https://yourdomain.com/api/instagram/oauth
   ```

**Cost:** Free

**Notes:**
- Must have Business or Creator Instagram account
- Requires Facebook Page connection
- API has rate limits

---

### Facebook Business API

**What:** Post to Facebook and manage ads

**Steps:**
1. Go to https://developers.facebook.com/
2. Create developer account
3. Create new app
4. Add Facebook Login and Pages API
5. Get app credentials
6. Add to `.env.local`:
   ```env
   FACEBOOK_APP_ID=your-app-id
   FACEBOOK_APP_SECRET=your-app-secret
   FACEBOOK_REDIRECT_URI=https://yourdomain.com/api/facebook/oauth
   ```

**Cost:** Free

**Notes:**
- Business verification may be required
- Separate ads account for Facebook Ads

---

### TikTok Business API

**What:** Post videos and track analytics

**Steps:**
1. Go to https://developers.tiktok.com/
2. Create developer account
3. Apply for API access (approval required)
4. Create app
5. Get credentials
6. Add to `.env.local`:
   ```env
   TIKTOK_APP_ID=your-app-id
   TIKTOK_APP_SECRET=your-app-secret
   TIKTOK_REDIRECT_URI=https://yourdomain.com/api/tiktok/oauth
   ```

**Cost:** Free

**Notes:**
- API access approval can take time
- Must have TikTok Business account

---

## 6. Phase 16: Translation Services

### Google Cloud Translation API

**What:** Translate listings to multiple languages

**Steps:**
1. Go to https://console.cloud.google.com/
2. Create new project or select existing
3. Enable "Cloud Translation API"
4. Create service account key:
   - IAM & Admin → Service Accounts
   - Create Service Account
   - Grant "Cloud Translation API User" role
   - Create JSON key
5. Add to `.env.local`:
   ```env
   GOOGLE_TRANSLATE_API_KEY=your-api-key
   # OR if using service account:
   GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
   ```

**Cost:** $20 per 1M characters

**Alternative:** DeepL (below)

---

### DeepL API

**What:** Higher quality translation alternative

**Steps:**
1. Go to https://www.deepl.com/pro-api
2. Sign up for API plan
3. Get API key from account
4. Add to `.env.local`:
   ```env
   DEEPL_API_KEY=your-api-key
   ```

**Cost:** Free tier: 500,000 characters/month

**Notes:**
- Better quality than Google for many languages
- Fewer languages supported than Google

---

## 7. Phase 21: Print-on-Demand & Multi-Channel

### Printful API

**What:** POD integration for products

**Steps:**
1. Go to https://www.printful.com/
2. Sign up for account
3. Navigate to Settings → API
4. Generate API key
5. Add to `.env.local`:
   ```env
   PRINTFUL_API_KEY=your-api-key
   ```

**Cost:** Free (pay per order)

**Notes:**
- No monthly fees, only per-product costs
- Products created in Printful dashboard

---

### Printify API

**What:** Alternative POD service

**Steps:**
1. Go to https://printify.com/
2. Sign up for account
3. Get API token from settings
4. Add to `.env.local`:
   ```env
   PRINTIFY_API_TOKEN=your-token
   ```

**Cost:** Free or Premium ($29/month for better margins)

---

### Amazon MWS (Marketplace Web Service)

**What:** Multi-channel inventory sync with Amazon

**Steps:**
1. Have Amazon Seller account
2. Go to Amazon Seller Central
3. Navigate to Settings → User Permissions
4. Request MWS access
5. Get credentials:
   - Access Key ID
   - Secret Access Key
   - Seller ID
   - Marketplace ID
6. Add to `.env.local`:
   ```env
   AMAZON_MWS_ACCESS_KEY=your-access-key
   AMAZON_MWS_SECRET_KEY=your-secret-key
   AMAZON_SELLER_ID=your-seller-id
   AMAZON_MARKETPLACE_ID=your-marketplace-id
   ```

**Cost:** Included with Amazon Seller account

**Notes:**
- Professional seller account recommended
- Complex API with many requirements

---

### eBay API

**What:** Multi-channel inventory sync with eBay

**Steps:**
1. Go to https://developer.ebay.com/
2. Create developer account
3. Create app
4. Get credentials:
   - App ID
   - Client ID
   - Client Secret
5. Add to `.env.local`:
   ```env
   EBAY_APP_ID=your-app-id
   EBAY_CLIENT_ID=your-client-id
   EBAY_CLIENT_SECRET=your-client-secret
   ```

**Cost:** Free

**Notes:**
- Sandbox available for testing
- OAuth required for user access

---

### Shopify API

**What:** Multi-channel inventory sync with Shopify

**Steps:**
1. Have Shopify store or create one
2. Go to Shopify Admin → Apps → Manage private apps
3. Enable private app development
4. Create private app
5. Get credentials:
   - API Key
   - Password
   - Store name
6. Add to `.env.local`:
   ```env
   SHOPIFY_API_KEY=your-api-key
   SHOPIFY_API_SECRET=your-password
   SHOPIFY_STORE_NAME=yourstore.myshopify.com
   ```

**Cost:** Included with Shopify plan

---

## 8. Phase 23: Video Services

### YouTube Data API

**What:** Video optimization and analytics

**Steps:**
1. Go to https://console.cloud.google.com/
2. Create project or use existing
3. Enable "YouTube Data API v3"
4. Create credentials (API Key)
5. Add to `.env.local`:
   ```env
   YOUTUBE_API_KEY=your-api-key
   ```

**Cost:** Free (10,000 quota units/day)

**Notes:**
- Separate OAuth needed for uploading videos
- Read-only operations use API key

---

### Vimeo API

**What:** Alternative video platform

**Steps:**
1. Go to https://developer.vimeo.com/
2. Create app
3. Generate access token
4. Add to `.env.local`:
   ```env
   VIMEO_ACCESS_TOKEN=your-access-token
   ```

**Cost:** Free tier available

---

## 9. Phase 24: Shipping Labels

### Shippo API

**What:** Multi-carrier shipping label generation

**Steps:**
1. Go to https://goshippo.com/
2. Sign up for account
3. Navigate to Settings → API
4. Copy API token
5. Add to `.env.local`:
   ```env
   SHIPPO_API_KEY=your-api-key
   ```

**Cost:** $0.05 per label + carrier costs

**Alternative:** EasyPost (below)

---

### EasyPost API

**What:** Alternative shipping label service

**Steps:**
1. Go to https://www.easypost.com/
2. Sign up for account
3. Get API key from dashboard
4. Add to `.env.local`:
   ```env
   EASYPOST_API_KEY=your-api-key
   ```

**Cost:** $0.05 per label + carrier costs

---

## 10. Database Setup

### Supabase (Recommended) or Neon

**What:** PostgreSQL database for keyword engine and advanced features

**Steps for Supabase:**
1. Go to https://supabase.com/
2. Create account and new project
3. Get connection string from Settings → Database
4. Add to `.env.local`:
   ```env
   DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres
   ```
5. Run migrations:
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

**Cost:** Free tier: 500MB database, 2GB bandwidth

**Steps for Neon:**
1. Go to https://neon.tech/
2. Create account and project
3. Get connection string
4. Follow same steps as Supabase

---

### Upstash Redis

**What:** Cache and queue system for background jobs

**Steps:**
1. Go to https://upstash.com/
2. Create account
3. Create Redis database
4. Get connection details:
   - REST URL
   - REST Token
5. Add to `.env.local`:
   ```env
   UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your-token
   ```

**Cost:** Free tier: 10,000 commands/day

---

## 11. Deployment Configuration

### Vercel Deployment

**What:** Deploy Next.js app to production

**Steps:**
1. Go to https://vercel.com/
2. Sign up with GitHub account
3. Import repository
4. Configure environment variables (copy all from `.env.local`)
5. Deploy
6. Set up custom domain (optional):
   - Add domain in Vercel
   - Update DNS records with your registrar
7. Update environment variables with production values:
   - `NEXT_PUBLIC_APP_URL` → production URL
   - All OAuth redirect URIs → production URLs
   - Switch Stripe/Clerk to production keys

**Cost:** Free for hobby projects

**Notes:**
- Each git push to main auto-deploys
- Environment variables are separate per project
- Set up different projects for staging/production

---

## 12. Webhook Configuration

### Stripe Webhooks

**What:** Receive subscription update notifications

**Steps:**
1. In Stripe Dashboard, go to Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Select events to listen for:
   - `invoice.payment_succeeded`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy webhook signing secret
5. Add to `.env.local`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_your-secret
   ```
6. Test webhook with Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

**Cost:** Free

**Notes:**
- Use different webhook secrets for test and live mode
- Verify webhook signatures in code
- Set up separate endpoints for test/production

---

### Vercel Cron Jobs

**What:** Schedule background tasks

**Steps:**
1. Create `vercel.json` in project root:
   ```json
   {
     "crons": [
       {
         "path": "/api/cron/daily-rank-tracking",
         "schedule": "0 2 * * *"
       },
       {
         "path": "/api/cron/update-keyword-metrics",
         "schedule": "0 */6 * * *"
       }
     ]
   }
   ```
2. Deploy to Vercel
3. Verify crons in Vercel dashboard

**Cost:** Free on Hobby plan (1 per day), Pro+ for more

**Notes:**
- Times are in UTC
- Use standard cron syntax
- Protect endpoints with secret tokens

---

## 13. Additional Manual Configurations

### Domain Setup (Optional)

**What:** Custom domain for your app

**Steps:**
1. Purchase domain from registrar (GoDaddy, Namecheap, etc.)
2. In Vercel, add domain to project
3. Update DNS records at registrar:
   - Add A record or CNAME as instructed by Vercel
4. Wait for DNS propagation (can take up to 48 hours)
5. Enable SSL (automatic in Vercel)
6. Update all environment variables with new domain
7. Update OAuth redirect URIs in all services

**Cost:** $10-15/year for domain

---

### Privacy Policy & Terms of Service

**What:** Legal pages required for app stores and GDPR compliance

**Steps:**
1. Use generator like https://www.termsfeed.com/ or hire lawyer
2. Create pages for:
   - Privacy Policy
   - Terms of Service
   - Cookie Policy (if applicable)
3. Add links in footer
4. Required for:
   - Chrome Web Store
   - Mobile app stores
   - GDPR compliance
   - Third-party API requirements

**Cost:** Free (generators) to $500+ (lawyer)

---

## Quick Reference: Environment Variables Checklist

Copy this template to your `.env.local`:

```env
# ===== CORE SERVICES (REQUIRED) =====
OPENAI_API_KEY=
OPENAI_MODEL_GENERATE=gpt-4o
OPENAI_MODEL_FREE=gpt-4o-mini

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PRICE_ID_PRO=
NEXT_PUBLIC_STRIPE_PRICE_ID_BUSINESS=
NEXT_PUBLIC_STRIPE_PRICE_ID_AGENCY=
STRIPE_WEBHOOK_SECRET=

ETSY_CLIENT_ID=
ETSY_CLIENT_SECRET=
ETSY_REDIRECT_URI=http://localhost:3000/api/etsy/oauth
ETSY_API_BASE=https://openapi.etsy.com/v3
ETSY_MOCK_MODE=true

ENCRYPTION_KEY=

NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ENV=development

# ===== PHASE 1-3: EMAIL & SOCIAL =====
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=
SENDGRID_FROM_NAME=

PINTEREST_APP_ID=
PINTEREST_APP_SECRET=
PINTEREST_REDIRECT_URI=

# ===== PHASE 13: SOCIAL MEDIA =====
INSTAGRAM_APP_ID=
INSTAGRAM_APP_SECRET=
INSTAGRAM_REDIRECT_URI=

FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
FACEBOOK_REDIRECT_URI=

TIKTOK_APP_ID=
TIKTOK_APP_SECRET=
TIKTOK_REDIRECT_URI=

# ===== PHASE 16: TRANSLATION =====
GOOGLE_TRANSLATE_API_KEY=
DEEPL_API_KEY=

# ===== PHASE 21: POD & MULTI-CHANNEL =====
PRINTFUL_API_KEY=
PRINTIFY_API_TOKEN=

AMAZON_MWS_ACCESS_KEY=
AMAZON_MWS_SECRET_KEY=
AMAZON_SELLER_ID=
AMAZON_MARKETPLACE_ID=

EBAY_APP_ID=
EBAY_CLIENT_ID=
EBAY_CLIENT_SECRET=

SHOPIFY_API_KEY=
SHOPIFY_API_SECRET=
SHOPIFY_STORE_NAME=

# ===== PHASE 23: VIDEO SERVICES =====
YOUTUBE_API_KEY=
VIMEO_ACCESS_TOKEN=

# ===== PHASE 24: SHIPPING =====
SHIPPO_API_KEY=
EASYPOST_API_KEY=

# ===== DATABASE & CACHE =====
DATABASE_URL=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

---

## Estimated Total Setup Costs

### One-Time Costs:
- Chrome Web Store developer fee: $5
- Domain name (optional): $10-15/year

### Monthly Costs (Free Tiers):
- OpenAI: ~$5-50 (pay-as-you-go, varies by usage)
- Clerk: Free (up to 10K MAU)
- Stripe: 2.9% + $0.30 per transaction
- Vercel: Free (hobby), $20/month (Pro)
- Supabase: Free (500MB), $25/month (Pro)
- SendGrid: Free (100 emails/day)
- Most other services: Free tiers available

### Estimated Monthly for Small Shop:
- **Minimum**: $5-20/month (OpenAI usage only)
- **Comfortable**: $50-100/month (includes Pro Vercel, Supabase)
- **Scaling**: $200+/month (as usage grows)

---

## Priority Setup Order

### Phase 0: MVP (Required Now)
1. OpenAI API key ✅
2. Clerk authentication ✅
3. Stripe payment processing ✅
4. Etsy API credentials (keep in mock mode until approved) ✅
5. Encryption key ✅
6. App URL configuration ✅

### Phase 1: When Starting Phase 1
1. SendGrid email service
2. Database (Supabase/Neon)
3. Redis (Upstash)

### Phase 3: When Starting Phase 3
1. Pinterest API

### Phase 4: When Starting Phase 4
1. Chrome Web Store account

### Phases 5+: As Needed
- Set up each service when starting its respective phase
- Don't pay for services you're not using yet

---

## Security Best Practices

1. **NEVER commit `.env.local` to git** - Already in `.gitignore`
2. **Use different keys for development and production**
3. **Rotate keys periodically** (every 3-6 months)
4. **Store production keys securely** (password manager)
5. **Monitor API usage** to detect unauthorized access
6. **Enable 2FA** on all service accounts
7. **Use separate email** for service accounts vs personal
8. **Set up billing alerts** to prevent unexpected charges

---

## Troubleshooting Common Issues

### "Invalid API Key" Errors
- Double-check key is copied correctly (no extra spaces)
- Ensure key is for correct environment (test vs live)
- Check if key has expired or been revoked
- Verify service account has correct permissions

### OAuth Redirect URI Mismatch
- Ensure redirect URI in `.env.local` exactly matches what's configured in service
- Include https:// (or http:// for localhost)
- No trailing slash
- Case-sensitive

### Webhook Not Receiving Events
- Check webhook URL is publicly accessible
- Verify webhook secret is correct
- Check webhook is enabled in service dashboard
- Review webhook logs in service dashboard
- Use test tools (Stripe CLI, RequestBin) to debug

### Database Connection Errors
- Check DATABASE_URL format is correct
- Verify database is running and accessible
- Check firewall/IP whitelist settings
- Ensure SSL mode is correct in connection string

---

## Getting Help

If you encounter issues during setup:

1. **Check service documentation** - Each service has setup guides
2. **Review service status pages** - Check for outages
3. **Search error messages** - Often someone has solved it
4. **Check our GitHub issues** - Or create new one
5. **Contact service support** - Most have chat/email support

---

**Last Updated:** January 2025

**Document Version:** 1.0


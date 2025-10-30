# ListGenius - AI Etsy Listing Expert

ListGenius is an AI-powered platform that helps Etsy sellers create SEO-optimized product listings. Generate professional titles, descriptions, and tags that rank higher and sell more.

## Disabled Features

The following features are temporarily disabled and archived in `/disabled-features/`:

- **Translation Services** - Google Translate & DeepL integration
- **Video Marketing** - YouTube/Vimeo optimization
- **Social Media** - Instagram, TikTok, Facebook, Pinterest (ALL platforms disabled)
- **Print-on-Demand** - Printful/Printify integration
- **Accounting Integration** - QuickBooks/Xero sync
- **Mobile App** - React Native iOS/Android app

These features can be re-enabled in the future. See `/disabled-features/README.md` for instructions.

## Active Features

ListGenius currently focuses on core Etsy listing optimization:

- 🤖 **AI Listing Generation**: Create optimized titles, descriptions, and tags using GPT-4o
- 🎯 **Etsy SEO Optimization**: Built-in understanding of Etsy's algorithm and ranking factors
- 🔄 **Rewrite & Improve**: Enhance existing listings for better performance
- 📊 **Rate Limiting**: Fair usage limits with upgrade options
- 🎨 **Tone Presets**: Professional, Casual, Luxury, Playful, and more
- 📱 **Mobile Responsive**: Works perfectly on all devices
- 🔒 **Secure**: Enterprise-grade security with Clerk authentication
- 💳 **Stripe Integration**: Seamless subscription management
- 📧 **Email Automation**: Automated welcome emails and affiliate notifications
- 📈 **Keyword Research**: Advanced keyword tools and rank tracking
- 🏪 **Shop Analytics**: Competitor analysis and performance tracking
- 💰 **Financial Tracking**: Internal expense and profit tracking

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Authentication**: Clerk
- **Payments**: Stripe
- **AI**: OpenAI GPT-4o / GPT-4o-mini
- **Database**: Clerk Metadata (MVP)
- **Deployment**: Vercel

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key
- Clerk account
- Stripe account (for payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/listgenius.git
   cd listgenius
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   # OpenAI
   OPENAI_API_KEY=your_openai_api_key
   OPENAI_MODEL_GENERATE=gpt-4o
   OPENAI_MODEL_FREE=gpt-4o-mini
   
   # Clerk Auth
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   
   # Stripe Billing
   STRIPE_SECRET_KEY=your_stripe_secret_key
   NEXT_PUBLIC_STRIPE_PRICE_ID_PRO=your_pro_price_id
   NEXT_PUBLIC_STRIPE_PRICE_ID_BUSINESS=your_business_price_id
   NEXT_PUBLIC_STRIPE_PRICE_ID_AGENCY=your_agency_price_id
   STRIPE_WEBHOOK_SECRET=your_webhook_secret
   
   # App Config
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_PUBLIC_ENV=development
   
   # Etsy Integration
   ETSY_MOCK_MODE=true  # Set to false when ready for real API
   ETSY_CLIENT_ID=your_etsy_keystring
   ETSY_CLIENT_SECRET=your_etsy_shared_secret
   ETSY_REDIRECT_URI=http://localhost:3000/api/etsy/oauth
   ETSY_API_BASE=https://openapi.etsy.com/v3
   ETSY_SANDBOX_MODE=true
   
   # Security
   ENCRYPTION_KEY=your_32_byte_hex_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Etsy Integration

ListGenius includes comprehensive Etsy integration that supports both **mock mode** (for development/testing) and **real API mode** (once your Etsy app is approved).

### Mock Mode (Default)

By default, the app runs in mock mode with `ETSY_MOCK_MODE=true`. This allows you to:
- Test all Etsy features without real API credentials
- Import and manage mock listings
- Upload and reorder images
- Generate AI alt text for images
- Test the complete workflow before going live

Mock data includes:
- 3 sample Etsy listings with images
- Shop sections and shipping profiles
- Realistic API delays and responses

### Switching to Real Etsy API

When your Etsy app is approved:

1. **Update environment variables**:
   ```env
   ETSY_MOCK_MODE=false
   ETSY_CLIENT_ID=your_actual_keystring
   ETSY_CLIENT_SECRET=your_actual_shared_secret
   ```

2. **OAuth Flow**: Users connect their Etsy shop via Settings → Etsy Connection

3. **Features Available**:
   - Import real listings from connected Etsy shop
   - Edit and rewrite listing content with AI
   - Upload/reorder/delete listing images
   - Generate SEO-optimized alt text with GPT-4o Vision
   - Publish updates directly back to Etsy
   - Create new listings and publish to Etsy

### Image Management Features

- **Drag-and-drop reordering**: Change image order visually
- **AI alt text generation**: GPT-4o Vision analyzes images and generates SEO-friendly alt text
- **Bulk upload**: Upload multiple images at once
- **Alt text editing**: Edit alt text inline with character counter (250 char limit)
- **Image preview**: See thumbnails with rank indicators

### API Routes

All Etsy integration routes automatically switch between mock and real data:

- `GET /api/etsy/listings` - Fetch listings
- `GET /api/etsy/listings/[id]` - Get listing details
- `PUT /api/etsy/listings/[id]` - Update listing
- `GET /api/etsy/listings/[id]/images` - Get listing images
- `POST /api/etsy/listings/[id]/images` - Upload image
- `PUT /api/etsy/listings/[id]/images` - Reorder images
- `PUT /api/etsy/listings/[id]/images/[imageId]` - Update image alt text
- `DELETE /api/etsy/listings/[id]/images/[imageId]` - Delete image
- `GET /api/etsy/shop/sections` - Get shop sections
- `GET /api/etsy/shop/shipping` - Get shipping profiles
- `POST /api/generate-alt-text` - Generate AI alt text for images

### Components

- **ImageManager**: Comprehensive image management with drag-drop, upload, delete
- **AIAltTextGenerator**: Standalone alt text generation with GPT-4o Vision
- **Listing Management**: Edit listings with image management via dedicated pages
- **My Listings**: View and manage all Etsy listings

## Manual Testing Checklist

### Authentication & User Management
- [ ] Sign up creates user account and defaults to free plan
- [ ] Sign in works correctly
- [ ] Sign out redirects to home page
- [ ] Protected routes require authentication

### Core Generation Features
- [ ] Generate API returns valid JSON with 13 tags ≤20 chars
- [ ] Title is ≤15 words and includes focus keywords
- [ ] Description is 250-600 words with proper SEO structure
- [ ] Tags are exactly 13, unique, and follow Etsy rules
- [ ] Materials are exactly 13 items
- [ ] Pinterest caption generated when requested
- [ ] Etsy message generated when requested

### Rate Limiting & Plans
- [ ] Free user hits 3/day limit → 429 error with upgrade prompt
- [ ] Free user hits 1/day rewrite limit → 429 error
- [ ] Pro+ users have unlimited generation
- [ ] Rate limits reset daily

### Stripe Integration
- [ ] Pricing page displays all 4 plans correctly
- [ ] Stripe checkout redirects work for paid plans
- [ ] Webhook updates user plan to pro/business/agency
- [ ] Customer portal link works for subscription management
- [ ] Plan downgrade reverts to free plan

### UI/UX
- [ ] Mobile responsive design works on all screen sizes
- [ ] Copy buttons work for all generated content
- [ ] Toast notifications appear for success/error states
- [ ] Loading states display during API calls
- [ ] Form validation prevents invalid submissions

### SEO & Performance
- [ ] Landing page loads quickly with proper meta tags
- [ ] Sitemap.xml is accessible
- [ ] Robots.txt blocks admin and API routes
- [ ] Open Graph images display correctly

## API Endpoints

### Generation
- `POST /api/generate` - Generate or rewrite listings

### Authentication
- `GET /api/auth/sign-in` - Clerk sign-in page
- `GET /api/auth/sign-up` - Clerk sign-up page

### Billing
- `POST /api/stripe/checkout` - Create checkout session
- `POST /api/stripe/webhook` - Handle Stripe webhooks

### Etsy Integration (Future)
- `GET /api/etsy/oauth` - Etsy OAuth flow
- `GET /api/etsy/me` - Get connected shop info
- `GET /api/etsy/listings` - List active listings
- `PUT /api/etsy/listings/[id]` - Update listing

## Project Structure

```
listgenius/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication pages
│   ├── (marketing)/              # Marketing pages
│   ├── api/                      # API routes
│   ├── app/                      # Main application
│   └── globals.css               # Global styles
├── components/                   # React components
│   ├── ui/                       # Base UI components
│   └── *.tsx                     # Feature components
├── config/                       # Configuration files
│   ├── platforms/                # Platform rules (Etsy)
│   └── prompts/                  # AI prompt templates
├── lib/                          # Utility libraries
│   ├── openai.ts                 # OpenAI client
│   ├── stripe.ts                 # Stripe client
│   ├── clerk.ts                  # Clerk helpers
│   └── *.ts                      # Other utilities
├── types/                        # TypeScript definitions
└── public/                       # Static assets
```

## Deployment

### Vercel Deployment

1. **Connect to Vercel**
   - Push your code to GitHub
   - Connect repository to Vercel
   - Set all environment variables in Vercel dashboard

2. **Configure Production**
   - Update `NEXT_PUBLIC_APP_URL` to your domain
   - Configure Stripe webhook endpoint
   - Update Etsy OAuth redirect URI

3. **Deploy**
   - Vercel automatically deploys from main branch
   - Monitor deployment logs for any issues

### Environment Variables Checklist

- [ ] All OpenAI keys configured
- [ ] Clerk keys set up for production
- [ ] Stripe keys and price IDs configured
- [ ] Webhook secrets set
- [ ] Etsy OAuth redirect URI updated
- [ ] App URL points to production domain
- [ ] Email service configured (for welcome emails and notifications)

## Documentation

Additional setup guides and documentation are available in the `/docs` folder:

- **[Email Setup Guide](docs/EMAIL_SETUP.md)** - Configure email notifications with PrivateEmail.com or other providers
- **[Etsy Integration Guide](docs/ETSY_INTEGRATION_COMPLETE.md)** - Complete Etsy integration setup
- **[Analytics Setup](docs/ANALYTICS_SETUP.md)** - Configure analytics tracking
- **[Database Setup](docs/DATABASE_SETUP.md)** - Database configuration guide
- **[Deployment Checklist](docs/DEPLOYMENT_CHECKLIST.md)** - Production deployment steps
- **[User Guide](docs/USER_GUIDE.md)** - End-user documentation

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📧 Email: support@listgenius.com
- 📖 Documentation: [docs.listgenius.com](https://docs.listgenius.com)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/listgenius/issues)

## Roadmap

- [ ] Etsy OAuth integration
- [ ] Bulk listing generation
- [ ] Advanced analytics
- [ ] Multi-shop support
- [ ] White-label options
- [ ] API access for developers

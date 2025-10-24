# Google Analytics 4 (GA4) Setup Guide

This guide explains how to set up and use Google Analytics 4 in your ListGenius application.

## Setup Instructions

### 1. Create a GA4 Property

1. Go to [Google Analytics](https://analytics.google.com/)
2. Create a new GA4 property for your website
3. Copy your Measurement ID (starts with `G-`)

### 2. Add Environment Variable

Add your GA4 Measurement ID to your `.env.local` file:

```env
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
```

Replace `G-XXXXXXXXXX` with your actual Measurement ID.

### 3. Restart Your Development Server

After adding the environment variable, restart your Next.js development server:

```bash
npm run dev
```

## Features

### Automatic Tracking

The following events are automatically tracked:

- **Page Views**: Every page navigation is tracked
- **User Sessions**: Session duration and engagement
- **User Demographics**: Basic user information (if available)

### Custom Event Tracking

The following custom events are tracked:

#### Listing Generation
```typescript
analytics.trackListingGeneration(plan, wordCount, tone);
```
- Tracks when users generate listings
- Includes plan type, word count, and tone used

#### Plan Upgrades
```typescript
analytics.trackPlanUpgrade(fromPlan, toPlan, value);
```
- Tracks when users upgrade their plan
- Includes source and destination plans

#### Feature Usage
```typescript
analytics.trackFeatureUsage(feature, plan);
```
- Tracks when users use specific features
- Includes feature name and user plan

#### Error Tracking
```typescript
analytics.trackError(error, category);
```
- Tracks application errors
- Includes error message and category

#### User Engagement
```typescript
analytics.trackEngagement(action, element);
```
- Tracks user interactions
- Includes action type and element

## Usage in Components

### Basic Usage

```typescript
import { useAnalytics } from '@/contexts/AnalyticsContext';

export default function MyComponent() {
  const analytics = useAnalytics();

  const handleClick = () => {
    analytics.trackEngagement('button_clicked', 'my_button');
  };

  return (
    <button onClick={handleClick}>
      Click me
    </button>
  );
}
```

### Available Methods

- `trackEvent(eventName, parameters)` - Track custom events
- `trackUserAction(action, category, label, value)` - Track user actions
- `trackListingGeneration(plan, wordCount, tone)` - Track listing generation
- `trackPlanUpgrade(fromPlan, toPlan, value)` - Track plan upgrades
- `trackFeatureUsage(feature, plan)` - Track feature usage
- `trackError(error, category)` - Track errors
- `trackEngagement(action, element)` - Track engagement

## Analytics Dashboard

A test analytics dashboard is available at `/app/analytics` (if you add the route) to test analytics functionality.

## GA4 Reports

### Key Metrics to Monitor

1. **User Engagement**
   - Page views per session
   - Average session duration
   - Bounce rate

2. **Feature Usage**
   - Listing generations per user
   - Most popular tones
   - Feature adoption rates

3. **Conversion Funnel**
   - Free to Pro upgrades
   - Pro to Business upgrades
   - Feature usage by plan

4. **Error Monitoring**
   - Error frequency
   - Error categories
   - User impact

### Custom Reports

Create custom reports in GA4 to track:

- **Listing Generation Trends**: Track generation volume over time
- **Plan Conversion Rates**: Monitor upgrade success rates
- **Feature Adoption**: See which features are most popular
- **User Journey**: Understand user flow through the application

## Privacy Considerations

- GA4 is configured to respect user privacy
- No personally identifiable information (PII) is tracked
- Users can opt out using browser settings or ad blockers
- Consider adding a privacy policy and cookie consent banner

## Troubleshooting

### Analytics Not Working

1. Check that `NEXT_PUBLIC_GA4_MEASUREMENT_ID` is set correctly
2. Verify the Measurement ID format (starts with `G-`)
3. Check browser console for errors
4. Ensure the GA4 property is active

### Events Not Appearing

1. Check that analytics is initialized (`analytics.isInitialized`)
2. Verify event parameters are correct
3. Wait 24-48 hours for data to appear in GA4
4. Use GA4 Real-time reports to test events

### Development vs Production

- Analytics works in both development and production
- Use different GA4 properties for dev/staging/production
- Test events in development before deploying

## Advanced Configuration

### Enhanced Ecommerce

For e-commerce tracking (plan purchases), you can enhance the tracking:

```typescript
analytics.trackEvent('purchase', {
  transaction_id: '12345',
  value: 29.00,
  currency: 'USD',
  items: [{
    item_id: 'pro_plan',
    item_name: 'Pro Plan',
    category: 'subscription',
    quantity: 1,
    price: 29.00
  }]
});
```

### User Properties

Set user properties for better segmentation:

```typescript
analytics.trackEvent('user_property_set', {
  user_plan: 'pro',
  user_tier: 'premium'
});
```

## Support

For issues with GA4 setup or tracking, check:

1. [GA4 Documentation](https://developers.google.com/analytics/devguides/collection/ga4)
2. [Next.js Analytics Guide](https://nextjs.org/docs/app/building-your-application/optimizing/analytics)
3. Browser developer tools for console errors
4. GA4 Real-time reports for event testing

# Etsy Mock Mode Documentation

## Overview

ListGenius includes a comprehensive mock data system for Etsy integration. This allows you to develop, test, and demo all Etsy features without needing approved API credentials or a real Etsy shop.

## Enabling Mock Mode

Set the following environment variable in your `.env.local`:

```env
ETSY_MOCK_MODE=true
```

When `ETSY_MOCK_MODE=true`, all Etsy API calls will use mock data instead of making real requests to Etsy's servers.

## Available Mock Data

### Mock Shop Data
- Shop ID: 12345678
- Shop Name: "TestCraftStudio"
- Active Listings: 5
- Review Count: 89
- Review Average: 4.8

### Mock Listings
The system includes 3 pre-populated listings:
1. **Handmade Ceramic Coffee Mug - Blue Glaze** ($24.99)
2. **Vintage Style Wooden Cutting Board - Oak** ($35.99)
3. **Handwoven Macrame Wall Hanging - Boho Decor** ($45.99)

Each listing includes:
- Complete metadata (tags, materials, dimensions)
- Multiple images with alt text
- Realistic timestamps and view counts

### Mock Images
- 3 images per listing
- Full-size and thumbnail URLs
- Alt text examples
- Rank/order information
- Color analysis data

### Mock Shop Sections
- Coffee Mugs & Drinkware (12 listings)
- Kitchen & Dining (8 listings)
- Home Decor (15 listings)
- Wall Art & Hangings (10 listings)

### Mock Shipping Profiles
- Standard Shipping (3-5 business days)
- Express Shipping (1-2 business days)
- Free Shipping (5-7 business days)

## Simulated API Behavior

### Realistic Delays
Mock API calls include simulated network delays:
- Image fetch: 300ms
- Image upload: 800ms
- Video upload: 1200ms
- Listing operations: 200-500ms

### Error Simulation
The mock system can simulate API errors for testing error handling:

```typescript
import { simulateError } from '@/lib/mock-etsy-data';

if (simulateError(0.1)) { // 10% error rate
  throw new Error('Simulated API error');
}
```

## Mock Operations

### Creating Listings
```typescript
const newListing = handleMockListingCreate({
  title: "My New Product",
  description: "Product description",
  tags: ["handmade", "unique"],
  price: { amount: 2999, divisor: 100, currency_code: "USD" }
});
```

### Managing Images
```typescript
// Upload image
const newImage = handleMockImageUpload(listingId, {
  url_fullxfull: "https://example.com/image.jpg",
  alt_text: "Product image"
});

// Reorder images
handleMockImageReorder(listingId, [imageId1, imageId2, imageId3]);

// Delete image
handleMockImageDelete(listingId, imageId);
```

### Managing Videos
```typescript
// Upload video
const newVideo = handleMockVideoUpload(listingId, {
  thumbnail_url: "https://example.com/thumbnail.jpg",
  duration: 30
});

// Delete video
handleMockVideoDelete(listingId, videoId);
```

## Testing Your Integration

### 1. Test Listing Imports
1. Navigate to "My Listings"
2. Click "Refresh Listings"
3. Verify 3 mock listings appear

### 2. Test Image Management
1. Open any listing
2. Click "Manage Images"
3. Test drag-and-drop reordering
4. Test image upload (mock)
5. Test alt text editing
6. Test AI alt text generation

### 3. Test Listing Creation
1. Click "Create Listing" in dashboard
2. Fill in listing details
3. Generate AI content
4. Upload images (mock)
5. Publish to Etsy (mock)

### 4. Test Rewriting
1. Select a listing from "My Listings"
2. Click "Rewrite"
3. Modify details
4. Generate new content
5. Save changes (mock)

## Transitioning to Real API

When ready to use real Etsy data:

### 1. Update Environment Variables
```env
ETSY_MOCK_MODE=false
ETSY_CLIENT_ID=your_actual_keystring
ETSY_CLIENT_SECRET=your_actual_shared_secret
```

### 2. Test OAuth Flow
1. Go to Settings → Etsy Connection
2. Click "Connect Etsy Shop"
3. Complete OAuth authorization
4. Verify connection status

### 3. Verify Real Data
1. Refresh listings - should now show your real Etsy shop data
2. Test image operations with real listings
3. Verify updates sync back to Etsy

### 4. Production Deployment
1. Update environment variables on Vercel/hosting platform
2. Ensure `ETSY_MOCK_MODE=false`
3. Add real Etsy credentials
4. Test end-to-end flow

## Adding Custom Mock Data

### Add Mock Listings
Edit `lib/mock-etsy-data.ts`:

```typescript
export const mockListings = [
  // ... existing listings
  {
    listing_id: 1234567893,
    title: "Your Custom Product",
    description: "Your description",
    price: { amount: 3999, divisor: 100, currency_code: "USD" },
    tags: ["your", "tags"],
    // ... other required fields
  }
];
```

### Add Mock Images
```typescript
export const mockImages = [
  // ... existing images
  {
    listing_image_id: 12345678904,
    listing_id: 1234567893,
    url_fullxfull: "https://your-image-url.com/image.jpg",
    alt_text: "Your image description",
    rank: 1
  }
];
```

## Debugging Mock Mode

### Check if Mock Mode is Active
All API routes log whether they're using mock data:

```
[INFO] Using mock listings data { userId: '...', isMockMode: true, count: 3 }
```

### Verify Mock Data Loading
Check the browser console for:
- API response times (should match simulated delays)
- Response data structure
- Mock mode indicators in responses

### Common Issues

**Issue**: Mock data not appearing
**Solution**: Verify `ETSY_MOCK_MODE=true` in `.env.local` and restart dev server

**Issue**: API errors in mock mode
**Solution**: Check error simulation is not enabled accidentally

**Issue**: Can't transition to real API
**Solution**: Ensure all env variables are set correctly and Etsy app is approved

## Best Practices

1. **Develop in Mock Mode**: Build and test features without API limits
2. **Test Error Handling**: Use error simulation to test failure scenarios
3. **Match Real Structure**: Ensure mock data structure matches Etsy's API
4. **Document Differences**: Note any mock vs. real behavior differences
5. **Gradual Transition**: Test with one real listing before full migration

## Mock Mode Limitations

Mock mode simulates most Etsy API functionality, but with some limitations:

- No real OAuth flow (auto-connects)
- No real image uploads (uses placeholder URLs)
- No real video processing
- No webhook callbacks
- No rate limiting
- Simplified error responses

These limitations are intentional to make development easier. All features work identically in real API mode.

## Support

For issues or questions about mock mode:
1. Check the main README.md for setup instructions
2. Review this documentation
3. Examine `lib/mock-etsy-data.ts` for data structure
4. Check API route implementations for mock logic

## Conclusion

Mock mode enables rapid development and testing of Etsy integration without the complexity of real API credentials. Use it to build confidence in your implementation before transitioning to production.


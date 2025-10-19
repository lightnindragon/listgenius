# Enable Etsy Mock Mode

To enable mock mode for testing Etsy integration without real API access, add this line to your `.env.local` file:

```env
ETSY_MOCK_MODE=true
```

## Complete .env.local Etsy Section

Your Etsy section should look like this:

```env
# Etsy Integration (Mock Mode for Testing)
ETSY_MOCK_MODE=true
ETSY_CLIENT_ID=your_client_id_here
ETSY_CLIENT_SECRET=your_client_secret_here
ETSY_REDIRECT_URI=http://localhost:3000/api/etsy/oauth
ETSY_API_BASE_URL=https://openapi.etsy.com/v3
ETSY_SANDBOX_MODE=true
```

## What Mock Mode Does

When `ETSY_MOCK_MODE=true`:

✅ **OAuth Flow**: Simulates successful Etsy authorization  
✅ **Shop Connection**: Returns mock shop data (TestCraftStudio)  
✅ **Listings**: Returns 3 realistic mock listings  
✅ **Listing Updates**: Simulates successful updates  
✅ **All API Endpoints**: Work with mock data instead of real Etsy API  

## Mock Data Includes

- **Shop**: "TestCraftStudio" with realistic shop information
- **3 Listings**: 
  - Handmade Ceramic Coffee Mug - Blue Glaze
  - Vintage Style Wooden Cutting Board - Oak  
  - Handwoven Macrame Wall Hanging - Boho Decor
- **Full CRUD Operations**: Create, Read, Update, Delete
- **Realistic Data**: Prices, descriptions, tags, materials, images

## Testing Workflow

1. Add `ETSY_MOCK_MODE=true` to `.env.local`
2. Restart your dev server
3. Go to Settings → Click "Connect Etsy Shop"
4. You'll be redirected back immediately (mock OAuth)
5. Test importing listings, rewriting, and publishing
6. All operations will use realistic mock data

## Disable Mock Mode

To switch back to real Etsy API:
- Set `ETSY_MOCK_MODE=false` or remove the line
- Ensure you have valid Etsy credentials
- Restart your dev server

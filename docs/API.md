# ListGenius API Documentation

## Overview

ListGenius provides a comprehensive REST API for Etsy listing optimization, keyword research, and competitor analysis. All API endpoints require authentication via Clerk.

## Authentication

All API requests must include authentication headers:

```
Authorization: Bearer <clerk-session-token>
```

## Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://your-domain.com/api`

## Rate Limiting

API requests are rate-limited based on user plan:
- **Free**: 100 requests/hour
- **Pro**: 1000 requests/hour
- **Enterprise**: 10000 requests/hour

## Error Handling

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    // Additional error details
  }
}
```

## API Endpoints

### Keyword Research

#### Search Keywords
```http
POST /api/keywords/search
```

**Request Body:**
```json
{
  "keywords": ["handmade jewelry", "vintage decor"],
  "includeMetrics": true,
  "includeSuggestions": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "keyword": "handmade jewelry",
        "searchVolume": 8500,
        "competition": 65,
        "opportunity": 75,
        "difficulty": 45,
        "averagePrice": 45.50,
        "topCategories": ["Jewelry", "Accessories"],
        "trendingScore": 8.5
      }
    ]
  }
}
```

#### Get Keyword Suggestions
```http
GET /api/keywords/suggest?q=handmade&limit=10
```

#### Get Keyword Trends
```http
GET /api/keywords/trends?keyword=handmade+jewelry&period=12m
```

### Listing Management

#### Get User Listings
```http
GET /api/etsy/listings
```

#### Create New Listing
```http
POST /api/etsy/listings
```

**Request Body:**
```json
{
  "title": "Handmade Ceramic Coffee Mug",
  "description": "Beautiful handmade ceramic coffee mug...",
  "tags": ["handmade", "ceramic", "coffee mug"],
  "price": {
    "amount": 2499,
    "divisor": 100
  },
  "quantity": 5,
  "materials": ["ceramic clay", "food-safe glaze"],
  "shopSection": "home-decor",
  "isDraft": false
}
```

#### Update Listing
```http
PUT /api/etsy/listings/{listingId}
```

#### Delete Listing
```http
DELETE /api/etsy/listings/{listingId}
```

### Image Management

#### Upload Image
```http
POST /api/etsy/listings/{listingId}/images
```

**Request:** Multipart form data with image file

#### Reorder Images
```http
PUT /api/etsy/listings/{listingId}/images
```

**Request Body:**
```json
{
  "image_ids": [123, 456, 789]
}
```

#### Delete Image
```http
DELETE /api/etsy/listings/{listingId}/images/{imageId}
```

### AI Tools

#### Generate Alt Text
```http
POST /api/generate-alt-text
```

**Request Body:**
```json
{
  "imageUrl": "https://example.com/image.jpg",
  "keywords": ["handmade", "ceramic", "coffee mug"]
}
```

#### Health Check
```http
POST /api/tools/health-check
```

**Request Body:**
```json
{
  "action": "single",
  "listingId": 12345,
  "listingData": {
    "title": "Listing title",
    "description": "Listing description",
    "tags": ["tag1", "tag2"],
    "images": [],
    "price": { "amount": 1000, "divisor": 100 }
  }
}
```

### Niche Research

#### Find Profitable Niches
```http
POST /api/tools/niche-finder
```

**Request Body:**
```json
{
  "action": "find",
  "filters": {
    "minDemand": 70,
    "maxCompetition": 50,
    "categories": ["Home & Living"]
  },
  "limit": 20
}
```

#### Analyze Specific Niche
```http
POST /api/tools/niche-finder
```

**Request Body:**
```json
{
  "action": "analyze",
  "niche": "handmade jewelry"
}
```

### Seasonal Analysis

#### Analyze Seasonal Trends
```http
POST /api/tools/seasonal-predictor
```

**Request Body:**
```json
{
  "action": "analyze",
  "keyword": "christmas decorations"
}
```

#### Generate Calendar Heatmap
```http
POST /api/tools/seasonal-predictor
```

**Request Body:**
```json
{
  "action": "heatmap",
  "keyword": "summer accessories",
  "year": 2024
}
```

### Bulk Operations

#### Bulk Tag Operations
```http
POST /api/tools/bulk-tags
```

**Request Body:**
```json
{
  "action": "preview",
  "type": "replace",
  "listings": [1, 2, 3],
  "searchTerm": "old tag",
  "replaceWith": "new tag"
}
```

### User Management

#### Get User Metadata
```http
GET /api/user/metadata
```

#### Update User Preferences
```http
PUT /api/user/metadata
```

**Request Body:**
```json
{
  "tone": "Professional",
  "niche": "handmade jewelry",
  "audience": "gift buyers"
}
```

### Etsy Integration

#### Connect Etsy Shop
```http
POST /api/etsy/oauth
```

#### Get Etsy Connection Status
```http
GET /api/etsy/me
```

#### Disconnect Etsy Shop
```http
DELETE /api/etsy/oauth
```

## Webhooks

### Stripe Webhooks
```http
POST /api/stripe/webhook
```

Handles Stripe events:
- `invoice.payment_succeeded`
- `customer.subscription.updated`
- `customer.subscription.deleted`

### Etsy Webhooks
```http
POST /api/etsy/webhook
```

Handles Etsy events:
- Listing updates
- Order notifications
- Shop changes

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `429` - Rate Limited
- `500` - Internal Server Error
- `502` - Bad Gateway
- `503` - Service Unavailable

## SDKs

### JavaScript/TypeScript
```bash
npm install @listgenius/sdk
```

```javascript
import { ListGeniusClient } from '@listgenius/sdk'

const client = new ListGeniusClient({
  apiKey: 'your-api-key',
  baseURL: 'https://api.listgenius.com'
})

const keywords = await client.keywords.search(['handmade jewelry'])
```

### Python
```bash
pip install listgenius-sdk
```

```python
from listgenius import ListGeniusClient

client = ListGeniusClient(api_key='your-api-key')
keywords = client.keywords.search(['handmade jewelry'])
```

## Examples

### Complete Listing Creation Flow

```javascript
// 1. Generate listing content
const listing = await fetch('/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    productName: 'Handmade Ceramic Mug',
    keywords: ['handmade', 'ceramic', 'coffee mug'],
    tone: 'Professional'
  })
})

// 2. Create listing on Etsy
const etsyListing = await fetch('/api/etsy/listings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(listing.data)
})

// 3. Upload images
const formData = new FormData()
formData.append('image', imageFile)
await fetch(`/api/etsy/listings/${etsyListing.data.listing_id}/images`, {
  method: 'POST',
  body: formData
})

// 4. Generate alt text
const altText = await fetch('/api/generate-alt-text', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    imageUrl: 'https://example.com/image.jpg',
    keywords: ['handmade', 'ceramic', 'coffee mug']
  })
})
```

### Keyword Research Workflow

```javascript
// 1. Search for keywords
const keywords = await fetch('/api/keywords/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    keywords: ['handmade jewelry', 'vintage decor']
  })
})

// 2. Get suggestions
const suggestions = await fetch('/api/keywords/suggest?q=handmade&limit=20')

// 3. Analyze trends
const trends = await fetch('/api/keywords/trends?keyword=handmade+jewelry&period=12m')

// 4. Calculate difficulty scores
const difficulty = await fetch('/api/keywords/difficulty', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    keywords: ['handmade jewelry', 'vintage decor']
  })
})
```

## Support

For API support:
- Email: api-support@listgenius.com
- Documentation: https://docs.listgenius.com
- Status Page: https://status.listgenius.com

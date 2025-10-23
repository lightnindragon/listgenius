/**
 * SERP Analysis API
 * GET /api/keywords/serp?keyword=handmade+jewelry&limit=100
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { rateLimiter, keywordCache } from '@/lib/redis';
import { findOrCreateKeyword, db } from '@/lib/db';
import { EtsyClient } from '@/lib/etsy';
import { getEtsyConnection } from '@/lib/clerk';

const requestSchema = z.object({
  keyword: z.string().min(1).max(100),
  limit: z.coerce.number().min(10).max(500).default(100),
  category: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const rateLimitResult = await rateLimiter.isAllowed(
      `serp:${userId}`,
      50, // 50 requests
      3600 // per hour
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const params = requestSchema.parse({
      keyword: searchParams.get('keyword'),
      limit: searchParams.get('limit'),
      category: searchParams.get('category'),
      minPrice: searchParams.get('minPrice'),
      maxPrice: searchParams.get('maxPrice'),
    });

    logger.info('SERP analysis request', {
      userId,
      keyword: params.keyword,
      limit: params.limit,
    });

    // Check cache first
    const cacheKey = `serp:${params.keyword}:${params.limit}`;
    const cached = await keywordCache.get(cacheKey);
    if (cached) {
      logger.info('use cached SERP data', { cacheKey });
      return NextResponse.json({ success: true, data: cached });
    }

    // Get Etsy connection for real API calls
    const etsyConnection = await getEtsyConnection(userId);
    
    // Perform SERP analysis
    const serpData = await analyzeSERP(params, etsyConnection);

    // Cache results for 30 minutes
    await keywordCache.set(cacheKey, serpData, 1800);

    // Store SERP sample data in database
    try {
      const keyword = await findOrCreateKeyword(params.keyword);
      await storeSerpSample(keyword.id, serpData.listings);
    } catch (error) {
      logger.warn('Failed to store SERP sample', { error });
    }

    // Track user event
    try {
      const keyword = await findOrCreateKeyword(params.keyword);
      await db.userKeywordEvent.create({
        data: {
          userId,
          keywordId: keyword.id,
          eventType: 'SERP_ANALYZED',
        },
      });
    } catch (error) {
      logger.warn('Failed to track keyword event', { error });
    }

    return NextResponse.json({
      success: true,
      data: serpData,
    });
  } catch (error) {
    logger.error('SERP analysis error', { error });
    return NextResponse.json(
      { error: 'Failed to analyze SERP' },
      { status: 500 }
    );
  }
}

async function analyzeSERP(params: {
  keyword: string;
  limit: number;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}, etsyConnection: any) {
  let listings: any[] = [];
  let totalResults = 0;

  try {
    if (etsyConnection.hasTokens && process.env.ETSY_MOCK_MODE !== 'true') {
      // Real Etsy API call
      const etsyClient = new EtsyClient(etsyConnection.accessToken, etsyConnection.refreshToken);
      const searchResults = await etsyClient.searchListings(params.keyword, {
        limit: params.limit,
        min_price: params.minPrice,
        max_price: params.maxPrice,
        category_id: params.category ? parseInt(params.category) : undefined,
      });
      
      listings = searchResults.results || [];
      totalResults = searchResults.count || 0;
    } else {
      // Mock data for development
      const mockData = getMockSerpData(params.keyword, params.limit);
      listings = mockData.listings;
      totalResults = mockData.totalResults;
    }
  } catch (error) {
    logger.error('Etsy search error', { error });
    // Fallback to mock data
    const mockData = getMockSerpData(params.keyword, params.limit);
    listings = mockData.listings;
    totalResults = mockData.totalResults;
  }

  // Analyze the SERP data
  const analysis = analyzeListings(listings, params.keyword);

  return {
    keyword: params.keyword,
    totalResults,
    listings: listings.slice(0, 50), // Return top 50 for detailed analysis
    analysis,
    timestamp: new Date().toISOString(),
  };
}

function analyzeListings(listings: any[], keyword: string) {
  if (listings.length === 0) {
    return {
      activeListings: 0,
      averagePrice: 0,
      priceRange: { min: 0, max: 0 },
      topShops: [],
      categoryDistribution: [],
      averageListingAge: 0,
      page1ShopConcentration: 0,
      titleExactMatchRate: 0,
      competitionLevel: 'low',
      difficultyScore: 0,
    };
  }

  // Calculate metrics
  const prices = listings
    .map(listing => listing.price?.amount || 0)
    .filter(price => price > 0);

  const averagePrice = prices.length > 0 
    ? prices.reduce((sum, price) => sum + price, 0) / prices.length
    : 0;

  const priceRange = {
    min: prices.length > 0 ? Math.min(...prices) : 0,
    max: prices.length > 0 ? Math.max(...prices) : 0,
  };

  // Analyze top shops
  const shopStats: { [key: number]: { shopName: string; listingCount: number } } = {};
  listings.forEach(listing => {
    const shopId = listing.shop_id;
    if (shopStats[shopId]) {
      shopStats[shopId].listingCount++;
    } else {
      shopStats[shopId] = {
        shopName: listing.shop_name || 'Unknown Shop',
        listingCount: 1,
      };
    }
  });

  const topShops = Object.entries(shopStats)
    .map(([shopId, stats]) => ({
      shopId: parseInt(shopId),
      shopName: stats.shopName,
      listingCount: stats.listingCount,
    }))
    .sort((a, b) => b.listingCount - a.listingCount)
    .slice(0, 10);

  // Category distribution
  const categoryStats: { [key: number]: { categoryName: string; count: number } } = {};
  listings.forEach(listing => {
    const categoryId = listing.taxonomy_id;
    if (categoryId && categoryStats[categoryId]) {
      categoryStats[categoryId].count++;
    } else if (categoryId) {
      categoryStats[categoryId] = {
        categoryName: listing.taxonomy_path?.join(' > ') || 'Unknown Category',
        count: 1,
      };
    }
  });

  const categoryDistribution = Object.entries(categoryStats)
    .map(([categoryId, stats]) => ({
      categoryId: parseInt(categoryId),
      categoryName: stats.categoryName,
      count: stats.count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Average listing age
  const now = Date.now() / 1000;
  const ages = listings
    .map(listing => now - (listing.creation_tsz || now))
    .filter(age => age >= 0);
  
  const averageListingAge = ages.length > 0
    ? ages.reduce((sum, age) => sum + age, 0) / ages.length
    : 0;

  // Page 1 shop concentration (top 20 listings)
  const top20Listings = listings.slice(0, 20);
  const top20Shops = new Set(top20Listings.map(listing => listing.shop_id));
  const page1ShopConcentration = (top20Shops.size / 20) * 100;

  // Title exact match rate
  const exactMatches = listings.filter(listing => 
    listing.title?.toLowerCase().includes(keyword.toLowerCase())
  );
  const titleExactMatchRate = (exactMatches.length / listings.length) * 100;

  // Competition level and difficulty score
  let competitionLevel: 'low' | 'medium' | 'high';
  let difficultyScore: number;

  if (listings.length < 100) {
    competitionLevel = 'low';
    difficultyScore = 20;
  } else if (listings.length < 1000) {
    competitionLevel = 'medium';
    difficultyScore = 50;
  } else {
    competitionLevel = 'high';
    difficultyScore = 80;
  }

  // Adjust difficulty based on shop concentration
  if (page1ShopConcentration < 30) {
    difficultyScore += 20; // Few shops dominating = harder to break in
  } else if (page1ShopConcentration > 70) {
    difficultyScore -= 10; // Many shops = more opportunities
  }

  return {
    activeListings: listings.length,
    averagePrice,
    priceRange,
    topShops,
    categoryDistribution,
    averageListingAge,
    page1ShopConcentration,
    titleExactMatchRate,
    competitionLevel,
    difficultyScore: Math.min(100, Math.max(0, difficultyScore)),
  };
}

function getMockSerpData(keyword: string, limit: number) {
  const mockListings = Array.from({ length: Math.min(limit, 200) }, (_, i) => ({
    listing_id: 1000000000 + i,
    shop_id: 10000000 + (i % 20),
    shop_name: `Shop${i % 20 + 1}`,
    title: `${keyword} - ${['Handmade', 'Vintage', 'Unique', 'Custom', 'Artisan'][i % 5]} ${['Design', 'Style', 'Collection', 'Set', 'Piece'][i % 5]}`,
    price: {
      amount: Math.floor(Math.random() * 10000) + 500, // $5-$100
      currency_code: 'USD',
    },
    creation_tsz: Math.floor(Date.now() / 1000) - (Math.random() * 31536000), // Last year
    taxonomy_id: 69150467 + (i % 10),
    taxonomy_path: ['Home & Living', 'Kitchen & Dining', 'Dinnerware & Serveware', 'Mugs & Cups'],
    num_favorers: Math.floor(Math.random() * 100),
    views: Math.floor(Math.random() * 1000),
  }));

  return {
    listings: mockListings,
    totalResults: 1000 + Math.floor(Math.random() * 5000),
  };
}

async function storeSerpSample(keywordId: string, listings: any[]) {
  try {
    // Store top 20 listings as SERP sample
    const samples = listings.slice(0, 20).map((listing, index) => ({
      keywordId,
      listingId: BigInt(listing.listing_id),
      shopId: BigInt(listing.shop_id),
      position: index + 1,
      title: listing.title,
      tags: listing.tags || [],
      price: listing.price?.amount || 0,
      reviews: listing.num_favorers || 0,
      sampledAt: new Date(),
    }));

    await db.keywordSerpSample.createMany({
      data: samples,
      skipDuplicates: true,
    });
  } catch (error) {
    logger.error('Failed to store SERP sample', { error });
  }
}

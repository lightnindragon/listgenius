/**
 * Analytics Listings API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ShopAnalyticsEngine } from '@/lib/shop-analytics';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const listingsSchema = z.object({
  period: z.enum(['7d', '30d', '90d']).optional().default('30d'),
  listingIds: z.array(z.number().positive()).optional(),
});

// GET - Get listing analytics
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';
    const listingIdsParam = searchParams.get('listingIds');

    // Parse listing IDs if provided
    let listingIds: number[] | undefined;
    if (listingIdsParam) {
      try {
        listingIds = JSON.parse(listingIdsParam);
      } catch {
        return NextResponse.json(
          { error: 'Invalid listingIds format' },
          { status: 400 }
        );
      }
    }

    // Validate input
    const validation = listingsSchema.safeParse({ period, listingIds });
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { period: validPeriod, listingIds: validListingIds } = validation.data;

    // Initialize analytics engine
    const analyticsEngine = new ShopAnalyticsEngine();

    // Get listing analytics
    const listings = await analyticsEngine.getListingAnalytics(
      userId,
      validListingIds,
      validPeriod
    );

    logger.info('Listing analytics retrieved', {
      userId,
      period: validPeriod,
      listingCount: listings.length,
      specificListings: validListingIds?.length || 'all',
    });

    return NextResponse.json({
      success: true,
      data: {
        listings,
        period: validPeriod,
        totalListings: listings.length,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Listing analytics API error', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

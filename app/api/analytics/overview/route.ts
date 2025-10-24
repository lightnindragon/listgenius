/**
 * Analytics Overview API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ShopAnalyticsEngine } from '@/lib/shop-analytics';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const overviewSchema = z.object({
  period: z.enum(['7d', '30d', '90d']).optional().default('30d'),
});

// GET - Get shop analytics overview
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';

    // Validate input
    const validation = overviewSchema.safeParse({ period });
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { period: validPeriod } = validation.data;

    // Initialize analytics engine
    const analyticsEngine = new ShopAnalyticsEngine();

    // Get shop overview
    const overview = await analyticsEngine.getShopOverview(userId, validPeriod);

    logger.info('Analytics overview retrieved', {
      userId,
      period: validPeriod,
      totalListings: overview.totalListings,
      totalRevenue: overview.totalRevenue,
    });

    return NextResponse.json({
      success: true,
      data: {
        overview,
        period: validPeriod,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Analytics overview API error', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

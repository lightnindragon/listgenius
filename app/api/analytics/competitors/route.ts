/**
 * Analytics Competitors API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ShopAnalyticsEngine } from '@/lib/shop-analytics';
import { logger } from '@/lib/logger';

// GET - Get competitor analytics
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Initialize analytics engine
    const analyticsEngine = new ShopAnalyticsEngine();

    // Get competitor analytics
    const competitors = await analyticsEngine.getCompetitorAnalytics(userId);

    logger.info('Competitor analytics retrieved', {
      userId,
      competitorCount: competitors.length,
    });

    return NextResponse.json({
      success: true,
      data: {
        competitors,
        totalCompetitors: competitors.length,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Competitor analytics API error', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

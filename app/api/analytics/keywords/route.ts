/**
 * Analytics Keywords API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ShopAnalyticsEngine } from '@/lib/shop-analytics';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const keywordsSchema = z.object({
  period: z.enum(['7d', '30d', '90d']).optional().default('30d'),
});

// GET - Get keyword analytics
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';

    // Validate input
    const validation = keywordsSchema.safeParse({ period });
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { period: validPeriod } = validation.data;

    // Initialize analytics engine
    const analyticsEngine = new ShopAnalyticsEngine();

    // Get keyword analytics
    const keywords = await analyticsEngine.getKeywordAnalytics(userId, validPeriod);

    logger.info('Keyword analytics retrieved', {
      userId,
      period: validPeriod,
      keywordCount: keywords.length,
    });

    return NextResponse.json({
      success: true,
      data: {
        keywords,
        period: validPeriod,
        totalKeywords: keywords.length,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Keyword analytics API error', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

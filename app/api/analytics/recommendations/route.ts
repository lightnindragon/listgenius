/**
 * Analytics AI Recommendations API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ShopAnalyticsEngine } from '@/lib/shop-analytics';
import { logger } from '@/lib/logger';

// GET - Get AI recommendations
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Initialize analytics engine
    const analyticsEngine = new ShopAnalyticsEngine();

    // Get AI recommendations
    const recommendations = await analyticsEngine.getAIRecommendations(userId);

    logger.info('AI recommendations generated', {
      userId,
      recommendationCount: recommendations.length,
    });

    return NextResponse.json({
      success: true,
      data: {
        recommendations,
        totalRecommendations: recommendations.length,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('AI recommendations API error', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

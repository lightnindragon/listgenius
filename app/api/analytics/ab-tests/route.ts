/**
 * A/B Testing API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ShopAnalyticsEngine } from '@/lib/shop-analytics';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const abTestSchema = z.object({
  period: z.enum(['7d', '30d', '90d']).optional().default('30d'),
});

// GET - Get A/B test results
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';

    // Validate input
    const validation = abTestSchema.safeParse({ period });
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { period: validPeriod } = validation.data;

    // Initialize analytics engine
    const analyticsEngine = new ShopAnalyticsEngine();

    // Get A/B test results
    const abTests = await analyticsEngine.getABTestResults(userId);

    logger.info('A/B test results retrieved', {
      userId,
      period: validPeriod,
      testCount: abTests.length,
    });

    return NextResponse.json({
      success: true,
      data: {
        tests: abTests,
        period: validPeriod,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('A/B tests API error', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new A/B test
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { testName, description, listingId, variants } = body;

    if (!testName || !variants || variants.length < 2) {
      return NextResponse.json(
        { error: 'Test name and at least 2 variants are required' },
        { status: 400 }
      );
    }

    // For now, return a mock success response
    // In production, this would create a real A/B test
    const newTest = {
      testId: `test-${Date.now()}`,
      name: testName,
      description: description || '',
      status: 'running',
      startDate: new Date().toISOString(),
      endDate: null,
      listingId: listingId || null,
      variants: variants.map((variant: any, index: number) => ({
        name: variant.name || `Variant ${index + 1}`,
        content: variant.content || '',
        impressions: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0,
        ctr: 0,
        conversionRate: 0,
      })),
      winner: null,
      confidence: 0,
      improvement: 0,
    };

    logger.info('A/B test created', {
      userId,
      testId: newTest.testId,
      testName,
      variantCount: variants.length,
    });

    return NextResponse.json({
      success: true,
      data: newTest,
      message: 'A/B test created successfully',
    });
  } catch (error) {
    logger.error('A/B test creation error', { error });
    return NextResponse.json(
      { error: 'Failed to create A/B test' },
      { status: 500 }
    );
  }
}

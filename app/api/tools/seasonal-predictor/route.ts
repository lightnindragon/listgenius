/**
 * Seasonal Predictor API Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { SeasonalPredictor } from '@/lib/seasonal-predictor';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const analyzeTrendSchema = z.object({
  keyword: z.string().min(1).max(100),
});

const generateHeatmapSchema = z.object({
  keyword: z.string().min(1).max(100),
  year: z.number().min(2020).max(2030).optional().default(new Date().getFullYear()),
});

const getPredictionsSchema = z.object({
  keywords: z.array(z.string().min(1).max(100)).min(1).max(10),
});

const getBestTimesSchema = z.object({
  category: z.string().min(1).max(50),
});

// GET - Get best listing times for a category
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const category = searchParams.get('category');

    if (action === 'best-times' && category) {
      const seasonalPredictor = new SeasonalPredictor();
      const bestTimes = await seasonalPredictor.getBestListingTimes(category);

      return NextResponse.json({
        success: true,
        data: bestTimes,
      });
    }

    return NextResponse.json({ error: 'Invalid action or missing category' }, { status: 400 });
  } catch (error) {
    logger.error('Seasonal predictor API error', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Analyze trends, generate heatmaps, or get predictions
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const action = body.action;

    const seasonalPredictor = new SeasonalPredictor();

    switch (action) {
      case 'analyze':
        return handleAnalyzeTrend(request, userId, seasonalPredictor);
      case 'heatmap':
        return handleGenerateHeatmap(request, userId, seasonalPredictor);
      case 'predictions':
        return handleGetPredictions(request, userId, seasonalPredictor);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    logger.error('Seasonal predictor API error', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleAnalyzeTrend(request: NextRequest, userId: string, seasonalPredictor: SeasonalPredictor) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = analyzeTrendSchema.safeParse({
      keyword: body.keyword,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { keyword } = validation.data;

    // Analyze seasonal trend
    const trend = await seasonalPredictor.analyzeSeasonalTrend(keyword);

    logger.info('Seasonal trend analysis completed', {
      userId,
      keyword,
      trend,
    });

    return NextResponse.json({
      success: true,
      data: {
        trend,
        analyzedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Analyze trend error', { error });
    return NextResponse.json(
      { error: 'Failed to analyze seasonal trend' },
      { status: 500 }
    );
  }
}

async function handleGenerateHeatmap(request: NextRequest, userId: string, seasonalPredictor: SeasonalPredictor) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = generateHeatmapSchema.safeParse({
      keyword: body.keyword,
      year: body.year,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { keyword, year } = validation.data;

    // Generate calendar heatmap
    const heatmap = await seasonalPredictor.generateCalendarHeatmap(keyword, year);

    logger.info('Calendar heatmap generated', {
      userId,
      keyword,
      year,
      heatmap,
    });

    return NextResponse.json({
      success: true,
      data: {
        heatmap,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Generate heatmap error', { error });
    return NextResponse.json(
      { error: 'Failed to generate calendar heatmap' },
      { status: 500 }
    );
  }
}

async function handleGetPredictions(request: NextRequest, userId: string, seasonalPredictor: SeasonalPredictor) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = getPredictionsSchema.safeParse({
      keywords: body.keywords,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { keywords } = validation.data;

    // Get seasonal predictions
    const predictions = await seasonalPredictor.getSeasonalPredictions(keywords);

    logger.info('Seasonal predictions generated', {
      userId,
      keywords,
      predictions,
    });

    return NextResponse.json({
      success: true,
      data: {
        predictions,
        total: predictions.length,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Get predictions error', { error });
    return NextResponse.json(
      { error: 'Failed to get seasonal predictions' },
      { status: 500 }
    );
  }
}

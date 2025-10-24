/**
 * Competitors API Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { CompetitorAnalyzer } from '@/lib/competitor-analyzer';
import { getEtsyConnection } from '@/lib/clerk';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const addCompetitorSchema = z.object({
  shopId: z.number().positive(),
});

const removeCompetitorSchema = z.object({
  shopId: z.number().positive(),
});

// GET - Get tracked competitors
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Initialize competitor analyzer
    const competitorAnalyzer = new CompetitorAnalyzer();

    // Get tracked competitors
    const competitors = await competitorAnalyzer.getTrackedCompetitors(userId);

    logger.info('Tracked competitors retrieved', {
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
    logger.error('Get competitors API error', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Add/remove competitors
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const action = body.action;

    switch (action) {
      case 'add':
        return handleAddCompetitor(request, userId);
      case 'remove':
        return handleRemoveCompetitor(request, userId);
      case 'analyze':
        return handleAnalyzeCompetitor(request, userId);
      case 'compare':
        return handleCompareCompetitor(request, userId);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    logger.error('Competitors API error', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleAddCompetitor(request: NextRequest, userId: string) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = addCompetitorSchema.safeParse({
      shopId: body.shopId,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { shopId } = validation.data;

    // Initialize competitor analyzer
    const competitorAnalyzer = new CompetitorAnalyzer();

    // Add competitor
    await competitorAnalyzer.addCompetitor(userId, shopId);

    logger.info('Competitor added', { userId, shopId });

    return NextResponse.json({
      success: true,
      data: {
        message: 'Competitor added successfully',
        shopId,
      },
    });
  } catch (error) {
    logger.error('Add competitor error', { error });
    
    if (error instanceof Error && error.message === 'Competitor already being tracked') {
      return NextResponse.json(
        { error: 'Competitor is already being tracked' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to add competitor' },
      { status: 500 }
    );
  }
}

async function handleRemoveCompetitor(request: NextRequest, userId: string) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = removeCompetitorSchema.safeParse({
      shopId: body.shopId,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { shopId } = validation.data;

    // Initialize competitor analyzer
    const competitorAnalyzer = new CompetitorAnalyzer();

    // Remove competitor
    await competitorAnalyzer.removeCompetitor(userId, shopId);

    logger.info('Competitor removed', { userId, shopId });

    return NextResponse.json({
      success: true,
      data: {
        message: 'Competitor removed successfully',
        shopId,
      },
    });
  } catch (error) {
    logger.error('Remove competitor error', { error });
    return NextResponse.json(
      { error: 'Failed to remove competitor' },
      { status: 500 }
    );
  }
}

async function handleAnalyzeCompetitor(request: NextRequest, userId: string) {
  try {
    const body = await request.json();
    const { shopId } = body;

    if (!shopId || typeof shopId !== 'number') {
      return NextResponse.json(
        { error: 'Invalid shopId' },
        { status: 400 }
      );
    }

    // Initialize competitor analyzer
    const competitorAnalyzer = new CompetitorAnalyzer();

    // Analyze competitor
    const snapshot = await competitorAnalyzer.analyzeCompetitor(userId, shopId);

    logger.info('Competitor analyzed', { userId, shopId });

    return NextResponse.json({
      success: true,
      data: {
        snapshot,
        analyzedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Analyze competitor error', { error });
    return NextResponse.json(
      { error: 'Failed to analyze competitor' },
      { status: 500 }
    );
  }
}

async function handleCompareCompetitor(request: NextRequest, userId: string) {
  try {
    const body = await request.json();
    const { shopId } = body;

    if (!shopId || typeof shopId !== 'number') {
      return NextResponse.json(
        { error: 'Invalid shopId' },
        { status: 400 }
      );
    }

    // Initialize competitor analyzer
    const competitorAnalyzer = new CompetitorAnalyzer();

    // Compare competitor
    const comparison = await competitorAnalyzer.compareCompetitor(userId, shopId);

    logger.info('Competitor compared', { userId, shopId });

    return NextResponse.json({
      success: true,
      data: {
        comparison,
        comparedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Compare competitor error', { error });
    return NextResponse.json(
      { error: 'Failed to compare competitor' },
      { status: 500 }
    );
  }
}

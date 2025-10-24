/**
 * Niche Finder API Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { NicheFinder } from '@/lib/niche-finder';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const findNichesSchema = z.object({
  filters: z.object({
    minDemand: z.number().min(0).max(100).optional(),
    maxCompetition: z.number().min(0).max(100).optional(),
    minOpportunity: z.number().min(0).max(100).optional(),
    maxDifficulty: z.number().min(0).max(100).optional(),
    categories: z.array(z.string()).optional(),
    marketSize: z.array(z.string()).optional(),
    trendDirection: z.array(z.string()).optional(),
    seasonality: z.array(z.string()).optional(),
    profitPotential: z.array(z.string()).optional(),
    entryBarriers: z.array(z.string()).optional(),
  }).optional(),
  limit: z.number().min(1).max(50).optional().default(20),
});

const analyzeNicheSchema = z.object({
  niche: z.string().min(1).max(100),
});

// GET - Get trending niches
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    const nicheFinder = new NicheFinder();

    switch (action) {
      case 'trending':
        const limit = parseInt(searchParams.get('limit') || '10');
        const trendingNiches = await nicheFinder.getTrendingNiches(limit);
        return NextResponse.json({
          success: true,
          data: {
            niches: trendingNiches,
            total: trendingNiches.length,
          },
        });

      case 'personalized':
        const personalizedLimit = parseInt(searchParams.get('limit') || '10');
        const personalizedNiches = await nicheFinder.getPersonalizedNiches(userId, personalizedLimit);
        return NextResponse.json({
          success: true,
          data: {
            niches: personalizedNiches,
            total: personalizedNiches.length,
          },
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    logger.error('Niche finder API error', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Find niches or analyze specific niche
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const action = body.action;

    const nicheFinder = new NicheFinder();

    switch (action) {
      case 'find':
        return handleFindNiches(request, userId, nicheFinder);
      case 'analyze':
        return handleAnalyzeNiche(request, userId, nicheFinder);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    logger.error('Niche finder API error', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleFindNiches(request: NextRequest, userId: string, nicheFinder: NicheFinder) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = findNichesSchema.safeParse({
      filters: body.filters,
      limit: body.limit,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { filters, limit } = validation.data;

    // Find niches
    const niches = await nicheFinder.findProfitableNiches(filters, limit);

    logger.info('Niche search completed', {
      userId,
      filters,
      limit,
      results: niches.length,
    });

    return NextResponse.json({
      success: true,
      data: {
        niches,
        total: niches.length,
        filters,
        searchedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Find niches error', { error });
    return NextResponse.json(
      { error: 'Failed to find niches' },
      { status: 500 }
    );
  }
}

async function handleAnalyzeNiche(request: NextRequest, userId: string, nicheFinder: NicheFinder) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = analyzeNicheSchema.safeParse({
      niche: body.niche,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { niche } = validation.data;

    // Analyze niche
    const analysis = await nicheFinder.analyzeNiche(niche);

    logger.info('Niche analysis completed', {
      userId,
      niche,
      analysis,
    });

    return NextResponse.json({
      success: true,
      data: {
        niche: analysis,
        analyzedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Analyze niche error', { error });
    return NextResponse.json(
      { error: 'Failed to analyze niche' },
      { status: 500 }
    );
  }
}

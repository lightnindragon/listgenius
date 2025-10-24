/**
 * Rank Tracking API Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { RankTrackingService } from '@/lib/rank-tracking';
import { getEtsyConnection } from '@/lib/clerk';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const addTrackingSchema = z.object({
  keyword: z.string().min(1).max(100),
  listingId: z.number().positive(),
});

const removeTrackingSchema = z.object({
  keyword: z.string().min(1).max(100),
  listingId: z.number().positive(),
});

const historySchema = z.object({
  keyword: z.string().min(1).max(100),
  listingId: z.number().positive(),
  days: z.number().min(1).max(365).optional().default(30),
});

// GET - Track user rankings
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'track':
        return handleTrackRankings(request, userId);
      case 'history':
        return handleGetHistory(request, userId);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    logger.error('Rank tracking API error', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Add/remove keyword tracking
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
        return handleAddTracking(request, userId);
      case 'remove':
        return handleRemoveTracking(request, userId);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    logger.error('Rank tracking API error', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleTrackRankings(request: NextRequest, userId: string) {
  try {
    // Get Etsy connection
    const etsyConnection = await getEtsyConnection(userId);
    
    // Initialize rank tracking service
    const rankTrackingService = new RankTrackingService(
      '', // TODO: Fix Etsy token handling
      '' // TODO: Fix Etsy token handling
    );

    // Track user rankings
    const summary = await rankTrackingService.trackUserRankings(userId);

    logger.info('User rankings tracked', {
      userId,
      summary,
    });

    return NextResponse.json({
      success: true,
      data: {
        summary,
        trackedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Track rankings error', { error });
    return NextResponse.json(
      { error: 'Failed to track rankings' },
      { status: 500 }
    );
  }
}

async function handleGetHistory(request: NextRequest, userId: string) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword');
    const listingId = searchParams.get('listingId');
    const days = searchParams.get('days');

    // Validate input
    const validation = historySchema.safeParse({
      keyword,
      listingId: listingId ? parseInt(listingId) : undefined,
      days: days ? parseInt(days) : undefined,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { keyword: validKeyword, listingId: validListingId, days: validDays } = validation.data;

    // Initialize rank tracking service
    const rankTrackingService = new RankTrackingService();

    // Get ranking history
    const history = await rankTrackingService.getRankingHistory(
      userId,
      validKeyword,
      validListingId,
      validDays
    );

    logger.info('Ranking history retrieved', {
      userId,
      keyword: validKeyword,
      listingId: validListingId,
      days: validDays,
      historyLength: history.history.length,
    });

    return NextResponse.json({
      success: true,
      data: {
        history,
      },
    });
  } catch (error) {
    logger.error('Get history error', { error });
    return NextResponse.json(
      { error: 'Failed to get ranking history' },
      { status: 500 }
    );
  }
}

async function handleAddTracking(request: NextRequest, userId: string) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = addTrackingSchema.safeParse({
      keyword: body.keyword,
      listingId: body.listingId,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { keyword, listingId } = validation.data;

    // Initialize rank tracking service
    const rankTrackingService = new RankTrackingService();

    // Add keyword tracking
    await rankTrackingService.addKeywordTracking(userId, keyword, listingId);

    logger.info('Keyword tracking added', {
      userId,
      keyword,
      listingId,
    });

    return NextResponse.json({
      success: true,
      data: {
        message: 'Keyword added to tracking',
        keyword,
        listingId,
      },
    });
  } catch (error) {
    logger.error('Add tracking error', { error });
    return NextResponse.json(
      { error: 'Failed to add keyword tracking' },
      { status: 500 }
    );
  }
}

async function handleRemoveTracking(request: NextRequest, userId: string) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = removeTrackingSchema.safeParse({
      keyword: body.keyword,
      listingId: body.listingId,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { keyword, listingId } = validation.data;

    // Initialize rank tracking service
    const rankTrackingService = new RankTrackingService();

    // Remove keyword tracking
    await rankTrackingService.removeKeywordTracking(userId, keyword, listingId);

    logger.info('Keyword tracking removed', {
      userId,
      keyword,
      listingId,
    });

    return NextResponse.json({
      success: true,
      data: {
        message: 'Keyword removed from tracking',
        keyword,
        listingId,
      },
    });
  } catch (error) {
    logger.error('Remove tracking error', { error });
    return NextResponse.json(
      { error: 'Failed to remove keyword tracking' },
      { status: 500 }
    );
  }
}

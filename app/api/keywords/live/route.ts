/**
 * Live Etsy Integration API Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { LiveEtsyIntegration } from '@/lib/live-etsy-integration';
import { getEtsyConnection } from '@/lib/clerk';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const searchSchema = z.object({
  keyword: z.string().min(1).max(100),
  includeShopAnalysis: z.boolean().optional().default(false),
});

const trendingSchema = z.object({
  category: z.string().optional(),
  limit: z.number().min(1).max(50).optional().default(20),
});

const suggestionsSchema = z.object({
  baseKeyword: z.string().min(1).max(100),
  limit: z.number().min(1).max(20).optional().default(10),
});

// GET - Get live competition data for a keyword
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'search':
        return handleLiveSearch(request, userId);
      case 'trending':
        return handleTrendingKeywords(request, userId);
      case 'suggestions':
        return handleKeywordSuggestions(request, userId);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    logger.error('Live Etsy API error', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleLiveSearch(request: NextRequest, userId: string) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword');
    const includeShopAnalysis = searchParams.get('includeShopAnalysis') === 'true';

    // Validate input
    const validation = searchSchema.safeParse({
      keyword,
      includeShopAnalysis,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { keyword: validKeyword, includeShopAnalysis: includeShops } = validation.data;

    // Get Etsy connection
    const etsyConnection = await getEtsyConnection(userId);
    
    // Initialize live integration
    const liveIntegration = new LiveEtsyIntegration(
      '', // TODO: Fix Etsy token handling
      '' // TODO: Fix Etsy token handling
    );

    // Get live competition data
    const competitionData = await liveIntegration.getLiveCompetitionData(validKeyword);

    let shopAnalysis = undefined;
    if (includeShops) {
      shopAnalysis = await liveIntegration.analyzeShopCompetition(validKeyword);
    }

    logger.info('Live Etsy search completed', {
      userId,
      keyword: validKeyword,
      totalResults: competitionData.totalResults,
      difficultyScore: competitionData.difficultyScore,
    });

    return NextResponse.json({
      success: true,
      data: {
        competition: competitionData,
        shopAnalysis,
      },
    });
  } catch (error) {
    logger.error('Live search error', { error });
    return NextResponse.json(
      { error: 'Failed to get live competition data' },
      { status: 500 }
    );
  }
}

async function handleTrendingKeywords(request: NextRequest, userId: string) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Validate input
    const validation = trendingSchema.safeParse({
      category,
      limit,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { category: validCategory, limit: validLimit } = validation.data;

    // Get Etsy connection
    const etsyConnection = await getEtsyConnection(userId);
    
    // Initialize live integration
    const liveIntegration = new LiveEtsyIntegration(
      '', // TODO: Fix Etsy token handling
      '' // TODO: Fix Etsy token handling
    );

    // Get trending keywords
    const trendingKeywords = await liveIntegration.getTrendingKeywords(validCategory, validLimit);

    logger.info('Trending keywords retrieved', {
      userId,
      category: validCategory,
      count: trendingKeywords.length,
    });

    return NextResponse.json({
      success: true,
      data: {
        keywords: trendingKeywords,
        category: validCategory,
      },
    });
  } catch (error) {
    logger.error('Trending keywords error', { error });
    return NextResponse.json(
      { error: 'Failed to get trending keywords' },
      { status: 500 }
    );
  }
}

async function handleKeywordSuggestions(request: NextRequest, userId: string) {
  try {
    const { searchParams } = new URL(request.url);
    const baseKeyword = searchParams.get('baseKeyword');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Validate input
    const validation = suggestionsSchema.safeParse({
      baseKeyword,
      limit,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { baseKeyword: validBaseKeyword, limit: validLimit } = validation.data;

    // Get Etsy connection
    const etsyConnection = await getEtsyConnection(userId);
    
    // Initialize live integration
    const liveIntegration = new LiveEtsyIntegration(
      '', // TODO: Fix Etsy token handling
      '' // TODO: Fix Etsy token handling
    );

    // Get live keyword suggestions
    const suggestions = await liveIntegration.getLiveKeywordSuggestions(validBaseKeyword, validLimit);

    logger.info('Live keyword suggestions retrieved', {
      userId,
      baseKeyword: validBaseKeyword,
      count: suggestions.length,
    });

    return NextResponse.json({
      success: true,
      data: {
        suggestions,
        baseKeyword: validBaseKeyword,
      },
    });
  } catch (error) {
    logger.error('Live keyword suggestions error', { error });
    return NextResponse.json(
      { error: 'Failed to get live keyword suggestions' },
      { status: 500 }
    );
  }
}

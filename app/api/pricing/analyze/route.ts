import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { smartPricingEngine, PricingAnalysis } from '@/lib/smart-pricing';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const analyzePricingSchema = z.object({
  listingId: z.number(),
  currentPrice: z.number().positive(),
  category: z.string().min(1),
  keywords: z.array(z.string()),
  costPrice: z.number().positive().optional(),
  targetMargin: z.number().min(0).max(100).optional(),
});

const bulkAnalyzeSchema = z.object({
  listings: z.array(z.object({
    id: z.number(),
    currentPrice: z.number().positive(),
    category: z.string().min(1),
    keywords: z.array(z.string()),
    costPrice: z.number().positive().optional(),
    targetMargin: z.number().min(0).max(100).optional(),
  })).min(1).max(50), // Limit to 50 listings per request
});

// POST - Analyze pricing for a single listing
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Check if this is a bulk analysis request
    const bulkValidation = bulkAnalyzeSchema.safeParse(body);
    if (bulkValidation.success) {
      return await handleBulkAnalysis(userId, bulkValidation.data);
    }

    // Single listing analysis
    const validation = analyzePricingSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { listingId, currentPrice, category, keywords, costPrice, targetMargin } = validation.data;

    logger.info('Starting pricing analysis', { 
      userId, 
      listingId, 
      currentPrice, 
      category, 
      keywords: keywords.length 
    });

    // Get pricing recommendation
    const recommendation = await smartPricingEngine.getPricingRecommendation(
      listingId,
      currentPrice,
      category,
      keywords,
      costPrice,
      targetMargin
    );

    // Get competitor data
    const competitorData = await smartPricingEngine.getCompetitorPriceRange(category, keywords);

    // Create pricing analysis record
    const analysis: PricingAnalysis = {
      id: `analysis_${Date.now()}_${listingId}`,
      userId,
      listingId,
      currentPrice,
      recommendedPrice: recommendation.recommendedPrice,
      competitorPriceMin: competitorData.min,
      competitorPriceMax: competitorData.max,
      competitorPriceAvg: competitorData.average,
      psychologicalPrice: recommendation.psychologicalPrice,
      expectedImpact: `${recommendation.expectedConversionChange}% conversion change, ${recommendation.expectedProfitChange}% profit change`,
      reasoning: recommendation.reasoning,
      createdAt: new Date(),
    };

    logger.info('Pricing analysis completed', { 
      userId, 
      listingId, 
      recommendedPrice: recommendation.recommendedPrice,
      confidence: recommendation.confidence 
    });

    return NextResponse.json({
      success: true,
      data: {
        analysis,
        recommendation,
        competitorData,
        alternatives: recommendation.alternatives,
      },
    });
  } catch (error) {
    logger.error('Pricing analysis failed', { 
      userId: (await auth()).userId, 
      error 
    });
    return NextResponse.json(
      { error: 'Failed to analyze pricing' }, 
      { status: 500 }
    );
  }
}

// Handle bulk pricing analysis
async function handleBulkAnalysis(userId: string, data: { listings: any[] }) {
  try {
    logger.info('Starting bulk pricing analysis', { 
      userId, 
      listingCount: data.listings.length 
    });

    const results = new Map();
    const competitorDataMap = new Map();
    const errors: string[] = [];

    // Process each listing
    for (const listing of data.listings) {
      try {
        const recommendation = await smartPricingEngine.getPricingRecommendation(
          listing.id,
          listing.currentPrice,
          listing.category,
          listing.keywords,
          listing.costPrice,
          listing.targetMargin
        );

        const competitorData = await smartPricingEngine.getCompetitorPriceRange(
          listing.category,
          listing.keywords
        );

        results.set(listing.id, {
          recommendation,
          analysis: {
            id: `analysis_${Date.now()}_${listing.id}`,
            userId,
            listingId: listing.id,
            currentPrice: listing.currentPrice,
            recommendedPrice: recommendation.recommendedPrice,
            competitorPriceMin: competitorData.min,
            competitorPriceMax: competitorData.max,
            competitorPriceAvg: competitorData.average,
            psychologicalPrice: recommendation.psychologicalPrice,
            expectedImpact: `${recommendation.expectedConversionChange}% conversion change, ${recommendation.expectedProfitChange}% profit change`,
            reasoning: recommendation.reasoning,
            createdAt: new Date(),
          }
        });

        competitorDataMap.set(listing.category, competitorData);
      } catch (error) {
        logger.error('Failed to analyze listing in bulk', { 
          userId, 
          listingId: listing.id, 
          error 
        });
        errors.push(`Failed to analyze listing ${listing.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    logger.info('Bulk pricing analysis completed', { 
      userId, 
      successCount: results.size, 
      errorCount: errors.length 
    });

    return NextResponse.json({
      success: true,
      data: {
        results: Object.fromEntries(results),
        competitorData: Object.fromEntries(competitorDataMap),
        errors,
        summary: {
          totalListings: data.listings.length,
          successfulAnalyses: results.size,
          failedAnalyses: errors.length,
        }
      },
    });
  } catch (error) {
    logger.error('Bulk pricing analysis failed', { userId, error });
    return NextResponse.json(
      { error: 'Failed to perform bulk pricing analysis' }, 
      { status: 500 }
    );
  }
}

// GET - Get pricing analysis history for a user
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listingId');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    logger.info('Fetching pricing analysis history', { userId, listingId, limit, offset });

    // Mock data - in real implementation, this would query the database
    const mockAnalyses: PricingAnalysis[] = [
      {
        id: 'analysis_1',
        userId,
        listingId: 1,
        currentPrice: 45.99,
        recommendedPrice: 42.99,
        competitorPriceMin: 35,
        competitorPriceMax: 55,
        competitorPriceAvg: 45,
        psychologicalPrice: 42.99,
        expectedImpact: '5% conversion increase, 2% profit increase',
        reasoning: 'Based on competitor analysis and psychological pricing optimization',
        createdAt: new Date(Date.now() - 86400000), // 1 day ago
      },
      {
        id: 'analysis_2',
        userId,
        listingId: 2,
        currentPrice: 32.50,
        recommendedPrice: 34.99,
        competitorPriceMin: 28,
        competitorPriceMax: 42,
        competitorPriceAvg: 35,
        psychologicalPrice: 34.99,
        expectedImpact: '8% conversion increase, 5% profit increase',
        reasoning: 'Price below market average, opportunity for premium positioning',
        createdAt: new Date(Date.now() - 172800000), // 2 days ago
      }
    ];

    const filteredAnalyses = listingId 
      ? mockAnalyses.filter(analysis => analysis.listingId === parseInt(listingId))
      : mockAnalyses;

    const paginatedAnalyses = filteredAnalyses
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: {
        analyses: paginatedAnalyses,
        totalCount: filteredAnalyses.length,
        hasMore: offset + limit < filteredAnalyses.length,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch pricing analysis history', { 
      userId: (await auth()).userId, 
      error 
    });
    return NextResponse.json(
      { error: 'Failed to fetch pricing analysis history' }, 
      { status: 500 }
    );
  }
}

// DELETE - Delete pricing analysis
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const analysisId = searchParams.get('analysisId');

    if (!analysisId) {
      return NextResponse.json({ error: 'Analysis ID is required' }, { status: 400 });
    }

    logger.info('Deleting pricing analysis', { userId, analysisId });

    // Mock deletion - in real implementation, this would delete from database
    // For now, just return success

    return NextResponse.json({
      success: true,
      message: 'Pricing analysis deleted successfully',
    });
  } catch (error) {
    logger.error('Failed to delete pricing analysis', { 
      userId: (await auth()).userId, 
      error 
    });
    return NextResponse.json(
      { error: 'Failed to delete pricing analysis' }, 
      { status: 500 }
    );
  }
}

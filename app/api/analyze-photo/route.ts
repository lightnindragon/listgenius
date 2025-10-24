/**
 * Photo Quality Analysis API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PhotoQualityAnalyzer } from '@/lib/photo-quality-analyzer';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const analyzeSchema = z.object({
  imageUrl: z.string().url(),
  productDescription: z.string().optional(),
});

const batchAnalyzeSchema = z.object({
  imageUrls: z.array(z.string().url()).min(1).max(10),
  productDescription: z.string().optional(),
});

const quickScoresSchema = z.object({
  imageUrls: z.array(z.string().url()).min(1).max(20),
});

// POST - Analyze single photo quality
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const action = body.action;

    switch (action) {
      case 'analyze':
        return handleSingleAnalysis(request, userId);
      case 'batch':
        return handleBatchAnalysis(request, userId);
      case 'quick-scores':
        return handleQuickScores(request, userId);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    logger.error('Photo analysis API error', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleSingleAnalysis(request: NextRequest, userId: string) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = analyzeSchema.safeParse({
      imageUrl: body.imageUrl,
      productDescription: body.productDescription,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { imageUrl, productDescription } = validation.data;

    // Initialize analyzer
    const analyzer = new PhotoQualityAnalyzer();

    // Analyze photo
    const analysis = await analyzer.analyzePhoto(imageUrl, productDescription);

    logger.info('Photo quality analysis completed', {
      userId,
      imageUrl: imageUrl.substring(0, 100) + '...',
      overallScore: analysis.overallScore,
      estimatedImpact: analysis.estimatedImpact,
    });

    return NextResponse.json({
      success: true,
      data: {
        analysis,
        imageUrl,
      },
    });
  } catch (error) {
    logger.error('Single photo analysis error', { error });
    return NextResponse.json(
      { error: 'Failed to analyze photo' },
      { status: 500 }
    );
  }
}

async function handleBatchAnalysis(request: NextRequest, userId: string) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = batchAnalyzeSchema.safeParse({
      imageUrls: body.imageUrls,
      productDescription: body.productDescription,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { imageUrls, productDescription } = validation.data;

    // Initialize analyzer
    const analyzer = new PhotoQualityAnalyzer();

    // Analyze listing photos
    const result = await analyzer.analyzeListingPhotos(imageUrls, productDescription);

    logger.info('Batch photo analysis completed', {
      userId,
      imageCount: imageUrls.length,
      overallListingScore: result.overallListingScore,
      bestPhotoIndex: result.bestPhotoIndex,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        imageUrls,
      },
    });
  } catch (error) {
    logger.error('Batch photo analysis error', { error });
    return NextResponse.json(
      { error: 'Failed to analyze photos' },
      { status: 500 }
    );
  }
}

async function handleQuickScores(request: NextRequest, userId: string) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = quickScoresSchema.safeParse({
      imageUrls: body.imageUrls,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { imageUrls } = validation.data;

    // Initialize analyzer
    const analyzer = new PhotoQualityAnalyzer();

    // Get quick quality scores
    const scores = await analyzer.getQuickQualityScores(imageUrls);

    logger.info('Quick quality scores completed', {
      userId,
      imageCount: imageUrls.length,
      averageScore: Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length),
    });

    return NextResponse.json({
      success: true,
      data: {
        scores,
        imageUrls,
        averageScore: Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length),
      },
    });
  } catch (error) {
    logger.error('Quick quality scores error', { error });
    return NextResponse.json(
      { error: 'Failed to get quality scores' },
      { status: 500 }
    );
  }
}

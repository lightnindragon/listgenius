/**
 * Keyword Difficulty Calculation API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { KeywordDifficultyCalculator } from '@/lib/keyword-difficulty-calculator';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const difficultySchema = z.object({
  keyword: z.string().min(1).max(100),
});

const batchDifficultySchema = z.object({
  keywords: z.array(z.string().min(1).max(100)).min(1).max(50),
});

// POST - Calculate keyword difficulty
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const action = body.action;

    switch (action) {
      case 'calculate':
        return handleSingleDifficulty(request, userId);
      case 'batch':
        return handleBatchDifficulty(request, userId);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    logger.error('Keyword difficulty API error', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleSingleDifficulty(request: NextRequest, userId: string) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = difficultySchema.safeParse({
      keyword: body.keyword,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { keyword } = validation.data;

    // Initialize calculator
    const calculator = new KeywordDifficultyCalculator();

    // Calculate difficulty
    const difficultyScore = await calculator.calculateDifficulty(keyword);

    logger.info('Keyword difficulty calculated', {
      userId,
      keyword,
      overallScore: difficultyScore.overallScore,
      difficulty: difficultyScore.difficulty,
      successProbability: difficultyScore.successProbability,
    });

    return NextResponse.json({
      success: true,
      data: {
        keyword,
        difficulty: difficultyScore,
      },
    });
  } catch (error) {
    logger.error('Single keyword difficulty error', { error });
    return NextResponse.json(
      { error: 'Failed to calculate keyword difficulty' },
      { status: 500 }
    );
  }
}

async function handleBatchDifficulty(request: NextRequest, userId: string) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = batchDifficultySchema.safeParse({
      keywords: body.keywords,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { keywords } = validation.data;

    // Initialize calculator
    const calculator = new KeywordDifficultyCalculator();

    // Calculate batch difficulty
    const difficultyScores = await calculator.calculateBatchDifficulty(keywords);

    // Convert Map to object
    const results = Object.fromEntries(difficultyScores);

    logger.info('Batch keyword difficulty calculated', {
      userId,
      keywordCount: keywords.length,
      calculatedCount: difficultyScores.size,
    });

    return NextResponse.json({
      success: true,
      data: {
        keywords: results,
        summary: {
          totalKeywords: keywords.length,
          calculatedKeywords: difficultyScores.size,
          averageScore: difficultyScores.size > 0 
            ? Math.round(
                Array.from(difficultyScores.values())
                  .reduce((sum, score) => sum + score.overallScore, 0) / difficultyScores.size
              )
            : 0,
        },
      },
    });
  } catch (error) {
    logger.error('Batch keyword difficulty error', { error });
    return NextResponse.json(
      { error: 'Failed to calculate batch keyword difficulty' },
      { status: 500 }
    );
  }
}

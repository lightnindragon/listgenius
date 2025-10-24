/**
 * Cron Jobs API Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { BackgroundJobManager } from '@/lib/background-jobs';
import { logger } from '@/lib/logger';

// POST - Trigger cron jobs
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobType } = body;

    const jobManager = new BackgroundJobManager();
    let result;

    switch (jobType) {
      case 'keyword-metrics':
        result = await jobManager.collectKeywordMetrics();
        break;
      case 'rank-tracking':
        result = await jobManager.trackKeywordRankings();
        break;
      case 'competitor-analysis':
        result = await jobManager.analyzeCompetitors();
        break;
      case 'difficulty-scores':
        result = await jobManager.generateDifficultyScores();
        break;
      case 'cleanup':
        result = await jobManager.cleanupOldData();
        break;
      case 'trending-keywords':
        result = await jobManager.generateTrendingKeywords();
        break;
      case 'shop-analytics':
        result = await jobManager.updateShopAnalytics();
        break;
      default:
        return NextResponse.json({ error: 'Invalid job type' }, { status: 400 });
    }

    logger.info('Cron job completed', { jobType, result });

    return NextResponse.json({
      success: true,
      data: {
        jobType,
        result,
        executedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Cron job failed', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Get job status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    const jobManager = new BackgroundJobManager();

    if (jobId) {
      const status = jobManager.getJobStatus(jobId);
      if (!status) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: status });
    } else {
      const allJobs = jobManager.getAllJobs();
      return NextResponse.json({ success: true, data: allJobs });
    }
  } catch (error) {
    logger.error('Failed to get job status', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

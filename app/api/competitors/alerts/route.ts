/**
 * Competitor Alerts API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { CompetitorAnalyzer } from '@/lib/competitor-analyzer';
import { logger } from '@/lib/logger';

// GET - Get competitor alerts
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Initialize competitor analyzer
    const competitorAnalyzer = new CompetitorAnalyzer();

    // Generate alerts
    const alerts = await competitorAnalyzer.generateAlerts(userId);

    logger.info('Competitor alerts generated', {
      userId,
      alertCount: alerts.length,
    });

    return NextResponse.json({
      success: true,
      data: {
        alerts,
        totalAlerts: alerts.length,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Competitor alerts API error', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

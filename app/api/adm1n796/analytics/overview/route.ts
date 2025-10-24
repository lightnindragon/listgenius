import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, getAnalyticsOverview } from '@/lib/admin';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    requireAdmin(request);

    // Get analytics overview
    const analytics = await getAnalyticsOverview();

    return NextResponse.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Admin authentication required') {
      return NextResponse.json(
        { success: false, error: 'Admin authentication required' },
        { status: 401 }
      );
    }

    logger.error('Error getting analytics overview', { error });
    return NextResponse.json(
      { success: false, error: 'Failed to get analytics overview' },
      { status: 500 }
    );
  }
}

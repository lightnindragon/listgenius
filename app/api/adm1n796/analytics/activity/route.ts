import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { getSystemAnalytics } from '@/lib/analytics';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    requireAdmin(request);

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Get system analytics
    const analytics = await getSystemAnalytics();

    // Filter by date range if provided
    let filteredData = analytics;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      filteredData = {
        ...analytics,
        userGrowth: analytics.userGrowth.filter(item => {
          const date = new Date(item.date);
          return date >= start && date <= end;
        })
      };
    }

    return NextResponse.json({
      success: true,
      data: filteredData
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Admin authentication required') {
      return NextResponse.json(
        { success: false, error: 'Admin authentication required' },
        { status: 401 }
      );
    }

    logger.error('Error getting analytics activity', { error });
    return NextResponse.json(
      { success: false, error: 'Failed to get analytics activity' },
      { status: 500 }
    );
  }
}

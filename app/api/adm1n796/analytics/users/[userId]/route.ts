import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { getUserAnalytics } from '@/lib/analytics';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Require admin authentication
    requireAdmin(request);

    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user analytics
    const analytics = await getUserAnalytics(userId);

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

    logger.error('Error getting user analytics', { userId: (await params).userId, error });
    return NextResponse.json(
      { success: false, error: 'Failed to get user analytics' },
      { status: 500 }
    );
  }
}

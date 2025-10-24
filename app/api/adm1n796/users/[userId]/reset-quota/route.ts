import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, resetUserQuota, getUserById } from '@/lib/admin';
import { logger } from '@/lib/logger';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Require admin authentication
    requireAdmin(request);

    const { userId } = await params;
    const body = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const { resetDaily, resetMonthly, setCustomQuota } = body;

    // Reset user quota
    await resetUserQuota(userId, {
      resetDaily: resetDaily || false,
      resetMonthly: resetMonthly || false,
      setCustomQuota: setCustomQuota
    });

    // Get updated user details
    const updatedUser = await getUserById(userId);

    logger.info('User quota reset by admin', { 
      userId, 
      resetDaily, 
      resetMonthly, 
      setCustomQuota 
    });

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'User quota reset successfully'
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Admin authentication required') {
      return NextResponse.json(
        { success: false, error: 'Admin authentication required' },
        { status: 401 }
      );
    }

    logger.error('Error resetting user quota', { userId: (await params).userId, error });
    return NextResponse.json(
      { success: false, error: 'Failed to reset user quota' },
      { status: 500 }
    );
  }
}

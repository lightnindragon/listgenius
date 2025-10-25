import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, resetUserQuota, getUserById } from '@/lib/admin';
import { logger } from '@/lib/logger';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    console.log('=== RESET QUOTA API CALLED ===');
    
    // Require admin authentication
    requireAdmin(request);
    console.log('Admin authentication passed');

    const { userId } = await params;
    console.log('User ID:', userId);
    
    const body = await request.json();
    console.log('Request body:', body);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const { resetDaily, resetMonthly, setCustomQuota } = body;
    console.log('Reset options:', { resetDaily, resetMonthly, setCustomQuota });

    // Reset user quota
    console.log('Calling resetUserQuota...');
    await resetUserQuota(userId, {
      resetDaily: resetDaily || false,
      resetMonthly: resetMonthly || false,
      setCustomQuota: setCustomQuota
    });
    console.log('resetUserQuota completed successfully');

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

    logger.error('Error resetting user quota', { 
      userId: (await params).userId, 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to reset user quota';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

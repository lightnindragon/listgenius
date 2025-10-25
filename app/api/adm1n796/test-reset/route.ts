import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, resetUserQuota } from '@/lib/admin';

export async function POST(request: NextRequest) {
  try {
    console.log('=== TEST RESET API CALLED ===');
    
    // Test admin authentication
    try {
      const session = requireAdmin(request);
      console.log('Admin session:', session);
    } catch (authError) {
      console.error('Admin auth failed:', authError);
      return NextResponse.json({
        success: false,
        error: 'Admin authentication failed',
        details: authError instanceof Error ? authError.message : 'Unknown error'
      }, { status: 401 });
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }

    console.log('Testing reset quota for user:', userId);

    // Test the reset quota function directly
    await resetUserQuota(userId, {
      resetDaily: true,
      resetMonthly: true
    });

    console.log('Reset quota test completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Reset quota test completed successfully'
    });

  } catch (error) {
    console.error('Test reset error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

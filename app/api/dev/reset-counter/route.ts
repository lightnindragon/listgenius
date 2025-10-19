import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClerkClient } from '@clerk/nextjs/server';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ success: false, error: 'Not available in production' }, { status: 403 });
    }

    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });
    
    // Reset daily counters
    const updatedMetadata = {
      dailyGenCount: 0,
      dailyRewriteCount: 0,
      lastResetDate: new Date().toISOString().split('T')[0] // Today's date
    };

    await clerk.users.updateUserMetadata(userId, {
      publicMetadata: updatedMetadata
    });

    logger.info('Daily counters reset for development', { userId });

    return NextResponse.json({
      success: true,
      message: 'Daily counters reset successfully'
    });
  } catch (error) {
    logger.error('Failed to reset daily counters', { error: (error as Error).message });
    return NextResponse.json(
      { success: false, error: 'Failed to reset counters' },
      { status: 500 }
    );
  }
}

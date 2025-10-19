import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getCurrentUser } from '@/lib/clerk';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const user = await getCurrentUser(userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const metadata = user.publicMetadata as any;

    const response = {
      plan: metadata.plan || 'free',
      dailyGenCount: metadata.dailyGenCount || 0,
      dailyRewriteCount: metadata.dailyRewriteCount || 0,
      preferences: metadata.preferences || {
        tone: 'Professional',
        niche: '',
        audience: ''
      },
      etsyConnection: metadata.etsyConnection || {
        connected: false,
        shopId: '',
        shopName: ''
      }
    };

    logger.info('User metadata retrieved', { userId, plan: response.plan });

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Failed to get user metadata', { error: (error as Error).message });
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve user data' },
      { status: 500 }
    );
  }
}

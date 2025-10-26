import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { recordReferralOnSignup } from '@/lib/affiliate';
import { logger } from '@/lib/logger';

export async function POST() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // Record referral if cookie exists (only for approved affiliates)
    const affiliateCode = await recordReferralOnSignup(userId);
    
    logger.info('User onboarding completed', { 
      userId, 
      affiliateCode: affiliateCode || 'none' 
    });

    return NextResponse.json({ 
      success: true,
      affiliateCode 
    });
    
  } catch (error) {
    logger.error('User onboarding failed', { error });
    
    return NextResponse.json(
      { error: 'Onboarding failed' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { recordReferralOnSignup } from '@/lib/affiliate';
import { logger } from '@/lib/logger';
import { sendWelcomeEmail } from '@/lib/email';

export async function POST() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // Get user details for email
    const user = await currentUser();
    const userEmail = user?.emailAddresses[0]?.emailAddress;
    const userName = user?.firstName || user?.emailAddresses[0]?.emailAddress || 'there';

    // Record referral if cookie exists (only for approved affiliates)
    const affiliateCode = await recordReferralOnSignup(userId);
    
    // Send welcome email
    if (userEmail) {
      try {
        await sendWelcomeEmail(userEmail, userName);
        logger.info('Welcome email sent', { userId, email: userEmail });
      } catch (emailError) {
        // Don't fail onboarding if email fails
        logger.error('Failed to send welcome email', { error: emailError, userId, email: userEmail });
      }
    }
    
    logger.info('User onboarding completed', { 
      userId, 
      affiliateCode: affiliateCode || 'none',
      welcomeEmailSent: !!userEmail
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

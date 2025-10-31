import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { getAffiliateForUser } from '@/lib/affiliate';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // Get affiliate account (if they have one)
    const affiliate = await getAffiliateForUser(userId);

    if (!affiliate) {
      // Return 200 with null affiliate instead of 404 to avoid console errors
      return NextResponse.json({
        affiliate: null,
        hasApplication: false,
      });
    }

    // Get actual referral count from database
    const actualReferralCount = await prisma.referral.count({
      where: { affiliateCode: affiliate.code }
    });

    // Calculate actual referral stats
    const affiliateWithStats = {
      ...affiliate,
      referralCount: actualReferralCount, // Use actual count instead of stored field
      // Preserve other fields
    };

    logger.info('Affiliate dashboard data fetched', { 
      userId, 
      actualReferralCount,
      storedReferralCount: affiliate.referralCount 
    });

    return NextResponse.json({ affiliate: affiliateWithStats });
    
  } catch (error) {
    logger.error('Failed to fetch affiliate dashboard', { error });
    
    return NextResponse.json(
      { error: 'Failed to fetch affiliate data' },
      { status: 500 }
    );
  }
}

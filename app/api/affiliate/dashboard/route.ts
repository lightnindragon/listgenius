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
      return NextResponse.json(
        { error: 'No affiliate account found' }, 
        { status: 404 }
      );
    }

    logger.info('Affiliate dashboard data fetched', { userId });

    return NextResponse.json({ affiliate });
    
  } catch (error) {
    logger.error('Failed to fetch affiliate dashboard', { error });
    
    return NextResponse.json(
      { error: 'Failed to fetch affiliate data' },
      { status: 500 }
    );
  }
}

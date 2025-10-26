import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/affiliate';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    if (!isAdminAuthenticated(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const payouts = await prisma.payout.findMany({
      where: { status: 'QUEUED' },
      orderBy: { createdAt: 'asc' },
      include: { 
        affiliate: true 
      },
    });

    logger.info('Admin fetched queued payouts', { 
      count: payouts.length,
      adminUserId: userId 
    });

    return NextResponse.json({ payouts });
    
  } catch (error) {
    logger.error('Failed to fetch queued payouts', { error });
    
    return NextResponse.json(
      { error: 'Failed to fetch payouts' },
      { status: 500 }
    );
  }
}

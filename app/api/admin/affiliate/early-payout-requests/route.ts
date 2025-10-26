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

    const earlyPayoutRequests = await prisma.payout.findMany({
      where: {
        type: 'EARLY_REQUEST',
        status: 'REQUESTED'
      },
      include: {
        affiliate: {
          select: {
            id: true,
            code: true,
            userName: true,
            userEmail: true,
            payoutEmail: true,
            pendingEarnings: true,
            totalEarnings: true,
          }
        }
      },
      orderBy: { requestedAt: 'asc' }
    });

    logger.info('Admin fetched early payout requests', { 
      count: earlyPayoutRequests.length
    });

    return NextResponse.json({ requests: earlyPayoutRequests });
    
  } catch (error) {
    logger.error('Failed to fetch early payout requests', { error });
    
    return NextResponse.json(
      { error: 'Failed to fetch early payout requests' },
      { status: 500 }
    );
  }
}

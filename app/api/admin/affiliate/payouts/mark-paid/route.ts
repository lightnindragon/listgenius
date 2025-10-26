import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/affiliate';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    if (!isAdminAuthenticated(req)) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const { payoutId, method, reference } = await req.json();
    
    if (!payoutId) {
      return NextResponse.json(
        { error: 'Payout ID required' }, 
        { status: 400 }
      );
    }

    const payout = await prisma.payout.findUnique({ 
      where: { id: payoutId } 
    });
    
    if (!payout) {
      return NextResponse.json(
        { error: 'Payout not found' }, 
        { status: 404 }
      );
    }

    if (payout.status !== 'QUEUED') {
      return NextResponse.json(
        { error: 'Payout is not queued' }, 
        { status: 400 }
      );
    }

    // Update payout and transfer earnings in a transaction
    await prisma.$transaction([
      prisma.payout.update({
        where: { id: payoutId },
        data: {
          status: 'PAID',
          method: method || payout.method || 'manual',
          reference: reference || payout.reference,
          paidAt: new Date(),
        },
      }),
      prisma.affiliate.update({
        where: { id: payout.affiliateId },
        data: {
          pendingEarnings: { decrement: payout.amount },
          totalEarnings: { increment: payout.amount },
        },
      }),
    ]);

    logger.info('Payout marked as paid', {
      payoutId,
      affiliateId: payout.affiliateId,
      amount: Number(payout.amount),
      method: method || payout.method,
      reference: reference || payout.reference,
    });

    return NextResponse.json({ success: true });
    
  } catch (error) {
    logger.error('Failed to mark payout as paid', { error });
    
    return NextResponse.json(
      { error: 'Failed to mark payout as paid' },
      { status: 500 }
    );
  }
}

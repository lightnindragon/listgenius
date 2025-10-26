import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/affiliate';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    if (!isAdminAuthenticated(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const { payoutId, action, paypalTransactionId, notes } = await request.json();

    if (!payoutId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
      include: { affiliate: true }
    });

    if (!payout) {
      return NextResponse.json(
        { error: 'Payout request not found' },
        { status: 404 }
      );
    }

    if (payout.status !== 'REQUESTED') {
      return NextResponse.json(
        { error: 'Payout request is not in REQUESTED status' },
        { status: 400 }
      );
    }

    if (payout.type !== 'EARLY_REQUEST') {
      return NextResponse.json(
        { error: 'This is not an early payout request' },
        { status: 400 }
      );
    }

    let updateData: any = {
      updatedAt: new Date()
    };

    if (action === 'approve') {
      // Check if affiliate has enough pending earnings
      if (Number(payout.affiliate.pendingEarnings) < Number(payout.amount)) {
        return NextResponse.json(
          { error: 'Affiliate does not have enough pending earnings' },
          { status: 400 }
        );
      }

      updateData.status = 'APPROVED';
      updateData.approvedAt = new Date();
      updateData.approvedBy = 'admin'; // You can get this from session
      updateData.paypalTransactionId = paypalTransactionId || null;
      updateData.notes = notes || payout.notes;

      // Update affiliate earnings
      await prisma.$transaction([
        prisma.payout.update({
          where: { id: payoutId },
          data: updateData
        }),
        prisma.affiliate.update({
          where: { id: payout.affiliateId },
          data: {
            pendingEarnings: { decrement: Number(payout.amount) },
            totalEarnings: { increment: Number(payout.amount) },
          }
        })
      ]);

      logger.info('Early payout request approved', {
        payoutId,
        affiliateId: payout.affiliateId,
        affiliateCode: payout.affiliate.code,
        amount: Number(payout.amount),
        paypalTransactionId
      });

    } else if (action === 'reject') {
      updateData.status = 'CANCELED';
      updateData.notes = notes || 'Request rejected by admin';

      await prisma.payout.update({
        where: { id: payoutId },
        data: updateData
      });

      logger.info('Early payout request rejected', {
        payoutId,
        affiliateId: payout.affiliateId,
        affiliateCode: payout.affiliate.code,
        reason: notes
      });
    }

    return NextResponse.json({
      success: true,
      message: `Early payout request ${action}d successfully`,
      payout: {
        id: payoutId,
        status: updateData.status
      }
    });
    
  } catch (error) {
    logger.error('Failed to process early payout request', { error });
    
    return NextResponse.json(
      { error: 'Failed to process early payout request' },
      { status: 500 }
    );
  }
}

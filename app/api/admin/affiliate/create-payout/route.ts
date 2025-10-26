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

    const { affiliateId, amount, type, notes, method } = await request.json();

    if (!affiliateId || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid affiliate ID or amount' },
        { status: 400 }
      );
    }

    const affiliate = await prisma.affiliate.findUnique({
      where: { id: affiliateId }
    });

    if (!affiliate) {
      return NextResponse.json(
        { error: 'Affiliate not found' },
        { status: 404 }
      );
    }

    if (affiliate.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Can only create payouts for approved affiliates' },
        { status: 400 }
      );
    }

    if (!affiliate.payoutEmail) {
      return NextResponse.json(
        { error: 'Affiliate must have a payout email set' },
        { status: 400 }
      );
    }

    const payoutAmount = Number(amount);
    const payoutType = type || 'MANUAL';
    const payoutMethod = method || 'paypal';

    // For manual payouts, we don't automatically deduct from pending earnings
    // The admin can choose to do this separately if needed
    const payout = await prisma.payout.create({
      data: {
        affiliateId: affiliate.id,
        amount: payoutAmount,
        currency: 'USD',
        status: 'QUEUED',
        type: payoutType,
        method: payoutMethod,
        notes: notes || `Manual payout created by admin`,
        approvedAt: new Date(),
        approvedBy: 'admin',
      }
    });

    logger.info('Manual payout created', {
      payoutId: payout.id,
      affiliateId: affiliate.id,
      affiliateCode: affiliate.code,
      amount: payoutAmount,
      type: payoutType,
      method: payoutMethod
    });

    return NextResponse.json({
      success: true,
      message: 'Payout created successfully',
      payout: {
        id: payout.id,
        amount: payoutAmount,
        type: payoutType,
        status: 'QUEUED',
        affiliateCode: affiliate.code,
        affiliateEmail: affiliate.payoutEmail
      }
    });
    
  } catch (error) {
    logger.error('Failed to create manual payout', { error });
    
    return NextResponse.json(
      { error: 'Failed to create manual payout' },
      { status: 500 }
    );
  }
}

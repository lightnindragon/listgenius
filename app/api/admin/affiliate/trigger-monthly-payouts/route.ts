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

    const MIN_PAYOUT = Number(process.env.AFFILIATE_MIN_PAYOUT || 10);

    // Get all approved affiliates with pending earnings above minimum
    const eligibleAffiliates = await prisma.affiliate.findMany({
      where: {
        status: 'APPROVED',
        pendingEarnings: { gte: MIN_PAYOUT },
        payoutEmail: { not: null }
      }
    });

    if (eligibleAffiliates.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No eligible affiliates for monthly payout',
        payoutsCreated: 0
      });
    }

    const payoutsCreated = [];

    for (const affiliate of eligibleAffiliates) {
      // Check if there's already a monthly payout for this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const existingPayout = await prisma.payout.findFirst({
        where: {
          affiliateId: affiliate.id,
          type: 'MONTHLY',
          createdAt: { gte: startOfMonth }
        }
      });

      if (existingPayout) {
        logger.info('Monthly payout already exists for affiliate', {
          affiliateId: affiliate.id,
          affiliateCode: affiliate.code,
          existingPayoutId: existingPayout.id
        });
        continue;
      }

      // Create monthly payout
      const payout = await prisma.payout.create({
        data: {
          affiliateId: affiliate.id,
          amount: Number(affiliate.pendingEarnings),
          currency: 'USD',
          status: 'QUEUED',
          type: 'MONTHLY',
          method: 'paypal',
          notes: `Monthly payout for ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
        }
      });

      // Update affiliate earnings
      await prisma.affiliate.update({
        where: { id: affiliate.id },
        data: {
          pendingEarnings: 0,
          totalEarnings: { increment: Number(affiliate.pendingEarnings) },
        }
      });

      payoutsCreated.push({
        id: payout.id,
        affiliateCode: affiliate.code,
        amount: Number(affiliate.pendingEarnings),
        email: affiliate.payoutEmail
      });

      logger.info('Monthly payout created', {
        payoutId: payout.id,
        affiliateId: affiliate.id,
        affiliateCode: affiliate.code,
        amount: Number(affiliate.pendingEarnings),
        email: affiliate.payoutEmail
      });
    }

    logger.info('Manual monthly payouts triggered', {
      eligibleAffiliates: eligibleAffiliates.length,
      payoutsCreated: payoutsCreated.length
    });

    return NextResponse.json({
      success: true,
      message: `Monthly payouts triggered successfully. ${payoutsCreated.length} payouts created.`,
      payoutsCreated: payoutsCreated.length,
      payouts: payoutsCreated
    });
    
  } catch (error) {
    logger.error('Failed to trigger monthly payouts', { error });
    
    return NextResponse.json(
      { error: 'Failed to trigger monthly payouts' },
      { status: 500 }
    );
  }
}

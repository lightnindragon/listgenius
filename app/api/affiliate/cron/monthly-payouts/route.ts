import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const MIN_PAYOUT = Number(process.env.AFFILIATE_MIN_PAYOUT || 10);
const CURRENCY = process.env.AFFILIATE_PAYOUT_CURRENCY || 'USD';

export async function GET() {
  try {
    logger.info('Monthly payout cron started');

    // Find affiliates eligible for payout
    const affiliates = await prisma.affiliate.findMany({
      where: {
        pendingEarnings: { gte: MIN_PAYOUT },
        payoutEmail: { not: null },
      },
      orderBy: { pendingEarnings: 'desc' },
    });

    if (affiliates.length === 0) {
      logger.info('No affiliates eligible for monthly payout');
      return NextResponse.json({ 
        success: true, 
        queued: 0,
        message: 'No eligible affiliates found'
      });
    }

    // Create QUEUED payouts for each eligible affiliate
    const payoutPromises = affiliates.map(affiliate =>
      prisma.payout.create({
        data: {
          affiliateId: affiliate.id,
          amount: affiliate.pendingEarnings,
          currency: CURRENCY,
          status: 'QUEUED',
          method: 'manual', // Will be updated when admin processes
        },
      })
    );

    await Promise.all(payoutPromises);

    logger.info('Monthly payouts queued', {
      count: affiliates.length,
      totalAmount: affiliates.reduce((sum, a) => sum + Number(a.pendingEarnings), 0),
      currency: CURRENCY,
    });

    return NextResponse.json({ 
      success: true, 
      queued: affiliates.length,
      totalAmount: affiliates.reduce((sum, a) => sum + Number(a.pendingEarnings), 0),
      currency: CURRENCY,
    });
    
  } catch (error) {
    logger.error('Monthly payout cron failed', { error });
    
    return NextResponse.json(
      { error: 'Cron job failed' },
      { status: 500 }
    );
  }
}

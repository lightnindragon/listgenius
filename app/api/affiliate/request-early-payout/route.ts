import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get affiliate account
    const affiliate = await prisma.affiliate.findUnique({
      where: { userId }
    });

    if (!affiliate) {
      return NextResponse.json(
        { error: 'No affiliate account found' },
        { status: 404 }
      );
    }

    if (affiliate.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Only approved affiliates can request early payouts' },
        { status: 403 }
      );
    }

    const pendingEarnings = Number(affiliate.pendingEarnings);
    const EARLY_PAYOUT_THRESHOLD = 50; // $50 minimum for early payout

    if (pendingEarnings < EARLY_PAYOUT_THRESHOLD) {
      return NextResponse.json(
        { error: `Minimum $${EARLY_PAYOUT_THRESHOLD} required for early payout. You have $${pendingEarnings.toFixed(2)} pending.` },
        { status: 400 }
      );
    }

    if (!affiliate.payoutEmail) {
      return NextResponse.json(
        { error: 'Please set your payout email before requesting a payout' },
        { status: 400 }
      );
    }

    // Check if there's already a pending early payout request
    const existingRequest = await prisma.payout.findFirst({
      where: {
        affiliateId: affiliate.id,
        type: 'EARLY_REQUEST',
        status: { in: ['REQUESTED', 'QUEUED', 'APPROVED'] }
      }
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: 'You already have a pending early payout request' },
        { status: 409 }
      );
    }

    // Create early payout request
    const payout = await prisma.payout.create({
      data: {
        affiliateId: affiliate.id,
        amount: pendingEarnings,
        currency: 'USD',
        status: 'REQUESTED',
        type: 'EARLY_REQUEST',
        method: 'paypal',
        requestedAt: new Date(),
        notes: `Early payout request from affiliate ${affiliate.code}`,
      }
    });

    logger.info('Early payout request created', {
      payoutId: payout.id,
      affiliateId: affiliate.id,
      affiliateCode: affiliate.code,
      amount: pendingEarnings,
      userEmail: affiliate.payoutEmail
    });

    return NextResponse.json({
      success: true,
      message: 'Early payout request submitted successfully. Admin will review and process it soon.',
      payout: {
        id: payout.id,
        amount: pendingEarnings,
        status: 'REQUESTED'
      }
    });

  } catch (error) {
    logger.error('Failed to create early payout request', { error });

    return NextResponse.json(
      { error: 'Failed to submit early payout request' },
      { status: 500 }
    );
  }
}
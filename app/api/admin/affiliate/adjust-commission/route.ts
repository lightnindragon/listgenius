import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/affiliate';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    if (!isAdminAuthenticated(request)) {
      logger.warn('Unauthorized access to adjust commission API');
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const { affiliateId, amount, reason } = await request.json();

    if (!affiliateId || amount === undefined || amount === null || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: affiliateId, amount, and reason' },
        { status: 400 }
      );
    }

    const affiliate = await prisma.affiliate.findUnique({
      where: { id: affiliateId },
    });

    if (!affiliate) {
      logger.warn('Affiliate not found for commission adjustment', { affiliateId });
      return NextResponse.json(
        { error: 'Affiliate not found' },
        { status: 404 }
      );
    }

    // Create commission adjustment record
    const adjustment = await prisma.commissionAdjustment.create({
      data: {
        affiliateId,
        amount: parseFloat(amount.toString()),
        reason: reason.trim(),
        createdBy: 'admin', // Admin who made the adjustment
      },
    });

    // Update affiliate's pending earnings
    const newPendingEarnings = Number(affiliate.pendingEarnings) + parseFloat(amount.toString());
    
    await prisma.affiliate.update({
      where: { id: affiliateId },
      data: {
        pendingEarnings: newPendingEarnings,
      },
    });

    logger.info('Commission adjustment created', {
      affiliateId,
      affiliateCode: affiliate.code,
      adjustmentAmount: amount,
      newPendingEarnings,
      adjustmentId: adjustment.id,
      reason,
    });

    return NextResponse.json({ 
      success: true,
      adjustment: {
        id: adjustment.id,
        amount: adjustment.amount,
        reason: adjustment.reason,
        newPendingEarnings,
      }
    });

  } catch (error) {
    logger.error('Failed to adjust commission', { 
      error: (error as Error).message,
      affiliateId: (await request.json()).affiliateId 
    });
    return NextResponse.json(
      { error: 'Failed to adjust commission' },
      { status: 500 }
    );
  }
}
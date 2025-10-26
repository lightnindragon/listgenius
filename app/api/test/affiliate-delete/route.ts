import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    // Get all affiliates with their related data counts
    const affiliates = await prisma.affiliate.findMany({
      include: {
        _count: {
          select: {
            referrals: true,
            payouts: true,
            clicks: true,
            loginLogs: true,
            commissionAdjustments: true,
          },
        },
      },
    });

    const affiliateData = affiliates.map(affiliate => ({
      id: affiliate.id,
      code: affiliate.code,
      userId: affiliate.userId,
      status: affiliate.status,
      userName: affiliate.userName,
      userEmail: affiliate.userEmail,
      counts: affiliate._count,
    }));

    return NextResponse.json({
      success: true,
      affiliates: affiliateData,
      total: affiliates.length,
    });
  } catch (error) {
    logger.error('Failed to fetch affiliate test data', { error });
    return NextResponse.json(
      { error: 'Failed to fetch affiliate data' },
      { status: 500 }
    );
  }
}

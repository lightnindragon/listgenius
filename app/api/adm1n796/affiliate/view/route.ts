import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    if (!token) {
      return NextResponse.json({ success: false, error: 'Missing token' }, { status: 400 });
    }

    const secret = process.env.ADMIN_SESSION_SECRET || 'admin-session-secret-change-in-production';
    const payload = jwt.verify(token, secret) as { affiliateId: string; purpose?: string };
    if (!payload || payload.purpose !== 'affiliate_admin_view' || !payload.affiliateId) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const affiliate = await prisma.affiliate.findUnique({ where: { id: payload.affiliateId } });
    if (!affiliate) {
      return NextResponse.json({ success: false, error: 'Affiliate not found' }, { status: 404 });
    }

    // Get actual referral count from database
    const actualReferralCount = await prisma.referral.count({
      where: { affiliateCode: affiliate.code }
    });

    // Return affiliate with actual referral count
    const affiliateWithStats = {
      ...affiliate,
      referralCount: actualReferralCount, // Use actual count instead of stored field
    };

    return NextResponse.json({ success: true, affiliate: affiliateWithStats });
  } catch (error: any) {
    logger.error('Admin affiliate view error', { error: error?.message });
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
}



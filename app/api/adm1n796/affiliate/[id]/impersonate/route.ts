import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { requireAdmin } from '@/lib/admin';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    requireAdmin(request);
    const affiliateId = params.id;
    if (!affiliateId) {
      return NextResponse.json({ success: false, error: 'Missing affiliate id' }, { status: 400 });
    }

    const secret = process.env.ADMIN_SESSION_SECRET || 'admin-session-secret-change-in-production';
    const token = jwt.sign(
      { affiliateId, purpose: 'affiliate_admin_view' },
      secret,
      { expiresIn: '10m' }
    );

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    const url = `${appUrl}/app/affiliate?adminToken=${encodeURIComponent(token)}`;

    return NextResponse.json({ success: true, url });
  } catch (error: any) {
    logger.error('Affiliate impersonation token error', { error: error?.message });
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
}



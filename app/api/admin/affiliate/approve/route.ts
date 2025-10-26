import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/affiliate';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    if (!isAdminAuthenticated(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { affiliateId, action, rejectionReason } = await req.json();

    if (!affiliateId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const affiliate = await prisma.affiliate.findUnique({
      where: { id: affiliateId },
    });

    if (!affiliate) {
      return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 });
    }

    let updateData: any = {};

    if (action === 'approve' || action === 'approved') {
      updateData = {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: 'admin', // You could get this from the admin session
        rejectionReason: null, // Clear rejection reason when approving
      };
    } else if (action === 'reject' || action === 'rejected') {
      updateData = {
        status: 'REJECTED',
        rejectionReason: rejectionReason || 'Application rejected',
        approvedAt: null, // Clear approval date when rejecting
        approvedBy: null,
      };
    } else if (action === 'suspend' || action === 'suspended') {
      updateData = {
        status: 'SUSPENDED',
        rejectionReason: rejectionReason || 'Account suspended',
        approvedAt: null, // Clear approval date when suspending
        approvedBy: null,
      };
    } else if (action === 'pending') {
      updateData = {
        status: 'PENDING',
        rejectionReason: null, // Clear rejection reason when moving back to pending
        approvedAt: null,
        approvedBy: null,
      };
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const updatedAffiliate = await prisma.affiliate.update({
      where: { id: affiliateId },
      data: updateData,
    });

    logger.info('Affiliate status updated', {
      affiliateId,
      oldStatus: affiliate.status,
      newStatus: updateData.status,
      action,
      affiliateCode: affiliate.code,
    });

    return NextResponse.json({ 
      success: true, 
      affiliate: updatedAffiliate 
    });

  } catch (error) {
    logger.error('Affiliate status update error', {
      affiliateId: (await req.json()).affiliateId,
      error: (error as Error).message
    });
    return NextResponse.json(
      { error: 'Failed to process application' },
      { status: 500 }
    );
  }
}

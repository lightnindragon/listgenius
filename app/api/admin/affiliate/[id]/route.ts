import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/affiliate';
import { logger } from '@/lib/logger';
import { clerkClient } from '@clerk/nextjs/server';
import { deleteUser } from '@/lib/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isAdminAuthenticated(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const { id } = await params;

    const affiliate = await prisma.affiliate.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            referrals: true,
            payouts: true,
            clicks: true,
          },
        },
      },
    });

    if (!affiliate) {
      return NextResponse.json(
        { error: 'Affiliate not found' },
        { status: 404 }
      );
    }

    // Fetch user details from Clerk
    let clerkUser = null;
    try {
      const user = await (await clerkClient()).users.getUser(affiliate.userId);
      clerkUser = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        emailAddresses: user.emailAddresses,
        createdAt: user.createdAt,
        lastSignInAt: user.lastSignInAt,
      };
    } catch (error) {
      logger.warn('Failed to fetch user details for affiliate', { 
        affiliateId: id, 
        userId: affiliate.userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    const affiliateWithDetails = {
      ...affiliate,
      userName: clerkUser?.firstName && clerkUser?.lastName 
        ? `${clerkUser.firstName} ${clerkUser.lastName}` 
        : clerkUser?.username || clerkUser?.emailAddresses?.[0]?.emailAddress || 'Unknown',
      userEmail: clerkUser?.emailAddresses?.[0]?.emailAddress || null,
      clerkUser,
    };

    logger.info('Admin fetched affiliate details', { 
      affiliateId: id,
      affiliateCode: affiliate.code
    });

    return NextResponse.json({ affiliate: affiliateWithDetails });
    
  } catch (error) {
    logger.error('Failed to fetch affiliate details', { error });
    
    return NextResponse.json(
      { error: 'Failed to fetch affiliate details' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isAdminAuthenticated(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const { id } = await params;
    const { userName, userEmail, payoutEmail, customSlug, applicationNote, rejectionReason } = await request.json();

    // Validate custom slug if provided
    if (customSlug && customSlug.trim() !== '') {
      const slug = customSlug.trim().toLowerCase();
      
      // Check slug format (only letters, numbers, and hyphens)
      if (!/^[a-z0-9-]+$/.test(slug)) {
        return NextResponse.json({ 
          error: 'Custom slug can only contain letters, numbers, and hyphens' 
        }, { status: 400 });
      }
      
      // Check minimum length
      if (slug.length < 3) {
        return NextResponse.json({ 
          error: 'Custom slug must be at least 3 characters long' 
        }, { status: 400 });
      }
      
      // Check maximum length
      if (slug.length > 50) {
        return NextResponse.json({ 
          error: 'Custom slug must be 50 characters or less' 
        }, { status: 400 });
      }
      
      // Check if slug is already taken by another affiliate
      const existingSlug = await prisma.affiliate.findFirst({
        where: { 
          customSlug: slug,
          id: { not: id } // Exclude current affiliate
        },
      });
      
      if (existingSlug) {
        return NextResponse.json({ 
          error: 'This custom slug is already taken by another affiliate' 
        }, { status: 400 });
      }
    }

    const affiliate = await prisma.affiliate.findUnique({
      where: { id }
    });

    if (!affiliate) {
      return NextResponse.json(
        { error: 'Affiliate not found' },
        { status: 404 }
      );
    }

    const updatedAffiliate = await prisma.affiliate.update({
      where: { id },
      data: {
        userName: userName || null,
        userEmail: userEmail || null,
        payoutEmail: payoutEmail || null,
        customSlug: customSlug || null,
        applicationNote: applicationNote || null,
        rejectionReason: rejectionReason || null,
        updatedAt: new Date(),
      }
    });

    logger.info('Admin updated affiliate details', { 
      affiliateId: id,
      affiliateCode: affiliate.code,
      changes: { userName, userEmail, payoutEmail }
    });

    return NextResponse.json({ 
      success: true, 
      affiliate: updatedAffiliate,
      message: 'Affiliate updated successfully'
    });
    
  } catch (error) {
    logger.error('Failed to update affiliate', { error });
    
    return NextResponse.json(
      { error: 'Failed to update affiliate' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    if (!isAdminAuthenticated(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const affiliate = await prisma.affiliate.findUnique({
      where: { id }
    });

    if (!affiliate) {
      return NextResponse.json(
        { error: 'Affiliate not found' },
        { status: 404 }
      );
    }

    // Delete the affiliate and all related data from the database
    await prisma.$transaction(async (tx) => {
      // Delete all related records first (due to foreign key constraints)
      // Note: Some models use affiliateId, others use affiliateCode
      
      logger.info('Starting affiliate deletion transaction', { 
        affiliateId: id, 
        affiliateCode: affiliate.code,
        userId: affiliate.userId
      });
      
      // Delete by affiliateId
      const commissionAdjustments = await tx.commissionAdjustment.deleteMany({
        where: { affiliateId: id }
      });
      logger.info('Deleted commission adjustments', { count: commissionAdjustments.count });
      
      const loginLogs = await tx.affiliateLoginLog.deleteMany({
        where: { affiliateId: id }
      });
      logger.info('Deleted login logs', { count: loginLogs.count });
      
      const payouts = await tx.payout.deleteMany({
        where: { affiliateId: id }
      });
      logger.info('Deleted payouts', { count: payouts.count });
      
      // Delete by affiliateCode
      const clicks = await tx.refClick.deleteMany({
        where: { affiliateCode: affiliate.code }
      });
      logger.info('Deleted clicks', { count: clicks.count });
      
      const referrals = await tx.referral.deleteMany({
        where: { affiliateCode: affiliate.code }
      });
      logger.info('Deleted referrals', { count: referrals.count });
      
      // Finally delete the affiliate record
      const deletedAffiliate = await tx.affiliate.delete({
        where: { id: id }
      });
      logger.info('Deleted affiliate record', { affiliateId: deletedAffiliate.id });
    });

    // Delete the user from Clerk as well (optional - don't fail if this doesn't work)
    try {
      await deleteUser(affiliate.userId);
      logger.info('Affiliate user deleted from Clerk', { 
        affiliateId: id, 
        userId: affiliate.userId,
        affiliateCode: affiliate.code
      });
    } catch (clerkError) {
      logger.warn('Failed to delete affiliate user from Clerk - continuing with database cleanup', { 
        affiliateId: id, 
        userId: affiliate.userId,
        error: clerkError instanceof Error ? clerkError.message : 'Unknown error'
      });
      // Continue even if Clerk deletion fails - the database cleanup is more important
    }

    logger.info('Affiliate deleted permanently', { 
      affiliateId: id,
      affiliateCode: affiliate.code,
      userId: affiliate.userId
    });

    return NextResponse.json({ 
      success: true,
      message: 'Affiliate deleted permanently'
    });
    
  } catch (error) {
    logger.error('Failed to delete affiliate', { 
      affiliateId: id, 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return NextResponse.json(
      { error: 'Failed to delete affiliate' },
      { status: 500 }
    );
  }
}

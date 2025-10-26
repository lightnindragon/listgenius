import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/affiliate';
import { logger } from '@/lib/logger';
import { clerkClient } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    if (!isAdminAuthenticated(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const affiliates = await prisma.affiliate.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            referrals: true,
            payouts: true,
          },
        },
      },
    });

    // Fetch user details from Clerk for each affiliate
    const affiliatesWithUserDetails = await Promise.all(
      affiliates.map(async (affiliate) => {
        try {
          const user = await (await clerkClient()).users.getUser(affiliate.userId);
          return {
            ...affiliate,
            // Use application data if available, fallback to Clerk data
            userName: affiliate.firstName && affiliate.lastName
              ? `${affiliate.firstName} ${affiliate.lastName}`
              : user.firstName && user.lastName 
              ? `${user.firstName} ${user.lastName}` 
              : user.username || user.emailAddresses[0]?.emailAddress || 'Unknown',
            userEmail: affiliate.userEmail || user.emailAddresses[0]?.emailAddress || null,
            clerkUser: {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              username: user.username,
              emailAddresses: user.emailAddresses,
              createdAt: user.createdAt,
              lastSignInAt: user.lastSignInAt,
            }
          };
        } catch (error) {
          logger.warn('Failed to fetch user details for affiliate', { 
            affiliateId: affiliate.id, 
            userId: affiliate.userId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          return {
            ...affiliate,
            userName: 'Unknown User',
            userEmail: null,
            clerkUser: null
          };
        }
      })
    );

    logger.info('Admin fetched all affiliates with user details', { 
      count: affiliatesWithUserDetails.length
    });

    return NextResponse.json({ affiliates: affiliatesWithUserDetails });
    
  } catch (error) {
    logger.error('Failed to fetch affiliates', { error });
    
    return NextResponse.json(
      { error: 'Failed to fetch affiliates' },
      { status: 500 }
    );
  }
}

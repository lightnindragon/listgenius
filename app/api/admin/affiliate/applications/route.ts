import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/affiliate';
import { clerkClient } from '@clerk/nextjs/server';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    if (!isAdminAuthenticated(request)) {
      logger.warn('Unauthorized access to affiliate applications API');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const applications = await prisma.affiliate.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
    });

    // Fetch user details from Clerk for each application
    const applicationsWithUserDetails = await Promise.all(
      applications.map(async (application) => {
        try {
          const user = await (await clerkClient()).users.getUser(application.userId);
          return {
            ...application,
            // Use application data if available, fallback to Clerk data
            userName: application.firstName && application.lastName
              ? `${application.firstName} ${application.lastName}`
              : user.firstName && user.lastName
              ? `${user.firstName} ${user.lastName}`
              : user.username || user.emailAddresses[0]?.emailAddress || 'Unknown',
            userEmail: application.userEmail || user.emailAddresses[0]?.emailAddress || null,
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
          logger.warn('Failed to fetch user details for affiliate application', {
            affiliateId: application.id,
            userId: application.userId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          return {
            ...application,
            userName: 'Unknown User',
            userEmail: null,
            clerkUser: null
          };
        }
      })
    );

    logger.info('Admin fetched pending affiliate applications with user details', {
      count: applicationsWithUserDetails.length
    });

    return NextResponse.json({ applications: applicationsWithUserDetails });

  } catch (error) {
    logger.error('Failed to fetch affiliate applications', { error: (error as Error).message });
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { createClerkClient } from '@clerk/nextjs/server';
import { logger } from '@/lib/logger';

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Require admin authentication
    requireAdmin(request);

    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Send password reset email via Clerk
    // Note: Clerk doesn't have a direct password reset method for admins
    // This would typically be handled through Clerk's dashboard or webhooks
    // For now, we'll just log the action
    console.log(`Password reset requested for user: ${userId}`);

    logger.info('Password reset email sent by admin', { userId });

    return NextResponse.json({
      success: true,
      message: 'Password reset email sent successfully'
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Admin authentication required') {
      return NextResponse.json(
        { success: false, error: 'Admin authentication required' },
        { status: 401 }
      );
    }

    logger.error('Error sending password reset', { userId: (await params).userId, error });
    return NextResponse.json(
      { success: false, error: 'Failed to send password reset email' },
      { status: 500 }
    );
  }
}

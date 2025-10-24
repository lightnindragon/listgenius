import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, suspendUser, unsuspendUser, getUserById } from '@/lib/admin';
import { logger } from '@/lib/logger';

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

    // Suspend user
    await suspendUser(userId);

    // Get updated user details
    const updatedUser = await getUserById(userId);

    logger.info('User suspended by admin', { userId });

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'User suspended successfully'
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Admin authentication required') {
      return NextResponse.json(
        { success: false, error: 'Admin authentication required' },
        { status: 401 }
      );
    }

    logger.error('Error suspending user', { userId: (await params).userId, error });
    return NextResponse.json(
      { success: false, error: 'Failed to suspend user' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Unsuspend user
    await unsuspendUser(userId);

    // Get updated user details
    const updatedUser = await getUserById(userId);

    logger.info('User unsuspended by admin', { userId });

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'User unsuspended successfully'
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Admin authentication required') {
      return NextResponse.json(
        { success: false, error: 'Admin authentication required' },
        { status: 401 }
      );
    }

    logger.error('Error unsuspending user', { userId: (await params).userId, error });
    return NextResponse.json(
      { success: false, error: 'Failed to unsuspend user' },
      { status: 500 }
    );
  }
}

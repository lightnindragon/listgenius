import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, getUserById, updateUserPlanAdmin, suspendUser, unsuspendUser } from '@/lib/admin';
import { logger } from '@/lib/logger';

export async function GET(
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

    // Get user details
    const user = await getUserById(userId);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Admin authentication required') {
      return NextResponse.json(
        { success: false, error: 'Admin authentication required' },
        { status: 401 }
      );
    }

    logger.error('Error getting user details', { userId: (await params).userId, error });
    return NextResponse.json(
      { success: false, error: 'Failed to get user details' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Require admin authentication
    requireAdmin(request);

    const { userId } = await params;
    const body = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Update user based on request body
    if (body.plan) {
      await updateUserPlanAdmin(userId, body.plan);
    }

    if (body.status === 'suspended') {
      await suspendUser(userId);
    } else if (body.status === 'active') {
      await unsuspendUser(userId);
    }

    // Get updated user details
    const updatedUser = await getUserById(userId);

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully'
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Admin authentication required') {
      return NextResponse.json(
        { success: false, error: 'Admin authentication required' },
        { status: 401 }
      );
    }

    logger.error('Error updating user', { userId: (await params).userId, error });
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
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

    // Suspend user instead of deleting (safer approach)
    await suspendUser(userId);

    logger.info('User suspended by admin', { userId });

    return NextResponse.json({
      success: true,
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

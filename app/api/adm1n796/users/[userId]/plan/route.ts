import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, updateUserPlan, getUserById } from '@/lib/admin';
import { trackPlanChange } from '@/lib/analytics';
import { logger } from '@/lib/logger';

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

    const { plan, skipStripe } = body;

    if (!plan || !['free', 'pro', 'business', 'agency'].includes(plan)) {
      return NextResponse.json(
        { success: false, error: 'Valid plan is required' },
        { status: 400 }
      );
    }

    // Get current user to track plan change
    const currentUser = await getUserById(userId);
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user plan
    await updateUserPlan(userId, plan);

    // Track plan change
    await trackPlanChange(userId, currentUser.plan, plan, 'admin');

    // Get updated user details
    const updatedUser = await getUserById(userId);

    logger.info('User plan changed by admin', { 
      userId, 
      oldPlan: currentUser.plan, 
      newPlan: plan,
      skipStripe 
    });

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: `User plan changed to ${plan}`
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Admin authentication required') {
      return NextResponse.json(
        { success: false, error: 'Admin authentication required' },
        { status: 401 }
      );
    }

    logger.error('Error changing user plan', { userId: (await params).userId, error });
    return NextResponse.json(
      { success: false, error: 'Failed to change user plan' },
      { status: 500 }
    );
  }
}

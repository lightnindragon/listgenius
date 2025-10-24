import { NextRequest, NextResponse } from 'next/server';
import { auth, createClerkClient } from '@clerk/nextjs/server';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

const updatePlanSchema = z.object({
  plan: z.enum(['free', 'pro', 'business']),
});

export async function GET() {
  return NextResponse.json({ message: 'Plan update API is working' });
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      logger.error('No user ID found in auth');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.info('Plan update request received', { userId });

    const body = await request.json();
    logger.info('Request body', { body });

    const validation = updatePlanSchema.safeParse(body);

    if (!validation.success) {
      logger.error('Validation failed', { errors: validation.error.issues });
      return NextResponse.json(
        { error: 'Invalid plan', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { plan } = validation.data;
    logger.info('Plan validation successful', { plan });

    // Get current user metadata
    const user = await clerkClient.users.getUser(userId);
    const currentMetadata = user.publicMetadata as any || {};

    // Update the plan in metadata
    const updatedMetadata = {
      ...currentMetadata,
      plan: plan
    };

    // Update user metadata
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: updatedMetadata
    });

    logger.info('User plan updated', { 
      userId, 
      oldPlan: currentMetadata.plan,
      newPlan: plan 
    });

    return NextResponse.json({ 
      success: true, 
      message: `Plan updated to ${plan}`,
      plan: plan
    });

  } catch (error) {
    logger.error('Failed to update user plan', { 
      error: (error as Error).message,
      stack: (error as Error).stack,
      name: (error as Error).name
    });
    return NextResponse.json(
      { error: 'Failed to update plan', details: (error as Error).message },
      { status: 500 }
    );
  }
}

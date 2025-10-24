import { auth, createClerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getUserPlanSimple } from '@/lib/entitlements';

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await clerkClient.users.getUser(userId);
    const plan = await getUserPlanSimple(user);
    
    return NextResponse.json({ success: true, plan });
  } catch (error) {
    console.error('Error getting user plan:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get user plan' },
      { status: 500 }
    );
  }
}

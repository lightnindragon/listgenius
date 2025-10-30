import { NextRequest, NextResponse } from 'next/server';
import { createClerkClient } from '@clerk/nextjs/server';
import { requireAdmin } from '@/lib/admin';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    // Ensure requester is authenticated admin (custom admin system)
    requireAdmin(request);

    const { userId } = params;
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Missing userId' }, { status: 400 });
    }

    if (!process.env.CLERK_SECRET_KEY) {
      return NextResponse.json({ success: false, error: 'Clerk not configured' }, { status: 500 });
    }

    const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

    // Create a one-time sign-in token for the target user
    // Clerk SDKs may expose either create or createSignInToken; support both.
    let token: string | undefined;
    // @ts-ignore - try both shapes defensively
    if (clerkClient.signInTokens?.createSignInToken) {
      // @ts-ignore
      const res = await clerkClient.signInTokens.createSignInToken({ userId });
      token = res?.token;
    } else {
      // @ts-ignore
      const res = await clerkClient.signInTokens.create({ userId });
      token = res?.token;
    }

    if (!token) {
      logger.error('Failed to create sign-in token for impersonation', { userId });
      return NextResponse.json({ success: false, error: 'Failed to create sign-in token' }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    // Use hash-based format and include both possible params for compatibility
    const redirectUrl = `${appUrl}/sign-in#/?token=${encodeURIComponent(token)}&__clerk_ticket=${encodeURIComponent(token)}`;

    logger.info('Impersonation token created', { userId });
    return NextResponse.json({ success: true, url: redirectUrl });
  } catch (error: any) {
    logger.error('Impersonation request failed', { error: error?.message });
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
}



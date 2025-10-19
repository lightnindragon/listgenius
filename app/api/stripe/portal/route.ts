import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { stripe } from '@/lib/stripe';
import { getCurrentUser } from '@/lib/clerk';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user details
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const email = user.emailAddresses[0]?.emailAddress;
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'User email not found' },
        { status: 400 }
      );
    }

    // Find existing Stripe customer
    const customers = await stripe.customers.list({
      email: email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      // No customer exists yet - this is likely a free user who hasn't subscribed
      return NextResponse.json(
        { success: false, error: 'No billing account found. Please upgrade to a paid plan first.' },
        { status: 400 }
      );
    }

    const customer = customers.data[0];

    // Create portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/billing`,
    });

    logger.info('Stripe customer portal session created', {
      userId,
      customerId: customer.id,
      sessionId: portalSession.id,
    });

    return NextResponse.json({
      success: true,
      url: portalSession.url,
    });

  } catch (error: any) {
    logger.error('Failed to create Stripe customer portal session', {
      error: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      { success: false, error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}

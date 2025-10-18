import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { stripe } from '@/lib/stripe';
import { getUserWithMetadata } from '@/lib/clerk';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const checkoutSchema = z.object({
  plan: z.enum(['pro', 'business', 'agency']),
  successUrl: z.string().optional(),
  cancelUrl: z.string().optional(),
});

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
    const user = await getUserWithMetadata();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = checkoutSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { plan, successUrl, cancelUrl } = validation.data;

    // Get price ID for the plan
    const priceIdMapping: { [key: string]: string } = {
      pro: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO || '',
      business: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_BUSINESS || '',
      agency: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_AGENCY || '',
    };

    const priceId = priceIdMapping[plan];
    if (!priceId) {
      return NextResponse.json(
        { success: false, error: `Price ID not configured for ${plan} plan` },
        { status: 400 }
      );
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: user.emailAddresses[0]?.emailAddress,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/settings?subscription=success`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/pricing?subscription=cancelled`,
      metadata: {
        userId: userId,
        plan: plan,
      },
      subscription_data: {
        metadata: {
          userId: userId,
          plan: plan,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      tax_id_collection: {
        enabled: true,
      },
    });

    logger.info('Stripe checkout session created', {
      userId,
      plan,
      sessionId: session.id,
      priceId,
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });

  } catch (error: any) {
    logger.error('Failed to create Stripe checkout session', {
      userId: auth().userId,
      error: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      { success: false, error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

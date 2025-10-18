import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { stripe } from '@/lib/stripe';
import { getCurrentUser } from '@/lib/clerk';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const checkoutSchema = z.object({
  plan: z.enum(['pro', 'business', 'agency']),
  successUrl: z.string().optional(),
  cancelUrl: z.string().optional(),
});

export async function POST(request: NextRequest) {
  console.log('=== STRIPE CHECKOUT API CALLED ===');
  console.log('Environment variables check:');
  console.log('STRIPE_SECRET_KEY exists:', !!process.env.STRIPE_SECRET_KEY);
  console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);
  
  try {
    const { userId } = auth();
    console.log('User ID from auth:', userId);
    
    if (!userId) {
      console.log('No user ID found, returning 401');
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

    // Get price ID for the plan (using test price IDs for development)
    const priceIdMapping: { [key: string]: string } = {
      pro: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO || 'price_1OjXyZ2eZvKYlo2C123456789', // Test price ID
      business: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_BUSINESS || 'price_1OjXyZ2eZvKYlo2C987654321', // Test price ID
      agency: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_AGENCY || 'price_1OjXyZ2eZvKYlo2C111222333', // Test price ID
    };

    const priceId = priceIdMapping[plan];
    
    // Log the request details for debugging
    logger.info('Creating Stripe checkout session', {
      userId,
      plan,
      priceId,
      userEmail: user.emailAddresses[0]?.emailAddress,
      hasStripeKey: !!process.env.STRIPE_SECRET_KEY
    });

    // For development, we'll create a mock response if Stripe is not configured
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_your_stripe_key_here') {
      return NextResponse.json({
        success: true,
        sessionId: 'mock_session_' + Date.now(),
        url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?subscription=success&plan=${plan}`,
        mock: true
      });
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
      errorType: error.type,
      errorCode: error.code,
      stack: error.stack,
    });

    // Return more specific error message
    const errorMessage = error.type === 'StripeInvalidRequestError' 
      ? `Invalid Stripe request: ${error.message}`
      : error.message || 'Failed to create checkout session';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

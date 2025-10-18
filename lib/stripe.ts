import Stripe from 'stripe';
import { logger } from './logger';
import { StripeError } from './errors';

// Initialize Stripe client
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

/**
 * Create Stripe Checkout Session
 */
export async function createCheckoutSession({
  userId,
  plan,
  successUrl,
  cancelUrl
}: {
  userId: string;
  plan: 'pro' | 'business' | 'agency';
  successUrl: string;
  cancelUrl: string;
}): Promise<Stripe.Checkout.Session> {
  try {
    const priceId = getPriceIdForPlan(plan);
    
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: userId,
      metadata: {
        plan,
        userId
      },
      subscription_data: {
        metadata: {
          plan,
          userId
        }
      }
    });

    logger.info('Stripe checkout session created', {
      sessionId: session.id,
      userId,
      plan
    });

    return session;
  } catch (error) {
    logger.error('Failed to create Stripe checkout session', { 
      error: (error as Error).message, 
      userId, 
      plan 
    });
    throw new StripeError(`Failed to create checkout session: ${(error as Error).message}`);
  }
}

/**
 * Get Stripe Customer Portal URL
 */
export async function createCustomerPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    logger.info('Stripe customer portal session created', {
      customerId,
      sessionId: session.id
    });

    return session;
  } catch (error) {
    logger.error('Failed to create customer portal session', { 
      error: (error as Error).message, 
      customerId 
    });
    throw new StripeError(`Failed to create portal session: ${(error as Error).message}`);
  }
}

/**
 * Get or create Stripe customer
 */
export async function getOrCreateCustomer(
  userId: string,
  email: string,
  name?: string
): Promise<Stripe.Customer> {
  try {
    // Try to find existing customer by metadata
    const existingCustomers = await stripe.customers.list({
      limit: 1,
      metadata: { userId }
    });

    if (existingCustomers.data.length > 0) {
      return existingCustomers.data[0];
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        userId
      }
    });

    logger.info('Stripe customer created', {
      customerId: customer.id,
      userId,
      email
    });

    return customer;
  } catch (error) {
    logger.error('Failed to get or create Stripe customer', { 
      error: (error as Error).message, 
      userId, 
      email 
    });
    throw new StripeError(`Failed to manage customer: ${(error as Error).message}`);
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  try {
    const subscription = await stripe.subscriptions.cancel(subscriptionId);

    logger.info('Stripe subscription cancelled', {
      subscriptionId
    });

    return subscription;
  } catch (error) {
    logger.error('Failed to cancel Stripe subscription', { 
      error: (error as Error).message, 
      subscriptionId 
    });
    throw new StripeError(`Failed to cancel subscription: ${(error as Error).message}`);
  }
}

/**
 * Get subscription details
 */
export async function getSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription;
  } catch (error) {
    if ((error as any).statusCode === 404) {
      return null;
    }
    logger.error('Failed to get Stripe subscription', { 
      error: (error as Error).message, 
      subscriptionId 
    });
    throw new StripeError(`Failed to get subscription: ${(error as Error).message}`);
  }
}

/**
 * Get price ID for plan
 */
function getPriceIdForPlan(plan: 'pro' | 'business' | 'agency'): string {
  const priceIds = {
    pro: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO,
    business: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_BUSINESS,
    agency: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_AGENCY,
  };

  const priceId = priceIds[plan];
  if (!priceId) {
    throw new StripeError(`Price ID not found for plan: ${plan}`);
  }

  return priceId;
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  try {
    return stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    logger.error('Failed to verify Stripe webhook signature', { 
      error: (error as Error).message 
    });
    throw new StripeError(`Webhook signature verification failed: ${(error as Error).message}`);
  }
}

/**
 * Extract plan from subscription
 */
export function extractPlanFromSubscription(subscription: Stripe.Subscription): 'pro' | 'business' | 'agency' | null {
  const metadata = subscription.metadata;
  const plan = metadata?.plan as 'pro' | 'business' | 'agency';
  
  if (!plan || !['pro', 'business', 'agency'].includes(plan)) {
    logger.warn('Invalid plan in subscription metadata', { 
      subscriptionId: subscription.id, 
      metadata 
    });
    return null;
  }

  return plan;
}

/**
 * Format price for display
 */
export function formatPrice(amount: number, currency = 'gbp'): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

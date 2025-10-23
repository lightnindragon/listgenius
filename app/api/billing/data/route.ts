import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/clerk';
import { stripe } from '@/lib/stripe';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;
    const email = user.emailAddresses[0]?.emailAddress;

    if (!email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 });
    }

    logger.info('Fetching billing data for user', { userId, email });

    // Find Stripe customer by email
    const customers = await stripe.customers.list({
      email: email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      // No customer exists - return empty billing data
      return NextResponse.json({
        subscription: null,
        upcomingInvoice: null,
        paymentMethod: null,
        invoices: []
      });
    }

    const customer = customers.data[0];

    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'all',
      limit: 1,
    });

    let subscription = null;
    let upcomingInvoice = null;
    let paymentMethod = null;

    if (subscriptions.data.length > 0) {
      subscription = subscriptions.data[0];

      // Get upcoming invoice
      try {
        // TODO: Fix Stripe API method for upcoming invoices
        // const upcoming = await stripe.invoices.retrieveUpcoming({
        //   customer: customer.id,
        // });
        // upcomingInvoice = {
        //   amount_due: upcoming.amount_due,
        //   currency: upcoming.currency,
        //   due_date: upcoming.period_end,
        // };
        upcomingInvoice = {
          amount_due: 0,
          currency: 'usd',
          due_date: null,
        };
      } catch (error) {
        // No upcoming invoice (e.g., canceled subscription)
        logger.info('No upcoming invoice found', { customerId: customer.id });
      }

      // Get default payment method
      if (subscription.default_payment_method) {
        const pm = await stripe.paymentMethods.retrieve(
          subscription.default_payment_method as string
        );
        paymentMethod = {
          id: pm.id,
          type: pm.type,
          card: pm.card ? {
            brand: pm.card.brand,
            last4: pm.card.last4,
            exp_month: pm.card.exp_month,
            exp_year: pm.card.exp_year,
          } : null,
        };
      }
    }

    // Get recent invoices (last 10)
    const invoices = await stripe.invoices.list({
      customer: customer.id,
      limit: 10,
    });

    const formattedInvoices = invoices.data.map(invoice => ({
      id: invoice.id,
      amount_paid: invoice.amount_paid,
      currency: invoice.currency,
      status: invoice.status,
      created: invoice.created,
      invoice_pdf: invoice.invoice_pdf,
      hosted_invoice_url: invoice.hosted_invoice_url,
    }));

    const billingData = {
      subscription: subscription ? {
        id: subscription.id,
        status: subscription.status,
        // TODO: Fix Stripe API properties
        current_period_end: null, // subscription.current_period_end,
        current_period_start: null, // subscription.current_period_start,
        plan: {
          id: subscription.items.data[0]?.price?.id || 'unknown',
          name: subscription.items.data[0]?.price?.nickname || 'Unknown Plan',
          amount: subscription.items.data[0]?.price?.unit_amount || 0,
          currency: subscription.items.data[0]?.price?.currency || 'usd',
          interval: subscription.items.data[0]?.price?.recurring?.interval || 'month',
        },
        cancel_at_period_end: null, // subscription.cancel_at_period_end,
        canceled_at: null, // subscription.canceled_at,
      } : null,
      upcomingInvoice,
      paymentMethod,
      invoices: formattedInvoices,
    };

    logger.info('Billing data retrieved successfully', { 
      userId, 
      hasSubscription: !!subscription,
      hasPaymentMethod: !!paymentMethod,
      invoiceCount: formattedInvoices.length
    });

    return NextResponse.json(billingData);

  } catch (error) {
    logger.error('Failed to fetch billing data', { error });
    return NextResponse.json(
      { error: 'Failed to fetch billing data' },
      { status: 500 }
    );
  }
}

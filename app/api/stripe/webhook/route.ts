import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { logger } from "@/lib/logger";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export async function POST(req: Request) {
  const body = await req.text();
  const sig = headers().get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    logger.error("Webhook signature verification failed", { error: err.message });
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  logger.info("Stripe webhook received", { eventType: event.type, eventId: event.id });

  // Handle subscription events
  switch (event.type) {
    case "invoice.payment_succeeded":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const email =
        subscription.customer_email ||
        (subscription.customer as string)?.toLowerCase();

      if (email) {
        try {
          const users = await clerkClient.users.getUserList({ emailAddress: [email] });
          if (users.data.length > 0) {
            const userId = users.data[0].id;
            const priceNickname = subscription.items.data[0].price.nickname;
            
            // Map Stripe price nicknames to our plan names
            const planMapping: { [key: string]: string } = {
              'pro': 'pro',
              'business': 'business', 
              'agency': 'agency',
            };
            
            const plan = planMapping[priceNickname || ''] || 'pro';
            
            await clerkClient.users.updateUserMetadata(userId, {
              publicMetadata: { plan },
            });
            
            logger.info("Updated user plan", { 
              email, 
              userId, 
              plan, 
              priceNickname,
              subscriptionId: subscription.id 
            });
          }
        } catch (err) {
          logger.error("Failed to update user plan", { email, error: err });
        }
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const email =
        subscription.customer_email ||
        (subscription.customer as string)?.toLowerCase();

      if (email) {
        try {
          const users = await clerkClient.users.getUserList({ emailAddress: [email] });
          if (users.data.length > 0) {
            const userId = users.data[0].id;
            
            // Downgrade to free plan on cancellation
            await clerkClient.users.updateUserMetadata(userId, {
              publicMetadata: { plan: 'free' },
            });
            
            logger.info("Downgraded user to free plan", { 
              email, 
              userId, 
              subscriptionId: subscription.id 
            });
          }
        } catch (err) {
          logger.error("Failed to downgrade user plan", { email, error: err });
        }
      }
      
      logger.info("Subscription cancelled", { eventId: event.id });
      break;
    }

    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const email = session.customer_email || session.customer_details?.email;
      
      if (email) {
        try {
          const users = await clerkClient.users.getUserList({ emailAddress: [email] });
          if (users.data.length > 0) {
            const userId = users.data[0].id;
            
            // Get the price ID from the session
            const priceId = session.line_items?.data[0]?.price?.id;
            
            // Map price IDs to plan names (you'll need to update these with your actual price IDs)
            const priceIdMapping: { [key: string]: string } = {
              [process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO || '']: 'pro',
              [process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_BUSINESS || '']: 'business',
              [process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_AGENCY || '']: 'agency',
            };
            
            const plan = priceIdMapping[priceId || ''] || 'pro';
            
            await clerkClient.users.updateUserMetadata(userId, {
              publicMetadata: { plan },
            });
            
            logger.info("Updated user plan from checkout", { 
              email, 
              userId, 
              plan, 
              priceId,
              sessionId: session.id 
            });
          }
        } catch (err) {
          logger.error("Failed to update user plan from checkout", { email, error: err });
        }
      }
      break;
    }

    default:
      logger.info("Unhandled webhook event type", { eventType: event.type });
  }

  return new NextResponse("Success", { status: 200 });
}

import { createClerkClient, auth } from '@clerk/nextjs/server';

// Initialize Clerk client with error handling
let clerkClient: any;
try {
  if (!process.env.CLERK_SECRET_KEY) {
    throw new Error('CLERK_SECRET_KEY not found in environment variables');
  }
  clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
  console.log('Clerk client initialized successfully');
} catch (error) {
  console.error('Failed to initialize Clerk client:', error);
  throw error;
}
import { getUserPlanSimple, PLAN_CONFIG, getMonthKey } from './entitlements';

export async function checkAndIncrementGeneration(userId?: string): Promise<{ 
  ok: boolean; 
  plan: 'free'|'pro'|'business'; 
  remaining?: number;
  error?: string;
}> {
  if (!userId) {
    const { userId: authUserId } = await auth();
    if (!authUserId) return { ok: false, plan: 'free', error: 'Unauthorized' };
    userId = authUserId;
  }

  try {
    const user = await clerkClient.users.getUser(userId);
    const plan = await getUserPlanSimple(user);
    
    const monthKey = getMonthKey();
    const meta = (user.publicMetadata ?? {}) as any;
    const usage = (meta.genUsage ?? {}) as Record<string, number>;
    const used = usage[monthKey] ?? 0;

  if (plan === 'pro' || plan === 'business') {
    // Soft safety cap at 1000
    if (used >= 1000) {
      return { ok: false, plan, remaining: 0, error: 'Monthly safety limit reached (1000). Contact support.' };
    }
    usage[monthKey] = used + 1;
    await clerkClient.users.updateUserMetadata(userId, { 
      publicMetadata: { 
        ...meta, 
        genUsage: usage,
        lifetimeGenerations: (meta.lifetimeGenerations || 0) + 1
      } 
    });
    return { ok: true, plan };
  }

    // Free plan: 6/month
    const cap = PLAN_CONFIG.free.maxGenerationsPerMonth as number;
    if (used >= cap) {
      return { ok: false, plan, remaining: 0, error: 'Free plan limit reached (6/month). Upgrade to Pro for 50 generations per day.' };
    }

    usage[monthKey] = used + 1;
    await clerkClient.users.updateUserMetadata(userId, { 
      publicMetadata: { 
        ...meta, 
        genUsage: usage,
        lifetimeGenerations: (meta.lifetimeGenerations || 0) + 1
      } 
    });
    return { ok: true, plan, remaining: cap - (used + 1) };
  } catch (error) {
    console.error('Error in checkAndIncrementGeneration:', error);
    return { ok: false, plan: 'free', error: 'Failed to check generation quota' };
  }
}

export async function getCurrentMonthUsage(userId: string): Promise<{ used: number; limit: number | 'unlimited'; plan: 'free'|'pro'|'business' }> {
  const user = await clerkClient.users.getUser(userId);
  const plan = await getUserPlanSimple(user);
  const monthKey = getMonthKey();
  const meta = (user.publicMetadata ?? {}) as any;
  const usage = (meta.genUsage ?? {}) as Record<string, number>;
  const used = usage[monthKey] ?? 0;

  return {
    used,
    limit: (plan === 'pro' || plan === 'business') ? 'unlimited' : PLAN_CONFIG.free.maxGenerationsPerMonth,
    plan
  };
}

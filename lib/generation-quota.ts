import { createClerkClient, auth } from '@clerk/nextjs/server';

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });
import { getUserPlanSimple, PLAN_CONFIG, getMonthKey } from './entitlements';

export async function checkAndIncrementGeneration(): Promise<{ 
  ok: boolean; 
  plan: 'free'|'pro'; 
  remaining?: number;
  error?: string;
}> {
  const { userId } = await auth();
  if (!userId) return { ok: false, plan: 'free', error: 'Unauthorized' };

  const user = await clerkClient.users.getUser(userId);
  const plan = await getUserPlanSimple(user);
  
  const monthKey = getMonthKey();
  const meta = (user.publicMetadata ?? {}) as any;
  const usage = (meta.genUsage ?? {}) as Record<string, number>;
  const used = usage[monthKey] ?? 0;

  if (plan === 'pro') {
    // Soft safety cap at 1000
    if (used >= 1000) {
      return { ok: false, plan, remaining: 0, error: 'Monthly safety limit reached (1000). Contact support.' };
    }
    usage[monthKey] = used + 1;
    await clerkClient.users.updateUserMetadata(userId, { 
      publicMetadata: { ...meta, genUsage: usage } 
    });
    return { ok: true, plan };
  }

  // Free plan: 3/month
  const cap = PLAN_CONFIG.free.maxGenerationsPerMonth as number;
  if (used >= cap) {
    return { ok: false, plan, remaining: 0, error: 'Free plan limit reached (3/month). Upgrade to Pro for unlimited generations.' };
  }

  usage[monthKey] = used + 1;
  await clerkClient.users.updateUserMetadata(userId, { 
    publicMetadata: { ...meta, genUsage: usage } 
  });
  return { ok: true, plan, remaining: cap - (used + 1) };
}

export async function getCurrentMonthUsage(userId: string): Promise<{ used: number; limit: number | 'unlimited'; plan: 'free'|'pro' }> {
  const user = await clerkClient.users.getUser(userId);
  const plan = await getUserPlanSimple(user);
  const monthKey = getMonthKey();
  const meta = (user.publicMetadata ?? {}) as any;
  const usage = (meta.genUsage ?? {}) as Record<string, number>;
  const used = usage[monthKey] ?? 0;

  return {
    used,
    limit: plan === 'pro' ? 'unlimited' : PLAN_CONFIG.free.maxGenerationsPerMonth,
    plan
  };
}

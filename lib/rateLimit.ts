import { getUserPlan, getDailyGenCount, getDailyRewriteCount, incrementDailyGenCount, incrementDailyRewriteCount } from './clerk';
import { RateLimitError } from './errors';
import { logger } from './logger';

/**
 * Rate limiting with Clerk metadata tracking and in-memory Map fallback
 */

// In-memory fallback for development
const memoryStore = new Map<string, { genCount: number; rewriteCount: number; lastReset: string }>();

/**
 * Check if user can generate (not rate limited)
 */
export async function canGenerate(userId: string): Promise<boolean> {
  try {
    const plan = await getUserPlan(userId);
    const dailyCount = await getDailyGenCount(userId);
    
    // Check limits based on plan
    if (plan === 'free') {
      // Free plan: 6 generations per month (we'll use monthly tracking)
      return true; // Monthly limit is handled in generation-quota.ts
    } else if (plan === 'pro') {
      // Pro plan: 50 generations per day
      return dailyCount < 50;
    } else if (plan === 'business') {
      // Business plan: 200 generations per day
      return dailyCount < 200;
    } else {
      // Agency plan: unlimited
      return true;
    }
  } catch (error) {
    logger.error('Failed to check generation rate limit', { userId, error });
    
    // Fallback to in-memory store
    return checkMemoryRateLimit(userId, 'generate');
  }
}

/**
 * Check if user can rewrite (not rate limited)
 */
export async function canRewrite(userId: string): Promise<boolean> {
  try {
    const plan = await getUserPlan(userId);
    
    // Paid plans have unlimited rewrites
    if (plan === 'pro' || plan === 'business') {
      return true;
    }
    
    // Free plan: check daily limit
    const dailyCount = await getDailyRewriteCount(userId);
    return dailyCount < 1;
  } catch (error) {
    logger.error('Failed to check rewrite rate limit', { userId, error });
    
    // Fallback to in-memory store
    return checkMemoryRateLimit(userId, 'rewrite');
  }
}

/**
 * Increment generation count and check limit
 */
export async function incrementGenerationCount(userId: string): Promise<void> {
  try {
    const plan = await getUserPlan(userId);
    
    // Paid plans: no limits, just track
    if (plan === 'pro' || plan === 'business' || plan === 'agency') {
      await incrementDailyGenCount(userId);
      return;
    }
    
      // Free plan: check limit first
      const canGenerateNow = await canGenerate(userId);
      if (!canGenerateNow) {
        throw new RateLimitError('Daily generation limit exceeded (6/day for free plan)');
      }
    
    await incrementDailyGenCount(userId);
    logger.info('Generation count incremented', { userId, plan });
  } catch (error) {
    if (error instanceof RateLimitError) {
      throw error;
    }
    
    logger.error('Failed to increment generation count', { userId, error });
    
    // Fallback to in-memory store
    incrementMemoryRateLimit(userId, 'generate');
  }
}

/**
 * Increment rewrite count and check limit
 */
export async function incrementRewriteCount(userId: string): Promise<void> {
  try {
    const plan = await getUserPlan(userId);
    
    // Paid plans: no limits, just track
    if (plan === 'pro' || plan === 'business' || plan === 'agency') {
      await incrementDailyRewriteCount(userId);
      return;
    }
    
    // Free plan: check limit first
    const canRewriteNow = await canRewrite(userId);
    if (!canRewriteNow) {
      throw new RateLimitError('Daily rewrite limit exceeded (1/day for free plan)');
    }
    
    await incrementDailyRewriteCount(userId);
    logger.info('Rewrite count incremented', { userId, plan });
  } catch (error) {
    if (error instanceof RateLimitError) {
      throw error;
    }
    
    logger.error('Failed to increment rewrite count', { userId, error });
    
    // Fallback to in-memory store
    incrementMemoryRateLimit(userId, 'rewrite');
  }
}

/**
 * Get current usage for display
 */
export async function getCurrentUsage(userId: string): Promise<{ generations: number; rewrites: number; plan: string }> {
  try {
    const plan = await getUserPlan(userId);
    const genCount = await getDailyGenCount(userId);
    const rewriteCount = await getDailyRewriteCount(userId);
    
    return {
      generations: genCount,
      rewrites: rewriteCount,
      plan
    };
  } catch (error) {
    logger.error('Failed to get current usage', { userId, error });
    
    // Fallback to in-memory store
    const memoryData = memoryStore.get(userId);
    return {
      generations: memoryData?.genCount || 0,
      rewrites: memoryData?.rewriteCount || 0,
      plan: 'free'
    };
  }
}

/**
 * In-memory fallback functions
 */
function checkMemoryRateLimit(userId: string, type: 'generate' | 'rewrite'): boolean {
  const today = new Date().toISOString().split('T')[0];
  const data = memoryStore.get(userId);
  
  // Reset if new day
  if (!data || data.lastReset !== today) {
    memoryStore.set(userId, { genCount: 0, rewriteCount: 0, lastReset: today });
    return true;
  }
  
  if (type === 'generate') {
    // Default to free plan limit (6 per month, but we'll use daily for fallback)
    return data.genCount < 6;
  } else {
    return data.rewriteCount < 1;
  }
}

function incrementMemoryRateLimit(userId: string, type: 'generate' | 'rewrite'): void {
  const today = new Date().toISOString().split('T')[0];
  const data = memoryStore.get(userId) || { genCount: 0, rewriteCount: 0, lastReset: today };
  
  // Reset if new day
  if (data.lastReset !== today) {
    data.genCount = 0;
    data.rewriteCount = 0;
    data.lastReset = today;
  }
  
  if (type === 'generate') {
    data.genCount++;
  } else {
    data.rewriteCount++;
  }
  
  memoryStore.set(userId, data);
}

/**
 * Check Stripe checkout rate limit (5 sessions per 15 minutes)
 */
export async function checkStripeCheckoutLimit(userId: string): Promise<boolean> {
  // For now, we'll use a simple in-memory store
  // In production, this should be stored in Clerk metadata or Redis
  const key = `stripe_checkout_${userId}`;
  const now = Date.now();
  const fifteenMinutes = 15 * 60 * 1000;
  
  const data = memoryStore.get(key) || { count: 0, firstRequest: now };
  
  // Reset if more than 15 minutes have passed
  if ('firstRequest' in data && now - data.firstRequest > fifteenMinutes) {
    memoryStore.set(key, { count: 1, firstRequest: now } as any);
    return true;
  }
  
  // Check if under limit
  if ('count' in data && data.count < 5) {
    data.count++;
    memoryStore.set(key, data as any);
    return true;
  }
  
  return false;
}

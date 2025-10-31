import { auth, currentUser } from '@clerk/nextjs/server';
import { createClerkClient } from '@clerk/nextjs/server';
import { UserMetadata } from '@/types';
import { logger } from './logger';

// Initialize Clerk client
const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

/**
 * Clerk metadata helpers
 */

/**
 * Get current user's plan from Clerk metadata
 */
export async function getUserPlan(userId: string): Promise<'free' | 'pro' | 'business' | 'agency'> {
  try {
    const user = await currentUser();
    if (!user) throw new Error('User not found');
    
    const metadata = user.publicMetadata as unknown as UserMetadata;
    const plan = metadata.plan as any; // Allow backward compatibility with old plan types
    
    // Return the actual plan type
    if (plan === 'business' || plan === 'agency' || plan === 'pro') return plan;
    return 'free';
  } catch (error) {
    logger.error('Failed to get user plan', { userId, error });
    return 'free';
  }
}

/**
 * Update user's plan in Clerk metadata
 */
export async function updateUserPlan(userId: string, plan: 'free' | 'pro' | 'business' | 'agency'): Promise<void> {
  try {
    const user = await currentUser();
    if (!user) throw new Error('User not found');
    
    const currentMetadata = user.publicMetadata as unknown as UserMetadata || {};
    const updatedMetadata: UserMetadata = {
      ...currentMetadata,
      plan
    };
    
    // Actually update the user metadata using clerkClient
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: updatedMetadata as unknown as UserPublicMetadata
    });
    
    logger.info('User plan updated', { userId, fromPlan: currentMetadata.plan, toPlan: plan });
  } catch (error) {
    logger.error('Failed to update user plan', { userId, plan, error });
    throw error;
  }
}

/**
 * Get daily generation count for user
 */
export async function getDailyGenCount(userId: string): Promise<number> {
  try {
    const user = await currentUser();
    if (!user) return 0;
    
    const metadata = user.publicMetadata as unknown as UserMetadata;
    const lastResetDate = metadata.lastResetDate;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Reset count if it's a new day
    if (lastResetDate !== today) {
      logger.info('New day detected, resetting counters', { 
        userId, 
        lastResetDate, 
        today, 
        currentCount: metadata.dailyGenCount 
      });
      await resetDailyCountersIfNeeded(userId);
      return 0;
    }
    
    return metadata.dailyGenCount || 0;
  } catch (error) {
    logger.error('Failed to get daily generation count', { userId, error });
    return 0;
  }
}

/**
 * Get daily rewrite count for user
 */
export async function getDailyRewriteCount(userId: string): Promise<number> {
  try {
    const user = await currentUser();
    if (!user) return 0;
    
    const metadata = user.publicMetadata as unknown as UserMetadata;
    const lastResetDate = metadata.lastResetDate;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Reset count if it's a new day
    if (lastResetDate !== today) {
      await resetDailyCountersIfNeeded(userId);
      return 0;
    }
    
    return metadata.dailyRewriteCount || 0;
  } catch (error) {
    logger.error('Failed to get daily rewrite count', { userId, error });
    return 0;
  }
}

/**
 * Increment daily generation count
 */
export async function incrementDailyGenCount(userId: string): Promise<number> {
  try {
    const user = await currentUser();
    if (!user) throw new Error('User not found');
    
    const currentCount = await getDailyGenCount(userId);
    const newCount = currentCount + 1;
    
    const metadata = user.publicMetadata as unknown as UserMetadata || {};
    const today = new Date().toISOString().split('T')[0];
    const updatedMetadata: UserMetadata = {
      ...metadata,
      plan: metadata.plan || 'free',
      dailyGenCount: newCount,
      dailyRewriteCount: metadata.dailyRewriteCount || 0,
      dailyImageUploadCount: metadata.dailyImageUploadCount || 0,
      lifetimeGenerations: (metadata.lifetimeGenerations || 0) + 1,
      lastResetDate: metadata.lastResetDate || today,
      // Preserve all other existing metadata
      preferences: metadata.preferences,
      etsyTokens: metadata.etsyTokens,
      etsyShopId: metadata.etsyShopId,
      etsyRateLimitCount: metadata.etsyRateLimitCount,
      etsyRateLimitReset: metadata.etsyRateLimitReset
    };
    
    logger.info('About to update user metadata', { 
      userId, 
      currentMetadata: JSON.stringify(metadata, null, 2),
      updatedMetadata: JSON.stringify(updatedMetadata, null, 2)
    });
    
    // Actually update the user metadata using clerkClient
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: updatedMetadata as unknown as UserPublicMetadata
    });
    
    logger.info('User metadata update completed', { userId });
    
    logger.info('Daily generation count incremented', { 
      userId, 
      count: newCount, 
      previousCount: currentCount,
      updatedMetadata: JSON.stringify(updatedMetadata, null, 2)
    });
    return newCount;
  } catch (error) {
    logger.error('Failed to increment daily generation count', { userId, error });
    throw error;
  }
}

/**
 * Increment daily rewrite count
 */
export async function incrementDailyRewriteCount(userId: string): Promise<number> {
  try {
    const user = await currentUser();
    if (!user) throw new Error('User not found');
    
    const currentCount = await getDailyRewriteCount(userId);
    const newCount = currentCount + 1;
    
    const metadata = user.publicMetadata as unknown as UserMetadata || {};
    const today = new Date().toISOString().split('T')[0];
    const updatedMetadata: UserMetadata = {
      ...metadata,
      plan: metadata.plan || 'free',
      dailyGenCount: metadata.dailyGenCount || 0,
      dailyRewriteCount: newCount,
      dailyImageUploadCount: metadata.dailyImageUploadCount || 0,
      lastResetDate: metadata.lastResetDate || today,
      // Preserve all other existing metadata
      preferences: metadata.preferences,
      etsyTokens: metadata.etsyTokens,
      etsyShopId: metadata.etsyShopId,
      etsyRateLimitCount: metadata.etsyRateLimitCount,
      etsyRateLimitReset: metadata.etsyRateLimitReset
    };
    
    // Actually update the user metadata using clerkClient
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: updatedMetadata as unknown as UserPublicMetadata
    });
    
    logger.info('Daily rewrite count incremented', { userId, count: newCount });
    return newCount;
  } catch (error) {
    logger.error('Failed to increment daily rewrite count', { userId, error });
    throw error;
  }
}

/**
 * Reset daily counters if needed (new day)
 */
export async function resetDailyCountersIfNeeded(userId: string): Promise<void> {
  try {
    const user = await currentUser();
    if (!user) return;
    
    const metadata = user.publicMetadata as unknown as UserMetadata;
    const lastResetDate = metadata.lastResetDate;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (lastResetDate !== today) {
      const updatedMetadata: UserMetadata = {
        ...metadata,
        plan: metadata.plan || 'free',
        dailyGenCount: 0,
        dailyRewriteCount: 0,
        dailyImageUploadCount: 0,
        lastResetDate: today,
        // Preserve all other existing metadata
        preferences: metadata.preferences,
        etsyTokens: metadata.etsyTokens,
        etsyShopId: metadata.etsyShopId,
        etsyRateLimitCount: metadata.etsyRateLimitCount,
        etsyRateLimitReset: metadata.etsyRateLimitReset
      };
      
      // Actually save the reset metadata
      await clerkClient.users.updateUserMetadata(userId, {
        publicMetadata: updatedMetadata as unknown as UserPublicMetadata
      });
      
      logger.info('Daily counters reset for new day', { userId, date: today });
    }
  } catch (error) {
    logger.error('Failed to reset daily counters', { userId, error });
  }
}

/**
 * Get daily image upload count for user
 */
export async function getDailyImageUploadCount(userId: string): Promise<number> {
  try {
    const user = await currentUser();
    if (!user) return 0;
    
    const metadata = user.publicMetadata as unknown as UserMetadata;
    const lastResetDate = metadata.lastResetDate;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Reset count if it's a new day
    if (lastResetDate !== today) {
      await resetDailyCountersIfNeeded(userId);
      return 0;
    }
    
    return metadata.dailyImageUploadCount || 0;
  } catch (error) {
    logger.error('Failed to get daily image upload count', { userId, error });
    return 0;
  }
}

/**
 * Increment daily image upload count
 */
export async function incrementDailyImageUploadCount(userId: string, count: number = 1): Promise<number> {
  try {
    const user = await currentUser();
    if (!user) throw new Error('User not found');
    
    const currentCount = await getDailyImageUploadCount(userId);
    const newCount = currentCount + count;
    
    const metadata = user.publicMetadata as unknown as UserMetadata || {};
    const today = new Date().toISOString().split('T')[0];
    const updatedMetadata: UserMetadata = {
      ...metadata,
      plan: metadata.plan || 'free',
      dailyGenCount: metadata.dailyGenCount || 0,
      dailyRewriteCount: metadata.dailyRewriteCount || 0,
      dailyImageUploadCount: newCount,
      lifetimeImageUploads: (metadata.lifetimeImageUploads || 0) + count,
      lastResetDate: metadata.lastResetDate || today,
      // Preserve all other existing metadata
      preferences: metadata.preferences,
      etsyTokens: metadata.etsyTokens,
      etsyShopId: metadata.etsyShopId,
      etsyRateLimitCount: metadata.etsyRateLimitCount,
      etsyRateLimitReset: metadata.etsyRateLimitReset
    };
    
    // Actually update the user metadata using clerkClient
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: updatedMetadata as unknown as UserPublicMetadata
    });
    
    logger.info('Daily image upload count incremented', { userId, count: newCount });
    return newCount;
  } catch (error) {
    logger.error('Failed to increment daily image upload count', { userId, error });
    throw error;
  }
}

/**
 * Reset daily image upload count (called in daily counter reset)
 */
export async function resetDailyImageUploadCount(userId: string): Promise<void> {
  try {
    const user = await currentUser();
    if (!user) return;
    
    const metadata = user.publicMetadata as unknown as UserMetadata;
    const today = new Date().toISOString().split('T')[0];
    const updatedMetadata: UserMetadata = {
      ...metadata,
      plan: metadata.plan || 'free',
      dailyImageUploadCount: 0,
      lastResetDate: today,
      // Preserve all other existing metadata
      preferences: metadata.preferences,
      etsyTokens: metadata.etsyTokens,
      etsyShopId: metadata.etsyShopId,
      etsyRateLimitCount: metadata.etsyRateLimitCount,
      etsyRateLimitReset: metadata.etsyRateLimitReset
    };
    
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: updatedMetadata as unknown as UserPublicMetadata
    });
  } catch (error) {
    logger.error('Failed to reset daily image upload count', { userId, error });
  }
}

/**
 * Get user preferences (tone, niche)
 */
export async function getUserPreferences(userId: string): Promise<{ tone?: string; niche?: string }> {
  try {
    const user = await currentUser();
    if (!user) return {};
    
    const metadata = user.publicMetadata as unknown as UserMetadata;
    return {
      tone: metadata.preferences?.tone,
      niche: metadata.preferences?.niche
    };
  } catch (error) {
    logger.error('Failed to get user preferences', { userId, error });
    return {};
  }
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(userId: string, preferences: { tone?: string; niche?: string; audience?: string }): Promise<void> {
  try {
    const user = await currentUser();
    if (!user) throw new Error('User not found');
    
    const metadata = user.publicMetadata as unknown as UserMetadata || {};
    const updatedMetadata: UserMetadata = {
      ...metadata,
      preferences: {
        tone: preferences.tone,
        niche: preferences.niche,
        audience: preferences.audience
      }
    };
    
    // Actually update the user metadata using clerkClient
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: updatedMetadata as unknown as UserPublicMetadata
    });
    
    logger.info('User preferences updated', { userId, preferences });
  } catch (error) {
    logger.error('Failed to update user preferences', { userId, preferences, error });
    throw error;
  }
}

/**
 * Get Etsy connection info
 */
export async function getEtsyConnection(userId: string): Promise<{ shopId?: string; hasTokens: boolean }> {
  try {
    const user = await currentUser();
    if (!user) return { hasTokens: false };
    
    const metadata = user.publicMetadata as unknown as UserMetadata;
    return {
      shopId: metadata.etsyShopId,
      hasTokens: !!metadata.etsyTokens
    };
  } catch (error) {
    logger.error('Failed to get Etsy connection', { userId, error });
    return { hasTokens: false };
  }
}

/**
 * Update Etsy connection
 */
export async function updateEtsyConnection(userId: string, shopId: string, encryptedTokens: string): Promise<void> {
  try {
    const user = await currentUser();
    if (!user) throw new Error('User not found');
    
    const metadata = user.publicMetadata as unknown as UserMetadata || {};
    const updatedMetadata: UserMetadata = {
      ...metadata,
      etsyShopId: shopId,
      etsyTokens: encryptedTokens
    };
    
    // Actually update the user metadata using clerkClient
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: updatedMetadata as unknown as UserPublicMetadata
    });
    
    logger.info('Etsy connection updated', { userId, shopId });
  } catch (error) {
    logger.error('Failed to update Etsy connection', { userId, shopId, error });
    throw error;
  }
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser() {
  return await currentUser();
}

/**
 * Require authentication
 */
export async function requireAuth() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Authentication required');
  }
  return userId;
}

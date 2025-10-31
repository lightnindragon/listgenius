import { getUserPlan } from './clerk';
import { logger } from './logger';

/**
 * Get image upload limit for a plan
 */
export function getImageUploadLimit(plan: 'free' | 'pro' | 'business' | 'agency'): number | 'unlimited' {
  switch (plan) {
    case 'free':
      return 20;
    case 'pro':
      return 1000;
    case 'business':
      return 4000;
    case 'agency':
      return 'unlimited';
    default:
      return 20;
  }
}

/**
 * Check if user can upload more images based on their plan
 */
export async function checkImageUploadLimit(
  userId: string,
  currentCount: number
): Promise<{ allowed: boolean; limit: number | 'unlimited'; remaining?: number; error?: string }> {
  try {
    const plan = await getUserPlan(userId);
    const limit = getImageUploadLimit(plan);

    // Agency plan has unlimited uploads
    if (limit === 'unlimited') {
      return {
        allowed: true,
        limit: 'unlimited',
      };
    }

    // Check if user has reached their limit
    if (currentCount >= limit) {
      return {
        allowed: false,
        limit,
        error: `Daily upload limit reached. You have uploaded ${currentCount}/${limit} images today. Upgrade to upload more.`,
      };
    }

    return {
      allowed: true,
      limit,
      remaining: limit - currentCount,
    };
  } catch (error) {
    logger.error('Failed to check image upload limit', {
      userId,
      error: (error as Error).message,
    });
    // On error, default to free plan limit
    return {
      allowed: currentCount < 20,
      limit: 20,
      remaining: Math.max(0, 20 - currentCount),
    };
  }
}


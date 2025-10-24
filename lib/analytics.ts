import { createClerkClient } from '@clerk/nextjs/server';
import { logger } from './logger';

// Initialize Clerk client
const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

export interface UserActivity {
  type: 'login' | 'generation' | 'page_view' | 'plan_change' | 'quota_reset';
  timestamp: string;
  details?: any;
  ip?: string;
}

export interface LoginHistory {
  timestamp: string;
  ip?: string;
  userAgent?: string;
}

/**
 * Track user login activity
 */
export async function trackLogin(userId: string, ip?: string, userAgent?: string): Promise<void> {
  try {
    const user = await clerkClient.users.getUser(userId);
    const currentMetadata = user.publicMetadata as any || {};
    
    const loginCount = (currentMetadata.loginCount || 0) + 1;
    const loginHistory = currentMetadata.loginHistory || [];
    
    // Add new login to history (keep last 10)
    const newLogin: LoginHistory = {
      timestamp: new Date().toISOString(),
      ip,
      userAgent
    };
    
    loginHistory.push(newLogin);
    if (loginHistory.length > 10) {
      loginHistory.shift(); // Remove oldest
    }
    
    const updatedMetadata = {
      ...currentMetadata,
      loginCount,
      lastLoginAt: new Date().toISOString(),
      loginHistory
    };
    
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: updatedMetadata
    });
    
    logger.info('User login tracked', { userId, loginCount });
  } catch (error) {
    logger.error('Error tracking user login', { userId, error });
  }
}

/**
 * Track user generation activity
 */
export async function trackGeneration(userId: string, generationType: 'listing' | 'rewrite' = 'listing'): Promise<void> {
  try {
    const user = await clerkClient.users.getUser(userId);
    const currentMetadata = user.publicMetadata as any || {};
    
    const lifetimeGenerations = (currentMetadata.lifetimeGenerations || 0) + 1;
    const dailyGenCount = (currentMetadata.dailyGenCount || 0) + 1;
    
    // Track monthly usage
    const now = new Date();
    const monthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    const genUsage = currentMetadata.genUsage || {};
    genUsage[monthKey] = (genUsage[monthKey] || 0) + 1;
    
    const updatedMetadata = {
      ...currentMetadata,
      lifetimeGenerations,
      dailyGenCount,
      genUsage,
      lastGenerationAt: new Date().toISOString()
    };
    
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: updatedMetadata
    });
    
    logger.info('User generation tracked', { userId, generationType, lifetimeGenerations });
  } catch (error) {
    logger.error('Error tracking user generation', { userId, error });
  }
}

/**
 * Track page view activity
 */
export async function trackPageView(userId: string, page: string, ip?: string): Promise<void> {
  try {
    const user = await clerkClient.users.getUser(userId);
    const currentMetadata = user.publicMetadata as any || {};
    
    const pageViews = currentMetadata.pageViews || {};
    pageViews[page] = (pageViews[page] || 0) + 1;
    
    const updatedMetadata = {
      ...currentMetadata,
      pageViews,
      lastPageView: {
        page,
        timestamp: new Date().toISOString(),
        ip
      }
    };
    
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: updatedMetadata
    });
    
    logger.info('User page view tracked', { userId, page });
  } catch (error) {
    logger.error('Error tracking user page view', { userId, page, error });
  }
}

/**
 * Track plan change activity
 */
export async function trackPlanChange(userId: string, oldPlan: string, newPlan: string, changedBy: string = 'user'): Promise<void> {
  try {
    const user = await clerkClient.users.getUser(userId);
    const currentMetadata = user.publicMetadata as any || {};
    
    const planHistory = currentMetadata.planHistory || [];
    planHistory.push({
      from: oldPlan,
      to: newPlan,
      timestamp: new Date().toISOString(),
      changedBy
    });
    
    const updatedMetadata = {
      ...currentMetadata,
      planHistory,
      planChangedAt: new Date().toISOString()
    };
    
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: updatedMetadata
    });
    
    logger.info('User plan change tracked', { userId, oldPlan, newPlan, changedBy });
  } catch (error) {
    logger.error('Error tracking user plan change', { userId, oldPlan, newPlan, error });
  }
}

/**
 * Get user activity summary
 */
export async function getUserActivitySummary(userId: string): Promise<{
  loginCount: number;
  lastLoginAt: string;
  lifetimeGenerations: number;
  dailyGenCount: number;
  monthlyGenCount: number;
  loginHistory: LoginHistory[];
  pageViews: Record<string, number>;
  planHistory: Array<{ from: string; to: string; timestamp: string; changedBy: string }>;
}> {
  try {
    const user = await clerkClient.users.getUser(userId);
    const metadata = user.publicMetadata as any || {};
    
    const now = new Date();
    const monthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    const monthlyGenCount = metadata.genUsage?.[monthKey] || 0;
    
    return {
      loginCount: metadata.loginCount || 0,
      lastLoginAt: metadata.lastLoginAt || new Date(user.createdAt).toISOString(),
      lifetimeGenerations: metadata.lifetimeGenerations || 0,
      dailyGenCount: metadata.dailyGenCount || 0,
      monthlyGenCount,
      loginHistory: metadata.loginHistory || [],
      pageViews: metadata.pageViews || {},
      planHistory: metadata.planHistory || []
    };
  } catch (error) {
    logger.error('Error getting user activity summary', { userId, error });
    throw error;
  }
}

/**
 * Get analytics data for a specific user
 */
export async function getUserAnalytics(userId: string): Promise<{
  user: any;
  activity: any;
  usage: any;
  trends: any;
}> {
  try {
    const user = await clerkClient.users.getUser(userId);
    const activity = await getUserActivitySummary(userId);
    
    // Calculate usage trends (last 30 days)
    const usage = {
      daily: activity.dailyGenCount,
      monthly: activity.monthlyGenCount,
      lifetime: activity.lifetimeGenerations,
      averagePerDay: activity.lifetimeGenerations / Math.max(1, Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)))
    };
    
    // Generate trend data (mock for now)
    const trends = {
      generationsOverTime: generateTrendData(30, activity.lifetimeGenerations),
      loginFrequency: activity.loginCount / Math.max(1, Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)))
    };
    
    return {
      user: {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        name: user.fullName || user.firstName,
        avatar: user.imageUrl,
        createdAt: new Date(user.createdAt).toISOString(),
        lastSignInAt: user.lastSignInAt ? new Date(user.lastSignInAt).toISOString() : null
      },
      activity,
      usage,
      trends
    };
  } catch (error) {
    logger.error('Error getting user analytics', { userId, error });
    throw error;
  }
}

/**
 * Generate trend data (mock implementation)
 */
function generateTrendData(days: number, currentValue: number): Array<{ date: string; value: number }> {
  const data = [];
  const now = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
    const value = Math.max(0, currentValue - Math.random() * currentValue * 0.4);
    
    data.push({
      date: date.toISOString().split('T')[0],
      value: Math.round(value)
    });
  }
  
  return data;
}

/**
 * Get system-wide analytics
 */
export async function getSystemAnalytics(): Promise<{
  totalUsers: number;
  activeUsers: number;
  totalGenerations: number;
  averageGenerationsPerUser: number;
  topPages: Array<{ page: string; views: number }>;
  userGrowth: Array<{ date: string; count: number }>;
}> {
  try {
    const users = await clerkClient.users.getUserList({ limit: 1000 });
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    let totalUsers = 0;
    let activeUsers = 0;
    let totalGenerations = 0;
    const pageViews: Record<string, number> = {};
    
    for (const user of users.data) {
      totalUsers++;
      const metadata = user.publicMetadata as any || {};
      
      // Check if user is active
      const lastLogin = metadata.lastLoginAt ? new Date(metadata.lastLoginAt) : new Date(user.createdAt);
      if (lastLogin > thirtyDaysAgo) {
        activeUsers++;
      }
      
      // Sum up generations
      totalGenerations += metadata.lifetimeGenerations || 0;
      
      // Sum up page views
      const userPageViews = metadata.pageViews || {};
      for (const [page, views] of Object.entries(userPageViews)) {
        pageViews[page] = (pageViews[page] || 0) + (views as number);
      }
    }
    
    const averageGenerationsPerUser = totalUsers > 0 ? Math.round(totalGenerations / totalUsers) : 0;
    
    // Get top pages
    const topPages = Object.entries(pageViews)
      .map(([page, views]) => ({ page, views: views as number }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);
    
    // Generate user growth data (mock)
    const userGrowth = generateUserGrowthData(30, totalUsers);
    
    return {
      totalUsers,
      activeUsers,
      totalGenerations,
      averageGenerationsPerUser,
      topPages,
      userGrowth
    };
  } catch (error) {
    logger.error('Error getting system analytics', { error });
    throw error;
  }
}

/**
 * Generate user growth data (mock implementation)
 */
function generateUserGrowthData(days: number, currentUsers: number): Array<{ date: string; count: number }> {
  const data = [];
  const now = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
    const count = Math.max(0, currentUsers - Math.random() * currentUsers * 0.2);
    
    data.push({
      date: date.toISOString().split('T')[0],
      count: Math.round(count)
    });
  }
  
  return data;
}
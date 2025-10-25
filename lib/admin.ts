import { NextRequest } from 'next/server';
import { createClerkClient } from '@clerk/nextjs/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { logger } from './logger';

// Initialize Clerk client
const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

// Admin credentials from environment
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin123genius';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '$2b$10$GwJV.08NMfyB0JrbaVofWetMRXYR0dN9a43mNnQcJRQ6n3yHDPxqi'; // Hash for fMZz9LJkZZiU!
const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || 'admin-session-secret-change-in-production';

export interface AdminSession {
  username: string;
  iat: number;
  exp: number;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  plan: 'free' | 'pro' | 'business' | 'agency';
  status: 'active' | 'suspended' | 'cancelled';
  loginCount: number;
  lastLoginAt: string;
  lifetimeGenerations: number;
  dailyGenCount: number;
  dailyRewriteCount: number;
  monthlyGenCount?: number;
  signUpDate: string;
  stripeCustomerId?: string;
  subscriptionStatus?: string;
  customQuota?: number;
}

export interface AdminAnalytics {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  usersByPlan: {
    free: number;
    pro: number;
    business: number;
    agency: number;
  };
  cancelledSubscriptions: number;
  totalGenerationsThisMonth: number;
  averageGenerationsPerUser: number;
  revenueThisMonth: number;
  userGrowthData: Array<{ date: string; count: number }>;
  generationTrends: Array<{ date: string; count: number }>;
}

/**
 * Verify admin credentials
 */
export async function verifyAdminCredentials(username: string, password: string): Promise<boolean> {
  try {
    if (username !== ADMIN_USERNAME) {
      return false;
    }
    
    const isValid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    return isValid;
  } catch (error) {
    logger.error('Error verifying admin credentials', { error });
    return false;
  }
}

/**
 * Create admin session token
 */
export function createAdminSession(username: string): string {
  const payload: AdminSession = {
    username,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  };
  
  return jwt.sign(payload, ADMIN_SESSION_SECRET);
}

/**
 * Verify admin session token
 */
export function verifyAdminSession(token: string): AdminSession | null {
  try {
    const decoded = jwt.verify(token, ADMIN_SESSION_SECRET) as AdminSession;
    return decoded;
  } catch (error) {
    logger.error('Error verifying admin session', { error });
    return null;
  }
}

/**
 * Check if request is from authenticated admin
 */
export function isAdminAuthenticated(request: NextRequest): boolean {
  const token = request.cookies.get('admin-session')?.value;
  if (!token) {
    return false;
  }
  
  const session = verifyAdminSession(token);
  return session !== null;
}

/**
 * Get admin session from request
 */
export function getAdminSession(request: NextRequest): AdminSession | null {
  const token = request.cookies.get('admin-session')?.value;
  if (!token) {
    return null;
  }
  
  return verifyAdminSession(token);
}

/**
 * Require admin authentication - throws if not authenticated
 */
export function requireAdmin(request: NextRequest): AdminSession {
  const session = getAdminSession(request);
  if (!session) {
    throw new Error('Admin authentication required');
  }
  return session;
}

/**
 * Get all users from Clerk with analytics data
 */
export async function getAllUsers(page: number = 1, limit: number = 50, search?: string, plan?: string, status?: string): Promise<{ users: AdminUser[]; total: number }> {
  try {
    const users = await clerkClient.users.getUserList({
      limit: limit,
      offset: (page - 1) * limit,
    });

    const adminUsers: AdminUser[] = users.data.map(user => {
      const metadata = user.publicMetadata as any || {};
      const email = user.emailAddresses[0]?.emailAddress || '';
      const name = user.fullName || user.firstName || email.split('@')[0];
      
      return {
        id: user.id,
        email,
        name,
        avatar: user.imageUrl,
        plan: metadata.plan || 'free',
        status: metadata.accountStatus || 'active',
        loginCount: metadata.loginCount || 0,
        lastLoginAt: metadata.lastLoginAt || new Date(user.createdAt).toISOString(),
        lifetimeGenerations: metadata.lifetimeGenerations || 0,
        dailyGenCount: metadata.dailyGenCount || 0,
        dailyRewriteCount: metadata.dailyRewriteCount || 0,
        monthlyGenCount: metadata.monthlyGenCount || 0,
        signUpDate: new Date(user.createdAt).toISOString(),
        stripeCustomerId: metadata.stripeCustomerId,
        subscriptionStatus: metadata.subscriptionStatus,
        customQuota: metadata.customQuota
      };
    });

    // Apply filters
    let filteredUsers = adminUsers;
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = filteredUsers.filter(user => 
        user.email.toLowerCase().includes(searchLower) ||
        user.name.toLowerCase().includes(searchLower)
      );
    }
    
    if (plan) {
      filteredUsers = filteredUsers.filter(user => user.plan === plan);
    }
    
    if (status) {
      filteredUsers = filteredUsers.filter(user => user.status === status);
    }

    return {
      users: filteredUsers,
      total: users.totalCount
    };
  } catch (error) {
    logger.error('Error fetching users', { error });
    throw error;
  }
}

/**
 * Get user by ID with detailed analytics
 */
export async function getUserById(userId: string): Promise<AdminUser | null> {
  try {
    const user = await clerkClient.users.getUser(userId);
    const metadata = user.publicMetadata as any || {};
    const email = user.emailAddresses[0]?.emailAddress || '';
    const name = user.fullName || user.firstName || email.split('@')[0];
    
    return {
      id: user.id,
      email,
      name,
      avatar: user.imageUrl,
      plan: metadata.plan || 'free',
      status: metadata.accountStatus || 'active',
      loginCount: metadata.loginCount || 0,
      lastLoginAt: metadata.lastLoginAt || new Date(user.createdAt).toISOString(),
      lifetimeGenerations: metadata.lifetimeGenerations || 0,
      dailyGenCount: metadata.dailyGenCount || 0,
      dailyRewriteCount: metadata.dailyRewriteCount || 0,
      monthlyGenCount: metadata.monthlyGenCount || 0,
      signUpDate: new Date(user.createdAt).toISOString(),
      stripeCustomerId: metadata.stripeCustomerId,
      subscriptionStatus: metadata.subscriptionStatus,
      customQuota: metadata.customQuota
    };
  } catch (error) {
    logger.error('Error fetching user by ID', { userId, error });
    return null;
  }
}

/**
 * Update user plan
 */
export async function updateUserPlan(userId: string, plan: 'free' | 'pro' | 'business' | 'agency'): Promise<void> {
  try {
    const user = await clerkClient.users.getUser(userId);
    const currentMetadata = user.publicMetadata as any || {};
    
    const updatedMetadata = {
      ...currentMetadata,
      plan,
      planChangedAt: new Date().toISOString(),
      planChangedBy: 'admin'
    };
    
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: updatedMetadata
    });
    
    logger.info('User plan updated', { userId, plan, previousPlan: currentMetadata.plan });
  } catch (error) {
    logger.error('Error updating user plan', { userId, plan, error });
    throw error;
  }
}

/**
 * Map Clerk user to AdminUser interface
 */
function mapClerkUserToAdminUser(user: any): AdminUser {
  const metadata = user.publicMetadata as any || {};
  const email = user.emailAddresses[0]?.emailAddress || '';
  const name = user.fullName || user.firstName || email.split('@')[0];
  
  return {
    id: user.id,
    email,
    name,
    avatar: user.imageUrl,
    plan: metadata.plan || 'free',
    status: metadata.accountStatus || 'active',
    loginCount: metadata.loginCount || 0,
    lastLoginAt: metadata.lastLoginAt || new Date(user.createdAt).toISOString(),
    lifetimeGenerations: metadata.lifetimeGenerations || 0,
    dailyGenCount: metadata.dailyGenCount || 0,
    dailyRewriteCount: metadata.dailyRewriteCount || 0,
    signUpDate: new Date(user.createdAt).toISOString(),
    stripeCustomerId: metadata.stripeCustomerId,
    subscriptionStatus: metadata.subscriptionStatus,
    customQuota: metadata.customQuota
  };
}

/**
 * Update user plan (admin version that returns AdminUser)
 */
export async function updateUserPlanAdmin(userId: string, plan: 'free' | 'pro' | 'business' | 'agency'): Promise<AdminUser> {
  try {
    const user = await clerkClient.users.getUser(userId);
    const currentMetadata = user.publicMetadata as any || {};
    
    const updatedMetadata = {
      ...currentMetadata,
      plan,
      planChangedAt: new Date().toISOString(),
      planChangedBy: 'admin'
    };
    
    const updatedUser = await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: updatedMetadata
    });
    
    logger.info('User plan updated by admin', { userId, plan, previousPlan: currentMetadata.plan });
    return mapClerkUserToAdminUser(updatedUser);
  } catch (error) {
    logger.error('Error updating user plan', { userId, plan, error });
    throw error;
  }
}

/**
 * Suspend user account
 */
export async function suspendUser(userId: string): Promise<void> {
  try {
    const user = await clerkClient.users.getUser(userId);
    const currentMetadata = user.publicMetadata as any || {};
    
    const updatedMetadata = {
      ...currentMetadata,
      accountStatus: 'suspended',
      suspendedAt: new Date().toISOString(),
      suspendedBy: 'admin'
    };
    
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: updatedMetadata
    });
    
    logger.info('User suspended', { userId });
  } catch (error) {
    logger.error('Error suspending user', { userId, error });
    throw error;
  }
}

/**
 * Unsuspend user account
 */
export async function unsuspendUser(userId: string): Promise<void> {
  try {
    const user = await clerkClient.users.getUser(userId);
    const currentMetadata = user.publicMetadata as any || {};
    
    const updatedMetadata = {
      ...currentMetadata,
      accountStatus: 'active',
      unsuspendedAt: new Date().toISOString(),
      unsuspendedBy: 'admin'
    };
    
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: updatedMetadata
    });
    
    logger.info('User unsuspended', { userId });
  } catch (error) {
    logger.error('Error unsuspending user', { userId, error });
    throw error;
  }
}

/**
 * Reset user quotas
 */
export async function resetUserQuota(userId: string, options: { resetDaily?: boolean; resetMonthly?: boolean; setCustomQuota?: number }): Promise<void> {
  try {
    const user = await clerkClient.users.getUser(userId);
    const currentMetadata = user.publicMetadata as any || {};
    
    const updatedMetadata = { ...currentMetadata };
    
    if (options.resetDaily) {
      updatedMetadata.dailyGenCount = 0;
      updatedMetadata.dailyRewriteCount = 0;
    }
    
    if (options.resetMonthly) {
      updatedMetadata.genUsage = {};
    }
    
    if (options.setCustomQuota !== undefined) {
      updatedMetadata.customQuota = options.setCustomQuota;
    }
    
    updatedMetadata.quotaResetAt = new Date().toISOString();
    updatedMetadata.quotaResetBy = 'admin';
    
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: updatedMetadata
    });
    
    logger.info('User quota reset', { userId, options });
  } catch (error) {
    logger.error('Error resetting user quota', { userId, options, error });
    throw error;
  }
}

/**
 * Get analytics overview
 */
export async function getAnalyticsOverview(): Promise<AdminAnalytics> {
  try {
    const users = await clerkClient.users.getUserList({ limit: 1000 });
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    let totalUsers = 0;
    let activeUsers = 0;
    let newUsersThisMonth = 0;
    let totalGenerationsThisMonth = 0;
    let cancelledSubscriptions = 0;
    
    const usersByPlan = { free: 0, pro: 0, business: 0, agency: 0 };
    
    for (const user of users.data) {
      totalUsers++;
      const metadata = user.publicMetadata as any || {};
      
      // Check if user is active (logged in last 30 days)
      const lastLogin = metadata.lastLoginAt ? new Date(metadata.lastLoginAt) : new Date(user.createdAt);
      if (lastLogin > thirtyDaysAgo) {
        activeUsers++;
      }
      
      // Check if user signed up this month
      if (new Date(user.createdAt) > thisMonth) {
        newUsersThisMonth++;
      }
      
      // Count by plan
      const plan = metadata.plan || 'free';
      if (plan in usersByPlan) {
        usersByPlan[plan as keyof typeof usersByPlan]++;
      }
      
      // Count generations this month
      const monthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
      const monthlyUsage = metadata.genUsage?.[monthKey] || 0;
      totalGenerationsThisMonth += monthlyUsage;
      
      // Check for cancelled subscriptions
      if (metadata.subscriptionStatus === 'cancelled') {
        cancelledSubscriptions++;
      }
    }
    
    const averageGenerationsPerUser = totalUsers > 0 ? Math.round(totalGenerationsThisMonth / totalUsers) : 0;
    
    // Generate mock chart data (in real implementation, you'd query historical data)
    const userGrowthData = generateMockChartData(30, totalUsers);
    const generationTrends = generateMockChartData(30, totalGenerationsThisMonth);
    
    return {
      totalUsers,
      activeUsers,
      newUsersThisMonth,
      usersByPlan,
      cancelledSubscriptions,
      totalGenerationsThisMonth,
      averageGenerationsPerUser,
      revenueThisMonth: 0, // Would integrate with Stripe
      userGrowthData,
      generationTrends
    };
  } catch (error) {
    logger.error('Error getting analytics overview', { error });
    throw error;
  }
}

/**
 * Generate mock chart data (replace with real data in production)
 */
function generateMockChartData(days: number, currentValue: number): Array<{ date: string; count: number }> {
  const data = [];
  const now = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
    const count = Math.max(0, currentValue - Math.random() * currentValue * 0.3);
    
    data.push({
      date: date.toISOString().split('T')[0],
      count: Math.round(count)
    });
  }
  
  return data;
}

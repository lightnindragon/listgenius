import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { logger } from './logger';

const COOKIE_NAME = process.env.AFFILIATE_COOKIE_NAME || 'affiliate_ref';
const COMMISSION_RATE = Number(process.env.AFFILIATE_COMMISSION_RATE || 0.30);

/**
 * Get affiliate code from cookie
 */
export async function getAffiliateCodeFromCookie(): Promise<string | null> {
  try {
    const cookieStore = cookies();
    const affiliateCookie = cookieStore.get(COOKIE_NAME);
    return affiliateCookie?.value || null;
  } catch (error) {
    logger.error('Failed to get affiliate code from cookie', { error });
    return null;
  }
}

/**
 * Get user's affiliate account (if they have one)
 * Note: Affiliates must now apply and be approved
 */
export async function getAffiliateForUser(userId: string) {
  try {
    const existing = await prisma.affiliate.findUnique({ 
      where: { userId } 
    });
    
    return existing;
  } catch (error) {
    logger.error('Failed to get affiliate for user', { userId, error });
    return null;
  }
}

/**
 * Record referral on user signup
 */
export async function recordReferralOnSignup(userId: string): Promise<string | null> {
  try {
    const affiliateCode = await getAffiliateCodeFromCookie();
    
    if (!affiliateCode) {
      return null; // No referral cookie
    }

    const affiliate = await prisma.affiliate.findUnique({ 
      where: { code: affiliateCode } 
    });
    
    if (!affiliate) {
      logger.warn('Affiliate not found for referral', { affiliateCode });
      return null;
    }

    // Only record referrals for approved affiliates
    if (affiliate.status !== 'APPROVED') {
      logger.warn('Referral attempt from non-approved affiliate', { 
        affiliateCode, 
        status: affiliate.status 
      });
      return null;
    }

    // Check if user already has a referral (prevent duplicates)
    const existingReferral = await prisma.referral.findUnique({
      where: { userId }
    });

    if (existingReferral) {
      logger.info('User already has referral', { userId, existingCode: existingReferral.affiliateCode });
      return existingReferral.affiliateCode;
    }

    // Create referral and increment count
    await prisma.$transaction([
      prisma.referral.create({ 
        data: { 
          affiliateCode, 
          userId 
        } 
      }),
      prisma.affiliate.update({
        where: { code: affiliateCode },
        data: { 
          referralCount: { increment: 1 } 
        },
      }),
    ]);

    logger.info('Referral recorded', { userId, affiliateCode });
    return affiliateCode;
  } catch (error) {
    logger.error('Failed to record referral', { userId, error });
    return null;
  }
}

/**
 * Calculate commission amount from payment amount in cents
 */
export function calculateCommission(amountCents: number): number {
  const amount = amountCents / 100; // Convert cents to dollars
  const commission = amount * COMMISSION_RATE;
  return Math.round(commission * 100) / 100; // Round to 2 decimal places
}

/**
 * Convert cents to currency amount
 */
export function currencyFromCents(cents: number): number {
  return cents / 100;
}

/**
 * Convert currency amount to cents
 */
export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Hash value for privacy (IP, User-Agent)
 */
export function hashVal(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

/**
 * Generate unique affiliate code
 */
function generateAffiliateCode(): string {
  // Generate 12-character base64url string (URL-safe)
  return crypto.randomBytes(9).toString('base64url');
}

/**
 * Award commission to affiliate
 */
export async function awardCommission(
  userId: string, 
  amountCents: number, 
  metadata?: any
): Promise<void> {
  try {
    // Try to find referral by userId first (database record from signup)
    const referral = await prisma.referral.findUnique({ 
      where: { userId } 
    });
    
    const affiliateCode = referral?.affiliateCode || metadata?.affiliateCode;

    if (!affiliateCode) {
      logger.info('No affiliate code found for commission', { userId });
      return; // No affiliate to credit
    }

    const affiliate = await prisma.affiliate.findUnique({ 
      where: { code: affiliateCode } 
    });
    
    if (!affiliate) {
      logger.warn('Affiliate not found for commission', { affiliateCode });
      return;
    }

    const commission = calculateCommission(amountCents);

    await prisma.affiliate.update({
      where: { code: affiliateCode },
      data: {
        pendingEarnings: { increment: commission },
      },
    });

    logger.info('Commission awarded', {
      affiliateCode,
      userId,
      commission,
      originalAmount: amountCents / 100,
    });
  } catch (error) {
    logger.error('Commission award failed', { error, userId });
  }
}

/**
 * Check if user is admin (for Clerk-based admin system)
 * Note: This is for the affiliate system. The main admin system uses custom auth.
 */
export function isAdmin(userId?: string | null): boolean {
  if (!userId) return false;
  const adminIds = process.env.ADMIN_USER_IDS?.split(',').map(id => id.trim()) || [];
  return adminIds.includes(userId);
}

/**
 * Check if request is from admin (for custom admin system)
 */
export function isAdminAuthenticated(request: any): boolean {
  // Import the existing admin function
  try {
    const { isAdminAuthenticated: checkAdmin } = require('@/lib/admin');
    return checkAdmin(request);
  } catch (error) {
    console.error('Failed to import admin auth:', error);
    return false;
  }
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

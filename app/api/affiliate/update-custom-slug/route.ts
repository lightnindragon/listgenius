import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

// Reserved routes that should not be used as affiliate slugs
const RESERVED_ROUTES = [
  'api',
  'app',
  'adm1n796',
  'affiliate',
  'affiliate-program',
  'affiliate-terms',
  'affiliate-disclosure',
  'sign-in',
  'sign-up',
  'contact',
  'legal',
  'privacy',
  'terms',
  'pricing',
  'robots.txt',
  'sitemap.xml',
  'favicon.ico',
  'admin',
  'dashboard',
  'login',
  'logout',
  'register',
  'profile',
  'settings',
  'billing',
  'analytics',
  'generator',
  'keywords',
  'listings',
  'templates',
  'tools',
  'upgrade',
  'drafts',
  'saved',
  'competitors',
  'campaigns',
  'orders',
  'inventory',
  'finances',
  'rank-tracker',
  'messages',
  'shop',
  'rewrite',
];

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      logger.warn('Unauthorized custom slug update attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { customSlug } = await req.json();

    // Find the affiliate
    const affiliate = await prisma.affiliate.findUnique({
      where: { userId },
    });

    if (!affiliate) {
      return NextResponse.json({ 
        error: 'Affiliate account not found' 
      }, { status: 404 });
    }

    if (affiliate.status !== 'APPROVED') {
      return NextResponse.json({ 
        error: 'Only approved affiliates can set custom slugs' 
      }, { status: 403 });
    }

    // If customSlug is empty, just clear it
    if (!customSlug || customSlug.trim() === '') {
      await prisma.affiliate.update({
        where: { id: affiliate.id },
        data: { customSlug: null },
      });

      logger.info('Custom slug cleared', {
        userId,
        affiliateId: affiliate.id,
        affiliateCode: affiliate.code,
      });

      return NextResponse.json({ 
        success: true,
        message: 'Custom slug cleared successfully'
      });
    }

    const slug = customSlug.trim().toLowerCase();

    // Validate slug format (only letters, numbers, and hyphens)
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json({ 
        error: 'Custom slug can only contain letters, numbers, and hyphens' 
      }, { status: 400 });
    }

    // Check minimum length
    if (slug.length < 3) {
      return NextResponse.json({ 
        error: 'Custom slug must be at least 3 characters long' 
      }, { status: 400 });
    }

    // Check maximum length
    if (slug.length > 50) {
      return NextResponse.json({ 
        error: 'Custom slug must be 50 characters or less' 
      }, { status: 400 });
    }

    // Check if slug is reserved
    if (RESERVED_ROUTES.includes(slug)) {
      return NextResponse.json({ 
        error: 'This slug is reserved and cannot be used' 
      }, { status: 400 });
    }

    // Check if slug is already taken by another affiliate
    const existingAffiliate = await prisma.affiliate.findFirst({
      where: { 
        customSlug: slug,
        id: { not: affiliate.id } // Exclude current affiliate
      },
    });

    if (existingAffiliate) {
      return NextResponse.json({ 
        error: 'This custom slug is already taken. Please choose a different one.' 
      }, { status: 400 });
    }

    // Update the affiliate with the new custom slug
    const updatedAffiliate = await prisma.affiliate.update({
      where: { id: affiliate.id },
      data: { customSlug: slug },
    });

    logger.info('Custom slug updated', {
      userId,
      affiliateId: affiliate.id,
      affiliateCode: affiliate.code,
      oldSlug: affiliate.customSlug,
      newSlug: slug,
    });

    return NextResponse.json({ 
      success: true,
      message: 'Custom slug updated successfully',
      customSlug: slug
    });

  } catch (error) {
    logger.error('Custom slug update error', {
      userId: (await auth()).userId,
      error: (error as Error).message
    });
    return NextResponse.json(
      { error: 'Failed to update custom slug' },
      { status: 500 }
    );
  }
}

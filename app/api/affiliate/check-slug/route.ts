import { NextResponse } from 'next/server';
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
    const { slug } = await req.json();

    if (!slug || typeof slug !== 'string') {
      return NextResponse.json({ 
        error: 'Slug is required' 
      }, { status: 400 });
    }

    const normalizedSlug = slug.trim().toLowerCase();

    // Check if slug is empty
    if (normalizedSlug === '') {
      return NextResponse.json({ 
        available: true,
        message: 'Slug is available'
      });
    }

    // Check slug format (only letters, numbers, and hyphens)
    if (!/^[a-z0-9-]+$/.test(normalizedSlug)) {
      return NextResponse.json({ 
        available: false,
        message: 'Slug can only contain letters, numbers, and hyphens'
      });
    }

    // Check minimum length
    if (normalizedSlug.length < 3) {
      return NextResponse.json({ 
        available: false,
        message: 'Slug must be at least 3 characters long'
      });
    }

    // Check maximum length
    if (normalizedSlug.length > 50) {
      return NextResponse.json({ 
        available: false,
        message: 'Slug must be 50 characters or less'
      });
    }

    // Check if slug is reserved
    if (RESERVED_ROUTES.includes(normalizedSlug)) {
      return NextResponse.json({ 
        available: false,
        message: 'This slug is reserved and cannot be used'
      });
    }

    // Check if slug is already taken
    const existingAffiliate = await prisma.affiliate.findUnique({
      where: { customSlug: normalizedSlug },
    });

    if (existingAffiliate) {
      return NextResponse.json({ 
        available: false,
        message: 'This slug is already taken'
      });
    }

    return NextResponse.json({ 
      available: true,
      message: 'Slug is available'
    });

  } catch (error) {
    logger.error('Error checking slug availability', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'Failed to check slug availability' },
      { status: 500 }
    );
  }
}

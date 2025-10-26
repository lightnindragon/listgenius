import { redirect } from 'next/navigation';
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

interface CustomAffiliatePageProps {
  params: {
    slug: string;
  };
}

export default async function CustomAffiliatePage({ params }: CustomAffiliatePageProps) {
  const { slug } = params;

  try {
    // Check if slug is a reserved route
    if (RESERVED_ROUTES.includes(slug.toLowerCase())) {
      logger.warn('Attempted to access reserved route as affiliate slug', { slug });
      redirect('/');
    }

    // Look up affiliate by custom slug
    const affiliate = await prisma.affiliate.findUnique({
      where: {
        customSlug: slug,
        status: 'APPROVED', // Only approved affiliates can have custom endpoints
      },
    });

    if (!affiliate) {
      logger.warn('Custom affiliate slug not found or affiliate not approved', { slug });
      redirect('/');
    }

    // Log the click
    try {
      await prisma.refClick.create({
        data: {
          affiliateCode: affiliate.code,
          ipAddress: 'unknown', // We'll get this from headers in middleware
          userAgent: 'unknown',
          referrer: 'custom-endpoint',
        },
      });

      // Update affiliate's click count
      await prisma.affiliate.update({
        where: { id: affiliate.id },
        data: {
          referralCount: {
            increment: 1,
          },
        },
      });

      logger.info('Custom affiliate endpoint accessed', {
        slug,
        affiliateCode: affiliate.code,
        affiliateId: affiliate.id,
      });
    } catch (error) {
      logger.error('Failed to log affiliate click', {
        slug,
        affiliateCode: affiliate.code,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Set affiliate cookie and redirect to home page
    // The middleware will handle the cookie setting
    redirect(`/?ref=${affiliate.code}`);

  } catch (error) {
    logger.error('Error in custom affiliate page', {
      slug,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    redirect('/');
  }
}

// Generate static params for known affiliate slugs (optional optimization)
export async function generateStaticParams() {
  try {
    const affiliates = await prisma.affiliate.findMany({
      where: {
        customSlug: {
          not: null,
        },
        status: 'APPROVED',
      },
      select: {
        customSlug: true,
      },
    });

    return affiliates
      .filter(affiliate => affiliate.customSlug)
      .map(affiliate => ({
        slug: affiliate.customSlug!,
      }));
  } catch (error) {
    logger.error('Failed to generate static params for affiliate slugs', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return [];
  }
}

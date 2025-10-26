import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

const isProtectedRoute = createRouteMatcher([
  '/app(.*)',
  '/settings(.*)',
  '/bulk(.*)',
  '/api/generate(.*)',
  '/api/etsy(.*)',
  '/api/stripe/checkout(.*)',
  '/api/stripe/portal(.*)',
  '/adm1n796(.*)'
]);

const isPublicRoute = createRouteMatcher([
  '/',
  '/pricing',
  '/legal(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/adm1n796/login',
  '/api/stripe/webhook(.*)',
  '/api/health(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  // Handle affiliate referral tracking before auth
  const url = req.nextUrl;
  const ref = url.searchParams.get('ref');
  const pathname = url.pathname;
  
  // Check for custom affiliate endpoint (single slug path like /aslmarketing)
  const pathSegments = pathname.split('/').filter(Boolean);
  const isCustomAffiliateEndpoint = pathSegments.length === 1 && !pathname.startsWith('/api');
  
  let affiliateCode = ref;
  
  // If it's a custom affiliate endpoint, look up the affiliate code
  if (isCustomAffiliateEndpoint && !ref) {
    try {
      const slug = pathSegments[0];
      const affiliate = await prisma.affiliate.findUnique({
        where: {
          customSlug: slug,
          status: 'APPROVED',
        },
        select: {
          code: true,
        },
      });
      
      if (affiliate) {
        affiliateCode = affiliate.code;
      }
    } catch (error) {
      // If database lookup fails, continue without setting affiliate cookie
      console.error('Failed to lookup affiliate by custom slug:', error);
    }
  }
  
  if (affiliateCode) {
    const COOKIE_NAME = process.env.AFFILIATE_COOKIE_NAME || 'affiliate_ref';
    const COOKIE_DAYS = Number(process.env.AFFILIATE_COOKIE_MAX_DAYS || 30);
    const maxAge = COOKIE_DAYS * 24 * 60 * 60; // Convert days to seconds
    
    const response = NextResponse.next();
    response.cookies.set(COOKIE_NAME, affiliateCode, {
      maxAge,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
    
    // Continue with auth processing
    if (isProtectedRoute(req)) {
      auth.protect();
    }
    
    return response;
  }

  // Normal auth flow
  if (isProtectedRoute(req)) {
    auth.protect();
    
    // Note: Suspension check removed to prevent circular dependency with /api/user/metadata
    // Suspension checks should be handled at the application level, not in middleware
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};

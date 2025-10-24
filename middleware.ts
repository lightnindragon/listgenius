import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

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
  if (isProtectedRoute(req)) {
    auth.protect();
    
    // Check if user is suspended (only for non-admin routes)
    if (!req.nextUrl.pathname.startsWith('/adm1n796')) {
      const { userId } = await auth();
      if (userId) {
        try {
          // Check user suspension status
          const response = await fetch(`${req.nextUrl.origin}/api/user/metadata`, {
            headers: {
              'Authorization': `Bearer ${req.headers.get('authorization')}`,
              'Cookie': req.headers.get('cookie') || '',
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data?.accountStatus === 'suspended') {
              // Redirect suspended users to sign out
              const signOutUrl = new URL('/sign-in', req.url);
              signOutUrl.searchParams.set('redirect_url', req.url);
              return NextResponse.redirect(signOutUrl);
            }
          }
        } catch (error) {
          // If we can't check suspension status, allow the request to continue
          console.error('Error checking user suspension status:', error);
        }
      }
    }
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

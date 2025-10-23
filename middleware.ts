import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/app(.*)',
  '/settings(.*)',
  '/bulk(.*)',
  '/api/generate(.*)',
  '/api/etsy(.*)',
  '/api/stripe/checkout(.*)',
  '/api/stripe/portal(.*)'
]);

const isPublicRoute = createRouteMatcher([
  '/',
  '/pricing',
  '/legal(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/stripe/webhook(.*)',
  '/api/health(.*)'
]);

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) {
    auth.protect();
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

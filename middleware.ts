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

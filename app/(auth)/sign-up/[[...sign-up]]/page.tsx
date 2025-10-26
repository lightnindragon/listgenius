'use client';

import { SignUp } from '@clerk/nextjs';
import { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';

export default function SignUpPage() {
  const { isSignedIn } = useAuth();

  useEffect(() => {
    // Debug: Check if Clerk is loaded
    console.log('SignUp page loaded');
    console.log('Clerk publishable key:', process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? 'Present' : 'Missing');
    console.log('Current URL:', window.location.href);
    console.log('Current pathname:', window.location.pathname);
    
    // Check for any global errors
    window.addEventListener('error', (e) => {
      console.error('Global error on signup page:', e.error);
    });

    // Check if we're actually on the sign-up page
    if (window.location.pathname !== '/sign-up') {
      console.warn('Not on sign-up page, current path:', window.location.pathname);
    }
  }, []);

  // Handle affiliate onboarding after successful signup
  useEffect(() => {
    if (isSignedIn) {
      // Call affiliate onboarding API
      fetch('/api/user/onboard', { method: 'POST' })
        .then(response => {
          if (response.ok) {
            console.log('Affiliate onboarding completed');
          } else {
            console.error('Affiliate onboarding failed');
          }
        })
        .catch(error => {
          console.error('Affiliate onboarding error:', error);
        });
    }
  }, [isSignedIn]);

  // Get redirect URL from query parameters
  const getRedirectUrl = () => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const redirect = urlParams.get('redirect');
      if (redirect) {
        return decodeURIComponent(redirect);
      }
    }
    return '/app';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Start generating AI-optimized Etsy listings
          </p>
        </div>
        <div className="flex justify-center">
          <SignUp 
            appearance={{
              elements: {
                formButtonPrimary: 'bg-brand-600 hover:bg-brand-700 text-white',
                card: 'shadow-lg',
                headerTitle: 'text-gray-900',
                headerSubtitle: 'text-gray-600',
                socialButtonsBlockButton: 'border border-gray-300 hover:bg-gray-50',
                socialButtonsBlockButtonText: 'text-gray-700',
                formFieldInput: 'border border-gray-300 focus:border-brand-500 focus:ring-brand-500',
                footerActionLink: 'text-brand-600 hover:text-brand-700',
                identityPreviewText: 'text-gray-600',
                formResendCodeLink: 'text-brand-600 hover:text-brand-700',
                otpCodeFieldInput: 'border border-gray-300 focus:border-brand-500 focus:ring-brand-500',
              }
            }}
            afterSignUpUrl={getRedirectUrl()}
            redirectUrl={getRedirectUrl()}
            signInUrl="/sign-in"
          />
        </div>
      </div>
    </div>
  );
}

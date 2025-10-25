'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { trackPageView, trackEvent, GA4_MEASUREMENT_ID } from '@/lib/analytics';

interface AnalyticsContextType {
  trackEvent: (eventName: string, parameters?: Record<string, any>) => void;
  trackUserAction: (action: string, category: string, label?: string, value?: number) => void;
  trackListingGeneration: (plan: string, wordCount: number, tone: string) => void;
  trackPlanUpgrade: (fromPlan: string, toPlan: string, value?: number) => void;
  trackFeatureUsage: (feature: string, plan: string) => void;
  trackError: (error: string, category?: string) => void;
  trackEngagement: (action: string, element?: string) => void;
  isInitialized: boolean;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Debug: Log all environment variables
    console.log('🔍 GA4 Debug - All env vars:', {
      GA4_MEASUREMENT_ID,
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_GA4_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID,
      NEXT_PUBLIC_ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS,
      ALL_NEXT_PUBLIC_VARS: Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_'))
    });

    // Check analytics flag first
    const analyticsEnabled = process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true';
    console.log('🎯 Analytics enabled check:', {
      rawValue: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS,
      isEnabled: analyticsEnabled,
      type: typeof process.env.NEXT_PUBLIC_ENABLE_ANALYTICS
    });

    if (!analyticsEnabled) {
      console.warn('⚠️ Analytics is disabled via NEXT_PUBLIC_ENABLE_ANALYTICS flag');
      return;
    }

    // Check environment variable
    if (!GA4_MEASUREMENT_ID) {
      console.error('❌ GA4_MEASUREMENT_ID is not set in environment variables');
      console.error('Current value:', GA4_MEASUREMENT_ID);
      console.error('Please add NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX to your Vercel environment variables');
      return;
    }

    // Check if running in browser
    if (typeof window === 'undefined') {
      console.log('🌐 GA4 will be initialized on client side');
      return;
    }

    console.log('✅ GA4 measurement ID found:', GA4_MEASUREMENT_ID);
    console.log('🚀 GA4 will be initialized via Next.js Script components');
    
    // Set initialized to true - the Script components will handle the actual initialization
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    // Track page views on route changes
    if (isInitialized && pathname) {
      trackPageView(pathname);
    }
  }, [pathname, isInitialized]);

  const analyticsMethods = {
    trackEvent: (eventName: string, parameters?: Record<string, any>) => {
      if (isInitialized) {
        trackEvent(eventName, parameters);
      }
    },
    trackUserAction: (action: string, category: string, label?: string, value?: number) => {
      if (isInitialized) {
        trackEvent(action, {
          category,
          label,
          value,
        });
      }
    },
    trackListingGeneration: (plan: string, wordCount: number, tone: string) => {
      if (isInitialized) {
        trackEvent('listing_generated', {
          category: 'listing',
          plan,
          word_count: wordCount,
          tone,
          value: 1,
        });
      }
    },
    trackPlanUpgrade: (fromPlan: string, toPlan: string, value?: number) => {
      if (isInitialized) {
        trackEvent('plan_upgrade', {
          category: 'conversion',
          from_plan: fromPlan,
          to_plan: toPlan,
          value,
        });
      }
    },
    trackFeatureUsage: (feature: string, plan: string) => {
      if (isInitialized) {
        trackEvent('feature_used', {
          category: 'feature',
          feature_name: feature,
          plan,
        });
      }
    },
    trackError: (error: string, category: string = 'error') => {
      if (isInitialized) {
        trackEvent('error_occurred', {
          category,
          error_message: error,
        });
      }
    },
    trackEngagement: (action: string, element?: string) => {
      if (isInitialized) {
        trackEvent('user_engagement', {
          category: 'engagement',
          action,
          element,
        });
      }
    },
    isInitialized,
  };

  return (
    <AnalyticsContext.Provider value={analyticsMethods}>
      {GA4_MEASUREMENT_ID && (
        <>
          <Script
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`}
            onLoad={() => {
              console.log('GA4 script loaded successfully');
            }}
            onError={() => {
              console.error('Failed to load GA4 script');
            }}
          />
          <Script
            id="google-analytics"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                console.log('🚀 Initializing GA4 with measurement ID: ${GA4_MEASUREMENT_ID}');
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                window.gtag = gtag;
                gtag('js', new Date());
                gtag('config', '${GA4_MEASUREMENT_ID}', {
                  page_path: window.location.pathname,
                  send_page_view: true,
                  debug_mode: true
                });
                console.log('✅ GA4 initialized successfully');
                console.log('📊 DataLayer:', window.dataLayer);
                console.log('🌐 Current URL:', window.location.href);
                
                // Test event to verify GA4 is working
                gtag('event', 'ga4_initialized', {
                  event_category: 'debug',
                  event_label: 'GA4_test',
                  value: 1
                });
                
                // Additional test events
                setTimeout(() => {
                  gtag('event', 'page_view_test', {
                    event_category: 'debug',
                    event_label: 'Page View Test',
                    value: 1
                  });
                  console.log('📈 Test events sent to GA4');
                }, 1000);
              `,
            }}
          />
        </>
      )}
      {children}
    </AnalyticsContext.Provider>
  );
};

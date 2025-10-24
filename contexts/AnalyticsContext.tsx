'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { initGA, trackPageView, trackEvent, GA4_MEASUREMENT_ID } from '@/lib/analytics';

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
    // Initialize GA4
    if (GA4_MEASUREMENT_ID && typeof window !== 'undefined') {
      initGA();
      setIsInitialized(true);
      console.log('GA4 initialized with measurement ID:', GA4_MEASUREMENT_ID);
    } else {
      console.warn('GA4 not initialized - missing measurement ID or running on server');
    }
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
          />
          <Script
            id="google-analytics"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA4_MEASUREMENT_ID}', {
                  page_path: window.location.pathname,
                });
              `,
            }}
          />
        </>
      )}
      {children}
    </AnalyticsContext.Provider>
  );
};

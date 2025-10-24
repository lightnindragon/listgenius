// Google Analytics 4 utility functions
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

export const GA4_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;

// Initialize Google Analytics
export const initGA = () => {
  if (!GA4_MEASUREMENT_ID) {
    console.warn('GA4_MEASUREMENT_ID not found in environment variables');
    return;
  }

  // Load Google Analytics script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize gtag
  window.gtag = window.gtag || function() {
    (window.gtag as any).q = (window.gtag as any).q || [];
    (window.gtag as any).q.push(arguments);
  };

  window.gtag('js', new Date());
  window.gtag('config', GA4_MEASUREMENT_ID, {
    page_title: document.title,
    page_location: window.location.href,
  });
};

// Track page views
export const trackPageView = (url: string, title?: string) => {
  if (!GA4_MEASUREMENT_ID || !window.gtag) return;

  window.gtag('config', GA4_MEASUREMENT_ID, {
    page_path: url,
    page_title: title || document.title,
  });
};

// Track custom events
export const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (!GA4_MEASUREMENT_ID || !window.gtag) return;

  window.gtag('event', eventName, {
    ...parameters,
    event_category: parameters?.category || 'engagement',
    event_label: parameters?.label,
    value: parameters?.value,
  });
};

// Track user actions
export const trackUserAction = (action: string, category: string, label?: string, value?: number) => {
  trackEvent(action, {
    category,
    label,
    value,
  });
};

// Track listing generation
export const trackListingGeneration = (plan: string, wordCount: number, tone: string) => {
  trackEvent('listing_generated', {
    category: 'listing',
    plan,
    word_count: wordCount,
    tone,
    value: 1,
  });
};

// Track plan upgrades
export const trackPlanUpgrade = (fromPlan: string, toPlan: string, value?: number) => {
  trackEvent('plan_upgrade', {
    category: 'conversion',
    from_plan: fromPlan,
    to_plan: toPlan,
    value,
  });
};

// Track feature usage
export const trackFeatureUsage = (feature: string, plan: string) => {
  trackEvent('feature_used', {
    category: 'feature',
    feature_name: feature,
    plan,
  });
};

// Track errors
export const trackError = (error: string, category: string = 'error') => {
  trackEvent('error_occurred', {
    category,
    error_message: error,
  });
};

// Track user engagement
export const trackEngagement = (action: string, element?: string) => {
  trackEvent('user_engagement', {
    category: 'engagement',
    action,
    element,
  });
};
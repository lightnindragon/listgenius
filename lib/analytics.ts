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

// System analytics for admin dashboard
export const getSystemAnalytics = async () => {
  // This is a placeholder implementation
  // In a real application, you would fetch this data from your database
  // or analytics service (like GA4 Reporting API)
  
  return {
    userGrowth: [
      { date: '2025-01-01', users: 100, newUsers: 10 },
      { date: '2025-01-02', users: 110, newUsers: 15 },
      { date: '2025-01-03', users: 125, newUsers: 12 },
    ],
    totalUsers: 125,
    activeUsers: 89,
    totalGenerations: 1250,
    totalRevenue: 0,
    conversionRate: 0.05,
    averageSessionDuration: 8.5,
    bounceRate: 0.35,
  };
};

// Track generation (for API routes)
export const trackGeneration = (userId: string, plan: string, wordCount: number, tone: string) => {
  trackEvent('listing_generated', {
    category: 'listing',
    user_id: userId,
    plan,
    word_count: wordCount,
    tone,
    value: 1,
  });
};

// Track plan change (for admin)
export const trackPlanChange = (userId: string, fromPlan: string, toPlan: string, adminId: string) => {
  trackEvent('plan_changed_admin', {
    category: 'admin_action',
    user_id: userId,
    from_plan: fromPlan,
    to_plan: toPlan,
    admin_id: adminId,
  });
};

// Get user analytics (for admin dashboard)
export const getUserAnalytics = async (userId: string) => {
  // This is a placeholder implementation
  // In a real application, you would fetch this data from your database
  
  return {
    userId,
    totalGenerations: 25,
    totalRewrites: 5,
    plan: 'pro',
    joinDate: '2025-01-01',
    lastActive: '2025-01-15',
    totalSessions: 45,
    averageSessionDuration: 12.5,
  };
};
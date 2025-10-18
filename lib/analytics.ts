import { logger } from './logger';

/**
 * Simple event tracking (logs to console for MVP, Supabase-ready)
 */

export interface AnalyticsEvent {
  userId: string;
  event: string;
  metadata?: Record<string, any>;
  timestamp?: string;
}

export enum AnalyticsEvents {
  GENERATION_CREATED = 'generation_created',
  REWRITE_CREATED = 'rewrite_created',
  ETSY_CONNECTED = 'etsy_connected',
  ETSY_DISCONNECTED = 'etsy_disconnected',
  PLAN_UPGRADED = 'plan_upgraded',
  PLAN_DOWNGRADED = 'plan_downgraded',
  RATE_LIMIT_HIT = 'rate_limit_hit',
  LISTING_PUBLISHED = 'listing_published',
  BULK_GENERATION_STARTED = 'bulk_generation_started',
  BULK_GENERATION_COMPLETED = 'bulk_generation_completed',
  BULK_PUBLISH_STARTED = 'bulk_publish_started',
  BULK_PUBLISH_COMPLETED = 'bulk_publish_completed',
  SETTINGS_UPDATED = 'settings_updated',
  SIGN_UP = 'sign_up',
  SIGN_IN = 'sign_in'
}

class Analytics {
  private isDevelopment = process.env.NODE_ENV === 'development';

  /**
   * Track an event
   */
  async trackEvent(userId: string, event: string, metadata?: Record<string, any>): Promise<void> {
    const analyticsEvent: AnalyticsEvent = {
      userId,
      event,
      metadata,
      timestamp: new Date().toISOString()
    };

    // Log to console for MVP
    logger.info('Analytics event', analyticsEvent);

    // TODO: In the future, send to Supabase or other analytics service
    // await this.sendToAnalyticsService(analyticsEvent);
  }

  /**
   * Track generation created
   */
  async trackGenerationCreated(userId: string, metadata?: {
    model: string;
    tokensUsed: number;
    wordCount: number;
    hasExtras: boolean;
  }): Promise<void> {
    await this.trackEvent(userId, AnalyticsEvents.GENERATION_CREATED, metadata);
  }

  /**
   * Track rewrite created
   */
  async trackRewriteCreated(userId: string, metadata?: {
    model: string;
    tokensUsed: number;
    originalWordCount: number;
    newWordCount: number;
  }): Promise<void> {
    await this.trackEvent(userId, AnalyticsEvents.REWRITE_CREATED, metadata);
  }

  /**
   * Track Etsy connection
   */
  async trackEtsyConnected(userId: string, metadata?: {
    shopId: string;
    shopName: string;
  }): Promise<void> {
    await this.trackEvent(userId, AnalyticsEvents.ETSY_CONNECTED, metadata);
  }

  /**
   * Track plan upgrade
   */
  async trackPlanUpgraded(userId: string, metadata?: {
    fromPlan: string;
    toPlan: string;
    amount: number;
  }): Promise<void> {
    await this.trackEvent(userId, AnalyticsEvents.PLAN_UPGRADED, metadata.data);
  }

  /**
   * Track rate limit hit
   */
  async trackRateLimitHit(userId: string, metadata?: {
    limitType: string;
    currentCount: number;
    limit: number;
  }): Promise<void> {
    await this.trackEvent(userId, AnalyticsEvents.RATE_LIMIT_HIT, metadata);
  }

  /**
   * Track listing published
   */
  async trackListingPublished(userId: string, metadata?: {
    listingId: string;
    isNewListing: boolean;
    hasImages: boolean;
    imageCount: number;
  }): Promise<void> {
    await this.trackEvent(userId, AnalyticsEvents.LISTING_PUBLISHED, metadata);
  }

  /**
   * Track bulk generation
   */
  async trackBulkGenerationStarted(userId: string, metadata?: {
    productCount: number;
    plan: string;
  }): Promise<void> {
    await this.trackEvent(userId, AnalyticsEvents.BULK_GENERATION_STARTED, metadata);
  }

  async trackBulkGenerationCompleted(userId: string, metadata?: {
    productCount: number;
    successCount: number;
    failureCount: number;
    totalTokensUsed: number;
  }): Promise<void> {
    await this.trackEvent(userId, AnalyticsEvents.BULK_GENERATION_COMPLETED, metadata);
  }

  /**
   * Track settings update
   */
  async trackSettingsUpdated(userId: string, metadata?: {
    updatedFields: string[];
  }): Promise<void> {
    await this.trackEvent(userId, AnalyticsEvents.SETTINGS_UPDATED, metadata);
  }

  // Future: Send to analytics service
  // private async sendToAnalyticsService(event: AnalyticsEvent): Promise<void> {
  //   // Implementation for Supabase or other analytics service
  // }
}

export const analytics = new Analytics();

/**
 * Convenience function for tracking events
 */
export async function trackEvent(userId: string, event: string, metadata?: Record<string, any>): Promise<void> {
  return analytics.trackEvent(userId, event, metadata);
}

/**
 * Convenience function for tracking generation created
 */
export async function trackGenerationCreated(userId: string, metadata?: {
  model: string;
  tokensUsed: number;
  wordCount: number;
  hasExtras: boolean;
}): Promise<void> {
  return analytics.trackGenerationCreated(userId, metadata);
}

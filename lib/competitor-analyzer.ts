/**
 * Competitor Analysis System
 * Track and analyze competitor shops for strategic insights
 */

import { EtsyClient } from './etsy';
import { logger } from './logger';
import { db } from './db';
import { keywordCache } from './redis';

export interface CompetitorShop {
  shopId: number;
  shopName: string;
  shopUrl: string;
  totalListings: number;
  activeListings: number;
  estimatedSales: number;
  estimatedRevenue: number;
  averagePrice: number;
  topCategories: string[];
  topKeywords: string[];
  pricingStrategy: 'premium' | 'mid-range' | 'budget';
  listingFrequency: 'high' | 'medium' | 'low';
  shopAge: number;
  lastAnalyzed: string;
}

export interface CompetitorSnapshot {
  competitorId: string;
  date: string;
  activeListings: number;
  newListings: number;
  priceChanges: number;
  topKeywords: string[];
  averagePrice: number;
  estimatedSales: number;
  marketShare: number;
  threatLevel: 'low' | 'medium' | 'high';
}

export interface CompetitorComparison {
  competitorId: string;
  shopName: string;
  comparison: {
    listingCount: { competitor: number; yourShop: number; difference: number };
    averagePrice: { competitor: number; yourShop: number; difference: number };
    estimatedRevenue: { competitor: number; yourShop: number; difference: number };
    topKeywords: { shared: string[]; competitorOnly: string[]; yourShopOnly: string[] };
  };
  opportunities: string[];
  threats: string[];
}

export interface CompetitorAlert {
  competitorId: string;
  shopName: string;
  alertType: 'new_listing' | 'price_change' | 'keyword_change' | 'sales_spike' | 'new_category';
  message: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
  details: any;
}

export class CompetitorAnalyzer {
  private etsyClient: EtsyClient | null = null;
  private isMockMode: boolean;

  constructor(accessToken?: string, refreshToken?: string) {
    this.isMockMode = process.env.ETSY_MOCK_MODE === 'true';
    
    if (!this.isMockMode && accessToken) {
      this.etsyClient = new EtsyClient(accessToken, refreshToken);
    }
  }

  /**
   * Add a competitor shop to tracking
   */
  async addCompetitor(userId: string, shopId: number): Promise<void> {
    try {
      // Check if competitor already exists
      const existing = await db.competitorShop.findUnique({
        where: { shopId: BigInt(shopId) },
      });

      if (existing) {
        throw new Error('Competitor already being tracked');
      }

      // Get shop information
      let shopInfo: CompetitorShop;
      if (this.isMockMode || !this.etsyClient) {
        shopInfo = this.getMockShopInfo(shopId);
      } else {
        shopInfo = await this.fetchShopInfo(shopId);
      }

      // Store competitor in database
      await db.competitorShop.create({
        data: {
          userId,
          shopId: BigInt(shopId),
          shopName: shopInfo.shopName,
          addedAt: new Date(),
        },
      });

      // Create initial snapshot
      await this.createSnapshot(userId, shopId, shopInfo);

      logger.info('Competitor added to tracking', { userId, shopId, shopName: shopInfo.shopName });
    } catch (error) {
      logger.error('Failed to add competitor', { userId, shopId, error });
      throw error;
    }
  }

  /**
   * Remove a competitor from tracking
   */
  async removeCompetitor(userId: string, shopId: number): Promise<void> {
    try {
      await db.competitorShop.deleteMany({
        where: {
          userId,
          shopId: BigInt(shopId),
        },
      });

      logger.info('Competitor removed from tracking', { userId, shopId });
    } catch (error) {
      logger.error('Failed to remove competitor', { userId, shopId, error });
      throw error;
    }
  }

  /**
   * Get all tracked competitors for a user
   */
  async getTrackedCompetitors(userId: string): Promise<CompetitorShop[]> {
    try {
      const competitors = await db.competitorShop.findMany({
        where: { userId },
        include: {
          snapshots: {
            orderBy: { date: 'desc' },
            take: 1,
          },
        },
      });

      const competitorShops: CompetitorShop[] = [];

      for (const competitor of competitors) {
        const latestSnapshot = competitor.snapshots[0];
        
        if (latestSnapshot) {
          const shopInfo: CompetitorShop = {
            shopId: Number(competitor.shopId),
            shopName: competitor.shopName,
            shopUrl: `https://www.etsy.com/shop/${competitor.shopName}`,
            totalListings: latestSnapshot.activeListings,
            activeListings: latestSnapshot.activeListings,
            estimatedSales: latestSnapshot.estimatedSales || 0,
            estimatedRevenue: (latestSnapshot.estimatedSales || 0) * (latestSnapshot.avgPrice || 0),
            averagePrice: latestSnapshot.avgPrice || 0,
            topCategories: [], // Would be populated from analysis
            topKeywords: latestSnapshot.topKeywords,
            pricingStrategy: this.determinePricingStrategy(latestSnapshot.avgPrice || 0),
            listingFrequency: this.determineListingFrequency(latestSnapshot.activeListings),
            shopAge: Math.floor((Date.now() - competitor.addedAt.getTime()) / (1000 * 60 * 60 * 24)),
            lastAnalyzed: competitor.addedAt.toISOString(),
          };

          competitorShops.push(shopInfo);
        }
      }

      logger.info('Tracked competitors retrieved', { userId, count: competitorShops.length });
      return competitorShops;
    } catch (error) {
      logger.error('Failed to get tracked competitors', { userId, error });
      throw error;
    }
  }

  /**
   * Analyze competitor performance
   */
  async analyzeCompetitor(userId: string, shopId: number): Promise<CompetitorSnapshot> {
    try {
      // Get current shop information
      let shopInfo: CompetitorShop;
      if (this.isMockMode || !this.etsyClient) {
        shopInfo = this.getMockShopInfo(shopId);
      } else {
        shopInfo = await this.fetchShopInfo(shopId);
      }

      // Get previous snapshot for comparison
      const previousSnapshot = await this.getLatestSnapshot(userId, shopId);

      // Calculate changes
      const newListings = previousSnapshot ? 
        Math.max(0, shopInfo.activeListings - previousSnapshot.activeListings) : 0;
      
      const priceChanges = previousSnapshot ? 
        Math.abs((shopInfo.averagePrice - previousSnapshot.avgPrice) / previousSnapshot.avgPrice) * 100 : 0;

      // Determine threat level
      const threatLevel = this.calculateThreatLevel(shopInfo, previousSnapshot);

      // Create new snapshot
      const snapshot: CompetitorSnapshot = {
        competitorId: '', // Will be set by database
        date: new Date().toISOString(),
        activeListings: shopInfo.activeListings,
        newListings,
        priceChanges,
        topKeywords: shopInfo.topKeywords,
        averagePrice: shopInfo.averagePrice,
        estimatedSales: shopInfo.estimatedSales,
        marketShare: 0, // Would be calculated based on market analysis
        threatLevel,
      };

      // Store snapshot
      await this.createSnapshot(userId, shopId, shopInfo);

      logger.info('Competitor analyzed', { userId, shopId, snapshot });
      return snapshot;
    } catch (error) {
      logger.error('Failed to analyze competitor', { userId, shopId, error });
      throw error;
    }
  }

  /**
   * Compare competitor with user's shop
   */
  async compareCompetitor(userId: string, shopId: number): Promise<CompetitorComparison> {
    try {
      // Get competitor information
      const competitor = await this.getCompetitorInfo(userId, shopId);
      
      // Get user's shop metrics (mock for now)
      const userShopMetrics = await this.getUserShopMetrics(userId);

      // Calculate differences
      const comparison = {
        listingCount: {
          competitor: competitor.activeListings,
          yourShop: userShopMetrics.totalListings,
          difference: competitor.activeListings - userShopMetrics.totalListings,
        },
        averagePrice: {
          competitor: competitor.averagePrice,
          yourShop: userShopMetrics.averagePrice,
          difference: competitor.averagePrice - userShopMetrics.averagePrice,
        },
        estimatedRevenue: {
          competitor: competitor.estimatedRevenue,
          yourShop: userShopMetrics.estimatedRevenue,
          difference: competitor.estimatedRevenue - userShopMetrics.estimatedRevenue,
        },
        topKeywords: {
          shared: this.findSharedKeywords(competitor.topKeywords, userShopMetrics.topKeywords),
          competitorOnly: this.findUniqueKeywords(competitor.topKeywords, userShopMetrics.topKeywords),
          yourShopOnly: this.findUniqueKeywords(userShopMetrics.topKeywords, competitor.topKeywords),
        },
      };

      // Generate opportunities and threats
      const opportunities = this.generateOpportunities(comparison);
      const threats = this.generateThreats(comparison);

      const result: CompetitorComparison = {
        competitorId: shopId.toString(),
        shopName: competitor.shopName,
        comparison,
        opportunities,
        threats,
      };

      logger.info('Competitor comparison generated', { userId, shopId, comparison });
      return result;
    } catch (error) {
      logger.error('Failed to compare competitor', { userId, shopId, error });
      throw error;
    }
  }

  /**
   * Generate competitor alerts
   */
  async generateAlerts(userId: string): Promise<CompetitorAlert[]> {
    try {
      const alerts: CompetitorAlert[] = [];
      
      // Get all tracked competitors
      const competitors = await db.competitorShop.findMany({
        where: { userId },
        include: {
          snapshots: {
            orderBy: { date: 'desc' },
            take: 2,
          },
        },
      });

      for (const competitor of competitors) {
        if (competitor.snapshots.length >= 2) {
          const current = competitor.snapshots[0];
          const previous = competitor.snapshots[1];

          // Check for new listings
          if (current.activeListings > previous.activeListings) {
            alerts.push({
              competitorId: competitor.id,
              shopName: competitor.shopName,
              alertType: 'new_listing',
              message: `${competitor.shopName} added ${current.activeListings - previous.activeListings} new listings`,
              severity: 'medium',
              timestamp: new Date().toISOString(),
              details: { newListings: current.activeListings - previous.activeListings },
            });
          }

          // Check for price changes
          if (current.avgPrice && previous.avgPrice) {
            const priceChange = Math.abs(current.avgPrice - previous.avgPrice) / previous.avgPrice;
            if (priceChange > 0.1) { // 10% change
              alerts.push({
                competitorId: competitor.id,
                shopName: competitor.shopName,
                alertType: 'price_change',
                message: `${competitor.shopName} changed average price by ${(priceChange * 100).toFixed(1)}%`,
                severity: 'low',
                timestamp: new Date().toISOString(),
                details: { priceChange: priceChange * 100 },
              });
            }
          }
        }
      }

      logger.info('Competitor alerts generated', { userId, alertCount: alerts.length });
      return alerts;
    } catch (error) {
      logger.error('Failed to generate competitor alerts', { userId, error });
      throw error;
    }
  }

  /**
   * Helper methods
   */
  private async createSnapshot(userId: string, shopId: number, shopInfo: CompetitorShop): Promise<void> {
    const competitor = await db.competitorShop.findUnique({
      where: { shopId: BigInt(shopId) },
    });

    if (competitor) {
      await db.competitorSnapshot.create({
        data: {
          competitorShopId: competitor.id,
          date: new Date(),
          activeListings: shopInfo.activeListings,
          avgPrice: shopInfo.averagePrice,
          estimatedSales: shopInfo.estimatedSales,
          topKeywords: shopInfo.topKeywords,
        },
      });
    }
  }

  private async getLatestSnapshot(userId: string, shopId: number): Promise<any> {
    const competitor = await db.competitorShop.findUnique({
      where: { shopId: BigInt(shopId) },
      include: {
        snapshots: {
          orderBy: { date: 'desc' },
          take: 1,
        },
      },
    });

    return competitor?.snapshots[0] || null;
  }

  private async getCompetitorInfo(userId: string, shopId: number): Promise<CompetitorShop> {
    // This would fetch real competitor data
    return this.getMockShopInfo(shopId);
  }

  private async getUserShopMetrics(userId: string): Promise<any> {
    // Mock user shop metrics
    return {
      totalListings: 25,
      averagePrice: 30,
      estimatedRevenue: 750,
      topKeywords: ['handmade', 'unique', 'gift', 'artisan'],
    };
  }

  private determinePricingStrategy(averagePrice: number): 'premium' | 'mid-range' | 'budget' {
    if (averagePrice > 50) return 'premium';
    if (averagePrice > 20) return 'mid-range';
    return 'budget';
  }

  private determineListingFrequency(listingCount: number): 'high' | 'medium' | 'low' {
    if (listingCount > 100) return 'high';
    if (listingCount > 50) return 'medium';
    return 'low';
  }

  private calculateThreatLevel(shopInfo: CompetitorShop, previousSnapshot: any): 'low' | 'medium' | 'high' {
    let threatScore = 0;

    // Revenue threat
    if (shopInfo.estimatedRevenue > 10000) threatScore += 3;
    else if (shopInfo.estimatedRevenue > 5000) threatScore += 2;
    else if (shopInfo.estimatedRevenue > 1000) threatScore += 1;

    // Listing count threat
    if (shopInfo.activeListings > 200) threatScore += 2;
    else if (shopInfo.activeListings > 100) threatScore += 1;

    // Growth threat
    if (previousSnapshot && shopInfo.activeListings > previousSnapshot.activeListings * 1.2) {
      threatScore += 2;
    }

    if (threatScore >= 5) return 'high';
    if (threatScore >= 3) return 'medium';
    return 'low';
  }

  private findSharedKeywords(keywords1: string[], keywords2: string[]): string[] {
    return keywords1.filter(keyword => keywords2.includes(keyword));
  }

  private findUniqueKeywords(keywords1: string[], keywords2: string[]): string[] {
    return keywords1.filter(keyword => !keywords2.includes(keyword));
  }

  private generateOpportunities(comparison: any): string[] {
    const opportunities = [];

    if (comparison.topKeywords.competitorOnly.length > 0) {
      opportunities.push(`Consider targeting competitor keywords: ${comparison.topKeywords.competitorOnly.slice(0, 3).join(', ')}`);
    }

    if (comparison.averagePrice.difference > 10) {
      opportunities.push(`Competitor charges ${comparison.averagePrice.difference.toFixed(2)} more - consider price optimization`);
    }

    if (comparison.listingCount.difference < -20) {
      opportunities.push('Competitor has significantly more listings - consider expanding your catalog');
    }

    return opportunities;
  }

  private generateThreats(comparison: any): string[] {
    const threats = [];

    if (comparison.estimatedRevenue.difference > 5000) {
      threats.push('Competitor has significantly higher revenue - monitor their strategies');
    }

    if (comparison.listingCount.difference > 50) {
      threats.push('Competitor has many more listings - they may be dominating search results');
    }

    if (comparison.averagePrice.difference < -10) {
      threats.push('Competitor is undercutting prices - consider value differentiation');
    }

    return threats;
  }

  private async fetchShopInfo(shopId: number): Promise<CompetitorShop> {
    if (!this.etsyClient) {
      throw new Error('Etsy client not initialized');
    }

    // This would fetch real shop data from Etsy API
    // For now, return mock data
    return this.getMockShopInfo(shopId);
  }

  private getMockShopInfo(shopId: number): CompetitorShop {
    return {
      shopId,
      shopName: `CompetitorShop${shopId}`,
      shopUrl: `https://www.etsy.com/shop/CompetitorShop${shopId}`,
      totalListings: Math.floor(Math.random() * 200) + 50,
      activeListings: Math.floor(Math.random() * 200) + 50,
      estimatedSales: Math.floor(Math.random() * 1000) + 100,
      estimatedRevenue: Math.floor(Math.random() * 25000) + 2500,
      averagePrice: Math.floor(Math.random() * 50) + 15,
      topCategories: ['Home & Living', 'Jewelry', 'Art & Collectibles'],
      topKeywords: ['handmade', 'unique', 'gift', 'artisan', 'vintage'],
      pricingStrategy: 'mid-range',
      listingFrequency: 'medium',
      shopAge: Math.floor(Math.random() * 365) + 30,
      lastAnalyzed: new Date().toISOString(),
    };
  }
}

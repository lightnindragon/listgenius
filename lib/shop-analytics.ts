/**
 * Shop Analytics Engine
 * Comprehensive analytics for Etsy shop performance
 */

import { logger } from './logger';
import { db } from './db';
import { keywordCache } from './redis';

export interface ShopAnalyticsOverview {
  totalListings: number;
  activeListings: number;
  totalViews: number;
  totalFavorites: number;
  totalSales: number;
  totalRevenue: number;
  averageListingPrice: number;
  conversionRate: number;
  averageViewsPerListing: number;
  topPerformingListings: Array<{
    listingId: number;
    title: string;
    views: number;
    favorites: number;
    revenue: number;
  }>;
  performanceTrends: {
    views: { current: number; previous: number; change: number };
    favorites: { current: number; previous: number; change: number };
    sales: { current: number; previous: number; change: number };
    revenue: { current: number; previous: number; change: number };
  };
}

export interface ListingAnalytics {
  listingId: number;
  title: string;
  views: number;
  favorites: number;
  sales: number;
  revenue: number;
  conversionRate: number;
  averagePrice: number;
  tags: string[];
  materials: string[];
  category: string;
  performanceScore: number;
  trend: 'improving' | 'declining' | 'stable';
  recommendations: string[];
  lastUpdated: string;
}

export interface KeywordAnalytics {
  keyword: string;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  revenue: number;
  averagePosition: number;
  trend: 'improving' | 'declining' | 'stable';
  opportunity: number;
  difficulty: number;
  recommendations: string[];
}

export interface CompetitorAnalytics {
  competitorId: string;
  shopName: string;
  totalListings: number;
  averagePrice: number;
  estimatedRevenue: number;
  topKeywords: string[];
  marketShare: number;
  threatLevel: 'low' | 'medium' | 'high';
  lastAnalyzed: string;
}

export interface ABTestResult {
  testId: string;
  name: string;
  status: 'running' | 'completed' | 'paused';
  startDate: string;
  endDate?: string;
  variants: Array<{
    name: string;
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
    ctr: number;
    conversionRate: number;
  }>;
  winner?: string;
  confidence: number;
  improvement: number;
}

export class ShopAnalyticsEngine {
  /**
   * Get comprehensive shop analytics overview
   */
  async getShopOverview(userId: string, period: '7d' | '30d' | '90d' = '30d'): Promise<ShopAnalyticsOverview> {
    try {
      // Get date range
      const { startDate, endDate } = this.getDateRange(period);
      
      // Get current period data
      const currentData = await this.getShopMetrics(userId, startDate, endDate);
      
      // Get previous period data for comparison
      const previousStartDate = new Date(startDate);
      const previousEndDate = new Date(endDate);
      const periodLength = endDate.getTime() - startDate.getTime();
      
      previousEndDate.setTime(startDate.getTime());
      previousStartDate.setTime(startDate.getTime() - periodLength);
      
      const previousData = await this.getShopMetrics(userId, previousStartDate, previousEndDate);
      
      // Calculate trends
      const performanceTrends = {
        views: {
          current: currentData.totalViews,
          previous: previousData.totalViews,
          change: this.calculatePercentageChange(currentData.totalViews, previousData.totalViews),
        },
        favorites: {
          current: currentData.totalFavorites,
          previous: previousData.totalFavorites,
          change: this.calculatePercentageChange(currentData.totalFavorites, previousData.totalFavorites),
        },
        sales: {
          current: currentData.totalSales,
          previous: previousData.totalSales,
          change: this.calculatePercentageChange(currentData.totalSales, previousData.totalSales),
        },
        revenue: {
          current: currentData.totalRevenue,
          previous: previousData.totalRevenue,
          change: this.calculatePercentageChange(currentData.totalRevenue, previousData.totalRevenue),
        },
      };
      
      // Get top performing listings
      const topPerformingListings = await this.getTopPerformingListings(userId, startDate, endDate);
      
      const overview: ShopAnalyticsOverview = {
        ...currentData,
        performanceTrends,
        topPerformingListings,
      };
      
      // Cache the result
      await keywordCache.set(`analytics:overview:${userId}:${period}`, overview, 1800); // 30 minutes
      
      logger.info('Shop analytics overview generated', {
        userId,
        period,
        totalListings: overview.totalListings,
        totalRevenue: overview.totalRevenue,
      });
      
      return overview;
    } catch (error) {
      logger.error('Failed to get shop analytics overview', { userId, period, error });
      throw error;
    }
  }
  
  /**
   * Get detailed listing analytics
   */
  async getListingAnalytics(
    userId: string,
    listingIds?: number[],
    period: '7d' | '30d' | '90d' = '30d'
  ): Promise<ListingAnalytics[]> {
    try {
      const { startDate, endDate } = this.getDateRange(period);
      
      // Get listing performance data
      const performanceData = await this.getListingPerformanceData(userId, listingIds, startDate, endDate);
      
      // Calculate analytics for each listing
      const analytics: ListingAnalytics[] = [];
      
      for (const listing of performanceData) {
        const analyticsItem: ListingAnalytics = {
          listingId: listing.listingId,
          title: listing.title,
          views: listing.views,
          favorites: listing.favorites,
          sales: listing.sales,
          revenue: listing.revenue,
          conversionRate: listing.views > 0 ? (listing.sales / listing.views) * 100 : 0,
          averagePrice: listing.averagePrice,
          tags: listing.tags,
          materials: listing.materials,
          category: listing.category,
          performanceScore: this.calculatePerformanceScore(listing),
          trend: this.calculateTrend(listing),
          recommendations: this.generateListingRecommendations(listing),
          lastUpdated: new Date().toISOString(),
        };
        
        analytics.push(analyticsItem);
      }
      
      // Sort by performance score
      analytics.sort((a, b) => b.performanceScore - a.performanceScore);
      
      logger.info('Listing analytics generated', {
        userId,
        listingCount: analytics.length,
        period,
      });
      
      return analytics;
    } catch (error) {
      logger.error('Failed to get listing analytics', { userId, listingIds, period, error });
      throw error;
    }
  }
  
  /**
   * Get keyword performance analytics
   */
  async getKeywordAnalytics(
    userId: string,
    period: '7d' | '30d' | '90d' = '30d'
  ): Promise<KeywordAnalytics[]> {
    try {
      const { startDate, endDate } = this.getDateRange(period);
      
      // Get keyword performance data
      const keywordData = await this.getKeywordPerformanceData(userId, startDate, endDate);
      
      const analytics: KeywordAnalytics[] = [];
      
      for (const keyword of keywordData) {
        const analyticsItem: KeywordAnalytics = {
          keyword: keyword.keyword,
          impressions: keyword.impressions,
          clicks: keyword.clicks,
          ctr: keyword.impressions > 0 ? (keyword.clicks / keyword.impressions) * 100 : 0,
          conversions: keyword.conversions,
          revenue: keyword.revenue,
          averagePosition: keyword.averagePosition,
          trend: this.calculateKeywordTrend(keyword),
          opportunity: this.calculateKeywordOpportunity(keyword),
          difficulty: keyword.difficulty,
          recommendations: this.generateKeywordRecommendations(keyword),
        };
        
        analytics.push(analyticsItem);
      }
      
      // Sort by revenue
      analytics.sort((a, b) => b.revenue - a.revenue);
      
      logger.info('Keyword analytics generated', {
        userId,
        keywordCount: analytics.length,
        period,
      });
      
      return analytics;
    } catch (error) {
      logger.error('Failed to get keyword analytics', { userId, period, error });
      throw error;
    }
  }
  
  /**
   * Get competitor analytics
   */
  async getCompetitorAnalytics(userId: string): Promise<CompetitorAnalytics[]> {
    try {
      // Get tracked competitors
      const competitors = await db.competitorShop.findMany({
        where: { userId },
        include: {
          snapshots: {
            orderBy: { date: 'desc' },
            take: 1,
          },
        },
      });
      
      const analytics: CompetitorAnalytics[] = [];
      
      for (const competitor of competitors) {
        const latestSnapshot = competitor.snapshots[0];
        
        if (latestSnapshot) {
          const analyticsItem: CompetitorAnalytics = {
            competitorId: competitor.id,
            shopName: competitor.shopName,
            totalListings: latestSnapshot.activeListings,
            averagePrice: latestSnapshot.avgPrice || 0,
            estimatedRevenue: latestSnapshot.estimatedSales || 0,
            topKeywords: latestSnapshot.topKeywords,
            marketShare: 0, // Would be calculated based on market analysis
            threatLevel: this.calculateThreatLevel(latestSnapshot),
            lastAnalyzed: competitor.addedAt.toISOString(),
          };
          
          analytics.push(analyticsItem);
        }
      }
      
      // Sort by estimated revenue
      analytics.sort((a, b) => b.estimatedRevenue - a.estimatedRevenue);
      
      logger.info('Competitor analytics generated', {
        userId,
        competitorCount: analytics.length,
      });
      
      return analytics;
    } catch (error) {
      logger.error('Failed to get competitor analytics', { userId, error });
      throw error;
    }
  }
  
  /**
   * Get A/B test results
   */
  async getABTestResults(userId: string): Promise<ABTestResult[]> {
    try {
      // Mock A/B test data for now
      const mockTests: ABTestResult[] = [
        {
          testId: 'test-1',
          name: 'Listing Title Optimization',
          status: 'completed',
          startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          variants: [
            {
              name: 'Original',
              impressions: 1000,
              clicks: 50,
              conversions: 5,
              revenue: 125,
              ctr: 5,
              conversionRate: 10,
            },
            {
              name: 'Variant A',
              impressions: 1000,
              clicks: 75,
              conversions: 8,
              revenue: 200,
              ctr: 7.5,
              conversionRate: 10.67,
            },
          ],
          winner: 'Variant A',
          confidence: 95,
          improvement: 60,
        },
      ];
      
      logger.info('A/B test results retrieved', {
        userId,
        testCount: mockTests.length,
      });
      
      return mockTests;
    } catch (error) {
      logger.error('Failed to get A/B test results', { userId, error });
      throw error;
    }
  }
  
  /**
   * Get AI-powered recommendations
   */
  async getAIRecommendations(userId: string): Promise<{
    priority: 'high' | 'medium' | 'low';
    category: string;
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    effort: 'high' | 'medium' | 'low';
    actionItems: string[];
  }[]> {
    try {
      // Get shop overview for analysis
      const overview = await this.getShopOverview(userId);
      
      const recommendations = [];
      
      // Analyze conversion rate
      if (overview.conversionRate < 2) {
        recommendations.push({
          priority: 'high' as const,
          category: 'Conversion Optimization',
          title: 'Improve Listing Conversion Rate',
          description: `Your conversion rate is ${overview.conversionRate.toFixed(2)}%, which is below the Etsy average of 2-3%.`,
          impact: 'high' as const,
          effort: 'medium' as const,
          actionItems: [
            'Add more high-quality photos',
            'Improve listing descriptions',
            'Add customer reviews and testimonials',
            'Optimize pricing strategy',
          ],
        });
      }
      
      // Analyze average views per listing
      if (overview.averageViewsPerListing < 100) {
        recommendations.push({
          priority: 'high' as const,
          category: 'SEO Optimization',
          title: 'Increase Listing Visibility',
          description: `Your listings average ${overview.averageViewsPerListing} views, indicating low search visibility.`,
          impact: 'high' as const,
          effort: 'high' as const,
          actionItems: [
            'Research and implement better keywords',
            'Optimize listing titles for search',
            'Improve tag strategy',
            'Consider seasonal trends',
          ],
        });
      }
      
      // Analyze pricing strategy
      if (overview.averageListingPrice < 15) {
        recommendations.push({
          priority: 'medium' as const,
          category: 'Pricing Strategy',
          title: 'Optimize Pricing Strategy',
          description: `Your average price of $${overview.averageListingPrice.toFixed(2)} may be undervaluing your products.`,
          impact: 'medium' as const,
          effort: 'low' as const,
          actionItems: [
            'Research competitor pricing',
            'Test price increases gradually',
            'Add value to justify higher prices',
            'Bundle related items',
          ],
        });
      }
      
      // Analyze listing count
      if (overview.activeListings < 20) {
        recommendations.push({
          priority: 'medium' as const,
          category: 'Inventory Expansion',
          title: 'Expand Product Catalog',
          description: `With only ${overview.activeListings} active listings, expanding your catalog could increase revenue.`,
          impact: 'high' as const,
          effort: 'high' as const,
          actionItems: [
            'Create variations of best-selling items',
            'Develop complementary products',
            'Add seasonal items',
            'Consider custom or personalized options',
          ],
        });
      }
      
      logger.info('AI recommendations generated', {
        userId,
        recommendationCount: recommendations.length,
      });
      
      return recommendations;
    } catch (error) {
      logger.error('Failed to generate AI recommendations', { userId, error });
      throw error;
    }
  }
  
  /**
   * Helper methods
   */
  private getDateRange(period: string): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }
    
    return { startDate, endDate };
  }
  
  private calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }
  
  private calculatePerformanceScore(listing: any): number {
    // Weighted scoring based on views, favorites, sales, and revenue
    const viewsScore = Math.min(listing.views / 10, 100); // Max 100 for 1000+ views
    const favoritesScore = Math.min(listing.favorites * 10, 100); // Max 100 for 10+ favorites
    const salesScore = Math.min(listing.sales * 20, 100); // Max 100 for 5+ sales
    const revenueScore = Math.min(listing.revenue / 5, 100); // Max 100 for $500+ revenue
    
    return Math.round((viewsScore * 0.3 + favoritesScore * 0.2 + salesScore * 0.3 + revenueScore * 0.2));
  }
  
  private calculateTrend(listing: any): 'improving' | 'declining' | 'stable' {
    // Mock trend calculation - would use historical data
    const random = Math.random();
    if (random > 0.6) return 'improving';
    if (random < 0.3) return 'declining';
    return 'stable';
  }
  
  private calculateKeywordTrend(keyword: any): 'improving' | 'declining' | 'stable' {
    // Mock trend calculation - would use historical data
    const random = Math.random();
    if (random > 0.6) return 'improving';
    if (random < 0.3) return 'declining';
    return 'stable';
  }
  
  private calculateKeywordOpportunity(keyword: any): number {
    // Mock opportunity calculation
    return Math.round(Math.random() * 100);
  }
  
  private calculateThreatLevel(snapshot: any): 'low' | 'medium' | 'high' {
    const estimatedRevenue = snapshot.estimatedSales || 0;
    if (estimatedRevenue > 10000) return 'high';
    if (estimatedRevenue > 5000) return 'medium';
    return 'low';
  }
  
  private generateListingRecommendations(listing: any): string[] {
    const recommendations = [];
    
    if (listing.conversionRate < 2) {
      recommendations.push('Improve conversion rate with better photos and descriptions');
    }
    
    if (listing.views < 100) {
      recommendations.push('Optimize keywords and tags for better search visibility');
    }
    
    if (listing.favorites < 5) {
      recommendations.push('Add more compelling product photos and lifestyle shots');
    }
    
    return recommendations.slice(0, 3);
  }
  
  private generateKeywordRecommendations(keyword: any): string[] {
    const recommendations = [];
    
    if (keyword.ctr < 3) {
      recommendations.push('Improve listing titles to better match this keyword');
    }
    
    if (keyword.averagePosition > 20) {
      recommendations.push('Focus on long-tail variations of this keyword');
    }
    
    if (keyword.difficulty > 70) {
      recommendations.push('Consider targeting less competitive related keywords');
    }
    
    return recommendations.slice(0, 3);
  }
  
  /**
   * Mock data methods - would be replaced with real database queries
   */
  private async getShopMetrics(userId: string, startDate: Date, endDate: Date) {
    // Mock shop metrics
    return {
      totalListings: 25,
      activeListings: 23,
      totalViews: 1250,
      totalFavorites: 85,
      totalSales: 15,
      totalRevenue: 375,
      averageListingPrice: 25,
      conversionRate: 1.2,
      averageViewsPerListing: 54,
    };
  }
  
  private async getTopPerformingListings(userId: string, startDate: Date, endDate: Date) {
    // Mock top performing listings
    return [
      {
        listingId: 1234567890,
        title: 'Handmade Ceramic Coffee Mug',
        views: 150,
        favorites: 12,
        revenue: 75,
      },
      {
        listingId: 1234567891,
        title: 'Vintage Wooden Cutting Board',
        views: 120,
        favorites: 8,
        revenue: 60,
      },
    ];
  }
  
  private async getListingPerformanceData(userId: string, listingIds?: number[], startDate?: Date, endDate?: Date) {
    // Mock listing performance data
    return [
      {
        listingId: 1234567890,
        title: 'Handmade Ceramic Coffee Mug',
        views: 150,
        favorites: 12,
        sales: 3,
        revenue: 75,
        averagePrice: 25,
        tags: ['handmade', 'ceramic', 'coffee mug'],
        materials: ['ceramic', 'glaze'],
        category: 'Home & Living',
      },
    ];
  }
  
  private async getKeywordPerformanceData(userId: string, startDate: Date, endDate: Date) {
    // Mock keyword performance data
    return [
      {
        keyword: 'handmade coffee mug',
        impressions: 500,
        clicks: 25,
        conversions: 3,
        revenue: 75,
        averagePosition: 15,
        difficulty: 65,
      },
    ];
  }
}

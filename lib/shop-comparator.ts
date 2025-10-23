import { getEtsyClient } from './etsy-client';
import { emitTopRightToast } from '@/components/TopRightToast';

// Shop comparison data structure
export interface ShopComparison {
  shopId: string;
  shopName: string;
  metrics: ShopMetrics;
  percentileRankings: PercentileRankings;
  gaps: ComparisonGap[];
  recommendations: ComparisonRecommendation[];
}

// Shop metrics for comparison
export interface ShopMetrics {
  // Basic stats
  totalListings: number;
  totalSales: number;
  totalRevenue: number;
  averageRating: number;
  totalReviews: number;
  
  // Performance metrics
  conversionRate: number;
  averageOrderValue: number;
  customerRetentionRate: number;
  
  // SEO metrics
  averageListingScore: number;
  totalKeywordsRanked: number;
  averageRankPosition: number;
  
  // Engagement metrics
  totalFavorites: number;
  socialMediaFollowers: number;
  emailSubscribers: number;
  
  // Content quality
  imageQualityScore: number;
  descriptionQualityScore: number;
  titleOptimizationScore: number;
  
  // Business metrics
  daysSinceFirstSale: number;
  monthlyGrowthRate: number;
  seasonalVariation: number;
}

// Percentile rankings against industry
export interface PercentileRankings {
  totalSales: number; // e.g., 75 means top 25%
  revenue: number;
  conversionRate: number;
  averageRating: number;
  listingCount: number;
  seoScore: number;
  overall: number;
}

// Comparison gaps
export interface ComparisonGap {
  category: 'seo' | 'pricing' | 'content' | 'engagement' | 'growth';
  metric: string;
  yourValue: number;
  competitorValue: number;
  gap: number;
  importance: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

// Recommendations based on comparison
export interface ComparisonRecommendation {
  category: 'seo' | 'pricing' | 'content' | 'engagement' | 'growth';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  timeframe: string;
  actionSteps: string[];
}

// Industry benchmark data
export interface IndustryBenchmark {
  category: string;
  metrics: {
    average: number;
    top10Percent: number;
    top25Percent: number;
    median: number;
    bottom25Percent: number;
  };
  sampleSize: number;
  lastUpdated: Date;
}

// Competitor shop data
export interface CompetitorShop {
  shopId: string;
  shopName: string;
  url: string;
  category: string;
  isTracked: boolean;
  addedDate: Date;
  lastAnalyzed: Date;
  metrics: Partial<ShopMetrics>;
}

class ShopComparator {
  private etsyClient: any;
  private industryBenchmarks: Map<string, IndustryBenchmark> = new Map();
  private competitorShops: Map<string, CompetitorShop> = new Map();

  constructor() {
    this.etsyClient = getEtsyClient();
    this.initializeBenchmarks();
  }

  // Initialize industry benchmarks
  private initializeBenchmarks(): void {
    // These would typically come from a database or external API
    const benchmarks: IndustryBenchmark[] = [
      {
        category: 'jewelry',
        metrics: {
          average: 150,
          top10Percent: 5000,
          top25Percent: 2000,
          median: 120,
          bottom25Percent: 50
        },
        sampleSize: 10000,
        lastUpdated: new Date()
      },
      {
        category: 'home_decor',
        metrics: {
          average: 200,
          top10Percent: 3000,
          top25Percent: 1500,
          median: 180,
          bottom25Percent: 80
        },
        sampleSize: 8000,
        lastUpdated: new Date()
      },
      {
        category: 'art',
        metrics: {
          average: 80,
          top10Percent: 2000,
          top25Percent: 800,
          median: 70,
          bottom25Percent: 30
        },
        sampleSize: 5000,
        lastUpdated: new Date()
      }
    ];

    benchmarks.forEach(benchmark => {
      this.industryBenchmarks.set(benchmark.category, benchmark);
    });
  }

  // Add competitor shop
  async addCompetitor(shopUrl: string, category: string): Promise<boolean> {
    try {
      // Extract shop ID from URL
      const shopId = this.extractShopIdFromUrl(shopUrl);
      if (!shopId) {
        emitTopRightToast('Invalid shop URL', 'error');
        return false;
      }

      // Fetch shop data
      const shopData = await this.fetchShopData(shopId);
      if (!shopData) {
        emitTopRightToast('Failed to fetch shop data', 'error');
        return false;
      }

      const competitor: CompetitorShop = {
        shopId,
        shopName: shopData.shopName,
        url: shopUrl,
        category,
        isTracked: true,
        addedDate: new Date(),
        lastAnalyzed: new Date(),
        metrics: shopData.metrics
      };

      this.competitorShops.set(shopId, competitor);
      emitTopRightToast('Competitor added successfully', 'success');
      return true;
    } catch (error) {
      console.error('Error adding competitor:', error);
      emitTopRightToast('Failed to add competitor', 'error');
      return false;
    }
  }

  // Remove competitor shop
  async removeCompetitor(shopId: string): Promise<boolean> {
    try {
      this.competitorShops.delete(shopId);
      emitTopRightToast('Competitor removed successfully', 'success');
      return true;
    } catch (error) {
      console.error('Error removing competitor:', error);
      emitTopRightToast('Failed to remove competitor', 'error');
      return false;
    }
  }

  // Get all tracked competitors
  getCompetitors(): CompetitorShop[] {
    return Array.from(this.competitorShops.values());
  }

  // Compare shop against competitors
  async compareShop(
    yourShopId: string, 
    category: string, 
    competitorIds: string[] = []
  ): Promise<ShopComparison | null> {
    try {
      // Get your shop metrics
      const yourMetrics = await this.fetchShopData(yourShopId);
      if (!yourMetrics) {
        emitTopRightToast('Failed to fetch your shop data', 'error');
        return null;
      }

      // Get competitor metrics
      const competitorMetrics: ShopMetrics[] = [];
      for (const competitorId of competitorIds) {
        const competitorData = await this.fetchShopData(competitorId);
        if (competitorData) {
          competitorMetrics.push(competitorData.metrics);
        }
      }

      // Calculate percentile rankings
      const percentileRankings = this.calculatePercentileRankings(
        yourMetrics.metrics, 
        category
      );

      // Identify gaps
      const gaps = this.identifyGaps(yourMetrics.metrics, competitorMetrics);

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        yourMetrics.metrics, 
        gaps, 
        percentileRankings
      );

      const comparison: ShopComparison = {
        shopId: yourShopId,
        shopName: yourMetrics.shopName,
        metrics: yourMetrics.metrics,
        percentileRankings,
        gaps,
        recommendations
      };

      return comparison;
    } catch (error) {
      console.error('Error comparing shop:', error);
      emitTopRightToast('Failed to compare shop', 'error');
      return null;
    }
  }

  // Fetch shop data from Etsy
  private async fetchShopData(shopId: string): Promise<{ shopName: string; metrics: ShopMetrics } | null> {
    try {
      // This would make actual API calls to Etsy
      // For now, return mock data
      const mockMetrics: ShopMetrics = {
        totalListings: Math.floor(Math.random() * 500) + 50,
        totalSales: Math.floor(Math.random() * 1000) + 100,
        totalRevenue: Math.floor(Math.random() * 50000) + 5000,
        averageRating: 4.2 + Math.random() * 0.8,
        totalReviews: Math.floor(Math.random() * 500) + 50,
        conversionRate: 2 + Math.random() * 3,
        averageOrderValue: 25 + Math.random() * 50,
        customerRetentionRate: 15 + Math.random() * 25,
        averageListingScore: 60 + Math.random() * 30,
        totalKeywordsRanked: Math.floor(Math.random() * 200) + 50,
        averageRankPosition: 15 + Math.random() * 20,
        totalFavorites: Math.floor(Math.random() * 2000) + 200,
        socialMediaFollowers: Math.floor(Math.random() * 5000) + 500,
        emailSubscribers: Math.floor(Math.random() * 1000) + 100,
        imageQualityScore: 70 + Math.random() * 25,
        descriptionQualityScore: 65 + Math.random() * 30,
        titleOptimizationScore: 60 + Math.random() * 35,
        daysSinceFirstSale: Math.floor(Math.random() * 1000) + 100,
        monthlyGrowthRate: -5 + Math.random() * 20,
        seasonalVariation: 10 + Math.random() * 30
      };

      return {
        shopName: `Shop ${shopId}`,
        metrics: mockMetrics
      };
    } catch (error) {
      console.error('Error fetching shop data:', error);
      return null;
    }
  }

  // Calculate percentile rankings
  private calculatePercentileRankings(
    metrics: ShopMetrics, 
    category: string
  ): PercentileRankings {
    const benchmark = this.industryBenchmarks.get(category);
    if (!benchmark) {
      // Return default rankings if no benchmark available
      return {
        totalSales: 50,
        revenue: 50,
        conversionRate: 50,
        averageRating: 50,
        listingCount: 50,
        seoScore: 50,
        overall: 50
      };
    }

    // Calculate percentiles based on benchmark data
    const salesPercentile = this.calculatePercentile(
      metrics.totalSales, 
      benchmark.metrics.bottom25Percent, 
      benchmark.metrics.top25Percent
    );

    const revenuePercentile = this.calculatePercentile(
      metrics.totalRevenue, 
      benchmark.metrics.bottom25Percent * 100, 
      benchmark.metrics.top25Percent * 100
    );

    const overall = (salesPercentile + revenuePercentile + 
      this.calculatePercentile(metrics.conversionRate, 1, 8) +
      this.calculatePercentile(metrics.averageRating, 3.5, 5.0) * 100 +
      this.calculatePercentile(metrics.averageListingScore, 30, 90)) / 5;

    return {
      totalSales: salesPercentile,
      revenue: revenuePercentile,
      conversionRate: this.calculatePercentile(metrics.conversionRate, 1, 8),
      averageRating: this.calculatePercentile(metrics.averageRating, 3.5, 5.0) * 100,
      listingCount: this.calculatePercentile(metrics.totalListings, 10, 500),
      seoScore: this.calculatePercentile(metrics.averageListingScore, 30, 90),
      overall: Math.round(overall)
    };
  }

  // Calculate percentile for a given value
  private calculatePercentile(value: number, min: number, max: number): number {
    if (value <= min) return 0;
    if (value >= max) return 100;
    return Math.round(((value - min) / (max - min)) * 100);
  }

  // Identify gaps compared to competitors
  private identifyGaps(
    yourMetrics: ShopMetrics, 
    competitorMetrics: ShopMetrics[]
  ): ComparisonGap[] {
    const gaps: ComparisonGap[] = [];

    if (competitorMetrics.length === 0) return gaps;

    // Calculate averages for competitors
    const avgCompetitorSales = competitorMetrics.reduce((sum, m) => sum + m.totalSales, 0) / competitorMetrics.length;
    const avgCompetitorRevenue = competitorMetrics.reduce((sum, m) => sum + m.totalRevenue, 0) / competitorMetrics.length;
    const avgCompetitorConversion = competitorMetrics.reduce((sum, m) => sum + m.conversionRate, 0) / competitorMetrics.length;
    const avgCompetitorRating = competitorMetrics.reduce((sum, m) => sum + m.averageRating, 0) / competitorMetrics.length;
    const avgCompetitorSEO = competitorMetrics.reduce((sum, m) => sum + m.averageListingScore, 0) / competitorMetrics.length;

    // Sales gap
    if (yourMetrics.totalSales < avgCompetitorSales * 0.7) {
      gaps.push({
        category: 'growth',
        metric: 'Total Sales',
        yourValue: yourMetrics.totalSales,
        competitorValue: avgCompetitorSales,
        gap: avgCompetitorSales - yourMetrics.totalSales,
        importance: 'high',
        description: `You have ${Math.round((1 - yourMetrics.totalSales / avgCompetitorSales) * 100)}% fewer sales than competitors`
      });
    }

    // Revenue gap
    if (yourMetrics.totalRevenue < avgCompetitorRevenue * 0.7) {
      gaps.push({
        category: 'growth',
        metric: 'Total Revenue',
        yourValue: yourMetrics.totalRevenue,
        competitorValue: avgCompetitorRevenue,
        gap: avgCompetitorRevenue - yourMetrics.totalRevenue,
        importance: 'high',
        description: `You generate ${Math.round((1 - yourMetrics.totalRevenue / avgCompetitorRevenue) * 100)}% less revenue than competitors`
      });
    }

    // Conversion rate gap
    if (yourMetrics.conversionRate < avgCompetitorConversion * 0.8) {
      gaps.push({
        category: 'pricing',
        metric: 'Conversion Rate',
        yourValue: yourMetrics.conversionRate,
        competitorValue: avgCompetitorConversion,
        gap: avgCompetitorConversion - yourMetrics.conversionRate,
        importance: 'critical',
        description: `Your conversion rate is ${Math.round((1 - yourMetrics.conversionRate / avgCompetitorConversion) * 100)}% lower than competitors`
      });
    }

    // SEO gap
    if (yourMetrics.averageListingScore < avgCompetitorSEO * 0.8) {
      gaps.push({
        category: 'seo',
        metric: 'Average SEO Score',
        yourValue: yourMetrics.averageListingScore,
        competitorValue: avgCompetitorSEO,
        gap: avgCompetitorSEO - yourMetrics.averageListingScore,
        importance: 'high',
        description: `Your SEO scores are ${Math.round((1 - yourMetrics.averageListingScore / avgCompetitorSEO) * 100)}% lower than competitors`
      });
    }

    return gaps;
  }

  // Generate recommendations based on gaps and rankings
  private generateRecommendations(
    metrics: ShopMetrics, 
    gaps: ComparisonGap[], 
    rankings: PercentileRankings
  ): ComparisonRecommendation[] {
    const recommendations: ComparisonRecommendation[] = [];

    // SEO recommendations
    if (rankings.seoScore < 50) {
      recommendations.push({
        category: 'seo',
        priority: 'high',
        title: 'Improve SEO Scores',
        description: 'Your SEO scores are below industry average. Focus on optimizing titles, descriptions, and tags.',
        impact: 'High - Better search visibility',
        effort: 'medium',
        timeframe: '2-4 weeks',
        actionSteps: [
          'Optimize listing titles with relevant keywords',
          'Improve product descriptions with better formatting',
          'Add more relevant tags to listings',
          'Use high-quality, keyword-rich images'
        ]
      });
    }

    // Conversion rate recommendations
    if (rankings.conversionRate < 40) {
      recommendations.push({
        category: 'pricing',
        priority: 'critical',
        title: 'Optimize Pricing Strategy',
        description: 'Your conversion rate is significantly below average. Review your pricing strategy.',
        impact: 'Critical - Direct revenue impact',
        effort: 'low',
        timeframe: '1-2 weeks',
        actionSteps: [
          'Analyze competitor pricing',
          'Test psychological pricing ($19.99 vs $20)',
          'Offer bundle deals',
          'Add free shipping threshold'
        ]
      });
    }

    // Content quality recommendations
    if (metrics.imageQualityScore < 70 || metrics.descriptionQualityScore < 70) {
      recommendations.push({
        category: 'content',
        priority: 'medium',
        title: 'Enhance Content Quality',
        description: 'Improve the quality of your product images and descriptions.',
        impact: 'Medium - Better customer experience',
        effort: 'medium',
        timeframe: '3-4 weeks',
        actionSteps: [
          'Retake product photos with better lighting',
          'Add lifestyle images showing products in use',
          'Write more detailed, benefit-focused descriptions',
          'Add size charts and care instructions'
        ]
      });
    }

    // Growth recommendations
    if (rankings.totalSales < 30) {
      recommendations.push({
        category: 'growth',
        priority: 'high',
        title: 'Accelerate Sales Growth',
        description: 'Your sales volume is significantly below competitors. Focus on marketing and promotion.',
        impact: 'High - Revenue growth',
        effort: 'high',
        timeframe: '4-6 weeks',
        actionSteps: [
          'Launch Etsy Ads campaigns',
          'Increase social media marketing',
          'Collaborate with influencers',
          'Run seasonal promotions'
        ]
      });
    }

    return recommendations;
  }

  // Get industry benchmark for category
  getIndustryBenchmark(category: string): IndustryBenchmark | null {
    return this.industryBenchmarks.get(category) || null;
  }

  // Update competitor metrics
  async updateCompetitorMetrics(shopId: string): Promise<boolean> {
    try {
      const competitor = this.competitorShops.get(shopId);
      if (!competitor) return false;

      const updatedData = await this.fetchShopData(shopId);
      if (!updatedData) return false;

      competitor.metrics = updatedData.metrics;
      competitor.lastAnalyzed = new Date();
      
      return true;
    } catch (error) {
      console.error('Error updating competitor metrics:', error);
      return false;
    }
  }

  // Extract shop ID from Etsy URL
  private extractShopIdFromUrl(url: string): string | null {
    try {
      const match = url.match(/etsy\.com\/shop\/([^\/\?]+)/);
      return match ? match[1] : null;
    } catch (error) {
      return null;
    }
  }

  // Export comparison report
  exportComparisonReport(comparison: ShopComparison): string {
    const report = `
Shop Comparison Report
=====================

Shop: ${comparison.shopName}
Generated: ${new Date().toLocaleDateString()}

PERCENTILE RANKINGS
==================
Overall Score: ${comparison.percentileRankings.overall}th percentile
Sales: ${comparison.percentileRankings.totalSales}th percentile
Revenue: ${comparison.percentileRankings.revenue}th percentile
Conversion Rate: ${comparison.percentileRankings.conversionRate}th percentile
SEO Score: ${comparison.percentileRankings.seoScore}th percentile

KEY GAPS IDENTIFIED
==================
${comparison.gaps.map(gap => `
${gap.metric}: ${gap.description}
Gap: ${gap.gap.toFixed(0)} (${gap.importance} priority)
`).join('')}

TOP RECOMMENDATIONS
==================
${comparison.recommendations.map(rec => `
${rec.title} (${rec.priority} priority)
${rec.description}
Impact: ${rec.impact}
Effort: ${rec.effort}
Timeframe: ${rec.timeframe}

Action Steps:
${rec.actionSteps.map(step => `- ${step}`).join('\n')}
`).join('')}
`;

    return report;
  }
}

// Default shop comparator instance
let shopComparator: ShopComparator | null = null;

export function getShopComparator(): ShopComparator {
  if (!shopComparator) {
    shopComparator = new ShopComparator();
  }
  return shopComparator;
}

export default ShopComparator;

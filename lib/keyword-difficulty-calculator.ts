/**
 * Keyword Difficulty Calculator
 * Advanced scoring system for keyword competitiveness on Etsy
 */

import { logger } from './logger';
import { db } from './db';
import { keywordCache } from './redis';

export interface KeywordDifficultyMetrics {
  totalListings: number;
  averagePrice: number;
  priceRange: { min: number; max: number };
  topShops: Array<{
    shopId: number;
    shopName: string;
    listingCount: number;
    marketShare: number;
  }>;
  page1ShopConcentration: number;
  titleExactMatchRate: number;
  averageListingAge: number;
  categoryDistribution: Array<{
    categoryId: number;
    categoryName: string;
    count: number;
    percentage: number;
  }>;
}

export interface KeywordDifficultyScore {
  overallScore: number; // 0-100 (0 = very easy, 100 = very hard)
  difficulty: 'easy' | 'medium' | 'hard' | 'very-hard';
  breakdown: {
    competition: number; // 0-100
    marketSaturation: number; // 0-100
    shopDominance: number; // 0-100
    listingQuality: number; // 0-100
    seasonality: number; // 0-100
  };
  factors: {
    highCompetition: boolean;
    marketSaturated: boolean;
    dominantShops: boolean;
    highQualityListings: boolean;
    seasonal: boolean;
  };
  recommendations: string[];
  estimatedTimeToRank: string;
  successProbability: number; // 0-100
}

export class KeywordDifficultyCalculator {
  private weights = {
    competition: 0.30,
    marketSaturation: 0.25,
    shopDominance: 0.20,
    listingQuality: 0.15,
    seasonality: 0.10,
  };

  /**
   * Calculate keyword difficulty score
   */
  async calculateDifficulty(
    keyword: string,
    metrics?: KeywordDifficultyMetrics
  ): Promise<KeywordDifficultyScore> {
    try {
      // Get metrics if not provided
      if (!metrics) {
        metrics = await this.getKeywordMetrics(keyword);
      }

      // Calculate individual component scores
      const competition = this.calculateCompetitionScore(metrics);
      const marketSaturation = this.calculateMarketSaturationScore(metrics);
      const shopDominance = this.calculateShopDominanceScore(metrics);
      const listingQuality = this.calculateListingQualityScore(metrics);
      const seasonality = this.calculateSeasonalityScore(metrics);

      // Calculate weighted overall score
      const overallScore = Math.round(
        competition * this.weights.competition +
        marketSaturation * this.weights.marketSaturation +
        shopDominance * this.weights.shopDominance +
        listingQuality * this.weights.listingQuality +
        seasonality * this.weights.seasonality
      );

      // Determine difficulty level
      const difficulty = this.getDifficultyLevel(overallScore);

      // Analyze factors
      const factors = {
        highCompetition: competition > 70,
        marketSaturated: marketSaturation > 70,
        dominantShops: shopDominance > 70,
        highQualityListings: listingQuality > 70,
        seasonal: seasonality > 70,
      };

      // Generate recommendations
      const recommendations = this.generateRecommendations(overallScore, factors, metrics);

      // Estimate time to rank
      const estimatedTimeToRank = this.estimateTimeToRank(overallScore, metrics);

      // Calculate success probability
      const successProbability = this.calculateSuccessProbability(overallScore, factors);

      const result: KeywordDifficultyScore = {
        overallScore,
        difficulty,
        breakdown: {
          competition,
          marketSaturation,
          shopDominance,
          listingQuality,
          seasonality,
        },
        factors,
        recommendations,
        estimatedTimeToRank,
        successProbability,
      };

      // Cache the result
      await keywordCache.set(`difficulty:${keyword}`, result, 3600); // 1 hour cache

      logger.info('Keyword difficulty calculated', {
        keyword,
        overallScore,
        difficulty,
        successProbability,
      });

      return result;
    } catch (error) {
      logger.error('Failed to calculate keyword difficulty', { keyword, error });
      throw error;
    }
  }

  /**
   * Calculate difficulty for multiple keywords
   */
  async calculateBatchDifficulty(keywords: string[]): Promise<Map<string, KeywordDifficultyScore>> {
    const results = new Map<string, KeywordDifficultyScore>();
    
    // Process in parallel with concurrency limit
    const concurrency = 5;
    for (let i = 0; i < keywords.length; i += concurrency) {
      const batch = keywords.slice(i, i + concurrency);
      const batchPromises = batch.map(async (keyword) => {
        try {
          const score = await this.calculateDifficulty(keyword);
          return { keyword, score };
        } catch (error) {
          logger.warn('Failed to calculate difficulty for keyword', { keyword, error });
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach((result) => {
        if (result) {
          results.set(result.keyword, result.score);
        }
      });
    }

    return results;
  }

  /**
   * Get keyword metrics from database or API
   */
  private async getKeywordMetrics(keyword: string): Promise<KeywordDifficultyMetrics> {
    // Try to get from cache first
    const cacheKey = `metrics:${keyword}`;
    const cached = await keywordCache.get(cacheKey);
    if (cached && typeof cached === 'object' && 'totalListings' in cached) {
      return cached as KeywordDifficultyMetrics;
    }

    // Get from database
    const keywordRecord = await db.keyword.findUnique({
      where: { term: keyword },
      include: {
        metrics: {
          orderBy: { date: 'desc' },
          take: 1,
        },
        serpSamples: {
          orderBy: { sampledAt: 'desc' },
          take: 100,
        },
      },
    });

    if (keywordRecord && keywordRecord.metrics.length > 0) {
      const latestMetrics = keywordRecord.metrics[0];
      const serpSamples = keywordRecord.serpSamples;

      const metrics: KeywordDifficultyMetrics = {
        totalListings: latestMetrics.activeListings || 0,
        averagePrice: this.calculateAveragePrice(serpSamples),
        priceRange: this.calculatePriceRange(serpSamples),
        topShops: this.calculateTopShops(serpSamples),
        page1ShopConcentration: latestMetrics.page1ShopConc || 0,
        titleExactMatchRate: latestMetrics.titleExactRate || 0,
        averageListingAge: this.calculateAverageListingAge(serpSamples),
        categoryDistribution: this.calculateCategoryDistribution(serpSamples),
      };

      // Cache for 30 minutes
      await keywordCache.set(cacheKey, metrics, 1800);
      return metrics;
    }

    // Return default metrics if no data found
    return this.getDefaultMetrics();
  }

  /**
   * Calculate competition score (0-100)
   */
  private calculateCompetitionScore(metrics: KeywordDifficultyMetrics): number {
    const { totalListings, page1ShopConcentration } = metrics;

    // Base competition score from total listings
    let competitionScore = 0;
    if (totalListings < 100) {
      competitionScore = 20;
    } else if (totalListings < 500) {
      competitionScore = 40;
    } else if (totalListings < 2000) {
      competitionScore = 60;
    } else if (totalListings < 10000) {
      competitionScore = 80;
    } else {
      competitionScore = 100;
    }

    // Adjust based on page 1 shop concentration
    // Higher concentration = more competition from established shops
    const concentrationAdjustment = page1ShopConcentration * 0.3;
    competitionScore = Math.min(100, competitionScore + concentrationAdjustment);

    return Math.round(competitionScore);
  }

  /**
   * Calculate market saturation score (0-100)
   */
  private calculateMarketSaturationScore(metrics: KeywordDifficultyMetrics): number {
    const { totalListings, categoryDistribution } = metrics;

    // Base saturation from total listings
    let saturationScore = 0;
    if (totalListings < 50) {
      saturationScore = 10;
    } else if (totalListings < 200) {
      saturationScore = 30;
    } else if (totalListings < 1000) {
      saturationScore = 50;
    } else if (totalListings < 5000) {
      saturationScore = 70;
    } else {
      saturationScore = 90;
    }

    // Adjust based on category distribution
    // More concentrated categories = higher saturation
    const maxCategoryPercentage = Math.max(...categoryDistribution.map(c => c.percentage));
    const distributionAdjustment = maxCategoryPercentage * 0.2;
    saturationScore = Math.min(100, saturationScore + distributionAdjustment);

    return Math.round(saturationScore);
  }

  /**
   * Calculate shop dominance score (0-100)
   */
  private calculateShopDominanceScore(metrics: KeywordDifficultyMetrics): number {
    const { topShops, page1ShopConcentration } = metrics;

    if (topShops.length === 0) {
      return 10; // No dominance data
    }

    // Calculate market share concentration
    const top3MarketShare = topShops.slice(0, 3).reduce((sum, shop) => sum + shop.marketShare, 0);
    const topShopMarketShare = topShops[0]?.marketShare || 0;

    let dominanceScore = 0;

    // Top 3 shops dominance
    if (top3MarketShare > 80) {
      dominanceScore = 90;
    } else if (top3MarketShare > 60) {
      dominanceScore = 70;
    } else if (top3MarketShare > 40) {
      dominanceScore = 50;
    } else if (top3MarketShare > 20) {
      dominanceScore = 30;
    } else {
      dominanceScore = 10;
    }

    // Adjust for single shop dominance
    if (topShopMarketShare > 50) {
      dominanceScore += 20;
    } else if (topShopMarketShare > 30) {
      dominanceScore += 10;
    }

    // Adjust for page 1 concentration
    const concentrationAdjustment = page1ShopConcentration * 0.3;
    dominanceScore = Math.min(100, dominanceScore + concentrationAdjustment);

    return Math.round(dominanceScore);
  }

  /**
   * Calculate listing quality score (0-100)
   */
  private calculateListingQualityScore(metrics: KeywordDifficultyMetrics): number {
    const { averagePrice, averageListingAge, titleExactMatchRate } = metrics;

    let qualityScore = 0;

    // Price indicates quality investment
    if (averagePrice > 5000) { // $50+
      qualityScore += 30;
    } else if (averagePrice > 2000) { // $20+
      qualityScore += 20;
    } else if (averagePrice > 1000) { // $10+
      qualityScore += 10;
    }

    // Listing age indicates established presence
    if (averageListingAge > 365) { // 1+ years
      qualityScore += 30;
    } else if (averageListingAge > 180) { // 6+ months
      qualityScore += 20;
    } else if (averageListingAge > 90) { // 3+ months
      qualityScore += 10;
    }

    // Title exact match rate indicates SEO optimization
    if (titleExactMatchRate > 80) {
      qualityScore += 40;
    } else if (titleExactMatchRate > 60) {
      qualityScore += 30;
    } else if (titleExactMatchRate > 40) {
      qualityScore += 20;
    } else if (titleExactMatchRate > 20) {
      qualityScore += 10;
    }

    return Math.min(100, qualityScore);
  }

  /**
   * Calculate seasonality score (0-100)
   */
  private calculateSeasonalityScore(metrics: KeywordDifficultyMetrics): number {
    // For now, return a moderate score
    // This would be enhanced with historical trend data
    return 50;
  }

  /**
   * Get difficulty level from score
   */
  private getDifficultyLevel(score: number): 'easy' | 'medium' | 'hard' | 'very-hard' {
    if (score < 25) return 'easy';
    if (score < 50) return 'medium';
    if (score < 75) return 'hard';
    return 'very-hard';
  }

  /**
   * Generate recommendations based on difficulty
   */
  private generateRecommendations(
    score: number,
    factors: KeywordDifficultyScore['factors'],
    metrics: KeywordDifficultyMetrics
  ): string[] {
    const recommendations: string[] = [];

    if (score < 30) {
      recommendations.push('This keyword has low competition - great opportunity!');
      recommendations.push('Focus on recreation and quality to capture market share');
      recommendations.push('Consider long-tail variations for even better results');
    } else if (score < 60) {
      recommendations.push('Moderate competition - requires strategic approach');
      recommendations.push('Analyze top-performing listings for optimization ideas');
      recommendations.push('Consider seasonal timing for better results');
    } else if (score < 80) {
      recommendations.push('High competition - needs strong differentiation');
      recommendations.push('Focus on unique value proposition and quality');
      recommendations.push('Consider targeting long-tail variations instead');
    } else {
      recommendations.push('Very high competition - consider alternative keywords');
      recommendations.push('Focus on niche variations or related terms');
      recommendations.push('Requires significant investment and time to compete');
    }

    if (factors.highCompetition) {
      recommendations.push('High competition detected - analyze competitor strategies');
    }

    if (factors.marketSaturated) {
      recommendations.push('Market appears saturated - consider unique positioning');
    }

    if (factors.dominantShops) {
      recommendations.push('Established shops dominate - focus on differentiation');
    }

    if (factors.highQualityListings) {
      recommendations.push('High-quality listings present - ensure competitive quality');
    }

    if (metrics.totalListings > 10000) {
      recommendations.push('Very high listing volume - consider long-tail alternatives');
    }

    return recommendations.slice(0, 5); // Limit to top 5 recommendations
  }

  /**
   * Estimate time to rank
   */
  private estimateTimeToRank(score: number, metrics: KeywordDifficultyMetrics): string {
    if (score < 25) {
      return '1-2 weeks';
    } else if (score < 50) {
      return '1-3 months';
    } else if (score < 75) {
      return '3-6 months';
    } else {
      return '6+ months';
    }
  }

  /**
   * Calculate success probability
   */
  private calculateSuccessProbability(
    score: number,
    factors: KeywordDifficultyScore['factors']
  ): number {
    let probability = 100 - score; // Base probability inversely related to difficulty

    // Adjust based on factors
    if (factors.highCompetition) probability -= 15;
    if (factors.marketSaturated) probability -= 10;
    if (factors.dominantShops) probability -= 20;
    if (factors.highQualityListings) probability -= 10;
    if (factors.seasonal) probability -= 5;

    return Math.max(10, Math.min(90, probability)); // Keep between 10-90%
  }

  /**
   * Helper methods for metrics calculation
   */
  private calculateAveragePrice(serpSamples: any[]): number {
    if (serpSamples.length === 0) return 0;
    const total = serpSamples.reduce((sum, sample) => sum + sample.price, 0);
    return total / serpSamples.length;
  }

  private calculatePriceRange(serpSamples: any[]): { min: number; max: number } {
    if (serpSamples.length === 0) return { min: 0, max: 0 };
    const prices = serpSamples.map(sample => sample.price);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }

  private calculateTopShops(serpSamples: any[]): Array<{
    shopId: number;
    shopName: string;
    listingCount: number;
    marketShare: number;
  }> {
    const shopCounts: { [key: string]: { shopId: number; shopName: string; count: number } } = {};
    
    serpSamples.forEach(sample => {
      const shopId = sample.shopId.toString();
      if (shopCounts[shopId]) {
        shopCounts[shopId].count++;
      } else {
        shopCounts[shopId] = {
          shopId: sample.shopId,
          shopName: `Shop ${sample.shopId}`, // Would get real name from API
          count: 1,
        };
      }
    });

    const totalListings = serpSamples.length;
    return Object.values(shopCounts)
      .map(shop => ({
        shopId: shop.shopId,
        shopName: shop.shopName,
        listingCount: shop.count,
        marketShare: (shop.count / totalListings) * 100,
      }))
      .sort((a, b) => b.listingCount - a.listingCount)
      .slice(0, 10);
  }

  private calculateAverageListingAge(serpSamples: any[]): number {
    if (serpSamples.length === 0) return 0;
    // This would calculate from creation dates
    // For now, return a mock value
    return 180; // 6 months average
  }

  private calculateCategoryDistribution(serpSamples: any[]): Array<{
    categoryId: number;
    categoryName: string;
    count: number;
    percentage: number;
  }> {
    // Mock category distribution
    return [
      {
        categoryId: 69150467,
        categoryName: 'Home & Living',
        count: Math.floor(serpSamples.length * 0.4),
        percentage: 40,
      },
      {
        categoryId: 69150468,
        categoryName: 'Jewelry',
        count: Math.floor(serpSamples.length * 0.3),
        percentage: 30,
      },
      {
        categoryId: 69150469,
        categoryName: 'Art & Collectibles',
        count: Math.floor(serpSamples.length * 0.3),
        percentage: 30,
      },
    ];
  }

  private getDefaultMetrics(): KeywordDifficultyMetrics {
    return {
      totalListings: 1000,
      averagePrice: 2500,
      priceRange: { min: 500, max: 5000 },
      topShops: [],
      page1ShopConcentration: 50,
      titleExactMatchRate: 30,
      averageListingAge: 180,
      categoryDistribution: [],
    };
  }
}

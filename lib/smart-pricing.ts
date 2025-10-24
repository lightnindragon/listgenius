import { emitTopRightToast } from '@/components/TopRightToast';
import { logger } from './logger';

// Pricing analysis data structures
export interface PricingAnalysis {
  id: string;
  userId: string;
  listingId: number;
  currentPrice: number;
  recommendedPrice: number;
  competitorPriceMin?: number;
  competitorPriceMax?: number;
  competitorPriceAvg?: number;
  psychologicalPrice?: number;
  expectedImpact?: string;
  reasoning?: string;
  createdAt: Date;
}

export interface CompetitorPriceData {
  min: number;
  max: number;
  average: number;
  median: number;
  percentile25: number;
  percentile75: number;
  sampleSize: number;
  topPerformers: {
    price: number;
    shopName: string;
    salesCount: number;
  }[];
}

export interface PricingRecommendation {
  recommendedPrice: number;
  psychologicalPrice: number;
  competitorPrice: number;
  expectedConversionChange: number;
  expectedProfitChange: number;
  reasoning: string;
  confidence: number;
  alternatives: {
    price: number;
    reason: string;
    expectedImpact: string;
  }[];
}

export interface BundlePricingRecommendation {
  individualPrice: number;
  bundlePrice: number;
  savings: number;
  expectedConversionIncrease: number;
  recommendedBundle: {
    listings: number[];
    discountPercentage: number;
    totalPrice: number;
  };
}

export interface PriceElasticityData {
  elasticity: number;
  optimalPrice: number;
  demandAtOptimalPrice: number;
  revenueAtOptimalPrice: number;
  recommendations: string[];
}

export interface DiscountCalculation {
  originalPrice: number;
  discountedPrice: number;
  discountPercentage: number;
  targetMargin: number;
  costPrice: number;
  profitMargin: number;
  breakEvenQuantity: number;
  recommendedQuantity: number;
}

// Smart Pricing Engine
export class SmartPricingEngine {
  private cache: Map<string, any> = new Map();
  private cacheTimeout = 300000; // 5 minutes

  constructor() {
    logger.info('SmartPricingEngine initialized');
  }

  // Psychological pricing analysis
  public analyzePsychologicalPricing(price: number): {
    currentPrice: number;
    psychologicalPrice: number;
    impact: string;
    suggestions: string[];
  } {
    const roundedPrice = Math.round(price);
    const psychologicalPrice = this.getPsychologicalPrice(price);
    
    const impact = this.calculatePsychologicalImpact(price, psychologicalPrice);
    const suggestions = this.getPsychologicalSuggestions(price, psychologicalPrice);

    return {
      currentPrice: price,
      psychologicalPrice,
      impact,
      suggestions
    };
  }

  private getPsychologicalPrice(price: number): number {
    // Convert to psychological pricing (e.g., $20 -> $19.99)
    const rounded = Math.round(price);
    
    if (rounded >= 10) {
      return rounded - 0.01;
    } else if (rounded >= 1) {
      return rounded - 0.01;
    } else {
      return Math.round(price * 100) / 100; // Keep as is for very small prices
    }
  }

  private calculatePsychologicalImpact(original: number, psychological: number): string {
    const difference = original - psychological;
    const percentage = (difference / original) * 100;
    
    if (percentage < 0.5) {
      return "Minimal impact - price is already psychologically optimized";
    } else if (percentage < 2) {
      return "Low impact - slight conversion boost expected";
    } else if (percentage < 5) {
      return "Medium impact - noticeable conversion improvement likely";
    } else {
      return "High impact - significant conversion boost expected";
    }
  }

  private getPsychologicalSuggestions(original: number, psychological: number): string[] {
    const suggestions = [];
    
    if (Math.abs(original - psychological) > 0.01) {
      suggestions.push(`Consider pricing at $${psychological.toFixed(2)} instead of $${original.toFixed(2)}`);
    }
    
    if (original % 1 === 0 && original >= 10) {
      suggestions.push("Round prices can appear less professional - try psychological pricing");
    }
    
    if (original % 5 === 0 && original >= 20) {
      suggestions.push("Prices ending in 5 or 0 can be optimized with psychological pricing");
    }

    return suggestions;
  }

  // Competitor price analysis
  public async getCompetitorPriceRange(category: string, keywords: string[]): Promise<CompetitorPriceData> {
    const cacheKey = `competitor_${category}_${keywords.join('_')}`;
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      // Mock competitor data - in real implementation, this would query Etsy API or competitor databases
      const mockData = this.generateMockCompetitorData(category, keywords);
      this.setCache(cacheKey, mockData);
      
      return mockData;
    } catch (error) {
      logger.error('Failed to get competitor price range', { error, category, keywords });
      throw new Error('Failed to fetch competitor pricing data');
    }
  }

  private generateMockCompetitorData(category: string, keywords: string[]): CompetitorPriceData {
    // Generate realistic competitor data based on category
    const basePrice = this.getBasePriceForCategory(category);
    const variation = basePrice * 0.4; // 40% variation
    
    const prices = Array.from({ length: 50 }, () => {
      const randomVariation = (Math.random() - 0.5) * variation;
      return Math.max(5, basePrice + randomVariation);
    }).sort((a, b) => a - b);

    return {
      min: prices[0],
      max: prices[prices.length - 1],
      average: prices.reduce((sum, price) => sum + price, 0) / prices.length,
      median: prices[Math.floor(prices.length / 2)],
      percentile25: prices[Math.floor(prices.length * 0.25)],
      percentile75: prices[Math.floor(prices.length * 0.75)],
      sampleSize: prices.length,
      topPerformers: prices.slice(-5).map(price => ({
        price,
        shopName: `Competitor ${Math.floor(Math.random() * 1000)}`,
        salesCount: Math.floor(Math.random() * 100) + 10
      }))
    };
  }

  private getBasePriceForCategory(category: string): number {
    const categoryPrices: { [key: string]: number } = {
      'jewelry': 45,
      'home-decor': 35,
      'clothing': 25,
      'art-supplies': 15,
      'vintage': 30,
      'crafts': 20,
      'electronics': 60,
      'books': 12,
      'toys': 18,
      'beauty': 22
    };
    
    return categoryPrices[category.toLowerCase()] || 25;
  }

  // Optimal discount calculation
  public calculateOptimalDiscount(currentPrice: number, targetMargin: number, costPrice: number): DiscountCalculation {
    const profitMargin = ((currentPrice - costPrice) / currentPrice) * 100;
    
    // Calculate maximum discount that maintains target margin
    const maxDiscountPercentage = Math.max(0, profitMargin - targetMargin);
    const maxDiscountPrice = currentPrice * (1 - maxDiscountPercentage / 100);
    
    // Recommended discount (80% of maximum to be safe)
    const recommendedDiscountPercentage = maxDiscountPercentage * 0.8;
    const recommendedDiscountPrice = currentPrice * (1 - recommendedDiscountPercentage / 100);
    
    const finalProfitMargin = ((recommendedDiscountPrice - costPrice) / recommendedDiscountPrice) * 100;
    
    return {
      originalPrice: currentPrice,
      discountedPrice: recommendedDiscountPrice,
      discountPercentage: recommendedDiscountPercentage,
      targetMargin,
      costPrice,
      profitMargin: finalProfitMargin,
      breakEvenQuantity: Math.ceil(costPrice / (recommendedDiscountPrice - costPrice)),
      recommendedQuantity: Math.ceil(costPrice / (recommendedDiscountPrice - costPrice)) * 1.5
    };
  }

  // Bundle pricing optimizer
  public suggestBundlePricing(products: Array<{ id: number; price: number; cost: number }>): BundlePricingRecommendation {
    const totalIndividualPrice = products.reduce((sum, product) => sum + product.price, 0);
    const totalCost = products.reduce((sum, product) => sum + product.cost, 0);
    
    // Calculate optimal bundle discount (typically 10-20% off total)
    const bundleDiscountPercentage = 15; // 15% discount
    const bundlePrice = totalIndividualPrice * (1 - bundleDiscountPercentage / 100);
    
    const savings = totalIndividualPrice - bundlePrice;
    const expectedConversionIncrease = 25; // 25% increase in conversion rate
    
    return {
      individualPrice: totalIndividualPrice,
      bundlePrice,
      savings,
      expectedConversionIncrease,
      recommendedBundle: {
        listings: products.map(p => p.id),
        discountPercentage: bundleDiscountPercentage,
        totalPrice: bundlePrice
      }
    };
  }

  // Price elasticity analysis
  public calculatePriceElasticity(historicalData: Array<{ price: number; quantity: number; revenue: number }>): PriceElasticityData {
    if (historicalData.length < 2) {
      throw new Error('Insufficient data for elasticity calculation');
    }

    // Simple elasticity calculation (price change vs quantity change)
    const sortedData = historicalData.sort((a, b) => a.price - b.price);
    const priceChange = (sortedData[sortedData.length - 1].price - sortedData[0].price) / sortedData[0].price;
    const quantityChange = (sortedData[0].quantity - sortedData[sortedData.length - 1].quantity) / sortedData[0].quantity;
    
    const elasticity = Math.abs(quantityChange / priceChange);
    
    // Find optimal price (highest revenue point)
    const optimalDataPoint = historicalData.reduce((max, current) => 
      current.revenue > max.revenue ? current : max
    );

    const recommendations = this.getElasticityRecommendations(elasticity);

    return {
      elasticity,
      optimalPrice: optimalDataPoint.price,
      demandAtOptimalPrice: optimalDataPoint.quantity,
      revenueAtOptimalPrice: optimalDataPoint.revenue,
      recommendations
    };
  }

  private getElasticityRecommendations(elasticity: number): string[] {
    const recommendations = [];
    
    if (elasticity < 1) {
      recommendations.push("Low elasticity - price increases may increase revenue");
      recommendations.push("Consider premium pricing strategy");
    } else if (elasticity < 2) {
      recommendations.push("Moderate elasticity - small price changes have moderate impact");
      recommendations.push("Focus on value proposition to justify current pricing");
    } else {
      recommendations.push("High elasticity - price changes have significant impact on demand");
      recommendations.push("Consider competitive pricing strategy");
      recommendations.push("Focus on cost optimization to maintain margins");
    }

    return recommendations;
  }

  // Comprehensive pricing recommendation
  public async getPricingRecommendation(
    listingId: number,
    currentPrice: number,
    category: string,
    keywords: string[],
    costPrice?: number,
    targetMargin?: number
  ): Promise<PricingRecommendation> {
    try {
      // Get competitor data
      const competitorData = await this.getCompetitorPriceRange(category, keywords);
      
      // Analyze psychological pricing
      const psychological = this.analyzePsychologicalPricing(currentPrice);
      
      // Calculate competitor-based price
      const competitorPrice = competitorData.average;
      
      // AI-powered recommendation using OpenAI
      const aiRecommendation = await this.getAIRecommendation(
        currentPrice,
        competitorData,
        psychological,
        costPrice,
        targetMargin
      );

      const alternatives = this.generateAlternativePrices(currentPrice, competitorData, psychological);

      return {
        recommendedPrice: aiRecommendation.price,
        psychologicalPrice: psychological.psychologicalPrice,
        competitorPrice,
        expectedConversionChange: aiRecommendation.conversionChange,
        expectedProfitChange: aiRecommendation.profitChange,
        reasoning: aiRecommendation.reasoning,
        confidence: aiRecommendation.confidence,
        alternatives
      };
    } catch (error) {
      logger.error('Failed to get pricing recommendation', { error, listingId });
      throw new Error('Failed to generate pricing recommendation');
    }
  }

  private async getAIRecommendation(
    currentPrice: number,
    competitorData: CompetitorPriceData,
    psychological: any,
    costPrice?: number,
    targetMargin?: number
  ): Promise<{
    price: number;
    conversionChange: number;
    profitChange: number;
    reasoning: string;
    confidence: number;
  }> {
    try {
      // Use OpenAI to analyze pricing strategy
      const openai = require('openai');
      const client = new openai.OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const prompt = `
        Analyze pricing strategy for an Etsy listing:
        - Current price: $${currentPrice}
        - Competitor prices: Min $${competitorData.min}, Max $${competitorData.max}, Avg $${competitorData.average}
        - Psychological price: $${psychological.psychologicalPrice}
        ${costPrice ? `- Cost price: $${costPrice}` : ''}
        ${targetMargin ? `- Target margin: ${targetMargin}%` : ''}

        Provide a pricing recommendation with:
        1. Recommended price
        2. Expected conversion rate change (%)
        3. Expected profit change (%)
        4. Reasoning for the recommendation
        5. Confidence level (0-100)

        Respond in JSON format.
      `;

      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.3
      });

      const result = JSON.parse(response.choices[0]?.message?.content || '{}');

      return {
        price: result.recommendedPrice || currentPrice,
        conversionChange: result.conversionChange || 0,
        profitChange: result.profitChange || 0,
        reasoning: result.reasoning || 'AI analysis unavailable',
        confidence: result.confidence || 50
      };
    } catch (error) {
      logger.warn('AI pricing recommendation failed, using fallback', { error });
      
      // Fallback to simple calculation
      const recommendedPrice = Math.max(
        competitorData.percentile25,
        psychological.psychologicalPrice
      );
      
      return {
        price: recommendedPrice,
        conversionChange: 5,
        profitChange: 0,
        reasoning: 'Based on competitor analysis and psychological pricing',
        confidence: 60
      };
    }
  }

  private generateAlternativePrices(
    currentPrice: number,
    competitorData: CompetitorPriceData,
    psychological: any
  ): Array<{ price: number; reason: string; expectedImpact: string }> {
    return [
      {
        price: competitorData.average,
        reason: 'Match competitor average',
        expectedImpact: 'Competitive positioning'
      },
      {
        price: psychological.psychologicalPrice,
        reason: 'Psychological pricing optimization',
        expectedImpact: 'Conversion boost'
      },
      {
        price: competitorData.percentile75,
        reason: 'Premium positioning',
        expectedImpact: 'Higher margins, lower volume'
      },
      {
        price: competitorData.percentile25,
        reason: 'Value positioning',
        expectedImpact: 'Higher volume, lower margins'
      }
    ];
  }

  // Cache management
  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Bulk pricing analysis
  public async analyzeBulkPricing(listings: Array<{
    id: number;
    currentPrice: number;
    category: string;
    keywords: string[];
    costPrice?: number;
  }>): Promise<Map<number, PricingRecommendation>> {
    const results = new Map<number, PricingRecommendation>();
    
    for (const listing of listings) {
      try {
        const recommendation = await this.getPricingRecommendation(
          listing.id,
          listing.currentPrice,
          listing.category,
          listing.keywords,
          listing.costPrice
        );
        results.set(listing.id, recommendation);
      } catch (error) {
        logger.error('Failed to analyze pricing for listing', { error, listingId: listing.id });
      }
    }

    return results;
  }

  // Price history analysis
  public analyzePriceHistory(priceHistory: Array<{
    date: Date;
    price: number;
    sales: number;
    revenue: number;
  }>): {
    trends: string[];
    recommendations: string[];
    optimalPrice: number;
  } {
    if (priceHistory.length < 2) {
      return {
        trends: ['Insufficient data for analysis'],
        recommendations: ['Collect more price history data'],
        optimalPrice: priceHistory[0]?.price || 0
      };
    }

    const trends = [];
    const recommendations = [];
    
    // Analyze price trends
    const sortedHistory = priceHistory.sort((a, b) => a.date.getTime() - b.date.getTime());
    const firstPrice = sortedHistory[0].price;
    const lastPrice = sortedHistory[sortedHistory.length - 1].price;
    const priceChange = ((lastPrice - firstPrice) / firstPrice) * 100;

    if (priceChange > 10) {
      trends.push('Significant price increases over time');
    } else if (priceChange < -10) {
      trends.push('Significant price decreases over time');
    } else {
      trends.push('Stable pricing over time');
    }

    // Find optimal price
    const optimalPoint = sortedHistory.reduce((max, current) => 
      current.revenue > max.revenue ? current : max
    );

    if (optimalPoint.price !== lastPrice) {
      recommendations.push(`Consider returning to $${optimalPoint.price} (historically best revenue)`);
    }

    return {
      trends,
      recommendations,
      optimalPrice: optimalPoint.price
    };
  }
}

// Export singleton instance
export const smartPricingEngine = new SmartPricingEngine();

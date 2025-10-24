/**
 * Niche Finder Engine
 * Discover profitable niches with low competition
 */

import { logger } from './logger';
import { db } from './db';
import { keywordCache } from './redis';

export interface NicheOpportunity {
  niche: string;
  category: string;
  demand: number; // 0-100
  competition: number; // 0-100
  opportunity: number; // 0-100
  difficulty: number; // 0-100
  avgPrice: number;
  totalListings: number;
  topKeywords: string[];
  marketSize: 'small' | 'medium' | 'large';
  trendDirection: 'growing' | 'stable' | 'declining';
  seasonality: 'low' | 'medium' | 'high';
  profitPotential: 'low' | 'medium' | 'high';
  entryBarriers: 'low' | 'medium' | 'high';
  recommendations: string[];
}

export interface NicheSearchFilters {
  minDemand?: number;
  maxCompetition?: number;
  minOpportunity?: number;
  maxDifficulty?: number;
  categories?: string[];
  marketSize?: string[];
  trendDirection?: string[];
  seasonality?: string[];
  profitPotential?: string[];
  entryBarriers?: string[];
}

export class NicheFinder {
  private categories = [
    'Home & Living',
    'Jewelry',
    'Art & Collectibles',
    'Clothing',
    'Accessories',
    'Crafts & Supplies',
    'Toys & Entertainment',
    'Health & Beauty',
    'Electronics & Accessories',
    'Books, Movies & Music',
    'Wedding & Party',
    'Pet Supplies',
    'Sports & Outdoors',
    'Office Products',
    'Automotive',
  ];

  /**
   * Find profitable niches based on criteria
   */
  async findProfitableNiches(
    filters: NicheSearchFilters = {},
    limit: number = 20
  ): Promise<NicheOpportunity[]> {
    try {
      // Get niche opportunities from cache or generate
      const cacheKey = `niches:${JSON.stringify(filters)}`;
      const cached = await keywordCache.get(cacheKey);
      
      if (cached && Array.isArray(cached)) {
        return cached.slice(0, limit);
      }

      const opportunities: NicheOpportunity[] = [];

      // Generate niche opportunities
      for (const category of this.categories) {
        const categoryNiches = await this.generateCategoryNiches(category, filters);
        opportunities.push(...categoryNiches);
      }

      // Sort by opportunity score
      opportunities.sort((a, b) => b.opportunity - a.opportunity);

      // Cache results
      await keywordCache.set(cacheKey, opportunities, 3600); // 1 hour

      logger.info('Niche opportunities found', {
        total: opportunities.length,
        filtered: opportunities.slice(0, limit).length,
        filters,
      });

      return opportunities.slice(0, limit);
    } catch (error) {
      logger.error('Failed to find profitable niches', { error });
      throw error;
    }
  }

  /**
   * Analyze a specific niche
   */
  async analyzeNiche(niche: string): Promise<NicheOpportunity> {
    try {
      // Get or generate niche analysis
      const cacheKey = `niche:${niche}`;
      const cached = await keywordCache.get(cacheKey);
      
      if (cached && typeof cached === 'object' && 'niche' in cached) {
        return cached as NicheOpportunity;
      }

      const analysis = await this.generateNicheAnalysis(niche);

      // Cache result
      await keywordCache.set(cacheKey, analysis, 7200); // 2 hours

      logger.info('Niche analysis completed', { niche, analysis });

      return analysis;
    } catch (error) {
      logger.error('Failed to analyze niche', { niche, error });
      throw error;
    }
  }

  /**
   * Get trending niches
   */
  async getTrendingNiches(limit: number = 10): Promise<NicheOpportunity[]> {
    try {
      const cacheKey = 'trending-niches';
      const cached = await keywordCache.get(cacheKey);
      
      if (cached && Array.isArray(cached)) {
        return cached.slice(0, limit);
      }

      // Get trending keywords from database
      const trendingKeywords = await db.keyword.findMany({
        where: {
          metrics: {
            some: {
              date: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
              },
            },
          },
        },
        include: {
          metrics: {
            orderBy: { date: 'desc' },
            take: 1,
          },
        },
        take: 100,
      });

      const trendingNiches: NicheOpportunity[] = [];

      for (const keyword of trendingKeywords) {
        if (keyword.metrics.length > 0) {
          const metric = keyword.metrics[0];
          
          // Only include niches with good opportunity scores
          if (metric.opportunity && metric.opportunity > 60) {
            const niche = await this.analyzeNiche(keyword.term);
            trendingNiches.push(niche);
          }
        }
      }

      // Sort by trend strength
      trendingNiches.sort((a, b) => b.opportunity - a.opportunity);

      // Cache results
      await keywordCache.set(cacheKey, trendingNiches, 1800); // 30 minutes

      return trendingNiches.slice(0, limit);
    } catch (error) {
      logger.error('Failed to get trending niches', { error });
      throw error;
    }
  }

  /**
   * Get niche recommendations for a user
   */
  async getPersonalizedNiches(
    userId: string,
    limit: number = 10
  ): Promise<NicheOpportunity[]> {
    try {
      // Get user's historical keyword usage
      const userKeywords = await db.userKeywordEvent.findMany({
        where: { userId },
        include: {
          keyword: {
            include: {
              metrics: {
                orderBy: { date: 'desc' },
                take: 1,
              },
            },
          },
        },
        take: 50,
      });

      // Analyze user's interests
      const userInterests = this.analyzeUserInterests(userKeywords);

      // Find niches matching user interests
      const personalizedNiches: NicheOpportunity[] = [];

      for (const interest of userInterests) {
        const niches = await this.findProfitableNiches({
          categories: [interest.category],
          minOpportunity: 50,
          maxDifficulty: 70,
        }, 5);

        personalizedNiches.push(...niches);
      }

      // Remove duplicates and sort
      const uniqueNiches = this.removeDuplicateNiches(personalizedNiches);
      uniqueNiches.sort((a, b) => b.opportunity - a.opportunity);

      logger.info('Personalized niches generated', {
        userId,
        userInterests: userInterests.length,
        niches: uniqueNiches.length,
      });

      return uniqueNiches.slice(0, limit);
    } catch (error) {
      logger.error('Failed to get personalized niches', { userId, error });
      throw error;
    }
  }

  /**
   * Generate niche opportunities for a category
   */
  private async generateCategoryNiches(
    category: string,
    filters: NicheSearchFilters
  ): Promise<NicheOpportunity[]> {
    const niches: NicheOpportunity[] = [];
    
    // Generate mock niche data for each category
    const categoryNicheData = this.getCategoryNicheData(category);
    
    for (const nicheData of categoryNicheData) {
      const niche: NicheOpportunity = {
        niche: nicheData.niche,
        category,
        demand: nicheData.demand,
        competition: nicheData.competition,
        opportunity: this.calculateOpportunity(nicheData.demand, nicheData.competition),
        difficulty: this.calculateDifficulty(nicheData.competition, nicheData.totalListings),
        avgPrice: nicheData.avgPrice,
        totalListings: nicheData.totalListings,
        topKeywords: nicheData.topKeywords,
        marketSize: this.determineMarketSize(nicheData.totalListings),
        trendDirection: nicheData.trendDirection,
        seasonality: nicheData.seasonality,
        profitPotential: this.calculateProfitPotential(nicheData.demand, nicheData.avgPrice),
        entryBarriers: this.calculateEntryBarriers(nicheData.competition, nicheData.totalListings),
        recommendations: this.generateRecommendations(nicheData),
      };

      // Apply filters
      if (this.matchesFilters(niche, filters)) {
        niches.push(niche);
      }
    }

    return niches;
  }

  /**
   * Generate detailed niche analysis
   */
  private async generateNicheAnalysis(niche: string): Promise<NicheOpportunity> {
    // Mock detailed analysis
    const analysis: NicheOpportunity = {
      niche,
      category: this.categorizeNiche(niche),
      demand: Math.floor(Math.random() * 100),
      competition: Math.floor(Math.random() * 100),
      opportunity: Math.floor(Math.random() * 100),
      difficulty: Math.floor(Math.random() * 100),
      avgPrice: Math.floor(Math.random() * 100) + 10,
      totalListings: Math.floor(Math.random() * 10000) + 100,
      topKeywords: this.generateTopKeywords(niche),
      marketSize: 'medium',
      trendDirection: 'growing',
      seasonality: 'medium',
      profitPotential: 'medium',
      entryBarriers: 'medium',
      recommendations: this.generateNicheRecommendations(niche),
    };

    // Recalculate based on actual values
    analysis.opportunity = this.calculateOpportunity(analysis.demand, analysis.competition);
    analysis.difficulty = this.calculateDifficulty(analysis.competition, analysis.totalListings);
    analysis.profitPotential = this.calculateProfitPotential(analysis.demand, analysis.avgPrice);
    analysis.entryBarriers = this.calculateEntryBarriers(analysis.competition, analysis.totalListings);

    return analysis;
  }

  /**
   * Analyze user interests from keyword history
   */
  private analyzeUserInterests(userKeywords: any[]): Array<{ category: string; strength: number }> {
    const categoryCounts: { [key: string]: number } = {};

    userKeywords.forEach(({ keyword }) => {
      const category = this.categorizeNiche(keyword.term);
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    return Object.entries(categoryCounts)
      .map(([category, count]) => ({ category, strength: count }))
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 5);
  }

  /**
   * Remove duplicate niches
   */
  private removeDuplicateNiches(niches: NicheOpportunity[]): NicheOpportunity[] {
    const seen = new Set();
    return niches.filter(niche => {
      if (seen.has(niche.niche)) {
        return false;
      }
      seen.add(niche.niche);
      return true;
    });
  }

  /**
   * Helper methods
   */
  private calculateOpportunity(demand: number, competition: number): number {
    return Math.round((demand * 0.7) + ((100 - competition) * 0.3));
  }

  private calculateDifficulty(competition: number, totalListings: number): number {
    const competitionScore = competition;
    const listingScore = Math.min((totalListings / 1000) * 100, 100);
    return Math.round((competitionScore * 0.6) + (listingScore * 0.4));
  }

  private determineMarketSize(totalListings: number): 'small' | 'medium' | 'large' {
    if (totalListings < 1000) return 'small';
    if (totalListings < 5000) return 'medium';
    return 'large';
  }

  private calculateProfitPotential(demand: number, avgPrice: number): 'low' | 'medium' | 'high' {
    const score = (demand / 100) * (avgPrice / 50);
    if (score > 0.7) return 'high';
    if (score > 0.4) return 'medium';
    return 'low';
  }

  private calculateEntryBarriers(competition: number, totalListings: number): 'low' | 'medium' | 'high' {
    const score = (competition / 100) * (Math.min(totalListings / 5000, 1));
    if (score > 0.7) return 'high';
    if (score > 0.4) return 'medium';
    return 'low';
  }

  private matchesFilters(niche: NicheOpportunity, filters: NicheSearchFilters): boolean {
    if (filters.minDemand && niche.demand < filters.minDemand) return false;
    if (filters.maxCompetition && niche.competition > filters.maxCompetition) return false;
    if (filters.minOpportunity && niche.opportunity < filters.minOpportunity) return false;
    if (filters.maxDifficulty && niche.difficulty > filters.maxDifficulty) return false;
    if (filters.categories && !filters.categories.includes(niche.category)) return false;
    if (filters.marketSize && !filters.marketSize.includes(niche.marketSize)) return false;
    if (filters.trendDirection && !filters.trendDirection.includes(niche.trendDirection)) return false;
    if (filters.seasonality && !filters.seasonality.includes(niche.seasonality)) return false;
    if (filters.profitPotential && !filters.profitPotential.includes(niche.profitPotential)) return false;
    if (filters.entryBarriers && !filters.entryBarriers.includes(niche.entryBarriers)) return false;
    return true;
  }

  private categorizeNiche(niche: string): string {
    // Simple categorization logic
    const lowerNiche = niche.toLowerCase();
    if (lowerNiche.includes('home') || lowerNiche.includes('decor')) return 'Home & Living';
    if (lowerNiche.includes('jewelry') || lowerNiche.includes('ring')) return 'Jewelry';
    if (lowerNiche.includes('art') || lowerNiche.includes('craft')) return 'Art & Collectibles';
    if (lowerNiche.includes('clothing') || lowerNiche.includes('dress')) return 'Clothing';
    if (lowerNiche.includes('accessory') || lowerNiche.includes('bag')) return 'Accessories';
    return 'Other';
  }

  private generateTopKeywords(niche: string): string[] {
    const baseKeywords = [niche];
    const variations = [
      `${niche} handmade`,
      `${niche} unique`,
      `${niche} custom`,
      `${niche} gift`,
      `vintage ${niche}`,
    ];
    return [...baseKeywords, ...variations.slice(0, 4)];
  }

  private generateRecommendations(nicheData: any): string[] {
    const recommendations = [];
    
    if (nicheData.competition < 30) {
      recommendations.push('Low competition - great opportunity to enter');
    }
    
    if (nicheData.demand > 70) {
      recommendations.push('High demand - focus on quality and differentiation');
    }
    
    if (nicheData.avgPrice > 50) {
      recommendations.push('Premium pricing potential - invest in quality');
    }
    
    return recommendations;
  }

  private generateNicheRecommendations(niche: string): string[] {
    return [
      `Focus on unique variations of ${niche}`,
      `Target long-tail keywords related to ${niche}`,
      `Consider seasonal timing for ${niche}`,
      `Research competitor pricing in ${niche} niche`,
      `Develop a strong brand identity for ${niche}`,
    ];
  }

  private getCategoryNicheData(category: string): any[] {
    // Mock niche data for each category
    const nicheDataMap: { [key: string]: any[] } = {
      'Home & Living': [
        { niche: 'minimalist home decor', demand: 85, competition: 45, avgPrice: 35, totalListings: 2500, trendDirection: 'growing', seasonality: 'medium', topKeywords: ['minimalist decor', 'modern home', 'simple design'] },
        { niche: 'vintage kitchenware', demand: 70, competition: 60, avgPrice: 25, totalListings: 3200, trendDirection: 'stable', seasonality: 'low', topKeywords: ['vintage kitchen', 'retro cookware', 'antique utensils'] },
      ],
      'Jewelry': [
        { niche: 'handmade earrings', demand: 90, competition: 70, avgPrice: 45, totalListings: 8500, trendDirection: 'growing', seasonality: 'medium', topKeywords: ['handmade earrings', 'artisan jewelry', 'unique earrings'] },
        { niche: 'minimalist rings', demand: 75, competition: 55, avgPrice: 65, totalListings: 4200, trendDirection: 'stable', seasonality: 'low', topKeywords: ['minimalist rings', 'simple jewelry', 'delicate rings'] },
      ],
      'Art & Collectibles': [
        { niche: 'digital art prints', demand: 80, competition: 40, avgPrice: 20, totalListings: 1800, trendDirection: 'growing', seasonality: 'low', topKeywords: ['digital art', 'printable art', 'wall art'] },
        { niche: 'vintage posters', demand: 65, competition: 50, avgPrice: 30, totalListings: 2100, trendDirection: 'stable', seasonality: 'medium', topKeywords: ['vintage posters', 'retro prints', 'collectible art'] },
      ],
    };

    return nicheDataMap[category] || [];
  }
}

/**
 * Live Etsy Integration for Real-time Competition Data
 */

import { EtsyClient } from './etsy';
import { logger } from './logger';
import { keywordCache } from './redis';
import { db } from './db';

export interface LiveEtsySearchResult {
  keyword: string;
  totalResults: number;
  averagePrice: number;
  priceRange: { min: number; max: number };
  topShops: Array<{
    shopId: number;
    shopName: string;
    listingCount: number;
    marketShare: number;
  }>;
  categoryDistribution: Array<{
    categoryId: number;
    categoryName: string;
    count: number;
    percentage: number;
  }>;
  averageListingAge: number;
  page1ShopConcentration: number;
  titleExactMatchRate: number;
  competitionLevel: 'low' | 'medium' | 'high';
  difficultyScore: number;
  lastUpdated: string;
}

export interface ShopCompetitionAnalysis {
  shopId: number;
  shopName: string;
  totalListings: number;
  activeListings: number;
  averagePrice: number;
  estimatedMonthlyRevenue: number;
  topKeywords: string[];
  marketPosition: 'leader' | 'challenger' | 'follower' | 'niche';
  strengths: string[];
  weaknesses: string[];
}

export class LiveEtsyIntegration {
  private etsyClient: EtsyClient | null = null;
  private isMockMode: boolean;

  constructor(accessToken?: string, refreshToken?: string) {
    this.isMockMode = process.env.ETSY_MOCK_MODE === 'true';
    
    if (!this.isMockMode && accessToken) {
      this.etsyClient = new EtsyClient(accessToken, refreshToken);
    }
  }

  /**
   * Get live competition data for a keyword
   */
  async getLiveCompetitionData(keyword: string): Promise<LiveEtsySearchResult> {
    const cacheKey = `live_etsy:${keyword}`;
    
    // Check cache first (5 minutes TTL for live data)
    const cached = await keywordCache.get(cacheKey);
    if (cached && typeof cached === 'object' && 'totalResults' in cached) {
      logger.info('Using cached live Etsy data', { keyword });
      return cached as LiveEtsySearchResult;
    }

    try {
      let result: LiveEtsySearchResult;

      if (this.isMockMode || !this.etsyClient) {
        result = await this.getMockLiveData(keyword);
      } else {
        result = await this.getRealLiveData(keyword);
      }

      // Cache for 5 minutes
      await keywordCache.set(cacheKey, result, 300);

      // Store in database for historical analysis
      await this.storeLiveData(keyword, result);

      return result;
    } catch (error) {
      logger.error('Failed to get live Etsy data', { keyword, error });
      
      // Fallback to mock data
      const fallbackResult = await this.getMockLiveData(keyword);
      return fallbackResult;
    }
  }

  /**
   * Analyze shop competition for a keyword
   */
  async analyzeShopCompetition(keyword: string, shopIds?: number[]): Promise<ShopCompetitionAnalysis[]> {
    try {
      const searchResult = await this.getLiveCompetitionData(keyword);
      const shops = searchResult.topShops;

      const analyses: ShopCompetitionAnalysis[] = [];

      for (const shop of shops.slice(0, 10)) { // Top 10 shops
        try {
          const analysis = await this.analyzeShop(shop.shopId, shop.shopName, keyword);
          analyses.push(analysis);
        } catch (error) {
          logger.warn('Failed to analyze shop', { shopId: shop.shopId, error });
        }
      }

      return analyses;
    } catch (error) {
      logger.error('Failed to analyze shop competition', { keyword, error });
      return [];
    }
  }

  /**
   * Get trending keywords in a category
   */
  async getTrendingKeywords(category?: string, limit = 20): Promise<string[]> {
    try {
      if (this.isMockMode || !this.etsyClient) {
        return this.getMockTrendingKeywords(category, limit);
      }

      // In a real implementation, this would use Etsy's trending data
      // For now, we'll use mock data
      return this.getMockTrendingKeywords(category, limit);
    } catch (error) {
      logger.error('Failed to get trending keywords', { category, error });
      return this.getMockTrendingKeywords(category, limit);
    }
  }

  /**
   * Get keyword suggestions based on live Etsy data
   */
  async getLiveKeywordSuggestions(baseKeyword: string, limit = 10): Promise<string[]> {
    try {
      const searchResult = await this.getLiveCompetitionData(baseKeyword);
      
      // Extract keywords from top-performing listings
      const suggestions = new Set<string>();
      
      // Add variations based on category distribution
      searchResult.categoryDistribution.forEach(category => {
        const categoryWords = category.categoryName.toLowerCase().split(' ');
        categoryWords.forEach(word => {
          if (word.length > 3 && !baseKeyword.toLowerCase().includes(word)) {
            suggestions.add(`${baseKeyword} ${word}`);
          }
        });
      });

      // Add shop-based suggestions
      searchResult.topShops.forEach(shop => {
        const shopWords = shop.shopName.toLowerCase().split(' ');
        shopWords.forEach(word => {
          if (word.length > 3 && !baseKeyword.toLowerCase().includes(word)) {
            suggestions.add(`${word} ${baseKeyword}`);
          }
        });
      });

      return Array.from(suggestions).slice(0, limit);
    } catch (error) {
      logger.error('Failed to get live keyword suggestions', { baseKeyword, error });
      return [];
    }
  }

  private async getRealLiveData(keyword: string): Promise<LiveEtsySearchResult> {
    if (!this.etsyClient) {
      throw new Error('Etsy client not initialized');
    }

    try {
      // Search for listings
      const searchResults = await this.etsyClient.searchListings(keyword, {
        limit: 100,
        sort_on: 'score',
        sort_order: 'down'
      });

      const listings = searchResults.results || [];
      const totalResults = searchResults.count || 0;

      // Analyze the data
      const analysis = this.analyzeSearchResults(listings, keyword);
      
      return {
        keyword,
        totalResults,
        ...analysis,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Real Etsy API error', { keyword, error });
      throw error;
    }
  }

  private async getMockLiveData(keyword: string): Promise<LiveEtsySearchResult> {
    // Generate realistic mock data based on keyword
    const baseResults = Math.floor(Math.random() * 50000) + 1000;
    const keywordMultiplier = this.getKeywordMultiplier(keyword);
    const totalResults = Math.floor(baseResults * keywordMultiplier);

    const prices = Array.from({ length: 50 }, () => 
      Math.floor(Math.random() * 10000) + 500 // $5-$100
    );

    const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const priceRange = {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };

    // Generate top shops
    const topShops = Array.from({ length: 10 }, (_, i) => ({
      shopId: 10000000 + i,
      shopName: `TopShop${i + 1}`,
      listingCount: Math.floor(Math.random() * 20) + 1,
      marketShare: Math.random() * 15 + 5, // 5-20% market share
    }));

    // Generate category distribution
    const categories = [
      'Home & Living',
      'Jewelry',
      'Art & Collectibles',
      'Clothing',
      'Craft Supplies & Tools',
      'Bags & Purses',
      'Accessories',
      'Shoes',
      'Toys & Entertainment',
      'Wedding & Party',
    ];

    const categoryDistribution = categories.map((category, index) => ({
      categoryId: 69150467 + index,
      categoryName: category,
      count: Math.floor(Math.random() * 20) + 1,
      percentage: Math.random() * 20 + 5,
    }));

    const averageListingAge = Math.floor(Math.random() * 365) + 30; // 30-395 days
    const page1ShopConcentration = Math.random() * 60 + 20; // 20-80%
    const titleExactMatchRate = Math.random() * 40 + 10; // 10-50%

    let competitionLevel: 'low' | 'medium' | 'high';
    let difficultyScore: number;

    if (totalResults < 5000) {
      competitionLevel = 'low';
      difficultyScore = Math.floor(Math.random() * 30) + 10; // 10-40
    } else if (totalResults < 20000) {
      competitionLevel = 'medium';
      difficultyScore = Math.floor(Math.random() * 40) + 30; // 30-70
    } else {
      competitionLevel = 'high';
      difficultyScore = Math.floor(Math.random() * 30) + 70; // 70-100
    }

    return {
      keyword,
      totalResults,
      averagePrice,
      priceRange,
      topShops,
      categoryDistribution,
      averageListingAge,
      page1ShopConcentration,
      titleExactMatchRate,
      competitionLevel,
      difficultyScore,
      lastUpdated: new Date().toISOString(),
    };
  }

  private analyzeSearchResults(listings: any[], keyword: string) {
    if (listings.length === 0) {
      return {
        averagePrice: 0,
        priceRange: { min: 0, max: 0 },
        topShops: [],
        categoryDistribution: [],
        averageListingAge: 0,
        page1ShopConcentration: 0,
        titleExactMatchRate: 0,
        competitionLevel: 'low' as const,
        difficultyScore: 10,
      };
    }

    // Calculate average price
    const prices = listings
      .map(listing => listing.price?.amount || 0)
      .filter(price => price > 0);
    
    const averagePrice = prices.length > 0 
      ? prices.reduce((sum, price) => sum + price, 0) / prices.length
      : 0;

    const priceRange = {
      min: prices.length > 0 ? Math.min(...prices) : 0,
      max: prices.length > 0 ? Math.max(...prices) : 0,
    };

    // Analyze top shops
    const shopStats: { [key: number]: { shopName: string; listingCount: number } } = {};
    listings.forEach(listing => {
      const shopId = listing.shop_id;
      if (shopStats[shopId]) {
        shopStats[shopId].listingCount++;
      } else {
        shopStats[shopId] = {
          shopName: listing.shop_name || 'Unknown Shop',
          listingCount: 1,
        };
      }
    });

    const topShops = Object.entries(shopStats)
      .map(([shopId, stats]) => ({
        shopId: parseInt(shopId),
        shopName: stats.shopName,
        listingCount: stats.listingCount,
        marketShare: (stats.listingCount / listings.length) * 100,
      }))
      .sort((a, b) => b.listingCount - a.listingCount)
      .slice(0, 10);

    // Category distribution
    const categoryStats: { [key: number]: { categoryName: string; count: number } } = {};
    listings.forEach(listing => {
      const categoryId = listing.taxonomy_id;
      if (categoryId && categoryStats[categoryId]) {
        categoryStats[categoryId].count++;
      } else if (categoryId) {
        categoryStats[categoryId] = {
          categoryName: listing.taxonomy_path?.join(' > ') || 'Unknown Category',
          count: 1,
        };
      }
    });

    const categoryDistribution = Object.entries(categoryStats)
      .map(([categoryId, stats]) => ({
        categoryId: parseInt(categoryId),
        categoryName: stats.categoryName,
        count: stats.count,
        percentage: (stats.count / listings.length) * 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Average listing age
    const now = Date.now() / 1000;
    const ages = listings
      .map(listing => now - (listing.creation_tsz || now))
      .filter(age => age >= 0);
    
    const averageListingAge = ages.length > 0
      ? ages.reduce((sum, age) => sum + age, 0) / ages.length
      : 0;

    // Page 1 shop concentration (top 20 listings)
    const top20Listings = listings.slice(0, 20);
    const top20Shops = new Set(top20Listings.map(listing => listing.shop_id));
    const page1ShopConcentration = (top20Shops.size / 20) * 100;

    // Title exact match rate
    const exactMatches = listings.filter(listing => 
      listing.title?.toLowerCase().includes(keyword.toLowerCase())
    );
    const titleExactMatchRate = (exactMatches.length / listings.length) * 100;

    // Competition level and difficulty score
    let competitionLevel: 'low' | 'medium' | 'high';
    let difficultyScore: number;

    if (listings.length < 100) {
      competitionLevel = 'low';
      difficultyScore = 20;
    } else if (listings.length < 1000) {
      competitionLevel = 'medium';
      difficultyScore = 50;
    } else {
      competitionLevel = 'high';
      difficultyScore = 80;
    }

    // Adjust difficulty based on shop concentration
    if (page1ShopConcentration < 30) {
      difficultyScore += 20; // Few shops dominating = harder to break in
    } else if (page1ShopConcentration > 70) {
      difficultyScore -= 10; // Many shops = more opportunities
    }

    return {
      averagePrice,
      priceRange,
      topShops,
      categoryDistribution,
      averageListingAge,
      page1ShopConcentration,
      titleExactMatchRate,
      competitionLevel,
      difficultyScore: Math.min(100, Math.max(0, difficultyScore)),
    };
  }

  private async analyzeShop(shopId: number, shopName: string, keyword: string): Promise<ShopCompetitionAnalysis> {
    try {
      if (this.isMockMode || !this.etsyClient) {
        return this.getMockShopAnalysis(shopId, shopName);
      }

      // Get shop stats and listings
      const [shopStats, listings] = await Promise.all([
        this.etsyClient.getShopStats(shopId),
        this.etsyClient.getShopListings(shopId, { limit: 100, state: 'active' })
      ]);

      const activeListings = listings.results?.length || 0;
      const totalListings = shopStats.listing_active_count || activeListings;

      // Calculate average price
      const prices = listings.results?.map((listing: any) => listing.price?.amount || 0) || [];
      const averagePrice = prices.length > 0 
        ? prices.reduce((sum: number, price: number) => sum + price, 0) / prices.length
        : 0;

      // Estimate monthly revenue (mock calculation)
      const estimatedMonthlyRevenue = activeListings * averagePrice * 0.1; // 10% conversion rate

      // Extract top keywords from listings
      const allTags = listings.results?.flatMap((listing: any) => listing.tags || []) || [];
      const tagCounts: { [key: string]: number } = {};
      allTags.forEach((tag: string) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });

      const topKeywords = Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([tag]) => tag);

      // Determine market position
      let marketPosition: 'leader' | 'challenger' | 'follower' | 'niche';
      if (activeListings > 100) {
        marketPosition = 'leader';
      } else if (activeListings > 50) {
        marketPosition = 'challenger';
      } else if (activeListings > 20) {
        marketPosition = 'follower';
      } else {
        marketPosition = 'niche';
      }

      return {
        shopId,
        shopName,
        totalListings,
        activeListings,
        averagePrice,
        estimatedMonthlyRevenue,
        topKeywords,
        marketPosition,
        strengths: this.generateStrengths(activeListings, averagePrice, marketPosition),
        weaknesses: this.generateWeaknesses(activeListings, averagePrice, marketPosition),
      };
    } catch (error) {
      logger.error('Failed to analyze shop', { shopId, error });
      return this.getMockShopAnalysis(shopId, shopName);
    }
  }

  private getMockShopAnalysis(shopId: number, shopName: string): ShopCompetitionAnalysis {
    const activeListings = Math.floor(Math.random() * 200) + 10;
    const averagePrice = Math.floor(Math.random() * 5000) + 1000;
    const estimatedMonthlyRevenue = activeListings * averagePrice * 0.1;

    const topKeywords = [
      'handmade',
      'unique',
      'gift',
      'custom',
      'artisan',
      'vintage',
      'bohemian',
      'minimalist',
      'rustic',
      'modern'
    ].slice(0, Math.floor(Math.random() * 5) + 5);

    let marketPosition: 'leader' | 'challenger' | 'follower' | 'niche';
    if (activeListings > 100) {
      marketPosition = 'leader';
    } else if (activeListings > 50) {
      marketPosition = 'challenger';
    } else if (activeListings > 20) {
      marketPosition = 'follower';
    } else {
      marketPosition = 'niche';
    }

    return {
      shopId,
      shopName,
      totalListings: activeListings + Math.floor(Math.random() * 50),
      activeListings,
      averagePrice,
      estimatedMonthlyRevenue,
      topKeywords,
      marketPosition,
      strengths: this.generateStrengths(activeListings, averagePrice, marketPosition),
      weaknesses: this.generateWeaknesses(activeListings, averagePrice, marketPosition),
    };
  }

  private generateStrengths(activeListings: number, averagePrice: number, marketPosition: string): string[] {
    const strengths = [];
    
    if (activeListings > 50) strengths.push('Large inventory');
    if (averagePrice > 3000) strengths.push('Premium pricing');
    if (marketPosition === 'leader') strengths.push('Market leadership');
    if (activeListings > 20) strengths.push('Consistent listing activity');
    if (averagePrice > 2000) strengths.push('High-value products');
    
    return strengths.length > 0 ? strengths : ['Growing presence'];
  }

  private generateWeaknesses(activeListings: number, averagePrice: number, marketPosition: string): string[] {
    const weaknesses = [];
    
    if (activeListings < 20) weaknesses.push('Limited inventory');
    if (averagePrice < 2000) weaknesses.push('Low price point');
    if (marketPosition === 'niche') weaknesses.push('Narrow market focus');
    if (activeListings < 10) weaknesses.push('Inconsistent listing activity');
    
    return weaknesses.length > 0 ? weaknesses : ['Room for growth'];
  }

  private getKeywordMultiplier(keyword: string): number {
    const popularKeywords = [
      'jewelry', 'handmade', 'vintage', 'home decor', 'art',
      'clothing', 'accessories', 'gifts', 'wedding', 'christmas'
    ];
    
    const keywordLower = keyword.toLowerCase();
    const isPopular = popularKeywords.some(popular => keywordLower.includes(popular));
    
    return isPopular ? 2.5 : 1.0;
  }

  private getMockTrendingKeywords(category?: string, limit = 20): string[] {
    const trendingByCategory: { [key: string]: string[] } = {
      'jewelry': [
        'handmade jewelry',
        'vintage jewelry',
        'statement necklace',
        'earrings set',
        'bracelet stack'
      ],
      'home': [
        'home decor',
        'wall art',
        'throw pillow',
        'candle holder',
        'plant pot'
      ],
      'clothing': [
        'vintage clothing',
        'bohemian dress',
        'handmade shirt',
        'custom t-shirt',
        'artisan jacket'
      ]
    };

    if (category && trendingByCategory[category.toLowerCase()]) {
      return trendingByCategory[category.toLowerCase()].slice(0, limit);
    }

    // Default trending keywords
    return [
      'handmade jewelry',
      'vintage clothing',
      'home decor',
      'art prints',
      'ceramic mugs',
      'wooden cutting board',
      'macrame wall hanging',
      'leather wallet',
      'crochet blanket',
      'polymer clay earrings'
    ].slice(0, limit);
  }

  private async storeLiveData(keyword: string, data: LiveEtsySearchResult): Promise<void> {
    try {
      // Store in database for historical analysis
      const keywordRecord = await db.keyword.findUnique({
        where: { term: keyword }
      });

      if (keywordRecord) {
        await db.keywordMetricsDaily.upsert({
          where: {
            keywordId_date: {
              keywordId: keywordRecord.id,
              date: new Date(),
            },
          },
          update: {
            activeListings: data.totalResults,
            page1ShopConc: data.page1ShopConcentration,
            titleExactRate: data.titleExactMatchRate,
            difficulty: data.difficultyScore,
          },
          create: {
            keywordId: keywordRecord.id,
            date: new Date(),
            activeListings: data.totalResults,
            page1ShopConc: data.page1ShopConcentration,
            titleExactRate: data.titleExactMatchRate,
            difficulty: data.difficultyScore,
          },
        });
      }
    } catch (error) {
      logger.error('Failed to store live data', { keyword, error });
    }
  }
}

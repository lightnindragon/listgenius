/**
 * Rank Tracking System
 * Track keyword rankings for Etsy listings
 */

import { EtsyClient } from './etsy';
import { logger } from './logger';
import { db } from './db';
import { keywordCache } from './redis';

export interface RankTrackingResult {
  keywordId: string;
  keyword: string;
  listingId: number;
  position: number | null; // null if not found in top 100
  page: number | null;
  found: boolean;
  previousPosition: number | null;
  positionChange: number | null;
  trackedAt: string;
}

export interface RankTrackingSummary {
  totalKeywords: number;
  keywordsFound: number;
  keywordsNotFound: number;
  averagePosition: number;
  positionImprovements: number;
  positionDeclines: number;
  newRankings: number;
  top10Count: number;
  top50Count: number;
}

export interface RankTrackingHistory {
  keyword: string;
  listingId: number;
  history: Array<{
    date: string;
    position: number | null;
    page: number | null;
    found: boolean;
  }>;
  currentPosition: number | null;
  bestPosition: number | null;
  worstPosition: number | null;
  averagePosition: number;
  positionTrend: 'improving' | 'declining' | 'stable';
  daysTracked: number;
}

export class RankTrackingService {
  private etsyClient: EtsyClient | null = null;
  private isMockMode: boolean;

  constructor(accessToken?: string, refreshToken?: string) {
    this.isMockMode = process.env.ETSY_MOCK_MODE === 'true';
    
    if (!this.isMockMode && accessToken) {
      this.etsyClient = new EtsyClient(accessToken, refreshToken);
    }
  }

  /**
   * Track rankings for a user's keywords
   */
  async trackUserRankings(userId: string): Promise<RankTrackingSummary> {
    try {
      // Get user's tracked keywords
      const trackedKeywords = await this.getUserTrackedKeywords(userId);
      
      if (trackedKeywords.length === 0) {
        return this.getEmptySummary();
      }

      const results: RankTrackingResult[] = [];
      let processedCount = 0;

      // Process keywords in batches to avoid rate limits
      const batchSize = 10;
      for (let i = 0; i < trackedKeywords.length; i += batchSize) {
        const batch = trackedKeywords.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (tracking: any) => {
          try {
            const result = await this.trackKeywordRanking(
              tracking.keyword.term,
              tracking.listingId
            );
            
            // Store result in database
            await this.storeRankingResult(userId, tracking.keywordId, tracking.listingId, result);
            
            return result;
          } catch (error) {
            logger.warn('Failed to track keyword ranking', {
              keyword: tracking.keyword.term,
              listingId: tracking.listingId,
              error,
            });
            return null;
          }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults.filter(result => result !== null));
        
        processedCount += batch.length;
        logger.info('Processed batch of keyword rankings', {
          userId,
          batchProcessed: batch.length,
          totalProcessed: processedCount,
          totalKeywords: trackedKeywords.length,
        });

        // Add delay between batches to respect rate limits
        if (i + batchSize < trackedKeywords.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Generate summary
      const summary = this.generateSummary(results);

      logger.info('User keyword rankings tracked', {
        userId,
        totalKeywords: trackedKeywords.length,
        successfulTrackings: results.length,
        summary,
      });

      return summary;
    } catch (error) {
      logger.error('Failed to track user rankings', { userId, error });
      throw error;
    }
  }

  /**
   * Track ranking for a specific keyword
   */
  async trackKeywordRanking(keyword: string, listingId: number): Promise<RankTrackingResult> {
    try {
      // Get previous ranking for comparison
      const previousRanking = await this.getPreviousRanking(keyword, listingId);
      
      let position: number | null = null;
      let page: number | null = null;
      let found = false;

      if (this.isMockMode || !this.etsyClient) {
        // Mock ranking data
        const mockPosition = Math.floor(Math.random() * 100) + 1;
        position = mockPosition <= 50 ? mockPosition : null;
        page = position ? Math.ceil(position / 12) : null;
        found = position !== null;
      } else {
        // Real Etsy search
        const searchResults = await this.etsyClient.searchListings(keyword, {
          limit: 100,
          sort_on: 'score',
          sort_order: 'down',
        });

        const listings = searchResults.results || [];
        const listingIndex = listings.findIndex((listing: any) => listing.listing_id === listingId);
        
        if (listingIndex !== -1) {
          position = listingIndex + 1;
          page = position ? Math.ceil(position / 12) : null;
          found = true;
        }
      }

      const result: RankTrackingResult = {
        keywordId: '', // Will be set by caller
        keyword,
        listingId,
        position,
        page,
        found,
        previousPosition: previousRanking?.position || null,
        positionChange: previousRanking && previousRanking.position && position ? 
          position - previousRanking.position : 
          null,
        trackedAt: new Date().toISOString(),
      };

      return result;
    } catch (error) {
      logger.error('Failed to track keyword ranking', { keyword, listingId, error });
      throw error;
    }
  }

  /**
   * Get ranking history for a keyword
   */
  async getRankingHistory(
    userId: string,
    keyword: string,
    listingId: number,
    days: number = 30
  ): Promise<RankTrackingHistory> {
    try {
      const keywordRecord = await db.keyword.findUnique({
        where: { term: keyword },
      });

      if (!keywordRecord) {
        throw new Error('Keyword not found');
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const rankings = await db.keywordRankTracking.findMany({
        where: {
          userId,
          listingId: BigInt(listingId),
          keywordId: keywordRecord.id,
          date: {
            gte: startDate,
          },
        },
        orderBy: { date: 'asc' },
      });

      const history = rankings.map((ranking: any) => ({
        date: ranking.date.toISOString(),
        position: ranking.position,
        page: ranking.page,
        found: ranking.position !== null,
      }));

      const currentPosition = history.length > 0 ? history[history.length - 1].position : null;
      const validPositions = history.filter((h: any) => h.position !== null).map((h: any) => h.position!);
      
      const bestPosition = validPositions.length > 0 ? Math.min(...validPositions) : null;
      const worstPosition = validPositions.length > 0 ? Math.max(...validPositions) : null;
      const averagePosition = validPositions.length > 0 ? 
        Math.round(validPositions.reduce((sum: any, pos: any) => sum + pos, 0) / validPositions.length) : 
        0;

      // Determine trend
      let positionTrend: 'improving' | 'declining' | 'stable' = 'stable';
      if (history.length >= 2) {
        const recentPositions = history.slice(-7).filter((h: any) => h.position !== null).map((h: any) => h.position!);
        if (recentPositions.length >= 3) {
          const firstHalf = recentPositions.slice(0, Math.floor(recentPositions.length / 2));
          const secondHalf = recentPositions.slice(Math.floor(recentPositions.length / 2));
          
          const firstAvg = firstHalf.reduce((sum: any, pos: any) => sum + pos, 0) / firstHalf.length;
          const secondAvg = secondHalf.reduce((sum: any, pos: any) => sum + pos, 0) / secondHalf.length;
          
          if (secondAvg < firstAvg - 2) {
            positionTrend = 'improving';
          } else if (secondAvg > firstAvg + 2) {
            positionTrend = 'declining';
          }
        }
      }

      return {
        keyword,
        listingId,
        history,
        currentPosition,
        bestPosition,
        worstPosition,
        averagePosition,
        positionTrend,
        daysTracked: history.length,
      };
    } catch (error) {
      logger.error('Failed to get ranking history', { userId, keyword, listingId, error });
      throw error;
    }
  }

  /**
   * Add keyword to tracking list
   */
  async addKeywordTracking(
    userId: string,
    keyword: string,
    listingId: number
  ): Promise<void> {
    try {
      // Get or create keyword record
      let keywordRecord = await db.keyword.findUnique({
        where: { term: keyword },
      });

      if (!keywordRecord) {
        keywordRecord = await db.keyword.create({
          data: {
            term: keyword,
            language: 'en-US',
          },
        });
      }

      // Check if already tracking
      const existing = await db.keywordRankTracking.findFirst({
        where: {
          userId,
          listingId: BigInt(listingId),
          keywordId: keywordRecord.id,
        },
      });

      if (!existing) {
        // Add to tracking
        await db.keywordRankTracking.create({
          data: {
            userId,
            listingId: BigInt(listingId),
            keywordId: keywordRecord.id,
            date: new Date(),
            position: null,
            page: null,
          },
        });

        logger.info('Keyword added to tracking', { userId, keyword, listingId });
      }
    } catch (error) {
      logger.error('Failed to add keyword tracking', { userId, keyword, listingId, error });
      throw error;
    }
  }

  /**
   * Remove keyword from tracking list
   */
  async removeKeywordTracking(
    userId: string,
    keyword: string,
    listingId: number
  ): Promise<void> {
    try {
      const keywordRecord = await db.keyword.findUnique({
        where: { term: keyword },
      });

      if (keywordRecord) {
        await db.keywordRankTracking.deleteMany({
          where: {
            userId,
            listingId: BigInt(listingId),
            keywordId: keywordRecord.id,
          },
        });

        logger.info('Keyword removed from tracking', { userId, keyword, listingId });
      }
    } catch (error) {
      logger.error('Failed to remove keyword tracking', { userId, keyword, listingId, error });
      throw error;
    }
  }

  /**
   * Get user's tracked keywords
   */
  private async getUserTrackedKeywords(userId: string) {
    return await db.keywordRankTracking.findMany({
      where: { userId },
      include: {
        keyword: true,
      },
      distinct: ['keywordId', 'listingId'],
    });
  }

  /**
   * Get previous ranking for comparison
   */
  private async getPreviousRanking(keyword: string, listingId: number) {
    const keywordRecord = await db.keyword.findUnique({
      where: { term: keyword },
    });

    if (!keywordRecord) return null;

    return await db.keywordRankTracking.findFirst({
      where: {
        keywordId: keywordRecord.id,
        listingId: BigInt(listingId),
        position: { not: null },
      },
      orderBy: { date: 'desc' },
    });
  }

  /**
   * Store ranking result in database
   */
  private async storeRankingResult(
    userId: string,
    keywordId: string,
    listingId: number,
    result: RankTrackingResult
  ): Promise<void> {
    await db.keywordRankTracking.create({
      data: {
        userId,
        listingId: BigInt(listingId),
        keywordId,
        date: new Date(),
        position: result.position,
        page: result.page,
      },
    });
  }

  /**
   * Generate summary from tracking results
   */
  private generateSummary(results: RankTrackingResult[]): RankTrackingSummary {
    const totalKeywords = results.length;
    const keywordsFound = results.filter(r => r.found).length;
    const keywordsNotFound = totalKeywords - keywordsFound;
    
    const foundPositions = results.filter(r => r.found).map(r => r.position!);
    const averagePosition = foundPositions.length > 0 ? 
      Math.round(foundPositions.reduce((sum, pos) => sum + pos, 0) / foundPositions.length) : 
      0;

    const positionImprovements = results.filter(r => 
      r.positionChange !== null && r.positionChange < 0
    ).length;
    
    const positionDeclines = results.filter(r => 
      r.positionChange !== null && r.positionChange > 0
    ).length;
    
    const newRankings = results.filter(r => 
      r.previousPosition === null && r.found
    ).length;

    const top10Count = results.filter(r => r.found && r.position! <= 10).length;
    const top50Count = results.filter(r => r.found && r.position! <= 50).length;

    return {
      totalKeywords,
      keywordsFound,
      keywordsNotFound,
      averagePosition,
      positionImprovements,
      positionDeclines,
      newRankings,
      top10Count,
      top50Count,
    };
  }

  /**
   * Get empty summary for when no keywords are tracked
   */
  private getEmptySummary(): RankTrackingSummary {
    return {
      totalKeywords: 0,
      keywordsFound: 0,
      keywordsNotFound: 0,
      averagePosition: 0,
      positionImprovements: 0,
      positionDeclines: 0,
      newRankings: 0,
      top10Count: 0,
      top50Count: 0,
    };
  }
}

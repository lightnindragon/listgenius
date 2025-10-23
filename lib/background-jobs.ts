/**
 * Background Jobs System
 * Automated data collection and processing jobs
 */

import { logger } from './logger';
import { db } from './db';
import { keywordCache } from './redis';
import { EtsyClient } from './etsy';
import { KeywordDifficultyCalculator } from './keyword-difficulty-calculator';
import { RankTrackingService } from './rank-tracking';
import { CompetitorAnalyzer } from './competitor-analyzer';

export interface JobStatus {
  jobId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: string;
  completedAt?: string;
  error?: string;
  progress?: number;
  result?: any;
}

export interface JobResult {
  success: boolean;
  processed: number;
  errors: number;
  duration: number;
  message: string;
}

export class BackgroundJobManager {
  private runningJobs: Map<string, JobStatus> = new Map();

  /**
   * Job 1: Daily Keyword Metrics Collection
   */
  async collectKeywordMetrics(): Promise<JobResult> {
    const jobId = `keyword-metrics-${Date.now()}`;
    const startTime = Date.now();

    try {
      this.setJobStatus(jobId, 'running', 0);

      // Get all active keywords
      const keywords = await db.keyword.findMany({
        where: {
          metrics: {
            some: {
              date: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
              },
            },
          },
        },
        take: 1000, // Process in batches
      });

      let processed = 0;
      let errors = 0;

      for (const keyword of keywords) {
        try {
          // Simulate keyword metrics collection
          const metrics = await this.simulateKeywordMetricsCollection(keyword.term);
          
          // Store metrics
          await db.keywordMetricsDaily.upsert({
            where: {
              keywordId_date: {
                keywordId: keyword.id,
                date: new Date(),
              },
            },
            update: {
              activeListings: metrics.activeListings,
              demand: metrics.demand,
              competition: metrics.competition,
              seasonality: metrics.seasonality,
              opportunity: metrics.opportunity,
              difficulty: metrics.difficulty,
            },
            create: {
              keywordId: keyword.id,
              date: new Date(),
              activeListings: metrics.activeListings,
              demand: metrics.demand,
              competition: metrics.competition,
              seasonality: metrics.seasonality,
              opportunity: metrics.opportunity,
              difficulty: metrics.difficulty,
            },
          });

          processed++;
          this.setJobStatus(jobId, 'running', (processed / keywords.length) * 100);
        } catch (error) {
          errors++;
          logger.warn('Failed to collect metrics for keyword', { keyword: keyword.term, error });
        }
      }

      const duration = Date.now() - startTime;
      this.setJobStatus(jobId, 'completed', 100);

      logger.info('Keyword metrics collection completed', {
        jobId,
        processed,
        errors,
        duration,
      });

      return {
        success: true,
        processed,
        errors,
        duration,
        message: `Processed ${processed} keywords with ${errors} errors`,
      };
    } catch (error) {
      this.setJobStatus(jobId, 'failed', undefined, error instanceof Error ? error.message : 'Unknown error');
      logger.error('Keyword metrics collection failed', { jobId, error });
      throw error;
    }
  }

  /**
   * Job 2: Daily Rank Tracking
   */
  async trackKeywordRankings(): Promise<JobResult> {
    const jobId = `rank-tracking-${Date.now()}`;
    const startTime = Date.now();

    try {
      this.setJobStatus(jobId, 'running', 0);

      // Get all users with tracked keywords
      const trackedKeywords = await db.keywordRankTracking.findMany({
        distinct: ['userId'],
        select: { userId: true },
      });

      let processed = 0;
      let errors = 0;

      for (const { userId } of trackedKeywords) {
        try {
          const rankTrackingService = new RankTrackingService();
          await rankTrackingService.trackUserRankings(userId);
          processed++;
        } catch (error) {
          errors++;
          logger.warn('Failed to track rankings for user', { userId, error });
        }

        this.setJobStatus(jobId, 'running', (processed / trackedKeywords.length) * 100);
      }

      const duration = Date.now() - startTime;
      this.setJobStatus(jobId, 'completed', 100);

      logger.info('Rank tracking completed', {
        jobId,
        processed,
        errors,
        duration,
      });

      return {
        success: true,
        processed,
        errors,
        duration,
        message: `Tracked rankings for ${processed} users with ${errors} errors`,
      };
    } catch (error) {
      this.setJobStatus(jobId, 'failed', undefined, error instanceof Error ? error.message : 'Unknown error');
      logger.error('Rank tracking failed', { jobId, error });
      throw error;
    }
  }

  /**
   * Job 3: Competitor Analysis
   */
  async analyzeCompetitors(): Promise<JobResult> {
    const jobId = `competitor-analysis-${Date.now()}`;
    const startTime = Date.now();

    try {
      this.setJobStatus(jobId, 'running', 0);

      // Get all tracked competitors
      const competitors = await db.competitorShop.findMany({
        include: {
          snapshots: {
            orderBy: { date: 'desc' },
            take: 1,
          },
        },
      });

      let processed = 0;
      let errors = 0;

      for (const competitor of competitors) {
        try {
          const competitorAnalyzer = new CompetitorAnalyzer();
          await competitorAnalyzer.analyzeCompetitor(competitor.userId, Number(competitor.shopId));
          processed++;
        } catch (error) {
          errors++;
          logger.warn('Failed to analyze competitor', { competitorId: competitor.id, error });
        }

        this.setJobStatus(jobId, 'running', (processed / competitors.length) * 100);
      }

      const duration = Date.now() - startTime;
      this.setJobStatus(jobId, 'completed', 100);

      logger.info('Competitor analysis completed', {
        jobId,
        processed,
        errors,
        duration,
      });

      return {
        success: true,
        processed,
        errors,
        duration,
        message: `Analyzed ${processed} competitors with ${errors} errors`,
      };
    } catch (error) {
      this.setJobStatus(jobId, 'failed', undefined, error instanceof Error ? error.message : 'Unknown error');
      logger.error('Competitor analysis failed', { jobId, error });
      throw error;
    }
  }

  /**
   * Job 4: Generate Keyword Difficulty Scores
   */
  async generateDifficultyScores(): Promise<JobResult> {
    const jobId = `difficulty-scores-${Date.now()}`;
    const startTime = Date.now();

    try {
      this.setJobStatus(jobId, 'running', 0);

      // Get keywords without difficulty scores
      const keywords = await db.keyword.findMany({
        where: {
          metrics: {
            some: {
              difficulty: null,
            },
          },
        },
        take: 500, // Process in batches
      });

      let processed = 0;
      let errors = 0;

      const difficultyCalculator = new KeywordDifficultyCalculator();

      for (const keyword of keywords) {
        try {
          const difficultyScore = await difficultyCalculator.calculateDifficulty(keyword.term);
          
          // Update the keyword with difficulty score
          await db.keywordMetricsDaily.updateMany({
            where: {
              keywordId: keyword.id,
              difficulty: null,
            },
            data: {
              difficulty: difficultyScore.overallScore,
            },
          });

          processed++;
          this.setJobStatus(jobId, 'running', (processed / keywords.length) * 100);
        } catch (error) {
          errors++;
          logger.warn('Failed to calculate difficulty for keyword', { keyword: keyword.term, error });
        }
      }

      const duration = Date.now() - startTime;
      this.setJobStatus(jobId, 'completed', 100);

      logger.info('Difficulty scores generation completed', {
        jobId,
        processed,
        errors,
        duration,
      });

      return {
        success: true,
        processed,
        errors,
        duration,
        message: `Generated difficulty scores for ${processed} keywords with ${errors} errors`,
      };
    } catch (error) {
      this.setJobStatus(jobId, 'failed', undefined, error instanceof Error ? error.message : 'Unknown error');
      logger.error('Difficulty scores generation failed', { jobId, error });
      throw error;
    }
  }

  /**
   * Job 5: Cleanup Old Data
   */
  async cleanupOldData(): Promise<JobResult> {
    const jobId = `cleanup-${Date.now()}`;
    const startTime = Date.now();

    try {
      this.setJobStatus(jobId, 'running', 0);

      const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days ago
      let processed = 0;
      let errors = 0;

      // Cleanup old keyword metrics
      try {
        const deletedMetrics = await db.keywordMetricsDaily.deleteMany({
          where: {
            date: {
              lt: cutoffDate,
            },
          },
        });
        processed += deletedMetrics.count;
      } catch (error) {
        errors++;
        logger.warn('Failed to cleanup keyword metrics', { error });
      }

      // Cleanup old rank tracking data
      try {
        const deletedRanking = await db.keywordRankTracking.deleteMany({
          where: {
            date: {
              lt: cutoffDate,
            },
          },
        });
        processed += deletedRanking.count;
      } catch (error) {
        errors++;
        logger.warn('Failed to cleanup rank tracking data', { error });
      }

      // Cleanup old competitor snapshots
      try {
        const deletedSnapshots = await db.competitorSnapshot.deleteMany({
          where: {
            date: {
              lt: cutoffDate,
            },
          },
        });
        processed += deletedSnapshots.count;
      } catch (error) {
        errors++;
        logger.warn('Failed to cleanup competitor snapshots', { error });
      }

      const duration = Date.now() - startTime;
      this.setJobStatus(jobId, 'completed', 100);

      logger.info('Data cleanup completed', {
        jobId,
        processed,
        errors,
        duration,
      });

      return {
        success: true,
        processed,
        errors,
        duration,
        message: `Cleaned up ${processed} old records with ${errors} errors`,
      };
    } catch (error) {
      this.setJobStatus(jobId, 'failed', undefined, error instanceof Error ? error.message : 'Unknown error');
      logger.error('Data cleanup failed', { jobId, error });
      throw error;
    }
  }

  /**
   * Job 6: Generate Trending Keywords
   */
  async generateTrendingKeywords(): Promise<JobResult> {
    const jobId = `trending-keywords-${Date.now()}`;
    const startTime = Date.now();

    try {
      this.setJobStatus(jobId, 'running', 0);

      // Get keywords with recent activity
      const keywords = await db.keyword.findMany({
        where: {
          metrics: {
            some: {
              date: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              },
            },
          },
        },
        include: {
          metrics: {
            orderBy: { date: 'desc' },
            take: 7, // Last 7 days
          },
        },
        take: 1000,
      });

      let processed = 0;
      let errors = 0;

      for (const keyword of keywords) {
        try {
          // Calculate trend based on recent metrics
          const trend = this.calculateTrend(keyword.metrics);
          
          // Cache trending keywords
          if (trend.isTrending) {
            await keywordCache.set(`trending:${keyword.term}`, {
              keyword: keyword.term,
              trend: trend.direction,
              strength: trend.strength,
              category: trend.category,
            }, 86400); // 24 hours
          }

          processed++;
          this.setJobStatus(jobId, 'running', (processed / keywords.length) * 100);
        } catch (error) {
          errors++;
          logger.warn('Failed to analyze trend for keyword', { keyword: keyword.term, error });
        }
      }

      const duration = Date.now() - startTime;
      this.setJobStatus(jobId, 'completed', 100);

      logger.info('Trending keywords generation completed', {
        jobId,
        processed,
        errors,
        duration,
      });

      return {
        success: true,
        processed,
        errors,
        duration,
        message: `Analyzed trends for ${processed} keywords with ${errors} errors`,
      };
    } catch (error) {
      this.setJobStatus(jobId, 'failed', undefined, error instanceof Error ? error.message : 'Unknown error');
      logger.error('Trending keywords generation failed', { jobId, error });
      throw error;
    }
  }

  /**
   * Job 7: Update Shop Analytics
   */
  async updateShopAnalytics(): Promise<JobResult> {
    const jobId = `shop-analytics-${Date.now()}`;
    const startTime = Date.now();

    try {
      this.setJobStatus(jobId, 'running', 0);

      // Simplified implementation - no user model available
      const users: any[] = [];

      let processed = 0;
      let errors = 0;

      for (const user of users) {
        try {
          // Update user's shop analytics
          await this.updateUserShopAnalytics(user.id);
          processed++;
        } catch (error) {
          errors++;
          logger.warn('Failed to update shop analytics for user', { userId: user.id, error });
        }

        this.setJobStatus(jobId, 'running', (processed / users.length) * 100);
      }

      const duration = Date.now() - startTime;
      this.setJobStatus(jobId, 'completed', 100);

      logger.info('Shop analytics update completed', {
        jobId,
        processed,
        errors,
        duration,
      });

      return {
        success: true,
        processed,
        errors,
        duration,
        message: `Updated analytics for ${processed} shops with ${errors} errors`,
      };
    } catch (error) {
      this.setJobStatus(jobId, 'failed', undefined, error instanceof Error ? error.message : 'Unknown error');
      logger.error('Shop analytics update failed', { jobId, error });
      throw error;
    }
  }

  /**
   * Get job status
   */
  getJobStatus(jobId: string): JobStatus | null {
    return this.runningJobs.get(jobId) || null;
  }

  /**
   * Get all running jobs
   */
  getAllJobs(): JobStatus[] {
    return Array.from(this.runningJobs.values());
  }

  /**
   * Helper methods
   */
  private setJobStatus(jobId: string, status: JobStatus['status'], progress?: number, error?: string) {
    const jobStatus: JobStatus = {
      jobId,
      status,
      startedAt: status === 'running' ? new Date().toISOString() : undefined,
      completedAt: status === 'completed' || status === 'failed' ? new Date().toISOString() : undefined,
      progress,
      error,
    };

    this.runningJobs.set(jobId, jobStatus);

    // Clean up completed jobs after 1 hour
    if (status === 'completed' || status === 'failed') {
      setTimeout(() => {
        this.runningJobs.delete(jobId);
      }, 60 * 60 * 1000);
    }
  }

  private async simulateKeywordMetricsCollection(keyword: string) {
    // Simulate API calls and data collection
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      activeListings: Math.floor(Math.random() * 10000) + 100,
      demand: Math.floor(Math.random() * 100),
      competition: Math.floor(Math.random() * 100),
      seasonality: Math.floor(Math.random() * 100),
      opportunity: Math.floor(Math.random() * 100),
      difficulty: Math.floor(Math.random() * 100),
    };
  }

  private calculateTrend(metrics: any[]): {
    isTrending: boolean;
    direction: 'up' | 'down' | 'stable';
    strength: number;
    category: string;
  } {
    if (metrics.length < 2) {
      return { isTrending: false, direction: 'stable', strength: 0, category: 'insufficient_data' };
    }

    const recent = metrics[0];
    const previous = metrics[1];

    const change = ((recent.activeListings - previous.activeListings) / previous.activeListings) * 100;

    return {
      isTrending: Math.abs(change) > 20, // 20% change threshold
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
      strength: Math.abs(change),
      category: change > 50 ? 'hot' : change > 20 ? 'trending' : 'stable',
    };
  }

  private async updateUserShopAnalytics(userId: string) {
    // Mock shop analytics update
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

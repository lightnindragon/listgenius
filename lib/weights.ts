/**
 * Weights configuration and management for keyword scoring
 */

import { db, getActiveWeightsConfig } from './db';

export interface WeightsConfig {
  version: string;
  w1_suggest: number;    // Autocomplete suggestion weight
  w2_serp: number;       // SERP result count weight
  w3_trends: number;     // Google Trends weight
  c1_listings: number;   // Active listings weight
  c2_shopConc: number;   // Shop concentration weight
  c3_titleExact: number; // Title exact match weight
  s1_variance: number;   // Seasonality variance weight
  s2_peak: number;       // Peak seasonality weight
}

export interface KeywordMetrics {
  suggestStrength?: number;
  serpCount?: number;
  trendsIndex?: number;
  activeListings?: number;
  page1ShopConc?: number;
  titleExactRate?: number;
  seasonalityVariance?: number;
  peakSeasonality?: number;
}

export interface ScoredKeyword {
  keyword: string;
  demand: number;      // 0-100
  competition: number; // 0-100
  seasonality: number; // 0-100
  opportunity: number; // 0-100
  difficulty: number;  // 0-100
  overallScore: number; // 0-100
  metrics: KeywordMetrics;
}

// Default weights configuration
export const DEFAULT_WEIGHTS: WeightsConfig = {
  version: 'v1.0',
  w1_suggest: 0.3,    // 30% - Autocomplete suggestions
  w2_serp: 0.4,       // 40% - SERP result count
  w3_trends: 0.3,     // 30% - Google Trends
  c1_listings: 0.4,   // 40% - Active listings
  c2_shopConc: 0.35,  // 35% - Shop concentration
  c3_titleExact: 0.25, // 25% - Title exact matches
  s1_variance: 0.6,   // 60% - Seasonality variance
  s2_peak: 0.4,       // 40% - Peak seasonality
};

// Weights manager class
export class WeightsManager {
  private static instance: WeightsManager;
  private weights: WeightsConfig | null = null;
  private lastLoaded: Date | null = null;

  private constructor() {}

  static getInstance(): WeightsManager {
    if (!WeightsManager.instance) {
      WeightsManager.instance = new WeightsManager();
    }
    return WeightsManager.instance;
  }

  async getWeights(): Promise<WeightsConfig> {
    // Load weights if not cached or if older than 1 hour
    if (!this.weights || !this.lastLoaded || 
        (Date.now() - this.lastLoaded.getTime()) > 3600000) {
      await this.loadWeights();
    }

    return this.weights || DEFAULT_WEIGHTS;
  }

  private async loadWeights() {
    try {
      const config = await getActiveWeightsConfig();
      if (config) {
        this.weights = {
          version: config.version,
          w1_suggest: config.w1_suggest,
          w2_serp: config.w2_serp,
          w3_trends: config.w3_trends,
          c1_listings: config.c1_listings,
          c2_shopConc: config.c2_shopConc,
          c3_titleExact: config.c3_titleExact,
          s1_variance: config.s1_variance,
          s2_peak: config.s2_peak,
        };
      } else {
        // Create default weights if none exist
        await this.createDefaultWeights();
        this.weights = DEFAULT_WEIGHTS;
      }
      this.lastLoaded = new Date();
    } catch (error) {
      console.error('Failed to load weights:', error);
      this.weights = DEFAULT_WEIGHTS;
    }
  }

  private async createDefaultWeights() {
    try {
      await db.weightsConfig.create({
        data: {
          ...DEFAULT_WEIGHTS,
          isActive: true,
        },
      });
    } catch (error) {
      console.error('Failed to create default weights:', error);
    }
  }

  async updateWeights(newWeights: Partial<WeightsConfig> & { version: string }) {
    try {
      // Validate weights sum to 1.0 for each category
      if (newWeights.w1_suggest !== undefined || 
          newWeights.w2_serp !== undefined || 
          newWeights.w3_trends !== undefined) {
        const demandSum = (newWeights.w1_suggest || this.weights?.w1_suggest || 0) +
                         (newWeights.w2_serp || this.weights?.w2_serp || 0) +
                         (newWeights.w3_trends || this.weights?.w3_trends || 0);
        
        if (Math.abs(demandSum - 1.0) > 0.01) {
          throw new Error('Demand weights must sum to 1.0');
        }
      }

      if (newWeights.c1_listings !== undefined || 
          newWeights.c2_shopConc !== undefined || 
          newWeights.c3_titleExact !== undefined) {
        const competitionSum = (newWeights.c1_listings || this.weights?.c1_listings || 0) +
                              (newWeights.c2_shopConc || this.weights?.c2_shopConc || 0) +
                              (newWeights.c3_titleExact || this.weights?.c3_titleExact || 0);
        
        if (Math.abs(competitionSum - 1.0) > 0.01) {
          throw new Error('Competition weights must sum to 1.0');
        }
      }

      if (newWeights.s1_variance !== undefined || newWeights.s2_peak !== undefined) {
        const seasonalitySum = (newWeights.s1_variance || this.weights?.s1_variance || 0) +
                              (newWeights.s2_peak || this.weights?.s2_peak || 0);
        
        if (Math.abs(seasonalitySum - 1.0) > 0.01) {
          throw new Error('Seasonality weights must sum to 1.0');
        }
      }

      // Deactivate current weights
      await db.weightsConfig.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });

      // Create new weights
      const weightsToCreate = {
        ...DEFAULT_WEIGHTS,
        ...newWeights,
        isActive: true,
      };

      await db.weightsConfig.create({
        data: weightsToCreate,
      });

      // Reload weights
      this.weights = null;
      await this.loadWeights();

      return true;
    } catch (error) {
      console.error('Failed to update weights:', error);
      throw error;
    }
  }

  async getWeightsHistory() {
    return await db.weightsConfig.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}

// Scoring engine
export class KeywordScoringEngine {
  private weightsManager: WeightsManager;

  constructor() {
    this.weightsManager = WeightsManager.getInstance();
  }

  async scoreKeyword(keyword: string, metrics: KeywordMetrics): Promise<ScoredKeyword> {
    const weights = await this.weightsManager.getWeights();

    // Calculate demand score (0-100)
    const demand = this.calculateDemand(metrics, weights);

    // Calculate competition score (0-100)
    const competition = this.calculateCompetition(metrics, weights);

    // Calculate seasonality score (0-100)
    const seasonality = this.calculateSeasonality(metrics, weights);

    // Calculate opportunity score (demand - competition)
    const opportunity = Math.max(0, Math.min(100, demand - competition + 50));

    // Calculate difficulty score (inverse of opportunity)
    const difficulty = Math.max(0, Math.min(100, 100 - opportunity));

    // Calculate overall score (weighted average)
    const overallScore = this.calculateOverallScore(demand, competition, seasonality, opportunity);

    return {
      keyword,
      demand,
      competition,
      seasonality,
      opportunity,
      difficulty,
      overallScore,
      metrics,
    };
  }

  private calculateDemand(metrics: KeywordMetrics, weights: WeightsConfig): number {
    let demand = 0;

    // Autocomplete suggestion strength (0-100)
    if (metrics.suggestStrength !== undefined) {
      demand += (metrics.suggestStrength / 100) * weights.w1_suggest * 100;
    }

    // SERP result count (inverse - fewer results = higher demand)
    if (metrics.serpCount !== undefined) {
      // Normalize SERP count to 0-100 scale (fewer results = higher score)
      const normalizedSerp = Math.max(0, Math.min(100, 100 - (metrics.serpCount / 1000) * 100));
      demand += normalizedSerp * weights.w2_serp;
    }

    // Google Trends index (0-100)
    if (metrics.trendsIndex !== undefined) {
      demand += (metrics.trendsIndex / 100) * weights.w3_trends * 100;
    }

    return Math.max(0, Math.min(100, demand));
  }

  private calculateCompetition(metrics: KeywordMetrics, weights: WeightsConfig): number {
    let competition = 0;

    // Active listings (more listings = higher competition)
    if (metrics.activeListings !== undefined) {
      const normalizedListings = Math.max(0, Math.min(100, (metrics.activeListings / 100) * 100));
      competition += normalizedListings * weights.c1_listings;
    }

    // Shop concentration (higher concentration = higher competition)
    if (metrics.page1ShopConc !== undefined) {
      competition += (metrics.page1ShopConc / 100) * weights.c2_shopConc * 100;
    }

    // Title exact match rate (higher rate = higher competition)
    if (metrics.titleExactRate !== undefined) {
      competition += (metrics.titleExactRate / 100) * weights.c3_titleExact * 100;
    }

    return Math.max(0, Math.min(100, competition));
  }

  private calculateSeasonality(metrics: KeywordMetrics, weights: WeightsConfig): number {
    let seasonality = 0;

    // Seasonality variance (higher variance = more seasonal)
    if (metrics.seasonalityVariance !== undefined) {
      seasonality += (metrics.seasonalityVariance / 100) * weights.s1_variance * 100;
    }

    // Peak seasonality (when peak occurs)
    if (metrics.peakSeasonality !== undefined) {
      seasonality += (metrics.peakSeasonality / 100) * weights.s2_peak * 100;
    }

    return Math.max(0, Math.min(100, seasonality));
  }

  private calculateOverallScore(demand: number, competition: number, seasonality: number, opportunity: number): number {
    // Weighted average with emphasis on opportunity
    return Math.round(
      (demand * 0.25) +
      (competition * 0.25) +
      (seasonality * 0.15) +
      (opportunity * 0.35)
    );
  }

  async scoreMultipleKeywords(keywords: Array<{ keyword: string; metrics: KeywordMetrics }>): Promise<ScoredKeyword[]> {
    const results = await Promise.all(
      keywords.map(({ keyword, metrics }) => this.scoreKeyword(keyword, metrics))
    );

    // Sort by overall score descending
    return results.sort((a, b) => b.overallScore - a.overallScore);
  }
}

// Utility functions
export function normalizeMetric(value: number, min: number, max: number): number {
  if (max === min) return 50; // Return neutral score if no variance
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
}

export function calculateTrendDirection(current: number, previous: number): 'up' | 'down' | 'stable' {
  const change = ((current - previous) / previous) * 100;
  
  if (change > 5) return 'up';
  if (change < -5) return 'down';
  return 'stable';
}

export function getDifficultyColor(difficulty: number): string {
  if (difficulty < 30) return 'green';
  if (difficulty < 70) return 'yellow';
  return 'red';
}

export function getDifficultyLabel(difficulty: number): string {
  if (difficulty < 30) return 'Easy';
  if (difficulty < 70) return 'Medium';
  return 'Hard';
}

// Export instances
export const weightsManager = WeightsManager.getInstance();
export const scoringEngine = new KeywordScoringEngine();

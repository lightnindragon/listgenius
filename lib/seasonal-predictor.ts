/**
 * Seasonal Trend Predictor
 * Predict seasonal trends and best times to list
 */

import { logger } from './logger';
import { db } from './db';
import { keywordCache } from './redis';

export interface SeasonalTrend {
  keyword: string;
  category: string;
  currentTrend: 'low' | 'medium' | 'high';
  peakMonth: string;
  lowMonth: string;
  seasonality: number; // 0-100
  trendData: Array<{
    month: string;
    demand: number;
    competition: number;
    opportunity: number;
  }>;
  predictions: {
    nextMonth: number;
    nextQuarter: number;
    nextYear: number;
  };
  recommendations: string[];
}

export interface CalendarHeatmap {
  year: number;
  months: Array<{
    month: string;
    weeks: Array<{
      week: number;
      days: Array<{
        day: number;
        demand: number;
        competition: number;
        opportunity: number;
        isPeak: boolean;
        isLow: boolean;
      }>;
    }>;
  }>;
}

export interface SeasonalPrediction {
  keyword: string;
  category: string;
  bestListingMonths: string[];
  worstListingMonths: string[];
  peakDemandPeriod: string;
  lowCompetitionPeriod: string;
  optimalPriceRange: { min: number; max: number };
  seasonalFactors: string[];
  marketingTiming: string[];
  inventoryRecommendations: string[];
}

export class SeasonalPredictor {
  private monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  /**
   * Analyze seasonal trends for a keyword
   */
  async analyzeSeasonalTrend(keyword: string): Promise<SeasonalTrend> {
    try {
      // Check cache first
      const cacheKey = `seasonal:${keyword}`;
      const cached = await keywordCache.get(cacheKey);
      if (cached && typeof cached === 'object' && 'keyword' in cached) {
        return cached as SeasonalTrend;
      }

      // Get historical data for the keyword
      const historicalData = await this.getHistoricalData(keyword);
      
      // Calculate seasonal patterns
      const trendData = this.calculateSeasonalPatterns(historicalData);
      
      // Generate predictions
      const predictions = this.generatePredictions(trendData);
      
      // Create seasonal trend analysis
      const seasonalTrend: SeasonalTrend = {
        keyword,
        category: this.categorizeKeyword(keyword),
        currentTrend: this.getCurrentTrend(trendData),
        peakMonth: this.findPeakMonth(trendData),
        lowMonth: this.findLowMonth(trendData),
        seasonality: this.calculateSeasonality(trendData),
        trendData,
        predictions,
        recommendations: this.generateSeasonalRecommendations(trendData, keyword),
      };

      // Cache result
      await keywordCache.set(cacheKey, seasonalTrend, 7200); // 2 hours

      logger.info('Seasonal trend analysis completed', { keyword, seasonalTrend });

      return seasonalTrend;
    } catch (error) {
      logger.error('Failed to analyze seasonal trend', { keyword, error });
      throw error;
    }
  }

  /**
   * Generate calendar heatmap for a keyword
   */
  async generateCalendarHeatmap(keyword: string, year: number = new Date().getFullYear()): Promise<CalendarHeatmap> {
    try {
      const cacheKey = `heatmap:${keyword}:${year}`;
      const cached = await keywordCache.get(cacheKey);
      if (cached && typeof cached === 'object' && 'year' in cached) {
        return cached as CalendarHeatmap;
      }

      // Get seasonal trend data
      const seasonalTrend = await this.analyzeSeasonalTrend(keyword);
      
      // Generate calendar heatmap
      const heatmap = this.createCalendarHeatmap(seasonalTrend, year);

      // Cache result
      await keywordCache.set(cacheKey, heatmap, 3600); // 1 hour

      logger.info('Calendar heatmap generated', { keyword, year, heatmap });

      return heatmap;
    } catch (error) {
      logger.error('Failed to generate calendar heatmap', { keyword, year, error });
      throw error;
    }
  }

  /**
   * Get seasonal predictions for multiple keywords
   */
  async getSeasonalPredictions(keywords: string[]): Promise<SeasonalPrediction[]> {
    try {
      const predictions: SeasonalPrediction[] = [];

      for (const keyword of keywords) {
        try {
          const prediction = await this.generateSeasonalPrediction(keyword);
          predictions.push(prediction);
        } catch (error) {
          logger.warn('Failed to generate prediction for keyword', { keyword, error });
        }
      }

      logger.info('Seasonal predictions generated', { 
        requested: keywords.length, 
        generated: predictions.length 
      });

      return predictions;
    } catch (error) {
      logger.error('Failed to get seasonal predictions', { keywords, error });
      throw error;
    }
  }

  /**
   * Get best times to list for a category
   */
  async getBestListingTimes(category: string): Promise<{
    category: string;
    bestMonths: Array<{ month: string; score: number; reason: string }>;
    worstMonths: Array<{ month: string; score: number; reason: string }>;
    seasonalFactors: string[];
    recommendations: string[];
  }> {
    try {
      // Get category-specific seasonal data
      const categoryData = await this.getCategorySeasonalData(category);
      
      // Analyze best and worst months
      const bestMonths = this.findBestMonths(categoryData);
      const worstMonths = this.findWorstMonths(categoryData);
      
      // Generate recommendations
      const seasonalFactors = this.identifySeasonalFactors(categoryData);
      const recommendations = this.generateCategoryRecommendations(category, categoryData);

      const result = {
        category,
        bestMonths,
        worstMonths,
        seasonalFactors,
        recommendations,
      };

      logger.info('Best listing times generated', { category, result });

      return result;
    } catch (error) {
      logger.error('Failed to get best listing times', { category, error });
      throw error;
    }
  }

  /**
   * Generate seasonal prediction for a single keyword
   */
  private async generateSeasonalPrediction(keyword: string): Promise<SeasonalPrediction> {
    const seasonalTrend = await this.analyzeSeasonalTrend(keyword);
    
    return {
      keyword,
      category: seasonalTrend.category,
      bestListingMonths: this.getBestListingMonths(seasonalTrend),
      worstListingMonths: this.getWorstListingMonths(seasonalTrend),
      peakDemandPeriod: seasonalTrend.peakMonth,
      lowCompetitionPeriod: this.findLowCompetitionPeriod(seasonalTrend),
      optimalPriceRange: this.calculateOptimalPriceRange(seasonalTrend),
      seasonalFactors: this.identifySeasonalFactors(seasonalTrend.trendData),
      marketingTiming: this.getMarketingTiming(seasonalTrend),
      inventoryRecommendations: this.getInventoryRecommendations(seasonalTrend),
    };
  }

  /**
   * Get historical data for a keyword
   */
  private async getHistoricalData(keyword: string): Promise<any[]> {
    // Mock historical data - in real implementation, would query database
    return Array.from({ length: 12 }, (_, i) => ({
      month: this.monthNames[i],
      demand: Math.floor(Math.random() * 100) + 20,
      competition: Math.floor(Math.random() * 100) + 10,
      listings: Math.floor(Math.random() * 5000) + 500,
    }));
  }

  /**
   * Calculate seasonal patterns from historical data
   */
  private calculateSeasonalPatterns(historicalData: any[]): Array<{
    month: string;
    demand: number;
    competition: number;
    opportunity: number;
  }> {
    return historicalData.map(data => ({
      month: data.month,
      demand: data.demand,
      competition: data.competition,
      opportunity: Math.round((data.demand * 0.7) + ((100 - data.competition) * 0.3)),
    }));
  }

  /**
   * Generate predictions based on trend data
   */
  private generatePredictions(trendData: any[]): {
    nextMonth: number;
    nextQuarter: number;
    nextYear: number;
  } {
    // Simple prediction logic - would use more sophisticated algorithms in production
    const currentMonth = new Date().getMonth();
    const nextMonthData = trendData[(currentMonth + 1) % 12];
    const nextQuarterData = trendData[(currentMonth + 3) % 12];
    const nextYearData = trendData[currentMonth];

    return {
      nextMonth: nextMonthData.opportunity,
      nextQuarter: nextQuarterData.opportunity,
      nextYear: nextYearData.opportunity,
    };
  }

  /**
   * Create calendar heatmap
   */
  private createCalendarHeatmap(seasonalTrend: SeasonalTrend, year: number): CalendarHeatmap {
    const months = this.monthNames.map((monthName, monthIndex) => ({
      month: monthName,
      weeks: Array.from({ length: 4 }, (_, weekIndex) => ({
        week: weekIndex + 1,
        days: Array.from({ length: 7 }, (_, dayIndex) => {
          const day = weekIndex * 7 + dayIndex + 1;
          const monthData = seasonalTrend.trendData.find(t => t.month === monthName);
          const baseDemand = monthData?.demand || 50;
          const variation = (Math.random() - 0.5) * 20; // ±10 variation
          const demand = Math.max(0, Math.min(100, baseDemand + variation));
          const competition = monthData?.competition || 50;
          const opportunity = Math.round((demand * 0.7) + ((100 - competition) * 0.3));

          return {
            day,
            demand,
            competition,
            opportunity,
            isPeak: opportunity > 80,
            isLow: opportunity < 30,
          };
        }),
      })),
    }));

    return {
      year,
      months,
    };
  }

  /**
   * Helper methods
   */
  private categorizeKeyword(keyword: string): string {
    const lowerKeyword = keyword.toLowerCase();
    if (lowerKeyword.includes('christmas') || lowerKeyword.includes('holiday')) return 'Holiday';
    if (lowerKeyword.includes('summer') || lowerKeyword.includes('beach')) return 'Summer';
    if (lowerKeyword.includes('winter') || lowerKeyword.includes('cold')) return 'Winter';
    if (lowerKeyword.includes('spring') || lowerKeyword.includes('flower')) return 'Spring';
    if (lowerKeyword.includes('fall') || lowerKeyword.includes('autumn')) return 'Fall';
    return 'General';
  }

  private getCurrentTrend(trendData: any[]): 'low' | 'medium' | 'high' {
    const currentMonth = new Date().getMonth();
    const currentData = trendData[currentMonth];
    const opportunity = currentData.opportunity;
    
    if (opportunity >= 70) return 'high';
    if (opportunity >= 40) return 'medium';
    return 'low';
  }

  private findPeakMonth(trendData: any[]): string {
    const peakData = trendData.reduce((max, current) => 
      current.opportunity > max.opportunity ? current : max
    );
    return peakData.month;
  }

  private findLowMonth(trendData: any[]): string {
    const lowData = trendData.reduce((min, current) => 
      current.opportunity < min.opportunity ? current : min
    );
    return lowData.month;
  }

  private calculateSeasonality(trendData: any[]): number {
    const opportunities = trendData.map(t => t.opportunity);
    const max = Math.max(...opportunities);
    const min = Math.min(...opportunities);
    return Math.round(((max - min) / 100) * 100);
  }

  private generateSeasonalRecommendations(trendData: any[], keyword: string): string[] {
    const recommendations = [];
    const peakMonth = this.findPeakMonth(trendData);
    const lowMonth = this.findLowMonth(trendData);
    const seasonality = this.calculateSeasonality(trendData);

    if (seasonality > 50) {
      recommendations.push(`High seasonality detected - plan inventory for ${peakMonth} peak`);
      recommendations.push(`Consider reducing listings during ${lowMonth} low season`);
    }

    recommendations.push(`Best time to list: ${peakMonth}`);
    recommendations.push(`Avoid listing during: ${lowMonth}`);

    return recommendations;
  }

  private getBestListingMonths(seasonalTrend: SeasonalTrend): string[] {
    return seasonalTrend.trendData
      .filter(t => t.opportunity >= 70)
      .map(t => t.month)
      .sort();
  }

  private getWorstListingMonths(seasonalTrend: SeasonalTrend): string[] {
    return seasonalTrend.trendData
      .filter(t => t.opportunity < 40)
      .map(t => t.month)
      .sort();
  }

  private findLowCompetitionPeriod(seasonalTrend: SeasonalTrend): string {
    const lowCompetitionData = seasonalTrend.trendData.reduce((min, current) => 
      current.competition < min.competition ? current : min
    );
    return lowCompetitionData.month;
  }

  private calculateOptimalPriceRange(seasonalTrend: SeasonalTrend): { min: number; max: number } {
    // Mock calculation - would use real pricing data
    const avgDemand = seasonalTrend.trendData.reduce((sum, t) => sum + t.demand, 0) / seasonalTrend.trendData.length;
    const basePrice = 20;
    const multiplier = avgDemand / 50;
    
    return {
      min: Math.round(basePrice * multiplier * 0.8),
      max: Math.round(basePrice * multiplier * 1.2),
    };
  }

  private identifySeasonalFactors(trendData: any[]): string[] {
    const factors = [];
    const peakMonth = this.findPeakMonth(trendData);
    const lowMonth = this.findLowMonth(trendData);

    if (peakMonth.includes('December') || peakMonth.includes('November')) {
      factors.push('Holiday shopping season');
    }
    if (peakMonth.includes('June') || peakMonth.includes('July')) {
      factors.push('Summer vacation period');
    }
    if (lowMonth.includes('January') || lowMonth.includes('February')) {
      factors.push('Post-holiday slowdown');
    }

    return factors;
  }

  private getMarketingTiming(seasonalTrend: SeasonalTrend): string[] {
    const peakMonth = seasonalTrend.peakMonth;
    const recommendations = [];

    // Recommend starting marketing 1-2 months before peak
    const peakIndex = this.monthNames.indexOf(peakMonth);
    const startMonth = this.monthNames[(peakIndex - 2 + 12) % 12];
    
    recommendations.push(`Start marketing in ${startMonth}`);
    recommendations.push(`Peak marketing period: ${peakMonth}`);
    recommendations.push(`Reduce marketing spend during ${seasonalTrend.lowMonth}`);

    return recommendations;
  }

  private getInventoryRecommendations(seasonalTrend: SeasonalTrend): string[] {
    const recommendations = [];
    const peakMonth = seasonalTrend.peakMonth;
    const lowMonth = seasonalTrend.lowMonth;

    recommendations.push(`Build inventory 2-3 months before ${peakMonth}`);
    recommendations.push(`Clear inventory during ${lowMonth}`);
    recommendations.push(`Monitor demand trends leading up to ${peakMonth}`);

    return recommendations;
  }

  private async getCategorySeasonalData(category: string): Promise<any[]> {
    // Mock category data
    return Array.from({ length: 12 }, (_, i) => ({
      month: this.monthNames[i],
      demand: Math.floor(Math.random() * 100) + 20,
      competition: Math.floor(Math.random() * 100) + 10,
    }));
  }

  private findBestMonths(categoryData: any[]): Array<{ month: string; score: number; reason: string }> {
    return categoryData
      .filter(d => d.demand >= 70)
      .map(d => ({
        month: d.month,
        score: d.demand,
        reason: `High demand (${d.demand}/100)`,
      }))
      .sort((a, b) => b.score - a.score);
  }

  private findWorstMonths(categoryData: any[]): Array<{ month: string; score: number; reason: string }> {
    return categoryData
      .filter(d => d.demand < 40)
      .map(d => ({
        month: d.month,
        score: d.demand,
        reason: `Low demand (${d.demand}/100)`,
      }))
      .sort((a, b) => a.score - b.score);
  }

  private generateCategoryRecommendations(category: string, categoryData: any[]): string[] {
    const recommendations = [];
    const bestMonths = this.findBestMonths(categoryData);
    const worstMonths = this.findWorstMonths(categoryData);

    if (bestMonths.length > 0) {
      recommendations.push(`Best months for ${category}: ${bestMonths.slice(0, 3).map(m => m.month).join(', ')}`);
    }

    if (worstMonths.length > 0) {
      recommendations.push(`Avoid listing in: ${worstMonths.slice(0, 2).map(m => m.month).join(', ')}`);
    }

    recommendations.push(`Plan inventory 2-3 months ahead of peak demand`);
    recommendations.push(`Consider seasonal pricing strategies`);

    return recommendations;
  }
}

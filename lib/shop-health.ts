import { getSEOGrader, ListingData } from './seo-grader';
import { emitTopRightToast } from '@/components/TopRightToast';

// Shop health metrics
export interface ShopHealthMetrics {
  // SEO Health
  averageSEOScore: number;
  listingsWithGoodSEO: number;
  totalListings: number;
  
  // Performance Health
  averageConversionRate: number;
  averageRating: number;
  totalReviews: number;
  
  // Content Health
  listingsWithImages: number;
  listingsWithDescriptions: number;
  listingsWithTags: number;
  
  // Engagement Health
  responseRate: number;
  averageResponseTime: number;
  customerSatisfaction: number;
  
  // Business Health
  salesVelocity: number;
  inventoryTurnover: number;
  profitMargins: number;
  
  // Compliance Health
  policyCompleteness: number;
  aboutPageQuality: number;
  shopBannerQuality: number;
}

// Health issue
export interface HealthIssue {
  id: string;
  category: 'seo' | 'performance' | 'content' | 'engagement' | 'business' | 'compliance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  fix: string;
  effort: 'low' | 'medium' | 'high';
  priority: number;
  affectedListings?: number[];
}

// Health recommendation
export interface HealthRecommendation {
  id: string;
  category: 'seo' | 'performance' | 'content' | 'engagement' | 'business' | 'compliance';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  expectedImpact: string;
  timeframe: string;
  actionSteps: string[];
  estimatedEffort: string;
  potentialROI: string;
}

// Shop health score
export interface ShopHealthScore {
  overall: number; // 0-100
  grade: string; // A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-, F
  breakdown: {
    seo: number;
    performance: number;
    content: number;
    engagement: number;
    business: number;
    compliance: number;
  };
  issues: HealthIssue[];
  recommendations: HealthRecommendation[];
  quickWins: HealthRecommendation[];
  trends: HealthTrend[];
  lastUpdated: Date;
}

// Health trend
export interface HealthTrend {
  date: Date;
  score: number;
  issues: number;
  improvements: string[];
}

// Health check configuration
export interface HealthCheckConfig {
  weights: {
    seo: number;
    performance: number;
    content: number;
    engagement: number;
    business: number;
    compliance: number;
  };
  thresholds: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  autoCheckInterval: number; // hours
}

class ShopHealthMonitor {
  private seoGrader: any;
  private healthHistory: Map<string, HealthTrend[]> = new Map();
  private config: HealthCheckConfig;

  constructor() {
    this.seoGrader = getSEOGrader();
    this.config = this.initializeConfig();
  }

  // Initialize health check configuration
  private initializeConfig(): HealthCheckConfig {
    return {
      weights: {
        seo: 0.25,
        performance: 0.20,
        content: 0.15,
        engagement: 0.15,
        business: 0.15,
        compliance: 0.10
      },
      thresholds: {
        critical: 30,
        high: 50,
        medium: 70,
        low: 85
      },
      autoCheckInterval: 24 // 24 hours
    };
  }

  // Calculate overall shop health
  async calculateShopHealth(
    shopId: string,
    listings: ListingData[],
    shopMetrics: Partial<ShopHealthMetrics>
  ): Promise<ShopHealthScore> {
    try {
      // Calculate metrics for each category
      const seoHealth = await this.calculateSEOHealth(listings);
      const performanceHealth = this.calculatePerformanceHealth(shopMetrics);
      const contentHealth = this.calculateContentHealth(listings);
      const engagementHealth = this.calculateEngagementHealth(shopMetrics);
      const businessHealth = this.calculateBusinessHealth(shopMetrics);
      const complianceHealth = this.calculateComplianceHealth(shopMetrics);

      // Calculate weighted overall score
      const breakdown = {
        seo: seoHealth,
        performance: performanceHealth,
        content: contentHealth,
        engagement: engagementHealth,
        business: businessHealth,
        compliance: complianceHealth
      };

      const overall = Math.round(
        breakdown.seo * this.config.weights.seo +
        breakdown.performance * this.config.weights.performance +
        breakdown.content * this.config.weights.content +
        breakdown.engagement * this.config.weights.engagement +
        breakdown.business * this.config.weights.business +
        breakdown.compliance * this.config.weights.compliance
      );

      const grade = this.scoreToGrade(overall);

      // Identify issues
      const issues = this.identifyHealthIssues(breakdown, listings, shopMetrics);

      // Generate recommendations
      const recommendations = this.generateHealthRecommendations(breakdown, issues);

      // Get quick wins
      const quickWins = this.getQuickWins(recommendations);

      // Get trends
      const trends = this.getHealthTrends(shopId);

      const healthScore: ShopHealthScore = {
        overall,
        grade,
        breakdown,
        issues,
        recommendations,
        quickWins,
        trends,
        lastUpdated: new Date()
      };

      // Save to history
      await this.saveHealthScore(shopId, healthScore);

      return healthScore;
    } catch (error) {
      console.error('Error calculating shop health:', error);
      throw error;
    }
  }

  // Calculate SEO health
  private async calculateSEOHealth(listings: ListingData[]): Promise<number> {
    if (listings.length === 0) return 0;

    let totalScore = 0;
    let goodSEOCount = 0;

    for (const listing of listings) {
      try {
        const grade = await this.seoGrader.gradeListing(listing);
        totalScore += grade.score;
        
        if (grade.score >= 80) {
          goodSEOCount++;
        }
      } catch (error) {
        console.error(`Error grading listing ${listing.listingId}:`, error);
      }
    }

    const averageScore = totalScore / listings.length;
    const seoPercentage = (goodSEOCount / listings.length) * 100;

    // Combine average score and percentage of good listings
    return Math.round((averageScore + seoPercentage) / 2);
  }

  // Calculate performance health
  private calculatePerformanceHealth(metrics: Partial<ShopHealthMetrics>): number {
    let score = 0;
    let factors = 0;

    // Conversion rate (0-100 scale, 5% = 100 points)
    if (metrics.averageConversionRate !== undefined) {
      const conversionScore = Math.min(100, (metrics.averageConversionRate / 5) * 100);
      score += conversionScore;
      factors++;
    }

    // Average rating (3.5-5.0 scale)
    if (metrics.averageRating !== undefined) {
      const ratingScore = ((metrics.averageRating - 3.5) / 1.5) * 100;
      score += Math.max(0, Math.min(100, ratingScore));
      factors++;
    }

    // Total reviews (more reviews = better trust)
    if (metrics.totalReviews !== undefined) {
      const reviewScore = Math.min(100, (metrics.totalReviews / 100) * 100);
      score += reviewScore;
      factors++;
    }

    return factors > 0 ? Math.round(score / factors) : 0;
  }

  // Calculate content health
  private calculateContentHealth(listings: ListingData[]): number {
    if (listings.length === 0) return 0;

    let totalScore = 0;

    for (const listing of listings) {
      let listingScore = 0;
      let factors = 0;

      // Images
      if (listing.images && listing.images.length >= 5) {
        listingScore += 40;
      } else if (listing.images && listing.images.length >= 3) {
        listingScore += 30;
      } else if (listing.images && listing.images.length >= 1) {
        listingScore += 20;
      }
      factors++;

      // Description
      if (listing.description && listing.description.length >= 250) {
        listingScore += 30;
      } else if (listing.description && listing.description.length >= 100) {
        listingScore += 20;
      } else if (listing.description && listing.description.length >= 50) {
        listingScore += 10;
      }
      factors++;

      // Tags
      if (listing.tags && listing.tags.length >= 10) {
        listingScore += 30;
      } else if (listing.tags && listing.tags.length >= 8) {
        listingScore += 25;
      } else if (listing.tags && listing.tags.length >= 5) {
        listingScore += 15;
      }
      factors++;

      totalScore += factors > 0 ? listingScore / factors : 0;
    }

    return Math.round(totalScore / listings.length);
  }

  // Calculate engagement health
  private calculateEngagementHealth(metrics: Partial<ShopHealthMetrics>): number {
    let score = 0;
    let factors = 0;

    // Response rate
    if (metrics.responseRate !== undefined) {
      score += metrics.responseRate;
      factors++;
    }

    // Average response time (faster = better)
    if (metrics.averageResponseTime !== undefined) {
      const responseScore = Math.max(0, 100 - (metrics.averageResponseTime / 24) * 100);
      score += responseScore;
      factors++;
    }

    // Customer satisfaction
    if (metrics.customerSatisfaction !== undefined) {
      score += metrics.customerSatisfaction;
      factors++;
    }

    return factors > 0 ? Math.round(score / factors) : 0;
  }

  // Calculate business health
  private calculateBusinessHealth(metrics: Partial<ShopHealthMetrics>): number {
    let score = 0;
    let factors = 0;

    // Sales velocity
    if (metrics.salesVelocity !== undefined) {
      const velocityScore = Math.min(100, (metrics.salesVelocity / 10) * 100);
      score += velocityScore;
      factors++;
    }

    // Inventory turnover
    if (metrics.inventoryTurnover !== undefined) {
      const turnoverScore = Math.min(100, metrics.inventoryTurnover * 10);
      score += turnoverScore;
      factors++;
    }

    // Profit margins
    if (metrics.profitMargins !== undefined) {
      score += metrics.profitMargins;
      factors++;
    }

    return factors > 0 ? Math.round(score / factors) : 0;
  }

  // Calculate compliance health
  private calculateComplianceHealth(metrics: Partial<ShopHealthMetrics>): number {
    let score = 0;
    let factors = 0;

    // Policy completeness
    if (metrics.policyCompleteness !== undefined) {
      score += metrics.policyCompleteness;
      factors++;
    }

    // About page quality
    if (metrics.aboutPageQuality !== undefined) {
      score += metrics.aboutPageQuality;
      factors++;
    }

    // Shop banner quality
    if (metrics.shopBannerQuality !== undefined) {
      score += metrics.shopBannerQuality;
      factors++;
    }

    return factors > 0 ? Math.round(score / factors) : 0;
  }

  // Convert score to letter grade
  private scoreToGrade(score: number): string {
    if (score >= 97) return 'A+';
    if (score >= 93) return 'A';
    if (score >= 90) return 'A-';
    if (score >= 87) return 'B+';
    if (score >= 83) return 'B';
    if (score >= 80) return 'B-';
    if (score >= 77) return 'C+';
    if (score >= 73) return 'C';
    if (score >= 70) return 'C-';
    if (score >= 67) return 'D+';
    if (score >= 63) return 'D';
    if (score >= 60) return 'D-';
    return 'F';
  }

  // Identify health issues
  private identifyHealthIssues(
    breakdown: any,
    listings: ListingData[],
    metrics: Partial<ShopHealthMetrics>
  ): HealthIssue[] {
    const issues: HealthIssue[] = [];

    // SEO issues
    if (breakdown.seo < this.config.thresholds.medium) {
      issues.push({
        id: 'seo_overall',
        category: 'seo',
        severity: breakdown.seo < this.config.thresholds.critical ? 'critical' : 'high',
        title: 'Poor SEO Performance',
        description: `Your overall SEO score is ${breakdown.seo}%. This significantly impacts search visibility.`,
        impact: 'High - Reduced search visibility and organic traffic',
        fix: 'Optimize listing titles, descriptions, and tags',
        effort: 'medium',
        priority: 1,
        affectedListings: listings.map(l => l.listingId)
      });
    }

    // Performance issues
    if (breakdown.performance < this.config.thresholds.medium) {
      issues.push({
        id: 'performance_overall',
        category: 'performance',
        severity: breakdown.performance < this.config.thresholds.critical ? 'critical' : 'high',
        title: 'Low Performance Metrics',
        description: `Your performance score is ${breakdown.performance}%. This affects sales conversion.`,
        impact: 'High - Reduced sales and revenue',
        fix: 'Improve conversion rates and customer satisfaction',
        effort: 'high',
        priority: 1
      });
    }

    // Content issues
    if (breakdown.content < this.config.thresholds.medium) {
      issues.push({
        id: 'content_overall',
        category: 'content',
        severity: breakdown.content < this.config.thresholds.critical ? 'critical' : 'high',
        title: 'Poor Content Quality',
        description: `Your content score is ${breakdown.content}%. This affects customer experience.`,
        impact: 'Medium - Reduced customer engagement and conversion',
        fix: 'Improve images, descriptions, and overall content quality',
        effort: 'medium',
        priority: 2
      });
    }

    // Engagement issues
    if (breakdown.engagement < this.config.thresholds.medium) {
      issues.push({
        id: 'engagement_overall',
        category: 'engagement',
        severity: breakdown.engagement < this.config.thresholds.critical ? 'critical' : 'high',
        title: 'Low Customer Engagement',
        description: `Your engagement score is ${breakdown.engagement}%. This affects customer relationships.`,
        impact: 'Medium - Reduced customer loyalty and repeat sales',
        fix: 'Improve customer communication and response times',
        effort: 'medium',
        priority: 3
      });
    }

    // Business issues
    if (breakdown.business < this.config.thresholds.medium) {
      issues.push({
        id: 'business_overall',
        category: 'business',
        severity: breakdown.business < this.config.thresholds.critical ? 'critical' : 'high',
        title: 'Business Performance Issues',
        description: `Your business score is ${breakdown.business}%. This affects profitability.`,
        impact: 'High - Reduced profitability and growth',
        fix: 'Optimize pricing, inventory, and business operations',
        effort: 'high',
        priority: 2
      });
    }

    // Compliance issues
    if (breakdown.compliance < this.config.thresholds.medium) {
      issues.push({
        id: 'compliance_overall',
        category: 'compliance',
        severity: breakdown.compliance < this.config.thresholds.critical ? 'critical' : 'high',
        title: 'Compliance Issues',
        description: `Your compliance score is ${breakdown.compliance}%. This affects shop credibility.`,
        impact: 'Medium - Reduced shop credibility and trust',
        fix: 'Complete shop policies and improve shop presentation',
        effort: 'low',
        priority: 4
      });
    }

    // Sort by priority
    return issues.sort((a, b) => a.priority - b.priority);
  }

  // Generate health recommendations
  private generateHealthRecommendations(
    breakdown: any,
    issues: HealthIssue[]
  ): HealthRecommendation[] {
    const recommendations: HealthRecommendation[] = [];

    // SEO recommendations
    if (breakdown.seo < 80) {
      recommendations.push({
        id: 'seo_optimization',
        category: 'seo',
        priority: breakdown.seo < 50 ? 'critical' : breakdown.seo < 70 ? 'high' : 'medium',
        title: 'Optimize SEO Performance',
        description: 'Improve your listing SEO to increase search visibility and organic traffic.',
        expectedImpact: '20-40% increase in organic traffic',
        timeframe: '2-4 weeks',
        actionSteps: [
          'Audit all listing titles and optimize with relevant keywords',
          'Improve product descriptions with better formatting and keywords',
          'Add more relevant and unique tags to listings',
          'Optimize image alt text and file names'
        ],
        estimatedEffort: 'Medium (2-3 hours per listing)',
        potentialROI: 'High - Direct impact on search visibility'
      });
    }

    // Performance recommendations
    if (breakdown.performance < 80) {
      recommendations.push({
        id: 'performance_improvement',
        category: 'performance',
        priority: breakdown.performance < 50 ? 'critical' : breakdown.seo < 70 ? 'high' : 'medium',
        title: 'Improve Performance Metrics',
        description: 'Focus on improving conversion rates and customer satisfaction.',
        expectedImpact: '15-30% increase in conversion rate',
        timeframe: '3-6 weeks',
        actionSteps: [
          'Analyze and optimize pricing strategy',
          'Improve product photography and descriptions',
          'Add customer reviews and testimonials',
          'Implement customer service best practices'
        ],
        estimatedEffort: 'High (4-6 hours per listing)',
        potentialROI: 'High - Direct impact on sales'
      });
    }

    // Content recommendations
    if (breakdown.content < 80) {
      recommendations.push({
        id: 'content_enhancement',
        category: 'content',
        priority: breakdown.content < 50 ? 'critical' : breakdown.content < 70 ? 'high' : 'medium',
        title: 'Enhance Content Quality',
        description: 'Improve the quality and completeness of your listing content.',
        expectedImpact: '10-25% improvement in customer engagement',
        timeframe: '2-4 weeks',
        actionSteps: [
          'Retake product photos with better lighting and styling',
          'Add lifestyle images showing products in use',
          'Write more detailed and compelling descriptions',
          'Add size charts, care instructions, and specifications'
        ],
        estimatedEffort: 'Medium (1-2 hours per listing)',
        potentialROI: 'Medium - Improved customer experience'
      });
    }

    // Engagement recommendations
    if (breakdown.engagement < 80) {
      recommendations.push({
        id: 'engagement_boost',
        category: 'engagement',
        priority: breakdown.engagement < 50 ? 'critical' : breakdown.engagement < 70 ? 'high' : 'medium',
        title: 'Boost Customer Engagement',
        description: 'Improve customer communication and engagement strategies.',
        expectedImpact: '15-25% improvement in customer satisfaction',
        timeframe: '1-2 weeks',
        actionSteps: [
          'Respond to messages within 2 hours',
          'Follow up with customers after purchase',
          'Encourage and respond to reviews',
          'Create engaging social media content'
        ],
        estimatedEffort: 'Low (30 minutes daily)',
        potentialROI: 'Medium - Improved customer relationships'
      });
    }

    // Business recommendations
    if (breakdown.business < 80) {
      recommendations.push({
        id: 'business_optimization',
        category: 'business',
        priority: breakdown.business < 50 ? 'critical' : breakdown.business < 70 ? 'high' : 'medium',
        title: 'Optimize Business Operations',
        description: 'Improve business processes and profitability.',
        expectedImpact: '10-20% increase in profitability',
        timeframe: '4-8 weeks',
        actionSteps: [
          'Review and optimize pricing strategy',
          'Improve inventory management',
          'Analyze and reduce operational costs',
          'Implement better financial tracking'
        ],
        estimatedEffort: 'High (6-8 hours weekly)',
        potentialROI: 'High - Direct impact on profitability'
      });
    }

    // Compliance recommendations
    if (breakdown.compliance < 80) {
      recommendations.push({
        id: 'compliance_completion',
        category: 'compliance',
        priority: breakdown.compliance < 50 ? 'critical' : breakdown.compliance < 70 ? 'high' : 'medium',
        title: 'Complete Compliance Requirements',
        description: 'Ensure all shop policies and information are complete and up-to-date.',
        expectedImpact: 'Improved shop credibility and trust',
        timeframe: '1 week',
        actionSteps: [
          'Complete shop policies (shipping, returns, etc.)',
          'Write a compelling about page',
          'Update shop banner and profile images',
          'Ensure all required information is present'
        ],
        estimatedEffort: 'Low (2-3 hours total)',
        potentialROI: 'Medium - Improved shop credibility'
      });
    }

    return recommendations;
  }

  // Get quick wins (low effort, high impact)
  private getQuickWins(recommendations: HealthRecommendation[]): HealthRecommendation[] {
    return recommendations.filter(rec => 
      rec.estimatedEffort === 'Low' && 
      (rec.priority === 'high' || rec.priority === 'critical')
    );
  }

  // Get health trends
  private getHealthTrends(shopId: string): HealthTrend[] {
    return this.healthHistory.get(shopId) || [];
  }

  // Save health score to history
  private async saveHealthScore(shopId: string, healthScore: ShopHealthScore): Promise<void> {
    try {
      const trend: HealthTrend = {
        date: healthScore.lastUpdated,
        score: healthScore.overall,
        issues: healthScore.issues.length,
        improvements: healthScore.recommendations.map(rec => rec.title)
      };

      const history = this.healthHistory.get(shopId) || [];
      history.push(trend);
      
      // Keep only last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const filteredHistory = history.filter(h => h.date >= thirtyDaysAgo);
      this.healthHistory.set(shopId, filteredHistory);
    } catch (error) {
      console.error('Error saving health score:', error);
    }
  }

  // Get health improvement timeline
  getHealthImprovementTimeline(shopId: string): { date: Date; expectedScore: number; actions: string[] }[] {
    const history = this.healthHistory.get(shopId) || [];
    const currentScore = history.length > 0 ? history[history.length - 1].score : 0;
    
    const timeline = [];
    const today = new Date();
    
    // Week 1
    const week1 = new Date(today);
    week1.setDate(week1.getDate() + 7);
    timeline.push({
      date: week1,
      expectedScore: Math.min(100, currentScore + 5),
      actions: ['Complete quick wins', 'Optimize top 5 listings']
    });
    
    // Week 2
    const week2 = new Date(today);
    week2.setDate(week2.getDate() + 14);
    timeline.push({
      date: week2,
      expectedScore: Math.min(100, currentScore + 12),
      actions: ['Improve content quality', 'Enhance SEO']
    });
    
    // Month 1
    const month1 = new Date(today);
    month1.setMonth(month1.getMonth() + 1);
    timeline.push({
      date: month1,
      expectedScore: Math.min(100, currentScore + 25),
      actions: ['Complete all recommendations', 'Monitor performance']
    });
    
    return timeline;
  }

  // Export health report
  exportHealthReport(healthScore: ShopHealthScore): string {
    const report = `
Shop Health Report
=================

Overall Score: ${healthScore.overall}/100 (${healthScore.grade})
Generated: ${healthScore.lastUpdated.toLocaleDateString()}

BREAKDOWN
=========
SEO: ${healthScore.breakdown.seo}/100
Performance: ${healthScore.breakdown.performance}/100
Content: ${healthScore.breakdown.content}/100
Engagement: ${healthScore.breakdown.engagement}/100
Business: ${healthScore.breakdown.business}/100
Compliance: ${healthScore.breakdown.compliance}/100

CRITICAL ISSUES
===============
${healthScore.issues.filter(issue => issue.severity === 'critical').map(issue => `
${issue.title}
${issue.description}
Impact: ${issue.impact}
Fix: ${issue.fix}
`).join('')}

TOP RECOMMENDATIONS
==================
${healthScore.recommendations.slice(0, 5).map(rec => `
${rec.title} (${rec.priority} priority)
${rec.description}
Expected Impact: ${rec.expectedImpact}
Timeframe: ${rec.timeframe}
Effort: ${rec.estimatedEffort}

Action Steps:
${rec.actionSteps.map(step => `- ${step}`).join('\n')}
`).join('')}

QUICK WINS
==========
${healthScore.quickWins.map(win => `
${win.title}
${win.description}
Effort: ${win.estimatedEffort}
Impact: ${win.expectedImpact}
`).join('')}
`;

    return report;
  }
}

// Default shop health monitor instance
let shopHealthMonitor: ShopHealthMonitor | null = null;

export function getShopHealthMonitor(): ShopHealthMonitor {
  if (!shopHealthMonitor) {
    shopHealthMonitor = new ShopHealthMonitor();
  }
  return shopHealthMonitor;
}

export default ShopHealthMonitor;

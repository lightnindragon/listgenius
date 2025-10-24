/**
 * Listing Health Check Engine
 * Instant SEO audit and optimization recommendations
 */

import { logger } from './logger';
import { db } from './db';
import { keywordCache } from './redis';

export interface HealthCheckResult {
  listingId: number;
  title: string;
  overallScore: number; // 0-100
  issues: HealthIssue[];
  recommendations: HealthRecommendation[];
  metrics: {
    title: HealthMetric;
    description: HealthMetric;
    tags: HealthMetric;
    images: HealthMetric;
    pricing: HealthMetric;
    seo: HealthMetric;
  };
  lastChecked: string;
}

export interface HealthIssue {
  category: 'title' | 'description' | 'tags' | 'images' | 'pricing' | 'seo';
  severity: 'critical' | 'warning' | 'info';
  issue: string;
  impact: 'high' | 'medium' | 'low';
  fix: string;
  priority: number; // 1-10
}

export interface HealthRecommendation {
  category: 'title' | 'description' | 'tags' | 'images' | 'pricing' | 'seo';
  action: string;
  benefit: string;
  effort: 'low' | 'medium' | 'high';
  impact: 'high' | 'medium' | 'low';
  priority: number; // 1-10
}

export interface HealthMetric {
  score: number; // 0-100
  status: 'excellent' | 'good' | 'fair' | 'poor';
  issues: number;
  maxScore: number;
  details: string[];
}

export interface BulkHealthCheck {
  totalListings: number;
  checkedListings: number;
  averageScore: number;
  criticalIssues: number;
  warnings: number;
  topIssues: Array<{ issue: string; count: number; impact: string }>;
  categoryScores: {
    title: number;
    description: number;
    tags: number;
    images: number;
    pricing: number;
    seo: number;
  };
  recommendations: HealthRecommendation[];
}

export class ListingHealthCheck {
  /**
   * Perform health check on a single listing
   */
  async checkListing(listingId: number, listingData: any): Promise<HealthCheckResult> {
    try {
      // Check cache first
      const cacheKey = `health:${listingId}`;
      const cached = await keywordCache.get(cacheKey);
      if (cached && typeof cached === 'object' && 'overallScore' in cached) {
        return cached as HealthCheckResult;
      }

      // Perform health checks
      const titleMetric = this.checkTitle(listingData.title, listingData.tags);
      const descriptionMetric = this.checkDescription(listingData.description);
      const tagsMetric = this.checkTags(listingData.tags);
      const imagesMetric = this.checkImages(listingData.images);
      const pricingMetric = this.checkPricing(listingData.price);
      const seoMetric = this.checkSEO(listingData);

      // Calculate overall score
      const overallScore = Math.round(
        (titleMetric.score + descriptionMetric.score + tagsMetric.score + 
         imagesMetric.score + pricingMetric.score + seoMetric.score) / 6
      );

      // Identify issues
      const issues = this.identifyIssues({
        title: titleMetric,
        description: descriptionMetric,
        tags: tagsMetric,
        images: imagesMetric,
        pricing: pricingMetric,
        seo: seoMetric,
      });

      // Generate recommendations
      const recommendations = this.generateRecommendations(issues, listingData);

      const result: HealthCheckResult = {
        listingId,
        title: listingData.title,
        overallScore,
        issues,
        recommendations,
        metrics: {
          title: titleMetric,
          description: descriptionMetric,
          tags: tagsMetric,
          images: imagesMetric,
          pricing: pricingMetric,
          seo: seoMetric,
        },
        lastChecked: new Date().toISOString(),
      };

      // Cache result
      await keywordCache.set(cacheKey, result, 3600); // 1 hour

      logger.info('Listing health check completed', { listingId, result });

      return result;
    } catch (error) {
      logger.error('Failed to perform health check', { listingId, error });
      throw error;
    }
  }

  /**
   * Perform bulk health check on multiple listings
   */
  async bulkHealthCheck(listingIds: number[], listingsData: any[]): Promise<BulkHealthCheck> {
    try {
      const results: HealthCheckResult[] = [];
      let totalScore = 0;
      let criticalIssues = 0;
      let warnings = 0;
      const issueCounts: { [key: string]: number } = {};
      const categoryScores = {
        title: 0,
        description: 0,
        tags: 0,
        images: 0,
        pricing: 0,
        seo: 0,
      };

      // Check each listing
      for (let i = 0; i < listingsData.length; i++) {
        try {
          const result = await this.checkListing(listingIds[i], listingsData[i]);
          results.push(result);
          totalScore += result.overallScore;

          // Count issues
          result.issues.forEach(issue => {
            if (issue.severity === 'critical') criticalIssues++;
            if (issue.severity === 'warning') warnings++;
            
            const key = `${issue.category}:${issue.issue}`;
            issueCounts[key] = (issueCounts[key] || 0) + 1;
          });

          // Accumulate category scores
          Object.keys(categoryScores).forEach(category => {
            categoryScores[category as keyof typeof categoryScores] += 
              result.metrics[category as keyof typeof result.metrics].score;
          });
        } catch (error) {
          logger.warn('Failed to check listing in bulk', { listingId: listingIds[i], error });
        }
      }

      // Calculate averages
      const averageScore = results.length > 0 ? Math.round(totalScore / results.length) : 0;
      Object.keys(categoryScores).forEach(category => {
        categoryScores[category as keyof typeof categoryScores] = 
          Math.round(categoryScores[category as keyof typeof categoryScores] / results.length);
      });

      // Get top issues
      const topIssues = Object.entries(issueCounts)
        .map(([issue, count]) => ({
          issue: issue.split(':')[1],
          count,
          impact: issue.split(':')[0],
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Generate bulk recommendations
      const recommendations = this.generateBulkRecommendations(topIssues, categoryScores);

      const bulkResult: BulkHealthCheck = {
        totalListings: listingsData.length,
        checkedListings: results.length,
        averageScore,
        criticalIssues,
        warnings,
        topIssues,
        categoryScores,
        recommendations,
      };

      logger.info('Bulk health check completed', { bulkResult });

      return bulkResult;
    } catch (error) {
      logger.error('Failed to perform bulk health check', { error });
      throw error;
    }
  }

  /**
   * Check title health
   */
  private checkTitle(title: string, tags: string[]): HealthMetric {
    const issues: string[] = [];
    let score = 100;

    // Check length
    if (title.length < 20) {
      issues.push('Title too short (minimum 20 characters)');
      score -= 30;
    } else if (title.length > 60) {
      issues.push('Title too long (maximum 60 characters)');
      score -= 20;
    }

    // Check for focus keyword
    const focusKeyword = tags[0] || '';
    if (focusKeyword && !title.toLowerCase().includes(focusKeyword.toLowerCase())) {
      issues.push('Focus keyword not in title');
      score -= 25;
    }

    // Check for power words
    const powerWords = ['unique', 'handmade', 'custom', 'vintage', 'artisan', 'premium'];
    const hasPowerWords = powerWords.some(word => title.toLowerCase().includes(word));
    if (!hasPowerWords) {
      issues.push('Missing power words in title');
      score -= 10;
    }

    // Check for emotional triggers
    const emotionalWords = ['beautiful', 'stunning', 'gorgeous', 'amazing', 'perfect'];
    const hasEmotionalWords = emotionalWords.some(word => title.toLowerCase().includes(word));
    if (!hasEmotionalWords) {
      issues.push('Missing emotional triggers in title');
      score -= 5;
    }

    return {
      score: Math.max(0, score),
      status: this.getStatus(score),
      issues: issues.length,
      maxScore: 100,
      details: issues,
    };
  }

  /**
   * Check description health
   */
  private checkDescription(description: string): HealthMetric {
    const issues: string[] = [];
    let score = 100;

    // Check length
    if (description.length < 200) {
      issues.push('Description too short (minimum 200 characters)');
      score -= 40;
    } else if (description.length > 600) {
      issues.push('Description too long (maximum 600 characters)');
      score -= 10;
    }

    // Check for bullet points
    if (!description.includes('•') && !description.includes('-')) {
      issues.push('Missing bullet points for readability');
      score -= 15;
    }

    // Check for call to action
    const ctaWords = ['buy', 'order', 'purchase', 'add to cart', 'shop now'];
    const hasCTA = ctaWords.some(word => description.toLowerCase().includes(word));
    if (!hasCTA) {
      issues.push('Missing call to action');
      score -= 10;
    }

    // Check for benefits
    const benefitWords = ['benefit', 'advantage', 'perfect for', 'ideal for', 'great for'];
    const hasBenefits = benefitWords.some(word => description.toLowerCase().includes(word));
    if (!hasBenefits) {
      issues.push('Missing benefit statements');
      score -= 10;
    }

    return {
      score: Math.max(0, score),
      status: this.getStatus(score),
      issues: issues.length,
      maxScore: 100,
      details: issues,
    };
  }

  /**
   * Check tags health
   */
  private checkTags(tags: string[]): HealthMetric {
    const issues: string[] = [];
    let score = 100;

    // Check count
    if (tags.length < 10) {
      issues.push('Too few tags (minimum 10 recommended)');
      score -= 30;
    } else if (tags.length > 13) {
      issues.push('Too many tags (maximum 13 allowed)');
      score -= 20;
    }

    // Check tag length
    const longTags = tags.filter(tag => tag.length > 20);
    if (longTags.length > 0) {
      issues.push(`${longTags.length} tags exceed 20 characters`);
      score -= 15;
    }

    // Check for long-tail keywords
    const longTailTags = tags.filter(tag => tag.split(' ').length >= 2);
    if (longTailTags.length < 3) {
      issues.push('Need more long-tail keyword tags');
      score -= 20;
    }

    // Check for brand tags
    const brandTags = tags.filter(tag => 
      tag.toLowerCase().includes('handmade') || 
      tag.toLowerCase().includes('artisan') ||
      tag.toLowerCase().includes('unique')
    );
    if (brandTags.length === 0) {
      issues.push('Missing brand/quality tags');
      score -= 15;
    }

    return {
      score: Math.max(0, score),
      status: this.getStatus(score),
      issues: issues.length,
      maxScore: 100,
      details: issues,
    };
  }

  /**
   * Check images health
   */
  private checkImages(images: any[]): HealthMetric {
    const issues: string[] = [];
    let score = 100;

    // Check image count
    if (images.length < 3) {
      issues.push('Need at least 3 images');
      score -= 40;
    }

    // Check for high-resolution images
    const lowResImages = images.filter(img => 
      img.width < 2000 || img.height < 2000
    );
    if (lowResImages.length > 0) {
      issues.push(`${lowResImages.length} images below 2000x2000 resolution`);
      score -= 20;
    }

    // Check for alt text
    const imagesWithoutAlt = images.filter(img => !img.alt_text || img.alt_text.length < 10);
    if (imagesWithoutAlt.length > 0) {
      issues.push(`${imagesWithoutAlt.length} images missing alt text`);
      score -= 25;
    }

    // Check for lifestyle images
    const hasLifestyleImages = images.some(img => 
      img.alt_text?.toLowerCase().includes('lifestyle') ||
      img.alt_text?.toLowerCase().includes('in use')
    );
    if (!hasLifestyleImages) {
      issues.push('Missing lifestyle/product in use images');
      score -= 15;
    }

    return {
      score: Math.max(0, score),
      status: this.getStatus(score),
      issues: issues.length,
      maxScore: 100,
      details: issues,
    };
  }

  /**
   * Check pricing health
   */
  private checkPricing(price: any): HealthMetric {
    const issues: string[] = [];
    let score = 100;
    const priceValue = price.amount / price.divisor;

    // Check if price is set
    if (!priceValue || priceValue <= 0) {
      issues.push('Price not set');
      score -= 50;
      return {
        score: Math.max(0, score),
        status: this.getStatus(score),
        issues: issues.length,
        maxScore: 100,
        details: issues,
      };
    }

    // Check price range
    if (priceValue < 5) {
      issues.push('Price may be too low (minimum $5 recommended)');
      score -= 20;
    } else if (priceValue > 500) {
      issues.push('Price may be too high (consider market research)');
      score -= 10;
    }

    // Check for psychological pricing
    const priceStr = priceValue.toString();
    if (!priceStr.includes('.99') && !priceStr.includes('.95')) {
      issues.push('Consider psychological pricing (e.g., $19.99)');
      score -= 5;
    }

    return {
      score: Math.max(0, score),
      status: this.getStatus(score),
      issues: issues.length,
      maxScore: 100,
      details: issues,
    };
  }

  /**
   * Check SEO health
   */
  private checkSEO(listingData: any): HealthMetric {
    const issues: string[] = [];
    let score = 100;

    // Check for focus keyword consistency
    const focusKeyword = listingData.tags[0] || '';
    if (focusKeyword) {
      const titleHasKeyword = listingData.title.toLowerCase().includes(focusKeyword.toLowerCase());
      const descriptionHasKeyword = listingData.description.toLowerCase().includes(focusKeyword.toLowerCase());
      
      if (!titleHasKeyword || !descriptionHasKeyword) {
        issues.push('Focus keyword not consistently used');
        score -= 20;
      }
    }

    // Check for keyword density
    const description = listingData.description.toLowerCase();
    const wordCount = description.split(' ').length;
    const keywordCount = (description.match(new RegExp(focusKeyword.toLowerCase(), 'g')) || []).length;
    const density = (keywordCount / wordCount) * 100;
    
    if (density > 3) {
      issues.push('Keyword density too high (over 3%)');
      score -= 15;
    } else if (density < 0.5) {
      issues.push('Keyword density too low (under 0.5%)');
      score -= 10;
    }

    // Check for LSI keywords
    const lsiKeywords = listingData.tags.slice(1, 5);
    const hasLSIKeywords = lsiKeywords.some((keyword: string) => 
      listingData.description.toLowerCase().includes(keyword.toLowerCase())
    );
    if (!hasLSIKeywords) {
      issues.push('Missing LSI keywords in description');
      score -= 10;
    }

    return {
      score: Math.max(0, score),
      status: this.getStatus(score),
      issues: issues.length,
      maxScore: 100,
      details: issues,
    };
  }

  /**
   * Helper methods
   */
  private getStatus(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (score >= 90) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'fair';
    return 'poor';
  }

  private identifyIssues(metrics: any): HealthIssue[] {
    const issues: HealthIssue[] = [];

    Object.entries(metrics).forEach(([category, metric]: [string, any]) => {
      metric.details.forEach((detail: string) => {
        const severity = metric.score < 50 ? 'critical' : metric.score < 70 ? 'warning' : 'info';
        const impact = metric.score < 50 ? 'high' : metric.score < 70 ? 'medium' : 'low';
        const priority = this.calculatePriority(severity, impact);

        issues.push({
          category: category as any,
          severity: severity as any,
          issue: detail,
          impact: impact as any,
          fix: this.generateFix(category, detail),
          priority,
        });
      });
    });

    return issues.sort((a, b) => b.priority - a.priority);
  }

  private generateRecommendations(issues: HealthIssue[], listingData: any): HealthRecommendation[] {
    const recommendations: HealthRecommendation[] = [];

    // Generate recommendations based on issues
    issues.forEach(issue => {
      recommendations.push({
        category: issue.category,
        action: issue.fix,
        benefit: this.getBenefit(issue.category),
        effort: this.getEffort(issue.category) as "high" | "medium" | "low",
        impact: issue.impact,
        priority: issue.priority,
      });
    });

    // Add general recommendations
    if (listingData.views < 100) {
      recommendations.push({
        category: 'seo',
        action: 'Optimize keywords and tags for better search visibility',
        benefit: 'Increase organic traffic and views',
        effort: 'medium',
        impact: 'high',
        priority: 8,
      });
    }

    return recommendations.sort((a, b) => b.priority - a.priority);
  }

  private generateBulkRecommendations(topIssues: any[], categoryScores: any): HealthRecommendation[] {
    const recommendations: HealthRecommendation[] = [];

    // Recommend based on top issues
    topIssues.slice(0, 5).forEach(issue => {
      recommendations.push({
        category: issue.impact as any,
        action: `Fix ${issue.issue} across multiple listings`,
        benefit: `Improve overall shop performance`,
        effort: 'medium',
        impact: 'high',
        priority: 9,
      });
    });

    // Recommend based on lowest category scores
    Object.entries(categoryScores).forEach(([category, score]) => {
      if ((score as number) < 70) {
        recommendations.push({
          category: category as any,
          action: `Improve ${category} across all listings`,
          benefit: `Boost ${category} performance`,
          effort: 'medium',
          impact: 'high',
          priority: 8,
        });
      }
    });

    return recommendations.sort((a, b) => b.priority - a.priority);
  }

  private calculatePriority(severity: string, impact: string): number {
    let priority = 5;
    if (severity === 'critical') priority += 3;
    if (severity === 'warning') priority += 2;
    if (impact === 'high') priority += 2;
    if (impact === 'medium') priority += 1;
    return priority;
  }

  private generateFix(category: string, issue: string): string {
    const fixes: { [key: string]: string } = {
      'Title too short': 'Add more descriptive words and power words',
      'Title too long': 'Shorten title while keeping key information',
      'Focus keyword not in title': 'Include your main keyword in the title',
      'Missing power words': 'Add words like "unique", "handmade", or "custom"',
      'Description too short': 'Add more details about benefits and features',
      'Missing bullet points': 'Use bullet points to highlight key features',
      'Missing call to action': 'Add phrases like "buy now" or "order today"',
      'Too few tags': 'Add more relevant tags (aim for 10-13)',
      'Too many tags': 'Remove less relevant tags (maximum 13 allowed)',
      'Need more long-tail keyword tags': 'Add 2-3 word keyword phrases',
      'Missing brand/quality tags': 'Add tags like "handmade" or "artisan"',
      'Need at least 3 images': 'Add more product images',
      'Images below 2000x2000 resolution': 'Use higher resolution images',
      'Images missing alt text': 'Add descriptive alt text to all images',
      'Missing lifestyle images': 'Add photos showing product in use',
      'Price not set': 'Set an appropriate price for your product',
      'Price may be too low': 'Research competitor pricing',
      'Focus keyword not consistently used': 'Use your main keyword in title and description',
      'Keyword density too high': 'Reduce keyword repetition',
      'Keyword density too low': 'Include your keyword more naturally',
      'Missing LSI keywords': 'Include related keywords in description',
    };

    return fixes[issue] || `Improve ${category} optimization`;
  }

  private getBenefit(category: string): string {
    const benefits: { [key: string]: string } = {
      title: 'Improve click-through rates and search visibility',
      description: 'Increase conversions and customer engagement',
      tags: 'Enhance search discoverability',
      images: 'Boost visual appeal and trust',
      pricing: 'Optimize sales and profitability',
      seo: 'Improve search rankings',
    };

    return benefits[category] || 'Enhance overall listing performance';
  }

  private getEffort(category: string): string {
    const efforts: { [key: string]: string } = {
      title: 'low',
      description: 'medium',
      tags: 'low',
      images: 'high',
      pricing: 'medium',
      seo: 'medium',
    };

    return efforts[category] || 'medium';
  }
}

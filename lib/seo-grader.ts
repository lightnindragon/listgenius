import { emitTopRightToast } from '@/components/TopRightToast';

// SEO grading criteria
export interface SEOGradingCriteria {
  title: {
    maxLength: number;
    minLength: number;
    keywordDensity: number;
    emotionalWords: boolean;
    brandWords: boolean;
  };
  description: {
    maxLength: number;
    minLength: number;
    keywordDensity: number;
    formatting: boolean;
    callToAction: boolean;
    features: boolean;
  };
  tags: {
    maxCount: number;
    minCount: number;
    keywordRelevance: number;
    uniqueness: number;
    length: number;
  };
  images: {
    minCount: number;
    maxCount: number;
    altText: boolean;
    quality: boolean;
    variety: boolean;
  };
  pricing: {
    competitive: boolean;
    psychological: boolean;
    freeShipping: boolean;
  };
  engagement: {
    reviews: boolean;
    favorites: boolean;
    responseTime: boolean;
  };
}

// SEO grade result
export interface SEOGrade {
  overall: string; // A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-, F
  score: number; // 0-100
  breakdown: {
    title: GradeBreakdown;
    description: GradeBreakdown;
    tags: GradeBreakdown;
    images: GradeBreakdown;
    pricing: GradeBreakdown;
    engagement: GradeBreakdown;
  };
  issues: SEOIssue[];
  improvements: SEOImprovement[];
  history: SEOGradeHistory[];
}

// Individual grade breakdown
export interface GradeBreakdown {
  grade: string;
  score: number;
  maxScore: number;
  feedback: string;
  issues: string[];
}

// SEO issues found
export interface SEOIssue {
  category: 'title' | 'description' | 'tags' | 'images' | 'pricing' | 'engagement';
  severity: 'low' | 'medium' | 'high' | 'critical';
  issue: string;
  description: string;
  fix: string;
  impact: string;
}

// SEO improvements
export interface SEOImprovement {
  category: 'title' | 'description' | 'tags' | 'images' | 'pricing' | 'engagement';
  priority: 'low' | 'medium' | 'high' | 'critical';
  suggestion: string;
  description: string;
  expectedImprovement: string;
  effort: 'low' | 'medium' | 'high';
}

// Grade history tracking
export interface SEOGradeHistory {
  date: Date;
  grade: string;
  score: number;
  improvements: string[];
  issues: string[];
}

// Listing data for grading
export interface ListingData {
  listingId: number;
  title: string;
  description: string;
  tags: string[];
  images: {
    url: string;
    altText?: string;
  }[];
  price: number;
  currency: string;
  reviews: {
    count: number;
    average: number;
  };
  favorites: number;
  views: number;
  conversionRate?: number;
  category: string;
}

class SEOGrader {
  private criteria: SEOGradingCriteria;

  constructor() {
    this.criteria = this.initializeCriteria();
  }

  // Initialize grading criteria
  private initializeCriteria(): SEOGradingCriteria {
    return {
      title: {
        maxLength: 140,
        minLength: 30,
        keywordDensity: 0.1, // 10%
        emotionalWords: true,
        brandWords: true
      },
      description: {
        maxLength: 5000,
        minLength: 200,
        keywordDensity: 0.05, // 5%
        formatting: true,
        callToAction: true,
        features: true
      },
      tags: {
        maxCount: 13,
        minCount: 8,
        keywordRelevance: 0.8, // 80%
        uniqueness: 0.7, // 70%
        length: 20
      },
      images: {
        minCount: 5,
        maxCount: 10,
        altText: true,
        quality: true,
        variety: true
      },
      pricing: {
        competitive: true,
        psychological: true,
        freeShipping: true
      },
      engagement: {
        reviews: true,
        favorites: true,
        responseTime: true
      }
    };
  }

  // Grade a listing
  async gradeListing(listingData: ListingData): Promise<SEOGrade> {
    try {
      const breakdown = {
        title: this.gradeTitle(listingData.title, listingData.tags),
        description: this.gradeDescription(listingData.description, listingData.tags),
        tags: this.gradeTags(listingData.tags, listingData.category),
        images: this.gradeImages(listingData.images),
        pricing: this.gradePricing(listingData.price, listingData.category),
        engagement: this.gradeEngagement(listingData.reviews, listingData.favorites, listingData.views)
      };

      const overallScore = this.calculateOverallScore(breakdown);
      const overallGrade = this.scoreToGrade(overallScore);

      const issues = this.identifyIssues(breakdown, listingData);
      const improvements = this.generateImprovements(breakdown, listingData);

      const grade: SEOGrade = {
        overall: overallGrade,
        score: overallScore,
        breakdown,
        issues,
        improvements,
        history: [] // Would be loaded from database
      };

      return grade;
    } catch (error) {
      console.error('Error grading listing:', error);
      throw error;
    }
  }

  // Grade title
  private gradeTitle(title: string, tags: string[]): GradeBreakdown {
    const issues: string[] = [];
    let score = 100;
    const maxScore = 100;

    // Length check
    if (title.length < this.criteria.title.minLength) {
      issues.push(`Title too short (${title.length} chars, need ${this.criteria.title.minLength}+)`);
      score -= 20;
    } else if (title.length > this.criteria.title.maxLength) {
      issues.push(`Title too long (${title.length} chars, max ${this.criteria.title.maxLength})`);
      score -= 15;
    }

    // Keyword density
    const keywordDensity = this.calculateKeywordDensity(title, tags);
    if (keywordDensity < this.criteria.title.keywordDensity) {
      issues.push(`Low keyword density (${Math.round(keywordDensity * 100)}%, need ${Math.round(this.criteria.title.keywordDensity * 100)}%+)`);
      score -= 15;
    }

    // Emotional words
    const hasEmotionalWords = this.hasEmotionalWords(title);
    if (!hasEmotionalWords && this.criteria.title.emotionalWords) {
      issues.push('Missing emotional/persuasive words');
      score -= 10;
    }

    // Brand words
    const hasBrandWords = this.hasBrandWords(title);
    if (!hasBrandWords && this.criteria.title.brandWords) {
      issues.push('Missing brand/shop name');
      score -= 5;
    }

    // Character optimization
    const charCount = title.length;
    if (charCount < 60 || charCount > 100) {
      issues.push('Title length not optimized for search (60-100 chars ideal)');
      score -= 10;
    }

    score = Math.max(0, score);
    const grade = this.scoreToGrade(score);

    let feedback = '';
    if (score >= 90) {
      feedback = 'Excellent title! Well-optimized for search and conversion.';
    } else if (score >= 80) {
      feedback = 'Good title with room for minor improvements.';
    } else if (score >= 70) {
      feedback = 'Title needs some optimization to improve search visibility.';
    } else {
      feedback = 'Title requires significant improvement for better SEO performance.';
    }

    return {
      grade,
      score,
      maxScore,
      feedback,
      issues
    };
  }

  // Grade description
  private gradeDescription(description: string, tags: string[]): GradeBreakdown {
    const issues: string[] = [];
    let score = 100;
    const maxScore = 100;

    // Length check
    if (description.length < this.criteria.description.minLength) {
      issues.push(`Description too short (${description.length} words, need ${this.criteria.description.minLength}+)`);
      score -= 25;
    } else if (description.length > this.criteria.description.maxLength) {
      issues.push(`Description too long (${description.length} words, max ${this.criteria.description.maxLength})`);
      score -= 10;
    }

    // Keyword density
    const keywordDensity = this.calculateKeywordDensity(description, tags);
    if (keywordDensity < this.criteria.description.keywordDensity) {
      issues.push(`Low keyword density (${Math.round(keywordDensity * 100)}%, need ${Math.round(this.criteria.description.keywordDensity * 100)}%+)`);
      score -= 15;
    }

    // Formatting
    const hasFormatting = this.hasGoodFormatting(description);
    if (!hasFormatting && this.criteria.description.formatting) {
      issues.push('Poor formatting - add bullet points, line breaks, or structure');
      score -= 15;
    }

    // Call to action
    const hasCallToAction = this.hasCallToAction(description);
    if (!hasCallToAction && this.criteria.description.callToAction) {
      issues.push('Missing call to action');
      score -= 10;
    }

    // Features
    const hasFeatures = this.hasFeatureList(description);
    if (!hasFeatures && this.criteria.description.features) {
      issues.push('Missing feature list or specifications');
      score -= 10;
    }

    // Word count optimization
    const wordCount = description.split(' ').length;
    if (wordCount < 250 || wordCount > 600) {
      issues.push('Description length not optimized (250-600 words ideal)');
      score -= 10;
    }

    score = Math.max(0, score);
    const grade = this.scoreToGrade(score);

    let feedback = '';
    if (score >= 90) {
      feedback = 'Outstanding description! Comprehensive and well-structured.';
    } else if (score >= 80) {
      feedback = 'Good description with minor areas for improvement.';
    } else if (score >= 70) {
      feedback = 'Description needs optimization for better conversion.';
    } else {
      feedback = 'Description requires significant improvement.';
    }

    return {
      grade,
      score,
      maxScore,
      feedback,
      issues
    };
  }

  // Grade tags
  private gradeTags(tags: string[], category: string): GradeBreakdown {
    const issues: string[] = [];
    let score = 100;
    const maxScore = 100;

    // Count check
    if (tags.length < this.criteria.tags.minCount) {
      issues.push(`Too few tags (${tags.length}, need ${this.criteria.tags.minCount}+)`);
      score -= 20;
    } else if (tags.length > this.criteria.tags.maxCount) {
      issues.push(`Too many tags (${tags.length}, max ${this.criteria.tags.maxCount})`);
      score -= 10;
    }

    // Keyword relevance
    const relevance = this.calculateTagRelevance(tags, category);
    if (relevance < this.criteria.tags.keywordRelevance) {
      issues.push(`Low tag relevance (${Math.round(relevance * 100)}%, need ${Math.round(this.criteria.tags.keywordRelevance * 100)}%+)`);
      score -= 15;
    }

    // Uniqueness
    const uniqueness = this.calculateTagUniqueness(tags);
    if (uniqueness < this.criteria.tags.uniqueness) {
      issues.push(`Low tag uniqueness (${Math.round(uniqueness * 100)}%, need ${Math.round(this.criteria.tags.uniqueness * 100)}%+)`);
      score -= 10;
    }

    // Length optimization
    const avgLength = tags.reduce((sum, tag) => sum + tag.length, 0) / tags.length;
    if (avgLength > this.criteria.tags.length) {
      issues.push(`Tags too long (avg ${avgLength.toFixed(1)} chars, max ${this.criteria.tags.length})`);
      score -= 10;
    }

    // Long-tail keywords
    const hasLongTail = this.hasLongTailKeywords(tags);
    if (!hasLongTail) {
      issues.push('Missing long-tail keywords');
      score -= 10;
    }

    // Brand tags
    const hasBrandTags = this.hasBrandTags(tags);
    if (!hasBrandTags) {
      issues.push('Missing brand/shop tags');
      score -= 5;
    }

    score = Math.max(0, score);
    const grade = this.scoreToGrade(score);

    let feedback = '';
    if (score >= 90) {
      feedback = 'Excellent tag strategy! Well-optimized for search.';
    } else if (score >= 80) {
      feedback = 'Good tags with room for minor improvements.';
    } else if (score >= 70) {
      feedback = 'Tags need optimization for better discoverability.';
    } else {
      feedback = 'Tag strategy requires significant improvement.';
    }

    return {
      grade,
      score,
      maxScore,
      feedback,
      issues
    };
  }

  // Grade images
  private gradeImages(images: { url: string; altText?: string }[]): GradeBreakdown {
    const issues: string[] = [];
    let score = 100;
    const maxScore = 100;

    // Count check
    if (images.length < this.criteria.images.minCount) {
      issues.push(`Too few images (${images.length}, need ${this.criteria.images.minCount}+)`);
      score -= 25;
    } else if (images.length > this.criteria.images.maxCount) {
      issues.push(`Too many images (${images.length}, max ${this.criteria.images.maxCount})`);
      score -= 5;
    }

    // Alt text
    const hasAltText = images.some(img => img.altText && img.altText.trim().length > 0);
    if (!hasAltText && this.criteria.images.altText) {
      issues.push('Missing alt text on images');
      score -= 20;
    }

    // Image variety (would need actual image analysis)
    const hasVariety = this.checkImageVariety(images);
    if (!hasVariety && this.criteria.images.variety) {
      issues.push('Images lack variety (add different angles/styles)');
      score -= 10;
    }

    // Quality assessment (would need actual image analysis)
    const hasQuality = this.checkImageQuality(images);
    if (!hasQuality && this.criteria.images.quality) {
      issues.push('Image quality could be improved');
      score -= 15;
    }

    score = Math.max(0, score);
    const grade = this.scoreToGrade(score);

    let feedback = '';
    if (score >= 90) {
      feedback = 'Excellent image strategy! High-quality and well-optimized.';
    } else if (score >= 80) {
      feedback = 'Good images with minor areas for improvement.';
    } else if (score >= 70) {
      feedback = 'Images need optimization for better conversion.';
    } else {
      feedback = 'Image strategy requires significant improvement.';
    }

    return {
      grade,
      score,
      maxScore,
      feedback,
      issues
    };
  }

  // Grade pricing
  private gradePricing(price: number, category: string): GradeBreakdown {
    const issues: string[] = [];
    let score = 100;
    const maxScore = 100;

    // Psychological pricing
    const isPsychological = this.isPsychologicalPricing(price);
    if (!isPsychological && this.criteria.pricing.psychological) {
      issues.push('Price not using psychological pricing ($19.99 vs $20)');
      score -= 10;
    }

    // Competitive pricing (would need competitor data)
    const isCompetitive = this.isCompetitivePricing(price, category);
    if (!isCompetitive && this.criteria.pricing.competitive) {
      issues.push('Price may not be competitive in category');
      score -= 15;
    }

    // Free shipping threshold
    const hasFreeShipping = this.hasFreeShippingThreshold(price);
    if (!hasFreeShipping && this.criteria.pricing.freeShipping) {
      issues.push('Consider offering free shipping');
      score -= 5;
    }

    score = Math.max(0, score);
    const grade = this.scoreToGrade(score);

    let feedback = '';
    if (score >= 90) {
      feedback = 'Excellent pricing strategy! Well-positioned for conversion.';
    } else if (score >= 80) {
      feedback = 'Good pricing with minor optimization opportunities.';
    } else if (score >= 70) {
      feedback = 'Pricing needs optimization for better conversion.';
    } else {
      feedback = 'Pricing strategy requires significant improvement.';
    }

    return {
      grade,
      score,
      maxScore,
      feedback,
      issues
    };
  }

  // Grade engagement
  private gradeEngagement(reviews: { count: number; average: number }, favorites: number, views: number): GradeBreakdown {
    const issues: string[] = [];
    let score = 100;
    const maxScore = 100;

    // Review count
    if (reviews.count < 10) {
      issues.push(`Low review count (${reviews.count}, aim for 10+)`);
      score -= 20;
    }

    // Review rating
    if (reviews.average < 4.5) {
      issues.push(`Low average rating (${reviews.average.toFixed(1)}, aim for 4.5+)`);
      score -= 15;
    }

    // Favorites
    if (favorites < 50) {
      issues.push(`Low favorites count (${favorites}, aim for 50+)`);
      score -= 10;
    }

    // Conversion rate
    if (views > 0) {
      const conversionRate = (reviews.count / views) * 100;
      if (conversionRate < 2) {
        issues.push(`Low conversion rate (${conversionRate.toFixed(1)}%, aim for 2%+)`);
        score -= 15;
      }
    }

    score = Math.max(0, score);
    const grade = this.scoreToGrade(score);

    let feedback = '';
    if (score >= 90) {
      feedback = 'Excellent engagement! Strong social proof and conversion.';
    } else if (score >= 80) {
      feedback = 'Good engagement with room for improvement.';
    } else if (score >= 70) {
      feedback = 'Engagement needs improvement for better performance.';
    } else {
      feedback = 'Engagement strategy requires significant improvement.';
    }

    return {
      grade,
      score,
      maxScore,
      feedback,
      issues
    };
  }

  // Calculate overall score
  private calculateOverallScore(breakdown: any): number {
    const weights = {
      title: 0.2,
      description: 0.25,
      tags: 0.2,
      images: 0.15,
      pricing: 0.1,
      engagement: 0.1
    };

    let totalScore = 0;
    for (const [category, weight] of Object.entries(weights)) {
      totalScore += breakdown[category].score * weight;
    }

    return Math.round(totalScore);
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

  // Helper methods
  private calculateKeywordDensity(text: string, keywords: string[]): number {
    const words = text.toLowerCase().split(/\s+/);
    const totalWords = words.length;
    let keywordCount = 0;

    keywords.forEach(keyword => {
      const keywordWords = keyword.toLowerCase().split(/\s+/);
      for (let i = 0; i <= words.length - keywordWords.length; i++) {
        if (words.slice(i, i + keywordWords.length).join(' ') === keywordWords.join(' ')) {
          keywordCount++;
        }
      }
    });

    return totalWords > 0 ? keywordCount / totalWords : 0;
  }

  private hasEmotionalWords(text: string): boolean {
    const emotionalWords = ['beautiful', 'stunning', 'amazing', 'perfect', 'lovely', 'gorgeous', 'unique', 'handmade', 'artisan'];
    return emotionalWords.some(word => text.toLowerCase().includes(word));
  }

  private hasBrandWords(text: string): boolean {
    // This would check for shop name or brand
    return text.length > 0; // Simplified for now
  }

  private hasGoodFormatting(text: string): boolean {
    return text.includes('\n') || text.includes('•') || text.includes('-') || text.includes('*');
  }

  private hasCallToAction(text: string): boolean {
    const ctaWords = ['buy', 'order', 'shop', 'get', 'grab', 'purchase'];
    return ctaWords.some(word => text.toLowerCase().includes(word));
  }

  private hasFeatureList(text: string): boolean {
    return text.includes('•') || text.includes('-') || text.includes('✓') || text.includes('✓');
  }

  private calculateTagRelevance(tags: string[], category: string): number {
    // Simplified relevance calculation
    return Math.min(1, tags.length / 10);
  }

  private calculateTagUniqueness(tags: string[]): number {
    // Simplified uniqueness calculation
    const uniqueTags = new Set(tags.map(tag => tag.toLowerCase()));
    return uniqueTags.size / tags.length;
  }

  private hasLongTailKeywords(tags: string[]): boolean {
    return tags.some(tag => tag.split(' ').length >= 2);
  }

  private hasBrandTags(tags: string[]): boolean {
    // Simplified brand tag check
    return tags.length > 0;
  }

  private checkImageVariety(images: any[]): boolean {
    // Simplified variety check
    return images.length >= 3;
  }

  private checkImageQuality(images: any[]): boolean {
    // Simplified quality check
    return images.length > 0;
  }

  private isPsychologicalPricing(price: number): boolean {
    const priceStr = price.toString();
    return priceStr.endsWith('99') || priceStr.endsWith('95');
  }

  private isCompetitivePricing(price: number, category: string): boolean {
    // Simplified competitive check
    return price > 0 && price < 1000;
  }

  private hasFreeShippingThreshold(price: number): boolean {
    // Simplified free shipping check
    return price >= 35;
  }

  // Identify SEO issues
  private identifyIssues(breakdown: any, listingData: ListingData): SEOIssue[] {
    const issues: SEOIssue[] = [];

    Object.entries(breakdown).forEach(([category, grade]: [string, any]) => {
      grade.issues.forEach((issue: string) => {
        issues.push({
          category: category as any,
          severity: grade.score < 70 ? 'high' : grade.score < 80 ? 'medium' : 'low',
          issue: issue,
          description: issue,
          fix: this.getFixForIssue(issue, category),
          impact: this.getImpactForIssue(issue, category)
        });
      });
    });

    return issues;
  }

  // Generate improvements
  private generateImprovements(breakdown: any, listingData: ListingData): SEOImprovement[] {
    const improvements: SEOImprovement[] = [];

    Object.entries(breakdown).forEach(([category, grade]: [string, any]) => {
      if (grade.score < 90) {
        improvements.push({
          category: category as any,
          priority: grade.score < 70 ? 'high' : grade.score < 80 ? 'medium' : 'low',
          suggestion: this.getImprovementSuggestion(category, grade.score),
          description: grade.feedback,
          expectedImprovement: this.getExpectedImprovement(category),
          effort: this.getEffortLevel(category)
        });
      }
    });

    return improvements;
  }

  // Helper methods for issues and improvements
  private getFixForIssue(issue: string, category: string): string {
    // Simplified fix suggestions
    const fixes: Record<string, string> = {
      'title': 'Optimize title length and include relevant keywords',
      'description': 'Improve description formatting and add more details',
      'tags': 'Add more relevant and unique tags',
      'images': 'Add more high-quality images with alt text',
      'pricing': 'Adjust pricing strategy for better conversion',
      'engagement': 'Focus on improving customer experience and reviews'
    };
    return fixes[category] || 'Review and optimize this aspect';
  }

  private getImpactForIssue(issue: string, category: string): string {
    const impacts: Record<string, string> = {
      'title': 'High - Affects search visibility and click-through rates',
      'description': 'High - Affects conversion rates and customer understanding',
      'tags': 'Medium - Affects search discoverability',
      'images': 'Medium - Affects visual appeal and conversion',
      'pricing': 'High - Directly affects sales conversion',
      'engagement': 'Medium - Affects trust and social proof'
    };
    return impacts[category] || 'Medium impact on overall performance';
  }

  private getImprovementSuggestion(category: string, score: number): string {
    const suggestions: Record<string, string> = {
      'title': 'Optimize title for better search visibility',
      'description': 'Enhance description for improved conversion',
      'tags': 'Improve tag strategy for better discoverability',
      'images': 'Upgrade image quality and variety',
      'pricing': 'Refine pricing strategy for better conversion',
      'engagement': 'Focus on improving customer engagement'
    };
    return suggestions[category] || 'General optimization needed';
  }

  private getExpectedImprovement(category: string): string {
    const improvements: Record<string, string> = {
      'title': '10-20% increase in search visibility',
      'description': '15-25% improvement in conversion rate',
      'tags': '5-15% increase in organic traffic',
      'images': '10-20% improvement in engagement',
      'pricing': '5-15% increase in conversion rate',
      'engagement': '10-20% improvement in customer satisfaction'
    };
    return improvements[category] || 'Moderate improvement expected';
  }

  private getEffortLevel(category: string): 'low' | 'medium' | 'high' {
    const efforts: Record<string, 'low' | 'medium' | 'high'> = {
      'title': 'low',
      'description': 'medium',
      'tags': 'low',
      'images': 'high',
      'pricing': 'medium',
      'engagement': 'high'
    };
    return efforts[category] || 'medium';
  }

  // Save grade to history
  async saveGradeToHistory(listingId: number, grade: SEOGrade): Promise<boolean> {
    try {
      // This would save to database
      console.log(`Saving grade for listing ${listingId}: ${grade.overall}`);
      return true;
    } catch (error) {
      console.error('Error saving grade to history:', error);
      return false;
    }
  }

  // Get grade history
  async getGradeHistory(listingId: number): Promise<SEOGradeHistory[]> {
    try {
      // This would fetch from database
      return [];
    } catch (error) {
      console.error('Error fetching grade history:', error);
      return [];
    }
  }

  // Bulk grade multiple listings
  async bulkGradeListings(listings: ListingData[]): Promise<Map<number, SEOGrade>> {
    const results = new Map<number, SEOGrade>();
    
    for (const listing of listings) {
      try {
        const grade = await this.gradeListing(listing);
        results.set(listing.listingId, grade);
      } catch (error) {
        console.error(`Error grading listing ${listing.listingId}:`, error);
      }
    }
    
    return results;
  }
}

// Default SEO grader instance
let seoGrader: SEOGrader | null = null;

export function getSEOGrader(): SEOGrader {
  if (!seoGrader) {
    seoGrader = new SEOGrader();
  }
  return seoGrader;
}

export default SEOGrader;

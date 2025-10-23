/**
 * Photo Quality Analyzer using GPT-4o Vision
 */

import OpenAI from 'openai';
import { logger } from '@/lib/logger';

export interface PhotoQualityAnalysis {
  overallScore: number; // 0-100
  lighting: {
    score: number;
    issues: string[];
    suggestions: string[];
  };
  background: {
    score: number;
    issues: string[];
    suggestions: string[];
  };
  composition: {
    score: number;
    issues: string[];
    suggestions: string[];
  };
  productVisibility: {
    score: number;
    issues: string[];
    suggestions: string[];
  };
  technicalQuality: {
    score: number;
    issues: string[];
    suggestions: string[];
  };
  ecommerceOptimization: {
    score: number;
    issues: string[];
    suggestions: string[];
  };
  specificRecommendations: string[];
  priorityActions: string[];
  estimatedImpact: 'low' | 'medium' | 'high';
}

export class PhotoQualityAnalyzer {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Analyze photo quality for Etsy listings
   */
  async analyzePhoto(imageUrl: string, productDescription?: string): Promise<PhotoQualityAnalysis> {
    try {
      const prompt = this.buildAnalysisPrompt(productDescription);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert e-commerce photographer and visual merchandiser specializing in Etsy listings. Analyze product photos for quality, lighting, composition, and e-commerce optimization.',
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                  detail: 'high',
                },
              },
            ],
          },
        ],
        response_format: {
          type: 'json_object',
        },
        max_tokens: 2000,
        temperature: 0.3,
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      
      // Validate and enhance the analysis
      const enhancedAnalysis = this.enhanceAnalysis(analysis, imageUrl);
      
      logger.info('Photo quality analysis completed', {
        imageUrl: imageUrl.substring(0, 100) + '...',
        overallScore: enhancedAnalysis.overallScore,
        estimatedImpact: enhancedAnalysis.estimatedImpact,
      });

      return enhancedAnalysis;
    } catch (error) {
      logger.error('Photo quality analysis failed', { imageUrl, error });
      
      // Return fallback analysis
      return this.getFallbackAnalysis();
    }
  }

  /**
   * Analyze multiple photos for a listing
   */
  async analyzeListingPhotos(
    imageUrls: string[], 
    productDescription?: string
  ): Promise<{
    individualAnalyses: PhotoQualityAnalysis[];
    overallListingScore: number;
    recommendations: string[];
    bestPhotoIndex: number;
    worstPhotoIndex: number;
  }> {
    try {
      const individualAnalyses = await Promise.all(
        imageUrls.map(url => this.analyzePhoto(url, productDescription))
      );

      const overallListingScore = this.calculateOverallListingScore(individualAnalyses);
      const bestPhotoIndex = this.findBestPhotoIndex(individualAnalyses);
      const worstPhotoIndex = this.findWorstPhotoIndex(individualAnalyses);
      const recommendations = this.generateListingRecommendations(individualAnalyses);

      return {
        individualAnalyses,
        overallListingScore,
        recommendations,
        bestPhotoIndex,
        worstPhotoIndex,
      };
    } catch (error) {
      logger.error('Listing photo analysis failed', { error });
      throw error;
    }
  }

  /**
   * Get quick quality score for multiple photos
   */
  async getQuickQualityScores(imageUrls: string[]): Promise<number[]> {
    try {
      const scores = await Promise.all(
        imageUrls.map(async (url) => {
          try {
            const analysis = await this.analyzePhoto(url);
            return analysis.overallScore;
          } catch (error) {
            logger.warn('Quick quality score failed for image', { url, error });
            return 50; // Default score
          }
        })
      );

      return scores;
    } catch (error) {
      logger.error('Quick quality scores failed', { error });
      return imageUrls.map(() => 50); // Default scores
    }
  }

  private buildAnalysisPrompt(productDescription?: string): string {
    const basePrompt = `
Analyze this product photo for e-commerce quality. Focus on:

1. LIGHTING (0-100):
   - Even, natural lighting without harsh shadows
   - Proper exposure and brightness
   - No overexposed or underexposed areas
   - Color accuracy

2. BACKGROUND (0-100):
   - Clean, uncluttered background
   - Appropriate color contrast with product
   - Professional appearance
   - No distracting elements

3. COMPOSITION (0-100):
   - Product is centered and well-framed
   - Appropriate cropping and spacing
   - Good use of negative space
   - Product fills frame appropriately

4. PRODUCT VISIBILITY (0-100):
   - Product is clearly visible and identifiable
   - All important details are shown
   - Good depth of field
   - Product stands out from background

5. TECHNICAL QUALITY (0-100):
   - Sharp focus and clarity
   - Good resolution and detail
   - Proper aspect ratio for e-commerce
   - No blur, noise, or artifacts

6. ECOMMERCE OPTIMIZATION (0-100):
   - Suitable for Etsy marketplace
   - Shows product in best light for sales
   - Appeals to target customers
   - Professional and trustworthy appearance

For each category, provide:
- score: 0-100 rating
- issues: array of specific problems found
- suggestions: array of specific improvements

Also provide:
- overallScore: weighted average of all categories
- specificRecommendations: top 5 actionable improvements
- priorityActions: top 3 most important fixes
- estimatedImpact: "low", "medium", or "high" based on potential sales impact

Return as JSON with this exact structure:
{
  "lighting": {"score": 85, "issues": [], "suggestions": []},
  "background": {"score": 90, "issues": [], "suggestions": []},
  "composition": {"score": 80, "issues": [], "suggestions": []},
  "productVisibility": {"score": 75, "issues": [], "suggestions": []},
  "technicalQuality": {"score": 88, "issues": [], "suggestions": []},
  "ecommerceOptimization": {"score": 82, "issues": [], "suggestions": []},
  "overallScore": 83,
  "specificRecommendations": [],
  "priorityActions": [],
  "estimatedImpact": "medium"
}`;

    if (productDescription) {
      return `${basePrompt}\n\nProduct Description: ${productDescription}`;
    }

    return basePrompt;
  }

  private enhanceAnalysis(analysis: any, imageUrl: string): PhotoQualityAnalysis {
    // Ensure all required fields exist with defaults
    const enhanced: PhotoQualityAnalysis = {
      overallScore: Math.max(0, Math.min(100, analysis.overallScore || 50)),
      lighting: {
        score: Math.max(0, Math.min(100, analysis.lighting?.score || 50)),
        issues: Array.isArray(analysis.lighting?.issues) ? analysis.lighting.issues : [],
        suggestions: Array.isArray(analysis.lighting?.suggestions) ? analysis.lighting.suggestions : [],
      },
      background: {
        score: Math.max(0, Math.min(100, analysis.background?.score || 50)),
        issues: Array.isArray(analysis.background?.issues) ? analysis.background.issues : [],
        suggestions: Array.isArray(analysis.background?.suggestions) ? analysis.background.suggestions : [],
      },
      composition: {
        score: Math.max(0, Math.min(100, analysis.composition?.score || 50)),
        issues: Array.isArray(analysis.composition?.issues) ? analysis.composition.issues : [],
        suggestions: Array.isArray(analysis.composition?.suggestions) ? analysis.composition.suggestions : [],
      },
      productVisibility: {
        score: Math.max(0, Math.min(100, analysis.productVisibility?.score || 50)),
        issues: Array.isArray(analysis.productVisibility?.issues) ? analysis.productVisibility.issues : [],
        suggestions: Array.isArray(analysis.productVisibility?.suggestions) ? analysis.productVisibility.suggestions : [],
      },
      technicalQuality: {
        score: Math.max(0, Math.min(100, analysis.technicalQuality?.score || 50)),
        issues: Array.isArray(analysis.technicalQuality?.issues) ? analysis.technicalQuality.issues : [],
        suggestions: Array.isArray(analysis.technicalQuality?.suggestions) ? analysis.technicalQuality.suggestions : [],
      },
      ecommerceOptimization: {
        score: Math.max(0, Math.min(100, analysis.ecommerceOptimization?.score || 50)),
        issues: Array.isArray(analysis.ecommerceOptimization?.issues) ? analysis.ecommerceOptimization.issues : [],
        suggestions: Array.isArray(analysis.ecommerceOptimization?.suggestions) ? analysis.ecommerceOptimization.suggestions : [],
      },
      specificRecommendations: Array.isArray(analysis.specificRecommendations) 
        ? analysis.specificRecommendations.slice(0, 5) 
        : [],
      priorityActions: Array.isArray(analysis.priorityActions) 
        ? analysis.priorityActions.slice(0, 3) 
        : [],
      estimatedImpact: ['low', 'medium', 'high'].includes(analysis.estimatedImpact) 
        ? analysis.estimatedImpact 
        : 'medium',
    };

    // Recalculate overall score if needed
    if (!analysis.overallScore) {
      enhanced.overallScore = this.calculateOverallScore(enhanced);
    }

    return enhanced;
  }

  private calculateOverallScore(analysis: PhotoQualityAnalysis): number {
    const weights = {
      lighting: 0.20,
      background: 0.15,
      composition: 0.20,
      productVisibility: 0.25,
      technicalQuality: 0.10,
      ecommerceOptimization: 0.10,
    };

    return Math.round(
      analysis.lighting.score * weights.lighting +
      analysis.background.score * weights.background +
      analysis.composition.score * weights.composition +
      analysis.productVisibility.score * weights.productVisibility +
      analysis.technicalQuality.score * weights.technicalQuality +
      analysis.ecommerceOptimization.score * weights.ecommerceOptimization
    );
  }

  private calculateOverallListingScore(analyses: PhotoQualityAnalysis[]): number {
    if (analyses.length === 0) return 0;
    
    // Weight the first photo more heavily (main photo)
    const weights = analyses.map((_, index) => index === 0 ? 0.5 : 0.5 / (analyses.length - 1));
    
    return Math.round(
      analyses.reduce((sum, analysis, index) => 
        sum + (analysis.overallScore * weights[index]), 0
      )
    );
  }

  private findBestPhotoIndex(analyses: PhotoQualityAnalysis[]): number {
    if (analyses.length === 0) return -1;
    
    let bestIndex = 0;
    let bestScore = analyses[0].overallScore;
    
    for (let i = 1; i < analyses.length; i++) {
      if (analyses[i].overallScore > bestScore) {
        bestScore = analyses[i].overallScore;
        bestIndex = i;
      }
    }
    
    return bestIndex;
  }

  private findWorstPhotoIndex(analyses: PhotoQualityAnalysis[]): number {
    if (analyses.length === 0) return -1;
    
    let worstIndex = 0;
    let worstScore = analyses[0].overallScore;
    
    for (let i = 1; i < analyses.length; i++) {
      if (analyses[i].overallScore < worstScore) {
        worstScore = analyses[i].overallScore;
        worstIndex = i;
      }
    }
    
    return worstIndex;
  }

  private generateListingRecommendations(analyses: PhotoQualityAnalysis[]): string[] {
    const recommendations = new Set<string>();
    
    // Collect common issues across all photos
    const commonIssues = new Map<string, number>();
    
    analyses.forEach(analysis => {
      Object.values(analysis).forEach(category => {
        if (typeof category === 'object' && category.issues) {
          category.issues.forEach((issue: any) => {
            commonIssues.set(issue, (commonIssues.get(issue) || 0) + 1);
          });
        }
      });
    });
    
    // Get top common issues
    const sortedIssues = Array.from(commonIssues.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
    
    sortedIssues.forEach(([issue, count]) => {
      if (count > analyses.length / 2) { // Issue appears in more than half the photos
        recommendations.add(`Fix "${issue}" across multiple photos`);
      }
    });
    
    // Add general recommendations based on overall scores
    const overallScore = this.calculateOverallListingScore(analyses);
    
    if (overallScore < 60) {
      recommendations.add('Overall photo quality needs significant improvement');
    } else if (overallScore < 80) {
      recommendations.add('Photo quality is good but has room for improvement');
    }
    
    return Array.from(recommendations).slice(0, 5);
  }

  private getFallbackAnalysis(): PhotoQualityAnalysis {
    return {
      overallScore: 50,
      lighting: {
        score: 50,
        issues: ['Unable to analyze - check image URL'],
        suggestions: ['Ensure image is accessible and properly formatted'],
      },
      background: {
        score: 50,
        issues: ['Unable to analyze - check image URL'],
        suggestions: ['Ensure image is accessible and properly formatted'],
      },
      composition: {
        score: 50,
        issues: ['Unable to analyze - check image URL'],
        suggestions: ['Ensure image is accessible and properly formatted'],
      },
      productVisibility: {
        score: 50,
        issues: ['Unable to analyze - check image URL'],
        suggestions: ['Ensure image is accessible and properly formatted'],
      },
      technicalQuality: {
        score: 50,
        issues: ['Unable to analyze - check image URL'],
        suggestions: ['Ensure image is accessible and properly formatted'],
      },
      ecommerceOptimization: {
        score: 50,
        issues: ['Unable to analyze - check image URL'],
        suggestions: ['Ensure image is accessible and properly formatted'],
      },
      specificRecommendations: [
        'Check that the image URL is accessible',
        'Ensure the image is in a supported format (JPG, PNG)',
        'Verify the image is not too large or corrupted',
      ],
      priorityActions: [
        'Fix image accessibility issues',
        'Retry analysis with a working image URL',
      ],
      estimatedImpact: 'medium',
    };
  }
}

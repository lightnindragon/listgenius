import { logger } from '@/lib/logger';

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  variables: string[];
  template: string;
  examples: Array<{
    input: Record<string, any>;
    output: string;
  }>;
  performance: {
    successRate: number;
    averageTokens: number;
    averageCost: number;
  };
}

export interface PromptDecision {
  template: PromptTemplate;
  confidence: number;
  reasoning: string;
  expectedTokens: number;
  expectedCost: number;
}

export interface PromptOptimization {
  originalPrompt: string;
  optimizedPrompt: string;
  improvements: string[];
  tokenReduction: number;
  costReduction: number;
  qualityScore: number;
}

export interface PromptChain {
  id: string;
  name: string;
  steps: Array<{
    stepId: string;
    template: string;
    dependencies: string[];
    outputFormat: string;
  }>;
  totalTokens: number;
  totalCost: number;
  successRate: number;
}

export class AdvancedPromptEngineering {
  private templates: Map<string, PromptTemplate> = new Map();
  private chains: Map<string, PromptChain> = new Map();

  constructor() {
    this.initializeTemplates();
    this.initializeChains();
    logger.info('AdvancedPromptEngineering initialized');
  }

  /**
   * Initialize prompt templates
   */
  private initializeTemplates(): void {
    // Listing Generation Templates
    this.templates.set('listing_generation_basic', {
      id: 'listing_generation_basic',
      name: 'Basic Listing Generation',
      description: 'Generate a basic Etsy listing with title, description, and tags',
      category: 'listing_generation',
      variables: ['product_name', 'category', 'price', 'materials', 'style'],
      template: `Create an optimized Etsy listing for a {product_name} in the {category} category.

Product Details:
- Name: {product_name}
- Category: {category}
- Price: {price}
- Materials: {materials}
- Style: {style}

Requirements:
1. Title: Catchy, SEO-optimized title under 140 characters
2. Description: 250-600 words, engaging, includes key features and benefits
3. Tags: 13 relevant tags under 20 characters each
4. Tone: {tone}

Focus on:
- Emotional appeal and storytelling
- SEO optimization with long-tail keywords
- Clear value proposition
- Call-to-action for purchase

Return in JSON format with title, description, tags, and reasoning.`,
      examples: [
        {
          input: {
            product_name: 'Handmade Ceramic Mug',
            category: 'Home & Living',
            price: '$24.99',
            materials: 'Stoneware clay, food-safe glaze',
            style: 'Modern minimalist'
          },
          output: '{"title": "Handmade Ceramic Mug - Modern Minimalist - Food Safe Stoneware", "description": "Each mug is handcrafted...", "tags": ["handmade", "ceramic", "mug", "stoneware"]}'
        }
      ],
      performance: {
        successRate: 0.92,
        averageTokens: 450,
        averageCost: 0.0135
      }
    });

    this.templates.set('listing_optimization', {
      id: 'listing_optimization',
      name: 'Listing Optimization',
      description: 'Optimize existing listing for better performance',
      category: 'listing_optimization',
      variables: ['current_title', 'current_description', 'current_tags', 'performance_data', 'competitor_data'],
      template: `Optimize this Etsy listing for maximum visibility and sales:

Current Listing:
- Title: {current_title}
- Description: {current_description}
- Tags: {current_tags}

Performance Data: {performance_data}
Competitor Analysis: {competitor_data}

Optimization Goals:
1. Improve SEO ranking
2. Increase click-through rate
3. Boost conversion rate
4. Enhance emotional appeal

Provide optimized version with:
- New title (explain changes)
- Enhanced description (highlight improvements)
- Better tags (explain strategy)
- Reasoning for each change
- Expected impact on performance

Return in JSON format with optimized listing and detailed reasoning.`,
      examples: [],
      performance: {
        successRate: 0.88,
        averageTokens: 650,
        averageCost: 0.0195
      }
    });

    // Keyword Research Templates
    this.templates.set('keyword_research', {
      id: 'keyword_research',
      name: 'Keyword Research',
      description: 'Generate relevant keywords for Etsy listings',
      category: 'keyword_research',
      variables: ['product', 'category', 'target_audience', 'niche'],
      template: `Generate comprehensive keyword research for Etsy listing optimization:

Product: {product}
Category: {category}
Target Audience: {target_audience}
Niche: {niche}

Provide:
1. Primary keywords (3-5 main keywords)
2. Long-tail keywords (10-15 specific phrases)
3. LSI keywords (5-10 semantically related)
4. Trending keywords (5 current trends)
5. Seasonal keywords (5 seasonal variations)
6. Competitor keywords (5 from top competitors)
7. Search intent analysis for each keyword

For each keyword, include:
- Search volume estimate
- Competition level (low/medium/high)
- Opportunity score (1-10)
- Best use case (title/description/tags)

Return in JSON format with categorized keywords and analysis.`,
      examples: [],
      performance: {
        successRate: 0.94,
        averageTokens: 800,
        averageCost: 0.024
      }
    });

    // Competitor Analysis Templates
    this.templates.set('competitor_analysis', {
      id: 'competitor_analysis',
      name: 'Competitor Analysis',
      description: 'Analyze competitor strategies and identify opportunities',
      category: 'competitor_analysis',
      variables: ['competitors', 'market_data', 'our_listings'],
      template: `Perform comprehensive competitor analysis for Etsy market positioning:

Competitors: {competitors}
Market Data: {market_data}
Our Listings: {our_listings}

Analyze:
1. Competitor strengths and weaknesses
2. Pricing strategies and positioning
3. Content and marketing approaches
4. Product gaps and opportunities
5. Market share and trends
6. Customer review patterns

Provide:
- SWOT analysis for each competitor
- Market positioning map
- Opportunity gaps to exploit
- Competitive advantages to leverage
- Pricing recommendations
- Content strategy suggestions

Return in JSON format with detailed analysis and actionable recommendations.`,
      examples: [],
      performance: {
        successRate: 0.89,
        averageTokens: 1200,
        averageCost: 0.036
      }
    });

    // Image Analysis Templates
    this.templates.set('image_analysis', {
      id: 'image_analysis',
      name: 'Image Analysis',
      description: 'Analyze listing images for optimization opportunities',
      category: 'image_analysis',
      variables: ['image_url', 'product_type', 'current_performance'],
      template: `Analyze this Etsy listing image for optimization opportunities:

Image URL: {image_url}
Product Type: {product_type}
Current Performance: {current_performance}

Evaluate:
1. Image quality (brightness, contrast, sharpness, composition)
2. Product presentation (angles, lighting, styling)
3. Background and context
4. Color palette and mood
5. Brand consistency
6. Emotional appeal
7. Conversion potential

Provide:
- Quality score (1-10) with breakdown
- Specific improvement recommendations
- Suggested alternative approaches
- Technical optimization tips
- A/B testing suggestions

Return in JSON format with detailed analysis and actionable recommendations.`,
      examples: [],
      performance: {
        successRate: 0.91,
        averageTokens: 600,
        averageCost: 0.018
      }
    });
  }

  /**
   * Initialize prompt chains
   */
  private initializeChains(): void {
    // Complete Listing Optimization Chain
    this.chains.set('complete_listing_optimization', {
      id: 'complete_listing_optimization',
      name: 'Complete Listing Optimization',
      steps: [
        {
          stepId: 'keyword_research',
          template: 'keyword_research',
          dependencies: [],
          outputFormat: 'keywords'
        },
        {
          stepId: 'competitor_analysis',
          template: 'competitor_analysis',
          dependencies: ['keyword_research'],
          outputFormat: 'competitor_insights'
        },
        {
          stepId: 'listing_generation',
          template: 'listing_generation_basic',
          dependencies: ['keyword_research', 'competitor_analysis'],
          outputFormat: 'optimized_listing'
        },
        {
          stepId: 'image_analysis',
          template: 'image_analysis',
          dependencies: ['listing_generation'],
          outputFormat: 'image_recommendations'
        }
      ],
      totalTokens: 2500,
      totalCost: 0.075,
      successRate: 0.85
    });

    // Market Research Chain
    this.chains.set('market_research', {
      id: 'market_research',
      name: 'Market Research Chain',
      steps: [
        {
          stepId: 'trend_analysis',
          template: 'keyword_research',
          dependencies: [],
          outputFormat: 'trending_keywords'
        },
        {
          stepId: 'competitor_mapping',
          template: 'competitor_analysis',
          dependencies: ['trend_analysis'],
          outputFormat: 'market_map'
        },
        {
          stepId: 'opportunity_identification',
          template: 'competitor_analysis',
          dependencies: ['competitor_mapping'],
          outputFormat: 'opportunities'
        }
      ],
      totalTokens: 1800,
      totalCost: 0.054,
      successRate: 0.87
    });
  }

  /**
   * Select best prompt template for task
   */
  async selectPromptTemplate(
    task: string,
    context: Record<string, any>
  ): Promise<PromptDecision> {
    try {
      const candidates = Array.from(this.templates.values())
        .filter(template => this.isTemplateRelevant(template, task, context));

      if (candidates.length === 0) {
        throw new Error('No suitable prompt template found');
      }

      // Score templates based on relevance and performance
      const scoredTemplates = candidates.map(template => ({
        template,
        score: this.scoreTemplate(template, task, context)
      }));

      scoredTemplates.sort((a, b) => b.score - a.score);
      const bestTemplate = scoredTemplates[0].template;

      return {
        template: bestTemplate,
        confidence: scoredTemplates[0].score,
        reasoning: this.generateSelectionReasoning(bestTemplate, task, context),
        expectedTokens: bestTemplate.performance.averageTokens,
        expectedCost: bestTemplate.performance.averageCost
      };
    } catch (error) {
      logger.error('Failed to select prompt template:', error);
      throw error;
    }
  }

  /**
   * Optimize prompt for efficiency
   */
  async optimizePrompt(
    prompt: string,
    targetTokens?: number,
    targetCost?: number
  ): Promise<PromptOptimization> {
    try {
      // Analyze current prompt
      const analysis = this.analyzePrompt(prompt);
      
      // Generate optimized version
      const optimizedPrompt = this.generateOptimizedPrompt(prompt, analysis);
      
      // Calculate improvements
      const improvements = this.identifyImprovements(prompt, optimizedPrompt);
      
      // Estimate token and cost reduction
      const tokenReduction = this.estimateTokenReduction(prompt, optimizedPrompt);
      const costReduction = tokenReduction * 0.00003; // Approximate cost per token

      return {
        originalPrompt: prompt,
        optimizedPrompt: optimizedPrompt,
        improvements: improvements,
        tokenReduction: tokenReduction,
        costReduction: costReduction,
        qualityScore: this.calculateQualityScore(optimizedPrompt)
      };
    } catch (error) {
      logger.error('Failed to optimize prompt:', error);
      throw error;
    }
  }

  /**
   * Execute prompt chain
   */
  async executePromptChain(
    chainId: string,
    initialInput: Record<string, any>
  ): Promise<{
    results: Record<string, any>;
    totalTokens: number;
    totalCost: number;
    success: boolean;
  }> {
    try {
      const chain = this.chains.get(chainId);
      if (!chain) {
        throw new Error(`Prompt chain ${chainId} not found`);
      }

      const results: Record<string, any> = {};
      let totalTokens = 0;
      let totalCost = 0;
      let success = true;

      // Execute each step in the chain
      for (const step of chain.steps) {
        try {
          // Check dependencies
          const dependenciesMet = step.dependencies.every(dep => results[dep]);
          if (!dependenciesMet) {
            throw new Error(`Dependencies not met for step ${step.stepId}`);
          }

          // Prepare input for this step
          const stepInput = this.prepareStepInput(step, results, initialInput);
          
          // Execute the step
          const stepResult = await this.executePromptStep(step, stepInput);
          
          results[step.stepId] = stepResult.result;
          totalTokens += stepResult.tokens;
          totalCost += stepResult.cost;
          
        } catch (error) {
          logger.error(`Failed to execute step ${step.stepId}:`, error);
          success = false;
          break;
        }
      }

      return {
        results,
        totalTokens,
        totalCost,
        success
      };
    } catch (error) {
      logger.error('Failed to execute prompt chain:', error);
      throw error;
    }
  }

  /**
   * Create custom prompt template
   */
  async createPromptTemplate(
    name: string,
    description: string,
    category: string,
    template: string,
    variables: string[]
  ): Promise<PromptTemplate> {
    try {
      const promptTemplate: PromptTemplate = {
        id: `custom_${Date.now()}`,
        name,
        description,
        category,
        variables,
        template,
        examples: [],
        performance: {
          successRate: 0.8,
          averageTokens: this.estimateTokens(template),
          averageCost: this.estimateTokens(template) * 0.00003
        }
      };

      this.templates.set(promptTemplate.id, promptTemplate);
      
      logger.info(`Created custom prompt template: ${promptTemplate.id}`);
      return promptTemplate;
    } catch (error) {
      logger.error('Failed to create prompt template:', error);
      throw error;
    }
  }

  /**
   * Get prompt performance analytics
   */
  async getPromptAnalytics(templateId?: string): Promise<{
    templates: Array<{
      id: string;
      name: string;
      usage: number;
      successRate: number;
      averageTokens: number;
      averageCost: number;
    }>;
    totalUsage: number;
    totalCost: number;
    averageSuccessRate: number;
  }> {
    try {
      const templates = Array.from(this.templates.values())
        .filter(template => !templateId || template.id === templateId)
        .map(template => ({
          id: template.id,
          name: template.name,
          usage: Math.floor(Math.random() * 1000) + 100, // Mock usage data
          successRate: template.performance.successRate,
          averageTokens: template.performance.averageTokens,
          averageCost: template.performance.averageCost
        }));

      const totalUsage = templates.reduce((sum, template) => sum + template.usage, 0);
      const totalCost = templates.reduce((sum, template) => sum + (template.usage * template.averageCost), 0);
      const averageSuccessRate = templates.reduce((sum, template) => sum + template.successRate, 0) / templates.length;

      return {
        templates,
        totalUsage,
        totalCost,
        averageSuccessRate
      };
    } catch (error) {
      logger.error('Failed to get prompt analytics:', error);
      throw error;
    }
  }

  // Helper methods
  private isTemplateRelevant(template: PromptTemplate, task: string, context: Record<string, any>): boolean {
    // Check if template category matches task
    const taskKeywords = task.toLowerCase().split(' ');
    const categoryKeywords = template.category.toLowerCase().split('_');
    
    return taskKeywords.some(keyword => 
      categoryKeywords.some(catKeyword => catKeyword.includes(keyword))
    );
  }

  private scoreTemplate(template: PromptTemplate, task: string, context: Record<string, any>): number {
    let score = template.performance.successRate * 0.4;
    
    // Add score for variable coverage
    const contextKeys = Object.keys(context);
    const coveredVariables = template.variables.filter(variable => 
      contextKeys.some(key => key.includes(variable.replace(/[{}]/g, '')))
    );
    score += (coveredVariables.length / template.variables.length) * 0.3;
    
    // Add score for performance
    score += (1 - template.performance.averageCost / 0.1) * 0.3;
    
    return score;
  }

  private generateSelectionReasoning(template: PromptTemplate, task: string, context: Record<string, any>): string {
    return `Selected ${template.name} because it has a ${(template.performance.successRate * 100).toFixed(1)}% success rate, covers ${template.variables.length} relevant variables, and is optimized for ${template.category} tasks.`;
  }

  private analyzePrompt(prompt: string): any {
    return {
      length: prompt.length,
      wordCount: prompt.split(' ').length,
      complexity: this.calculateComplexity(prompt),
      redundancy: this.calculateRedundancy(prompt),
      clarity: this.calculateClarity(prompt)
    };
  }

  private generateOptimizedPrompt(originalPrompt: string, analysis: any): string {
    // Mock optimization logic
    let optimized = originalPrompt;
    
    // Remove redundant phrases
    optimized = optimized.replace(/\b(very|really|quite|somewhat|rather)\b/g, '');
    
    // Simplify complex sentences
    optimized = optimized.replace(/([^.!?]+),([^.!?]+),([^.!?]+)/g, '$1 and $2');
    
    // Remove unnecessary words
    optimized = optimized.replace(/\b(the fact that|it is important to note that|in order to)\b/g, '');
    
    return optimized.trim();
  }

  private identifyImprovements(original: string, optimized: string): string[] {
    const improvements = [];
    
    if (optimized.length < original.length * 0.9) {
      improvements.push('Reduced verbosity and redundancy');
    }
    
    if (optimized.split('.').length > original.split('.').length) {
      improvements.push('Improved sentence structure and clarity');
    }
    
    if (this.countComplexWords(optimized) < this.countComplexWords(original)) {
      improvements.push('Simplified language for better comprehension');
    }
    
    return improvements;
  }

  private estimateTokenReduction(original: string, optimized: string): number {
    const originalTokens = this.estimateTokens(original);
    const optimizedTokens = this.estimateTokens(optimized);
    return originalTokens - optimizedTokens;
  }

  private calculateQualityScore(prompt: string): number {
    const analysis = this.analyzePrompt(prompt);
    return (analysis.clarity * 0.4 + (1 - analysis.redundancy) * 0.3 + (1 - analysis.complexity) * 0.3);
  }

  private calculateComplexity(prompt: string): number {
    const sentences = prompt.split(/[.!?]+/).length;
    const words = prompt.split(' ').length;
    const avgWordsPerSentence = words / sentences;
    
    return Math.min(1, avgWordsPerSentence / 20); // Normalize to 0-1
  }

  private calculateRedundancy(prompt: string): number {
    const words = prompt.toLowerCase().split(' ');
    const uniqueWords = new Set(words);
    return 1 - (uniqueWords.size / words.length);
  }

  private calculateClarity(prompt: string): number {
    const complexWords = this.countComplexWords(prompt);
    const totalWords = prompt.split(' ').length;
    return Math.max(0, 1 - (complexWords / totalWords));
  }

  private countComplexWords(prompt: string): number {
    const complexWords = prompt.split(' ').filter(word => 
      word.length > 7 || /[^a-zA-Z\s]/.test(word)
    );
    return complexWords.length;
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.split(' ').length * 1.3); // Rough estimate
  }

  private prepareStepInput(step: any, results: Record<string, any>, initialInput: Record<string, any>): Record<string, any> {
    const stepInput = { ...initialInput };
    
    // Add results from previous steps
    step.dependencies.forEach((dep: string) => {
      if (results[dep]) {
        stepInput[dep] = results[dep];
      }
    });
    
    return stepInput;
  }

  private async executePromptStep(step: any, input: Record<string, any>): Promise<{
    result: any;
    tokens: number;
    cost: number;
  }> {
    // Mock step execution
    const template = this.templates.get(step.template);
    if (!template) {
      throw new Error(`Template ${step.template} not found`);
    }
    
    return {
      result: `Mock result for step ${step.stepId}`,
      tokens: template.performance.averageTokens,
      cost: template.performance.averageCost
    };
  }
}

export const advancedPromptEngineering = new AdvancedPromptEngineering();

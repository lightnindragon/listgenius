/**
 * Blog Automation Service
 * Orchestrates the complete blog automation workflow
 */

import { PrismaClient } from '@prisma/client';
import { BLOG_AUTOMATION_CONFIG } from '@/lib/blog-automation-config';
import { blogTopicManager, TopicPackage } from '@/lib/blog-topic-manager';
import { logger } from '@/lib/logger';

const prisma = new PrismaClient();

export interface WorkflowResult {
  success: boolean;
  postId?: string;
  error?: string;
  steps: WorkflowStep[];
}

export interface WorkflowStep {
  step: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  error?: string;
  data?: any;
}

export class BlogAutomationService {
  private static instance: BlogAutomationService;
  
  private constructor() {}
  
  public static getInstance(): BlogAutomationService {
    if (!BlogAutomationService.instance) {
      BlogAutomationService.instance = new BlogAutomationService();
    }
    return BlogAutomationService.instance;
  }

  /**
   * Check if a post was already published today
   */
  public async hasPostToday(userId: string): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingPost = await prisma.blogPost.findFirst({
      where: {
        userId,
        publishedAt: {
          gte: today,
          lt: tomorrow
        },
        autoPublished: true
      }
    });

    return !!existingPost;
  }

  /**
   * Generate topic package
   */
  public async generateTopic(userId: string): Promise<TopicPackage | null> {
    const step: WorkflowStep = {
      step: 'generate_topic',
      status: 'running',
      startTime: new Date()
    };

    try {
      logger.info('Starting topic generation', { userId });

      // Get trending keywords
      const trendingResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/keywords/live?action=trending&category=etsy&limit=20`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.INTERNAL_API_KEY || 'internal'}`,
          'Content-Type': 'application/json'
        }
      });

      let trendingKeywords: string[] = [];
      
      if (trendingResponse.ok) {
        const trendingData = await trendingResponse.json();
        if (trendingData.success && trendingData.keywords) {
          trendingKeywords = trendingData.keywords.map((item: any) => item.keyword || item.term || item).slice(0, 20);
        }
      }

      // Fallback keywords if API fails
      if (trendingKeywords.length === 0) {
        trendingKeywords = [
          'etsy seo strategies',
          'etsy listing optimization',
          'etsy shop management',
          'etsy marketing tips',
          'etsy keyword research',
          'etsy sales growth',
          'etsy automation tools',
          'etsy seasonal trends',
          'etsy business growth',
          'etsy shop optimization'
        ];
      }

      // Generate topic package
      const topicPackage = await blogTopicManager.generateTopicPackage(trendingKeywords);
      
      step.status = topicPackage ? 'completed' : 'failed';
      step.endTime = new Date();
      step.duration = step.endTime.getTime() - step.startTime.getTime();
      
      if (!topicPackage) {
        step.error = 'No suitable topics found after filtering';
      } else {
        step.data = {
          primaryKeyword: topicPackage.primaryKeyword,
          category: topicPackage.category
        };
      }

      logger.info('Topic generation completed', { 
        userId, 
        success: !!topicPackage,
        primaryKeyword: topicPackage?.primaryKeyword 
      });

      return topicPackage;

    } catch (error) {
      step.status = 'failed';
      step.endTime = new Date();
      step.duration = step.endTime.getTime() - step.startTime.getTime();
      step.error = (error as Error).message;

      logger.error('Topic generation failed', { userId, error });
      return null;
    }
  }

  /**
   * Generate blog content
   */
  public async generateContent(userId: string, topicPackage: TopicPackage): Promise<string | null> {
    const step: WorkflowStep = {
      step: 'generate_content',
      status: 'running',
      startTime: new Date()
    };

    try {
      logger.info('Starting content generation', { userId, primaryKeyword: topicPackage.primaryKeyword });

      const contentResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/blog/automation/generate-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.INTERNAL_API_KEY || 'internal'}`
        },
        body: JSON.stringify({
          primaryKeyword: topicPackage.primaryKeyword,
          secondaryKeywords: topicPackage.secondaryKeywords,
          category: topicPackage.category,
          internalLinkSuggestions: [topicPackage.suggestedListGeniusLink]
        })
      });

      const contentData = await contentResponse.json();
      
      step.status = contentData.success ? 'completed' : 'failed';
      step.endTime = new Date();
      step.duration = step.endTime.getTime() - step.startTime.getTime();
      
      if (!contentData.success) {
        step.error = contentData.error;
        logger.error('Content generation failed', { userId, error: contentData.error });
        return null;
      }

      step.data = {
        postId: contentData.data.postId,
        wordCount: contentData.data.wordCount
      };

      logger.info('Content generation completed', { 
        userId, 
        postId: contentData.data.postId,
        wordCount: contentData.data.wordCount 
      });

      return contentData.data.postId;

    } catch (error) {
      step.status = 'failed';
      step.endTime = new Date();
      step.duration = step.endTime.getTime() - step.startTime.getTime();
      step.error = (error as Error).message;

      logger.error('Content generation failed', { userId, error });
      return null;
    }
  }

  /**
   * Perform quality check
   */
  public async performQualityCheck(userId: string, postId: string): Promise<{ approved: boolean; score: number } | null> {
    const step: WorkflowStep = {
      step: 'quality_check',
      status: 'running',
      startTime: new Date()
    };

    try {
      logger.info('Starting quality check', { userId, postId });

      const qualityResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/blog/automation/quality-check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.INTERNAL_API_KEY || 'internal'}`
        },
        body: JSON.stringify({ postId })
      });

      const qualityData = await qualityResponse.json();
      
      step.status = qualityData.success ? 'completed' : 'failed';
      step.endTime = new Date();
      step.duration = step.endTime.getTime() - step.startTime.getTime();
      
      if (!qualityData.success) {
        step.error = qualityData.error;
        logger.error('Quality check failed', { userId, postId, error: qualityData.error });
        return null;
      }

      step.data = {
        score: qualityData.data.score,
        approved: qualityData.data.approved
      };

      logger.info('Quality check completed', { 
        userId, 
        postId,
        score: qualityData.data.score,
        approved: qualityData.data.approved 
      });

      return {
        approved: qualityData.data.approved,
        score: qualityData.data.score
      };

    } catch (error) {
      step.status = 'failed';
      step.endTime = new Date();
      step.duration = step.endTime.getTime() - step.startTime.getTime();
      step.error = (error as Error).message;

      logger.error('Quality check failed', { userId, postId, error });
      return null;
    }
  }

  /**
   * Revise content if needed
   */
  public async reviseContent(userId: string, postId: string): Promise<boolean> {
    const step: WorkflowStep = {
      step: 'revise_content',
      status: 'running',
      startTime: new Date()
    };

    try {
      logger.info('Starting content revision', { userId, postId });

      const revisionResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/blog/automation/revise-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.INTERNAL_API_KEY || 'internal'}`
        },
        body: JSON.stringify({ postId })
      });

      const revisionData = await revisionResponse.json();
      
      step.status = revisionData.success ? 'completed' : 'failed';
      step.endTime = new Date();
      step.duration = step.endTime.getTime() - step.startTime.getTime();
      
      if (!revisionData.success) {
        step.error = revisionData.error;
        logger.error('Content revision failed', { userId, postId, error: revisionData.error });
        return false;
      }

      step.data = {
        revisionCount: revisionData.data.revisionCount
      };

      logger.info('Content revision completed', { 
        userId, 
        postId,
        revisionCount: revisionData.data.revisionCount 
      });

      return true;

    } catch (error) {
      step.status = 'failed';
      step.endTime = new Date();
      step.duration = step.endTime.getTime() - step.startTime.getTime();
      step.error = (error as Error).message;

      logger.error('Content revision failed', { userId, postId, error });
      return false;
    }
  }

  /**
   * Publish blog post
   */
  public async publishPost(userId: string, postId: string): Promise<{ success: boolean; url?: string }> {
    const step: WorkflowStep = {
      step: 'publish_post',
      status: 'running',
      startTime: new Date()
    };

    try {
      logger.info('Starting post publication', { userId, postId });

      const publishResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/blog/automation/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.INTERNAL_API_KEY || 'internal'}`
        },
        body: JSON.stringify({ postId })
      });

      const publishData = await publishResponse.json();
      
      step.status = publishData.success ? 'completed' : 'failed';
      step.endTime = new Date();
      step.duration = step.endTime.getTime() - step.startTime.getTime();
      
      if (!publishData.success) {
        step.error = publishData.error;
        logger.error('Post publication failed', { userId, postId, error: publishData.error });
        return { success: false };
      }

      step.data = {
        publishedUrl: publishData.data.publishedUrl
      };

      logger.info('Post publication completed', { 
        userId, 
        postId,
        publishedUrl: publishData.data.publishedUrl 
      });

      return { 
        success: true, 
        url: publishData.data.publishedUrl 
      };

    } catch (error) {
      step.status = 'failed';
      step.endTime = new Date();
      step.duration = step.endTime.getTime() - step.startTime.getTime();
      step.error = (error as Error).message;

      logger.error('Post publication failed', { userId, postId, error });
      return { success: false };
    }
  }

  /**
   * Run the complete automation workflow
   */
  public async runWorkflow(userId: string): Promise<WorkflowResult> {
    const startTime = new Date();
    const steps: WorkflowStep[] = [];
    
    logger.info('Starting blog automation workflow', { userId, startTime });

    try {
      // Check if post already published today
      const hasPost = await this.hasPostToday(userId);
      if (hasPost) {
        logger.info('Post already published today, skipping workflow', { userId });
        return {
          success: false,
          error: 'Post already published today',
          steps: [{
            step: 'check_existing',
            status: 'completed',
            startTime,
            endTime: new Date(),
            duration: Date.now() - startTime.getTime(),
            data: { hasExistingPost: true }
          }]
        };
      }

      // Step 1: Generate topic
      const topicPackage = await this.generateTopic(userId);
      if (!topicPackage) {
        return {
          success: false,
          error: 'Failed to generate topic',
          steps
        };
      }

      // Step 2: Generate content
      const postId = await this.generateContent(userId, topicPackage);
      if (!postId) {
        return {
          success: false,
          error: 'Failed to generate content',
          steps
        };
      }

      // Step 3: Quality check and revision loop
      let qualityResult = await this.performQualityCheck(userId, postId);
      if (!qualityResult) {
        return {
          success: false,
          error: 'Failed to perform quality check',
          steps
        };
      }

      let revisionAttempts = 0;
      while (!qualityResult.approved && revisionAttempts < BLOG_AUTOMATION_CONFIG.MAX_REVISION_ATTEMPTS) {
        revisionAttempts++;
        logger.info('Content needs revision', { userId, postId, attempt: revisionAttempts });
        
        const revisionSuccess = await this.reviseContent(userId, postId);
        if (!revisionSuccess) {
          return {
            success: false,
            error: 'Failed to revise content',
            steps
          };
        }

        // Re-check quality
        qualityResult = await this.performQualityCheck(userId, postId);
        if (!qualityResult) {
          return {
            success: false,
            error: 'Failed to re-check quality after revision',
            steps
          };
        }
      }

      // Step 4: Publish or save as draft
      if (qualityResult.approved || revisionAttempts >= BLOG_AUTOMATION_CONFIG.MAX_REVISION_ATTEMPTS) {
        // Update workflow status to approved if not already
        if (!qualityResult.approved) {
          await prisma.blogPost.update({
            where: { id: postId },
            data: { workflowStatus: 'approved' }
          });
        }

        const publishResult = await this.publishPost(userId, postId);
        if (!publishResult.success) {
          return {
            success: false,
            error: 'Failed to publish post',
            steps
          };
        }

        logger.info('Blog automation workflow completed successfully', { 
          userId, 
          postId, 
          publishedUrl: publishResult.url,
          duration: Date.now() - startTime.getTime()
        });

        return {
          success: true,
          postId,
          steps
        };
      } else {
        // Save as draft for manual review
        await prisma.blogPost.update({
          where: { id: postId },
          data: { 
            workflowStatus: 'failed',
            status: 'draft'
          }
        });

        logger.warn('Content quality below threshold, saved as draft', { 
          userId, 
          postId, 
          score: qualityResult.score 
        });

        return {
          success: false,
          error: 'Content quality below threshold, saved as draft for manual review',
          steps
        };
      }

    } catch (error) {
      logger.error('Blog automation workflow failed', { 
        userId, 
        error: (error as Error).message,
        duration: Date.now() - startTime.getTime()
      });

      return {
        success: false,
        error: (error as Error).message,
        steps
      };
    }
  }
}

export const blogAutomationService = BlogAutomationService.getInstance();

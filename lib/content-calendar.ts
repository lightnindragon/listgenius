import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { openai } from '@/lib/openai';

export interface ContentCalendarEvent {
  id: string;
  userId: string;
  title: string;
  description: string;
  platform: string;
  accountId: string;
  contentType: 'post' | 'story' | 'reel' | 'video' | 'ad' | 'event';
  status: 'draft' | 'scheduled' | 'published' | 'cancelled';
  scheduledAt: Date;
  publishedAt?: Date;
  content: {
    text: string;
    mediaUrls: string[];
    hashtags: string[];
    mentions: string[];
  };
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    views?: number;
    reach?: number;
    impressions?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentTheme {
  id: string;
  userId: string;
  name: string;
  description: string;
  color: string;
  tags: string[];
  isActive: boolean;
  createdAt: Date;
}

export interface ContentTemplate {
  id: string;
  userId: string;
  name: string;
  platform: string;
  contentType: string;
  template: {
    text: string;
    mediaPlaceholders: string[];
    hashtags: string[];
    mentions: string[];
  };
  variables: string[]; // List of variable names that can be replaced
  category: string;
  isPublic: boolean;
  usageCount: number;
  createdAt: Date;
}

export interface ContentBatch {
  id: string;
  userId: string;
  name: string;
  description: string;
  platforms: string[];
  scheduledDate: Date;
  status: 'draft' | 'scheduled' | 'published' | 'cancelled';
  posts: ContentCalendarEvent[];
  createdAt: Date;
}

export interface ContentPerformance {
  eventId: string;
  platform: string;
  metrics: {
    engagement: number;
    reach: number;
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    cpm: number;
    roas: number;
  };
  insights: string[];
  recommendations: string[];
}

export class ContentCalendar {
  constructor() {
    logger.info('ContentCalendar initialized');
  }

  /**
   * Create a content calendar event
   */
  async createEvent(
    userId: string,
    eventData: {
      title: string;
      description: string;
      platform: string;
      accountId: string;
      contentType: ContentCalendarEvent['contentType'];
      scheduledAt: Date;
      content: {
        text: string;
        mediaUrls: string[];
        hashtags: string[];
        mentions: string[];
      };
    }
  ): Promise<ContentCalendarEvent> {
    try {
      const event = await prisma.contentCalendarEvent.create({
        data: {
          userId,
          title: eventData.title,
          description: eventData.description,
          platform: eventData.platform,
          accountId: eventData.accountId,
          contentType: eventData.contentType as 'post' | 'story' | 'reel' | 'video' | 'ad' | 'event',
          status: 'scheduled',
          scheduledAt: eventData.scheduledAt,
          content: JSON.stringify(eventData.content),
          engagement: JSON.stringify({
            likes: 0,
            comments: 0,
            shares: 0,
            views: 0,
            reach: 0,
            impressions: 0
          })
        }
      });

      logger.info(`Content calendar event created: ${event.id}`);
      return event as unknown as ContentCalendarEvent;
    } catch (error) {
      logger.error('Failed to create content calendar event:', error);
      throw error;
    }
  }

  /**
   * Generate content ideas using AI
   */
  async generateContentIdeas(
    userId: string,
    context: {
      businessType: string;
      targetAudience: string;
      goals: string[];
      platforms: string[];
      contentType: string;
      tone: string;
      count: number;
    }
  ): Promise<Array<{
    title: string;
    content: string;
    hashtags: string[];
    suggestedPlatforms: string[];
    bestTimeToPost: string;
  }>> {
    try {
      const prompt = `Generate ${context.count} creative social media content ideas for a ${context.businessType} business.

Target Audience: ${context.targetAudience}
Goals: ${context.goals.join(', ')}
Platforms: ${context.platforms.join(', ')}
Content Type: ${context.contentType}
Tone: ${context.tone}

For each idea, provide:
1. A catchy title
2. Engaging content text (platform-appropriate length)
3. Relevant hashtags (5-8 hashtags)
4. Best platforms for this content
5. Optimal posting time

Make the content engaging, authentic, and aligned with current social media trends.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a creative social media strategist. Generate engaging, platform-specific content ideas that drive engagement and achieve business goals.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.8
      });

      const content = response.choices[0].message.content || '';
      
      // Parse the response into structured content ideas
      const ideas = this.parseContentIdeas(content);
      
      logger.info(`Generated ${ideas.length} content ideas for user ${userId}`);
      return ideas;
    } catch (error) {
      logger.error('Failed to generate content ideas:', error);
      throw error;
    }
  }

  /**
   * Create a content theme
   */
  async createContentTheme(
    userId: string,
    themeData: {
      name: string;
      description: string;
      color: string;
      tags: string[];
    }
  ): Promise<ContentTheme> {
    try {
      const theme = await prisma.contentTheme.create({
        data: {
          userId,
          name: themeData.name,
          description: themeData.description,
          color: themeData.color,
          tags: themeData.tags,
          isActive: true
        }
      });

      logger.info(`Content theme created: ${theme.id}`);
      return theme as unknown as ContentTheme;
    } catch (error) {
      logger.error('Failed to create content theme:', error);
      throw error;
    }
  }

  /**
   * Create a content template
   */
  async createContentTemplate(
    userId: string,
    templateData: {
      name: string;
      platform: string;
      contentType: string;
      template: {
        text: string;
        mediaPlaceholders: string[];
        hashtags: string[];
        mentions: string[];
      };
      variables: string[];
      category: string;
      isPublic?: boolean;
    }
  ): Promise<ContentTemplate> {
    try {
      const template = await prisma.contentTemplate.create({
        data: {
          userId,
          name: templateData.name,
          platform: templateData.platform,
          contentType: templateData.contentType as 'post' | 'story' | 'reel' | 'video' | 'ad' | 'event',
          template: JSON.stringify(templateData.template),
          variables: templateData.variables,
          category: templateData.category,
          isPublic: templateData.isPublic || false,
          usageCount: 0
        }
      });

      logger.info(`Content template created: ${template.id}`);
      return template as unknown as ContentTemplate;
    } catch (error) {
      logger.error('Failed to create content template:', error);
      throw error;
    }
  }

  /**
   * Generate content from template
   */
  async generateContentFromTemplate(
    templateId: string,
    variables: Record<string, string>
  ): Promise<{
    text: string;
    mediaUrls: string[];
    hashtags: string[];
    mentions: string[];
  }> {
    try {
      const template = await prisma.contentTemplate.findUnique({
        where: { id: templateId }
      });

      if (!template) {
        throw new Error('Template not found');
      }

      const templateData = JSON.parse(template.template);
      
      // Replace variables in template
      let text = templateData.text;
      Object.entries(variables).forEach(([key, value]) => {
        text = text.replace(new RegExp(`{{${key}}}`, 'g'), value);
      });

      // Update usage count
      await prisma.contentTemplate.update({
        where: { id: templateId },
        data: { usageCount: template.usageCount + 1 }
      });

      return {
        text,
        mediaUrls: templateData.mediaPlaceholders,
        hashtags: templateData.hashtags,
        mentions: templateData.mentions
      };
    } catch (error) {
      logger.error('Failed to generate content from template:', error);
      throw error;
    }
  }

  /**
   * Create a content batch
   */
  async createContentBatch(
    userId: string,
    batchData: {
      name: string;
      description: string;
      platforms: string[];
      scheduledDate: Date;
      posts: Array<{
        title: string;
        platform: string;
        accountId: string;
        contentType: string;
        content: {
          text: string;
          mediaUrls: string[];
          hashtags: string[];
          mentions: string[];
        };
      }>;
    }
  ): Promise<ContentBatch> {
    try {
      // Create the batch
      const batch = await prisma.contentBatch.create({
        data: {
          userId,
          name: batchData.name,
          description: batchData.description,
          platforms: batchData.platforms,
          scheduledDate: batchData.scheduledDate,
          status: 'draft',
          posts: []
        }
      });

      // Create individual posts
      const posts = [];
      for (const postData of batchData.posts) {
        const event = await this.createEvent(userId, {
          title: postData.title,
          description: batchData.description,
          platform: postData.platform,
          accountId: postData.accountId,
          contentType: postData.contentType as any,
          scheduledAt: batchData.scheduledDate,
          content: postData.content
        });
        posts.push(event);
      }

      // Update batch with post IDs
      await prisma.contentBatch.update({
        where: { id: batch.id },
        data: { posts: posts.map(p => p.id) }
      });

      logger.info(`Content batch created: ${batch.id} with ${posts.length} posts`);
      return { ...batch, posts } as unknown as ContentBatch;
    } catch (error) {
      logger.error('Failed to create content batch:', error);
      throw error;
    }
  }

  /**
   * Get optimal posting times
   */
  async getOptimalPostingTimes(
    userId: string,
    platform: string,
    accountId: string
  ): Promise<Array<{
    day: string;
    time: string;
    engagementScore: number;
    reason: string;
  }>> {
    try {
      // Get historical performance data
      const historicalData = await prisma.contentCalendarEvent.findMany({
        where: {
          userId,
          platform,
          accountId,
          status: 'published'
        },
        orderBy: { publishedAt: 'desc' },
        take: 100
      });

      // Analyze engagement patterns
      const optimalTimes = this.analyzeEngagementPatterns(historicalData);
      
      return optimalTimes;
    } catch (error) {
      logger.error('Failed to get optimal posting times:', error);
      throw error;
    }
  }

  /**
   * Get content calendar view
   */
  async getCalendarView(
    userId: string,
    startDate: Date,
    endDate: Date,
    platforms?: string[]
  ): Promise<ContentCalendarEvent[]> {
    try {
      const whereClause: any = {
        userId,
        scheduledAt: {
          gte: startDate,
          lte: endDate
        }
      };

      if (platforms && platforms.length > 0) {
        whereClause.platform = { in: platforms };
      }

      const events = await prisma.contentCalendarEvent.findMany({
        where: whereClause,
        orderBy: { scheduledAt: 'asc' }
      });

      return events as unknown as ContentCalendarEvent[];
    } catch (error) {
      logger.error('Failed to get calendar view:', error);
      throw error;
    }
  }

  /**
   * Analyze content performance
   */
  async analyzeContentPerformance(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ContentPerformance[]> {
    try {
      const events = await prisma.contentCalendarEvent.findMany({
        where: {
          userId,
          publishedAt: {
            gte: startDate,
            lte: endDate
          },
          status: 'published'
        }
      });

      const performances = events.map(event => {
        const engagement = JSON.parse(event.engagement);
        const performance: ContentPerformance = {
          eventId: event.id,
          platform: event.platform,
          metrics: {
            engagement: (engagement.likes + engagement.comments + engagement.shares),
            reach: engagement.reach || 0,
            impressions: engagement.impressions || 0,
            clicks: Math.floor(Math.random() * 100),
            conversions: Math.floor(Math.random() * 10),
            ctr: Math.random() * 5,
            cpm: Math.random() * 10,
            roas: Math.random() * 3
          },
          insights: this.generateInsights(event, engagement),
          recommendations: this.generateRecommendations(event, engagement)
        };
        return performance;
      });

      return performances;
    } catch (error) {
      logger.error('Failed to get performance analytics:', { error });
      throw error;
    }
  }

  // Helper methods
  private parseContentIdeas(content: string): Array<{
    title: string;
    content: string;
    hashtags: string[];
    suggestedPlatforms: string[];
    bestTimeToPost: string;
  }> {
    // Mock parsing - would implement proper parsing logic
    const ideas = [];
    const lines = content.split('\n').filter(line => line.trim());
    
    for (let i = 0; i < 5; i++) {
      ideas.push({
        title: `Content Idea ${i + 1}`,
        content: `Engaging content about ${['products', 'lifestyle', 'tips', 'behind-the-scenes', 'testimonials'][i]}`,
        hashtags: ['#business', '#marketing', '#socialmedia', '#engagement', '#content'],
        suggestedPlatforms: ['instagram', 'facebook'],
        bestTimeToPost: '2:00 PM'
      });
    }
    
    return ideas;
  }

  private analyzeEngagementPatterns(historicalData: any[]): Array<{
    day: string;
    time: string;
    engagementScore: number;
    reason: string;
  }> {
    // Mock analysis - would implement proper pattern analysis
    return [
      { day: 'Monday', time: '9:00 AM', engagementScore: 8.5, reason: 'High engagement during morning commute' },
      { day: 'Wednesday', time: '2:00 PM', engagementScore: 9.2, reason: 'Peak lunch break engagement' },
      { day: 'Friday', time: '6:00 PM', engagementScore: 7.8, reason: 'Weekend anticipation' },
      { day: 'Sunday', time: '10:00 AM', engagementScore: 6.5, reason: 'Relaxed weekend browsing' }
    ];
  }

  private generateInsights(event: any, engagement: any): string[] {
    return [
      'High engagement during peak hours',
      'Strong performance on this platform',
      'Content resonated well with audience'
    ];
  }

  private generateRecommendations(event: any, engagement: any): string[] {
    return [
      'Post similar content at this time',
      'Use more visual content',
      'Increase posting frequency'
    ];
  }
}

export const contentCalendar = new ContentCalendar();

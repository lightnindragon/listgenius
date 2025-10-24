import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { openai } from '@/lib/openai';

export interface EmailCampaign {
  id: string;
  userId: string;
  name: string;
  type: 'welcome' | 'abandoned_cart' | 'post_purchase' | 'win_back' | 'custom';
  status: 'draft' | 'active' | 'paused' | 'completed';
  subject: string;
  content: string;
  template: string;
  recipientSegment: string;
  scheduledAt?: Date;
  sentAt?: Date;
  metrics: EmailMetrics;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailMetrics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  unsubscribed: number;
  bounced: number;
  openRate: number;
  clickRate: number;
  unsubscribeRate: number;
}

export interface EmailSequence {
  id: string;
  userId: string;
  name: string;
  trigger: 'purchase' | 'abandon_cart' | 'signup' | 'custom';
  emails: EmailCampaign[];
  isActive: boolean;
  createdAt: Date;
}

export interface CustomerSegment {
  id: string;
  userId: string;
  name: string;
  criteria: SegmentCriteria;
  customerCount: number;
  lastUpdated: Date;
}

export interface SegmentCriteria {
  purchaseHistory?: {
    minOrders?: number;
    maxOrders?: number;
    minSpent?: number;
    maxSpent?: number;
    lastPurchaseDays?: number;
  };
  behavior?: {
    abandonedCart?: boolean;
    newsletterSubscribed?: boolean;
    highEngagement?: boolean;
  };
  demographics?: {
    location?: string[];
    ageRange?: { min: number; max: number };
  };
}

export interface ABTest {
  id: string;
  campaignId: string;
  variantA: { subject: string; content: string };
  variantB: { subject: string; content: string };
  splitRatio: number; // 0.5 = 50/50 split
  winner?: 'A' | 'B';
  status: 'running' | 'completed';
  startDate: Date;
  endDate?: Date;
}

export class EmailCampaignManager {
  constructor() {
    logger.info('EmailCampaignManager initialized');
  }

  /**
   * Create a new email campaign
   */
  async createCampaign(
    userId: string,
    campaignData: Omit<EmailCampaign, 'id' | 'userId' | 'metrics' | 'createdAt' | 'updatedAt'>
  ): Promise<EmailCampaign> {
    try {
      const campaign = await prisma.emailCampaign.create({
        data: {
          userId,
          ...campaignData,
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          unsubscribed: 0,
          bounced: 0
        }
      });

      logger.info(`Created email campaign: ${campaign.name}`);
      return campaign as unknown as EmailCampaign;
    } catch (error) {
      logger.error('Failed to create email campaign:', error);
      throw error;
    }
  }

  /**
   * Create an automated email sequence
   */
  async createEmailSequence(
    userId: string,
    sequenceData: Omit<EmailSequence, 'id' | 'userId' | 'createdAt' | 'emails'>
  ): Promise<EmailSequence> {
    try {
      const sequence = await prisma.emailSequence.create({
        data: {
          userId,
          ...sequenceData
        }
      });

      logger.info(`Created email sequence: ${sequence.name}`);
      return sequence as unknown as EmailSequence;
    } catch (error) {
      logger.error('Failed to create email sequence:', error);
      throw error;
    }
  }

  /**
   * Generate AI-powered email content
   */
  async generateEmailContent(
    campaignType: string,
    productContext: string,
    tone: string = 'friendly',
    length: 'short' | 'medium' | 'long' = 'medium'
  ): Promise<{ subject: string; content: string }> {
    try {
      const prompt = this.buildEmailPrompt(campaignType, productContext, tone, length);
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert email marketing copywriter specializing in e-commerce and handmade products. Create engaging, conversion-focused email content that builds relationships with customers.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      });

      const content = response.choices[0].message.content || '';
      const [subject, emailContent] = this.parseEmailResponse(content);

      return { subject, content: emailContent };
    } catch (error) {
      logger.error('Failed to generate email content:', error);
      throw error;
    }
  }

  /**
   * Create customer segment based on criteria
   */
  async createCustomerSegment(
    userId: string,
    name: string,
    criteria: SegmentCriteria
  ): Promise<CustomerSegment> {
    try {
      // Calculate customer count based on criteria
      const customerCount = await this.calculateSegmentSize(userId, criteria);

      const segment = await prisma.customerSegment.create({
        data: {
          userId,
          name,
          criteria: JSON.stringify(criteria),
          customerCount,
          lastUpdated: new Date()
        }
      });

      logger.info(`Created customer segment: ${segment.name} (${customerCount} customers)`);
      return segment as unknown as CustomerSegment;
    } catch (error) {
      logger.error('Failed to create customer segment:', error);
      throw error;
    }
  }

  /**
   * Send email campaign to segment
   */
  async sendCampaign(campaignId: string): Promise<{ sent: number; errors: string[] }> {
    try {
      const campaign = await prisma.emailCampaign.findUnique({
        where: { id: campaignId }
      });

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Get recipients from segment
      const recipients = await this.getSegmentRecipients(campaign.recipientSegment);
      
      let sent = 0;
      const errors: string[] = [];

      // Send emails (in batches for performance)
      const batchSize = 100;
      for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);
        
        const batchResults = await Promise.allSettled(
          batch.map(recipient => this.sendEmail(campaign as unknown as EmailCampaign, recipient))
        );

        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            sent++;
          } else {
            errors.push(`Failed to send to ${batch[index].email}: ${result.reason}`);
          }
        });
      }

      // Update campaign metrics
      await prisma.emailCampaign.update({
        where: { id: campaignId },
        data: {
          sent: campaign.sent + sent
        }
      });

      logger.info(`Campaign sent: ${sent} emails sent, ${errors.length} errors`);
      return { sent, errors };
    } catch (error) {
      logger.error('Failed to send campaign:', error);
      throw error;
    }
  }

  /**
   * Create A/B test for email campaign
   */
  async createABTest(
    campaignId: string,
    variantA: { subject: string; content: string },
    variantB: { subject: string; content: string },
    splitRatio: number = 0.5
  ): Promise<ABTest> {
    try {
      const abTest = await prisma.aBTest.create({
        data: {
          campaignId,
          variantA: JSON.stringify(variantA),
          variantB: JSON.stringify(variantB),
          splitRatio,
          status: 'running',
          startDate: new Date()
        }
      });

      logger.info(`Created A/B test for campaign: ${campaignId}`);
      return abTest as unknown as ABTest;
    } catch (error) {
      logger.error('Failed to create A/B test:', error);
      throw error;
    }
  }

  /**
   * Get campaign analytics
   */
  async getCampaignAnalytics(campaignId: string): Promise<EmailMetrics & {
    engagement: {
      timeToOpen: number;
      timeToClick: number;
      topClickedLinks: string[];
    };
    revenue: {
      attributedRevenue: number;
      roi: number;
    };
  }> {
    try {
      const campaign = await prisma.emailCampaign.findUnique({
        where: { id: campaignId }
      });

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Get additional analytics data
      const engagementData = await this.getEngagementAnalytics(campaignId);
      const revenueData = await this.getRevenueAnalytics(campaignId);

      return {
        sent: campaign.sent,
        delivered: campaign.delivered,
        opened: campaign.opened,
        clicked: campaign.clicked,
        unsubscribed: campaign.unsubscribed,
        bounced: campaign.bounced,
        openRate: campaign.delivered > 0 ? campaign.opened / campaign.delivered : 0,
        clickRate: campaign.delivered > 0 ? campaign.clicked / campaign.delivered : 0,
        unsubscribeRate: campaign.sent > 0 ? campaign.unsubscribed / campaign.sent : 0,
        engagement: engagementData,
        revenue: revenueData
      };
    } catch (error) {
      logger.error('Failed to get campaign analytics:', error);
      throw error;
    }
  }

  /**
   * Trigger automated email sequence
   */
  async triggerEmailSequence(
    userId: string,
    trigger: string,
    customerEmail: string,
    context?: any
  ): Promise<void> {
    try {
      // Find active sequences for this trigger
      const sequences = await prisma.emailSequence.findMany({
        where: {
          userId,
          trigger,
          isActive: true
        },
        include: { emails: true }
      });

      for (const sequence of sequences) {
        // Check if customer should receive this sequence
        if (await this.shouldSendSequence(sequence as unknown as EmailSequence, customerEmail, context)) {
          await this.scheduleSequenceEmails(sequence as unknown as EmailSequence, customerEmail, context);
        }
      }

      logger.info(`Triggered email sequences for ${customerEmail}`);
    } catch (error) {
      logger.error('Failed to trigger email sequence:', error);
      throw error;
    }
  }

  // Helper methods
  private buildEmailPrompt(
    campaignType: string,
    productContext: string,
    tone: string,
    length: string
  ): string {
    const lengthGuidelines = {
      short: 'Keep it concise, 2-3 sentences maximum',
      medium: 'Write a paragraph or two, engaging but not too long',
      long: 'Write a detailed, story-driven email that builds connection'
    };

    return `
      Create an email for a ${campaignType} campaign.
      
      Product Context: ${productContext}
      Tone: ${tone}
      Length: ${lengthGuidelines[length as keyof typeof lengthGuidelines]}
      
      Please provide:
      1. A compelling subject line (under 50 characters)
      2. Email content that is engaging and conversion-focused
      
      Format your response as:
      SUBJECT: [subject line]
      CONTENT: [email content]
    `;
  }

  private parseEmailResponse(content: string): [string, string] {
    const subjectMatch = content.match(/SUBJECT:\s*(.+)/);
    const contentMatch = content.match(/CONTENT:\s*([\s\S]+)/);
    
    const subject = subjectMatch?.[1]?.trim() || 'Your Email Subject';
    const emailContent = contentMatch?.[1]?.trim() || content;
    
    return [subject, emailContent];
  }

  private async calculateSegmentSize(userId: string, criteria: SegmentCriteria): Promise<number> {
    // This would query the database to count customers matching criteria
    // For now, return a mock count
    return Math.floor(Math.random() * 1000) + 100;
  }

  private async getSegmentRecipients(segmentId: string): Promise<Array<{ email: string; name: string }>> {
    // This would query the database to get customer emails from the segment
    // For now, return mock data
    return [
      { email: 'customer1@example.com', name: 'Customer 1' },
      { email: 'customer2@example.com', name: 'Customer 2' }
    ];
  }

  private async sendEmail(campaign: EmailCampaign, recipient: { email: string; name: string }): Promise<void> {
    // This would integrate with email service provider (SendGrid, etc.)
    logger.info(`Sending email to ${recipient.email}: ${campaign.subject}`);
  }

  private async getEngagementAnalytics(campaignId: string): Promise<any> {
    // Mock engagement analytics
    return {
      timeToOpen: 2.5, // hours
      timeToClick: 4.2, // hours
      topClickedLinks: ['https://example.com/product1', 'https://example.com/shop']
    };
  }

  private async getRevenueAnalytics(campaignId: string): Promise<any> {
    // Mock revenue analytics
    return {
      attributedRevenue: 1250.50,
      roi: 3.2
    };
  }

  private async shouldSendSequence(
    sequence: EmailSequence,
    customerEmail: string,
    context?: any
  ): Promise<boolean> {
    // Check if customer already received this sequence
    // Check sequence criteria and context
    return true; // Simplified for now
  }

  private async scheduleSequenceEmails(
    sequence: EmailSequence,
    customerEmail: string,
    context?: any
  ): Promise<void> {
    // Schedule emails in the sequence with appropriate delays
    logger.info(`Scheduling ${sequence.emails.length} emails for sequence: ${sequence.name}`);
  }
}

export const emailCampaignManager = new EmailCampaignManager();

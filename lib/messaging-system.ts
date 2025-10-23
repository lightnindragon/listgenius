import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { openai } from '@/lib/openai';

export interface Message {
  id: string;
  userId: string;
  recipientId: string;
  recipientEmail: string;
  type: 'welcome' | 'order_update' | 'promotional' | 'support' | 'custom';
  subject: string;
  content: string;
  status: 'draft' | 'scheduled' | 'sent' | 'delivered' | 'failed';
  scheduledAt?: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  template: string;
  variables: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageTemplate {
  id: string;
  userId: string;
  name: string;
  type: string;
  subject: string;
  content: string;
  variables: string[]; // Available variables like {{customerName}}, {{orderNumber}}
  isDefault: boolean;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageCampaign {
  id: string;
  userId: string;
  name: string;
  templateId: string;
  recipientSegment: string;
  scheduledAt: Date;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';
  messagesSent: number;
  messagesDelivered: number;
  createdAt: Date;
}

export interface MessageAnalytics {
  totalSent: number;
  delivered: number;
  opened: number;
  clicked: number;
  replied: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  replyRate: number;
}

export class MessagingSystem {
  constructor() {
    logger.info('MessagingSystem initialized');
  }

  /**
   * Send a single message
   */
  async sendMessage(
    userId: string,
    messageData: Omit<Message, 'id' | 'userId' | 'status' | 'sentAt' | 'deliveredAt' | 'createdAt' | 'updatedAt'>
  ): Promise<Message> {
    try {
      // Process template variables
      const processedContent = await this.processTemplate(messageData.content, messageData.variables);
      const processedSubject = await this.processTemplate(messageData.subject, messageData.variables);

      const message = await prisma.message.create({
        data: {
          userId,
          ...messageData,
          content: processedContent,
          subject: processedSubject,
          variables: JSON.stringify(messageData.variables),
          status: 'sent',
          sentAt: new Date()
        }
      });

      // Send via email service
      await this.deliverMessage(message as unknown as Message);

      logger.info(`Message sent to ${messageData.recipientEmail}`);
      return message as unknown as Message;
    } catch (error) {
      logger.error('Failed to send message:', error);
      throw error;
    }
  }

  /**
   * Schedule a message for later delivery
   */
  async scheduleMessage(
    userId: string,
    messageData: Omit<Message, 'id' | 'userId' | 'status' | 'sentAt' | 'deliveredAt' | 'createdAt' | 'updatedAt'>,
    scheduledAt: Date
  ): Promise<Message> {
    try {
      const message = await prisma.message.create({
        data: {
          userId,
          ...messageData,
          variables: JSON.stringify(messageData.variables),
          status: 'scheduled',
          scheduledAt
        }
      });

      // Add to scheduled jobs queue
      await this.scheduleDelivery(message.id, scheduledAt);

      logger.info(`Message scheduled for ${scheduledAt}`);
      return message as unknown as Message;
    } catch (error) {
      logger.error('Failed to schedule message:', error);
      throw error;
    }
  }

  /**
   * Create a message template
   */
  async createTemplate(
    userId: string,
    templateData: Omit<MessageTemplate, 'id' | 'userId' | 'usageCount' | 'createdAt' | 'updatedAt'>
  ): Promise<MessageTemplate> {
    try {
      const template = await prisma.messageTemplate.create({
        data: {
          userId,
          ...templateData,
          usageCount: 0
        }
      });

      logger.info(`Created message template: ${template.name}`);
      return template;
    } catch (error) {
      logger.error('Failed to create message template:', error);
      throw error;
    }
  }

  /**
   * Generate AI-powered message content
   */
  async generateMessageContent(
    messageType: string,
    context: string,
    tone: string = 'friendly',
    variables: Record<string, string> = {}
  ): Promise<{ subject: string; content: string }> {
    try {
      const prompt = this.buildMessagePrompt(messageType, context, tone, variables);
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert at writing personalized, engaging messages for e-commerce customers. Create messages that feel personal and build relationships while being professional.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.7
      });

      const content = response.choices[0].message.content || '';
      const [subject, messageContent] = this.parseMessageResponse(content);

      return { subject, content: messageContent };
    } catch (error) {
      logger.error('Failed to generate message content:', error);
      throw error;
    }
  }

  /**
   * Send bulk messages to a customer segment
   */
  async sendBulkMessages(
    userId: string,
    templateId: string,
    recipientSegment: string,
    variables: Record<string, string> = {}
  ): Promise<MessageCampaign> {
    try {
      const template = await prisma.messageTemplate.findUnique({
        where: { id: templateId }
      });

      if (!template) {
        throw new Error('Template not found');
      }

      // Create campaign
      const campaign = await prisma.messageCampaign.create({
        data: {
          userId,
          name: `Bulk Campaign - ${template.name}`,
          templateId,
          recipientSegment,
          scheduledAt: new Date(),
          status: 'sending',
          messagesSent: 0,
          messagesDelivered: 0
        }
      });

      // Get recipients from segment
      const recipients = await this.getSegmentRecipients(userId, recipientSegment);

      // Send messages in batches
      const batchSize = 50;
      let sent = 0;

      for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);
        
        const batchPromises = batch.map(recipient => 
          this.sendMessage(userId, {
            recipientId: recipient.id,
            recipientEmail: recipient.email,
            type: template.type as any,
            subject: template.subject,
            content: template.content,
            template: templateId,
            variables: { ...variables, ...recipient.variables }
          })
        );

        const batchResults = await Promise.allSettled(batchPromises);
        sent += batchResults.filter(r => r.status === 'fulfilled').length;
      }

      // Update campaign
      await prisma.messageCampaign.update({
        where: { id: campaign.id },
        data: {
          messagesSent: sent,
          status: 'sent'
        }
      });

      logger.info(`Bulk campaign sent: ${sent} messages`);
      return campaign as unknown as MessageCampaign;
    } catch (error) {
      logger.error('Failed to send bulk messages:', error);
      throw error;
    }
  }

  /**
   * Get message analytics
   */
  async getMessageAnalytics(userId: string, dateRange?: { start: Date; end: Date }): Promise<MessageAnalytics> {
    try {
      const whereClause: any = { userId };
      
      if (dateRange) {
        whereClause.createdAt = {
          gte: dateRange.start,
          lte: dateRange.end
        };
      }

      const messages = await prisma.message.findMany({
        where: whereClause
      });

      const analytics: MessageAnalytics = {
        totalSent: messages.length,
        delivered: messages.filter(m => m.status === 'delivered').length,
        opened: 0, // Would track via email service
        clicked: 0, // Would track via email service
        replied: 0, // Would track via email service
        deliveryRate: 0,
        openRate: 0,
        clickRate: 0,
        replyRate: 0
      };

      // Calculate rates
      if (analytics.totalSent > 0) {
        analytics.deliveryRate = (analytics.delivered / analytics.totalSent) * 100;
        analytics.openRate = (analytics.opened / analytics.totalSent) * 100;
        analytics.clickRate = (analytics.clicked / analytics.totalSent) * 100;
        analytics.replyRate = (analytics.replied / analytics.totalSent) * 100;
      }

      return analytics;
    } catch (error) {
      logger.error('Failed to get message analytics:', error);
      throw error;
    }
  }

  /**
   * Get customer conversation history
   */
  async getCustomerConversation(userId: string, customerEmail: string): Promise<Message[]> {
    try {
      const messages = await prisma.message.findMany({
        where: {
          userId,
          recipientEmail: customerEmail
        },
        orderBy: { createdAt: 'desc' }
      });

      return messages as unknown as Message[];
    } catch (error) {
      logger.error('Failed to get customer conversation:', error);
      throw error;
    }
  }

  /**
   * Process scheduled messages (called by cron job)
   */
  async processScheduledMessages(): Promise<void> {
    try {
      const now = new Date();
      const scheduledMessages = await prisma.message.findMany({
        where: {
          status: 'scheduled',
          scheduledAt: {
            lte: now
          }
        }
      });

      for (const message of scheduledMessages) {
        try {
          await this.deliverMessage(message as unknown as Message);
          
          await prisma.message.update({
            where: { id: message.id },
            data: {
              status: 'sent',
              sentAt: new Date()
            }
          });
        } catch (error) {
          logger.error(`Failed to deliver scheduled message ${message.id}:`, error);
          
          await prisma.message.update({
            where: { id: message.id },
            data: {
              status: 'failed'
            }
          });
        }
      }

      logger.info(`Processed ${scheduledMessages.length} scheduled messages`);
    } catch (error) {
      logger.error('Failed to process scheduled messages:', error);
      throw error;
    }
  }

  // Helper methods
  private async processTemplate(template: string, variables: Record<string, string>): Promise<string> {
    let processed = template;
    
    // Replace variables like {{customerName}} with actual values
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      processed = processed.replace(regex, value);
    }

    return processed;
  }

  private async deliverMessage(message: Message): Promise<void> {
    // This would integrate with email service provider
    logger.info(`Delivering message to ${message.recipientEmail}: ${message.subject}`);
    
    // Simulate delivery delay
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private buildMessagePrompt(
    messageType: string,
    context: string,
    tone: string,
    variables: Record<string, string>
  ): string {
    const variableList = Object.keys(variables).length > 0 
      ? `Available variables: ${Object.keys(variables).join(', ')}`
      : '';

    return `
      Create a ${messageType} message.
      
      Context: ${context}
      Tone: ${tone}
      ${variableList}
      
      Please provide:
      1. A clear, engaging subject line
      2. Message content that feels personal and relevant
      
      Format your response as:
      SUBJECT: [subject line]
      CONTENT: [message content]
    `;
  }

  private parseMessageResponse(content: string): [string, string] {
    const subjectMatch = content.match(/SUBJECT:\s*(.+)/);
    const contentMatch = content.match(/CONTENT:\s*([\s\S]+)/);
    
    const subject = subjectMatch?.[1]?.trim() || 'Your Message';
    const messageContent = contentMatch?.[1]?.trim() || content;
    
    return [subject, messageContent];
  }

  private async getSegmentRecipients(userId: string, segmentId: string): Promise<Array<{
    id: string;
    email: string;
    variables: Record<string, string>;
  }>> {
    // This would query the database to get customers from the segment
    // For now, return mock data
    return [
      { id: '1', email: 'customer1@example.com', variables: { customerName: 'John Doe' } },
      { id: '2', email: 'customer2@example.com', variables: { customerName: 'Jane Smith' } }
    ];
  }

  private async scheduleDelivery(messageId: string, scheduledAt: Date): Promise<void> {
    // This would add the message to a job queue (Redis, Bull, etc.)
    logger.info(`Scheduling message ${messageId} for ${scheduledAt}`);
  }
}

export const messagingSystem = new MessagingSystem();

// Export function to get messaging system instance
export function getMessagingSystem(): MessagingSystem {
  return messagingSystem;
}
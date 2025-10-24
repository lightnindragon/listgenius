import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

export interface Customer {
  id: string;
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: Date;
  firstOrderDate?: Date;
  averageOrderValue: number;
  tags: string[];
  location?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerSegment {
  id: string;
  userId: string;
  name: string;
  description: string;
  criteria: SegmentCriteria;
  customerCount: number;
  isDynamic: boolean; // Auto-updating based on criteria
  lastUpdated: Date;
  createdAt: Date;
}

export interface SegmentCriteria {
  // Purchase behavior
  purchaseHistory?: {
    minOrders?: number;
    maxOrders?: number;
    minTotalSpent?: number;
    maxTotalSpent?: number;
    minAverageOrderValue?: number;
    maxAverageOrderValue?: number;
    lastPurchaseDays?: number; // Days since last purchase
    firstPurchaseDays?: number; // Days since first purchase
  };
  
  // Engagement behavior
  engagement?: {
    hasAbandonedCart?: boolean;
    newsletterSubscribed?: boolean;
    hasReviewed?: boolean;
    hasReturned?: boolean;
    highEngagement?: boolean; // Based on email opens/clicks
  };
  
  // Demographics
  demographics?: {
    location?: string[];
    ageRange?: { min: number; max: number };
    customerType?: 'new' | 'returning' | 'vip';
  };
  
  // Tags and custom attributes
  tags?: {
    include?: string[];
    exclude?: string[];
  };
  
  // Date ranges
  dateRange?: {
    customerSince?: { start: Date; end: Date };
    lastActivity?: { start: Date; end: Date };
  };
}

export interface SegmentInsights {
  segmentId: string;
  totalCustomers: number;
  averageOrderValue: number;
  totalRevenue: number;
  topProducts: Array<{ productId: string; name: string; orders: number }>;
  engagementRate: number;
  retentionRate: number;
  growthRate: number;
  recommendations: string[];
}

export interface CustomerJourney {
  customerId: string;
  stages: Array<{
    stage: 'aware' | 'interest' | 'consideration' | 'purchase' | 'retention' | 'advocacy';
    date: Date;
    action?: string;
    value?: number;
  }>;
  currentStage: string;
  nextActions: string[];
}

export class CustomerSegmentation {
  constructor() {
    logger.info('CustomerSegmentation initialized');
  }

  /**
   * Create a new customer segment
   */
  async createSegment(
    userId: string,
    name: string,
    description: string,
    criteria: SegmentCriteria,
    isDynamic: boolean = true
  ): Promise<CustomerSegment> {
    try {
      // Calculate initial customer count
      const customerCount = await this.calculateSegmentSize(userId, criteria);

      const segment = await prisma.customerSegment.create({
        data: {
          userId,
          name,
          description,
          criteria: JSON.stringify(criteria),
          customerCount,
          isDynamic,
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
   * Update segment criteria and recalculate
   */
  async updateSegment(
    segmentId: string,
    criteria: SegmentCriteria,
    isDynamic?: boolean
  ): Promise<CustomerSegment> {
    try {
      const segment = await prisma.customerSegment.findUnique({
        where: { id: segmentId }
      });

      if (!segment) {
        throw new Error('Segment not found');
      }

      const customerCount = await this.calculateSegmentSize(segment.userId, criteria);

      const updatedSegment = await prisma.customerSegment.update({
        where: { id: segmentId },
        data: {
          criteria: JSON.stringify(criteria),
          customerCount,
          isDynamic,
          lastUpdated: new Date()
        }
      });

      logger.info(`Updated segment: ${updatedSegment.name} (${customerCount} customers)`);
      return updatedSegment as unknown as CustomerSegment;
    } catch (error) {
      logger.error('Failed to update segment:', error);
      throw error;
    }
  }

  /**
   * Get customers in a segment
   */
  async getSegmentCustomers(
    segmentId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<{ customers: Customer[]; total: number }> {
    try {
      const segment = await prisma.customerSegment.findUnique({
        where: { id: segmentId }
      });

      if (!segment) {
        throw new Error('Segment not found');
      }

      const criteria = JSON.parse(segment.criteria) as SegmentCriteria;
      
      // Build query based on criteria
      const customers = await this.queryCustomersByCriteria(segment.userId, criteria, limit, offset);
      const total = await this.countCustomersByCriteria(segment.userId, criteria);

      return { customers, total };
    } catch (error) {
      logger.error('Failed to get segment customers:', error);
      throw error;
    }
  }

  /**
   * Get segment insights and analytics
   */
  async getSegmentInsights(segmentId: string): Promise<SegmentInsights> {
    try {
      const segment = await prisma.customerSegment.findUnique({
        where: { id: segmentId }
      });

      if (!segment) {
        throw new Error('Segment not found');
      }

      const criteria = JSON.parse(segment.criteria) as SegmentCriteria;
      const customers = await this.queryCustomersByCriteria(segment.userId, criteria);

      // Calculate insights
      const insights: SegmentInsights = {
        segmentId,
        totalCustomers: customers.length,
        averageOrderValue: this.calculateAverageOrderValue(customers),
        totalRevenue: this.calculateTotalRevenue(customers),
        topProducts: await this.getTopProducts(segment.userId, customers),
        engagementRate: await this.calculateEngagementRate(segment.userId, customers),
        retentionRate: await this.calculateRetentionRate(segment.userId, customers),
        growthRate: await this.calculateGrowthRate(segment.userId, customers),
        recommendations: this.generateRecommendations(customers, criteria)
      };

      return insights;
    } catch (error) {
      logger.error('Failed to get segment insights:', error);
      throw error;
    }
  }

  /**
   * Get customer journey for a specific customer
   */
  async getCustomerJourney(customerId: string): Promise<CustomerJourney> {
    try {
      // Get customer data and order history
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: { orders: { orderBy: { createdAt: 'asc' } } }
      });

      if (!customer) {
        throw new Error('Customer not found');
      }

      const journey: CustomerJourney = {
        customerId,
        stages: [],
        currentStage: 'aware',
        nextActions: []
      };

      // Analyze customer behavior to determine journey stages
      journey.stages = this.analyzeCustomerJourney(customer) as Array<{
        stage: "purchase" | "aware" | "interest" | "consideration" | "retention" | "advocacy";
        date: Date;
        action?: string;
        value?: number;
      }>;
      journey.currentStage = this.determineCurrentStage(journey.stages);
      journey.nextActions = this.suggestNextActions(journey);

      return journey;
    } catch (error) {
      logger.error('Failed to get customer journey:', error);
      throw error;
    }
  }

  /**
   * Update all dynamic segments
   */
  async updateDynamicSegments(userId: string): Promise<void> {
    try {
      const segments = await prisma.customerSegment.findMany({
        where: { userId, isDynamic: true }
      });

      for (const segment of segments) {
        const criteria = JSON.parse(segment.criteria) as SegmentCriteria;
        const customerCount = await this.calculateSegmentSize(userId, criteria);

        await prisma.customerSegment.update({
          where: { id: segment.id },
          data: {
            customerCount,
            lastUpdated: new Date()
          }
        });
      }

      logger.info(`Updated ${segments.length} dynamic segments for user ${userId}`);
    } catch (error) {
      logger.error('Failed to update dynamic segments:', error);
      throw error;
    }
  }

  /**
   * Get segment performance comparison
   */
  async compareSegments(segmentIds: string[]): Promise<{
    segments: Array<{
      id: string;
      name: string;
      customerCount: number;
      averageOrderValue: number;
      totalRevenue: number;
      engagementRate: number;
    }>;
    comparison: {
      bestPerforming: string;
      mostEngaged: string;
      highestValue: string;
    };
  }> {
    try {
      const segments = await prisma.customerSegment.findMany({
        where: { id: { in: segmentIds } }
      });

      const segmentData = await Promise.all(
        segments.map(async (segment) => {
          const insights = await this.getSegmentInsights(segment.id);
          return {
            id: segment.id,
            name: segment.name,
            customerCount: insights.totalCustomers,
            averageOrderValue: insights.averageOrderValue,
            totalRevenue: insights.totalRevenue,
            engagementRate: insights.engagementRate
          };
        })
      );

      // Find best performers
      const comparison = {
        bestPerforming: segmentData.reduce((best, current) => 
          current.totalRevenue > best.totalRevenue ? current : best
        ).id,
        mostEngaged: segmentData.reduce((best, current) => 
          current.engagementRate > best.engagementRate ? current : best
        ).id,
        highestValue: segmentData.reduce((best, current) => 
          current.averageOrderValue > best.averageOrderValue ? current : best
        ).id
      };

      return { segments: segmentData, comparison };
    } catch (error) {
      logger.error('Failed to compare segments:', error);
      throw error;
    }
  }

  // Helper methods
  private async calculateSegmentSize(userId: string, criteria: SegmentCriteria): Promise<number> {
    const customers = await this.queryCustomersByCriteria(userId, criteria);
    return customers.length;
  }

  private async queryCustomersByCriteria(
    userId: string,
    criteria: SegmentCriteria,
    limit?: number,
    offset?: number
  ): Promise<Customer[]> {
    // Build complex query based on criteria
    // This is a simplified version - in reality, you'd build dynamic Prisma queries
    
    const whereClause: any = { userId };

    // Purchase history criteria
    if (criteria.purchaseHistory) {
      const ph = criteria.purchaseHistory;
      if (ph.minOrders !== undefined) {
        whereClause.totalOrders = { gte: ph.minOrders };
      }
      if (ph.maxOrders !== undefined) {
        whereClause.totalOrders = { ...whereClause.totalOrders, lte: ph.maxOrders };
      }
      if (ph.minTotalSpent !== undefined) {
        whereClause.totalSpent = { gte: ph.minTotalSpent };
      }
      if (ph.maxTotalSpent !== undefined) {
        whereClause.totalSpent = { ...whereClause.totalSpent, lte: ph.maxTotalSpent };
      }
    }

    // Date range criteria
    if (criteria.dateRange?.customerSince) {
      whereClause.createdAt = {
        gte: criteria.dateRange.customerSince.start,
        lte: criteria.dateRange.customerSince.end
      };
    }

    // Mock implementation - replace with actual Prisma query
    return [];
  }

  private async countCustomersByCriteria(userId: string, criteria: SegmentCriteria): Promise<number> {
    const customers = await this.queryCustomersByCriteria(userId, criteria);
    return customers.length;
  }

  private calculateAverageOrderValue(customers: Customer[]): number {
    if (customers.length === 0) return 0;
    const total = customers.reduce((sum, customer) => sum + customer.totalSpent, 0);
    const totalOrders = customers.reduce((sum, customer) => sum + customer.totalOrders, 0);
    return totalOrders > 0 ? total / totalOrders : 0;
  }

  private calculateTotalRevenue(customers: Customer[]): number {
    return customers.reduce((sum, customer) => sum + customer.totalSpent, 0);
  }

  private async getTopProducts(userId: string, customers: Customer[]): Promise<Array<{
    productId: string;
    name: string;
    orders: number;
  }>> {
    // Mock implementation - would query actual order data
    return [
      { productId: '1', name: 'Product A', orders: 50 },
      { productId: '2', name: 'Product B', orders: 30 }
    ];
  }

  private async calculateEngagementRate(pointId: string, customers: Customer[]): Promise<number> {
    // Mock implementation - would calculate based on email opens, clicks, etc.
    return Math.random() * 100;
  }

  private async calculateRetentionRate(pointId: string, customers: Customer[]): Promise<number> {
    // Mock implementation - would calculate repeat purchase rate
    return Math.random() * 100;
  }

  private async calculateGrowthRate(pointId: string, customers: Customer[]): Promise<number> {
    // Mock implementation - would calculate segment growth over time
    return Math.random() * 20 - 10; // -10% to +10%
  }

  private generateRecommendations(customers: Customer[], criteria: SegmentCriteria): string[] {
    const recommendations: string[] = [];

    if (customers.length < 10) {
      recommendations.push('Consider expanding criteria to include more customers');
    }

    if (this.calculateAverageOrderValue(customers) < 50) {
      recommendations.push('Focus on increasing average order value with bundles or upsells');
    }

    if (criteria.purchaseHistory?.lastPurchaseDays && criteria.purchaseHistory.lastPurchaseDays > 90) {
      recommendations.push('This segment may need re-engagement campaigns');
    }

    return recommendations;
  }

  private analyzeCustomerJourney(customer: any): Array<{
    stage: string;
    date: Date;
    action?: string;
    value?: number;
  }> {
    // Analyze customer behavior to determine journey stages
    // This is a simplified implementation
    return [
      {
        stage: 'aware',
        date: customer.createdAt,
        action: 'First visit'
      },
      {
        stage: 'purchase',
        date: customer.orders[0]?.createdAt || customer.createdAt,
        action: 'First purchase',
        value: customer.orders[0]?.totalAmount || 0
      }
    ];
  }

  private determineCurrentStage(stages: Array<{ stage: string; date: Date }>): string {
    // Determine current stage based on recent activity
    return stages[stages.length - 1]?.stage || 'aware';
  }

  private suggestNextActions(journey: CustomerJourney): string[] {
    const actions: string[] = [];

    switch (journey.currentStage) {
      case 'aware':
        actions.push('Send welcome email sequence');
        actions.push('Offer first-time buyer discount');
        break;
      case 'interest':
        actions.push('Send product recommendations');
        actions.push('Share customer reviews');
        break;
      case 'purchase':
        actions.push('Send thank you email');
        actions.push('Request product review');
        break;
      case 'retention':
        actions.push('Send re-engagement campaign');
        actions.push('Offer loyalty rewards');
        break;
    }

    return actions;
  }
}

export const customerSegmentation = new CustomerSegmentation();

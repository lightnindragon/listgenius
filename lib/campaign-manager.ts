import { getEmailService } from './email-service';
import { getMessagingSystem } from './messaging-system';

// Campaign types
export interface Campaign {
  id: string;
  name: string;
  description: string;
  type: 'email' | 'message' | 'mixed';
  status: 'draft' | 'active' | 'paused' | 'completed';
  trigger: CampaignTrigger;
  steps: CampaignStep[];
  audience: CampaignAudience;
  createdAt: Date;
  updatedAt: Date;
  stats: CampaignStats;
}

// Campaign trigger
export interface CampaignTrigger {
  type: 'purchase' | 'shipment' | 'delivery' | 'review' | 'abandoned_cart' | 'date' | 'manual';
  delay?: number; // Delay in hours before triggering
  conditions?: Record<string, any>; // Additional conditions
  scheduledDate?: Date; // For date triggers
}

// Campaign step
export interface CampaignStep {
  id: string;
  order: number;
  type: 'email' | 'message';
  delay: number; // Delay in hours from previous step or trigger
  templateId: string;
  subject: string;
  content: string;
  variables: Record<string, string>;
  conditions?: Record<string, any>; // Conditional sending
}

// Campaign audience
export interface CampaignAudience {
  type: 'all' | 'segment' | 'custom';
  segmentId?: string;
  customerIds?: number[];
  filters?: {
    minOrders?: number;
    maxOrders?: number;
    minSpent?: number;
    maxSpent?: number;
    lastOrderDays?: number;
    hasReviewed?: boolean;
    tags?: string[];
  };
}

// Campaign statistics
export interface CampaignStats {
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalReplied: number;
  conversionRate: number;
  revenue: number;
  lastRun?: Date;
}

// Drip campaign
export interface DripCampaign {
  id: string;
  name: string;
  description: string;
  steps: DripStep[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Drip step
export interface DripStep {
  id: string;
  order: number;
  delay: number; // Days from campaign start
  type: 'email' | 'message';
  templateId: string;
  subject: string;
  content: string;
  variables: Record<string, string>;
}

// Customer journey
export interface CustomerJourney {
  customerId: number;
  campaignId: string;
  currentStep: number;
  status: 'active' | 'completed' | 'paused' | 'unsubscribed';
  startedAt: Date;
  lastActivity: Date;
  completedSteps: string[];
  data: Record<string, any>; // Customer-specific data
}

class CampaignManager {
  private emailService: any;
  private messagingSystem: any;
  private campaigns: Map<string, Campaign> = new Map();
  private dripCampaigns: Map<string, DripCampaign> = new Map();
  private customerJourneys: Map<string, CustomerJourney> = new Map();

  constructor() {
    this.emailService = getEmailService();
    this.messagingSystem = getMessagingSystem();
  }

  // Create new campaign
  async createCampaign(campaignData: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt' | 'stats'>): Promise<Campaign> {
    try {
      const campaign: Campaign = {
        id: `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        stats: {
          totalSent: 0,
          totalDelivered: 0,
          totalOpened: 0,
          totalClicked: 0,
          totalReplied: 0,
          conversionRate: 0,
          revenue: 0
        },
        ...campaignData
      };

      this.campaigns.set(campaign.id, campaign);
      return campaign;
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }
  }

  // Update campaign
  async updateCampaign(campaignId: string, updates: Partial<Campaign>): Promise<Campaign | null> {
    try {
      const campaign = this.campaigns.get(campaignId);
      if (!campaign) return null;

      const updatedCampaign = {
        ...campaign,
        ...updates,
        updatedAt: new Date()
      };

      this.campaigns.set(campaignId, updatedCampaign);
      return updatedCampaign;
    } catch (error) {
      console.error('Error updating campaign:', error);
      throw error;
    }
  }

  // Get campaign by ID
  getCampaign(campaignId: string): Campaign | null {
    return this.campaigns.get(campaignId) || null;
  }

  // Get all campaigns
  getAllCampaigns(): Campaign[] {
    return Array.from(this.campaigns.values());
  }

  // Start campaign
  async startCampaign(campaignId: string): Promise<boolean> {
    try {
      const campaign = this.campaigns.get(campaignId);
      if (!campaign) return false;

      campaign.status = 'active';
      campaign.updatedAt = new Date();
      this.campaigns.set(campaignId, campaign);

      // If it's a manual trigger campaign, execute immediately
      if (campaign.trigger.type === 'manual') {
        await this.executeCampaign(campaignId);
      }

      return true;
    } catch (error) {
      console.error('Error starting campaign:', error);
      return false;
    }
  }

  // Pause campaign
  async pauseCampaign(campaignId: string): Promise<boolean> {
    try {
      const campaign = this.campaigns.get(campaignId);
      if (!campaign) return false;

      campaign.status = 'paused';
      campaign.updatedAt = new Date();
      this.campaigns.set(campaignId, campaign);

      return true;
    } catch (error) {
      console.error('Error pausing campaign:', error);
      return false;
    }
  }

  // Execute campaign for a specific customer
  async executeCampaignForCustomer(campaignId: string, customerId: number, triggerData: Record<string, any> = {}): Promise<boolean> {
    try {
      const campaign = this.campaigns.get(campaignId);
      if (!campaign || campaign.status !== 'active') return false;

      // Create customer journey
      const journeyId = `${campaignId}_${customerId}`;
      const journey: CustomerJourney = {
        customerId,
        campaignId,
        currentStep: 0,
        status: 'active',
        startedAt: new Date(),
        lastActivity: new Date(),
        completedSteps: [],
        data: triggerData
      };

      this.customerJourneys.set(journeyId, journey);

      // Execute first step
      await this.executeCampaignStep(campaignId, customerId, 0, triggerData);

      return true;
    } catch (error) {
      console.error('Error executing campaign for customer:', error);
      return false;
    }
  }

  // Execute campaign step
  private async executeCampaignStep(
    campaignId: string,
    customerId: number,
    stepIndex: number,
    data: Record<string, any>
  ): Promise<boolean> {
    try {
      const campaign = this.campaigns.get(campaignId);
      if (!campaign || !campaign.steps[stepIndex]) return false;

      const step = campaign.steps[stepIndex];
      const journeyId = `${campaignId}_${customerId}`;
      const journey = this.customerJourneys.get(journeyId);

      if (!journey) return false;

      // Check conditions
      if (step.conditions && !this.evaluateConditions(step.conditions, data)) {
        // Skip this step and move to next
        await this.executeCampaignStep(campaignId, customerId, stepIndex + 1, data);
        return true;
      }

      // Send message or email
      let success = false;
      if (step.type === 'email') {
        success = await this.emailService.sendCustom(
          data.email || `customer_${customerId}@example.com`,
          step.subject,
          step.content,
          undefined,
          { ...step.variables, ...data }
        );
      } else if (step.type === 'message') {
        success = await this.messagingSystem.sendMessage(
          customerId,
          step.subject,
          step.content
        );
      }

      if (success) {
        // Update journey
        journey.completedSteps.push(step.id);
        journey.currentStep = stepIndex + 1;
        journey.lastActivity = new Date();

        // Update campaign stats
        campaign.stats.totalSent++;
        if (step.type === 'email') {
          campaign.stats.totalDelivered++;
        }

        this.customerJourneys.set(journeyId, journey);
        this.campaigns.set(campaignId, campaign);

        // Schedule next step if exists
        if (stepIndex + 1 < campaign.steps.length) {
          const nextStep = campaign.steps[stepIndex + 1];
          const delayMs = nextStep.delay * 60 * 60 * 1000; // Convert hours to milliseconds

          setTimeout(async () => {
            await this.executeCampaignStep(campaignId, customerId, stepIndex + 1, data);
          }, delayMs);
        } else {
          // Campaign completed for this customer
          journey.status = 'completed';
          this.customerJourneys.set(journeyId, journey);
        }
      }

      return success;
    } catch (error) {
      console.error('Error executing campaign step:', error);
      return false;
    }
  }

  // Execute entire campaign (for manual triggers)
  async executeCampaign(campaignId: string): Promise<{ sent: number; failed: number }> {
    try {
      const campaign = this.campaigns.get(campaignId);
      if (!campaign) return { sent: 0, failed: 0 };

      const customers = await this.getCampaignAudience(campaign.audience);
      let sent = 0;
      let failed = 0;

      for (const customerId of customers) {
        const success = await this.executeCampaignForCustomer(campaignId, customerId);
        if (success) {
          sent++;
        } else {
          failed++;
        }
      }

      return { sent, failed };
    } catch (error) {
      console.error('Error executing campaign:', error);
      return { sent: 0, failed: 0 };
    }
  }

  // Get campaign audience
  private async getCampaignAudience(audience: CampaignAudience): Promise<number[]> {
    try {
      switch (audience.type) {
        case 'all':
          // Return all customer IDs (this would come from your database)
          return [1, 2, 3, 4, 5]; // Mock data
        case 'segment':
          if (audience.segmentId) {
            // Get customers from segment (this would come from your database)
            return [1, 2, 3]; // Mock data
          }
          return [];
        case 'custom':
          return audience.customerIds || [];
        default:
          return [];
      }
    } catch (error) {
      console.error('Error getting campaign audience:', error);
      return [];
    }
  }

  // Evaluate conditions
  private evaluateConditions(conditions: Record<string, any>, data: Record<string, any>): boolean {
    try {
      for (const [key, value] of Object.entries(conditions)) {
        if (data[key] !== value) {
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('Error evaluating conditions:', error);
      return false;
    }
  }

  // Create drip campaign
  async createDripCampaign(dripData: Omit<DripCampaign, 'id' | 'createdAt' | 'updatedAt'>): Promise<DripCampaign> {
    try {
      const dripCampaign: DripCampaign = {
        id: `drip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...dripData
      };

      this.dripCampaigns.set(dripCampaign.id, dripCampaign);
      return dripCampaign;
    } catch (error) {
      console.error('Error creating drip campaign:', error);
      throw error;
    }
  }

  // Start customer on drip campaign
  async startDripCampaign(dripCampaignId: string, customerId: number, data: Record<string, any> = {}): Promise<boolean> {
    try {
      const dripCampaign = this.dripCampaigns.get(dripCampaignId);
      if (!dripCampaign || !dripCampaign.isActive) return false;

      // Create customer journey for drip campaign
      const journeyId = `drip_${dripCampaignId}_${customerId}`;
      const journey: CustomerJourney = {
        customerId,
        campaignId: dripCampaignId,
        currentStep: 0,
        status: 'active',
        startedAt: new Date(),
        lastActivity: new Date(),
        completedSteps: [],
        data
      };

      this.customerJourneys.set(journeyId, journey);

      // Schedule first step
      const firstStep = dripCampaign.steps[0];
      if (firstStep) {
        const delayMs = firstStep.delay * 24 * 60 * 60 * 1000; // Convert days to milliseconds

        setTimeout(async () => {
          await this.executeDripStep(dripCampaignId, customerId, 0, data);
        }, delayMs);
      }

      return true;
    } catch (error) {
      console.error('Error starting drip campaign:', error);
      return false;
    }
  }

  // Execute drip step
  private async executeDripStep(
    dripCampaignId: string,
    customerId: number,
    stepIndex: number,
    data: Record<string, any>
  ): Promise<boolean> {
    try {
      const dripCampaign = this.dripCampaigns.get(dripCampaignId);
      if (!dripCampaign || !dripCampaign.steps[stepIndex]) return false;

      const step = dripCampaign.steps[stepIndex];
      const journeyId = `drip_${dripCampaignId}_${customerId}`;
      const journey = this.customerJourneys.get(journeyId);

      if (!journey || journey.status !== 'active') return false;

      // Send message or email
      let success = false;
      if (step.type === 'email') {
        success = await this.emailService.sendCustom(
          data.email || `customer_${customerId}@example.com`,
          step.subject,
          step.content,
          undefined,
          { ...step.variables, ...data }
        );
      } else if (step.type === 'message') {
        success = await this.messagingSystem.sendMessage(
          customerId,
          step.subject,
          step.content
        );
      }

      if (success) {
        // Update journey
        journey.completedSteps.push(step.id);
        journey.currentStep = stepIndex + 1;
        journey.lastActivity = new Date();

        this.customerJourneys.set(journeyId, journey);

        // Schedule next step if exists
        if (stepIndex + 1 < dripCampaign.steps.length) {
          const nextStep = dripCampaign.steps[stepIndex + 1];
          const delayMs = nextStep.delay * 24 * 60 * 60 * 1000; // Convert days to milliseconds

          setTimeout(async () => {
            await this.executeDripStep(dripCampaignId, customerId, stepIndex + 1, data);
          }, delayMs);
        } else {
          // Drip campaign completed for this customer
          journey.status = 'completed';
          this.customerJourneys.set(journeyId, journey);
        }
      }

      return success;
    } catch (error) {
      console.error('Error executing drip step:', error);
      return false;
    }
  }

  // Get campaign performance
  async getCampaignPerformance(campaignId: string): Promise<CampaignStats | null> {
    try {
      const campaign = this.campaigns.get(campaignId);
      if (!campaign) return null;

      return campaign.stats;
    } catch (error) {
      console.error('Error getting campaign performance:', error);
      return null;
    }
  }

  // Get customer journey
  getCustomerJourney(campaignId: string, customerId: number): CustomerJourney | null {
    const journeyId = `${campaignId}_${customerId}`;
    return this.customerJourneys.get(journeyId) || null;
  }

  // Pause customer journey
  async pauseCustomerJourney(campaignId: string, customerId: number): Promise<boolean> {
    try {
      const journeyId = `${campaignId}_${customerId}`;
      const journey = this.customerJourneys.get(journeyId);
      
      if (!journey) return false;

      journey.status = 'paused';
      journey.lastActivity = new Date();
      this.customerJourneys.set(journeyId, journey);

      return true;
    } catch (error) {
      console.error('Error pausing customer journey:', error);
      return false;
    }
  }

  // Resume customer journey
  async resumeCustomerJourney(campaignId: string, customerId: number): Promise<boolean> {
    try {
      const journeyId = `${campaignId}_${customerId}`;
      const journey = this.customerJourneys.get(journeyId);
      
      if (!journey || journey.status !== 'paused') return false;

      journey.status = 'active';
      journey.lastActivity = new Date();
      this.customerJourneys.set(journeyId, journey);

      // Continue from current step
      await this.executeCampaignStep(campaignId, customerId, journey.currentStep, journey.data);

      return true;
    } catch (error) {
      console.error('Error resuming customer journey:', error);
      return false;
    }
  }
}

// Default campaign manager instance
let campaignManager: CampaignManager | null = null;

export function getCampaignManager(): CampaignManager {
  if (!campaignManager) {
    campaignManager = new CampaignManager();
  }
  return campaignManager;
}

export default CampaignManager;

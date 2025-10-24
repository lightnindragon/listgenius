import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { emailCampaignManager } from '@/lib/email-campaign-manager';

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const status = searchParams.get('status') || 'all';

    // Mock data for now - replace with actual database queries
    const mockCampaigns = generateMockCampaigns(userId, type, status);
    const stats = calculateCampaignStats(mockCampaigns);

    return NextResponse.json({
      success: true,
      data: {
        campaigns: mockCampaigns,
        stats
      }
    });
  } catch (error: any) {
    console.error('Failed to fetch campaigns:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const campaignData = await request.json();
    const { name, type, subject, content, recipientSegment } = campaignData;

    // Create campaign using email campaign manager
    const campaign = await emailCampaignManager.createCampaign(userId, {
      name,
      type,
      status: 'draft',
      subject,
      content,
      template: 'default',
      recipientSegment
    });

    return NextResponse.json({
      success: true,
      data: campaign
    });
  } catch (error: any) {
    console.error('Failed to create campaign:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create campaign' },
      { status: 500 }
    );
  }
}

function generateMockCampaigns(userId: string, type: string, status: string) {
  const types = ['welcome', 'abandoned_cart', 'post_purchase', 'win_back', 'custom'];
  const statuses = ['draft', 'active', 'paused', 'completed'];
  const campaigns = [];

  for (let i = 1; i <= 8; i++) {
    const campaignType = types[Math.floor(Math.random() * types.length)];
    const campaignStatus = statuses[Math.floor(Math.random() * statuses.length)];

    // Filter by type and status if specified
    if (type !== 'all' && campaignType !== type) continue;
    if (status !== 'all' && campaignStatus !== status) continue;

    const campaign = {
      id: `campaign_${i}`,
      name: `${campaignType.charAt(0).toUpperCase() + campaignType.slice(1)} Campaign ${i}`,
      type: campaignType,
      status: campaignStatus,
      subject: `Your ${campaignType.replace('_', ' ')} email`,
      recipientSegment: 'all_customers',
      scheduledAt: campaignStatus === 'active' ? new Date().toISOString() : undefined,
      sentAt: campaignStatus === 'completed' ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : undefined,
      metrics: {
        sent: Math.floor(Math.random() * 1000) + 100,
        delivered: Math.floor(Math.random() * 900) + 90,
        opened: Math.floor(Math.random() * 300) + 50,
        clicked: Math.floor(Math.random() * 100) + 10,
        unsubscribed: Math.floor(Math.random() * 10),
        bounced: Math.floor(Math.random() * 20),
        openRate: Math.random() * 40 + 20, // 20-60%
        clickRate: Math.random() * 10 + 2, // 2-12%
        unsubscribeRate: Math.random() * 2 // 0-2%
      },
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
    };

    campaigns.push(campaign);
  }

  return campaigns;
}

function calculateCampaignStats(campaigns: any[]) {
  if (campaigns.length === 0) {
    return {
      totalCampaigns: 0,
      activeCampaigns: 0,
      totalSent: 0,
      averageOpenRate: 0,
      averageClickRate: 0,
      totalRevenue: 0
    };
  }

  const totalSent = campaigns.reduce((sum, campaign) => sum + campaign.metrics.sent, 0);
  const averageOpenRate = campaigns.reduce((sum, campaign) => sum + campaign.metrics.openRate, 0) / campaigns.length;
  const averageClickRate = campaigns.reduce((sum, campaign) => sum + campaign.metrics.clickRate, 0) / campaigns.length;
  const totalRevenue = campaigns.reduce((sum, campaign) => sum + (campaign.metrics.sent * campaign.metrics.clickRate * 0.1), 0); // Mock revenue calculation

  return {
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter(c => c.status === 'active').length,
    totalSent,
    averageOpenRate,
    averageClickRate,
    totalRevenue
  };
}

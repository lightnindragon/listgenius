import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { emailCampaignManager } from '@/lib/email-campaign-manager';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: campaignId } = await params;

    // Send campaign using email campaign manager
    const result = await emailCampaignManager.sendCampaign(campaignId);

    return NextResponse.json({
      success: true,
      data: {
        message: 'Campaign sent successfully',
        sent: result.sent,
        errors: result.errors
      }
    });
  } catch (error: any) {
    console.error('Failed to send campaign:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send campaign' },
      { status: 500 }
    );
  }
}

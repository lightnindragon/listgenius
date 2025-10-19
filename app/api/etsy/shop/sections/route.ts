import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { EtsyClient } from '@/lib/etsy';
import { getEtsyConnection } from '@/lib/clerk';
import { logger } from '@/lib/logger';
import { mockShopSections, simulateDelay } from '@/lib/mock-etsy-data';

// GET - Fetch shop sections
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const etsyConnection = await getEtsyConnection(userId);
    const isMockMode = process.env.ETSY_MOCK_MODE === "true";

    if (!etsyConnection.hasTokens && !isMockMode) {
      return NextResponse.json(
        { success: false, error: 'Etsy not connected' },
        { status: 400 }
      );
    }

    try {
      let sections;
      if (isMockMode) {
        await simulateDelay(200);
        sections = mockShopSections;
        logger.info('Using mock shop sections data', { userId, isMockMode, count: sections.length });
      } else {
        const etsyClient = new EtsyClient();
        sections = await etsyClient.getShopSections();
      }

      return NextResponse.json({
        success: true,
        data: { sections }
      });
    } catch (error: any) {
      logger.error('Failed to get shop sections', {
        userId,
        error: error.message
      });

      return NextResponse.json(
        { success: false, error: 'Failed to fetch shop sections from Etsy' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    logger.error('Failed to get shop sections', {
      userId: (await auth()).userId,
      error: error.message
    });

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { EtsyClient } from '@/lib/etsy';
import { getEtsyConnection } from '@/lib/clerk';
import { logger } from '@/lib/logger';
import { mockShippingProfiles, simulateDelay } from '@/lib/mock-etsy-data';

// GET - Fetch shipping profiles
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
      let shippingProfiles;
      if (isMockMode) {
        await simulateDelay(200);
        shippingProfiles = mockShippingProfiles;
        logger.info('Using mock shipping profiles data', { userId, isMockMode, count: shippingProfiles.length });
      } else {
        const etsyClient = new EtsyClient();
        shippingProfiles = await etsyClient.getShippingProfiles();
      }

      return NextResponse.json({
        success: true,
        data: { shippingProfiles }
      });
    } catch (error: any) {
      logger.error('Failed to get shipping profiles', {
        userId,
        error: error.message
      });

      return NextResponse.json(
        { success: false, error: 'Failed to fetch shipping profiles from Etsy' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    logger.error('Failed to get shipping profiles', {
      userId: (await auth()).userId,
      error: error.message
    });

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { EtsyClient } from '@/lib/etsy';
import { getEtsyConnection } from '@/lib/clerk';
import { logger } from '@/lib/logger';
import { EtsyAPIError } from '@/lib/errors';

/**
 * Get shop listings
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get Etsy connection
    const etsyConnection = await getEtsyConnection(userId);
    if (!etsyConnection.hasTokens) {
      return NextResponse.json(
        { success: false, error: 'Etsy not connected' },
        { status: 400 }
      );
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Initialize Etsy client
    const etsyClient = new EtsyClient();
    const isSandbox = etsyClient.getSandboxMode();

    logger.info('Fetching Etsy listings', { 
      userId, 
      shopId: etsyConnection.shopId,
      limit, 
      offset,
      isSandbox 
    });

    // Get listings from Etsy
    const listings = await etsyClient.getShopListings(limit, offset);

    return NextResponse.json({
      success: true,
      data: listings,
      isSandbox,
      metadata: {
        limit,
        offset,
        totalCount: listings.count || 0,
      },
    });

  } catch (error: any) {
    logger.error('Failed to fetch Etsy listings', { 
      userId: auth().userId,
      error: error.message,
      stack: error.stack 
    });

    if (error instanceof EtsyAPIError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}

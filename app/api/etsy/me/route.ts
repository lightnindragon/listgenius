import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { EtsyClient } from '@/lib/etsy';
import { getEtsyConnection } from '@/lib/clerk';
import { logger } from '@/lib/logger';
import { EtsyAPIError } from '@/lib/errors';
import { mockShopInfo } from '@/lib/mock-etsy-data';

/**
 * Get Etsy connection status and shop information
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get Etsy connection
    const etsyConnection = await getEtsyConnection(userId);
    const isMockMode = process.env.ETSY_MOCK_MODE === "true";
    
    // In mock mode, always show as connected
    if (!etsyConnection.hasTokens && !isMockMode) {
      return NextResponse.json({
        success: true,
        connected: false,
        isSandbox: process.env.ETSY_SANDBOX_MODE === "true",
      });
    }

    // Initialize Etsy client to get sandbox mode info
    const etsyClient = new EtsyClient();
    const isSandbox = etsyClient.getSandboxMode();

    try {
      let shopInfo;
      
      if (isMockMode) {
        // Use mock shop data
        shopInfo = mockShopInfo;
        logger.info('Using mock shop data', { userId, isMockMode });
      } else {
        // Get shop information to verify connection is still valid
        shopInfo = await etsyClient.getShopInfo();
      }

      logger.info('Etsy connection verified', { 
        userId, 
        shopId: etsyConnection.shopId,
        shopName: shopInfo.shop_name,
        isSandbox 
      });

      return NextResponse.json({
        success: true,
        connected: true,
        shopId: etsyConnection.shopId,
        shopName: shopInfo.shop_name,
        shopUrl: shopInfo.url,
        isSandbox,
        lastChecked: new Date().toISOString(),
      });

    } catch (error: any) {
      // If we can't get shop info, the connection might be invalid
      logger.warn('Etsy connection verification failed', { 
        userId, 
        shopId: etsyConnection.shopId,
        error: error.message,
        isSandbox 
      });

      return NextResponse.json({
        success: true,
        connected: false,
        error: 'Connection expired or invalid',
        isSandbox,
      });
    }

  } catch (error: any) {
    logger.error('Failed to check Etsy connection', { 
      userId: (await auth()).userId,
      error: error.message,
      stack: error.stack 
    });

    return NextResponse.json(
      { success: false, error: 'Failed to check connection status' },
      { status: 500 }
    );
  }
}

/**
 * Disconnect Etsy integration
 */
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get current user to update metadata
    const { currentUser } = await import('@clerk/nextjs/server');
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Clear Etsy connection data
    await user.update({
      publicMetadata: {
        ...user.publicMetadata,
        etsyShopId: undefined,
        etsyTokens: undefined,
        etsyShopName: undefined,
      },
    });

    logger.info('Etsy connection disconnected', { userId });

    return NextResponse.json({
      success: true,
      message: 'Etsy connection disconnected successfully',
    });

  } catch (error: any) {
    logger.error('Failed to disconnect Etsy', { 
      userId: (await auth()).userId,
      error: error.message,
      stack: error.stack 
    });

    return NextResponse.json(
      { success: false, error: 'Failed to disconnect Etsy' },
      { status: 500 }
    );
  }
}

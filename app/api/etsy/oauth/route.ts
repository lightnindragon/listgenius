import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { EtsyClient } from '@/lib/etsy';
import { updateEtsyConnection } from '@/lib/clerk';
import { logger } from '@/lib/logger';
import { EtsyAPIError } from '@/lib/errors';
import { z } from 'zod';

const oauthCallbackSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
  state: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    // Handle OAuth error
    if (error) {
      logger.warn('Etsy OAuth error', { userId, error });
      return NextResponse.redirect(
        new URL(`/settings?etsy_error=${encodeURIComponent(error)}`, request.url)
      );
    }

    // Validate required parameters
    const validation = oauthCallbackSchema.safeParse({ code, state });
    if (!validation.success) {
      logger.error('Invalid OAuth callback parameters', { 
        userId, 
        errors: validation.error.errors 
      });
      return NextResponse.redirect(
        new URL('/settings?etsy_error=invalid_callback', request.url)
      );
    }

    const { code: authCode } = validation.data;

    // Exchange code for tokens
    const tokenData = await EtsyClient.exchangeCodeForToken(authCode);
    
    // Get shop information
    const etsyClient = new EtsyClient(tokenData.access_token, tokenData.refresh_token);
    const shopInfo = await etsyClient.getShopInfo();

    // Store tokens and shop info in user metadata
    const tokensData = {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: Date.now() + (tokenData.expires_in * 1000),
    };

    await updateEtsyConnection(
      userId,
      shopInfo.shop_id.toString(),
      JSON.stringify(tokensData)
    );

    logger.info('Etsy OAuth completed successfully', { 
      userId, 
      shopId: shopInfo.shop_id,
      shopName: shopInfo.shop_name,
      isSandbox: etsyClient.getSandboxMode()
    });

    // Redirect to settings page with success message
    return NextResponse.redirect(
      new URL(`/settings?etsy_connected=true&shop_name=${encodeURIComponent(shopInfo.shop_name)}`, request.url)
    );

  } catch (error: any) {
    logger.error('Etsy OAuth failed', { 
      userId: auth().userId,
      error: error.message,
      stack: error.stack 
    });

    if (error instanceof EtsyAPIError) {
      return NextResponse.redirect(
        new URL(`/settings?etsy_error=${encodeURIComponent(error.message)}`, request.url)
      );
    }

    return NextResponse.redirect(
      new URL('/settings?etsy_error=oauth_failed', request.url)
    );
  }
}

/**
 * Initiate OAuth flow
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if Etsy is configured
    if (!process.env.ETSY_CLIENT_ID || !process.env.ETSY_REDIRECT_URI) {
      return NextResponse.json(
        { success: false, error: 'Etsy integration not configured' },
        { status: 500 }
      );
    }

    const isSandbox = process.env.ETSY_SANDBOX_MODE === "true";
    logger.info('Initiating Etsy OAuth flow', { userId, isSandbox });

    // Generate authorization URL
    const authUrl = EtsyClient.getAuthorizationUrl();

    return NextResponse.json({
      success: true,
      authUrl,
      isSandbox,
    });

  } catch (error: any) {
    logger.error('Failed to initiate Etsy OAuth', { 
      userId: auth().userId,
      error: error.message 
    });

    return NextResponse.json(
      { success: false, error: 'Failed to initiate OAuth flow' },
      { status: 500 }
    );
  }
}

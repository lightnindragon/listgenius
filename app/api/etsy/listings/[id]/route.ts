import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { EtsyClient } from '@/lib/etsy';
import { getEtsyConnection } from '@/lib/clerk';
import { logger } from '@/lib/logger';
import { EtsyAPIError } from '@/lib/errors';
import { mockListings } from '@/lib/mock-etsy-data';
import { z } from 'zod';

const updateListingSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  materials: z.array(z.string()).optional(),
  price: z.object({
    amount: z.number(),
    divisor: z.number(),
    currency_code: z.string(),
  }).optional(),
});

/**
 * Get specific listing
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const listingId = parseInt(id);
    if (isNaN(listingId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid listing ID' },
        { status: 400 }
      );
    }

    // Get Etsy connection
    const etsyConnection = await getEtsyConnection(userId);
    const isMockMode = process.env.ETSY_MOCK_MODE === "true";
    
    if (!etsyConnection.hasTokens && !isMockMode) {
      return NextResponse.json(
        { success: false, error: 'Etsy not connected' },
        { status: 400 }
      );
    }

    // Initialize Etsy client
    const etsyClient = new EtsyClient();
    const isSandbox = etsyClient.getSandboxMode();

    logger.info('Fetching Etsy listing', { 
      userId, 
      listingId,
      shopId: etsyConnection.shopId,
      isSandbox 
    });

    let listing;
    
    if (isMockMode) {
      // Use mock listing data
      listing = mockListings.find(l => l.listing_id === listingId);
      if (!listing) {
        return NextResponse.json(
          { success: false, error: 'Listing not found' },
          { status: 404 }
        );
      }
      logger.info('Using mock listing data', { userId, isMockMode, listingId });
    } else {
      // Get listing from Etsy
      listing = await etsyClient.getListing(listingId);
    }

    return NextResponse.json({
      success: true,
      data: listing,
      isSandbox,
    });

  } catch (error: any) {
    logger.error('Failed to fetch Etsy listing', { 
      userId: (await auth()).userId,
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
      { success: false, error: 'Failed to fetch listing' },
      { status: 500 }
    );
  }
}

/**
 * Update specific listing
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const listingId = parseInt(id);
    if (isNaN(listingId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid listing ID' },
        { status: 400 }
      );
    }

    // Get Etsy connection
    const etsyConnection = await getEtsyConnection(userId);
    const isMockMode = process.env.ETSY_MOCK_MODE === "true";
    
    if (!etsyConnection.hasTokens && !isMockMode) {
      return NextResponse.json(
        { success: false, error: 'Etsy not connected' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = updateListingSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const updateData = validation.data;

    // Initialize Etsy client
    const etsyClient = new EtsyClient();
    const isSandbox = etsyClient.getSandboxMode();

    logger.info('Updating Etsy listing', { 
      userId, 
      listingId,
      shopId: etsyConnection.shopId,
      updateFields: Object.keys(updateData),
      isSandbox 
    });

    let updatedListing;
    
    if (isMockMode) {
      // Use mock update response
      const mockListing = mockListings.find(l => l.listing_id === listingId);
      if (!mockListing) {
        return NextResponse.json(
          { success: false, error: 'Listing not found' },
          { status: 404 }
        );
      }
      
      // Simulate update by merging data
      updatedListing = {
        ...mockListing,
        ...updateData,
        last_modified_timestamp: Math.floor(Date.now() / 1000)
      };
      
      logger.info('Using mock listing update', { userId, isMockMode, listingId, updateFields: Object.keys(updateData) });
    } else {
      // Update listing on Etsy
      updatedListing = await etsyClient.updateListing(listingId, updateData);
    }

    return NextResponse.json({
      success: true,
      data: updatedListing,
      isSandbox,
    });

  } catch (error: any) {
    logger.error('Failed to update Etsy listing', { 
      userId: (await auth()).userId,
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
      { success: false, error: 'Failed to update listing' },
      { status: 500 }
    );
  }
}

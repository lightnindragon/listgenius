/**
 * Health Check API Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ListingHealthCheck } from '@/lib/health-check';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const checkListingSchema = z.object({
  listingId: z.number().positive(),
  listingData: z.object({
    title: z.string(),
    description: z.string(),
    tags: z.array(z.string()),
    images: z.array(z.any()),
    price: z.object({
      amount: z.number(),
      divisor: z.number(),
    }),
  }),
});

const bulkCheckSchema = z.object({
  listings: z.array(z.object({
    listingId: z.number().positive(),
    title: z.string(),
    description: z.string(),
    tags: z.array(z.string()),
    images: z.array(z.any()),
    price: z.object({
      amount: z.number(),
      divisor: z.number(),
    }),
  })),
});

// POST - Check single listing or bulk check
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const action = body.action;

    const healthCheck = new ListingHealthCheck();

    switch (action) {
      case 'single':
        return handleSingleCheck(request, userId, healthCheck);
      case 'bulk':
        return handleBulkCheck(request, userId, healthCheck);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    logger.error('Health check API error', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleSingleCheck(request: NextRequest, userId: string, healthCheck: ListingHealthCheck) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = checkListingSchema.safeParse({
      listingId: body.listingId,
      listingData: body.listingData,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { listingId, listingData } = validation.data;

    // Perform health check
    const result = await healthCheck.checkListing(listingId, listingData);

    logger.info('Single listing health check completed', {
      userId,
      listingId,
      result,
    });

    return NextResponse.json({
      success: true,
      data: {
        result,
        checkedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Single health check error', { error });
    return NextResponse.json(
      { error: 'Failed to perform health check' },
      { status: 500 }
    );
  }
}

async function handleBulkCheck(request: NextRequest, userId: string, healthCheck: ListingHealthCheck) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = bulkCheckSchema.safeParse({
      listings: body.listings,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { listings } = validation.data;

    // Extract listing IDs and data
    const listingIds = listings.map((l: any) => l.listingId);
    const listingsData = listings.map((l: any) => l);

    // Perform bulk health check
    const result = await healthCheck.bulkHealthCheck(listingIds, listingsData);

    logger.info('Bulk health check completed', {
      userId,
      totalListings: listings.length,
      result,
    });

    return NextResponse.json({
      success: true,
      data: {
        result,
        checkedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Bulk health check error', { error });
    return NextResponse.json(
      { error: 'Failed to perform bulk health check' },
      { status: 500 }
    );
  }
}

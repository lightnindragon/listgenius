import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { EtsyClient } from '@/lib/etsy';
import { getEtsyConnection } from '@/lib/clerk';
import { logger } from '@/lib/logger';
import {
  mockImages,
  handleMockImageUpload,
  handleMockImageDelete,
  handleMockImageReorder,
  simulateDelay
} from '@/lib/mock-etsy-data';

// GET - Fetch all images for a listing
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const listingId = parseInt(params.id);
    if (isNaN(listingId)) {
      return NextResponse.json({ success: false, error: 'Invalid listing ID' }, { status: 400 });
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
      let images;
      if (isMockMode) {
        await simulateDelay(300);
        images = mockImages.filter(img => img.listing_id === listingId);
        logger.info('Using mock images data', { userId, isMockMode, listingId, count: images.length });
      } else {
        const etsyClient = new EtsyClient();
        images = await etsyClient.getListingImages(listingId);
      }

      return NextResponse.json({
        success: true,
        data: { images }
      });
    } catch (error: any) {
      logger.error('Failed to get listing images', {
        userId,
        listingId,
        error: error.message
      });

      return NextResponse.json(
        { success: false, error: 'Failed to fetch images from Etsy' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    logger.error('Failed to get listing images', {
      userId: (await auth()).userId,
      error: error.message
    });

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Upload new image to listing
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const listingId = parseInt(params.id);
    if (isNaN(listingId)) {
      return NextResponse.json({ success: false, error: 'Invalid listing ID' }, { status: 400 });
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
      let uploadedImage;
      if (isMockMode) {
        await simulateDelay(800);
        const body = await request.json();
        uploadedImage = handleMockImageUpload(listingId, body);
        logger.info('Mock image uploaded', { userId, isMockMode, listingId, imageId: uploadedImage.listing_image_id });
      } else {
        const formData = await request.formData();
        const imageFile = formData.get('image') as File;
        
        if (!imageFile) {
          return NextResponse.json(
            { success: false, error: 'No image file provided' },
            { status: 400 }
          );
        }

        const etsyClient = new EtsyClient();
        uploadedImage = await etsyClient.uploadListingImage(listingId, imageFile);
      }

      return NextResponse.json({
        success: true,
        data: { image: uploadedImage }
      });
    } catch (error: any) {
      logger.error('Failed to upload listing image', {
        userId,
        listingId,
        error: error.message
      });

      return NextResponse.json(
        { success: false, error: 'Failed to upload image to Etsy' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    logger.error('Failed to upload listing image', {
      userId: (await auth()).userId,
      error: error.message
    });

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Reorder images or update image data
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const listingId = parseInt(params.id);
    if (isNaN(listingId)) {
      return NextResponse.json({ success: false, error: 'Invalid listing ID' }, { status: 400 });
    }

    const body = await request.json();
    const { image_ids } = body;

    if (!image_ids || !Array.isArray(image_ids)) {
      return NextResponse.json(
        { success: false, error: 'Invalid image_ids array' },
        { status: 400 }
      );
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
      let result;
      if (isMockMode) {
        await simulateDelay(400);
        result = handleMockImageReorder(listingId, image_ids);
        logger.info('Mock images reordered', { userId, isMockMode, listingId, imageCount: image_ids.length });
      } else {
        const etsyClient = new EtsyClient();
        result = await etsyClient.reorderListingImages(listingId, image_ids);
      }

      return NextResponse.json({
        success: true,
        data: { reordered: result }
      });
    } catch (error: any) {
      logger.error('Failed to reorder listing images', {
        userId,
        listingId,
        error: error.message
      });

      return NextResponse.json(
        { success: false, error: 'Failed to reorder images on Etsy' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    logger.error('Failed to reorder listing images', {
      userId: (await auth()).userId,
      error: error.message
    });

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}


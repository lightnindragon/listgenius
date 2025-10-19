import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { EtsyClient } from '@/lib/etsy';
import { getEtsyConnection } from '@/lib/clerk';
import { logger } from '@/lib/logger';
import { handleMockImageDelete, simulateDelay, mockImages } from '@/lib/mock-etsy-data';

// PUT - Update specific image (alt text, rank)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; imageId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const listingId = parseInt(params.id);
    const imageId = parseInt(params.imageId);
    
    if (isNaN(listingId) || isNaN(imageId)) {
      return NextResponse.json({ success: false, error: 'Invalid listing or image ID' }, { status: 400 });
    }

    const body = await request.json();
    const { alt_text, rank } = body;

    const etsyConnection = await getEtsyConnection(userId);
    const isMockMode = process.env.ETSY_MOCK_MODE === "true";

    if (!etsyConnection.hasTokens && !isMockMode) {
      return NextResponse.json(
        { success: false, error: 'Etsy not connected' },
        { status: 400 }
      );
    }

    try {
      let updatedImage;
      if (isMockMode) {
        await simulateDelay(300);
        // Find and update the image
        const image = mockImages.find(img => 
          img.listing_id === listingId && img.listing_image_id === imageId
        );
        
        if (image) {
          if (alt_text !== undefined) image.alt_text = alt_text;
          if (rank !== undefined) image.rank = rank;
          updatedImage = image;
        } else {
          return NextResponse.json(
            { success: false, error: 'Image not found' },
            { status: 404 }
          );
        }
        
        logger.info('Mock image updated', { userId, isMockMode, listingId, imageId });
      } else {
        const etsyClient = new EtsyClient();
        updatedImage = await etsyClient.updateListingImage(listingId, imageId, { alt_text, rank });
      }

      return NextResponse.json({
        success: true,
        data: { image: updatedImage }
      });
    } catch (error: any) {
      logger.error('Failed to update listing image', {
        userId,
        listingId,
        imageId,
        error: error.message
      });

      return NextResponse.json(
        { success: false, error: 'Failed to update image on Etsy' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    logger.error('Failed to update listing image', {
      userId: (await auth()).userId,
      error: error.message
    });

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete specific image
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; imageId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const listingId = parseInt(params.id);
    const imageId = parseInt(params.imageId);
    
    if (isNaN(listingId) || isNaN(imageId)) {
      return NextResponse.json({ success: false, error: 'Invalid listing or image ID' }, { status: 400 });
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
      let deleted;
      if (isMockMode) {
        await simulateDelay(300);
        deleted = handleMockImageDelete(listingId, imageId);
        logger.info('Mock image deleted', { userId, isMockMode, listingId, imageId, deleted });
        
        if (!deleted) {
          return NextResponse.json(
            { success: false, error: 'Image not found' },
            { status: 404 }
          );
        }
      } else {
        const etsyClient = new EtsyClient();
        await etsyClient.deleteListingImage(listingId, imageId);
        deleted = true;
      }

      return NextResponse.json({
        success: true,
        data: { deleted }
      });
    } catch (error: any) {
      logger.error('Failed to delete listing image', {
        userId,
        listingId,
        imageId,
        error: error.message
      });

      return NextResponse.json(
        { success: false, error: 'Failed to delete image from Etsy' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    logger.error('Failed to delete listing image', {
      userId: (await auth()).userId,
      error: error.message
    });

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}


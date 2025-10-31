import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';
import { uploadImageToBlob, deleteImageFromBlob } from '@/lib/blob-storage';
import { upscaleImageInMemory, analyzeImageQuality } from '@/lib/image-processing';
import { logger } from '@/lib/logger';

const prisma = new PrismaClient();

/**
 * POST - Upscale image to meet 2000px minimum requirement
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Find image and verify ownership
    const image = await prisma.uploadedImage.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!image) {
      return NextResponse.json(
        { success: false, error: 'Image not found' },
        { status: 404 }
      );
    }

    // Check if image needs upscaling
    if (image.width >= 2000 && image.height >= 2000) {
      return NextResponse.json(
        { success: false, error: 'Image already meets quality requirements (≥2000x2000px)' },
        { status: 400 }
      );
    }

    // Download image from blob storage
    const response = await fetch(image.blobUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch image from blob storage');
    }

    const imageBlob = await response.blob();
    const arrayBuffer = await imageBlob.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    // Upscale image
    const upscaled = await upscaleImageInMemory(imageBuffer, 2000);
    const newQuality = analyzeImageQuality(upscaled.width, upscaled.height);

    // Upload upscaled version to blob storage
    const { url: newBlobUrl, key: newBlobKey } = await uploadImageToBlob(
      upscaled.buffer,
      userId,
      image.filename
    );

    // Delete old blob
    await deleteImageFromBlob(image.blobKey);

    // Update database
    const updatedImage = await prisma.uploadedImage.update({
      where: { id },
      data: {
        blobUrl: newBlobUrl,
        blobKey: newBlobKey,
        width: upscaled.width,
        height: upscaled.height,
        quality: newQuality,
        originalWidth: image.width,
        originalHeight: image.height,
        upscaledAt: new Date(),
        fileSize: upscaled.buffer.length,
      },
    });

    logger.info('Image upscaled', {
      userId,
      imageId: id,
      original: `${image.width}x${image.height}`,
      upscaled: `${upscaled.width}x${upscaled.height}`,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedImage.id,
        url: updatedImage.blobUrl,
        width: updatedImage.width,
        height: updatedImage.height,
        quality: updatedImage.quality,
        originalWidth: updatedImage.originalWidth,
        originalHeight: updatedImage.originalHeight,
        upscaledAt: updatedImage.upscaledAt?.toISOString(),
      },
    });
  } catch (error: any) {
    logger.error('Failed to upscale image', {
      error: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      { success: false, error: 'Failed to upscale image' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';
import { uploadImageToBlob, deleteImageFromBlob } from '@/lib/blob-storage';
import { compressImageInMemory } from '@/lib/image-processing';
import { logger } from '@/lib/logger';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST - Compress image to reduce file size
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
    const body = await request.json();
    const quality = body.quality || 85;

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

    // Download image from blob storage
    const response = await fetch(image.blobUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch image from blob storage');
    }

    const imageBlob = await response.blob();
    const arrayBuffer = await imageBlob.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    // Compress image
    const compressed = await compressImageInMemory(imageBuffer, quality);

    // Upload compressed version to blob storage
    const { url: newBlobUrl, key: newBlobKey } = await uploadImageToBlob(
      compressed.buffer,
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
        fileSize: compressed.compressedSize,
      },
    });

    logger.info('Image compressed', {
      userId,
      imageId: id,
      originalSize: compressed.originalSize,
      compressedSize: compressed.compressedSize,
      ratio: `${compressed.ratio.toFixed(2)}%`,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedImage.id,
        url: updatedImage.blobUrl,
        fileSize: updatedImage.fileSize,
        compressionRatio: compressed.ratio,
        originalSize: compressed.originalSize,
        compressedSize: compressed.compressedSize,
      },
    });
  } catch (error: any) {
    logger.error('Failed to compress image', {
      error: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      { success: false, error: 'Failed to compress image' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}


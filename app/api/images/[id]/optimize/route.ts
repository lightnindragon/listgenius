import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';
import { uploadImageToBlob, deleteImageFromBlob } from '@/lib/blob-storage';
import { optimizeImageInMemory } from '@/lib/image-processing';
import { logger } from '@/lib/logger';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST - Optimize image with resize, format conversion, and quality settings
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
    const { width, height, format, quality } = body;

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

    // Optimize image
    const optimized = await optimizeImageInMemory(imageBuffer, {
      width,
      height,
      format,
      quality,
    });

    // Determine new filename with format extension
    const ext = format === 'webp' ? '.webp' : format === 'png' ? '.png' : '.jpg';
    const baseFilename = image.filename.replace(/\.[^.]+$/, '');
    const newFilename = `${baseFilename}${ext}`;

    // Upload optimized version to blob storage
    const { url: newBlobUrl, key: newBlobKey } = await uploadImageToBlob(
      optimized.buffer,
      userId,
      newFilename
    );

    // Delete old blob
    await deleteImageFromBlob(image.blobKey);

    // Update MIME type based on format
    const mimeTypes: Record<string, string> = {
      jpeg: 'image/jpeg',
      jpg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
    };
    const newMimeType = mimeTypes[format || 'jpeg'] || 'image/jpeg';

    // Update database
    const updatedImage = await prisma.uploadedImage.update({
      where: { id },
      data: {
        blobUrl: newBlobUrl,
        blobKey: newBlobKey,
        filename: newFilename,
        width: optimized.width,
        height: optimized.height,
        fileSize: optimized.size,
        mimeType: newMimeType,
      },
    });

    logger.info('Image optimized', {
      userId,
      imageId: id,
      format,
      quality,
      dimensions: `${optimized.width}x${optimized.height}`,
      size: optimized.size,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedImage.id,
        url: updatedImage.blobUrl,
        filename: updatedImage.filename,
        width: updatedImage.width,
        height: updatedImage.height,
        fileSize: updatedImage.fileSize,
        mimeType: updatedImage.mimeType,
      },
    });
  } catch (error: any) {
    logger.error('Failed to optimize image', {
      error: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      { success: false, error: 'Failed to optimize image' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const prisma = new PrismaClient();

/**
 * GET - Download image file
 */
export async function GET(
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

    // Fetch image from blob storage
    const response = await fetch(image.blobUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch image from blob storage');
    }

    const imageBlob = await response.blob();
    const arrayBuffer = await imageBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Update download count and timestamp
    await prisma.uploadedImage.update({
      where: { id },
      data: {
        downloadCount: {
          increment: 1,
        },
        lastDownloadedAt: new Date(),
      },
    });

    // Return image with appropriate headers
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': image.mimeType,
        'Content-Disposition': `attachment; filename="${image.filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error: any) {
    logger.error('Failed to download image', {
      error: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      { success: false, error: 'Failed to download image' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}


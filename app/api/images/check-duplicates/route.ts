import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';
import crypto from 'crypto';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST - Check for duplicate images by comparing image hashes
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { imageId } = await request.json();

    if (!imageId) {
      return NextResponse.json(
        { success: false, error: 'Image ID required' },
        { status: 400 }
      );
    }

    // Get the image
    const image = await prisma.uploadedImage.findFirst({
      where: {
        id: imageId,
        userId,
      },
    });

    if (!image) {
      return NextResponse.json(
        { success: false, error: 'Image not found' },
        { status: 404 }
      );
    }

    // Fetch image and calculate hash
    const response = await fetch(image.blobUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch image');
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');

    // Check for other images with same hash (stored in editHistory or calculate for all)
    // For now, we'll check by comparing file sizes and dimensions as a quick check
    // Full hash comparison would require storing hashes in database
    const similarImages = await prisma.uploadedImage.findMany({
      where: {
        userId,
        id: { not: imageId },
        fileSize: image.fileSize,
        width: image.width,
        height: image.height,
      },
      select: {
        id: true,
        filename: true,
        blobUrl: true,
        createdAt: true,
      },
    });

    // Check actual duplicates by comparing first 1KB (quick comparison)
    const quickHash = crypto.createHash('sha256').update(buffer.slice(0, 1024)).digest('hex');
    const duplicates: any[] = [];

    for (const similar of similarImages) {
      try {
        const similarResponse = await fetch(similar.blobUrl);
        if (similarResponse.ok) {
          const similarBuffer = Buffer.from(await similarResponse.arrayBuffer());
          const similarQuickHash = crypto.createHash('sha256').update(similarBuffer.slice(0, 1024)).digest('hex');
          
          if (quickHash === similarQuickHash) {
            // Full comparison
            const fullHash = crypto.createHash('sha256').update(similarBuffer).digest('hex');
            if (hash === fullHash) {
              duplicates.push({
                id: similar.id,
                filename: similar.filename,
                createdAt: similar.createdAt.toISOString(),
              });
            }
          }
        }
      } catch (error) {
        // Skip errors
      }
    }

    logger.info('Duplicate check completed', {
      userId,
      imageId,
      duplicatesFound: duplicates.length,
    });

    return NextResponse.json({
      success: true,
      data: {
        hasDuplicates: duplicates.length > 0,
        duplicates,
      },
    });
  } catch (error: any) {
    logger.error('Failed to check duplicates', {
      error: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      { success: false, error: 'Failed to check duplicates' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}


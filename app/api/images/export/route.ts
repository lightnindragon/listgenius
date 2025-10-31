import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';
import archiver from 'archiver';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST - Export selected images as ZIP file
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { imageIds } = await request.json();

    if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No images selected' },
        { status: 400 }
      );
    }

    // Verify ownership and fetch images
    const images = await prisma.uploadedImage.findMany({
      where: {
        id: { in: imageIds },
        userId,
      },
    });

    if (images.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No images found' },
        { status: 404 }
      );
    }

    // Create ZIP archive using streams
    const archive = archiver('zip', { zlib: { level: 9 } });
    const chunks: Buffer[] = [];
    let archiveError: Error | null = null;

    archive.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    archive.on('error', (err) => {
      archiveError = err;
      logger.error('Archive error', { error: err.message });
    });

    // Fetch and add each image to the ZIP
    const imagePromises = images.map(async (image) => {
      try {
        const response = await fetch(image.blobUrl);
        if (response.ok) {
          const buffer = Buffer.from(await response.arrayBuffer());
          archive.append(buffer, { name: image.filename });
        }
      } catch (error) {
        logger.warn('Failed to fetch image for export', {
          imageId: image.id,
          error: (error as Error).message,
        });
      }
    });

    await Promise.all(imagePromises);

    // Finalize and wait for completion
    await archive.finalize();

    // Wait for all data to be collected
    await new Promise<void>((resolve, reject) => {
      if (archiveError) {
        reject(archiveError);
        return;
      }
      archive.on('end', () => resolve());
      archive.on('error', (err) => reject(err));
    });

    if (archiveError) {
      throw archiveError;
    }

    // Combine all chunks
    const zipBuffer = Buffer.concat(chunks);

    logger.info('Images exported', {
      userId,
      count: images.length,
      size: zipBuffer.length,
    });

    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="images-export-${Date.now()}.zip"`,
        'Content-Length': zipBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    logger.error('Failed to export images', {
      error: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      { success: false, error: 'Failed to export images' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}


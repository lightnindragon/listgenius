import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';
import archiver from 'archiver';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Maximum execution time for Vercel (60 seconds for Pro, 10 for Hobby)
const MAX_EXECUTION_TIME = 50000; // 50 seconds to be safe

/**
 * POST - Export selected images as ZIP file
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
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

    // Limit the number of images to prevent timeouts
    if (imageIds.length > 50) {
      return NextResponse.json(
        { success: false, error: 'Too many images. Please select 50 or fewer images.' },
        { status: 400 }
      );
    }

    // Verify ownership and fetch images
    const images = await prisma.uploadedImage.findMany({
      where: {
        id: { in: imageIds },
        userId,
      },
      select: {
        id: true,
        filename: true,
        blobUrl: true,
      },
    });

    if (images.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No images found' },
        { status: 404 }
      );
    }

    logger.info('Starting image export', {
      userId,
      count: images.length,
    });

    // Fetch all images first (with timeout protection)
    const imageBuffers: Array<{ filename: string; buffer: Buffer }> = [];
    
    for (let i = 0; i < images.length; i++) {
      // Check execution time
      if (Date.now() - startTime > MAX_EXECUTION_TIME) {
        throw new Error('Export timeout: Operation took too long');
      }

      const image = images[i];
      
      try {
        // Fetch image with timeout
        const fetchController = new AbortController();
        const timeoutId = setTimeout(() => fetchController.abort(), 30000); // 30s timeout per image

        const response = await fetch(image.blobUrl, {
          signal: fetchController.signal,
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          logger.warn('Failed to fetch image', {
            imageId: image.id,
            status: response.status,
          });
          continue;
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        imageBuffers.push({ filename: image.filename, buffer });

        logger.debug('Fetched image for export', { imageId: image.id });
      } catch (error: any) {
        if (error.name === 'AbortError') {
          logger.warn('Image fetch timeout', { imageId: image.id });
        } else {
          logger.warn('Failed to fetch image for export', {
            imageId: image.id,
            error: error.message,
          });
        }
        // Continue with next image
      }
    }

    if (imageBuffers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No images could be fetched' },
        { status: 404 }
      );
    }

    // Create a readable stream for the response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Create ZIP archive
          const archive = archiver('zip', {
            zlib: { level: 6 }, // Reduced compression level for speed
          });

          let archiveFinished = false;
          let archiveError: Error | null = null;

          // Set up event handlers BEFORE any operations
          archive.on('error', (err) => {
            archiveError = err;
            logger.error('Archive error during streaming', { error: err.message });
            if (!archiveFinished) {
              try {
                controller.error(err);
              } catch {
                // Controller might already be closed
              }
            }
          });

          archive.on('data', (chunk: Buffer) => {
            try {
              if (!archiveFinished) {
                controller.enqueue(chunk);
              }
            } catch (error) {
              logger.error('Error enqueuing chunk', { error: (error as Error).message });
              if (!archiveFinished) {
                try {
                  controller.error(error);
                } catch {
                  // Controller might already be closed
                }
              }
            }
          });

          archive.on('end', () => {
            archiveFinished = true;
            logger.info('Archive stream ended');
            try {
              controller.close();
            } catch (error) {
              // Controller might already be closed
            }
          });

          // Add all images to archive
          for (const { filename, buffer } of imageBuffers) {
            archive.append(buffer, { name: filename });
          }

          // Finalize the archive (this triggers the data and end events)
          await archive.finalize();

          // Wait a bit to ensure all data is flushed
          // The 'end' event will close the controller
        } catch (error: any) {
          logger.error('Error in export stream', {
            error: error.message,
            stack: error.stack,
          });
          if (!archiveFinished) {
            try {
              controller.error(error);
            } catch {
              // Controller might already be closed
            }
          }
        }
      },
    });

    logger.info('Export stream created', {
      userId,
      count: imageBuffers.length,
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="images-export-${Date.now()}.zip"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: any) {
    logger.error('Failed to export images', {
      error: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to export images' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

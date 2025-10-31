import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { deleteImageFromBlob } from '@/lib/blob-storage';
import { logger } from '@/lib/logger';

const prisma = new PrismaClient();

/**
 * GET - Cleanup expired images (called by Vercel cron)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret if provided
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'default-cron-secret';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      logger.warn('Unauthorized cron request', {
        hasAuth: !!authHeader,
      });
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    logger.info('Image cleanup cron job started');

    // Find expired images
    const expiredImages = await prisma.uploadedImage.findMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
      select: {
        id: true,
        blobKey: true,
        userId: true,
        filename: true,
      },
    });

    logger.info('Found expired images', { count: expiredImages.length });

    let deletedCount = 0;
    let errorCount = 0;

    // Delete each expired image
    for (const image of expiredImages) {
      try {
        // Delete from blob storage
        await deleteImageFromBlob(image.blobKey);

        // Delete from database
        await prisma.uploadedImage.delete({
          where: { id: image.id },
        });

        deletedCount++;
      } catch (error: any) {
        errorCount++;
        logger.error('Failed to delete expired image', {
          imageId: image.id,
          blobKey: image.blobKey,
          error: error.message,
        });
      }
    }

    // Also find images expiring in 2 hours for notifications
    const twoHoursFromNow = new Date();
    twoHoursFromNow.setHours(twoHoursFromNow.getHours() + 2);

    const expiringSoon = await prisma.uploadedImage.findMany({
      where: {
        expiresAt: {
          gte: new Date(),
          lte: twoHoursFromNow,
        },
      },
      select: {
        id: true,
        userId: true,
        filename: true,
        expiresAt: true,
      },
    });

    logger.info('Image cleanup cron job completed', {
      deleted: deletedCount,
      errors: errorCount,
      expiringSoon: expiringSoon.length,
    });

    return NextResponse.json({
      success: true,
      data: {
        deleted: deletedCount,
        errors: errorCount,
        expiringSoon: expiringSoon.length,
      },
    });
  } catch (error: any) {
    logger.error('Image cleanup cron job failed', {
      error: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      { success: false, error: 'Cleanup job failed' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}


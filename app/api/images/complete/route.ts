import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80);
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const {
      blobUrl,
      blobKey,
      originalFilename,
      width,
      height,
      fileSize,
      mimeType,
    } = await request.json();

    if (!blobUrl || !blobKey || !originalFilename) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400 }
      );
    }

    const baseName = originalFilename.replace(/\.[^.]+$/, '');
    const ext = (originalFilename.match(/\.[^.]+$/)?.[0] || '').toLowerCase() || '.jpg';
    const sizePart = width && height ? `${width}x${height}` : 'image';
    const seoFilename = `${slugify(baseName)}-${sizePart}${ext}`;

    const highEnough = typeof width === 'number' && typeof height === 'number' && width >= 2000 && height >= 2000;
    const quality: 'poor' | 'high' = highEnough ? 'high' : 'poor';
    const needsUpscale = !highEnough;

    // Simple alt text fallback from filename; callers can overwrite later
    const fallbackAlt = baseName
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^\w/, (c) => c.toUpperCase());

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: blobKey,
          filename: seoFilename,
          altText: fallbackAlt,
          url: blobUrl,
          width: width || 0,
          height: height || 0,
          quality,
          needsUpscale,
          expiresAt,
          // Debug metadata (not used by UI but useful if needed)
          _meta: { fileSize, mimeType },
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error?.message || 'Failed to process image' }),
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDailyImageUploadCount, incrementDailyImageUploadCount } from '@/lib/clerk';
import { checkImageUploadLimit } from '@/lib/image-limits';
import { moderateImage, generateImageFilename, generateImageAltText, analyzeImageQuality } from '@/lib/image-ai';
import { getImageDimensions } from '@/lib/image-processing';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const prisma = new PrismaClient();

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST - Complete upload by processing image metadata and saving to database
 * This is called after the client uploads directly to Vercel Blob
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { blobUrl, blobKey, originalFilename, width, height, fileSize, mimeType } = body;

    if (!blobUrl || !blobKey) {
      return NextResponse.json(
        { success: false, error: 'Blob URL and key are required' },
        { status: 400 }
      );
    }

    // Check daily upload limit
    const currentCount = await getDailyImageUploadCount(userId);
    const limitCheck = await checkImageUploadLimit(userId, currentCount);
    
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { success: false, error: limitCheck.error },
        { status: 429 }
      );
    }

    // Fetch image from blob to get buffer for moderation and AI processing
    let imageBuffer: Buffer;
    try {
      const response = await fetch(blobUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch image from blob');
      }
      const arrayBuffer = await response.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    } catch (error: any) {
      logger.error('Failed to fetch image for processing', { blobUrl, error: error.message });
      return NextResponse.json(
        { success: false, error: 'Failed to process uploaded image' },
        { status: 500 }
      );
    }

    // Get dimensions if not provided
    let finalWidth = width;
    let finalHeight = height;
    if (!finalWidth || !finalHeight) {
      const dimensions = await getImageDimensions(imageBuffer);
      finalWidth = dimensions.width;
      finalHeight = dimensions.height;
    }

    const quality = analyzeImageQuality(finalWidth, finalHeight);
    const needsUpscale = quality === 'poor';

    // Moderate image content
    const moderation = await moderateImage(imageBuffer);
    if (!moderation.approved) {
      logger.warn('Image rejected by moderation', {
        userId,
        blobUrl,
        reason: moderation.reason,
      });
      return NextResponse.json(
        { success: false, error: moderation.reason || 'Image contains inappropriate content' },
        { status: 400 }
      );
    }

    // Generate AI filename and alt text
    let generatedFilename = await generateImageFilename(blobUrl);
    let altText = await generateImageAltText(blobUrl);

    // Ensure filename has extension
    const fileExtension = originalFilename.split('.').pop() || 'jpg';
    if (!generatedFilename.includes('.')) {
      generatedFilename = `${generatedFilename}.${fileExtension}`;
    }

    // Calculate expiration (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Save to database
    const image = await prisma.uploadedImage.create({
      data: {
        userId,
        filename: generatedFilename,
        originalFilename: originalFilename || generatedFilename,
        blobUrl,
        blobKey,
        altText,
        generatedFilename,
        width: finalWidth,
        height: finalHeight,
        quality,
        moderationStatus: 'approved',
        fileSize: fileSize || imageBuffer.length,
        mimeType: mimeType || 'image/jpeg',
        expiresAt,
      },
    });

    // Increment upload count
    await incrementDailyImageUploadCount(userId, 1);

    logger.info('Image upload completed', {
      userId,
      imageId: image.id,
      filename: image.filename,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: image.id,
        filename: image.filename,
        altText: image.altText,
        url: image.blobUrl,
        width: image.width,
        height: image.height,
        quality: image.quality,
        needsUpscale,
        expiresAt: image.expiresAt.toISOString(),
      },
    });
  } catch (error: any) {
    logger.error('Failed to complete image upload', {
      error: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to complete image upload' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}


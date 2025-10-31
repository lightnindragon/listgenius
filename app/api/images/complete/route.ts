import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { generateImageAltText } from '@/lib/openai';

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
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
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
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const baseName = originalFilename.replace(/\.[^.]+$/, '');
    const ext = (originalFilename.match(/\.[^.]+$/)?.[0] || '').toLowerCase() || '.jpg';
    const sizePart = width && height ? `${width}x${height}` : 'image';
    const seoFilename = `${slugify(baseName)}-${sizePart}${ext}`;

    const highEnough = typeof width === 'number' && typeof height === 'number' && width >= 2000 && height >= 2000;
    const quality: 'poor' | 'high' = highEnough ? 'high' : 'poor';

    // Generate AI alt text using OpenAI Vision
    let altText: string;
    try {
      const context = `${baseName} - Product image`;
      altText = await generateImageAltText(blobUrl, context);
      logger.info('AI alt text generated for image', { userId, blobKey, altTextLength: altText.length });
    } catch (error: any) {
      // Fallback to filename-based alt text if AI generation fails
      logger.warn('Failed to generate AI alt text, using fallback', { 
        userId, 
        blobKey, 
        error: error.message 
      });
      altText = baseName
        .replace(/[-_]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/^\w/, (c) => c.toUpperCase());
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    // Save image to database
    const uploadedImage = await prisma.uploadedImage.create({
      data: {
        userId,
        filename: seoFilename,
        originalFilename,
        blobUrl,
        blobKey,
        altText,
        generatedFilename: seoFilename,
        width: width || 0,
        height: height || 0,
        quality,
        moderationStatus: 'approved', // Auto-approve for now
        fileSize: fileSize || 0,
        mimeType: mimeType || 'image/jpeg',
        tags: [],
        expiresAt,
      },
    });

    logger.info('Image saved to database', { userId, imageId: uploadedImage.id, blobKey });

    return NextResponse.json({
      success: true,
      data: {
        id: uploadedImage.id,
        filename: uploadedImage.filename,
        originalFilename: uploadedImage.originalFilename,
        altText: uploadedImage.altText,
        url: uploadedImage.blobUrl,
        width: uploadedImage.width,
        height: uploadedImage.height,
        quality: uploadedImage.quality,
        fileSize: uploadedImage.fileSize,
        mimeType: uploadedImage.mimeType,
        createdAt: uploadedImage.createdAt.toISOString(),
        expiresAt: uploadedImage.expiresAt.toISOString(),
      },
    });
  } catch (error: any) {
    logger.error('Failed to complete image upload', {
      error: error.message,
      stack: error.stack,
      userId: (await auth()).userId,
    });
    
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to process image' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
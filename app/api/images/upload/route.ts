import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDailyImageUploadCount, incrementDailyImageUploadCount } from '@/lib/clerk';
import { checkImageUploadLimit } from '@/lib/image-limits';
import { uploadImageToBlob, validateImageFile, deleteImageFromBlob } from '@/lib/blob-storage';
import { moderateImage, generateImageFilename, generateImageAltText, analyzeImageQuality } from '@/lib/image-ai';
import { getImageDimensions } from '@/lib/image-processing';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';
import sharp from 'sharp';

const prisma = new PrismaClient();

const MAX_IMAGES_PER_REQUEST = 20;

// Force Node.js runtime for FormData support
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Configure body parsing
export const maxDuration = 300; // 5 minutes for large uploads

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
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

    // Log request details for debugging
    const contentType = request.headers.get('content-type') || 'unknown';
    logger.info('Image upload request received', {
      userId,
      contentType,
      hasContentLength: !!request.headers.get('content-length'),
      url: request.url
    });

    // Parse FormData
    let formData: FormData;
    try {
      // Next.js 15 should handle FormData automatically
      formData = await request.formData();
      logger.info('FormData parsed successfully', {
        userId,
        fieldCount: Array.from(formData.keys()).length
      });
    } catch (error: any) {
      logger.error('Failed to parse FormData', { 
        error: error.message,
        errorName: error.name,
        contentType,
        url: request.url,
        method: request.method,
        contentLength: request.headers.get('content-length'),
        allHeaders: Object.fromEntries(request.headers.entries()),
        stack: error.stack 
      });
      
      // Return more helpful error message
      return NextResponse.json(
        { 
          success: false, 
          error: `Failed to parse FormData: ${error.message}`,
          hint: 'This might be a Next.js 15/Turbopack issue. Try restarting the dev server or disabling Turbopack.'
        },
        { status: 400 }
      );
    }

    // Get all files from FormData
    const files = formData.getAll('images') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No images provided' },
        { status: 400 }
      );
    }

    if (files.length > MAX_IMAGES_PER_REQUEST) {
      return NextResponse.json(
        { success: false, error: `Maximum ${MAX_IMAGES_PER_REQUEST} images per request` },
        { status: 400 }
      );
    }

    // Validate all files
    for (const file of files) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        return NextResponse.json(
          { success: false, error: validation.error },
          { status: 400 }
        );
      }
    }

    const uploadedImages = [];
    let successCount = 0;
    let failedCount = 0;

    // Process each image
    for (const file of files) {
      try {
        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const imageBuffer = Buffer.from(arrayBuffer);

        // Get image dimensions and quality
        const dimensions = await getImageDimensions(imageBuffer);
        const quality = analyzeImageQuality(dimensions.width, dimensions.height);

        // Check quality and warn if poor
        const needsUpscale = quality === 'poor';

        // Moderate image content
        const moderation = await moderateImage(imageBuffer);
        if (!moderation.approved) {
          failedCount++;
          logger.warn('Image rejected by moderation', {
            userId,
            filename: file.name,
            reason: moderation.reason,
          });
          continue;
        }

        // Generate AI filename and alt text using blob URL
        // Upload to blob first to get URL for AI analysis
        const { url: tempBlobUrl, key: tempBlobKey } = await uploadImageToBlob(
          imageBuffer,
          userId,
          `temp-${Date.now()}-${file.name}`
        );

        let generatedFilename = await generateImageFilename(tempBlobUrl);
        let altText = await generateImageAltText(tempBlobUrl);

        // Delete temporary blob
        await deleteImageFromBlob(tempBlobKey);

        // Ensure filename has extension
        const fileExtension = file.name.split('.').pop() || 'jpg';
        if (!generatedFilename.includes('.')) {
          generatedFilename = `${generatedFilename}.${fileExtension}`;
        }

        // Upload to blob storage
        const { url: blobUrl, key: blobKey } = await uploadImageToBlob(
          imageBuffer,
          userId,
          generatedFilename
        );

        // Calculate expiration (24 hours from now)
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        // Save to database
        const image = await prisma.uploadedImage.create({
          data: {
            userId,
            filename: generatedFilename,
            originalFilename: file.name,
            blobUrl,
            blobKey,
            altText,
            generatedFilename,
            width: dimensions.width,
            height: dimensions.height,
            quality,
            moderationStatus: 'approved',
            fileSize: file.size,
            mimeType: file.type,
            expiresAt,
          },
        });

        uploadedImages.push({
          id: image.id,
          filename: image.filename,
          altText: image.altText,
          url: image.blobUrl,
          width: image.width,
          height: image.height,
          quality: image.quality,
          needsUpscale,
          expiresAt: image.expiresAt.toISOString(),
        });

        successCount++;
      } catch (error: any) {
        failedCount++;
        logger.error('Failed to process image', {
          userId,
          filename: file.name,
          error: error.message,
        });
      }
    }

    // Increment upload count only for successful uploads
    if (successCount > 0) {
      await incrementDailyImageUploadCount(userId, successCount);
    }

    return NextResponse.json({
      success: true,
      data: {
        images: uploadedImages,
        stats: {
          total: files.length,
          successful: successCount,
          failed: failedCount,
        },
      },
    });
  } catch (error: any) {
    logger.error('Image upload failed', {
      error: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to upload images' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}


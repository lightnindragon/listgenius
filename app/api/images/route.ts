import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const quality = searchParams.get('quality'); // 'poor' | 'high'
    const status = searchParams.get('status'); // 'approved' | 'rejected' | 'pending'
    const category = searchParams.get('category');
    const tags = searchParams.get('tags'); // comma-separated
    const favorite = searchParams.get('favorite') === 'true';
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt'; // 'createdAt' | 'size' | 'downloads' | 'quality' | 'filename'
    const sortOrder = searchParams.get('sortOrder') || 'desc'; // 'asc' | 'desc'

    // Build where clause
    const where: any = {
      userId,
      expiresAt: {
        gt: new Date(), // Only non-expired images
      },
    };

    if (quality) {
      where.quality = quality;
    }

    if (status) {
      where.moderationStatus = status;
    }

    if (category) {
      where.category = category;
    }

    if (tags) {
      const tagArray = tags.split(',').map(t => t.trim());
      where.tags = {
        hasSome: tagArray,
      };
    }

    if (favorite) {
      where.isFavorite = true;
    }

    if (search) {
      where.OR = [
        { filename: { contains: search, mode: 'insensitive' } },
        { altText: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Build orderBy
    const orderBy: any = {};
    if (sortBy === 'filename') {
      orderBy.filename = sortOrder;
    } else if (sortBy === 'size') {
      orderBy.fileSize = sortOrder;
    } else if (sortBy === 'downloads') {
      orderBy.downloadCount = sortOrder;
    } else if (sortBy === 'quality') {
      orderBy.quality = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    // Get total count
    const total = await prisma.uploadedImage.count({ where });

    // Get images
    const images = await prisma.uploadedImage.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: {
        images: images.map(img => ({
          id: img.id,
          filename: img.filename,
          originalFilename: img.originalFilename,
          url: img.blobUrl,
          altText: img.altText,
          generatedFilename: img.generatedFilename,
          width: img.width,
          height: img.height,
          quality: img.quality,
          moderationStatus: img.moderationStatus,
          fileSize: img.fileSize,
          mimeType: img.mimeType,
          tags: img.tags,
          category: img.category,
          isFavorite: img.isFavorite,
          downloadCount: img.downloadCount,
          lastDownloadedAt: img.lastDownloadedAt?.toISOString(),
          isFilenameEdited: img.isFilenameEdited,
          isAltTextEdited: img.isAltTextEdited,
          createdAt: img.createdAt.toISOString(),
          expiresAt: img.expiresAt.toISOString(),
          upscaledAt: img.upscaledAt?.toISOString(),
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    logger.error('Failed to list images', {
      error: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      { success: false, error: 'Failed to retrieve images' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}


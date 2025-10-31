import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';
import { deleteImageFromBlob } from '@/lib/blob-storage';
import { logger } from '@/lib/logger';

const prisma = new PrismaClient();

/**
 * PUT - Update image metadata (filename, alt text, tags, category, favorite)
 */
export async function PUT(
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

    // Prepare update data
    const updateData: any = {};
    
    if (body.filename !== undefined) {
      // Validate filename
      if (body.filename.length < 1 || body.filename.length > 255) {
        return NextResponse.json(
          { success: false, error: 'Filename must be between 1 and 255 characters' },
          { status: 400 }
        );
      }
      updateData.filename = body.filename;
      updateData.isFilenameEdited = true;
      
      // Update edit history
      const editHistory = image.editHistory ? JSON.parse(image.editHistory) : [];
      editHistory.push({
        type: 'filename',
        old: image.filename,
        new: body.filename,
        timestamp: new Date().toISOString(),
      });
      updateData.editHistory = JSON.stringify(editHistory);
    }

    if (body.altText !== undefined) {
      // Validate alt text length (max 500 chars)
      if (body.altText.length > 500) {
        return NextResponse.json(
          { success: false, error: 'Alt text must be 500 characters or less' },
          { status: 400 }
        );
      }
      updateData.altText = body.altText;
      updateData.isAltTextEdited = true;
      
      // Update edit history
      const editHistory = image.editHistory ? JSON.parse(image.editHistory) : [];
      editHistory.push({
        type: 'altText',
        old: image.altText,
        new: body.altText,
        timestamp: new Date().toISOString(),
      });
      updateData.editHistory = JSON.stringify(editHistory);
    }

    if (body.tags !== undefined) {
      updateData.tags = Array.isArray(body.tags) ? body.tags : [];
    }

    if (body.category !== undefined) {
      updateData.category = body.category || null;
    }

    if (body.isFavorite !== undefined) {
      updateData.isFavorite = Boolean(body.isFavorite);
    }

    if (body.order !== undefined) {
      updateData.order = parseInt(body.order) || 0;
    }

    // Update image
    const updatedImage = await prisma.uploadedImage.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedImage.id,
        filename: updatedImage.filename,
        altText: updatedImage.altText,
        tags: updatedImage.tags,
        category: updatedImage.category,
        isFavorite: updatedImage.isFavorite,
        order: updatedImage.order,
        isFilenameEdited: updatedImage.isFilenameEdited,
        isAltTextEdited: updatedImage.isAltTextEdited,
      },
    });
  } catch (error: any) {
    logger.error('Failed to update image', {
      error: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      { success: false, error: 'Failed to update image' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * DELETE - Delete image
 */
export async function DELETE(
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

    // Delete from blob storage
    await deleteImageFromBlob(image.blobKey);

    // Delete from database
    await prisma.uploadedImage.delete({
      where: { id },
    });

    logger.info('Image deleted', { userId, imageId: id });

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error: any) {
    logger.error('Failed to delete image', {
      error: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      { success: false, error: 'Failed to delete image' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}


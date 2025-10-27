import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin';
import { logger } from '@/lib/logger';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check admin authentication
    requireAdmin(request);
    
    const { id } = await params;
    
    // Check if post exists
    const existingPost = await prisma.blogPost.findUnique({
      where: { id },
      select: { id: true, title: true }
    });
    
    if (!existingPost) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }
    
    // Delete post (cascade will handle images and comments)
    await prisma.blogPost.delete({
      where: { id }
    });
    
    logger.info('Blog post deleted by admin', { 
      postId: id, 
      title: existingPost.title 
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Admin authentication required') {
      return NextResponse.json(
        { success: false, error: 'Admin authentication required' },
        { status: 401 }
      );
    }
    
    logger.error('Error deleting blog post', { 
      postId: (await params).id, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    
    return NextResponse.json(
      { success: false, error: 'Failed to delete blog post' },
      { status: 500 }
    );
  }
}

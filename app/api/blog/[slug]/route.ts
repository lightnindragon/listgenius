import { auth } from '@clerk/nextjs/server';
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { isAdminAuthenticated } from '@/lib/admin';

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    
    const post = await prisma.blogPost.findUnique({
      where: { slug },
      include: {
        images: {
          orderBy: { order: 'asc' }
        },
        comments: {
          where: { status: 'approved' },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }
    
    // Increment view count
    await prisma.blogPost.update({
      where: { id: post.id },
      data: { views: { increment: 1 } }
    });
    
    return NextResponse.json({ success: true, data: post });
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch blog post' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    // Check admin authentication
    if (!isAdminAuthenticated(req)) {
      return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 });
    }
    
    const { slug } = await params;
    const body = await req.json();
    
    // Check if post exists
    const existingPost = await prisma.blogPost.findUnique({
      where: { slug },
      select: { userId: true, id: true, publishedAt: true }
    });
    
    if (!existingPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }
    
    const {
      title,
      excerpt,
      content,
      featuredImage,
      status,
      tags = [],
      category,
      seoTitle,
      seoDescription,
      seoKeywords = [],
      images = []
    } = body;
    
    // Update post
    const post = await prisma.blogPost.update({
      where: { id: existingPost.id },
      data: {
        title,
        excerpt,
        content,
        featuredImage,
        status,
        publishedAt: status === 'published' && !existingPost.publishedAt ? new Date() : undefined,
        tags,
        category,
        seoTitle,
        seoDescription,
        seoKeywords
      },
      include: {
        images: {
          orderBy: { order: 'asc' }
        }
      }
    });
    
    // Update images if provided
    if (images.length > 0) {
      // Delete existing images
      await prisma.blogImage.deleteMany({
        where: { postId: existingPost.id }
      });
      
      // Create new images
      await prisma.blogImage.createMany({
        data: images.map((img: any, index: number) => ({
          id: randomUUID(),
          postId: existingPost.id,
          url: img.url,
          alt: img.alt || '',
          caption: img.caption || '',
          order: index
        }))
      });
    }
    
    return NextResponse.json({ success: true, data: post });
  } catch (error) {
    console.error('Error updating blog post:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update blog post' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    // Check admin authentication
    if (!isAdminAuthenticated(req)) {
      return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 });
    }
    
    const { slug } = await params;
    
    // Check if post exists
    const existingPost = await prisma.blogPost.findUnique({
      where: { slug },
      select: { userId: true, id: true }
    });
    
    if (!existingPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }
    
    // Delete post (cascade will handle images and comments)
    await prisma.blogPost.delete({
      where: { id: existingPost.id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete blog post' },
      { status: 500 }
    );
  }
}

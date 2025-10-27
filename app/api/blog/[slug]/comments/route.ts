import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const { name, email, content } = body;
    
    // Validate required fields
    if (!name || !email || !content) {
      return NextResponse.json(
        { error: 'Name, email, and content are required' },
        { status: 400 }
      );
    }
    
    // Find the post
    const post = await prisma.blogPost.findUnique({
      where: { slug },
      select: { id: true, status: true }
    });
    
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }
    
    if (post.status !== 'published') {
      return NextResponse.json(
        { error: 'Comments are only allowed on published posts' },
        { status: 400 }
      );
    }
    
    // Get user ID if authenticated
    const { userId } = await auth();
    
    // Create comment
    const comment = await prisma.blogComment.create({
      data: {
        id: randomUUID(),
        postId: post.id,
        userId: userId || null,
        name,
        email,
        content,
        status: 'pending' // Comments need approval by default
      }
    });
    
    return NextResponse.json({ success: true, data: comment });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    
    // Find the post
    const post = await prisma.blogPost.findUnique({
      where: { slug },
      select: { id: true }
    });
    
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }
    
    // Get approved comments
    const comments = await prisma.blogComment.findMany({
      where: {
        postId: post.id,
        status: 'approved'
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json({ success: true, data: comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

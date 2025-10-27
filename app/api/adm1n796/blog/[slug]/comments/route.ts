import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/admin';

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    // Check admin authentication
    if (!isAdminAuthenticated(req)) {
      return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 });
    }

    const { slug } = await params;
    
    const post = await prisma.blogPost.findUnique({
      where: { slug },
      select: { id: true, title: true, slug: true }
    });
    
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }
    
    const comments = await prisma.blogComment.findMany({
      where: { postId: post.id },
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json({ 
      success: true, 
      data: { 
        post,
        comments 
      } 
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

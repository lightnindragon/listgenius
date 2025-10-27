import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/admin';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check admin authentication
    if (!isAdminAuthenticated(req)) {
      return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { action } = body;
    
    // Check if comment exists
    const existingComment = await prisma.blogComment.findUnique({
      where: { id },
      select: { id: true }
    });
    
    if (!existingComment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }
    
    if (action === 'delete') {
      await prisma.blogComment.delete({
        where: { id }
      });
    } else if (action === 'approve' || action === 'reject') {
      await prisma.blogComment.update({
        where: { id },
        data: { 
          status: action === 'approve' ? 'approved' : 'rejected'
        }
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update comment' },
      { status: 500 }
    );
  }
}

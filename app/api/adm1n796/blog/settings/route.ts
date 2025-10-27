import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/admin';

// Get comment settings
export async function GET(req: NextRequest) {
  try {
    // Check admin authentication
    if (!isAdminAuthenticated(req)) {
      return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 });
    }

    // For now, we'll use environment variables or a simple config
    // In a real app, you might want to store these in a database
    const settings = {
      commentsEnabled: process.env.BLOG_COMMENTS_ENABLED !== 'false',
      moderationRequired: process.env.BLOG_MODERATION_REQUIRED !== 'false'
    };
    
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error fetching comment settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// Update comment settings
export async function PUT(req: NextRequest) {
  try {
    // Check admin authentication
    if (!isAdminAuthenticated(req)) {
      return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { commentsEnabled, moderationRequired } = body;
    
    // In a real app, you would update these in a database
    // For now, we'll just return success
    // You could store these in a BlogSettings table or use environment variables
    
    return NextResponse.json({ 
      success: true, 
      data: { 
        commentsEnabled: commentsEnabled ?? true,
        moderationRequired: moderationRequired ?? true
      } 
    });
  } catch (error) {
    console.error('Error updating comment settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

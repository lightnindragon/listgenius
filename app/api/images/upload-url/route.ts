import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { put } from '@vercel/blob';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST - Handle upload URL generation for Vercel Blob client-side multipart upload
 * This is called by @vercel/blob/client during multipart uploads
 * The client SDK expects { url } in the response
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { pathname, contentType } = body;

    if (!pathname) {
      return NextResponse.json(
        { error: 'Pathname is required' },
        { status: 400 }
      );
    }

    // Create a unique path with user ID
    const uniquePath = `images/${userId}/${pathname}`;
    
    // Generate upload URL using put() - this creates a signed URL for direct upload
    // Note: We use an empty blob just to get the URL - the actual file will be uploaded by the client
    const { url } = await put(uniquePath, new Blob([], { type: contentType || 'image/jpeg' }), {
      access: 'public',
      addRandomSuffix: true,
    });

    logger.info('Generated upload URL for multipart upload', {
      userId,
      pathname: uniquePath,
    });

    // Return URL in format expected by @vercel/blob/client
    return NextResponse.json({ url });
  } catch (error: any) {
    logger.error('Failed to generate upload URL', {
      error: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}


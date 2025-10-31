import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateClientTokenFromReadWriteToken } from '@vercel/blob/client';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if BLOB_READ_WRITE_TOKEN is configured
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      logger.error('BLOB_READ_WRITE_TOKEN not configured', { userId });
      return NextResponse.json(
        { 
          error: 'Image upload service not configured. Please contact support.',
          code: 'BLOB_TOKEN_MISSING'
        },
        { status: 500 }
      );
    }

    // Parse the request body to get upload details
    const body = await request.json();
    const { pathname, multipart, contentType, contentLength } = body;

    // Generate client token directly using the read-write token
    // This bypasses handleUpload which may have issues with internal token retrieval
    const clientToken = await generateClientTokenFromReadWriteToken({
      token,
      pathname: pathname || `images/${userId}/${Date.now()}-${body.filename || 'image'}`,
      onUploadCompleted: {
        callbackUrl: `${request.nextUrl.origin}/api/images/complete`,
        tokenPayload: JSON.stringify({ userId }),
      },
      tokenPayload: { userId },
      allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      maximumSizeInBytes: 100 * 1024 * 1024, // 100MB
      addRandomSuffix: true,
      cacheControlMaxAge: 86400, // 24 hours
    });

    logger.info('Client token generated successfully', { userId, pathname: body.pathname });

    // Return the response in the format expected by the client
    return NextResponse.json({
      token: clientToken,
    });
  } catch (error: any) {
    logger.error('Failed to generate upload URL', {
      error: error.message,
      stack: error.stack,
      hasToken: !!process.env.BLOB_READ_WRITE_TOKEN,
      userId: (await auth()).userId,
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to generate upload URL. Please try again.',
        code: 'UPLOAD_URL_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}


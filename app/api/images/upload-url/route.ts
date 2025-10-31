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
    // The client sends: { type: 'blob.generate-client-token', payload: { pathname, callbackUrl, multipart, clientPayload } }
    const body = await request.json();
    
    // Log the request body structure for debugging
    logger.info('Upload URL request received', { 
      userId, 
      bodyType: body.type,
      hasPayload: !!body.payload,
      payloadPathname: body.payload?.pathname,
      directPathname: body.pathname,
      fullBody: JSON.stringify(body).substring(0, 200)
    });
    
    const requestPathname = body.payload?.pathname || body.pathname;
    
    if (!requestPathname) {
      logger.error('Missing pathname in request', { userId, body: JSON.stringify(body) });
      return NextResponse.json(
        { error: 'Missing pathname in request' },
        { status: 400 }
      );
    }

    // Generate client token directly using the read-write token
    // CRITICAL: Use the EXACT pathname from the client request to avoid pathname mismatch errors
    // The client passes file.name as pathname, and we must use the same value in the token
    const clientToken = await generateClientTokenFromReadWriteToken({
      token,
      pathname: requestPathname, // Must match exactly what client sends
      onUploadCompleted: {
        callbackUrl: `${request.nextUrl.origin}/api/images/complete`,
        tokenPayload: JSON.stringify({ userId }),
      },
      tokenPayload: { userId },
      allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      maximumSizeInBytes: 100 * 1024 * 1024, // 100MB
      addRandomSuffix: true, // This adds a random suffix, but pathname must still match initially
      cacheControlMaxAge: 86400, // 24 hours
    });

    logger.info('Client token generated successfully', { userId, pathname: requestPathname });

    // Return the response in the format expected by handleUploadUrl
    // The client library expects { type: string, clientToken: string }
    return NextResponse.json({
      type: 'blob.generate-client-token',
      clientToken: clientToken,
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


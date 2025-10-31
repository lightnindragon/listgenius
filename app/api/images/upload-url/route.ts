import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { handleUpload } from '@vercel/blob/client';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if BLOB_READ_WRITE_TOKEN is configured
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      logger.error('BLOB_READ_WRITE_TOKEN not configured', { userId });
      return NextResponse.json(
        { 
          error: 'Image upload service not configured. Please contact support.',
          code: 'BLOB_TOKEN_MISSING'
        },
        { status: 500 }
      );
    }

    const body = await request.json();

    // Delegate to Vercel Blob helper to generate a short‑lived client token
    // that the browser will use to upload directly to Blob storage.
    return handleUpload({
      request,
      body,
      onBeforeGenerateToken: async () => {
        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
          tokenPayload: { userId },
        };
      },
      // We do metadata processing separately in /api/images/complete
      onUploadCompleted: async () => {
        return;
      },
    });
  } catch (error: any) {
    logger.error('Failed to generate upload URL', {
      error: error.message,
      stack: error.stack,
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to generate upload URL. Please try again.',
        code: 'UPLOAD_URL_ERROR'
      },
      { status: 500 }
    );
  }
}


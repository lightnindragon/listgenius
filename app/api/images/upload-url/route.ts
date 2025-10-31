import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { handleUpload } from '@vercel/blob/client';

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const body = await request.json();

  // Delegate to Vercel Blob helper to generate a client upload token
  // and enforce server-side constraints
  const response = await handleUpload({
    request,
    body,
    onBeforeGenerateToken: async () => {
      return {
        allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        tokenPayload: { userId },
      };
    },
    onUploadCompleted: async () => {
      // No-op for now; final processing occurs in /api/images/complete
      return;
    },
  });

  return response;
}

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

    // The @vercel/blob/client library posts multipart/form-data here
    // Parse form data instead of JSON
    const form = await request.formData();
    const filename = String(form.get('filename') || 'upload');
    const contentType = String(form.get('contentType') || 'application/octet-stream');
    const proposedPathname = String(form.get('pathname') || filename);

    // Create a unique path namespaced by user
    const uniquePath = `images/${userId}/${Date.now()}-${proposedPathname}`;
    
    // Generate upload URL using put() - this creates a signed URL for direct upload
    // Note: We use an empty blob just to get the URL - the actual file will be uploaded by the client
    const { url } = await put(uniquePath, new Blob([], { type: contentType }), {
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


import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { handleUpload } from '@vercel/blob/client';

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
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
}


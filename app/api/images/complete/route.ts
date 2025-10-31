import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80);
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const {
      blobUrl,
      blobKey,
      originalFilename,
      width,
      height,
      fileSize,
      mimeType,
    } = await request.json();

    if (!blobUrl || !blobKey || !originalFilename) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400 }
      );
    }

    const baseName = originalFilename.replace(/\.[^.]+$/, '');
    const ext = (originalFilename.match(/\.[^.]+$/)?.[0] || '').toLowerCase() || '.jpg';
    const sizePart = width && height ? `${width}x${height}` : 'image';
    const seoFilename = `${slugify(baseName)}-${sizePart}${ext}`;

    const highEnough = typeof width === 'number' && typeof height === 'number' && width >= 2000 && height >= 2000;
    const quality: 'poor' | 'high' = highEnough ? 'high' : 'poor';
    const needsUpscale = !highEnough;

    // Simple alt text fallback from filename; callers can overwrite later
    const fallbackAlt = baseName
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^\w/, (c) => c.toUpperCase());

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: blobKey,
          filename: seoFilename,
          altText: fallbackAlt,
          url: blobUrl,
          width: width || 0,
          height: height || 0,
          quality,
          needsUpscale,
          expiresAt,
          // Debug metadata (not used by UI but useful if needed)
          _meta: { fileSize, mimeType },
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error?.message || 'Failed to process image' }),
      { status: 500 }
    );
  }
}
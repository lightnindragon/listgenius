import { put, del, head, list } from '@vercel/blob';
import { logger } from './logger';

/**
 * Upload image to Vercel Blob Storage
 */
export async function uploadImageToBlob(
  file: File | Buffer,
  userId: string,
  generatedFilename: string
): Promise<{ url: string; key: string }> {
  try {
    // Check if BLOB_READ_WRITE_TOKEN is set
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error('BLOB_READ_WRITE_TOKEN environment variable is not set. Please configure Vercel Blob storage.');
    }

    const path = `images/${userId}/${Date.now()}-${generatedFilename}`;
    
    const blob = await put(path, file, {
      access: 'public',
      addRandomSuffix: true,
    });

    logger.info('Image uploaded to blob storage', {
      userId,
      path: blob.pathname,
      url: blob.url,
    });

    return {
      url: blob.url,
      key: blob.pathname,
    };
  } catch (error) {
    logger.error('Failed to upload image to blob storage', {
      userId,
      error: (error as Error).message,
    });
    throw new Error(`Failed to upload image: ${(error as Error).message}`);
  }
}

/**
 * Delete image from Vercel Blob Storage
 */
export async function deleteImageFromBlob(blobKey: string): Promise<void> {
  try {
    await del(blobKey);
    
    logger.info('Image deleted from blob storage', {
      blobKey,
    });
  } catch (error) {
    logger.error('Failed to delete image from blob storage', {
      blobKey,
      error: (error as Error).message,
    });
    // Don't throw - allow deletion to continue even if blob deletion fails
  }
}

/**
 * Get blob URL from key
 */
export function getBlobUrl(blobKey: string): string {
  // Vercel Blob URLs follow pattern: https://[account].public.blob.vercel-storage.com/[key]
  // If blobKey already contains full URL, return it
  if (blobKey.startsWith('http')) {
    return blobKey;
  }
  
  // Otherwise, construct URL from key
  const account = process.env.BLOB_READ_WRITE_TOKEN?.split('_')[0] || 'default';
  return `https://${account}.public.blob.vercel-storage.com/${blobKey}`;
}

/**
 * Check if blob exists
 */
export async function blobExists(blobKey: string): Promise<boolean> {
  try {
    await head(blobKey);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  // Check file size (max 4MB to avoid Vercel function payload limits)
  const maxSize = 4 * 1024 * 1024; // 4MB (Vercel limit is ~4.5MB for function payload)
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size: 4MB per file. Please compress or resize your image before uploading.`,
    };
  }

  // Check minimum size (at least 1KB)
  if (file.size < 1024) {
    return {
      valid: false,
      error: 'File too small. Minimum size: 1KB',
    };
  }

  return { valid: true };
}


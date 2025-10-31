import sharp from 'sharp';
import { logger } from './logger';

/**
 * Get image dimensions from buffer
 */
export async function getImageDimensions(imageBuffer: Buffer): Promise<{ width: number; height: number }> {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
    };
  } catch (error) {
    logger.error('Failed to get image dimensions', { error: (error as Error).message });
    throw new Error(`Failed to get image dimensions: ${(error as Error).message}`);
  }
}

/**
 * Upscale image in memory to meet minimum dimension requirement
 * Maintains aspect ratio
 */
export async function upscaleImageInMemory(
  imageBuffer: Buffer,
  targetMinDimension: number = 2000
): Promise<{ buffer: Buffer; width: number; height: number }> {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    const currentWidth = metadata.width || 0;
    const currentHeight = metadata.height || 0;

    if (currentWidth === 0 || currentHeight === 0) {
      throw new Error('Invalid image dimensions');
    }

    // Calculate new dimensions maintaining aspect ratio
    let newWidth = currentWidth;
    let newHeight = currentHeight;

    if (currentWidth < targetMinDimension || currentHeight < targetMinDimension) {
      // Determine scaling factor based on the smaller dimension
      const scaleFactor = targetMinDimension / Math.min(currentWidth, currentHeight);
      newWidth = Math.round(currentWidth * scaleFactor);
      newHeight = Math.round(currentHeight * scaleFactor);
    }

    // Upscale using Lanczos resampling for high quality
    const upscaledBuffer = await sharp(imageBuffer)
      .resize(newWidth, newHeight, {
        kernel: sharp.kernel.lanczos3,
        withoutEnlargement: false,
      })
      .toBuffer();

    logger.info('Image upscaled', {
      original: `${currentWidth}x${currentHeight}`,
      upscaled: `${newWidth}x${newHeight}`,
    });

    return {
      buffer: upscaledBuffer,
      width: newWidth,
      height: newHeight,
    };
  } catch (error) {
    logger.error('Failed to upscale image', { error: (error as Error).message });
    throw new Error(`Failed to upscale image: ${(error as Error).message}`);
  }
}

/**
 * Compress image in memory while maintaining quality
 */
export async function compressImageInMemory(
  imageBuffer: Buffer,
  quality: number = 85
): Promise<{ buffer: Buffer; originalSize: number; compressedSize: number; ratio: number }> {
  try {
    const originalSize = imageBuffer.length;
    
    // Compress as JPEG with specified quality
    const compressedBuffer = await sharp(imageBuffer)
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();

    const compressedSize = compressedBuffer.length;
    const ratio = ((originalSize - compressedSize) / originalSize) * 100;

    logger.info('Image compressed', {
      originalSize,
      compressedSize,
      ratio: `${ratio.toFixed(2)}%`,
    });

    return {
      buffer: compressedBuffer,
      originalSize,
      compressedSize,
      ratio,
    };
  } catch (error) {
    logger.error('Failed to compress image', { error: (error as Error).message });
    throw new Error(`Failed to compress image: ${(error as Error).message}`);
  }
}

/**
 * Convert image format in memory
 */
export async function convertImageFormatInMemory(
  imageBuffer: Buffer,
  format: 'jpeg' | 'png' | 'webp'
): Promise<Buffer> {
  try {
    let convertedBuffer: Buffer;

    switch (format) {
      case 'jpeg':
        convertedBuffer = await sharp(imageBuffer).jpeg({ quality: 90 }).toBuffer();
        break;
      case 'png':
        convertedBuffer = await sharp(imageBuffer).png({ quality: 90 }).toBuffer();
        break;
      case 'webp':
        convertedBuffer = await sharp(imageBuffer).webp({ quality: 90 }).toBuffer();
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    logger.info('Image format converted', { format });
    return convertedBuffer;
  } catch (error) {
    logger.error('Failed to convert image format', { format, error: (error as Error).message });
    throw new Error(`Failed to convert image format: ${(error as Error).message}`);
  }
}

/**
 * Optimize image with various settings
 */
export async function optimizeImageInMemory(
  imageBuffer: Buffer,
  options: {
    quality?: number;
    format?: 'jpeg' | 'png' | 'webp';
    width?: number;
    height?: number;
  } = {}
): Promise<{ buffer: Buffer; width: number; height: number; size: number }> {
  try {
    let processed = sharp(imageBuffer);

    // Resize if dimensions specified
    if (options.width || options.height) {
      processed = processed.resize(options.width, options.height, {
        fit: 'inside',
        withoutEnlargement: false,
      });
    }

    // Convert format and apply quality
    const format = options.format || 'jpeg';
    const quality = options.quality || 85;

    let optimizedBuffer: Buffer;
    switch (format) {
      case 'jpeg':
        optimizedBuffer = await processed.jpeg({ quality, mozjpeg: true }).toBuffer();
        break;
      case 'png':
        optimizedBuffer = await processed.png({ quality }).toBuffer();
        break;
      case 'webp':
        optimizedBuffer = await processed.webp({ quality }).toBuffer();
        break;
      default:
        optimizedBuffer = await processed.jpeg({ quality, mozjpeg: true }).toBuffer();
    }

    const metadata = await sharp(optimizedBuffer).metadata();

    logger.info('Image optimized', {
      format,
      quality,
      size: optimizedBuffer.length,
      dimensions: `${metadata.width}x${metadata.height}`,
    });

    return {
      buffer: optimizedBuffer,
      width: metadata.width || 0,
      height: metadata.height || 0,
      size: optimizedBuffer.length,
    };
  } catch (error) {
    logger.error('Failed to optimize image', { error: (error as Error).message });
    throw new Error(`Failed to optimize image: ${(error as Error).message}`);
  }
}


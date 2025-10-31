import OpenAI from 'openai';
import { logger } from './logger';
import { OpenAIError } from './errors';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000];

/**
 * Retry function with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  delays: number[] = RETRY_DELAYS
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (error instanceof OpenAIError || 
          (error as any).status === 401 || 
          (error as any).status === 429) {
        throw error;
      }

      if (attempt < maxRetries) {
        const delay = delays[attempt] || delays[delays.length - 1];
        logger.warn(`OpenAI request failed, retrying in ${delay}ms`, { 
          attempt: attempt + 1, 
          error: lastError.message 
        });
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new OpenAIError(`OpenAI request failed after ${maxRetries + 1} attempts: ${lastError!.message}`);
}

/**
 * Moderate image content using OpenAI Vision API
 * Since moderation API doesn't work directly with images, we use Vision API with a moderation prompt
 */
export async function moderateImage(
  imageBuffer: Buffer
): Promise<{ approved: boolean; reason?: string }> {
  try {
    // Use Vision API with a moderation prompt
    const base64Image = imageBuffer.toString('base64');
    
    const response = await retryWithBackoff(async () => {
      return await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a content moderation system. Analyze this image and determine if it contains any inappropriate content such as sexual content, violence, hateful content, or illegal activity. Respond only with JSON: {"approved": true/false, "reason": "optional reason"}'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this image for inappropriate content. Return JSON only with approved (boolean) and reason (string, optional).'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 100
      });
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      logger.warn('Image moderation returned no content, allowing image');
      return { approved: true };
    }

    // Try to parse JSON response
    try {
      const moderation = JSON.parse(content);
      if (moderation.approved === false) {
        logger.warn('Image rejected by moderation', { reason: moderation.reason });
        return {
          approved: false,
          reason: moderation.reason || 'Image contains inappropriate content'
        };
      }
      return { approved: true };
    } catch (parseError) {
      // If JSON parsing fails, check if response contains keywords
      const lowerContent = content.toLowerCase();
      if (lowerContent.includes('inappropriate') || 
          lowerContent.includes('sexual') || 
          lowerContent.includes('violent') ||
          lowerContent.includes('hate')) {
        logger.warn('Image flagged by moderation (keyword detection)', { content });
        return {
          approved: false,
          reason: 'Image contains inappropriate content'
        };
      }
      
      // If no keywords found, allow the image
      logger.warn('Image moderation response unclear, allowing image', { content });
      return { approved: true };
    }
  } catch (error) {
    logger.error('Image moderation failed', { error: (error as Error).message });
    // On error, allow the image but log it for review
    return { approved: true };
  }
}

/**
 * Generate SEO-friendly filename from image using OpenAI Vision
 */
export async function generateImageFilename(
  imageUrl: string,
  context?: string
): Promise<string> {
  try {
    const completion = await retryWithBackoff(async () => {
      return await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an SEO expert. Generate a short, descriptive, SEO-friendly filename for images. The filename should be lowercase, use hyphens instead of spaces, be 3-8 words maximum, and include relevant keywords. Do not include file extensions. Example: "handmade-ceramic-mug-blue-glaze"'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Generate an SEO-friendly filename for this image.${context ? ` Context: ${context}` : ''} Return only the filename, no explanation.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        temperature: 0.7,
        max_tokens: 50
      });
    });

    let filename = completion.choices[0]?.message?.content?.trim() || 'image';
    
    // Sanitize filename: lowercase, replace spaces with hyphens, remove special chars
    filename = filename
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 100);
    
    // Ensure it's not empty
    if (!filename || filename.length < 3) {
      filename = 'product-image';
    }

    logger.info('Image filename generated', {
      filename,
      tokensUsed: completion.usage?.total_tokens || 0
    });

    return filename;
  } catch (error) {
    logger.error('Image filename generation failed', { error: (error as Error).message });
    // Fallback to timestamp-based filename
    return `image-${Date.now()}`;
  }
}

/**
 * Generate SEO-optimized alt text from image using OpenAI Vision
 * Maximum 500 characters including spaces
 */
export async function generateImageAltText(
  imageUrl: string,
  context?: string
): Promise<string> {
  try {
    const completion = await retryWithBackoff(async () => {
      return await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an SEO expert specializing in Etsy product images. Generate descriptive, SEO-optimized alt text that is accurate, keyword-rich, and helpful for accessibility. Keep it under 500 characters including spaces. Include relevant details like product type, colors, materials, and key features. Do not start with "Image of" or "Picture of".'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Generate SEO-optimized alt text for this Etsy product image.${context ? ` Context: ${context}` : ''} The alt text should be descriptive, include relevant keywords, and stay under 500 characters including spaces. Return only the alt text, no explanation.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      });
    });

    let altText = completion.choices[0]?.message?.content?.trim() || '';
    
    // Ensure it's under 500 characters
    if (altText.length > 500) {
      altText = altText.substring(0, 497) + '...';
    }
    
    // Ensure it's not empty
    if (!altText || altText.length < 10) {
      altText = 'Etsy product image';
    }

    logger.info('Image alt text generated', {
      length: altText.length,
      tokensUsed: completion.usage?.total_tokens || 0
    });

    return altText;
  } catch (error) {
    logger.error('Image alt text generation failed', { error: (error as Error).message });
    // Fallback alt text
    return 'Etsy product image';
  }
}

/**
 * Analyze image quality based on dimensions
 */
export function analyzeImageQuality(width: number, height: number): 'poor' | 'high' {
  // High quality: both dimensions are >= 2000px
  if (width >= 2000 && height >= 2000) {
    return 'high';
  }
  return 'poor';
}


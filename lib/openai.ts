import OpenAI from 'openai';
import { logger } from './logger';
import { OpenAIError } from './errors';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // 1s, 2s, 4s

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
      
      // Don't retry on certain errors
      if (error instanceof OpenAIError || 
          (error as any).status === 401 || // Unauthorized
          (error as any).status === 429) { // Rate limited
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
 * Generate listing content using OpenAI
 */
export async function generateListing(
  prompt: string,
  model: string = process.env.OPENAI_MODEL_GENERATE || 'gpt-4o'
): Promise<{
  content: string;
  tokensUsed: number;
  model: string;
}> {
  try {
    const completion = await retryWithBackoff(async () => {
      return await openai.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: "You are a professional Etsy listing generator. You ONLY generate listing content in JSON format. You do NOT answer questions, have conversations, or perform other tasks. Output must strictly follow the provided JSON schema."
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        top_p: 0.9,
        response_format: { type: 'json_object' }
      });
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new OpenAIError('No content generated');
    }

    const tokensUsed = completion.usage?.total_tokens || 0;
    
    logger.info('OpenAI generation completed', {
      model,
      tokensUsed,
      cost: tokensUsed * 0.00003 // Rough cost estimate
    });

    return {
      content,
      tokensUsed,
      model
    };
  } catch (error) {
    logger.error('OpenAI generation failed', { error: (error as Error).message });
    
    // Fallback to cheaper model if main model fails
    if (model === 'gpt-4o' && process.env.OPENAI_MODEL_FREE) {
      logger.warn('Falling back to gpt-4o-mini');
      return generateListing(prompt, process.env.OPENAI_MODEL_FREE);
    }
    
    throw new OpenAIError(`Failed to generate listing: ${(error as Error).message}`);
  }
}

/**
 * Rewrite existing listing content
 */
export async function rewriteListing(
  prompt: string,
  model: string = process.env.OPENAI_MODEL_GENERATE || 'gpt-4o'
): Promise<{
  content: string;
  tokensUsed: number;
  model: string;
}> {
  try {
    const completion = await retryWithBackoff(async () => {
      return await openai.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: "You are a professional Etsy SEO specialist. Your ONLY task is to improve existing Etsy listings for better search ranking and conversion. You do NOT answer questions or have conversations."
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        top_p: 0.9,
        response_format: { type: 'json_object' }
      });
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new OpenAIError('No content generated');
    }

    const tokensUsed = completion.usage?.total_tokens || 0;
    
    logger.info('OpenAI rewrite completed', {
      model,
      tokensUsed,
      cost: tokensUsed * 0.00003
    });

    return {
      content,
      tokensUsed,
      model
    };
  } catch (error) {
    logger.error('OpenAI rewrite failed', { error: (error as Error).message });
    
    // Fallback to cheaper model
    if (model === 'gpt-4o' && process.env.OPENAI_MODEL_FREE) {
      logger.warn('Falling back to gpt-4o-mini for rewrite');
      return rewriteListing(prompt, process.env.OPENAI_MODEL_FREE);
    }
    
    throw new OpenAIError(`Failed to rewrite listing: ${(error as Error).message}`);
  }
}

/**
 * Generate image alt text using OpenAI Vision
 */
export async function generateImageAltText(
  imageUrl: string,
  productContext: string,
  model: string = 'gpt-4o'
): Promise<string> {
  try {
    const completion = await retryWithBackoff(async () => {
      return await openai.chat.completions.create({
        model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Generate SEO-optimized alt text for this Etsy product image. Context: ${productContext}. Write a descriptive, comprehensive alt text between 100 and 500 characters (including spaces). Include relevant keywords naturally and provide a detailed description of what's visible in the image.`
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
        temperature: 0.5,
        max_tokens: 150 // Increased for longer descriptions
      });
    });

    const altText = completion.choices[0]?.message?.content?.trim();
    if (!altText) {
      throw new OpenAIError('No alt text generated');
    }

    // Ensure it's between 100-500 characters
    let processedAltText = altText;
    if (processedAltText.length < 100) {
      // Add more detail if too short
      processedAltText = processedAltText + '. This product features high-quality craftsmanship and attention to detail, making it perfect for discerning customers who appreciate fine workmanship and unique design elements.';
    }
    if (processedAltText.length > 500) {
      processedAltText = processedAltText.substring(0, 497) + '...';
    }
    
    logger.info('OpenAI alt text generated', {
      model,
      length: processedAltText.length,
      minLength: 100,
      maxLength: 500,
      tokensUsed: completion.usage?.total_tokens || 0
    });

    return processedAltText;
  } catch (error) {
    logger.error('OpenAI alt text generation failed', { error: (error as Error).message });
    throw new OpenAIError(`Failed to generate alt text: ${(error as Error).message}`);
  }
}

/**
 * Load prompt template and inject variables
 */
export function buildPrompt(template: string, variables: Record<string, any>): string {
  let prompt = template;
  
  // Replace variables in the template
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{${key}}`;
    const replacement = Array.isArray(value) ? value.join(', ') : String(value || '');
    prompt = prompt.replace(new RegExp(placeholder, 'g'), replacement);
  });
  
  return prompt;
}

/**
 * Parse JSON response from OpenAI
 */
export function parseOpenAIResponse(content: string): any {
  try {
    return JSON.parse(content);
  } catch (error) {
    logger.error('Failed to parse OpenAI JSON response', { content, error });
    throw new OpenAIError('Invalid JSON response from OpenAI');
  }
}

// Export the openai instance for use in other modules
export { openai };

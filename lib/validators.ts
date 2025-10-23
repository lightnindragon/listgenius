import { z } from 'zod';
import { ValidationError } from './errors';

/**
 * Zod schemas for API validation with edge case handling
 */

// Generate request validation
export const generateRequestSchema = z.object({
  productName: z.string()
    .min(1, 'Product name is required')
    .max(100, 'Product name must be less than 100 characters')
    .transform(val => val.trim()),
  niche: z.string()
    .max(50, 'Niche must be less than 50 characters')
    .transform(val => val.trim())
    .optional(),
  audience: z.string()
    .max(200, 'Audience must be less than 200 characters')
    .transform(val => val.trim())
    .optional(),
  keywords: z.array(z.string())
    .min(1, 'At least one keyword is required')
    .max(20, 'Maximum 20 keywords allowed')
    .transform(keywords => keywords.map(k => k.trim()).filter(k => k.length > 0)),
  tone: z.string()
    .max(50, 'Tone must be less than 50 characters')
    .transform(val => val.trim())
    .optional(),
  wordCount: z.number()
    .min(200, 'Minimum 200 words required')
    .max(600, 'Maximum 600 words allowed')
    .optional(),
  extras: z.object({
    pinterestCaption: z.boolean().optional(),
    etsyMessage: z.boolean().optional()
  }).optional()
});

// Rewrite request validation
export const rewriteRequestSchema = z.object({
  originalTitle: z.string()
    .min(1, 'Original title is required')
    .max(200, 'Original title must be less than 200 characters'),
  originalDescription: z.string()
    .min(1, 'Original description is required')
    .max(10000, 'Original description must be less than 10,000 characters'),
  originalTags: z.array(z.string())
    .max(20, 'Maximum 20 original tags allowed'),
  productName: z.string()
    .min(1, 'Product name is required')
    .max(100, 'Product name must be less than 100 characters'),
  niche: z.string().max(50).optional(),
  audience: z.string().max(200).optional(),
  keywords: z.array(z.string())
    .min(1, 'At least one keyword is required')
    .max(20, 'Maximum 20 keywords allowed'),
  tone: z.string().max(50).optional()
});

// Bulk generation request validation
export const bulkGenerateRequestSchema = z.object({
  products: z.array(generateRequestSchema)
    .min(1, 'At least one product is required')
    .max(200, 'Maximum 200 products allowed')
});

// Stripe checkout validation
export const stripeCheckoutSchema = z.object({
  plan: z.enum(['pro', 'business', 'agency'], {
    message: 'Plan must be pro, business, or agency'
  })
});

// Etsy listing update validation
export const etsyListingUpdateSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  description: z.string()
    .min(1, 'Description is required')
    .max(10000, 'Description must be less than 10,000 characters'),
  tags: z.array(z.string())
    .length(13, 'Exactly 13 tags required')
    .refine(tags => tags.every(tag => tag.length <= 20), {
      message: 'All tags must be 20 characters or less'
    }),
  materials: z.array(z.string())
    .length(13, 'Exactly 13 materials required')
    .refine(materials => materials.every(material => material.length <= 100), {
      message: 'All materials must be 100 characters or less'
    })
});

// Settings update validation
export const settingsUpdateSchema = z.object({
  tone: z.string()
    .max(50, 'Tone must be less than 50 characters')
    .optional(),
  niche: z.string()
    .max(50, 'Niche must be less than 50 characters')
    .optional()
});

/**
 * Validate request body with schema
 */
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.issues.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      throw new ValidationError(errorMessage);
    }
    throw error;
  }
}

/**
 * Validate query parameters
 */
export function validateQuery<T>(schema: z.ZodSchema<T>, query: Record<string, string | string[] | undefined>): T {
  try {
    return schema.parse(query);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.issues.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      throw new ValidationError(errorMessage);
    }
    throw error;
  }
}

/**
 * Sanitize and validate listing output from AI
 */
export function validateListingOutput(data: any): {
  title: string;
  description: string;
  tags: string[];
  materials: string[];
  pinterestCaption?: string;
  etsyMessage?: string;
} {
  const schema = z.object({
    title: z.string()
      .min(1, 'Title is required')
      .max(200, 'Title too long'),
    description: z.string()
      .min(1, 'Description is required')
      .max(10000, 'Description too long'),
    tags: z.array(z.string())
      .length(13, 'Exactly 13 tags required')
      .refine(tags => tags.every(tag => tag.length <= 20), {
        message: 'All tags must be 20 characters or less'
      }),
    materials: z.array(z.string())
      .length(13, 'Exactly 13 materials required'),
    pinterestCaption: z.string().optional(),
    etsyMessage: z.string().optional()
  });

  return validateRequest(schema, data);
}

/**
 * Validate Etsy tag
 */
export function validateEtsyTag(tag: string): boolean {
  if (!tag || tag.length === 0 || tag.length > 20) return false;
  
  const forbiddenSymbols = ['&', '#', '@', '%', '^', '*', '!', '~', '`', '|', '\\', '<', '>'];
  return !forbiddenSymbols.some(symbol => tag.includes(symbol));
}

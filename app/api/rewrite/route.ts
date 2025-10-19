import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { rewriteListing, buildPrompt, parseOpenAIResponse } from '@/lib/openai';
import { validateRequest } from '@/lib/validators';
import { rewriteRequestSchema } from '@/lib/validators';
import { incrementRewriteCount, canRewrite } from '@/lib/rateLimit';
import { getUserPlan } from '@/lib/clerk';
import { analytics } from '@/lib/analytics';
import { sanitizeInput, sanitizeTag, extractFocusKeywords } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { getErrorResponse } from '@/lib/errors';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = validateRequest(rewriteRequestSchema, body);

    // Sanitize all user inputs
    const sanitizedData = {
      ...validatedData,
      originalTitle: sanitizeInput(validatedData.originalTitle),
      originalDescription: sanitizeInput(validatedData.originalDescription),
      originalTags: validatedData.originalTags.map(sanitizeTag),
      productName: sanitizeInput(validatedData.productName),
      niche: validatedData.niche ? sanitizeInput(validatedData.niche) : undefined,
      audience: validatedData.audience ? sanitizeInput(validatedData.audience) : undefined,
      keywords: validatedData.keywords.map(sanitizeInput),
      tone: validatedData.tone ? sanitizeInput(validatedData.tone) : undefined,
    };

    // Check rate limits
    const canRewriteNow = await canRewrite(userId);
    if (!canRewriteNow) {
      const plan = await getUserPlan(userId);
      const errorMessage = plan === 'free' 
        ? 'Daily rewrite limit exceeded (1/day for free plan). Upgrade to Pro for unlimited rewrites.'
        : 'Rate limit exceeded. Please try again later.';
      
      return NextResponse.json({ 
        success: false, 
        error: errorMessage,
        type: 'RATE_LIMIT_ERROR'
      }, { status: 429 });
    }

    // Load platform rules and prompts
    const platformRulesPath = path.join(process.cwd(), 'config/platforms/etsy.json');
    const promptTemplatePath = path.join(process.cwd(), 'config/prompts/etsy-rewrite.json');
    
    const [platformRules, promptTemplate] = await Promise.all([
      fs.readFile(platformRulesPath, 'utf-8').then(JSON.parse),
      fs.readFile(promptTemplatePath, 'utf-8').then(JSON.parse)
    ]);

    // Extract focus keywords (ensure long-tail)
    const focusKeywords = extractFocusKeywords(sanitizedData.keywords);
    
    // Build prompt with variables
    const prompt = buildPrompt(promptTemplate.userPromptTemplate, {
      originalTitle: sanitizedData.originalTitle,
      originalDescription: sanitizedData.originalDescription,
      originalTags: sanitizedData.originalTags.join(', '),
      productName: sanitizedData.productName,
      niche: sanitizedData.niche || 'Digital Products',
      audience: sanitizedData.audience || 'Etsy shoppers',
      keywords: focusKeywords.join(', '),
      tone: sanitizedData.tone || 'Professional',
      platformRules: JSON.stringify(platformRules, null, 2)
    });

    // Get user plan to determine model
    const plan = await getUserPlan(userId);
    const model = plan === 'free' 
      ? (process.env.OPENAI_MODEL_FREE || 'gpt-4o-mini')
      : (process.env.OPENAI_MODEL_GENERATE || 'gpt-4o');

    // Rewrite listing with OpenAI
    const { content, tokensUsed, model: usedModel } = await rewriteListing(prompt, model);

    // Parse and validate OpenAI response
    const parsedListing = parseOpenAIResponse(content);

    // Validate required fields
    if (!parsedListing.title || !parsedListing.description || !parsedListing.tags) {
      throw new Error('Invalid response from AI: missing required fields');
    }

    // Sanitize AI response
    const sanitizedListing = {
      title: sanitizeInput(parsedListing.title).substring(0, 200),
      description: sanitizeInput(parsedListing.description),
      tags: (parsedListing.tags || []).map(sanitizeTag).filter(isValidTag).slice(0, 13),
      materials: (parsedListing.materials || []).map(sanitizeInput).filter(Boolean).slice(0, 13)
    };

    // Ensure exactly 13 tags
    while (sanitizedListing.tags.length < 13) {
      const extraTags = focusKeywords.filter(k => !sanitizedListing.tags.includes(k));
      if (extraTags.length > 0) {
        sanitizedListing.tags.push(sanitizeTag(extraTags[0]).substring(0, 20));
      } else {
        break;
      }
    }

    // Increment rewrite count
    await incrementRewriteCount(userId);

    // Track analytics
    const wordCount = sanitizedListing.description.split(/\s+/).length;
    await analytics.trackRewriteCreated(userId, {
      model: usedModel,
      tokensUsed,
      wordCount
    });

    logger.info('Listing rewritten successfully', {
      userId,
      plan,
      model: usedModel,
      tokensUsed,
      wordCount
    });

    // Return successful response
    return NextResponse.json({
      success: true,
      data: sanitizedListing
    });

  } catch (error: any) {
    logger.error('Rewrite generation failed', { 
      error: error.message,
      stack: error.stack
    });
    
    const errorResponse = getErrorResponse(error);
    return NextResponse.json(
      { success: false, error: errorResponse.message },
      { status: errorResponse.status }
    );
  }
}

// Helper function to validate tags
function isValidTag(tag: string): boolean {
  return tag.length > 0 && tag.length <= 20;
}


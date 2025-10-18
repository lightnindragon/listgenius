import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateListing, buildPrompt, parseOpenAIResponse } from '@/lib/openai';
import { validateRequest } from '@/lib/validators';
import { generateRequestSchema } from '@/lib/validators';
import { incrementGenerationCount, canGenerate } from '@/lib/rateLimit';
import { getUserPlan } from '@/lib/clerk';
import { trackGenerationCreated } from '@/lib/analytics';
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
    const validatedData = validateRequest(generateRequestSchema, body);

    // Sanitize all user inputs
    const sanitizedData = {
      ...validatedData,
      productName: sanitizeInput(validatedData.productName),
      niche: validatedData.niche ? sanitizeInput(validatedData.niche) : undefined,
      audience: validatedData.audience ? sanitizeInput(validatedData.audience) : undefined,
      keywords: validatedData.keywords.map(sanitizeInput),
      tone: validatedData.tone ? sanitizeInput(validatedData.tone) : undefined,
    };

    // Check rate limits
    const canGenerateNow = await canGenerate(userId);
    if (!canGenerateNow) {
      const plan = await getUserPlan(userId);
      const errorMessage = plan === 'free' 
        ? 'Daily generation limit exceeded (3/day for free plan). Upgrade to Pro for unlimited generations.'
        : 'Rate limit exceeded. Please try again later.';
      
      return NextResponse.json({ 
        success: false, 
        error: errorMessage,
        type: 'RATE_LIMIT_ERROR'
      }, { status: 429 });
    }

    // Load platform rules and prompts
    const platformRulesPath = path.join(process.cwd(), 'config/platforms/etsy.json');
    const promptTemplatePath = path.join(process.cwd(), 'config/prompts/etsy-digital.json');
    
    const [platformRules, promptTemplate] = await Promise.all([
      fs.readFile(platformRulesPath, 'utf-8').then(JSON.parse),
      fs.readFile(promptTemplatePath, 'utf-8').then(JSON.parse)
    ]);

    // Extract focus keywords (ensure long-tail)
    const focusKeywords = extractFocusKeywords(sanitizedData.keywords);
    
    // Build prompt with variables
    const prompt = buildPrompt(promptTemplate.userPromptTemplate, {
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

    // Generate listing with OpenAI
    const { content, tokensUsed, model: usedModel } = await generateListing(prompt, model);

    // Parse and validate OpenAI response
    const parsedOutput = parseOpenAIResponse(content);

    // Validate and sanitize output
    const validatedOutput = {
      title: sanitizeInput(parsedOutput.title || '').substring(0, 200),
      description: sanitizeInput(parsedOutput.description || ''),
      tags: (parsedOutput.tags || []).slice(0, 13).map(sanitizeTag).filter(Boolean),
      materials: (parsedOutput.materials || []).slice(0, 13).map(sanitizeInput).filter(Boolean),
      pinterestCaption: sanitizedData.extras?.pinterestCaption ? sanitizeInput(parsedOutput.pinterestCaption || '') : undefined,
      etsyMessage: sanitizedData.extras?.etsyMessage ? sanitizeInput(parsedOutput.etsyMessage || '') : undefined,
    };

    // Ensure exactly 13 tags and materials
    while (validatedOutput.tags.length < 13) {
      validatedOutput.tags.push(`tag${validatedOutput.tags.length + 1}`);
    }
    while (validatedOutput.materials.length < 13) {
      validatedOutput.materials.push(`material${validatedOutput.materials.length + 1}`);
    }

    // Increment usage counter
    await incrementGenerationCount(userId);

    // Track analytics
    await trackGenerationCreated(userId, {
      model: usedModel,
      tokensUsed,
      wordCount: validatedOutput.description.split(' ').length,
      hasExtras: !!(validatedOutput.pinterestCaption || validatedOutput.etsyMessage)
    });

    // Return success response
    const response = {
      success: true,
      data: validatedOutput,
      metadata: {
        wordCount: validatedOutput.description.split(' ').length,
        generatedAt: new Date().toISOString(),
        model: usedModel,
        tokensUsed,
      }
    };

    logger.info('Listing generated successfully', {
      userId,
      plan,
      model: usedModel,
      tokensUsed,
      wordCount: response.metadata.wordCount
    });

    return NextResponse.json(response);

  } catch (error) {
    logger.error('Generation API error', { error: (error as Error).message });
    
    if (error instanceof Error && error.name.includes('RateLimitError')) {
      return NextResponse.json({
        success: false,
        error: error.message,
        type: 'RATE_LIMIT_ERROR'
      }, { status: 429 });
    }

    // Handle OpenAI quota/billing errors specifically
    if (error instanceof Error && error.message.includes('429')) {
      return NextResponse.json({
        success: false,
        error: 'OpenAI API quota exceeded. Please check your OpenAI billing and usage limits.',
        type: 'OPENAI_QUOTA_ERROR'
      }, { status: 429 });
    }

    const errorResponse = getErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateListing, buildPrompt, parseOpenAIResponse } from '@/lib/openai';
import { validateRequest } from '@/lib/validators';
import { generateRequestSchema } from '@/lib/validators';
import { checkAndIncrementGeneration } from '@/lib/generation-quota';
import { PLAN_CONFIG } from '@/lib/entitlements';
import { trackGeneration } from '@/lib/analytics';
import { sanitizeInput, sanitizeTag, extractFocusKeywords } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { getErrorResponse } from '@/lib/errors';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    console.log('=== GENERATION API CALLED ===');
    console.log('URL:', request.url);
    console.log('Method:', request.method);
    console.log('Environment:', process.env.NODE_ENV);
    console.log('OpenAI Key exists:', !!process.env.OPENAI_API_KEY);
    console.log('Clerk Key exists:', !!process.env.CLERK_SECRET_KEY);
    
    logger.info('Generation API called', { 
      url: request.url,
      method: request.method,
      environment: process.env.NODE_ENV,
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      hasClerkKey: !!process.env.CLERK_SECRET_KEY,
      headers: Object.fromEntries(request.headers.entries())
    });

    // Check if required environment variables are configured
    if (!process.env.OPENAI_API_KEY) {
      logger.error('OpenAI API key not configured');
      return NextResponse.json({ 
        success: false, 
        error: 'AI service not configured. Please contact support.',
        type: 'CONFIG_ERROR'
      }, { status: 500 });
    }

    if (!process.env.CLERK_SECRET_KEY) {
      logger.error('Clerk secret key not configured');
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication service not configured. Please contact support.',
        type: 'CONFIG_ERROR'
      }, { status: 500 });
    }

    // Get authenticated user
    logger.info('Getting authenticated user...');
    const { userId } = await auth();
    if (!userId) {
      logger.warn('No user ID found in auth');
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }
    logger.info('User authenticated', { userId });

    // Parse and validate request body
    logger.info('Parsing request body...');
    const body = await request.json();
    logger.info('Request body parsed', { bodyKeys: Object.keys(body) });
    
    const validatedData = validateRequest(generateRequestSchema, body);
    logger.info('Request validated', { validatedKeys: Object.keys(validatedData) });

    // Check and increment generation quota
    logger.info('Checking generation quota...');
    const quota = await checkAndIncrementGeneration(userId);
    logger.info('Quota check result', { quota });
    if (!quota.ok) {
      return NextResponse.json({ 
        success: false, 
        error: quota.error,
        type: 'QUOTA_EXCEEDED'
      }, { status: 402 });
    }

    // Sanitize inputs based on plan
    const plan = quota.plan;
    const allowedTones = PLAN_CONFIG[plan].allowedTones;
    const allowedWords = PLAN_CONFIG[plan].allowedWordCounts;

    const sanitizedData = {
      ...validatedData,
      productName: sanitizeInput(validatedData.productName),
      niche: validatedData.niche ? sanitizeInput(validatedData.niche) : undefined,
      audience: validatedData.audience ? sanitizeInput(validatedData.audience) : undefined,
      keywords: validatedData.keywords.map(sanitizeInput),
      tone: allowedTones.includes(validatedData.tone || '') ? validatedData.tone : allowedTones[0],
      wordCount: allowedWords.includes(validatedData.wordCount || 0) ? validatedData.wordCount : allowedWords[0],
    };

    // Load platform rules and prompts
    const platformRulesPath = path.join(process.cwd(), 'config/platforms/etsy.json');
    const promptTemplatePath = path.join(process.cwd(), 'config/prompts/etsy-digital.json');
    
    console.log('Loading config files...');
    console.log('Platform rules path:', platformRulesPath);
    console.log('Prompt template path:', promptTemplatePath);
    console.log('Current working directory:', process.cwd());
    
    logger.info('Loading config files', {
      platformRulesPath,
      promptTemplatePath,
      cwd: process.cwd()
    });
    
    const [platformRules, promptTemplate] = await Promise.all([
      fs.readFile(platformRulesPath, 'utf-8').then(JSON.parse),
      fs.readFile(promptTemplatePath, 'utf-8').then(JSON.parse)
    ]);
    
    console.log('Config files loaded successfully');
    logger.info('Config files loaded successfully');

    // Extract focus keywords (ensure long-tail)
    const focusKeywords = extractFocusKeywords(sanitizedData.keywords);
    
    // Modify prompt template to include extras if requested
    let modifiedPromptTemplate = promptTemplate.userPromptTemplate;
    let extrasInstructions = '';
    
    if (sanitizedData.extras?.pinterestCaption) {
      extrasInstructions += '\n**Pinterest Caption:** Generate a compelling Pinterest caption (max 500 characters) that includes relevant hashtags and encourages clicks.';
    }
    
    if (sanitizedData.extras?.etsyMessage) {
      extrasInstructions += '\n**Etsy Thank You Message:** Generate a warm, personalized thank you message for buyers that includes care instructions and encourages reviews.';
    }
    
    if (extrasInstructions) {
      modifiedPromptTemplate += extrasInstructions;
    }
    
    // Build prompt with variables
    const prompt = buildPrompt(modifiedPromptTemplate, {
      productName: sanitizedData.productName,
      niche: sanitizedData.niche || 'Digital Products',
      audience: sanitizedData.audience || 'Etsy shoppers',
      keywords: focusKeywords.join(', '),
      tone: sanitizedData.tone || 'Professional',
      wordCount: sanitizedData.wordCount || 300,
      platformRules: JSON.stringify(platformRules, null, 2)
    });

    // Get model based on plan
    const model = plan === 'free' 
      ? (process.env.OPENAI_MODEL_FREE || 'gpt-4o-mini')
      : (process.env.OPENAI_MODEL_GENERATE || 'gpt-4o');

    console.log('Calling OpenAI API...');
    console.log('Model:', model);
    console.log('Plan:', plan);
    console.log('Prompt length:', prompt.length);
    
    logger.info('Calling OpenAI API', {
      model,
      plan,
      promptLength: prompt.length
    });

    // Generate listing with OpenAI
    const { content, tokensUsed, model: usedModel } = await generateListing(prompt, model);
    
    console.log('OpenAI API call successful');
    console.log('Response length:', content.length);
    console.log('Tokens used:', tokensUsed);
    console.log('Model used:', usedModel);
    
    logger.info('OpenAI API call successful', {
      responseLength: content.length,
      tokensUsed,
      modelUsed: usedModel
    });

    // Parse and validate OpenAI response
    const parsedOutput = parseOpenAIResponse(content);

    // Validate and sanitize output
    const sanitizedDescription = sanitizeInput(parsedOutput.description || '');
    const sanitizedTitle = sanitizeInput(parsedOutput.title || '');
    
    // Count words accurately
    const descriptionWordCount = sanitizedDescription.split(/\s+/).filter(word => word.length > 0).length;
    const titleWordCount = sanitizedTitle.split(/\s+/).filter(word => word.length > 0).length;
    const targetWordCount = sanitizedData.wordCount || 300;
    
    // Validate title word count (must be exactly 15 words)
    if (titleWordCount !== 15) {
      logger.warn('Generated title word count is incorrect', {
        targetWords: 15,
        actualWords: titleWordCount,
        title: sanitizedTitle,
        userId
      });
    }
    
    // Validate description word count (must be within 5% of target)
    const wordCountTolerance = Math.floor(targetWordCount * 0.05);
    const minWords = targetWordCount - wordCountTolerance;
    const maxWords = targetWordCount + wordCountTolerance;
    
    if (descriptionWordCount < minWords || descriptionWordCount > maxWords) {
      logger.warn('Generated description word count is outside tolerance', {
        targetWords: targetWordCount,
        actualWords: descriptionWordCount,
        tolerance: wordCountTolerance,
        minWords,
        maxWords,
        userId
      });
    }
    
    const validatedOutput = {
      title: sanitizeInput(parsedOutput.title || '').substring(0, 200),
      description: sanitizedDescription,
      tags: (parsedOutput.tags || []).slice(0, 13).map(sanitizeTag).filter(Boolean),
      materials: (parsedOutput.materials || []).slice(0, 13).map(sanitizeInput).filter(Boolean),
      pinterestCaption: sanitizedData.extras?.pinterestCaption ? sanitizeInput(parsedOutput.pinterestCaption || 'No Pinterest caption generated') : undefined,
      etsyMessage: sanitizedData.extras?.etsyMessage ? sanitizeInput(parsedOutput.etsyMessage || 'No Etsy message generated') : undefined,
    };

    // Ensure exactly 13 tags and materials
    while (validatedOutput.tags.length < 13) {
      validatedOutput.tags.push(`tag${validatedOutput.tags.length + 1}`);
    }
    while (validatedOutput.materials.length < 13) {
      validatedOutput.materials.push(`material${validatedOutput.materials.length + 1}`);
    }

    // Quota already incremented in checkAndIncrementGeneration

    // Track analytics
    trackGeneration(
      userId, 
      plan, 
      sanitizedData.wordCount || 200, 
      sanitizedData.tone || 'Professional'
    );

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
    logger.error('Generation API error', { 
      error: (error as Error).message,
      stack: (error as Error).stack,
      name: (error as Error).name
    });
    
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

    // Handle authentication errors
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required. Please sign in again.',
        type: 'AUTH_ERROR'
      }, { status: 401 });
    }

    // Handle quota errors
    if (error instanceof Error && error.message.includes('limit reached')) {
      return NextResponse.json({
        success: false,
        error: error.message,
        type: 'QUOTA_EXCEEDED'
      }, { status: 402 });
    }

    const errorResponse = getErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}

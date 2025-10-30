/**
 * Blog Content Generation API
 * Generates complete SEO-optimized blog posts using OpenAI
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';
import { generateListing } from '@/lib/openai';
import { 
  BLOG_GENERATION_SYSTEM_PROMPT, 
  BLOG_GENERATION_USER_PROMPT, 
  BLOG_GENERATION_MODEL_CONFIG,
  validateBlogGenerationOutput,
  calculateKeywordDensity,
  extractHeadings
} from '@/lib/prompts/blog-generation';
import { BLOG_AUTOMATION_CONFIG, BlogGenerationInput } from '@/lib/blog-automation-config';
import { logger } from '@/lib/logger';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const body = await request.json();
    const { primaryKeyword, secondaryKeywords, category, internalLinkSuggestions } = body as BlogGenerationInput;

    // Validate input
    if (!primaryKeyword || !secondaryKeywords || !category) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: primaryKeyword, secondaryKeywords, category'
      }, { status: 400 });
    }

    logger.info('Blog content generation started', { 
      userId, 
      primaryKeyword, 
      category 
    });

    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      logger.error('OpenAI API key not configured');
      return NextResponse.json({
        success: false,
        error: 'AI service not configured'
      }, { status: 500 });
    }

    // Prepare generation input
    const generationInput: BlogGenerationInput = {
      primaryKeyword,
      secondaryKeywords,
      category,
      internalLinkSuggestions: internalLinkSuggestions || []
    };

    // Create the prompt
    const systemPrompt = BLOG_GENERATION_SYSTEM_PROMPT;
    const userPrompt = BLOG_GENERATION_USER_PROMPT(generationInput);

    logger.info('Generating blog content with OpenAI', {
      userId,
      primaryKeyword,
      model: BLOG_GENERATION_MODEL_CONFIG.model
    });

    // Generate content using OpenAI
    const generationResult = await generateListing(
      `${systemPrompt}\n\n${userPrompt}`,
      BLOG_GENERATION_MODEL_CONFIG.model
    );

    if (!generationResult.content) {
      logger.error('OpenAI returned empty content');
      return NextResponse.json({
        success: false,
        error: 'Failed to generate content'
      }, { status: 500 });
    }

    // Parse the JSON response
    let generatedData;
    try {
      generatedData = JSON.parse(generationResult.content);
    } catch (parseError) {
      logger.error('Failed to parse OpenAI response as JSON', { 
        error: parseError,
        content: generationResult.content.substring(0, 500)
      });
      return NextResponse.json({
        success: false,
        error: 'Invalid response format from AI'
      }, { status: 500 });
    }

    // Validate the generated content
    if (!validateBlogGenerationOutput(generatedData)) {
      logger.error('Generated content failed validation', { generatedData });
      return NextResponse.json({
        success: false,
        error: 'Generated content does not meet quality requirements'
      }, { status: 500 });
    }

    // Calculate additional metrics
    const keywordDensity = calculateKeywordDensity(generatedData.content, primaryKeyword);
    const headings = extractHeadings(generatedData.content);
    const wordCount = generatedData.content.split(/\s+/).length;

    logger.info('Blog content generated successfully', {
      userId,
      primaryKeyword,
      wordCount,
      keywordDensity,
      headingCount: headings.h2.length + headings.h3.length
    });

    // Create blog post in database
    const blogPost = await prisma.blogPost.create({
      data: {
        userId,
        title: generatedData.title,
        slug: generatedData.slug,
        excerpt: generatedData.excerpt,
        content: generatedData.content,
        featuredImage: generatedData.featuredImage,
        status: 'draft',
        tags: generatedData.tags,
        category: generatedData.category,
        seoTitle: generatedData.seoTitle,
        seoDescription: generatedData.seoDescription,
        seoKeywords: generatedData.seoKeywords,
        workflowStatus: 'generated',
        aiGeneratedTopicKeyword: primaryKeyword,
        targetKeywordDensity: keywordDensity,
        internalLinksAdded: JSON.stringify(generatedData.internalLinks),
        autoPublished: false
      }
    });

    logger.info('Blog post saved to database', {
      userId,
      postId: blogPost.id,
      title: blogPost.title
    });

    return NextResponse.json({
      success: true,
      data: {
        postId: blogPost.id,
        title: blogPost.title,
        slug: blogPost.slug,
        wordCount,
        keywordDensity,
        headingCount: headings.h2.length + headings.h3.length,
        internalLinksCount: generatedData.internalLinks.length,
        workflowStatus: blogPost.workflowStatus
      }
    });

  } catch (error) {
    logger.error('Blog content generation error', { 
      error: (error as Error).message,
      stack: (error as Error).stack 
    });

    return NextResponse.json({
      success: false,
      error: 'Internal server error during content generation'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    // Get recent generated posts for monitoring
    const recentPosts = await prisma.blogPost.findMany({
      where: {
        userId,
        workflowStatus: 'generated'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10,
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        createdAt: true,
        targetKeywordDensity: true,
        aiGeneratedTopicKeyword: true
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        recentPosts,
        totalGenerated: recentPosts.length
      }
    });

  } catch (error) {
    logger.error('Blog content stats error', { 
      error: (error as Error).message 
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch content statistics'
    }, { status: 500 });
  }
}

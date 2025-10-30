/**
 * Blog Content Revision API
 * Revises content based on quality check feedback
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
    const { postId } = body;

    if (!postId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required field: postId'
      }, { status: 400 });
    }

    logger.info('Blog content revision started', { userId, postId });

    // Get the blog post
    const blogPost = await prisma.blogPost.findFirst({
      where: {
        id: postId,
        userId
      }
    });

    if (!blogPost) {
      return NextResponse.json({
        success: false,
        error: 'Blog post not found'
      }, { status: 404 });
    }

    // Check if post needs revision
    if (blogPost.workflowStatus !== 'needs_revision') {
      return NextResponse.json({
        success: false,
        error: 'Blog post does not need revision'
      }, { status: 400 });
    }

    // Check revision limit
    if (blogPost.revisionCount >= BLOG_AUTOMATION_CONFIG.MAX_REVISION_ATTEMPTS) {
      logger.warn('Maximum revision attempts reached', { 
        userId, 
        postId, 
        revisionCount: blogPost.revisionCount 
      });
      
      // Update status to failed
      await prisma.blogPost.update({
        where: { id: postId },
        data: { workflowStatus: 'failed' }
      });

      return NextResponse.json({
        success: false,
        error: 'Maximum revision attempts reached. Post marked as failed.'
      }, { status: 400 });
    }

    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      logger.error('OpenAI API key not configured');
      return NextResponse.json({
        success: false,
        error: 'AI service not configured'
      }, { status: 500 });
    }

    // Parse quality feedback
    let qualityFeedback = null;
    if (blogPost.qualityFeedback) {
      try {
        qualityFeedback = JSON.parse(blogPost.qualityFeedback);
      } catch (error) {
        logger.warn('Failed to parse quality feedback', { postId, error });
      }
    }

    // Prepare revision input
    const primaryKeyword = blogPost.aiGeneratedTopicKeyword || '';
    const secondaryKeywords = blogPost.seoKeywords || [];
    const category = blogPost.category || 'Etsy business growth';

    // Create revision prompt
    const revisionSystemPrompt = `${BLOG_GENERATION_SYSTEM_PROMPT}

REVISION REQUIREMENTS:
You are revising an existing blog post based on quality feedback. Address the specific issues mentioned in the feedback while maintaining the original structure and improving SEO optimization.

QUALITY FEEDBACK TO ADDRESS:
${qualityFeedback ? JSON.stringify(qualityFeedback, null, 2) : 'No specific feedback available'}

REVISION GUIDELINES:
1. Fix all SEO issues mentioned in feedback
2. Improve keyword optimization and density
3. Enhance content structure and readability
4. Improve internal linking quality
5. Maintain target audience focus (Etsy sellers)
6. Keep the same topic and primary keyword
7. Address all suggestions from quality feedback`;

    const revisionUserPrompt = `Revise this blog post to address the quality issues:

ORIGINAL POST:
Title: ${blogPost.title}
Content: ${blogPost.content}
SEO Title: ${blogPost.seoTitle}
SEO Description: ${blogPost.seoDescription}
SEO Keywords: ${JSON.stringify(blogPost.seoKeywords)}

PRIMARY KEYWORD: ${primaryKeyword}
SECONDARY KEYWORDS: ${secondaryKeywords.join(', ')}
CATEGORY: ${category}

REVISION FOCUS:
- Address SEO completeness issues
- Improve keyword optimization and density
- Enhance content structure and readability
- Improve internal linking quality
- Maintain focus on Etsy sellers

OUTPUT FORMAT:
Return valid JSON with all required fields (same as original generation):
{
  "title": "50-60 chars, keyword + benefit",
  "slug": "url-friendly-keyword-rich-slug", 
  "excerpt": "150-160 chars, keyword + compelling hook",
  "content": "1000-1800 words HTML with H2/H3/lists/bold/links",
  "seoTitle": "55-60 chars, keyword-front-loaded",
  "seoDescription": "150-160 chars, keyword + CTA",
  "seoKeywords": ["8-12 keywords array"],
  "tags": ["5-8 internal tags"],
  "category": "${category}",
  "featuredImage": "placeholder-url",
  "internalLinks": [
    {"url": "/app/generator", "anchor": "listing generator", "context": "sentence with link"}
  ],
  "targetKeywordDensity": 1.5
}

Remember: This is a revision, not a new post. Improve the existing content based on feedback.`;

    logger.info('Generating revised content with OpenAI', {
      userId,
      postId,
      revisionCount: blogPost.revisionCount + 1,
      model: BLOG_GENERATION_MODEL_CONFIG.model
    });

    // Generate revised content using OpenAI
    const revisionResult = await generateListing(
      `${revisionSystemPrompt}\n\n${revisionUserPrompt}`,
      BLOG_GENERATION_MODEL_CONFIG.model
    );

    if (!revisionResult.content) {
      logger.error('OpenAI returned empty revision content');
      return NextResponse.json({
        success: false,
        error: 'Failed to generate revised content'
      }, { status: 500 });
    }

    // Parse the JSON response
    let revisedData;
    try {
      revisedData = JSON.parse(revisionResult.content);
    } catch (parseError) {
      logger.error('Failed to parse revision response as JSON', { 
        error: parseError,
        content: revisionResult.content.substring(0, 500)
      });
      return NextResponse.json({
        success: false,
        error: 'Invalid revision response format'
      }, { status: 500 });
    }

    // Validate the revised content
    if (!validateBlogGenerationOutput(revisedData)) {
      logger.error('Revised content failed validation', { revisedData });
      return NextResponse.json({
        success: false,
        error: 'Revised content does not meet quality requirements'
      }, { status: 500 });
    }

    // Calculate additional metrics
    const keywordDensity = calculateKeywordDensity(revisedData.content, primaryKeyword);
    const headings = extractHeadings(revisedData.content);
    const wordCount = revisedData.content.split(/\s+/).length;

    logger.info('Blog content revised successfully', {
      userId,
      postId,
      wordCount,
      keywordDensity,
      headingCount: headings.h2.length + headings.h3.length,
      revisionCount: blogPost.revisionCount + 1
    });

    // Update blog post with revised content
    const updatedPost = await prisma.blogPost.update({
      where: { id: postId },
      data: {
        title: revisedData.title,
        slug: revisedData.slug,
        excerpt: revisedData.excerpt,
        content: revisedData.content,
        seoTitle: revisedData.seoTitle,
        seoDescription: revisedData.seoDescription,
        seoKeywords: revisedData.seoKeywords,
        tags: revisedData.tags,
        targetKeywordDensity: keywordDensity,
        internalLinksAdded: JSON.stringify(revisedData.internalLinks),
        revisionCount: blogPost.revisionCount + 1,
        workflowStatus: 'generated', // Reset to generated for new quality check
        qualityScore: null, // Clear previous quality score
        qualityFeedback: null // Clear previous feedback
      }
    });

    logger.info('Blog post updated with revised content', {
      userId,
      postId,
      title: updatedPost.title,
      revisionCount: updatedPost.revisionCount
    });

    return NextResponse.json({
      success: true,
      data: {
        postId: updatedPost.id,
        title: updatedPost.title,
        slug: updatedPost.slug,
        wordCount,
        keywordDensity,
        headingCount: headings.h2.length + headings.h3.length,
        internalLinksCount: revisedData.internalLinks.length,
        revisionCount: updatedPost.revisionCount,
        workflowStatus: updatedPost.workflowStatus
      }
    });

  } catch (error) {
    logger.error('Blog content revision error', { 
      error: (error as Error).message,
      stack: (error as Error).stack 
    });

    return NextResponse.json({
      success: false,
      error: 'Internal server error during content revision'
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

    // Get posts that need revision
    const postsNeedingRevision = await prisma.blogPost.findMany({
      where: {
        userId,
        workflowStatus: 'needs_revision'
      },
      orderBy: {
        updatedAt: 'desc'
      },
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        revisionCount: true,
        qualityScore: true,
        updatedAt: true
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        postsNeedingRevision,
        totalNeedingRevision: postsNeedingRevision.length
      }
    });

  } catch (error) {
    logger.error('Blog revision stats error', { 
      error: (error as Error).message 
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch revision statistics'
    }, { status: 500 });
  }
}

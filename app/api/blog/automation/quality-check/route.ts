/**
 * Blog Quality Check API
 * Comprehensive SEO and content quality assessment using second AI reviewer
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';
import { generateListing } from '@/lib/openai';
import { 
  BLOG_QUALITY_CHECK_SYSTEM_PROMPT, 
  BLOG_QUALITY_CHECK_USER_PROMPT, 
  BLOG_QUALITY_CHECK_MODEL_CONFIG,
  validateQualityCheckResult,
  calculateReadabilityScore,
  extractInternalLinks
} from '@/lib/prompts/blog-quality-check';
import { BLOG_AUTOMATION_CONFIG } from '@/lib/blog-automation-config';
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

    logger.info('Blog quality check started', { userId, postId });

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

    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      logger.error('OpenAI API key not configured');
      return NextResponse.json({
        success: false,
        error: 'AI service not configured'
      }, { status: 500 });
    }

    // Prepare quality check data
    const primaryKeyword = blogPost.aiGeneratedTopicKeyword || '';
    const secondaryKeywords = blogPost.seoKeywords || [];

    // Calculate additional metrics
    const readabilityScore = calculateReadabilityScore(blogPost.content);
    const internalLinks = extractInternalLinks(blogPost.content);
    const wordCount = blogPost.content.split(/\s+/).length;

    logger.info('Running quality check with OpenAI', {
      userId,
      postId,
      primaryKeyword,
      wordCount,
      readabilityScore,
      internalLinksCount: internalLinks.length
    });

    // Create the quality check prompt
    const systemPrompt = BLOG_QUALITY_CHECK_SYSTEM_PROMPT;
    const userPrompt = BLOG_QUALITY_CHECK_USER_PROMPT(blogPost, primaryKeyword, secondaryKeywords);

    // Run quality check using OpenAI
    const qualityResult = await generateListing(
      `${systemPrompt}\n\n${userPrompt}`,
      BLOG_QUALITY_CHECK_MODEL_CONFIG.model
    );

    if (!qualityResult.content) {
      logger.error('OpenAI returned empty quality check result');
      return NextResponse.json({
        success: false,
        error: 'Failed to perform quality check'
      }, { status: 500 });
    }

    // Parse the JSON response
    let qualityData;
    try {
      qualityData = JSON.parse(qualityResult.content);
    } catch (parseError) {
      logger.error('Failed to parse quality check response as JSON', { 
        error: parseError,
        content: qualityResult.content.substring(0, 500)
      });
      return NextResponse.json({
        success: false,
        error: 'Invalid quality check response format'
      }, { status: 500 });
    }

    // Validate the quality check result
    if (!validateQualityCheckResult(qualityData)) {
      logger.error('Quality check result failed validation', { qualityData });
      return NextResponse.json({
        success: false,
        error: 'Quality check result does not meet validation requirements'
      }, { status: 500 });
    }

    // Determine if post needs revision
    const needsRevision = !qualityData.approved || qualityData.score < BLOG_AUTOMATION_CONFIG.MIN_QUALITY_SCORE;
    const newWorkflowStatus = needsRevision ? 'needs_revision' : 'approved';

    // Update blog post with quality check results
    const updatedPost = await prisma.blogPost.update({
      where: { id: postId },
      data: {
        workflowStatus: newWorkflowStatus,
        qualityScore: qualityData.score,
        qualityFeedback: JSON.stringify(qualityData.feedback)
      }
    });

    logger.info('Quality check completed', {
      userId,
      postId,
      score: qualityData.score,
      approved: qualityData.approved,
      needsRevision,
      workflowStatus: newWorkflowStatus
    });

    return NextResponse.json({
      success: true,
      data: {
        postId: updatedPost.id,
        score: qualityData.score,
        approved: qualityData.approved,
        needsRevision,
        workflowStatus: updatedPost.workflowStatus,
        feedback: qualityData.feedback,
        suggestions: qualityData.suggestions,
        missingFields: qualityData.missingFields,
        seoIssues: qualityData.seoIssues,
        metrics: {
          wordCount,
          readabilityScore,
          internalLinksCount: internalLinks.length,
          keywordDensity: blogPost.targetKeywordDensity
        }
      }
    });

  } catch (error) {
    logger.error('Blog quality check error', { 
      error: (error as Error).message,
      stack: (error as Error).stack 
    });

    return NextResponse.json({
      success: false,
      error: 'Internal server error during quality check'
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

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    if (!postId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameter: postId'
      }, { status: 400 });
    }

    // Get quality check results for a specific post
    const blogPost = await prisma.blogPost.findFirst({
      where: {
        id: postId,
        userId
      },
      select: {
        id: true,
        title: true,
        workflowStatus: true,
        qualityScore: true,
        qualityFeedback: true,
        revisionCount: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!blogPost) {
      return NextResponse.json({
        success: false,
        error: 'Blog post not found'
      }, { status: 404 });
    }

    let feedback = null;
    if (blogPost.qualityFeedback) {
      try {
        feedback = JSON.parse(blogPost.qualityFeedback);
      } catch (error) {
        logger.warn('Failed to parse quality feedback JSON', { postId, error });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        postId: blogPost.id,
        title: blogPost.title,
        workflowStatus: blogPost.workflowStatus,
        qualityScore: blogPost.qualityScore,
        feedback,
        revisionCount: blogPost.revisionCount,
        createdAt: blogPost.createdAt,
        updatedAt: blogPost.updatedAt
      }
    });

  } catch (error) {
    logger.error('Blog quality check stats error', { 
      error: (error as Error).message 
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch quality check statistics'
    }, { status: 500 });
  }
}

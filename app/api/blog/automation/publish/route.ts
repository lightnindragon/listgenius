/**
 * Blog Automated Publish API
 * Publishes approved blog posts and triggers sitemap updates
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';
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

    logger.info('Blog automated publish started', { userId, postId });

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

    // Validate post is ready for publishing
    if (blogPost.workflowStatus !== 'approved') {
      return NextResponse.json({
        success: false,
        error: `Blog post is not approved for publishing. Current status: ${blogPost.workflowStatus}`
      }, { status: 400 });
    }

    // Validate all required fields are present
    const missingFields = BLOG_AUTOMATION_CONFIG.REQUIRED_FIELDS.filter(field => {
      const value = (blogPost as any)[field];
      return !value || (Array.isArray(value) && value.length === 0) || (typeof value === 'string' && value.trim() === '');
    });

    if (missingFields.length > 0) {
      logger.error('Blog post missing required fields', { 
        postId, 
        missingFields 
      });
      return NextResponse.json({
        success: false,
        error: `Blog post is missing required fields: ${missingFields.join(', ')}`
      }, { status: 400 });
    }

    // Validate content length
    const wordCount = blogPost.content.split(/\s+/).length;
    if (wordCount < BLOG_AUTOMATION_CONFIG.MIN_WORD_COUNT) {
      logger.error('Blog post below minimum word count', { 
        postId, 
        wordCount, 
        minRequired: BLOG_AUTOMATION_CONFIG.MIN_WORD_COUNT 
      });
      return NextResponse.json({
        success: false,
        error: `Blog post is too short. Minimum ${BLOG_AUTOMATION_CONFIG.MIN_WORD_COUNT} words required, got ${wordCount}`
      }, { status: 400 });
    }

    // Validate keyword density
    if (blogPost.targetKeywordDensity && blogPost.aiGeneratedTopicKeyword) {
      if (blogPost.targetKeywordDensity < BLOG_AUTOMATION_CONFIG.MIN_KEYWORD_DENSITY) {
        logger.warn('Blog post below minimum keyword density', { 
          postId, 
          density: blogPost.targetKeywordDensity,
          minRequired: BLOG_AUTOMATION_CONFIG.MIN_KEYWORD_DENSITY 
        });
      }
    }

    // Publish the blog post
    const now = new Date();
    const publishedPost = await prisma.blogPost.update({
      where: { id: postId },
      data: {
        status: 'published',
        publishedAt: now,
        workflowStatus: 'published',
        autoPublished: true,
        scheduledPublishAt: null // Clear any scheduled publish time
      }
    });

    logger.info('Blog post published successfully', {
      userId,
      postId,
      title: publishedPost.title,
      slug: publishedPost.slug,
      publishedAt: publishedPost.publishedAt,
      wordCount
    });

    // Trigger sitemap update (async, don't wait)
    try {
      // This would typically trigger a sitemap regeneration
      // For now, we'll just log it
      logger.info('Sitemap update triggered', { postId });
      
      // In a real implementation, you might:
      // 1. Call a sitemap generation service
      // 2. Add to a queue for background processing
      // 3. Trigger a webhook to update search engines
      
    } catch (sitemapError) {
      logger.warn('Sitemap update failed', { postId, error: sitemapError });
      // Don't fail the publish operation for sitemap issues
    }

    // Generate the published URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const publishedUrl = `${baseUrl}/blog/${publishedPost.slug}`;

    return NextResponse.json({
      success: true,
      data: {
        postId: publishedPost.id,
        title: publishedPost.title,
        slug: publishedPost.slug,
        publishedUrl,
        publishedAt: publishedPost.publishedAt,
        wordCount,
        keywordDensity: publishedPost.targetKeywordDensity,
        autoPublished: publishedPost.autoPublished,
        workflowStatus: publishedPost.workflowStatus
      }
    });

  } catch (error) {
    logger.error('Blog automated publish error', { 
      error: (error as Error).message,
      stack: (error as Error).stack 
    });

    return NextResponse.json({
      success: false,
      error: 'Internal server error during publishing'
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
    const status = searchParams.get('status') || 'published';
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get published posts for monitoring
    const publishedPosts = await prisma.blogPost.findMany({
      where: {
        userId,
        status: status as any,
        autoPublished: true
      },
      orderBy: {
        publishedAt: 'desc'
      },
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        publishedAt: true,
        content: true,
        targetKeywordDensity: true,
        qualityScore: true,
        revisionCount: true,
        aiGeneratedTopicKeyword: true
      }
    });

    // Calculate word count for each post
    const postsWithWordCount = publishedPosts.map(post => ({
      ...post,
      wordCount: post.content ? post.content.split(/\s+/).length : 0
    }));

    // Calculate statistics
    const totalPosts = publishedPosts.length;
    const avgWordCount = totalPosts > 0 
      ? Math.round(postsWithWordCount.reduce((sum, post) => sum + post.wordCount, 0) / totalPosts)
      : 0;
    const avgQualityScore = totalPosts > 0
      ? Math.round(postsWithWordCount.reduce((sum, post) => sum + (post.qualityScore || 0), 0) / totalPosts)
      : 0;
    const avgRevisionCount = totalPosts > 0
      ? Math.round(postsWithWordCount.reduce((sum, post) => sum + post.revisionCount, 0) / totalPosts)
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        posts: postsWithWordCount,
        statistics: {
          totalPosts,
          avgWordCount,
          avgQualityScore,
          avgRevisionCount
        }
      }
    });

  } catch (error) {
    logger.error('Blog publish stats error', { 
      error: (error as Error).message 
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch publish statistics'
    }, { status: 500 });
  }
}

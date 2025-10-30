/**
 * Blog Topic Generation API
 * Fetches trending keywords and generates topic packages for blog automation
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { blogTopicManager } from '@/lib/blog-topic-manager';
import { logger } from '@/lib/logger';
import { BLOG_AUTOMATION_CONFIG } from '@/lib/blog-automation-config';

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

    logger.info('Blog topic generation started', { userId });

    // Get trending keywords from existing API
    const trendingResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/keywords/live?action=trending&category=etsy&limit=20`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.INTERNAL_API_KEY || 'internal'}`,
        'Content-Type': 'application/json'
      }
    });

    if (!trendingResponse.ok) {
      logger.error('Failed to fetch trending keywords', { 
        status: trendingResponse.status,
        statusText: trendingResponse.statusText 
      });
      
      // Fallback to hardcoded keywords if API fails
      const fallbackKeywords = [
        'etsy seo strategies',
        'etsy listing optimization',
        'etsy shop management',
        'etsy marketing tips',
        'etsy keyword research',
        'etsy sales growth',
        'etsy automation tools',
        'etsy seasonal trends',
        'etsy business growth',
        'etsy shop optimization'
      ];
      
      const topicPackage = await blogTopicManager.generateTopicPackage(fallbackKeywords);
      
      if (!topicPackage) {
        return NextResponse.json({
          success: false,
          error: 'No suitable topics found'
        }, { status: 404 });
      }

      logger.info('Used fallback keywords for topic generation', { 
        userId, 
        primaryKeyword: topicPackage.primaryKeyword 
      });

      return NextResponse.json({
        success: true,
        data: topicPackage
      });
    }

    const trendingData = await trendingResponse.json();
    
    if (!trendingData.success || !trendingData.keywords) {
      logger.error('Invalid response from trending keywords API', { trendingData });
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch trending keywords'
      }, { status: 500 });
    }

    // Extract keywords from response
    const trendingKeywords = trendingData.keywords.map((item: any) => item.keyword || item.term || item).slice(0, 20);
    
    logger.info('Fetched trending keywords', { 
      userId, 
      keywordCount: trendingKeywords.length 
    });

    // Generate topic package
    const topicPackage = await blogTopicManager.generateTopicPackage(trendingKeywords);
    
    if (!topicPackage) {
      logger.warn('No suitable topics found after filtering', { 
        userId, 
        originalKeywordCount: trendingKeywords.length 
      });
      
      return NextResponse.json({
        success: false,
        error: 'No suitable topics found after filtering blacklisted and recently used keywords'
      }, { status: 404 });
    }

    logger.info('Topic package generated successfully', {
      userId,
      primaryKeyword: topicPackage.primaryKeyword,
      category: topicPackage.category,
      secondaryKeywordCount: topicPackage.secondaryKeywords.length
    });

    return NextResponse.json({
      success: true,
      data: topicPackage
    });

  } catch (error) {
    logger.error('Blog topic generation error', { 
      error: (error as Error).message,
      stack: (error as Error).stack 
    });

    return NextResponse.json({
      success: false,
      error: 'Internal server error during topic generation'
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

    // Get category distribution for monitoring
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const categoryStats = await blogTopicManager.getNextCategory();
    
    return NextResponse.json({
      success: true,
      data: {
        nextCategory: categoryStats,
        availableCategories: BLOG_AUTOMATION_CONFIG.CATEGORIES,
        maxCategoryPercentage: BLOG_AUTOMATION_CONFIG.MAX_CATEGORY_PERCENTAGE
      }
    });

  } catch (error) {
    logger.error('Blog topic stats error', { 
      error: (error as Error).message 
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch topic statistics'
    }, { status: 500 });
  }
}

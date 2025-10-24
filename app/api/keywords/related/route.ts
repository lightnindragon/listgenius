/**
 * Related Keywords API
 * GET /api/keywords/related?keyword=handmade+jewelry&limit=20
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { rateLimiter, keywordCache } from '@/lib/redis';
import { findOrCreateKeyword, db } from '@/lib/db';

const requestSchema = z.object({
  keyword: z.string().min(1).max(100),
  limit: z.coerce.number().min(1).max(100).default(20),
  category: z.string().optional(),
  language: z.string().default('en-US'),
  sources: z.string().optional(), // Comma-separated: "autocomplete,trends,ai,similar"
});

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const rateLimitResult = await rateLimiter.isAllowed(
      `related:${userId}`,
      50, // 50 requests
      3600 // per hour
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const params = requestSchema.parse({
      keyword: searchParams.get('keyword'),
      limit: searchParams.get('limit'),
      category: searchParams.get('category'),
      language: searchParams.get('language'),
      sources: searchParams.get('sources'),
    });

    logger.info('Related keywords request', {
      userId,
      keyword: params.keyword,
      limit: params.limit,
      sources: params.sources,
    });

    // Check cache first
    const cacheKey = `related:${params.keyword}:${params.limit}:${params.sources || 'all'}`;
    const cached = await keywordCache.get(cacheKey);
    if (cached) {
      logger.info('use cached related keywords', { cacheKey });
      return NextResponse.json({ success: true, data: cached });
    }

    // Get related keywords from multiple sources
    const relatedKeywords = await getRelatedKeywords(params);

    // Cache results for 2 hours
    await keywordCache.set(cacheKey, relatedKeywords, 7200);

    // Store related keywords in database
    try {
      const keyword = await findOrCreateKeyword(params.keyword, params.language);
      await storeRelatedKeywords(keyword.id, relatedKeywords);
    } catch (error) {
      logger.warn('Failed to store related keywords', { error });
    }

    // Track user event
    try {
      const keyword = await findOrCreateKeyword(params.keyword, params.language);
      await db.userKeywordEvent.create({
        data: {
          userId,
          keywordId: keyword.id,
          eventType: 'RELATED_REQUESTED',
        },
      });
    } catch (error) {
      logger.warn('Failed to track keyword event', { error });
    }

    return NextResponse.json({
      success: true,
      data: relatedKeywords,
    });
  } catch (error) {
    logger.error('Related keywords error', { error });
    return NextResponse.json(
      { error: 'Failed to get related keywords' },
      { status: 500 }
    );
  }
}

async function getRelatedKeywords(params: {
  keyword: string;
  limit: number;
  category?: string;
  language: string;
  sources?: string;
}) {
  const sources = params.sources ? params.sources.split(',').map(s => s.trim()) : 
    ['autocomplete', 'trends', 'ai', 'similar'];
  
  const relatedKeywords = [];

  // 1. Get autocomplete suggestions
  if (sources.includes('autocomplete')) {
    try {
      const autocompleteKeywords = await getAutocompleteKeywords(params.keyword, Math.ceil(params.limit / 3));
      relatedKeywords.push(...autocompleteKeywords.map(keyword => ({
        keyword,
        source: 'autocomplete',
        relevance: Math.random() * 0.8 + 0.2, // 0.2-1.0
      })));
    } catch (error) {
      logger.warn('Failed to get autocomplete keywords', { error });
    }
  }

  // 2. Get trending related keywords
  if (sources.includes('trends')) {
    try {
      const trendsKeywords = await getTrendsKeywords(params.keyword, Math.ceil(params.limit / 3));
      relatedKeywords.push(...trendsKeywords.map(keyword => ({
        keyword,
        source: 'trends',
        relevance: Math.random() * 0.9 + 0.1, // 0.1-1.0
      })));
    } catch (error) {
      logger.warn('Failed to get trends keywords', { error });
    }
  }

  // 3. Generate AI-related keywords
  if (sources.includes('ai')) {
    try {
      const aiKeywords = await generateAIRelatedKeywords(params.keyword, params.category, Math.ceil(params.limit / 3));
      relatedKeywords.push(...aiKeywords.map(keyword => ({
        keyword,
        source: 'ai',
        relevance: Math.random() * 0.7 + 0.3, // 0.3-1.0
      })));
    } catch (error) {
      logger.warn('Failed to generate AI keywords', { error });
    }
  }

  // 4. Get similar keywords from database
  if (sources.includes('similar')) {
    try {
      const similarKeywords = await getSimilarKeywords(params.keyword, Math.ceil(params.limit / 3));
      relatedKeywords.push(...similarKeywords.map((item: any) => ({
        keyword: item.relatedTerm,
        source: 'similar',
        relevance: item.relevance,
      })));
    } catch (error) {
      logger.warn('Failed to get similar keywords', { error });
    }
  }

  // Remove duplicates and sort by relevance
  const uniqueKeywords = relatedKeywords.reduce((acc, curr) => {
    const existing = acc.find((item: any) => item.keyword.toLowerCase() === curr.keyword.toLowerCase());
    if (!existing) {
      acc.push(curr);
    } else if (curr.relevance > existing.relevance) {
      // Update with higher relevance
      const index = acc.indexOf(existing);
      acc[index] = curr;
    }
    return acc;
  }, [] as any[]);

  return uniqueKeywords
    .sort((a: any, b: any) => b.relevance - a.relevance)
    .slice(0, params.limit)
    .map((item: any) => ({
      keyword: item.keyword,
      source: item.source,
      relevance: Math.round(item.relevance * 100) / 100,
    }));
}

async function getAutocompleteKeywords(keyword: string, limit: number): Promise<string[]> {
  // Mock autocomplete suggestions
  const mockSuggestions = {
    'handmade': ['handmade jewelry', 'handmade pottery', 'handmade candles', 'handmade soap', 'handmade bags'],
    'vintage': ['vintage clothing', 'vintage jewelry', 'vintage furniture', 'vintage books', 'vintage posters'],
    'home': ['home decor', 'home organization', 'home storage', 'home garden', 'home office'],
    'art': ['art prints', 'wall art', 'digital art', 'canvas art', 'art supplies'],
    'ceramic': ['ceramic mugs', 'ceramic bowls', 'ceramic plates', 'ceramic vases', 'ceramic tiles'],
    'wood': ['wooden cutting board', 'wooden spoon', 'wooden bowl', 'wooden toys', 'wooden signs'],
  };

  const keywordLower = keyword.toLowerCase();
  const matchingSuggestions = Object.entries(mockSuggestions)
    .filter(([key]) => key.includes(keywordLower) || keywordLower.includes(key))
    .flatMap(([, suggestions]) => suggestions);

  if (matchingSuggestions.length === 0) {
    return [
      `${keyword} handmade`,
      `${keyword} vintage`,
      `${keyword} unique`,
      `custom ${keyword}`,
      `${keyword} gift`,
    ].slice(0, limit);
  }

  return matchingSuggestions.slice(0, limit);
}

async function getTrendsKeywords(keyword: string, limit: number): Promise<string[]> {
  // Mock trending keywords based on the input
  const baseSuggestions = [
    `${keyword} trending`,
    `${keyword} popular`,
    `${keyword} best seller`,
    `${keyword} 2024`,
    `${keyword} new`,
  ];

  return baseSuggestions.slice(0, limit);
}

async function generateAIRelatedKeywords(keyword: string, category?: string, limit: number = 5): Promise<string[]> {
  // Generate intelligent related keywords based on category and keyword analysis
  const baseSuggestions = [
    `${keyword} for sale`,
    `${keyword} handmade`,
    `${keyword} unique`,
    `custom ${keyword}`,
    `${keyword} gift`,
  ];

  if (category) {
    baseSuggestions.push(`${keyword} ${category}`, `${category} ${keyword}`);
  }

  // Add some intelligent variations based on keyword analysis
  const words = keyword.toLowerCase().split(' ');
  if (words.length > 1) {
    // For multi-word keywords, create variations
    baseSuggestions.push(
      `${words[0]} ${words.slice(1).join(' ')} set`,
      `${words[0]} ${words.slice(1).join(' ')} collection`,
      `${words[0]} ${words.slice(1).join(' ')} bundle`
    );
  }

  return baseSuggestions.slice(0, limit);
}

async function getSimilarKeywords(keyword: string, limit: number) {
  try {
    const keywordRecord = await db.keyword.findUnique({
      where: { term: keyword },
      include: {
        similar: {
          orderBy: { relevance: 'desc' },
          take: limit,
        },
      },
    });

    return keywordRecord?.similar || [];
  } catch (error) {
    logger.error('Failed to get similar keywords from database', { error });
    return [];
  }
}

async function storeRelatedKeywords(keywordId: string, relatedKeywords: any[]) {
  try {
    const relatedData = relatedKeywords.map(item => ({
      keywordId,
      relatedTerm: item.keyword,
      relevance: item.relevance,
      source: item.source,
    }));

    await db.keywordSimilar.createMany({
      data: relatedData,
      skipDuplicates: true,
    });
  } catch (error) {
    logger.error('Failed to store related keywords', { error });
  }
}

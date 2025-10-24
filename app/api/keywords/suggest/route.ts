/**
 * Keyword Suggestions API
 * GET /api/keywords/suggest?q=keyword&limit=10
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { rateLimiter } from '@/lib/redis';
import { keywordCache } from '@/lib/redis';
import { findOrCreateKeyword, db } from '@/lib/db';
import { EtsyClient } from '@/lib/etsy';
import { getEtsyConnection } from '@/lib/clerk';

const requestSchema = z.object({
  q: z.string().min(1).max(100),
  limit: z.coerce.number().min(1).max(50).default(10),
  category: z.string().optional(),
  language: z.string().default('en-US'),
});

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const rateLimitResult = await rateLimiter.isAllowed(
      `suggest:${userId}`,
      100, // 100 requests
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
      q: searchParams.get('q'),
      limit: searchParams.get('limit'),
      category: searchParams.get('category'),
      language: searchParams.get('language'),
    });

    logger.info('Keyword suggestions request', {
      userId,
      query: params.q,
      limit: params.limit,
      category: params.category,
    });

    // Check cache first
    const cacheKey = `suggest:${params.q}:${params.category || 'all'}:${params.limit}`;
    const cached = await keywordCache.get(cacheKey);
    if (cached) {
      logger.info('use cached suggestions', { cacheKey });
      return NextResponse.json({ success: true, data: cached });
    }

    // Get suggestions from multiple sources
    const suggestions = await getKeywordSuggestions(params);

    // Cache results for 1 hour
    await keywordCache.set(cacheKey, suggestions, 3600);

    // Track user event
    try {
      const keyword = await findOrCreateKeyword(params.q, params.language);
      await db.userKeywordEvent.create({
        data: {
          userId,
          keywordId: keyword.id,
          eventType: 'SUGGESTIONS_REQUESTED',
        },
      });
    } catch (error) {
      logger.warn('Failed to track keyword event', { error });
    }

    return NextResponse.json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    logger.error('Keyword suggestions error', { error });
    return NextResponse.json(
      { error: 'Failed to get keyword suggestions' },
      { status: 500 }
    );
  }
}

async function getKeywordSuggestions(params: {
  q: string;
  limit: number;
  category?: string;
  language: string;
}) {
  const suggestions = [];

  // 1. Get Etsy autocomplete suggestions
  try {
    const etsySuggestions = await getEtsyAutocompleteSuggestions(params.q, params.limit);
    suggestions.push(...etsySuggestions.map((suggestion, index) => ({
      keyword: suggestion,
      source: 'etsy_autocomplete',
      relevance: 1 - (index / etsySuggestions.length), // Higher relevance for earlier results
    })));
  } catch (error) {
    logger.warn('Failed to get Etsy autocomplete suggestions', { error });
  }

  // 2. Get similar keywords from database
  try {
    const keyword = await db.keyword.findUnique({
      where: { term: params.q },
      include: {
        similar: {
          orderBy: { relevance: 'desc' },
          take: Math.ceil(params.limit / 2),
        },
      },
    });

    if (keyword?.similar) {
      suggestions.push(...keyword.similar.map((sim: any) => ({
        keyword: sim.relatedTerm,
        source: 'database_similar',
        relevance: sim.relevance,
      })));
    }
  } catch (error) {
    logger.warn('Failed to get database similar keywords', { error });
  }

  // 3. Generate AI suggestions based on category
  try {
    const aiSuggestions = await generateAISuggestions(params.q, params.category, Math.ceil(params.limit / 3));
    suggestions.push(...aiSuggestions.map((suggestion, index) => ({
      keyword: suggestion,
      source: 'ai_generated',
      relevance: 0.8 - (index * 0.1),
    })));
  } catch (error) {
    logger.warn('Failed to generate AI suggestions', { error });
  }

  // Remove duplicates and sort by relevance
  const uniqueSuggestions = suggestions.reduce((acc, curr) => {
    if (!acc.find((item: any) => item.keyword.toLowerCase() === curr.keyword.toLowerCase())) {
      acc.push(curr);
    }
    return acc;
  }, [] as any[]);

  return uniqueSuggestions
    .sort((a: any, b: any) => b.relevance - a.relevance)
    .slice(0, params.limit)
    .map((item: any) => item.keyword);
}

async function getEtsyAutocompleteSuggestions(query: string, limit: number): Promise<string[]> {
  try {
    // In mock mode, return sample suggestions
    if (process.env.ETSY_MOCK_MODE === 'true') {
      return getMockAutocompleteSuggestions(query, limit);
    }

    // Real Etsy API call would go here
    // For now, return mock data
    return getMockAutocompleteSuggestions(query, limit);
  } catch (error) {
    logger.error('Etsy autocomplete error', { error });
    return [];
  }
}

function getMockAutocompleteSuggestions(query: string, limit: number): string[] {
  const mockSuggestions = {
    'handmade': ['handmade jewelry', 'handmade pottery', 'handmade candles', 'handmade soap', 'handmade bags'],
    'vintage': ['vintage clothing', 'vintage jewelry', 'vintage furniture', 'vintage books', 'vintage posters'],
    'home': ['home decor', 'home organization', 'home storage', 'home garden', 'home office'],
    'art': ['art prints', 'wall art', 'digital art', 'canvas art', 'art supplies'],
    'ceramic': ['ceramic mugs', 'ceramic bowls', 'ceramic plates', 'ceramic vases', 'ceramic tiles'],
    'wood': ['wooden cutting board', 'wooden spoon', 'wooden bowl', 'wooden toys', 'wooden signs'],
    'macrame': ['macrame wall hanging', 'macrame plant hanger', 'macrame bag', 'macrame keychain', 'macrame coasters'],
    'leather': ['leather wallet', 'leather bag', 'leather journal', 'leather keychain', 'leather belt'],
    'crochet': ['crochet blanket', 'crochet scarf', 'crochet hat', 'crochet bag', 'crochet coasters'],
    'polymer': ['polymer clay earrings', 'polymer clay charms', 'polymer clay figurines', 'polymer clay beads', 'polymer clay keychain'],
    'linen': ['linen table runner', 'linen napkins', 'linen pillow covers', 'linen curtains', 'linen apron'],
    'terrarium': ['terrarium plants', 'succulent terrarium', 'glass terrarium', 'terrarium kit', 'mini terrarium'],
    'basket': ['handwoven basket', 'storage basket', 'decorative basket', 'laundry basket', 'fruit basket'],
    'candle': ['soy candle', 'scented candle', 'candle holder', 'candle jar', 'candle making kit'],
    'pillow': ['embroidered pillow', 'throw pillow', 'decorative pillow', 'cushion cover', 'pillow case'],
  };

  const queryLower = query.toLowerCase();
  const matchingSuggestions = Object.entries(mockSuggestions)
    .filter(([key]) => key.includes(queryLower) || queryLower.includes(key))
    .flatMap(([, suggestions]) => suggestions);

  // If no direct matches, return generic suggestions
  if (matchingSuggestions.length === 0) {
    return [
      `${query} handmade`,
      `${query} vintage`,
      `${query} unique`,
      `${query} custom`,
      `${query} gift`,
      `${query} personalized`,
    ].slice(0, limit);
  }

  return matchingSuggestions.slice(0, limit);
}

async function generateAISuggestions(query: string, category?: string, limit: number = 5): Promise<string[]> {
  try {
    // This would use OpenAI to generate category-specific suggestions
    // For now, return intelligent mock suggestions
    const baseSuggestions = [
      `${query} for sale`,
      `${query} handmade`,
      `${query} unique`,
      `custom ${query}`,
      `${query} gift`,
    ];

    if (category) {
      baseSuggestions.push(`${query} ${category}`, `${category} ${query}`);
    }

    return baseSuggestions.slice(0, limit);
  } catch (error) {
    logger.error('AI suggestions generation error', { error });
    return [];
  }
}

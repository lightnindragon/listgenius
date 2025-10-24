/**
 * Bulk Tag Editor API Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { BulkTagEditor } from '@/lib/bulk-tag-editor';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const previewOperationSchema = z.object({
  type: z.enum(['replace', 'add', 'remove', 'reorder']),
  listings: z.array(z.number().positive()).min(1).max(100),
  tags: z.array(z.string().min(1).max(50)).optional(),
  searchTerm: z.string().optional(),
  replaceWith: z.string().optional(),
  newOrder: z.array(z.string()).optional(),
});

const executeOperationSchema = z.object({
  type: z.enum(['replace', 'add', 'remove', 'reorder']),
  listings: z.array(z.number().positive()).min(1).max(100),
  tags: z.array(z.string().min(1).max(50)).optional(),
  searchTerm: z.string().optional(),
  replaceWith: z.string().optional(),
  newOrder: z.array(z.string()).optional(),
});

const analyzeTagsSchema = z.object({
  listings: z.array(z.number().positive()).min(1).max(100),
});

const getSuggestedTagsSchema = z.object({
  listingId: z.number().positive(),
  listingData: z.object({
    title: z.string(),
    description: z.string(),
    tags: z.array(z.string()),
    category: z.string().optional(),
  }),
});

// POST - Preview, execute, analyze, or get suggestions
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const action = body.action;

    const bulkTagEditor = new BulkTagEditor();

    switch (action) {
      case 'preview':
        return handlePreviewOperation(request, userId, bulkTagEditor);
      case 'execute':
        return handleExecuteOperation(request, userId, bulkTagEditor);
      case 'analyze':
        return handleAnalyzeTags(request, userId, bulkTagEditor);
      case 'suggest':
        return handleGetSuggestedTags(request, userId, bulkTagEditor);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    logger.error('Bulk tag editor API error', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handlePreviewOperation(request: NextRequest, userId: string, bulkTagEditor: BulkTagEditor) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = previewOperationSchema.safeParse({
      type: body.type,
      listings: body.listings,
      tags: body.tags,
      searchTerm: body.searchTerm,
      replaceWith: body.replaceWith,
      newOrder: body.newOrder,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { type, listings, tags, searchTerm, replaceWith, newOrder } = validation.data;

    // Preview operation
    const preview = await bulkTagEditor.previewOperation(
      type,
      listings,
      tags || [],
      searchTerm,
      replaceWith,
      newOrder
    );

    logger.info('Bulk tag operation preview generated', {
      userId,
      type,
      preview,
    });

    return NextResponse.json({
      success: true,
      data: {
        preview,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Preview operation error', { error });
    return NextResponse.json(
      { error: 'Failed to preview operation' },
      { status: 500 }
    );
  }
}

async function handleExecuteOperation(request: NextRequest, userId: string, bulkTagEditor: BulkTagEditor) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = executeOperationSchema.safeParse({
      type: body.type,
      listings: body.listings,
      tags: body.tags,
      searchTerm: body.searchTerm,
      replaceWith: body.replaceWith,
      newOrder: body.newOrder,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { type, listings, tags, searchTerm, replaceWith, newOrder } = validation.data;

    // Execute operation
    const operation = await bulkTagEditor.executeOperation(
      type,
      listings,
      tags || [],
      searchTerm,
      replaceWith,
      newOrder
    );

    logger.info('Bulk tag operation executed', {
      userId,
      operationId: operation.operationId,
      operation,
    });

    return NextResponse.json({
      success: true,
      data: {
        operation,
        executedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Execute operation error', { error });
    return NextResponse.json(
      { error: 'Failed to execute operation' },
      { status: 500 }
    );
  }
}

async function handleAnalyzeTags(request: NextRequest, userId: string, bulkTagEditor: BulkTagEditor) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = analyzeTagsSchema.safeParse({
      listings: body.listings,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { listings } = validation.data;

    // Analyze tags
    const analysis = await bulkTagEditor.analyzeTags(listings);

    logger.info('Tag analysis completed', {
      userId,
      analysis,
    });

    return NextResponse.json({
      success: true,
      data: {
        analysis,
        analyzedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Analyze tags error', { error });
    return NextResponse.json(
      { error: 'Failed to analyze tags' },
      { status: 500 }
    );
  }
}

async function handleGetSuggestedTags(request: NextRequest, userId: string, bulkTagEditor: BulkTagEditor) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = getSuggestedTagsSchema.safeParse({
      listingId: body.listingId,
      listingData: body.listingData,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { listingId, listingData } = validation.data;

    // Get suggested tags
    const suggestions = await bulkTagEditor.getSuggestedTags(listingId, listingData);

    logger.info('Tag suggestions generated', {
      userId,
      listingId,
      suggestions,
    });

    return NextResponse.json({
      success: true,
      data: {
        suggestions,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Get suggested tags error', { error });
    return NextResponse.json(
      { error: 'Failed to get suggested tags' },
      { status: 500 }
    );
  }
}

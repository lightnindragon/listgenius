/**
 * CSV Export/Import API Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { CSVHandler } from '@/lib/csv-handler';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const exportKeywordsSchema = z.object({
  keywords: z.array(z.string().min(1).max(100)).min(1).max(1000),
  includeMetrics: z.boolean().optional().default(true),
});

const exportListingsSchema = z.object({
  listingIds: z.array(z.number().positive()).min(1).max(1000),
});

const importKeywordsSchema = z.object({
  csvContent: z.string().min(1),
});

const importListingsSchema = z.object({
  csvContent: z.string().min(1),
});

// GET - Get CSV templates
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    const csvHandler = new CSVHandler();
    let csvContent = '';
    let filename = '';

    switch (type) {
      case 'keywords':
        csvContent = csvHandler.getKeywordTemplate();
        filename = 'keyword-template.csv';
        break;
      case 'listings':
        csvContent = csvHandler.getListingTemplate();
        filename = 'listing-template.csv';
        break;
      default:
        return NextResponse.json({ error: 'Invalid template type' }, { status: 400 });
    }

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    logger.error('CSV template API error', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Export/Import CSV data
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const action = body.action;

    switch (action) {
      case 'export-keywords':
        return handleExportKeywords(request, userId);
      case 'export-listings':
        return handleExportListings(request, userId);
      case 'import-keywords':
        return handleImportKeywords(request, userId);
      case 'import-listings':
        return handleImportListings(request, userId);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    logger.error('CSV API error', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleExportKeywords(request: NextRequest, userId: string) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = exportKeywordsSchema.safeParse({
      keywords: body.keywords,
      includeMetrics: body.includeMetrics,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { keywords, includeMetrics } = validation.data;

    const csvHandler = new CSVHandler();
    const csvContent = await csvHandler.exportKeywords(userId, keywords, includeMetrics);

    const filename = `keywords-export-${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    logger.error('Export keywords error', { error });
    return NextResponse.json(
      { error: 'Failed to export keywords' },
      { status: 500 }
    );
  }
}

async function handleExportListings(request: NextRequest, userId: string) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = exportListingsSchema.safeParse({
      listingIds: body.listingIds,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { listingIds } = validation.data;

    const csvHandler = new CSVHandler();
    const csvContent = await csvHandler.exportListings(userId, listingIds);

    const filename = `listings-export-${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    logger.error('Export listings error', { error });
    return NextResponse.json(
      { error: 'Failed to export listings' },
      { status: 500 }
    );
  }
}

async function handleImportKeywords(request: NextRequest, userId: string) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = importKeywordsSchema.safeParse({
      csvContent: body.csvContent,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { csvContent } = validation.data;

    const csvHandler = new CSVHandler();
    const result = await csvHandler.importKeywords(userId, csvContent);

    logger.info('Keywords imported from CSV', {
      userId,
      imported: result.imported,
      errors: result.errors.length,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Import keywords error', { error });
    return NextResponse.json(
      { error: 'Failed to import keywords' },
      { status: 500 }
    );
  }
}

async function handleImportListings(request: NextRequest, userId: string) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = importListingsSchema.safeParse({
      csvContent: body.csvContent,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { csvContent } = validation.data;

    const csvHandler = new CSVHandler();
    const result = await csvHandler.importListings(userId, csvContent);

    logger.info('Listings imported from CSV', {
      userId,
      imported: result.imported,
      errors: result.errors.length,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Import listings error', { error });
    return NextResponse.json(
      { error: 'Failed to import listings' },
      { status: 500 }
    );
  }
}

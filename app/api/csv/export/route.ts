import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateCSVFromGenerations } from '@/lib/csv-generator';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const bulkImportId = searchParams.get('bulkImportId');
    const source = searchParams.get('source');

    // Build where clause
    const whereClause: any = { userId };

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.createdAt.lte = new Date(endDate);
      }
    }

    if (bulkImportId) {
      whereClause.bulkImportId = bulkImportId;
    }

    if (source) {
      whereClause.source = source;
    }

    // Fetch saved generations
    const generations = await prisma.$queryRaw`
      SELECT id, title, description, tags, materials, tone, "wordCount", "bulkImportId", "bulkImportDate", source, "createdAt"
      FROM "SavedGeneration"
      WHERE "userId" = ${userId}
      ${startDate ? `AND "createdAt" >= ${new Date(startDate)}` : ''}
      ${endDate ? `AND "createdAt" <= ${new Date(endDate)}` : ''}
      ${bulkImportId ? `AND "bulkImportId" = ${bulkImportId}` : ''}
      ${source ? `AND source = ${source}` : ''}
      ORDER BY "createdAt" DESC
    ` as any[];

    if (!generations || generations.length === 0) {
      return NextResponse.json({ error: 'No generations found' }, { status: 404 });
    }

    // Convert to export format
    const exportData = generations.map(gen => ({
      id: gen.id,
      title: gen.title,
      description: gen.description,
      tags: typeof gen.tags === 'string' ? JSON.parse(gen.tags) : gen.tags,
      materials: typeof gen.materials === 'string' ? JSON.parse(gen.materials) : gen.materials,
      tone: gen.tone,
      wordCount: gen.wordCount,
      bulkImportId: gen.bulkImportId,
      bulkImportDate: gen.bulkImportDate ? new Date(gen.bulkImportDate).toISOString() : undefined,
      source: gen.source,
      createdAt: new Date(gen.createdAt).toISOString()
    }));

    // Generate CSV
    const csvContent = generateCSVFromGenerations(exportData);

    // Create filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `listgenius-generations-${timestamp}.csv`;

    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('CSV export error:', error);
    
    return NextResponse.json({ 
      error: 'Failed to export CSV',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

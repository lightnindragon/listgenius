import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { processBulkGeneration } from '@/lib/bulk-processor';
import { getCurrentMonthUsage } from '@/lib/generation-quota';
import { PLAN_CONFIG } from '@/lib/entitlements';
import { getUserPlanSimple } from '@/lib/entitlements';
import { createClerkClient } from '@clerk/nextjs/server';
import { CSVRow } from '@/lib/csv-parser';
import { randomUUID } from 'crypto';

let clerkClient: any;
try {
  if (!process.env.CLERK_SECRET_KEY) {
    throw new Error('CLERK_SECRET_KEY not found in environment variables');
  }
  clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
} catch (error) {
  console.error('Failed to initialize Clerk client:', error);
  throw error;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user plan
    const user = await clerkClient.users.getUser(userId);
    const plan = await getUserPlanSimple(user);
    
    if (plan === 'free') {
      return NextResponse.json({ 
        error: 'CSV bulk upload is only available for Pro and Business plans. Please upgrade to use this feature.' 
      }, { status: 402 });
    }

    // Parse request body
    const body = await request.json();
    const { rows, selectedRows }: { rows: CSVRow[], selectedRows?: number[] } = body;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'No rows provided for processing' }, { status: 400 });
    }

    // Filter rows if selection provided
    const rowsToProcess = selectedRows 
      ? rows.filter((_, index) => selectedRows.includes(index))
      : rows;

    if (rowsToProcess.length === 0) {
      return NextResponse.json({ error: 'No rows selected for processing' }, { status: 400 });
    }

    // Check remaining quota
    const { used, limit } = await getCurrentMonthUsage(userId);
    const remaining = limit === 'unlimited' ? 1000 - used : (limit as number) - used;

    if (remaining <= 0) {
      return NextResponse.json({ 
        error: 'No remaining generations available. Please wait for your quota to reset or upgrade your plan.',
        quota: { used, limit, remaining: 0 }
      }, { status: 402 });
    }

    // Check if user is trying to process more than their remaining quota
    if (rowsToProcess.length > remaining) {
      return NextResponse.json({ 
        error: `You can only process ${remaining} rows. You have ${rowsToProcess.length} rows selected. Please select fewer rows.`,
        quota: { used, limit, remaining },
        maxAllowed: remaining
      }, { status: 402 });
    }

    // Create unique bulk import ID
    const bulkImportId = randomUUID();

    // Start bulk processing (this will run in background)
    const progress = await processBulkGeneration(userId, rowsToProcess, bulkImportId);

    return NextResponse.json({
      success: true,
      data: {
        jobId: progress.jobId,
        bulkImportId,
        totalRows: progress.totalRows,
        quota: { used, limit, remaining: remaining - rowsToProcess.length }
      }
    });

  } catch (error) {
    console.error('CSV process error:', error);
    
    return NextResponse.json({ 
      error: 'Failed to process CSV rows',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

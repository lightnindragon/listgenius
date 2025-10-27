import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getBulkProgress, cleanupProgress } from '@/lib/bulk-processor';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId } = await params;

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    // Get progress from bulk processor
    const progress = getBulkProgress(jobId);

    if (!progress) {
      return NextResponse.json({ error: 'Job not found or expired' }, { status: 404 });
    }

    // Return progress data
    return NextResponse.json({
      success: true,
      data: {
        jobId: progress.jobId,
        status: progress.status,
        totalRows: progress.totalRows,
        processedRows: progress.processedRows,
        successfulRows: progress.successfulRows,
        failedRows: progress.failedRows,
        currentRow: progress.currentRow,
        errors: progress.errors,
        startedAt: progress.startedAt,
        completedAt: progress.completedAt,
        progress: progress.totalRows > 0 ? Math.round((progress.processedRows / progress.totalRows) * 100) : 0
      }
    });

  } catch (error) {
    console.error('Progress check error:', error);
    
    return NextResponse.json({ 
      error: 'Failed to check progress',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId } = await params;

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    // Cleanup progress data
    cleanupProgress(jobId);

    return NextResponse.json({
      success: true,
      message: 'Progress data cleaned up'
    });

  } catch (error) {
    console.error('Progress cleanup error:', error);
    
    return NextResponse.json({ 
      error: 'Failed to cleanup progress',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

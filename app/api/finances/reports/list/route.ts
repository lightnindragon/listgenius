import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Mock financial reports - in real implementation, this would fetch from database
    const reports = [
      {
        id: '1',
        reportType: 'monthly',
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-01-31'),
        generatedAt: new Date(),
        status: 'completed'
      },
      {
        id: '2',
        reportType: 'quarterly',
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-03-31'),
        generatedAt: new Date(),
        status: 'completed'
      }
    ].slice(offset, offset + limit);

    // Mock tax reports - in real implementation, this would fetch from database
    const taxReports = [
      {
        id: '1',
        reportType: 'annual',
        year: 2024,
        generatedAt: new Date(),
        status: 'completed'
      }
    ].slice(offset, offset + limit);

    // Combine and format reports
    const allReports = [
      ...reports.map(report => ({
        id: report.id,
        reportType: report.reportType,
        period: {
          start: report.periodStart.toISOString(),
          end: report.periodEnd.toISOString()
        },
        generatedAt: report.generatedAt.toISOString()
      })),
      ...taxReports.map(report => ({
        id: report.id,
        reportType: 'tax_report',
        period: {
          start: new Date(report.year, 0, 1).toISOString(),
          end: new Date(report.year, 11, 31).toISOString()
        },
        generatedAt: report.generatedAt.toISOString()
      }))
    ].sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());

    return NextResponse.json({
      success: true,
      data: allReports
    });
  } catch (error: any) {
    console.error('Failed to fetch reports list:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: reportId } = await params;

    // Mock report data - in real implementation, this would fetch from database
    const report = {
      id: reportId,
      reportType: 'monthly',
      periodStart: new Date('2024-01-01'),
      periodEnd: new Date('2024-01-31'),
      generatedAt: new Date(),
      data: JSON.stringify({
        revenue: 5000,
        expenses: 2000,
        profit: 3000,
        listings: 25,
        sales: 150
      })
    };

    // In real implementation, check if report exists and user has access
    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    // Generate PDF content (mock implementation)
    const pdfContent = generatePDFContent(report);

    // Return PDF as response
    return new NextResponse(pdfContent, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="financial-report-${reportId}.pdf"`
      }
    });
  } catch (error: any) {
    console.error('Failed to export report:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to export report' },
      { status: 500 }
    );
  }
}

function generatePDFContent(report: any): string {
  // Mock PDF generation - would use a proper PDF library like puppeteer or pdfkit
  const pdfText = `
Financial Report
Type: ${report.reportType}
Period: ${report.periodStart.toDateString()} - ${report.periodEnd.toDateString()}
Generated: ${report.generatedAt.toDateString()}

${JSON.stringify(JSON.parse(report.data), null, 2)}
  `;

  return pdfText;
}

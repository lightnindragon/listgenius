import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/affiliate';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isAdminAuthenticated(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const { id } = await params;

    const loginLogs = await prisma.affiliateLoginLog.findMany({
      where: { affiliateId: id },
      orderBy: { loginAt: 'desc' },
      take: 50, // Limit to last 50 logins
    });

    logger.info('Admin fetched affiliate login logs', { 
      affiliateId: id,
      logCount: loginLogs.length
    });

    return NextResponse.json({ loginLogs });
    
  } catch (error) {
    logger.error('Failed to fetch affiliate login logs', { error });
    
    return NextResponse.json(
      { error: 'Failed to fetch login logs' },
      { status: 500 }
    );
  }
}

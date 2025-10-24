import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const session = getAdminSession(request);
    
    if (!session) {
      return NextResponse.json({
        authenticated: false,
        error: 'Not authenticated'
      }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      username: session.username,
      expiresAt: new Date(session.exp * 1000).toISOString()
    });
  } catch (error) {
    logger.error('Error verifying admin session', { error });
    return NextResponse.json(
      { authenticated: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

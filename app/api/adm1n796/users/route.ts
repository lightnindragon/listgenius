import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, getAllUsers } from '@/lib/admin';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    requireAdmin(request);

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || undefined;
    const plan = searchParams.get('plan') || undefined;
    const status = searchParams.get('status') || undefined;

    // Validate parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { success: false, error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    // Get users
    const result = await getAllUsers(page, limit, search, plan, status);

    return NextResponse.json({
      success: true,
      data: {
        users: result.users,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit)
        }
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Admin authentication required') {
      return NextResponse.json(
        { success: false, error: 'Admin authentication required' },
        { status: 401 }
      );
    }

    logger.error('Error getting users list', { error });
    return NextResponse.json(
      { success: false, error: 'Failed to get users list' },
      { status: 500 }
    );
  }
}

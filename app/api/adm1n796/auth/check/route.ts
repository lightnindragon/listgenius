import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated, getAdminSession } from '@/lib/admin';

export async function GET(request: NextRequest) {
  try {
    const isAuthenticated = isAdminAuthenticated(request);
    const session = getAdminSession(request);
    
    return NextResponse.json({
      success: true,
      isAuthenticated,
      session: session ? { username: session.username } : null,
      cookies: request.cookies.getAll().map(c => ({ name: c.name, value: c.value.substring(0, 20) + '...' }))
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

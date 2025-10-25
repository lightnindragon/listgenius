import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('=== TEST GENERATION API CALLED ===');
    
    return NextResponse.json({
      success: true,
      message: 'Test API working',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Test API failed',
      details: (error as Error).message
    }, { status: 500 });
  }
}

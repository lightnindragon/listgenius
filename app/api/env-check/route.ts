import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const envCheck = {
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
      CLERK_SECRET_KEY: !!process.env.CLERK_SECRET_KEY,
      NODE_ENV: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    };
    
    console.log('Environment check:', envCheck);
    
    return NextResponse.json({
      success: true,
      environment: envCheck
    });
  } catch (error) {
    console.error('Environment check error:', error);
    return NextResponse.json({
      success: false,
      error: 'Environment check failed',
      details: (error as Error).message
    }, { status: 500 });
  }
}

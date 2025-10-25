import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    console.log('=== TEST OPENAI API CALLED ===');
    
    // Test authentication
    const { userId } = await auth();
    console.log('User ID:', userId);
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required',
        step: 'auth'
      }, { status: 401 });
    }
    
    // Test OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        success: false, 
        error: 'OpenAI API key not configured',
        step: 'openai_key'
      }, { status: 500 });
    }
    
    console.log('OpenAI API key exists, testing connection...');
    
    // Test OpenAI connection with a simple request
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: 'Say "Hello, this is a test" and nothing else.'
        }
      ],
      max_tokens: 10,
    });
    
    const response = completion.choices[0]?.message?.content || 'No response';
    console.log('OpenAI test response:', response);
    
    return NextResponse.json({
      success: true,
      data: {
        userId,
        openaiResponse: response,
        model: completion.model,
        usage: completion.usage,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Test OpenAI error:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
      stack: (error as Error).stack,
      step: 'openai_test'
    }, { status: 500 });
  }
}
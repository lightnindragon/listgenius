import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { aiModelsIntegration } from '@/lib/ai-models-integration';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { imageUrl, model = 'gpt-4o-vision' } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    // Analyze image using AI
    const analysis = await aiModelsIntegration.analyzeImage(imageUrl, model as any);

    return NextResponse.json({
      success: true,
      data: analysis
    });
  } catch (error: any) {
    console.error('Failed to analyze image:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze image' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { aiModelsIntegration } from '@/lib/ai-models-integration';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { listingData, model = 'claude-3-sonnet' } = await request.json();

    if (!listingData) {
      return NextResponse.json(
        { error: 'Listing data is required' },
        { status: 400 }
      );
    }

    // Optimize listing using AI
    const optimization = await aiModelsIntegration.optimizeListing(listingData, model as any);

    return NextResponse.json({
      success: true,
      data: optimization
    });
  } catch (error: any) {
    console.error('Failed to optimize listing:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to optimize listing' },
      { status: 500 }
    );
  }
}

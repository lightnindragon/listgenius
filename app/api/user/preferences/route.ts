import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { updateUserPreferences } from '@/lib/clerk';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const preferencesSchema = z.object({
  tone: z.string().min(1),
  niche: z.string().optional(),
  audience: z.string().optional(),
});

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = preferencesSchema.parse(body);

    // Update user preferences using the clerk library function
    await updateUserPreferences(userId, {
      tone: validatedData.tone,
      niche: validatedData.niche || '',
      audience: validatedData.audience || ''
    });

    logger.info('User preferences updated', { 
      userId, 
      preferences: validatedData 
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Preferences updated successfully' 
    });
  } catch (error) {
    logger.error('Failed to update user preferences', { error: (error as Error).message });
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid preferences data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}

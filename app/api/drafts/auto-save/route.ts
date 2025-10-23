import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { savedDraftsManager } from '@/lib/saved-drafts';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const autoSaveSchema = z.object({
  listingData: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    keywords: z.array(z.string()).optional(),
    tone: z.string().optional(),
    niche: z.string().optional(),
    audience: z.string().optional(),
    wordCount: z.number().optional(),
    price: z.number().optional(),
    quantity: z.number().optional(),
    materials: z.array(z.string()).optional(),
    shopSection: z.string().optional(),
    shippingProfile: z.string().optional(),
  }),
  existingDraftId: z.string().optional(),
});

// POST - Auto-save draft
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = autoSaveSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { listingData, existingDraftId } = validation.data;
    
    const draft = await savedDraftsManager.autoSaveDraft(userId, listingData, existingDraftId);

    logger.info('Draft auto-saved', { 
      userId, 
      draftId: draft.id, 
      existingDraftId,
      completionPct: draft.completionPct 
    });

    return NextResponse.json({ 
      success: true, 
      data: { 
        draftId: draft.id,
        completionPct: draft.completionPct,
        lastSaved: draft.updatedAt 
      } 
    });
  } catch (error) {
    logger.error('Failed to auto-save draft', { userId: (await auth()).userId, error });
    return NextResponse.json({ error: 'Failed to auto-save draft' }, { status: 500 });
  }
}

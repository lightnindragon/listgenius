import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { savedDraftsManager } from '@/lib/saved-drafts';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const createDraftSchema = z.object({
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
  isAutoSaved: z.boolean().optional().default(false),
});

const updateDraftSchema = createDraftSchema.partial();

// GET - List user's drafts
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const search = url.searchParams.get('search');
    const stats = url.searchParams.get('stats') === 'true';

    let drafts;
    
    if (search) {
      drafts = await savedDraftsManager.searchDrafts(userId, search);
    } else {
      drafts = await savedDraftsManager.getUserDrafts(userId);
    }

    let responseData: any = { drafts };
    
    if (stats) {
      const draftStats = await savedDraftsManager.getDraftStats(userId);
      responseData.stats = draftStats;
    }

    logger.info('Drafts fetched', { userId, count: drafts.length, search, stats });

    return NextResponse.json({ success: true, data: responseData });
  } catch (error) {
    logger.error('Failed to fetch drafts', { userId: (await auth()).userId, error });
    return NextResponse.json({ error: 'Failed to fetch drafts' }, { status: 500 });
  }
}

// POST - Create or update draft
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = createDraftSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const draftData = validation.data;
    const isAutoSave = draftData.isAutoSaved;
    
    let draft;
    if (isAutoSave) {
      draft = await savedDraftsManager.autoSaveDraft(userId, draftData);
    } else {
      draft = await savedDraftsManager.saveDraft(userId, draftData);
    }

    logger.info('Draft saved', { 
      userId, 
      draftId: draft.id, 
      isAutoSaved: isAutoSave,
      completionPct: draft.completionPct 
    });

    return NextResponse.json({ success: true, data: draft }, { status: 201 });
  } catch (error) {
    logger.error('Failed to save draft', { userId: (await auth()).userId, error });
    return NextResponse.json({ error: 'Failed to save draft' }, { status: 500 });
  }
}

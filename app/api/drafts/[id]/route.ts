import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { savedDraftsManager } from '@/lib/saved-drafts';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const updateDraftSchema = z.object({
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
});

// GET - Get specific draft
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const draft = await savedDraftsManager.loadDraft(id);
    
    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    // Check if user can access this draft
    if (draft.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized to access draft' }, { status: 403 });
    }

    logger.info('Draft fetched', { userId, draftId: id });

    return NextResponse.json({ success: true, data: draft });
  } catch (error) {
    const { userId } = await auth();
    logger.error('Failed to fetch draft', { userId, draftId: (await params).id, error });
    return NextResponse.json({ error: 'Failed to fetch draft' }, { status: 500 });
  }
}

// PUT - Update draft
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = updateDraftSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { id } = await params;
    const draft = await savedDraftsManager.updateDraft(id, userId, validation.data);

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found or unauthorized' }, { status: 404 });
    }

    logger.info('Draft updated', { userId, draftId: id });

    return NextResponse.json({ success: true, data: draft });
  } catch (error) {
    const { userId } = await auth();
    logger.error('Failed to update draft', { userId, draftId: (await params).id, error });
    return NextResponse.json({ error: 'Failed to update draft' }, { status: 500 });
  }
}

// DELETE - Delete draft
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const success = await savedDraftsManager.deleteDraft(id, userId);

    if (!success) {
      return NextResponse.json({ error: 'Draft not found or unauthorized' }, { status: 404 });
    }

    logger.info('Draft deleted', { userId, draftId: id });

    return NextResponse.json({ success: true, message: 'Draft deleted successfully' });
  } catch (error) {
    const { userId } = await auth();
    logger.error('Failed to delete draft', { userId, draftId: (await params).id, error });
    return NextResponse.json({ error: 'Failed to delete draft' }, { status: 500 });
  }
}

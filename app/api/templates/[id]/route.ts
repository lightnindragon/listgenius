import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { listingTemplatesManager } from '@/lib/listing-templates';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const updateTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  category: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
  price: z.number().optional(),
  materials: z.array(z.string()).optional(),
  shippingProfile: z.string().optional(),
  etsyCategory: z.string().optional(),
});

// GET - Get specific template
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
    const template = await listingTemplatesManager.loadTemplate(id);
    
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Check if user can access this template
    if (!template.isBuiltIn && template.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized to access template' }, { status: 403 });
    }

    logger.info('Template fetched', { userId, templateId: id });

    return NextResponse.json({ success: true, data: template });
  } catch (error) {
    const { userId } = await auth();
    logger.error('Failed to fetch template', { userId, templateId: (await params).id, error });
    return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 });
  }
}

// PUT - Update template
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
    const validation = updateTemplateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { id } = await params;
    const template = await listingTemplatesManager.updateTemplate(
      id,
      userId,
      validation.data
    );

    if (!template) {
      return NextResponse.json({ error: 'Template not found or unauthorized' }, { status: 404 });
    }

    logger.info('Template updated', { userId, templateId: id });

    return NextResponse.json({ success: true, data: template });
  } catch (error) {
    const { userId } = await auth();
    logger.error('Failed to update template', { userId, templateId: (await params).id, error });
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
}

// DELETE - Delete template
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
    const success = await listingTemplatesManager.deleteTemplate(id, userId);

    if (!success) {
      return NextResponse.json({ error: 'Template not found or unauthorized' }, { status: 404 });
    }

    logger.info('Template deleted', { userId, templateId: id });

    return NextResponse.json({ success: true, message: 'Template deleted successfully' });
  } catch (error) {
    const { userId } = await auth();
    logger.error('Failed to delete template', { userId, templateId: (await params).id, error });
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { listingTemplatesManager } from '@/lib/listing-templates';
import { logger } from '@/lib/logger';

// POST - Duplicate template
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const duplicatedTemplate = await listingTemplatesManager.duplicateTemplate(id, userId);

    if (!duplicatedTemplate) {
      return NextResponse.json({ error: 'Template not found or unauthorized to duplicate' }, { status: 404 });
    }

    logger.info('Template duplicated', { 
      userId, 
      originalTemplateId: id, 
      newTemplateId: duplicatedTemplate.id 
    });

    return NextResponse.json({ success: true, data: duplicatedTemplate }, { status: 201 });
  } catch (error) {
    const { userId } = await auth();
    logger.error('Failed to duplicate template', { 
      userId, 
      templateId: (await params).id, 
      error 
    });
    return NextResponse.json({ error: 'Failed to duplicate template' }, { status: 500 });
  }
}

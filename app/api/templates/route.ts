import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { listingTemplatesManager } from '@/lib/listing-templates';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const createTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  category: z.string().min(1),
  title: z.string().min(1),
  tags: z.array(z.string()),
  price: z.number().optional(),
  materials: z.array(z.string()).optional(),
  shippingProfile: z.string().optional(),
  etsyCategory: z.string().optional(),
});

const updateTemplateSchema = createTemplateSchema.partial();

// GET - List user's templates
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const search = url.searchParams.get('search');

    let templates;
    
    if (search) {
      templates = await listingTemplatesManager.searchTemplates(userId, search);
    } else if (category && category !== 'all') {
      templates = await listingTemplatesManager.getTemplatesByCategory(userId, category);
    } else {
      const userTemplates = await listingTemplatesManager.getUserTemplates(userId);
      const builtInTemplates = await listingTemplatesManager.getBuiltInTemplates();
      templates = [...userTemplates, ...builtInTemplates];
    }

    logger.info('Templates fetched', { userId, count: templates.length, category, search });

    return NextResponse.json({ success: true, data: templates });
  } catch (error) {
    logger.error('Failed to fetch templates', { userId: (await auth()).userId, error });
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

// POST - Create new template
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = createTemplateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const templateData = validation.data;
    
    const template = await listingTemplatesManager.saveListingAsTemplate(
      userId,
      {
        title: templateData.title,
        description: templateData.description || '',
        tags: templateData.tags,
        price: templateData.price,
        materials: templateData.materials || [],
        category: templateData.category,
      },
      templateData.name,
      templateData.description
    );

    logger.info('Template created', { userId, templateId: template.id, name: templateData.name });

    return NextResponse.json({ success: true, data: template }, { status: 201 });
  } catch (error) {
    logger.error('Failed to create template', { userId: (await auth()).userId, error });
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}

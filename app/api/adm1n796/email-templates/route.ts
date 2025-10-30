import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/admin';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const emailTemplateSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens'),
  description: z.string().optional(),
  subject: z.string().min(1),
  htmlBody: z.string().min(1),
  textBody: z.string().min(1),
  variables: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  category: z.enum(['welcome', 'affiliate_approval', 'affiliate_rejection', 'affiliate_suspension', 'affiliate_application_received']),
});

// GET all email templates
export async function GET(request: NextRequest) {
  try {
    if (!isAdminAuthenticated(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templates = await prisma.emailTemplate.findMany({
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ 
      success: true, 
      templates 
    });
  } catch (error) {
    logger.error('Failed to fetch email templates', { error });
    return NextResponse.json(
      { error: 'Failed to fetch email templates' },
      { status: 500 }
    );
  }
}

// Create new email template
export async function POST(request: NextRequest) {
  try {
    if (!isAdminAuthenticated(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = emailTemplateSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid data', issues: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if slug already exists
    const existing = await prisma.emailTemplate.findUnique({
      where: { slug: data.slug }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Template with this slug already exists' },
        { status: 400 }
      );
    }

    const template = await prisma.emailTemplate.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        subject: data.subject,
        htmlBody: data.htmlBody,
        textBody: data.textBody,
        variables: data.variables || [],
        isActive: data.isActive ?? true,
        category: data.category,
      },
    });

    logger.info('Email template created', {
      templateId: template.id,
      slug: template.slug,
      category: template.category
    });

    return NextResponse.json({ 
      success: true, 
      template 
    });
  } catch (error) {
    logger.error('Failed to create email template', { error });
    return NextResponse.json(
      { error: 'Failed to create email template' },
      { status: 500 }
    );
  }
}


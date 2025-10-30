import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/admin';
import { createTransporter, getFromEmail, getFromName } from '@/lib/email';
import { logger } from '@/lib/logger';

// Send test email with template preview
export async function POST(request: NextRequest) {
  try {
    if (!isAdminAuthenticated(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { templateId, testEmail, variables } = await request.json();

    if (!templateId || !testEmail) {
      return NextResponse.json(
        { error: 'Template ID and test email are required' },
        { status: 400 }
      );
    }

    const template = await prisma.emailTemplate.findUnique({
      where: { id: templateId }
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    if (!template.isActive) {
      return NextResponse.json(
        { error: 'Cannot send test email with inactive template' },
        { status: 400 }
      );
    }

    // Replace variables in template
    let processedSubject = template.subject;
    let processedHtmlBody = template.htmlBody;
    let processedTextBody = template.textBody;

    if (variables && typeof variables === 'object') {
      Object.entries(variables).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        const replacement = String(value);
        processedSubject = processedSubject.replace(new RegExp(placeholder, 'g'), replacement);
        processedHtmlBody = processedHtmlBody.replace(new RegExp(placeholder, 'g'), replacement);
        processedTextBody = processedTextBody.replace(new RegExp(placeholder, 'g'), replacement);
      });
    }

    // Send test email
    const transporter = createTransporter();
    
    if (!transporter) {
      return NextResponse.json(
        { error: 'Email transporter not configured' },
        { status: 500 }
      );
    }

    const mailOptions = {
      from: `${getFromName()} <${getFromEmail()}>`,
      to: testEmail,
      subject: `[TEST] ${processedSubject}`,
      html: processedHtmlBody,
      text: processedTextBody,
    };

    const info = await transporter.sendMail(mailOptions);
    
    // Update template usage count
    await prisma.emailTemplate.update({
      where: { id: templateId },
      data: {
        usageCount: { increment: 1 },
        lastUsedAt: new Date(),
      },
    });

    logger.info('Test email sent', {
      templateId,
      templateSlug: template.slug,
      to: testEmail,
      messageId: info.messageId,
    });

    return NextResponse.json({ 
      success: true,
      message: 'Test email sent successfully',
      messageId: info.messageId
    });
  } catch (error) {
    logger.error('Failed to send test email', { error });
    return NextResponse.json(
      { error: 'Failed to send test email' },
      { status: 500 }
    );
  }
}


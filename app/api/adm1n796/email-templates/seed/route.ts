import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/admin';
import { logger } from '@/lib/logger';

// Seed default email templates
export async function POST(request: NextRequest) {
  try {
    if (!isAdminAuthenticated(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const defaultTemplates = [
      {
        name: 'Welcome Email',
        slug: 'welcome',
        description: 'Sent to new users when they sign up',
        category: 'welcome',
        subject: 'Welcome to ListGenius!',
        htmlBody: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #333; border-bottom: 2px solid #4285F4; padding-bottom: 10px;">
    Welcome to ListGenius!
  </h2>
  
  <p>Hi {{userName}},</p>
  
  <p>Thank you for signing up for ListGenius! We're excited to help you create amazing Etsy listings with AI.</p>
  
  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="color: #555; margin-top: 0;">Getting Started</h3>
    <ul style="line-height: 1.6;">
      <li>Generate SEO-optimized titles, descriptions, and tags</li>
      <li>Choose from different tones to match your brand</li>
      <li>Copy and paste directly into your Etsy shop</li>
    </ul>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{appUrl}}/app" 
       style="background-color: #4285F4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
      Start Generating Listings
    </a>
  </div>
  
  <p>If you have any questions, feel free to reach out to us at <a href="mailto:support@listgenius.expert">support@listgenius.expert</a>.</p>
  
  <p>Best regards,<br>The ListGenius Team</p>
</div>`,
        textBody: `Welcome to ListGenius!

Hi {{userName}},

Thank you for signing up for ListGenius! We're excited to help you create amazing Etsy listings with AI.

Getting Started:
- Generate SEO-optimized titles, descriptions, and tags
- Choose from different tones to match your brand
- Copy and paste directly into your Etsy shop

Start Generating Listings: {{appUrl}}/app

If you have any questions, feel free to reach out to us at support@listgenius.expert.

Best regards,
The ListGenius Team`,
        variables: ['userName', 'appUrl'],
      },
      {
        name: 'Affiliate Application Received',
        slug: 'affiliate-application-received',
        description: 'Sent to applicants when they submit an affiliate application',
        category: 'affiliate_application_received',
        subject: 'Your Affiliate Application Has Been Received - ListGenius',
        htmlBody: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #333; border-bottom: 2px solid #4285F4; padding-bottom: 10px;">
    Thank You for Your Application!
  </h2>
  
  <p>Hi {{userName}},</p>
  
  <p>Thank you for your interest in joining the ListGenius Affiliate Program! We've received your application and our team will review it shortly.</p>
  
  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="color: #555; margin-top: 0;">What happens next?</h3>
    <ol style="line-height: 1.6;">
      <li>Our team will review your application within 1-2 business days</li>
      <li>If approved, you'll receive an email with your unique affiliate link and dashboard access</li>
      <li>Start sharing and earn commissions on successful referrals!</li>
    </ol>
  </div>
  
  <div style="background-color: #e8f4f8; padding: 15px; border-left: 4px solid #4285F4; margin: 20px 0;">
    <p style="margin: 0;"><strong>💰 Commission Rate:</strong> 30% of every paid subscription</p>
    <p style="margin: 5px 0 0 0;"><strong>⏰ Payout:</strong> Monthly or early payout available</p>
  </div>
  
  <p>If you have any questions in the meantime, feel free to reach out to us at <a href="mailto:support@listgenius.expert">support@listgenius.expert</a>.</p>
  
  <p>Best regards,<br>The ListGenius Team</p>
</div>`,
        textBody: `Thank You for Your Application!

Hi {{userName}},

Thank you for your interest in joining the ListGenius Affiliate Program! We've received your application and our team will review it shortly.

What happens next?
1. Our team will review your application within 1-2 business days
2. If approved, you'll receive an email with your unique affiliate link and dashboard access
3. Start sharing and earn commissions on successful referrals!

💰 Commission Rate: 30% of every paid subscription
⏰ Payout: Monthly or early payout available

If you have any questions in the meantime, feel free to reach out to us at support@listgenius.expert.

Best regards,
The ListGenius Team`,
        variables: ['userName'],
      },
      {
        name: 'Affiliate Approved',
        slug: 'affiliate-approved',
        description: 'Sent to affiliates when their application is approved',
        category: 'affiliate_approval',
        subject: '🎉 Your Affiliate Application Has Been Approved! - ListGenius',
        htmlBody: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #333; border-bottom: 2px solid #10B981; padding-bottom: 10px;">
    🎉 Congratulations, {{userName}}!
  </h2>
  
  <p>Great news! Your affiliate application has been <strong style="color: #10B981;">APPROVED</strong>!</p>
  
  <p>You're now officially part of the ListGenius Affiliate Program. Start earning commissions today!</p>
  
  <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981;">
    <h3 style="color: #065f46; margin-top: 0;">🎯 Your Affiliate Details</h3>
    <p><strong>Your Affiliate Code:</strong> <code style="background: #fff; padding: 2px 8px; border-radius: 4px; font-family: monospace;">{{affiliateCode}}</code></p>
    <p><strong>Your Affiliate Link:</strong></p>
    <p style="margin: 10px 0;"><a href="{{affiliateUrl}}" style="color: #10B981; word-break: break-all;">{{affiliateUrl}}</a></p>
  </div>
  
  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="color: #555; margin-top: 0;">💰 Commission Structure</h3>
    <ul style="line-height: 1.8;">
      <li><strong>Commission Rate:</strong> 30% of every paid subscription</li>
      <li><strong>Minimum Payout:</strong> $10</li>
      <li><strong>Early Payout:</strong> Available once you reach $50</li>
      <li><strong>Payout Frequency:</strong> Monthly or on-demand</li>
    </ul>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{appUrl}}/app/affiliate" 
       style="background-color: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
      Access Your Dashboard
    </a>
  </div>
  
  <p>Welcome aboard!<br>The ListGenius Team</p>
</div>`,
        textBody: `🎉 Congratulations, {{userName}}!

Great news! Your affiliate application has been APPROVED!

You're now officially part of the ListGenius Affiliate Program. Start earning commissions today!

Your Affiliate Details:
Your Affiliate Code: {{affiliateCode}}
Your Affiliate Link: {{affiliateUrl}}

Commission Structure:
- Commission Rate: 30% of every paid subscription
- Minimum Payout: $10
- Early Payout: Available once you reach $50
- Payout Frequency: Monthly or on-demand

Access Your Dashboard: {{appUrl}}/app/affiliate

Welcome aboard!
The ListGenius Team`,
        variables: ['userName', 'affiliateCode', 'affiliateUrl', 'appUrl'],
      },
      {
        name: 'Affiliate Rejected',
        slug: 'affiliate-rejected',
        description: 'Sent to applicants when their application is rejected',
        category: 'affiliate_rejection',
        subject: 'Affiliate Application Update - ListGenius',
        htmlBody: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #333; border-bottom: 2px solid #EF4444; padding-bottom: 10px;">
    Application Update
  </h2>
  
  <p>Hi {{userName}},</p>
  
  <p>Thank you for your interest in the ListGenius Affiliate Program.</p>
  
  <p>After careful review, we regret to inform you that we're unable to approve your affiliate application at this time.</p>
  
  {{#if rejectionReason}}
  <div style="background-color: #fef2f2; padding: 15px; border-left: 4px solid #EF4444; margin: 20px 0;">
    <p style="margin: 0; color: #991b1b;"><strong>Reason:</strong> {{rejectionReason}}</p>
  </div>
  {{/if}}
  
  <p>This decision was based on several factors and doesn't reflect the quality of your work or potential as a partner.</p>
  
  <p>If you'd like to reapply in the future or have questions about this decision, please don't hesitate to contact us at <a href="mailto:support@listgenius.expert">support@listgenius.expert</a>.</p>
  
  <p>Thank you for understanding,<br>The ListGenius Team</p>
</div>`,
        textBody: `Application Update

Hi {{userName}},

Thank you for your interest in the ListGenius Affiliate Program.

After careful review, we regret to inform you that we're unable to approve your affiliate application at this time.

{{#if rejectionReason}}
Reason: {{rejectionReason}}
{{/if}}

This decision was based on several factors and doesn't reflect the quality of your work or potential as a partner.

If you'd like to reapply in the future or have questions about this decision, please don't hesitate to contact us at support@listgenius.expert.

Thank you for understanding,
The ListGenius Team`,
        variables: ['userName', 'rejectionReason'],
      },
      {
        name: 'Affiliate Suspended',
        slug: 'affiliate-suspended',
        description: 'Sent to affiliates when their account is suspended',
        category: 'affiliate_suspension',
        subject: 'Important: Affiliate Account Suspension - ListGenius',
        htmlBody: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #333; border-bottom: 2px solid #F59E0B; padding-bottom: 10px;">
    Account Suspension Notice
  </h2>
  
  <p>Hi {{userName}},</p>
  
  <p>Your affiliate account has been temporarily suspended.</p>
  
  {{#if suspensionReason}}
  <div style="background-color: #fffbeb; padding: 15px; border-left: 4px solid #F59E0B; margin: 20px 0;">
    <p style="margin: 0; color: #92400e;"><strong>Reason:</strong> {{suspensionReason}}</p>
  </div>
  {{/if}}
  
  <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="color: #92400e; margin-top: 0;">What this means:</h3>
    <ul style="line-height: 1.8; margin-bottom: 0;">
      <li>Your affiliate link is temporarily deactivated</li>
      <li>You won't earn commissions during the suspension period</li>
      <li>Existing pending earnings are unaffected</li>
      <li>You can appeal this decision</li>
    </ul>
  </div>
  
  <p>If you believe this is an error or would like to discuss this matter further, please contact us immediately at <a href="mailto:support@listgenius.expert">support@listgenius.expert</a>.</p>
  
  <p>Best regards,<br>The ListGenius Team</p>
</div>`,
        textBody: `Account Suspension Notice

Hi {{userName}},

Your affiliate account has been temporarily suspended.

{{#if suspensionReason}}
Reason: {{suspensionReason}}
{{/if}}

What this means:
- Your affiliate link is temporarily deactivated
- You won't earn commissions during the suspension period
- Existing pending earnings are unaffected
- You can appeal this decision

If you believe this is an error or would like to discuss this matter further, please contact us immediately at support@listgenius.expert.

Best regards,
The ListGenius Team`,
        variables: ['userName', 'suspensionReason'],
      },
    ];

    // Create templates (skip if already exists)
    const createdTemplates = [];
    for (const template of defaultTemplates) {
      const existing = await prisma.emailTemplate.findUnique({
        where: { slug: template.slug }
      });

      if (!existing) {
        const created = await prisma.emailTemplate.create({
          data: template
        });
        createdTemplates.push(created);
      }
    }

    logger.info('Email templates seeded', {
      created: createdTemplates.length,
      total: defaultTemplates.length
    });

    return NextResponse.json({ 
      success: true,
      message: `Seeded ${createdTemplates.length} new templates`,
      templates: createdTemplates
    });
  } catch (error) {
    logger.error('Failed to seed email templates', { error });
    return NextResponse.json(
      { error: 'Failed to seed email templates' },
      { status: 500 }
    );
  }
}


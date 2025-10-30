import nodemailer from 'nodemailer';
import { logger } from './logger';

// Create transporter - using Gmail SMTP as default
// You can configure this with your preferred email service
const createTransporter = () => {
  // For development, you can use Gmail SMTP
  // Make sure to set up an App Password in your Gmail account
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Fallback to Gmail SMTP if no custom SMTP is configured
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD, // Use App Password, not regular password
      },
    });
  }

  // If no email configuration is found, return null
  logger.warn('No email configuration found. Please set up SMTP or Gmail credentials.');
  return null;
};

// Get the configured FROM email address
const getFromEmail = () => {
  return process.env.FROM_EMAIL || process.env.SMTP_USER || process.env.GMAIL_USER || 'noreply@listgenius.expert';
};

// Get the FROM name
const getFromName = () => {
  return process.env.FROM_NAME || 'ListGenius';
};

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  userId?: string;
}

export async function sendContactFormEmail(data: ContactFormData): Promise<boolean> {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      logger.error('Email transporter not configured');
      return false;
    }

    const mailOptions = {
      from: `${getFromName()} <${getFromEmail()}>`,
      to: process.env.CONTACT_EMAIL || 'support@listgenius.expert',
      subject: `Contact Form: ${data.subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #4285F4; padding-bottom: 10px;">
            New Contact Form Submission
          </h2>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #555; margin-top: 0;">Contact Details</h3>
            <p><strong>Name:</strong> ${data.name}</p>
            <p><strong>Email:</strong> ${data.email}</p>
            <p><strong>Subject:</strong> ${data.subject}</p>
            ${data.userId ? `<p><strong>User ID:</strong> ${data.userId}</p>` : ''}
          </div>
          
          <div style="background-color: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h3 style="color: #555; margin-top: 0;">Message</h3>
            <div style="white-space: pre-wrap; line-height: 1.6;">${data.message}</div>
          </div>
          
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
            <p>This message was sent from the ListGenius contact form.</p>
            <p>Timestamp: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `,
      text: `
New Contact Form Submission

Name: ${data.name}
Email: ${data.email}
Subject: ${data.subject}
User ID: ${data.userId || 'Not logged in'}

Message:
${data.message}

---
Sent from ListGenius Contact Form
Timestamp: ${new Date().toLocaleString()}
      `.trim(),
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info('Contact form email sent successfully', {
      messageId: info.messageId,
      to: mailOptions.to,
      subject: mailOptions.subject,
    });
    
    return true;
  } catch (error) {
    logger.error('Failed to send contact form email', { error, data });
    return false;
  }
}

export async function sendWelcomeEmail(email: string, name: string): Promise<boolean> {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      logger.error('Email transporter not configured');
      return false;
    }

    const mailOptions = {
      from: `${getFromName()} <${getFromEmail()}>`,
      to: email,
      subject: 'Welcome to ListGenius!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #4285F4; padding-bottom: 10px;">
            Welcome to ListGenius!
          </h2>
          
          <p>Hi ${name},</p>
          
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
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/app" 
               style="background-color: #4285F4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Start Generating Listings
            </a>
          </div>
          
          <p>If you have any questions, feel free to reach out to us at <a href="mailto:support@listgenius.expert">support@listgenius.expert</a>.</p>
          
          <p>Best regards,<br>The ListGenius Team</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info('Welcome email sent successfully', {
      messageId: info.messageId,
      to: email,
    });
    
    return true;
  } catch (error) {
    logger.error('Failed to send welcome email', { error, email, name });
    return false;
  }
}

export interface AffiliateApplicationData {
  affiliateName: string;
  affiliateEmail: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string;
  advertisingPlans: string;
  website?: string;
  socialMedia?: string;
  applicationNote?: string;
}

export async function sendAffiliateApplicationNotification(
  adminEmail: string,
  data: AffiliateApplicationData
): Promise<boolean> {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      logger.error('Email transporter not configured');
      return false;
    }

    const mailOptions = {
      from: `${getFromName()} <${getFromEmail()}>`,
      to: adminEmail,
      subject: 'New Affiliate Application - ListGenius',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #4285F4; padding-bottom: 10px;">
            New Affiliate Application Received
          </h2>
          
          <p>A new affiliate application has been submitted and is awaiting review.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #555; margin-top: 0;">Applicant Information</h3>
            <p><strong>Name:</strong> ${data.firstName} ${data.lastName}</p>
            <p><strong>Email:</strong> ${data.affiliateEmail}</p>
            <p><strong>Phone:</strong> ${data.phoneNumber}</p>
            <p><strong>Address:</strong> ${data.address}</p>
            ${data.website ? `<p><strong>Website:</strong> <a href="${data.website}">${data.website}</a></p>` : ''}
            ${data.socialMedia ? `<p><strong>Social Media:</strong> ${data.socialMedia}</p>` : ''}
          </div>
          
          <div style="background-color: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h3 style="color: #555; margin-top: 0;">Advertising Plans</h3>
            <div style="white-space: pre-wrap; line-height: 1.6;">${data.advertisingPlans}</div>
          </div>
          
          ${data.applicationNote ? `
          <div style="background-color: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 8px; margin-top: 15px;">
            <h3 style="color: #555; margin-top: 0;">Additional Notes</h3>
            <div style="white-space: pre-wrap; line-height: 1.6;">${data.applicationNote}</div>
          </div>
          ` : ''}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/adm1n796/affiliates" 
               style="background-color: #4285F4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Review Application
            </a>
          </div>
          
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
            <p>This notification was sent from the ListGenius affiliate system.</p>
            <p>Timestamp: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `,
      text: `
New Affiliate Application Received

A new affiliate application has been submitted and is awaiting review.

Applicant Information:
- Name: ${data.firstName} ${data.lastName}
- Email: ${data.affiliateEmail}
- Phone: ${data.phoneNumber}
- Address: ${data.address}
${data.website ? `- Website: ${data.website}\n` : ''}${data.socialMedia ? `- Social Media: ${data.socialMedia}\n` : ''}

Advertising Plans:
${data.advertisingPlans}

${data.applicationNote ? `\nAdditional Notes:\n${data.applicationNote}\n` : ''}

Review Application: ${process.env.NEXT_PUBLIC_APP_URL}/adm1n796/affiliates

---
Sent from ListGenius Affiliate System
Timestamp: ${new Date().toLocaleString()}
      `.trim(),
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info('Affiliate application notification sent successfully', {
      messageId: info.messageId,
      to: adminEmail,
      affiliateEmail: data.affiliateEmail,
    });
    
    return true;
  } catch (error) {
    logger.error('Failed to send affiliate application notification', { error, data });
    return false;
  }
}

export async function sendAffiliateApprovalEmail(
  email: string,
  name: string,
  affiliateCode: string,
  customSlug?: string
): Promise<boolean> {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      logger.error('Email transporter not configured');
      return false;
    }

    const affiliateUrl = customSlug 
      ? `${process.env.NEXT_PUBLIC_APP_URL}/ref/${customSlug}`
      : `${process.env.NEXT_PUBLIC_APP_URL}/ref/${affiliateCode}`;

    const mailOptions = {
      from: `${getFromName()} <${getFromEmail()}>`,
      to: email,
      subject: '🎉 Your Affiliate Application Has Been Approved! - ListGenius',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #10B981; padding-bottom: 10px;">
            🎉 Congratulations, ${name}!
          </h2>
          
          <p>Great news! Your affiliate application has been <strong style="color: #10B981;">APPROVED</strong>!</p>
          
          <p>You're now officially part of the ListGenius Affiliate Program. Start earning commissions today!</p>
          
          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981;">
            <h3 style="color: #065f46; margin-top: 0;">🎯 Your Affiliate Details</h3>
            <p><strong>Your Affiliate Code:</strong> <code style="background: #fff; padding: 2px 8px; border-radius: 4px; font-family: monospace;">${affiliateCode}</code></p>
            <p><strong>Your Affiliate Link:</strong></p>
            <p style="margin: 10px 0;"><a href="${affiliateUrl}" style="color: #10B981; word-break: break-all;">${affiliateUrl}</a></p>
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
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/app/affiliate" 
               style="background-color: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Access Your Dashboard
            </a>
          </div>
          
          <div style="background-color: #e8f4f8; padding: 15px; border-left: 4px solid #4285F4; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #1e40af;">📚 Getting Started</h4>
            <ol style="line-height: 1.8; margin-bottom: 0;">
              <li>Share your unique affiliate link with your audience</li>
              <li>Track your performance in your affiliate dashboard</li>
              <li>Earn commissions on every successful referral</li>
              <li>Request payouts when you're ready!</li>
            </ol>
          </div>
          
          <p>We're here to help you succeed. If you have any questions, reach out to us at <a href="mailto:support@listgenius.expert">support@listgenius.expert</a>.</p>
          
          <p>Welcome aboard!<br>The ListGenius Team</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info('Affiliate approval email sent successfully', {
      messageId: info.messageId,
      to: email,
      affiliateCode,
    });
    
    return true;
  } catch (error) {
    logger.error('Failed to send affiliate approval email', { error, email, name, affiliateCode });
    return false;
  }
}

export async function sendAffiliateRejectionEmail(
  email: string,
  name: string,
  reason?: string
): Promise<boolean> {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      logger.error('Email transporter not configured');
      return false;
    }

    const mailOptions = {
      from: `${getFromName()} <${getFromEmail()}>`,
      to: email,
      subject: 'Affiliate Application Update - ListGenius',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #EF4444; padding-bottom: 10px;">
            Application Update
          </h2>
          
          <p>Hi ${name},</p>
          
          <p>Thank you for your interest in the ListGenius Affiliate Program.</p>
          
          <p>After careful review, we regret to inform you that we're unable to approve your affiliate application at this time.</p>
          
          ${reason ? `
          <div style="background-color: #fef2f2; padding: 15px; border-left: 4px solid #EF4444; margin: 20px 0;">
            <p style="margin: 0; color: #991b1b;"><strong>Reason:</strong> ${reason}</p>
          </div>
          ` : ''}
          
          <p>This decision was based on several factors and doesn't reflect the quality of your work or potential as a partner.</p>
          
          <p>If you'd like to reapply in the future or have questions about this decision, please don't hesitate to contact us at <a href="mailto:support@listgenius.expert">support@listgenius.expert</a>.</p>
          
          <p>Thank you for understanding,<br>The ListGenius Team</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info('Affiliate rejection email sent successfully', {
      messageId: info.messageId,
      to: email,
    });
    
    return true;
  } catch (error) {
    logger.error('Failed to send affiliate rejection email', { error, email, name });
    return false;
  }
}

export async function sendAffiliateSuspensionEmail(
  email: string,
  name: string,
  reason?: string
): Promise<boolean> {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      logger.error('Email transporter not configured');
      return false;
    }

    const mailOptions = {
      from: `${getFromName()} <${getFromEmail()}>`,
      to: email,
      subject: 'Important: Affiliate Account Suspension - ListGenius',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #F59E0B; padding-bottom: 10px;">
            Account Suspension Notice
          </h2>
          
          <p>Hi ${name},</p>
          
          <p>Your affiliate account has been temporarily suspended.</p>
          
          ${reason ? `
          <div style="background-color: #fffbeb; padding: 15px; border-left: 4px solid #F59E0B; margin: 20px 0;">
            <p style="margin: 0; color: #92400e;"><strong>Reason:</strong> ${reason}</p>
          </div>
          ` : ''}
          
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
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info('Affiliate suspension email sent successfully', {
      messageId: info.messageId,
      to: email,
    });
    
    return true;
  } catch (error) {
    logger.error('Failed to send affiliate suspension email', { error, email, name });
    return false;
  }
}

export async function sendAffiliateApplicationReceivedEmail(
  email: string,
  name: string
): Promise<boolean> {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      logger.error('Email transporter not configured');
      return false;
    }

    const mailOptions = {
      from: `${getFromName()} <${getFromEmail()}>`,
      to: email,
      subject: 'Your Affiliate Application Has Been Received - ListGenius',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #4285F4; padding-bottom: 10px;">
            Thank You for Your Application!
          </h2>
          
          <p>Hi ${name},</p>
          
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
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info('Affiliate application received email sent successfully', {
      messageId: info.messageId,
      to: email,
    });
    
    return true;
  } catch (error) {
    logger.error('Failed to send affiliate application received email', { error, email, name });
    return false;
  }
}

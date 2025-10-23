import nodemailer from 'nodemailer';
import { logger } from './logger';

// Create transporter - using Gmail SMTP as default
// You can configure this with your preferred email service
const createTransporter = () => {
  // For development, you can use Gmail SMTP
  // Make sure to set up an App Password in your Gmail account
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransporter({
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
    return nodemailer.createTransporter({
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
      from: process.env.FROM_EMAIL || process.env.GMAIL_USER || 'noreply@listgenius.expert',
      to: 'support@listgenius.expert',
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
      from: process.env.FROM_EMAIL || process.env.GMAIL_USER || 'noreply@listgenius.expert',
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

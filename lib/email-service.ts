import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';
import Mailgun from 'mailgun-js';
import { Resend } from 'resend';

// Email provider types
type EmailProvider = 'sendgrid' | 'mailgun' | 'nodemailer' | 'resend';

// Email template interface
interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

// Email data interface
interface EmailData {
  to: string;
  from: string;
  subject: string;
  html: string;
  text?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
  attachments?: Array<{
    content: string;
    filename: string;
    type: string;
    disposition: string;
  }>;
}

// Email service configuration
interface EmailConfig {
  provider: EmailProvider;
  apiKey?: string;
  domain?: string;
  fromEmail: string;
  fromName: string;
}

// Personalization variables
interface PersonalizationVars {
  customerName?: string;
  shopName?: string;
  productName?: string;
  orderNumber?: string;
  trackingNumber?: string;
  reviewLink?: string;
  unsubscribeLink?: string;
  [key: string]: any;
}

class EmailService {
  private config: EmailConfig;
  private resend?: Resend;
  private mailgun?: Mailgun.Mailgun;
  private transporter?: nodemailer.Transporter;

  constructor(config: EmailConfig) {
    this.config = config;
    this.initializeProvider();
  }

  private initializeProvider() {
    switch (this.config.provider) {
      case 'sendgrid':
        if (this.config.apiKey) {
          sgMail.setApiKey(this.config.apiKey);
        }
        break;
      case 'resend':
        if (this.config.apiKey) {
          this.resend = new Resend(this.config.apiKey);
        }
        break;
      case 'mailgun':
        if (this.config.apiKey && this.config.domain) {
          this.mailgun = Mailgun({
            apiKey: this.config.apiKey,
            domain: this.config.domain
          });
        }
        break;
      case 'nodemailer':
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });
        break;
    }
  }

  // Send email with template
  async sendTemplate(
    to: string,
    templateId: string,
    dynamicTemplateData: PersonalizationVars = {}
  ): Promise<boolean> {
    try {
      const emailData: EmailData = {
        to,
        from: `${this.config.fromName} <${this.config.fromEmail}>`,
        subject: '', // Will be set by template
        html: '',
        templateId,
        dynamicTemplateData: {
          ...dynamicTemplateData,
          shopName: this.config.fromName,
          unsubscribeLink: this.generateUnsubscribeLink(to)
        }
      };

      return await this.send(emailData);
    } catch (error) {
      console.error('Error sending template email:', error);
      return false;
    }
  }

  // Send custom email
  async sendCustom(
    to: string,
    subject: string,
    html: string,
    text?: string,
    personalization: PersonalizationVars = {}
  ): Promise<boolean> {
    try {
      // Replace personalization variables
      const processedHtml = this.replaceVariables(html, personalization);
      const processedText = text ? this.replaceVariables(text, personalization) : undefined;
      const processedSubject = this.replaceVariables(subject, personalization);

      const emailData: EmailData = {
        to,
        from: `${this.config.fromName} <${this.config.fromEmail}>`,
        subject: processedSubject,
        html: processedHtml,
        text: processedText
      };

      return await this.send(emailData);
    } catch (error) {
      console.error('Error sending custom email:', error);
      return false;
    }
  }

  // Core send method
  private async send(emailData: EmailData): Promise<boolean> {
    try {
      switch (this.config.provider) {
        case 'sendgrid':
          return await this.sendViaSendGrid(emailData);
        case 'resend':
          return await this.sendViaResend(emailData);
        case 'mailgun':
          return await this.sendViaMailgun(emailData);
        case 'nodemailer':
          return await this.sendViaNodemailer(emailData);
        default:
          throw new Error(`Unsupported email provider: ${this.config.provider}`);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  // SendGrid implementation
  private async sendViaSendGrid(emailData: EmailData): Promise<boolean> {
    const msg = {
      to: emailData.to,
      from: emailData.from,
      subject: emailData.subject,
      text: emailData.text,
      html: emailData.html,
      attachments: emailData.attachments
    };

    if (emailData.templateId && emailData.dynamicTemplateData) {
      (msg as any).templateId = emailData.templateId;
      (msg as any).dynamicTemplateData = emailData.dynamicTemplateData;
    }

    await sgMail.send(msg);
    return true;
  }

  // Resend implementation
  private async sendViaResend(emailData: EmailData): Promise<boolean> {
    if (!this.resend) throw new Error('Resend not initialized');

    const response = await this.resend.emails.send({
      from: emailData.from,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
      attachments: emailData.attachments?.map(att => ({
        content: att.content,
        filename: att.filename
      }))
    });

    return response.error === null;
  }

  // Mailgun implementation
  private async sendViaMailgun(emailData: EmailData): Promise<boolean> {
    if (!this.mailgun) throw new Error('Mailgun not initialized');

    const data = {
      from: emailData.from,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
      attachment: emailData.attachments
    };

    await this.mailgun.messages().send(data as any);
    return true;
  }

  // Nodemailer implementation
  private async sendViaNodemailer(emailData: EmailData): Promise<boolean> {
    if (!this.transporter) throw new Error('Nodemailer not initialized');

    const mailOptions = {
      from: emailData.from,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
      attachments: emailData.attachments
    };

    await this.transporter.sendMail(mailOptions);
    return true;
  }

  // Replace variables in template
  private replaceVariables(content: string, variables: PersonalizationVars): string {
    let processedContent = content;
    
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      processedContent = processedContent.replace(new RegExp(placeholder, 'g'), String(value || ''));
    });

    return processedContent;
  }

  // Generate unsubscribe link
  private generateUnsubscribeLink(email: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const encodedEmail = encodeURIComponent(email);
    return `${baseUrl}/unsubscribe?email=${encodedEmail}`;
  }

  // Track email opens (placeholder for analytics)
  async trackOpen(emailId: string, recipient: string): Promise<void> {
    // Implementation would depend on your analytics system
    console.log(`Email ${emailId} opened by ${recipient}`);
  }

  // Track email clicks (placeholder for analytics)
  async trackClick(emailId: string, recipient: string, link: string): Promise<void> {
    // Implementation would depend on your analytics system
    console.log(`Email ${emailId} link clicked by ${recipient}: ${link}`);
  }

  // Validate email address
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Queue email for later sending
  async queueEmail(
    to: string,
    subject: string,
    html: string,
    scheduledFor?: Date
  ): Promise<string> {
    // This would integrate with a queue system like Bull, Agenda, etc.
    const emailId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store in database or queue for processing
    console.log(`Email queued: ${emailId} to ${to} for ${scheduledFor || 'immediate sending'}`);
    
    return emailId;
  }
}

// Default email service instance
let emailService: EmailService | null = null;

export function getEmailService(): EmailService {
  if (!emailService) {
    const config: EmailConfig = {
      provider: (process.env.EMAIL_PROVIDER as EmailProvider) || 'sendgrid',
      apiKey: process.env.SENDGRID_API_KEY || process.env.RESEND_API_KEY || process.env.MAILGUN_API_KEY,
      domain: process.env.MAILGUN_DOMAIN,
      fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@listgenius.com',
      fromName: process.env.SENDGRID_FROM_NAME || 'ListGenius'
    };

    emailService = new EmailService(config);
  }

  return emailService;
}

// Email templates
export const EMAIL_TEMPLATES = {
  THANK_YOU_PURCHASE: {
    subject: 'Thank you for your purchase from {{shopName}}!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Thank you for your purchase, {{customerName}}!</h2>
        <p>We're excited to let you know that we've received your order #{{orderNumber}} and are preparing it for shipment.</p>
        <p>Your order details:</p>
        <ul>
          <li>Product: {{productName}}</li>
          <li>Order Number: {{orderNumber}}</li>
          <li>Expected Delivery: 3-5 business days</li>
        </ul>
        <p>We'll send you a shipping confirmation with tracking information once your order is on its way.</p>
        <p>Thank you for supporting our shop!</p>
        <p>Best regards,<br>{{shopName}}</p>
        <hr>
        <p style="font-size: 12px; color: #666;">
          <a href="{{unsubscribeLink}}">Unsubscribe</a> from these emails
        </p>
      </div>
    `,
    text: `
      Thank you for your purchase, {{customerName}}!
      
      We're excited to let you know that we've received your order #{{orderNumber}} and are preparing it for shipment.
      
      Your order details:
      - Product: {{productName}}
      - Order Number: {{orderNumber}}
      - Expected Delivery: 3-5 business days
      
      We'll send you a shipping confirmation with tracking information once your order is on its way.
      
      Thank you for supporting our shop!
      
      Best regards,
      {{shopName}}
      
      Unsubscribe: {{unsubscribeLink}}
    `
  },

  ORDER_SHIPPED: {
    subject: 'Your order from {{shopName}} has shipped!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Great news, {{customerName}}!</h2>
        <p>Your order #{{orderNumber}} has been shipped and is on its way to you.</p>
        <p>Tracking Information:</p>
        <p><strong>Tracking Number:</strong> {{trackingNumber}}</p>
        <p>You can track your package using the tracking number above.</p>
        <p>We hope you love your purchase! If you have any questions, please don't hesitate to reach out.</p>
        <p>Best regards,<br>{{shopName}}</p>
        <hr>
        <p style="font-size: 12px; color: #666;">
          <a href="{{unsubscribeLink}}">Unsubscribe</a> from these emails
        </p>
      </div>
    `,
    text: `
      Great news, {{customerName}}!
      
      Your order #{{orderNumber}} has been shipped and is on its way to you.
      
      Tracking Information:
      Tracking Number: {{trackingNumber}}
      
      You can track your package using the tracking number above.
      
      We hope you love your purchase! If you have any questions, please don't hesitate to reach out.
      
      Best regards,
      {{shopName}}
      
      Unsubscribe: {{unsubscribeLink}}
    `
  },

  REVIEW_REQUEST: {
    subject: 'How was your purchase from {{shopName}}?',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hi {{customerName}}!</h2>
        <p>We hope you're loving your {{productName}}! Your feedback means the world to us and helps other customers discover our products.</p>
        <p>Would you mind taking a moment to leave a review?</p>
        <div style="text-align: center; margin: 20px 0;">
          <a href="{{reviewLink}}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Leave a Review</a>
        </div>
        <p>Your review helps us improve and helps other customers make informed decisions.</p>
        <p>Thank you so much for your support!</p>
        <p>Best regards,<br>{{shopName}}</p>
        <hr>
        <p style="font-size: 12px; color: #666;">
          <a href="{{unsubscribeLink}}">Unsubscribe</a> from these emails
        </p>
      </div>
    `,
    text: `
      Hi {{customerName}}!
      
      We hope you're loving your {{productName}}! Your feedback means the world to us and helps other customers discover our products.
      
      Would you mind taking a moment to leave a review?
      
      Leave a Review: {{reviewLink}}
      
      Your review helps us improve and helps other customers make informed decisions.
      
      Thank you so much for your support!
      
      Best regards,
      {{shopName}}
      
      Unsubscribe: {{unsubscribeLink}}
    `
  },

  ABANDONED_CART: {
    subject: 'Don\'t forget about your items from {{shopName}}!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hi {{customerName}}!</h2>
        <p>We noticed you left some items in your cart:</p>
        <ul>
          <li>{{productName}}</li>
        </ul>
        <p>These items are still waiting for you! Complete your purchase now to secure your order.</p>
        <div style="text-align: center; margin: 20px 0;">
          <a href="{{cartLink}}" style="background-color: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Complete Purchase</a>
        </div>
        <p>Questions? We're here to help!</p>
        <p>Best regards,<br>{{shopName}}</p>
        <hr>
        <p style="font-size: 12px; color: #666;">
          <a href="{{unsubscribeLink}}">Unsubscribe</a> from these emails
        </p>
      </div>
    `,
    text: `
      Hi {{customerName}}!
      
      We noticed you left some items in your cart:
      - {{productName}}
      
      These items are still waiting for you! Complete your purchase now to secure your order.
      
      Complete Purchase: {{cartLink}}
      
      Questions? We're here to help!
      
      Best regards,
      {{shopName}}
      
      Unsubscribe: {{unsubscribeLink}}
    `
  },

  SEASONAL_PROMOTION: {
    subject: 'Special offer just for you from {{shopName}}!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hi {{customerName}}!</h2>
        <p>We're having a special {{season}} promotion and wanted to share it with our valued customers first!</p>
        <p><strong>{{promotionText}}</strong></p>
        <div style="text-align: center; margin: 20px 0;">
          <a href="{{promotionLink}}" style="background-color: #FF9800; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Shop Now</a>
        </div>
        <p>This offer is only available for a limited time, so don't miss out!</p>
        <p>Best regards,<br>{{shopName}}</p>
        <hr>
        <p style="font-size: 12px; color: #666;">
          <a href="{{unsubscribeLink}}">Unsubscribe</a> from these emails
        </p>
      </div>
    `,
    text: `
      Hi {{customerName}}!
      
      We're having a special {{season}} promotion and wanted to share it with our valued customers first!
      
      {{promotionText}}
      
      Shop Now: {{promotionLink}}
      
      This offer is only available for a limited time, so don't miss out!
      
      Best regards,
      {{shopName}}
      
      Unsubscribe: {{unsubscribeLink}}
    `
  }
};

export default EmailService;

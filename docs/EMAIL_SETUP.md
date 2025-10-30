# Email Setup Guide for ListGenius

This guide will help you configure email functionality in ListGenius to automatically send welcome emails and affiliate notifications using your privateemail.com account.

## Overview

ListGenius now supports automated email notifications for:
- ✅ **User Signups** - Welcome emails sent automatically when users sign up
- ✅ **Password Reset** - Automated via Clerk (no configuration needed)
- ✅ **Affiliate Applications** - Confirmation emails to applicants and notifications to admins
- ✅ **Affiliate Approval** - Congratulations email with affiliate link and dashboard access
- ✅ **Affiliate Rejection** - Professional rejection notification with optional reason
- ✅ **Affiliate Suspension** - Account suspension notices with appeal information
- ✅ **Contact Form Submissions** - Notifications to your support email

## Email Provider Configuration

### PrivateEmail.com Setup

PrivateEmail.com uses standard SMTP for outgoing emails. Here's how to configure it:

#### Required Environment Variables

Add these to your `.env.local` file:

```env
# PrivateEmail.com SMTP Configuration
SMTP_HOST=mail.privateemail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@privateemail.com
SMTP_PASS=your_email_password_here

# Email Identity
FROM_EMAIL=your_email@privateemail.com
FROM_NAME=ListGenius

# Admin Email (receives affiliate application notifications)
ADMIN_EMAIL=your_admin@privateemail.com

# Contact Email (receives contact form submissions)
CONTACT_EMAIL=support@yourdomain.com

# Base URL for email links
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

#### PrivateEmail.com SMTP Settings

| Setting | Value |
|---------|-------|
| **SMTP Server** | `mail.privateemail.com` |
| **Port** | `587` (TLS) or `465` (SSL) |
| **Security** | TLS/STARTTLS (`SMTP_SECURE=false`) or SSL (`SMTP_SECURE=true`) |
| **Username** | Your full PrivateEmail.com email address |
| **Password** | Your PrivateEmail.com account password |

### Alternative Email Providers

You can also use other email providers:

#### Gmail

```env
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_app_specific_password

# Note: You need to create an App Password in your Google Account settings
# Enable 2FA first, then generate an app password for this application
```

#### SendGrid

```env
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=ListGenius
```

#### Resend

```env
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=ListGenius
```

#### Mailgun

```env
MAILGUN_API_KEY=your_mailgun_api_key
MAILGUN_DOMAIN=your_domain.com
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=ListGenius
```

## Testing Email Configuration

### Test Email Sending

To test if your email configuration is working:

1. Sign up for a new account on your ListGenius site
2. Check your email for the welcome message
3. Apply for an affiliate account
4. Check both your email and the admin email

### Debugging Email Issues

If emails aren't sending, check the following:

1. **Check environment variables** - Make sure all required variables are set in `.env.local`
2. **Check SMTP credentials** - Verify your email and password are correct
3. **Check logs** - Look for email-related errors in your application logs
4. **Check spam folder** - Some emails may be flagged as spam initially
5. **Port and security settings** - Ensure `SMTP_PORT` and `SMTP_SECURE` match your provider

Common error messages:

- **"Email transporter not configured"** - Missing or incorrect SMTP credentials
- **"Authentication failed"** - Wrong email or password
- **"Connection timeout"** - Incorrect SMTP host or port

## Email Templates

### Welcome Email

Sent automatically to all new users when they sign up for ListGenius.

**Subject:** Welcome to ListGenius!

**Content:**
- Personalized greeting
- Getting started guide
- Link to dashboard
- Support contact information

### Affiliate Application Received

Sent to applicants when they submit an affiliate application.

**Subject:** Your Affiliate Application Has Been Received - ListGenius

**Content:**
- Application confirmation
- Review timeline (1-2 business days)
- Commission rate information
- Payout details

### Affiliate Approval

Sent to affiliates when their application is approved.

**Subject:** 🎉 Your Affiliate Application Has Been Approved! - ListGenius

**Content:**
- Congratulations message
- Unique affiliate code
- Personalized affiliate link
- Commission structure details
- Link to dashboard
- Getting started guide

### Affiliate Rejection

Sent to applicants when their application is rejected.

**Subject:** Affiliate Application Update - ListGenius

**Content:**
- Professional rejection notice
- Optional rejection reason
- Information about reapplying
- Support contact information

### Affiliate Suspension

Sent to affiliates when their account is suspended.

**Subject:** Important: Affiliate Account Suspension - ListGenius

**Content:**
- Suspension notice
- Optional suspension reason
- What the suspension means
- Information about appealing
- Support contact information

### Affiliate Application Notification

Sent to admin email when a new affiliate application is submitted.

**Subject:** New Affiliate Application - ListGenius

**Content:**
- Applicant information
- Contact details
- Advertising plans
- Link to admin dashboard for review

## Email Functionality

### User Signups

When a user signs up for ListGenius:
1. User completes Clerk signup process
2. Onboarding API is triggered
3. Welcome email is automatically sent
4. Email includes next steps and getting started guide

### Affiliate Applications

When someone applies to the affiliate program:
1. Affiliate application form is submitted
2. Application data is saved to database
3. Confirmation email is sent to applicant
4. Notification email is sent to admin
5. Admin reviews application in dashboard

### Password Reset

Password reset is handled automatically by Clerk:
1. User clicks "Forgot password?" on sign in page
2. Clerk sends password reset email automatically
3. User resets password via Clerk's secure link
4. **No configuration needed** - Works out of the box!

### Affiliate Approval/Rejection/Suspension

When an admin changes an affiliate's status:
1. Admin updates status in affiliate management dashboard
2. Email automatically sent based on new status:
   - **APPROVED**: Congratulations email with affiliate link and dashboard access
   - **REJECTED**: Professional rejection email with optional reason
   - **SUSPENDED**: Suspension notice with appeal information
3. Affiliate receives timely notification

### Contact Form

When a visitor submits the contact form:
1. Form data is validated
2. Email is sent to `CONTACT_EMAIL`
3. User sees confirmation message

## Production Checklist

Before deploying to production:

- [ ] Configure SMTP credentials in Vercel environment variables
- [ ] Set `ADMIN_EMAIL` to your admin email address
- [ ] Set `CONTACT_EMAIL` to your support email
- [ ] Update `FROM_EMAIL` to match your domain
- [ ] Update `FROM_NAME` to your brand name
- [ ] Set `NEXT_PUBLIC_APP_URL` to your production domain
- [ ] Test all email templates in production
- [ ] Set up email monitoring/alerts
- [ ] Configure SPF and DKIM records for your domain
- [ ] Add unsubscribe links if required by law

## SPF/DKIM Records

For better deliverability, configure SPF and DKIM records with your domain provider:

### SPF Record

Add a TXT record:
```
Type: TXT
Name: @
Value: v=spf1 include:mail.privateemail.com ~all
TTL: 3600
```

### DKIM Record

Add DKIM records provided by PrivateEmail.com in your domain DNS settings.

## Troubleshooting

### Emails not sending

1. Verify environment variables are loaded
2. Check SMTP credentials are correct
3. Try using port 465 with SSL
4. Check firewall/network restrictions
5. Review application logs for errors

### Emails going to spam

1. Configure SPF and DKIM records
2. Use a professional FROM_EMAIL address
3. Avoid spam trigger words in subject lines
4. Include clear unsubscribe options
5. Use reputable email service providers

### Testing locally

For local development testing:
1. Use Gmail with App Password for faster setup
2. Check console logs for email sending status
3. Use a tool like Mailtrap for testing without sending real emails
4. Consider using a development email provider

## Support

If you encounter issues with email configuration:
1. Check the troubleshooting section above
2. Review application logs
3. Test with a simple email provider like Gmail first
4. Contact support with error logs if needed

## Additional Resources

- [PrivateEmail.com Setup Guide](https://www.namecheap.com/support/knowledgebase/article.aspx/1179/2175)
- [Nodemailer Documentation](https://nodemailer.com/about/)
- [Email Best Practices](https://www.emailonacid.com/blog/article/email-development/email-developer-guide)

---

**Last Updated:** December 2024
**Version:** 1.0


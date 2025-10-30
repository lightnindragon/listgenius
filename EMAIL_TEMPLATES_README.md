# Email Template Management System

## Overview

ListGenius now includes a comprehensive email template management system in the admin dashboard. You can now edit, test, and manage all automated email templates without touching code.

## Access

Navigate to: **Admin Dashboard → Email Templates**

Direct URL: `/adm1n796/email-templates`

## Features

### 1. **Template Management**
- View all email templates
- Edit templates with a rich text editor
- See usage statistics (sent count, last used)
- Enable/disable templates without deleting
- Organize by categories

### 2. **Template Categories**
- **Welcome**: New user signup emails
- **Affiliate Application Received**: Confirmation when someone applies
- **Affiliate Approved**: When an affiliate is accepted
- **Affiliate Rejected**: When an application is declined
- **Affiliate Suspended**: When an affiliate account is suspended

### 3. **Variable System**
Templates support dynamic variables using double curly braces:

- `{{userName}}` - User's name
- `{{affiliateCode}}` - Affiliate code
- `{{affiliateUrl}}` - Full affiliate link
- `{{appUrl}}` - Base application URL
- `{{rejectionReason}}` - Optional reason for rejection
- `{{suspensionReason}}` - Optional reason for suspension

### 4. **Test & Preview**
- Send test emails to any address
- Preview how emails look before sending
- Replace variables with sample data
- View both HTML and plain text versions

### 5. **Default Templates**
When you first access Email Templates, you'll be prompted to seed default templates. These include:
- Welcome email
- Affiliate application received
- Affiliate approved
- Affiliate rejected
- Affiliate suspended

## Getting Started

### Step 1: Seed Default Templates
1. Go to Email Templates in admin dashboard
2. Click "Seed Default Templates"
3. Review the created templates

### Step 2: Customize Templates
1. Click on any template to edit
2. Modify subject, HTML body, or plain text body
3. Add or remove variables as needed
4. Click "Save Changes"

### Step 3: Test Your Changes
1. Click "Test Email" on any template
2. Enter a test email address
3. Fill in variable values
4. Send test email

### Step 4: Activate Templates
1. Toggle the "Active" checkbox on templates you want to use
2. Inactive templates won't be used by the system

## Template Structure

Each template includes:
- **Name**: Internal reference name
- **Slug**: Unique identifier (auto-generated)
- **Description**: What this template is for
- **Category**: Type of email
- **Subject**: Email subject line
- **HTML Body**: Rich HTML email content
- **Plain Text Body**: Fallback for plain text clients
- **Variables**: List of available placeholders
- **Active Status**: Whether template is currently in use
- **Usage Stats**: How many times sent, last used date

## Best Practices

### 1. **Keep It Professional**
- Use consistent branding
- Check grammar and spelling
- Maintain friendly but professional tone

### 2. **Test Thoroughly**
- Always send test emails before enabling
- Test with different email clients
- Verify all links work correctly

### 3. **Use Variables Wisely**
- Make emails personal with `{{userName}}`
- Include relevant links with URL variables
- Keep rejection/suspension reasons constructive

### 4. **HTML Email Design**
- Use inline CSS styles (required by most email clients)
- Test on mobile devices
- Keep images minimal and hosted externally if needed
- Include plain text fallback for accessibility

### 5. **Subject Lines**
- Keep under 50 characters
- Be clear and specific
- Use emojis sparingly
- Make it action-oriented

## Technical Details

### Database Schema
Templates are stored in `EmailTemplate` table:
- Unique slugs for referencing
- Both HTML and text versions
- Usage tracking
- Category-based organization

### Integration
Email sending functions in `lib/email.ts` automatically use active templates from the database. The system:
1. Looks up the template by category
2. Replaces variables with actual values
3. Sends using configured SMTP
4. Updates usage statistics

### API Endpoints
- `GET /api/adm1n796/email-templates` - List all templates
- `POST /api/adm1n796/email-templates` - Create new template
- `GET /api/adm1n796/email-templates/[id]` - Get single template
- `PUT /api/adm1n796/email-templates/[id]` - Update template
- `DELETE /api/adm1n796/email-templates/[id]` - Delete template
- `POST /api/adm1n796/email-templates/seed` - Seed defaults
- `POST /api/adm1n796/email-templates/test` - Send test email

## Troubleshooting

### Templates not showing
- Run the seed function to create defaults
- Check database connection
- Verify admin authentication

### Test emails not sending
- Check SMTP configuration in environment variables
- Verify test email address is valid
- Check server logs for errors

### Variables not replacing
- Use exact variable names with double curly braces
- Check that variables match the template definition
- Verify data being passed to email functions

## Next Steps

The email template system is now fully functional. Additional features you could add:
- Email scheduling
- A/B testing variants
- Template versioning/rollback
- Analytics and open rates
- Custom template categories

Enjoy managing your emails! 🎉


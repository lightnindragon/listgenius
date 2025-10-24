# Vercel Environment Variables Management Setup

This guide explains how to set up the environment variables management feature in the admin panel to work with Vercel's API.

## Overview

The admin panel now includes the ability to manage public environment variables (NEXT_PUBLIC_*) directly through the Vercel API. This allows you to update feature flags and configuration without redeploying the application.

## Required Environment Variables

To enable real Vercel API integration, you need to add these environment variables to your Vercel project:

### 1. Vercel API Token
```bash
VERCEL_API_TOKEN=your_vercel_api_token_here
```

**How to get your Vercel API Token:**
1. Go to [Vercel Dashboard](https://vercel.com/account/tokens)
2. Click "Create Token"
3. Give it a name (e.g., "ListGenius Admin")
4. Set expiration (recommend 1 year)
5. Copy the token and add it to your Vercel environment variables

### 2. Vercel Project ID
```bash
VERCEL_PROJECT_ID=your_project_id_here
```

**How to get your Project ID:**
1. Go to your project in Vercel Dashboard
2. Go to Settings → General
3. Copy the "Project ID" from the project details

### 3. Vercel Team ID (Optional)
```bash
VERCEL_TEAM_ID=your_team_id_here
```

**Only needed if you're using a team account:**
1. Go to your team settings in Vercel
2. Copy the Team ID from the URL or settings

## Adding Environment Variables to Vercel

### Method 1: Vercel Dashboard
1. Go to your project in Vercel Dashboard
2. Navigate to Settings → Environment Variables
3. Add each variable:
   - `VERCEL_API_TOKEN`
   - `VERCEL_PROJECT_ID`
   - `VERCEL_TEAM_ID` (if using team account)

### Method 2: Vercel CLI
```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# Add environment variables
vercel env add VERCEL_API_TOKEN
vercel env add VERCEL_PROJECT_ID
vercel env add VERCEL_TEAM_ID
```

## Security Considerations

### What Variables Can Be Managed
Only **public environment variables** (those starting with `NEXT_PUBLIC_`) can be managed through the admin panel. This includes:

- `NEXT_PUBLIC_GA4_MEASUREMENT_ID` - Google Analytics ID
- `NEXT_PUBLIC_ENABLE_*` - Feature flags
- Other public configuration variables

### What Variables Are Protected
**Sensitive variables are never exposed** in the admin panel:
- API keys (OpenAI, Stripe, Clerk, etc.)
- Database URLs
- Encryption keys
- Any variable not starting with `NEXT_PUBLIC_`

### Admin Access Control
- Only users with admin privileges can access this feature
- All changes are logged for audit purposes
- Changes require confirmation before applying

## Using the Environment Variables Manager

### Accessing the Feature
1. Log in to the admin panel at `/adm1n796`
2. Click "Environment Variables" in the header or quick actions
3. Select the target environment (Production, Preview, or Development)

### Managing Variables
1. **View Current Values**: See the current value of each manageable variable
2. **Edit Values**: Click "Edit" to modify a variable
3. **Save Changes**: Click "Save" to apply changes via Vercel API
4. **Cancel Changes**: Click "Cancel" to discard unsaved changes

### Variable Types
- **GA4 Measurement ID**: Text input with validation (must start with "G-")
- **Feature Flags**: Boolean dropdown (true/false)

## API Endpoints

### Get Environment Variables
```
GET /api/adm1n796/environment-variables
```
Returns a list of manageable environment variables with their current values.

### Update Environment Variable
```
POST /api/adm1n796/environment-variables
Content-Type: application/json

{
  "key": "NEXT_PUBLIC_GA4_MEASUREMENT_ID",
  "value": "G-XXXXXXXXXX",
  "environment": "production"
}
```

## Troubleshooting

### "Vercel API not configured" Message
This means the required environment variables are not set. Check:
1. `VERCEL_API_TOKEN` is set and valid
2. `VERCEL_PROJECT_ID` is set and correct
3. `VERCEL_TEAM_ID` is set if using a team account

### "Failed to update via Vercel API" Error
Common causes:
1. **Invalid API Token**: Regenerate your Vercel API token
2. **Wrong Project ID**: Verify the project ID is correct
3. **Insufficient Permissions**: Ensure the API token has project access
4. **Rate Limiting**: Vercel API has rate limits, wait and retry

### Changes Not Taking Effect
- Environment variable changes require a new deployment to take effect
- For immediate changes, trigger a new deployment in Vercel
- Preview deployments will use the updated variables immediately

## Testing the Integration

### Without Vercel API (Simulation Mode)
If the Vercel API credentials are not configured, the system will run in simulation mode:
- All operations will appear to succeed
- Changes will be logged but not applied
- This is useful for testing the UI without affecting production

### With Vercel API (Production Mode)
When properly configured:
- Changes are applied immediately via Vercel API
- Real-time feedback on success/failure
- Changes take effect on next deployment

## Best Practices

1. **Test in Development First**: Always test changes in development environment before production
2. **Backup Important Values**: Keep a record of important environment variable values
3. **Monitor Deployments**: Watch for deployment failures after environment variable changes
4. **Use Feature Flags**: Leverage feature flags for gradual rollouts
5. **Document Changes**: Keep track of why and when environment variables were changed

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Review the server logs for API errors
3. Verify Vercel API credentials and permissions
4. Test with a simple variable change first

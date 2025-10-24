import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { logger } from '@/lib/logger';
import { vercelAPI } from '@/lib/vercel-api';

// Get environment variables (read-only for security)
export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
    
    // Return a list of environment variables that can be managed
    // We only show non-sensitive variables for security
    const manageableVars = [
      {
        key: 'NEXT_PUBLIC_GA4_MEASUREMENT_ID',
        description: 'Google Analytics 4 Measurement ID',
        type: 'public',
        current: process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID ? 'Set' : 'Not set'
      },
      {
        key: 'NEXT_PUBLIC_ENABLE_MY_LISTINGS',
        description: 'Enable My Listings feature',
        type: 'public',
        current: process.env.NEXT_PUBLIC_ENABLE_MY_LISTINGS || 'false'
      },
      {
        key: 'NEXT_PUBLIC_ENABLE_KEYWORDS',
        description: 'Enable Keywords feature',
        type: 'public',
        current: process.env.NEXT_PUBLIC_ENABLE_KEYWORDS || 'false'
      },
      {
        key: 'NEXT_PUBLIC_ENABLE_ANALYTICS',
        description: 'Enable Analytics feature',
        type: 'public',
        current: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS || 'false'
      },
      {
        key: 'NEXT_PUBLIC_ENABLE_TOOLS',
        description: 'Enable Tools feature',
        type: 'public',
        current: process.env.NEXT_PUBLIC_ENABLE_TOOLS || 'false'
      },
      {
        key: 'NEXT_PUBLIC_ENABLE_TEMPLATES',
        description: 'Enable Templates feature',
        type: 'public',
        current: process.env.NEXT_PUBLIC_ENABLE_TEMPLATES || 'false'
      },
      {
        key: 'NEXT_PUBLIC_ENABLE_DRAFTS',
        description: 'Enable Drafts feature',
        type: 'public',
        current: process.env.NEXT_PUBLIC_ENABLE_DRAFTS || 'false'
      },
      {
        key: 'NEXT_PUBLIC_ENABLE_ETSY',
        description: 'Enable Etsy integration',
        type: 'public',
        current: process.env.NEXT_PUBLIC_ENABLE_ETSY || 'false'
      },
      {
        key: 'NEXT_PUBLIC_ENABLE_FINANCES',
        description: 'Enable Finances feature',
        type: 'public',
        current: process.env.NEXT_PUBLIC_ENABLE_FINANCES || 'false'
      },
      {
        key: 'NEXT_PUBLIC_ENABLE_COMMUNICATION',
        description: 'Enable Communication feature',
        type: 'public',
        current: process.env.NEXT_PUBLIC_ENABLE_COMMUNICATION || 'false'
      },
      {
        key: 'NEXT_PUBLIC_ENABLE_INVENTORY',
        description: 'Enable Inventory feature',
        type: 'public',
        current: process.env.NEXT_PUBLIC_ENABLE_INVENTORY || 'false'
      },
      {
        key: 'NEXT_PUBLIC_ENABLE_PINTEREST',
        description: 'Enable Pinterest integration',
        type: 'public',
        current: process.env.NEXT_PUBLIC_ENABLE_PINTEREST || 'false'
      },
      {
        key: 'NEXT_PUBLIC_ENABLE_KEYWORD_RANKING',
        description: 'Enable Keyword Ranking feature',
        type: 'public',
        current: process.env.NEXT_PUBLIC_ENABLE_KEYWORD_RANKING || 'false'
      }
    ];

    return NextResponse.json({
      success: true,
      variables: manageableVars
    });

  } catch (error) {
    logger.error('Error fetching environment variables:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch environment variables' },
      { status: 500 }
    );
  }
}

// Update environment variables via Vercel API
export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);
    
    const body = await request.json();
    const { key, value, environment = 'production' } = body;

    if (!key || value === undefined) {
      return NextResponse.json(
        { success: false, error: 'Key and value are required' },
        { status: 400 }
      );
    }

    // Validate that only public variables can be updated
    const allowedKeys = [
      'NEXT_PUBLIC_GA4_MEASUREMENT_ID',
      'NEXT_PUBLIC_ENABLE_MY_LISTINGS',
      'NEXT_PUBLIC_ENABLE_KEYWORDS',
      'NEXT_PUBLIC_ENABLE_ANALYTICS',
      'NEXT_PUBLIC_ENABLE_TOOLS',
      'NEXT_PUBLIC_ENABLE_TEMPLATES',
      'NEXT_PUBLIC_ENABLE_DRAFTS',
      'NEXT_PUBLIC_ENABLE_ETSY',
      'NEXT_PUBLIC_ENABLE_FINANCES',
      'NEXT_PUBLIC_ENABLE_COMMUNICATION',
      'NEXT_PUBLIC_ENABLE_INVENTORY',
      'NEXT_PUBLIC_ENABLE_PINTEREST',
      'NEXT_PUBLIC_ENABLE_KEYWORD_RANKING'
    ];

    if (!allowedKeys.includes(key)) {
      return NextResponse.json(
        { success: false, error: 'Variable not allowed to be updated' },
        { status: 403 }
      );
    }

    // Validate boolean values for feature flags
    if (key.startsWith('NEXT_PUBLIC_ENABLE_') && !['true', 'false'].includes(value)) {
      return NextResponse.json(
        { success: false, error: 'Feature flag values must be "true" or "false"' },
        { status: 400 }
      );
    }

    // Validate GA4 measurement ID format
    if (key === 'NEXT_PUBLIC_GA4_MEASUREMENT_ID' && value && !value.startsWith('G-')) {
      return NextResponse.json(
        { success: false, error: 'GA4 Measurement ID must start with "G-"' },
        { status: 400 }
      );
    }

    // Check if Vercel API is configured
    if (!vercelAPI.isConfigured()) {
      logger.warn('Vercel API not configured, simulating environment variable update');
      return NextResponse.json({
        success: true,
        message: `Environment variable ${key} will be updated to "${value}" in ${environment} environment`,
        note: 'Vercel API not configured. This is a simulation. Configure VERCEL_API_TOKEN and VERCEL_PROJECT_ID to enable real updates.'
      });
    }

    // Update environment variable via Vercel API
    try {
      const target: ('production' | 'preview' | 'development')[] = 
        environment === 'production' ? ['production'] : 
        environment === 'preview' ? ['preview'] : 
        ['development'];
      
      await vercelAPI.updateEnvironmentVariable(key, value, target);
      
      logger.info(`Environment variable updated via Vercel API: ${key} = ${value} (${environment})`);
      
      return NextResponse.json({
        success: true,
        message: `Environment variable ${key} has been updated to "${value}" in ${environment} environment`,
        note: 'Variable updated successfully via Vercel API. Changes will take effect on next deployment.'
      });
    } catch (vercelError) {
      logger.error('Vercel API error:', vercelError);
      return NextResponse.json({
        success: false,
        error: `Failed to update via Vercel API: ${vercelError instanceof Error ? vercelError.message : 'Unknown error'}`,
        note: 'Check Vercel API credentials and project configuration.'
      }, { status: 500 });
    }

  } catch (error) {
    logger.error('Error updating environment variable:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update environment variable' },
      { status: 500 }
    );
  }
}

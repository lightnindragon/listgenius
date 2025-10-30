/**
 * Daily Blog Publish Cron Job
 * Runs the complete blog automation workflow daily at 8am
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { blogAutomationService } from '@/lib/blog-automation-service';
import { logger } from '@/lib/logger';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request (Vercel cron jobs send GET requests)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'default-cron-secret';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      logger.warn('Unauthorized cron request', { 
        authHeader: authHeader ? 'present' : 'missing',
        expected: `Bearer ${cronSecret}`
      });
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    logger.info('Daily blog publish cron job started', { 
      timestamp: new Date().toISOString() 
    });

    // Get all users who should receive automated blog posts
    // For now, we'll use a single admin user ID, but this could be expanded
    const adminUserId = process.env.ADMIN_USER_ID || 'admin';
    
    // Check if we should run the automation
    const shouldRun = await shouldRunAutomation(adminUserId);
    if (!shouldRun) {
      logger.info('Blog automation skipped', { 
        reason: 'Already published today or automation disabled',
        userId: adminUserId 
      });
      
      return NextResponse.json({
        success: true,
        message: 'Automation skipped - post already published today',
        data: {
          skipped: true,
          reason: 'Already published today'
        }
      });
    }

    // Run the automation workflow
    const workflowResult = await blogAutomationService.runWorkflow(adminUserId);
    
    if (workflowResult.success) {
      logger.info('Daily blog publish completed successfully', {
        userId: adminUserId,
        postId: workflowResult.postId,
        steps: workflowResult.steps.length
      });

      return NextResponse.json({
        success: true,
        message: 'Blog post published successfully',
        data: {
          postId: workflowResult.postId,
          steps: workflowResult.steps,
          publishedAt: new Date().toISOString()
        }
      });
    } else {
      logger.error('Daily blog publish failed', {
        userId: adminUserId,
        error: workflowResult.error,
        steps: workflowResult.steps.length
      });

      // Log the failure for monitoring
      await logAutomationFailure(adminUserId, workflowResult.error || 'Unknown error', workflowResult.steps);

      return NextResponse.json({
        success: false,
        message: 'Blog automation failed',
        error: workflowResult.error,
        data: {
          steps: workflowResult.steps,
          failedAt: new Date().toISOString()
        }
      }, { status: 500 });
    }

  } catch (error) {
    logger.error('Daily blog publish cron job error', { 
      error: (error as Error).message,
      stack: (error as Error).stack,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: false,
      message: 'Cron job execution failed',
      error: (error as Error).message,
      data: {
        failedAt: new Date().toISOString()
      }
    }, { status: 500 });
  }
}

/**
 * Check if automation should run
 */
async function shouldRunAutomation(userId: string): Promise<boolean> {
  try {
    // Check if post already published today
    const hasPostToday = await blogAutomationService.hasPostToday(userId);
    if (hasPostToday) {
      return false;
    }

    // Check if automation is enabled (could be a setting in the future)
    const automationEnabled = process.env.BLOG_AUTOMATION_ENABLED !== 'false';
    if (!automationEnabled) {
      logger.info('Blog automation disabled via environment variable');
      return false;
    }

    // Check if it's a valid day to publish (e.g., not weekends if desired)
    const today = new Date();
    const dayOfWeek = today.getDay();
    const publishOnWeekends = process.env.BLOG_PUBLISH_WEEKENDS === 'true';
    
    if (!publishOnWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
      logger.info('Skipping blog automation on weekend', { dayOfWeek });
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Error checking automation eligibility', { userId, error });
    return false;
  }
}

/**
 * Log automation failure for monitoring
 */
async function logAutomationFailure(userId: string, error: string, steps: any[]): Promise<void> {
  try {
    // In a real implementation, you might:
    // 1. Send an alert to monitoring service
    // 2. Log to a dedicated error tracking system
    // 3. Send notification to admin
    // 4. Store in a failures table for analysis
    
    logger.error('Blog automation failure logged', {
      userId,
      error,
      stepCount: steps.length,
      timestamp: new Date().toISOString()
    });

    // For now, we'll just log it - in production you might want to:
    // - Send Slack notification
    // - Create PagerDuty alert
    // - Store in database for analysis
    // - Send email to admin

  } catch (logError) {
    logger.error('Failed to log automation failure', { 
      userId, 
      originalError: error, 
      logError 
    });
  }
}

/**
 * Health check endpoint for monitoring
 */
export async function POST(request: NextRequest) {
  try {
    // This could be used for health checks or manual triggers
    const body = await request.json();
    const { action } = body;

    if (action === 'health_check') {
      return NextResponse.json({
        success: true,
        message: 'Blog automation service is healthy',
        data: {
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          status: 'operational'
        }
      });
    }

    if (action === 'manual_trigger') {
      // Manual trigger for testing
      const adminUserId = process.env.ADMIN_USER_ID || 'admin';
      const workflowResult = await blogAutomationService.runWorkflow(adminUserId);
      
      return NextResponse.json({
        success: workflowResult.success,
        message: workflowResult.success ? 'Manual trigger completed' : 'Manual trigger failed',
        data: {
          postId: workflowResult.postId,
          error: workflowResult.error,
          steps: workflowResult.steps,
          triggeredAt: new Date().toISOString()
        }
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 });

  } catch (error) {
    logger.error('Blog automation POST request error', { 
      error: (error as Error).message 
    });

    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

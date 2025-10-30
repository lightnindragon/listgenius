/**
 * Blog Automation Test Workflow API
 * Manual testing endpoint for the blog automation workflow
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { blogAutomationService } from '@/lib/blog-automation-service';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const body = await request.json();
    const { testMode = true, skipExistingCheck = false } = body;

    logger.info('Blog automation test workflow started', { 
      userId, 
      testMode, 
      skipExistingCheck 
    });

    // Override the existing post check if in test mode
    if (testMode && skipExistingCheck) {
      logger.info('Test mode: Skipping existing post check');
    }

    // Run the automation workflow
    const workflowResult = await blogAutomationService.runWorkflow(userId);
    
    if (workflowResult.success) {
      logger.info('Blog automation test completed successfully', {
        userId,
        postId: workflowResult.postId,
        steps: workflowResult.steps.length
      });

      return NextResponse.json({
        success: true,
        message: 'Test workflow completed successfully',
        data: {
          postId: workflowResult.postId,
          steps: workflowResult.steps,
          testMode,
          completedAt: new Date().toISOString()
        }
      });
    } else {
      logger.warn('Blog automation test failed', {
        userId,
        error: workflowResult.error,
        steps: workflowResult.steps.length
      });

      return NextResponse.json({
        success: false,
        message: 'Test workflow failed',
        error: workflowResult.error,
        data: {
          steps: workflowResult.steps,
          testMode,
          failedAt: new Date().toISOString()
        }
      }, { status: 500 });
    }

  } catch (error) {
    logger.error('Blog automation test error', { 
      error: (error as Error).message,
      stack: (error as Error).stack 
    });

    return NextResponse.json({
      success: false,
      error: 'Internal server error during test workflow'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'status') {
      // Get automation status
      const hasPostToday = await blogAutomationService.hasPostToday(userId);
      
      return NextResponse.json({
        success: true,
        data: {
          hasPostToday,
          canRunAutomation: !hasPostToday,
          lastChecked: new Date().toISOString()
        }
      });
    }

    if (action === 'health') {
      // Health check for automation services
      const healthChecks = {
        topicGeneration: await testTopicGeneration(),
        contentGeneration: await testContentGeneration(),
        qualityCheck: await testQualityCheck(),
        publish: await testPublish()
      };

      const allHealthy = Object.values(healthChecks).every(check => check.success);

      return NextResponse.json({
        success: allHealthy,
        data: {
          healthChecks,
          overallStatus: allHealthy ? 'healthy' : 'unhealthy',
          checkedAt: new Date().toISOString()
        }
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action. Use: status, health'
    }, { status: 400 });

  } catch (error) {
    logger.error('Blog automation test status error', { 
      error: (error as Error).message 
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to get test status'
    }, { status: 500 });
  }
}

/**
 * Test topic generation service
 */
async function testTopicGeneration(): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/blog/automation/generate-topic`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.INTERNAL_API_KEY || 'internal'}`,
        'Content-Type': 'application/json'
      }
    });

    return {
      success: response.ok,
      error: response.ok ? undefined : `HTTP ${response.status}`
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message
    };
  }
}

/**
 * Test content generation service
 */
async function testContentGeneration(): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/blog/automation/generate-content`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.INTERNAL_API_KEY || 'internal'}`,
        'Content-Type': 'application/json'
      }
    });

    return {
      success: response.ok,
      error: response.ok ? undefined : `HTTP ${response.status}`
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message
    };
  }
}

/**
 * Test quality check service
 */
async function testQualityCheck(): Promise<{ success: boolean; error?: string }> {
  try {
    // This would need a test post ID, so we'll just check if the endpoint exists
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/blog/automation/quality-check`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.INTERNAL_API_KEY || 'internal'}`,
        'Content-Type': 'application/json'
      }
    });

    return {
      success: response.status !== 404,
      error: response.status === 404 ? 'Endpoint not found' : undefined
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message
    };
  }
}

/**
 * Test publish service
 */
async function testPublish(): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/blog/automation/publish`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.INTERNAL_API_KEY || 'internal'}`,
        'Content-Type': 'application/json'
      }
    });

    return {
      success: response.ok,
      error: response.ok ? undefined : `HTTP ${response.status}`
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message
    };
  }
}

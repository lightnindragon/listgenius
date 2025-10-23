import { auth, createClerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PLAN_CONFIG, getUserPlanSimple } from '@/lib/entitlements';
import { randomUUID } from 'crypto';

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

export async function GET() {
  try {
    console.log('GET /api/saved - Starting fetch process');
    
    const { userId } = await auth();
    if (!userId) {
      console.log('GET /api/saved - No user ID found');
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('GET /api/saved - User ID:', userId);
    console.log('GET /api/saved - Attempting to query database...');
    
    // Use raw SQL to work around Prisma client schema issue
    const generations = await prisma.$queryRaw`
      SELECT id, "userId", title, description, tags, materials, tone, "wordCount", "createdAt"
      FROM "SavedGeneration"
      WHERE "userId" = ${userId}
      ORDER BY "createdAt" DESC
      LIMIT 100
    `;
    
    console.log('GET /api/saved - Successfully fetched generations:', Array.isArray(generations) ? generations.length : 1);
    return NextResponse.json({ success: true, data: generations });
  } catch (error) {
    console.error('GET /api/saved - Error fetching saved generations:', error);
    console.error('GET /api/saved - Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch saved generations', 
        details: error instanceof Error ? error.message : 'Unknown error',
        errorName: error instanceof Error ? error.name : 'Unknown'
      }, 
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    console.log('POST /api/saved - Starting save process');
    
    const { userId } = await auth();
    if (!userId) {
      console.log('POST /api/saved - No user ID found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('POST /api/saved - User ID:', userId);
    
    const user = await clerkClient.users.getUser(userId);
    const plan = await getUserPlanSimple(user);
    
    console.log('POST /api/saved - User plan:', plan);
    
    if (!PLAN_CONFIG[plan].canSaveGenerations) {
      console.log('POST /api/saved - User does not have save permissions');
      return NextResponse.json({ 
        error: 'Saving generations is not available for your current plan.' 
      }, { status: 402 });
    }
    
    const body = await req.json();
    console.log('POST /api/saved - Request body received:', body);
    
    // Ensure tags and materials are arrays
    const tags = Array.isArray(body.tags) ? body.tags : [];
    const materials = Array.isArray(body.materials) ? body.materials : [];
    
    console.log('POST /api/saved - Processing data:', {
      userId,
      title: body.title,
      description: body.description,
      tags: tags,
      materials: materials,
      tone: body.tone,
      wordCount: body.wordCount
    });
    
    console.log('POST /api/saved - Attempting to save to database...');
    
    // Use raw SQL to work around Prisma client schema issue
    const result = await prisma.$queryRaw`
      INSERT INTO "SavedGeneration" (id, "userId", title, description, tags, materials, tone, "wordCount")
      VALUES (${randomUUID()}, ${userId}, ${body.title}, ${body.description}, ${JSON.stringify(tags)}::jsonb, ${JSON.stringify(materials)}::jsonb, ${body.tone || null}, ${body.wordCount || null})
      RETURNING id, "userId", title, description, tags, materials, tone, "wordCount", "createdAt"
    `;
    
    const saved = Array.isArray(result) ? result[0] : result;
    console.log('POST /api/saved - Successfully saved generation:', saved);
    return NextResponse.json({ success: true, data: saved });
  } catch (error) {
    console.error('POST /api/saved - Error saving generation:', error);
    console.error('POST /api/saved - Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to save generation', 
        details: error instanceof Error ? error.message : 'Unknown error',
        errorName: error instanceof Error ? error.name : 'Unknown'
      },
      { status: 500 }
    );
  }
}

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const { id } = await params;
    const body = await req.json();
    
    // Ensure tags and materials are arrays
    const tags = Array.isArray(body.tags) ? body.tags : [];
    const materials = Array.isArray(body.materials) ? body.materials : [];
    
    // Use raw SQL to work around Prisma client schema issue
    const result = await prisma.$queryRaw`
      UPDATE "SavedGeneration" 
      SET 
        title = ${body.title},
        description = ${body.description},
        tags = ${JSON.stringify(tags)}::jsonb,
        materials = ${JSON.stringify(materials)}::jsonb,
        tone = ${body.tone || null},
        "wordCount" = ${body.wordCount || null}
      WHERE id = ${id} AND "userId" = ${userId}
      RETURNING id, "userId", title, description, tags, materials, tone, "wordCount", "createdAt"
    ` as any[];
    
    if (!Array.isArray(result) || result.length === 0) {
      return NextResponse.json({ error: 'Generation not found or unauthorized' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('Error updating generation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update generation', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const { id } = await params;
    await prisma.savedGeneration.deleteMany({
      where: { id, userId } // ensure user owns it
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting generation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete generation', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
}

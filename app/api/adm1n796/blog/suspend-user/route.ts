import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/admin';

export async function POST(req: NextRequest) {
  try {
    // Check admin authentication
    if (!isAdminAuthenticated(req)) {
      return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { email } = body;
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    // In a real application, you would create a SuspendedUser table
    // For now, we'll just return success
    // You could store suspended users in a database table like:
    // await prisma.suspendedUser.create({
    //   data: {
    //     email,
    //     suspendedAt: new Date(),
    //     suspendedBy: 'admin'
    //   }
    // });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error suspending user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to suspend user' },
      { status: 500 }
    );
  }
}

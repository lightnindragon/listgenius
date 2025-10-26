import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const { payoutEmail } = await req.json();
    
    if (!payoutEmail || typeof payoutEmail !== 'string') {
      return NextResponse.json(
        { error: 'Valid email required' }, 
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(payoutEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' }, 
        { status: 400 }
      );
    }

    // Update affiliate payout email
    await prisma.affiliate.update({
      where: { userId },
      data: { payoutEmail },
    });

    logger.info('Payout email updated', { userId, payoutEmail });

    return NextResponse.json({ success: true });
    
  } catch (error) {
    logger.error('Failed to update payout email', { error });
    
    return NextResponse.json(
      { error: 'Update failed' },
      { status: 500 }
    );
  }
}

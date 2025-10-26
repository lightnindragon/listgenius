import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashVal } from '@/lib/affiliate';
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
  try {
    const { affiliateCode } = await req.json();
    
    if (!affiliateCode || typeof affiliateCode !== 'string') {
      return NextResponse.json({ success: true }); // Silent fail
    }

    // Verify affiliate exists
    const affiliate = await prisma.affiliate.findUnique({
      where: { code: affiliateCode }
    });

    if (!affiliate) {
      return NextResponse.json({ success: true }); // Silent fail
    }

    // Get IP and User-Agent for hashing
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : '0.0.0.0';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Hash for privacy
    const ipHash = hashVal(ip);
    const uaHash = hashVal(userAgent);

    // Create click record
    await prisma.refClick.create({
      data: {
        affiliateCode,
        ipHash,
        uaHash,
      },
    });

    logger.info('Affiliate click recorded', { 
      affiliateCode,
      ipHash: ipHash.substring(0, 8) + '...', // Log partial hash for debugging
    });

    return NextResponse.json({ success: true });
    
  } catch (error) {
    logger.error('Failed to record affiliate click', { error });
    
    // Always return success to not break user experience
    return NextResponse.json({ success: true });
  }
}

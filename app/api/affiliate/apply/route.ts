import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { sendAffiliateApplicationNotification, sendAffiliateApplicationReceivedEmail, type AffiliateApplicationData } from '@/lib/email';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      logger.warn('Unauthorized affiliate application attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      address,
      advertisingPlans,
      website,
      socialMedia,
      customSlug,
      termsAccepted,
    } = await req.json();

    // Validate required fields
    const requiredFields = { firstName, lastName, email, phoneNumber, address, advertisingPlans };
    for (const [field, value] of Object.entries(requiredFields)) {
      if (!value || value.trim() === '') {
        return NextResponse.json({ 
          error: `${field} is required` 
        }, { status: 400 });
      }
    }

    if (!termsAccepted) {
      return NextResponse.json({ 
        error: 'You must accept the terms and conditions' 
      }, { status: 400 });
    }

    // Validate custom slug if provided
    if (customSlug && customSlug.trim() !== '') {
      const slug = customSlug.trim().toLowerCase();
      
      // Check slug format (only letters, numbers, and hyphens)
      if (!/^[a-z0-9-]+$/.test(slug)) {
        return NextResponse.json({ 
          error: 'Custom slug can only contain letters, numbers, and hyphens' 
        }, { status: 400 });
      }
      
      // Check minimum length
      if (slug.length < 3) {
        return NextResponse.json({ 
          error: 'Custom slug must be at least 3 characters long' 
        }, { status: 400 });
      }
      
      // Check maximum length
      if (slug.length > 50) {
        return NextResponse.json({ 
          error: 'Custom slug must be 50 characters or less' 
        }, { status: 400 });
      }
      
      // Check if slug is already taken
      const existingSlug = await prisma.affiliate.findUnique({
        where: { customSlug: slug },
      });
      
      if (existingSlug) {
        return NextResponse.json({ 
          error: 'This custom slug is already taken. Please choose a different one.' 
        }, { status: 400 });
      }
    }

    // Check if user already has an affiliate application
    const existing = await prisma.affiliate.findUnique({
      where: { userId },
    });

    if (existing) {
      logger.info('User attempted duplicate affiliate application', { userId, existingStatus: existing.status });
      return NextResponse.json({ 
        error: 'You already have an affiliate application',
        status: existing.status 
      }, { status: 400 });
    }

    // Generate unique affiliate code
    const code = crypto.randomBytes(6).toString('base64url');

    // Create comprehensive affiliate application
    const affiliate = await prisma.affiliate.create({
      data: {
        userId,
        code,
        status: 'PENDING',
        
        // User details
        userName: `${firstName} ${lastName}`,
        userEmail: email,
        
        // Comprehensive application data
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim(),
        address: address.trim(),
        advertisingPlans: advertisingPlans.trim(),
        website: website?.trim() || null,
        socialMedia: socialMedia?.trim() || null,
        customSlug: customSlug?.trim() || null,
        termsAccepted: true,
        
        // Store advertising plans as application note for now
        applicationNote: `Advertising Plans: ${advertisingPlans.trim()}${website ? `\nWebsite: ${website.trim()}` : ''}${socialMedia ? `\nSocial Media: ${socialMedia.trim()}` : ''}`,
      },
    });

    logger.info('New affiliate application submitted', {
      userId,
      affiliateId: affiliate.id,
      code: affiliate.code,
      email,
      hasWebsite: !!website,
      hasSocialMedia: !!socialMedia,
    });

    // Send email notifications
    try {
      // Send confirmation email to the applicant
      await sendAffiliateApplicationReceivedEmail(email, `${firstName} ${lastName}`);
      
      // Send notification email to admin
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@listgenius.expert';
      const applicationData: AffiliateApplicationData = {
        affiliateName: `${firstName} ${lastName}`,
        affiliateEmail: email,
        firstName: firstName,
        lastName: lastName,
        phoneNumber: phoneNumber,
        address: address,
        advertisingPlans: advertisingPlans,
        website: website,
        socialMedia: socialMedia,
        applicationNote: affiliate.applicationNote || undefined,
      };
      await sendAffiliateApplicationNotification(adminEmail, applicationData);
      
      logger.info('Affiliate application emails sent', {
        userId,
        applicantEmail: email,
        adminEmail,
      });
    } catch (emailError) {
      // Don't fail the application if email fails
      logger.error('Failed to send affiliate application emails', {
        error: emailError,
        userId,
        email,
      });
    }

    return NextResponse.json({ 
      success: true, 
      affiliate: {
        id: affiliate.id,
        status: affiliate.status,
        code: affiliate.code,
      }
    });

  } catch (error) {
    logger.error('Affiliate application error', { 
      userId: (await auth()).userId, 
      error: (error as Error).message 
    });
    return NextResponse.json(
      { error: 'Failed to submit application' },
      { status: 500 }
    );
  }
}

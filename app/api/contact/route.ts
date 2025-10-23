import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { sendContactFormEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    const body = await req.json();
    
    const { name, email, subject, message } = body;
    
    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }
    
    // Send email using the email service
    const emailSent = await sendContactFormEmail({
      name,
      email,
      subject,
      message,
      userId: userId || undefined
    });
    
    if (!emailSent) {
      // Log the submission even if email fails
      console.log('Contact form submission (email failed):', {
        name,
        email,
        subject,
        message,
        userId,
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json(
        { success: false, error: 'Failed to send email. Please try again or contact us directly at support@listgenius.expert.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Thank you for your message! We\'ll get back to you soon.'
    });
    
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send message. Please try again.' },
      { status: 500 }
    );
  }
}

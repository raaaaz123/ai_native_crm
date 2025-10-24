import { NextRequest, NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/app/lib/sendpulse-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name } = body;

    if (!email || !name) {
      return NextResponse.json(
        { success: false, error: 'Email and name are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    console.log('📧 Sending welcome email to:', email);

    // Send welcome email via Mailchimp
    const result = await sendWelcomeEmail(email, name);

    if (result.success) {
      console.log('✅ Welcome email sent successfully to:', email);
      return NextResponse.json({
        success: true,
        message: 'Welcome email sent successfully'
      });
    } else {
      console.error('❌ Failed to send welcome email:', result.error);
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Error in welcome email API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}


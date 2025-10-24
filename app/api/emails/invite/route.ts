import { NextRequest, NextResponse } from 'next/server';
import { sendSendPulseEmail, generateInviteEmail } from '@/app/lib/sendpulse-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, companyName, inviterName, inviteToken, role } = body;

    if (!email || !companyName || !inviterName || !inviteToken) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
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

    console.log('📧 Sending invite email to:', email);

    // Generate invite link
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${inviteToken}`;

    // Generate email template
    const template = generateInviteEmail(inviterName, companyName, inviteLink, role || 'member');

    // Send email via SendPulse
    const result = await sendSendPulseEmail(
      { email, name: email },
      template,
      { email: 'support@rexahire.com', name: `${inviterName} via Rexa AI` }
    );

    if (result.success) {
      console.log('✅ Invite email sent successfully to:', email);
      return NextResponse.json({
        success: true,
        message: 'Invite email sent successfully',
        messageId: result.messageId
      });
    } else {
      console.error('❌ Failed to send invite email:', result.error);
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Error in invite email API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}


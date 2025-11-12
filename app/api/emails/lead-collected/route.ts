import { NextRequest, NextResponse } from 'next/server';
import { sendSendPulseEmail, generateLeadCollectedEmail } from '@/app/lib/sendpulse-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, userName, leadName, leadEmail, leadData, agentId, workspaceId } = body;

    if (!email || !userName || !leadName || !leadEmail) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || !emailRegex.test(leadEmail)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    console.log('📧 Sending lead collected email to:', email);

    // Generate dashboard link
    const dashboardLink = agentId && workspaceId
      ? `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/${workspaceId}/agents/${agentId}/contacts`
      : undefined;

    // Generate email template
    const template = generateLeadCollectedEmail(
      userName,
      leadName,
      leadEmail,
      leadData,
      dashboardLink
    );

    // Send email via SendPulse
    const result = await sendSendPulseEmail(
      { email, name: userName },
      template,
      { email: 'support@ragzy.ai', name: 'Ragzy Team' }
    );

    if (result.success) {
      console.log('✅ Lead collected email sent to:', email);
      return NextResponse.json({
        success: true,
        message: 'Lead collected email sent successfully',
        messageId: result.messageId
      });
    } else {
      console.error('❌ Failed to send lead collected email:', result.error);
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Error in lead collected email API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}


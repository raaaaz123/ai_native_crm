import { NextRequest, NextResponse } from 'next/server';
import { sendSendPulseEmail, generateAgentDeployedEmail } from '@/app/lib/sendpulse-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, userName, agentName, agentId, workspaceId } = body;

    if (!email || !userName || !agentName || !agentId || !workspaceId) {
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

    console.log('📧 Sending agent deployed email to:', email);

    // Generate dashboard link
    const dashboardLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/${workspaceId}/agents/${agentId}`;

    // Generate email template
    const template = generateAgentDeployedEmail(
      userName,
      agentName,
      agentId,
      workspaceId,
      dashboardLink
    );

    // Send email via SendPulse
    const result = await sendSendPulseEmail(
      { email, name: userName },
      template,
      { email: 'support@ragzy.ai', name: 'Ragzy Team' }
    );

    if (result.success) {
      console.log('✅ Agent deployed email sent to:', email);
      return NextResponse.json({
        success: true,
        message: 'Agent deployed email sent successfully',
        messageId: result.messageId
      });
    } else {
      console.error('❌ Failed to send agent deployed email:', result.error);
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Error in agent deployed email API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { sendSendPulseEmail, generateKnowledgeBaseProcessedEmail } from '@/app/lib/sendpulse-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, userName, articleTitle, articleType, chunksCount, agentId, workspaceId } = body;

    if (!email || !userName || !articleTitle || !articleType) {
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

    console.log('📧 Sending knowledge base processed email to:', email);

    // Generate dashboard link
    const dashboardLink = agentId && workspaceId
      ? `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/${workspaceId}/agents/${agentId}/sources`
      : undefined;

    // Generate email template
    const template = generateKnowledgeBaseProcessedEmail(
      userName,
      articleTitle,
      articleType,
      chunksCount,
      dashboardLink
    );

    // Send email via SendPulse
    const result = await sendSendPulseEmail(
      { email, name: userName },
      template,
      { email: 'support@ragzy.ai', name: 'Ragzy Team' }
    );

    if (result.success) {
      console.log('✅ Knowledge base processed email sent to:', email);
      return NextResponse.json({
        success: true,
        message: 'Knowledge base processed email sent successfully',
        messageId: result.messageId
      });
    } else {
      console.error('❌ Failed to send knowledge base processed email:', result.error);
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Error in knowledge base processed email API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}


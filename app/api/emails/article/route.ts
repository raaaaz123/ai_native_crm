import { NextRequest, NextResponse } from 'next/server';
import { sendSendPulseEmail, generateKnowledgeBaseArticleEmail } from '@/app/lib/sendpulse-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, userName, articleTitle, articleType, widgetName, chunksCount } = body;

    if (!email || !articleTitle || !articleType) {
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

    console.log('📧 Sending knowledge base article notification to:', email);

    // Generate dashboard link
    const dashboardLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/knowledge-base`;

    // Generate email template
    const template = generateKnowledgeBaseArticleEmail(
      articleTitle,
      articleType,
      widgetName,
      chunksCount,
      dashboardLink
    );

    // Send email via SendPulse
    const result = await sendSendPulseEmail(
      { email, name: userName || email },
      template,
      { email: 'support@rexahire.com', name: 'Rexa AI Knowledge Base' }
    );

    if (result.success) {
      console.log('✅ Knowledge base article notification sent to:', email);
      return NextResponse.json({
        success: true,
        message: 'Article notification sent successfully',
        messageId: result.messageId
      });
    } else {
      console.error('❌ Failed to send article notification:', result.error);
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Error in article notification API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}



import { NextRequest, NextResponse } from 'next/server';
import { sendSendPulseEmail, generateNewCustomerMessageEmail, generateBusinessReplyEmail } from '@/app/lib/sendpulse-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      type, // 'customer' or 'business'
      recipientEmail,
      recipientName,
      senderName,
      messageText,
      conversationId,
      widgetName,
      businessName
    } = body;

    if (!type || !recipientEmail || !messageText || !conversationId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    console.log('📧 Sending message notification email:', { type, recipientEmail, conversationId });

    // Generate conversation link
    const conversationLink = type === 'business' 
      ? `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/conversations?conversation=${conversationId}`
      : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/widget/${conversationId}`;

    // Generate appropriate email template based on type
    let template;
    if (type === 'business') {
      // Notification to business about customer message
      template = generateNewCustomerMessageEmail(
        senderName || 'Customer',
        recipientEmail,
        messageText,
        conversationLink,
        widgetName
      );
    } else {
      // Notification to customer about business reply
      template = generateBusinessReplyEmail(
        recipientName || 'Customer',
        businessName || 'Support Team',
        messageText,
        conversationLink
      );
    }

    // Send email via SendPulse
    const result = await sendSendPulseEmail(
      { email: recipientEmail, name: recipientName || recipientEmail },
      template,
      { email: 'support@rexahire.com', name: 'Rexa AI Notifications' }
    );

    if (result.success) {
      console.log('✅ Message notification sent to:', recipientEmail);
      return NextResponse.json({
        success: true,
        message: 'Notification sent successfully',
        messageId: result.messageId
      });
    } else {
      console.error('❌ Failed to send notification:', result.error);
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Error in message notification API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}



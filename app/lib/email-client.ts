/**
 * Email Client - Frontend wrapper for email API calls
 * Provides clean interface for sending emails from components
 */

export interface SendWelcomeEmailParams {
  email: string;
  name: string;
}

export interface EmailResponse {
  success: boolean;
  error?: string;
  messageId?: string;
}

/**
 * Send welcome email to new user
 * Calls Next.js API route which handles Mailchimp integration
 */
export async function sendWelcomeEmailToUser(
  params: SendWelcomeEmailParams
): Promise<EmailResponse> {
  try {
    console.log('📧 Triggering welcome email for:', params.email);

    const response = await fetch('/api/emails/welcome', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: params.email,
        name: params.name
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Welcome email API error:', data);
      return {
        success: false,
        error: data.error || 'Failed to send email'
      };
    }

    console.log('✅ Welcome email sent:', data);
    return {
      success: true,
      messageId: data.messageId
    };

  } catch (error) {
    console.error('❌ Error calling welcome email API:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send welcome email'
    };
  }
}

/**
 * Send team invitation email
 */
export async function sendTeamInviteEmail(params: {
  email: string;
  inviterName: string;
  companyName: string;
  inviteLink: string;
}): Promise<EmailResponse> {
  try {
    const response = await fetch('/api/emails/invite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params)
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send invite email'
    };
  }
}

/**
 * Send knowledge base article notification email
 */
export async function sendArticleNotificationEmail(params: {
  email: string;
  userName?: string;
  articleTitle: string;
  articleType: string;
  widgetName?: string;
  chunksCount?: number;
}): Promise<EmailResponse> {
  try {
    console.log('📧 Triggering article notification email for:', params.email);

    const response = await fetch('/api/emails/article', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Article notification API error:', data);
      return {
        success: false,
        error: data.error || 'Failed to send email'
      };
    }

    console.log('✅ Article notification sent:', data);
    return {
      success: true,
      messageId: data.messageId
    };

  } catch (error) {
    console.error('❌ Error calling article notification API:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send article notification'
    };
  }
}


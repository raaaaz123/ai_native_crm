/**
 * SendPulse Service - Modular email sending utility
 * Handles all SendPulse transactional email operations
 */

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface WelcomeEmailData {
  to: EmailRecipient;
  userName: string;
  userEmail: string;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

// Cache for access token
let accessToken: string | null = null;
let tokenExpiry: number = 0;

/**
 * Get SendPulse access token
 */
async function getAccessToken(): Promise<string> {
  // Return cached token if still valid
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }

  const clientId = process.env.SENDPULSE_CLIENT_ID;
  const clientSecret = process.env.SENDPULSE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('SendPulse credentials not configured');
  }

  try {
    const response = await fetch('https://api.sendpulse.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get access token: ${response.statusText}`);
    }

    const data = await response.json();
    accessToken = data.access_token;
    // Set expiry 5 minutes before actual expiry for safety
    tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;

    console.log('✅ SendPulse access token obtained');
    return accessToken as string;
  } catch (error) {
    console.error('❌ Error getting SendPulse access token:', error);
    throw error;
  }
}

/**
 * Generate welcome email template from founder
 */
export function generateWelcomeEmail(userName: string): EmailTemplate {
  const firstName = userName.split(' ')[0] || userName;
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Ragzy</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">
                Welcome to Ragzy! 🎉
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #1f2937; font-size: 18px; line-height: 1.6;">
                Hi <strong>${firstName}</strong>,
              </p>
              
              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                I'm <strong>James William</strong>, founder of Ragzy, and I wanted to personally welcome you to our platform! 🚀
              </p>
              
              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                You're now part of a growing community of businesses using AI to transform their customer engagement. Here's what you can do with Ragzy:
              </p>
              
              <!-- Features List -->
              <table cellpadding="0" cellspacing="0" style="margin: 20px 0; width: 100%;">
                <tr>
                  <td style="padding: 15px; background-color: #eff6ff; border-radius: 8px; margin-bottom: 10px;">
                    <p style="margin: 0; color: #1e40af; font-size: 15px;">
                      <strong>💬 AI-Powered Chat Widgets</strong><br/>
                      <span style="color: #4b5563; font-size: 14px;">Create smart chat widgets for your website with advanced AI capabilities</span>
                    </p>
                  </td>
                </tr>
                <tr><td style="height: 10px;"></td></tr>
                <tr>
                  <td style="padding: 15px; background-color: #f0fdf4; border-radius: 8px;">
                    <p style="margin: 0; color: #15803d; font-size: 15px;">
                      <strong>📚 Knowledge Base</strong><br/>
                      <span style="color: #4b5563; font-size: 14px;">Upload documents, PDFs, and website content for AI to learn from</span>
                    </p>
                  </td>
                </tr>
                <tr><td style="height: 10px;"></td></tr>
                <tr>
                  <td style="padding: 15px; background-color: #fef3c7; border-radius: 8px;">
                    <p style="margin: 0; color: #92400e; font-size: 15px;">
                      <strong>⭐ Review Forms</strong><br/>
                      <span style="color: #4b5563; font-size: 14px;">Collect and analyze customer feedback and reviews</span>
                    </p>
                  </td>
                </tr>
                <tr><td style="height: 10px;"></td></tr>
                <tr>
                  <td style="padding: 15px; background-color: #fce7f3; border-radius: 8px;">
                    <p style="margin: 0; color: #9f1239; font-size: 15px;">
                      <strong>👥 Team Collaboration</strong><br/>
                      <span style="color: #4b5563; font-size: 14px;">Invite team members and manage customer conversations together</span>
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                <strong>🚀 Ready to get started?</strong> Here's what I recommend:
              </p>
              
              <ol style="margin: 0 0 20px 0; padding-left: 20px; color: #4b5563; font-size: 15px; line-height: 1.8;">
                <li>Create your first chat widget</li>
                <li>Add some knowledge base articles</li>
                <li>Customize your AI assistant settings</li>
                <li>Deploy the widget to your website</li>
              </ol>
              
              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" 
                       style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);">
                      Go to Dashboard →
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                If you have any questions or need help getting started, don't hesitate to reach out. I'm here to help you succeed!
              </p>
              
              <p style="margin: 20px 0 0 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Best regards,<br/>
                <strong style="color: #1f2937; font-size: 18px;">James William</strong><br/>
                <span style="color: #6b7280; font-size: 14px;">Founder, Ragzy</span>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                © ${new Date().getFullYear()} Ragzy. All rights reserved.
              </p>
              <p style="margin: 0; font-size: 12px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/terms" style="color: #3b82f6; text-decoration: none;">Terms</a>
                <span style="color: #d1d5db; margin: 0 8px;">|</span>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/privacy" style="color: #3b82f6; text-decoration: none;">Privacy</a>
                <span style="color: #d1d5db; margin: 0 8px;">|</span>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/settings" style="color: #3b82f6; text-decoration: none;">Settings</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
Hi ${firstName},

I'm James William, founder of Ragzy, and I wanted to personally welcome you to our platform! 🚀

You're now part of a growing community of businesses using AI to transform their customer engagement.

Here's what you can do with Ragzy:

💬 AI-Powered Chat Widgets
Create smart chat widgets for your website with advanced AI capabilities

📚 Knowledge Base
Upload documents, PDFs, and website content for AI to learn from

⭐ Review Forms
Collect and analyze customer feedback and reviews

👥 Team Collaboration
Invite team members and manage customer conversations together

Ready to get started? Here's what I recommend:
1. Create your first chat widget
2. Add some knowledge base articles
3. Customize your AI assistant settings
4. Deploy the widget to your website

Go to your dashboard: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard

If you have any questions or need help getting started, don't hesitate to reach out. I'm here to help you succeed!

Best regards,
James William
Founder, Ragzy

© ${new Date().getFullYear()} Ragzy. All rights reserved.
  `;

  return {
    subject: `Welcome to Ragzy, ${firstName}! 🎉`,
    html,
    text
  };
}

/**
 * Send email via SendPulse API
 */
export async function sendSendPulseEmail(
  to: EmailRecipient,
  template: EmailTemplate,
  from: EmailRecipient = {
    email: 'support@ragzy.ai',
    name: 'Ragzy Team'
  }
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    console.log('📧 Sending email via SendPulse to:', to.email);

    // Get access token
    const token = await getAccessToken();

    // Send email using SendPulse SMTP API
    const payload = {
      email: {
        subject: template.subject,
        from: {
          name: from.name,
          email: from.email
        },
        to: [
          {
            name: to.name || to.email,
            email: to.email
          }
        ],
        html: template.html,
        text: template.text || ''
      }
    };

    console.log('📤 Sending request to SendPulse...');

    const response = await fetch('https://api.sendpulse.com/smtp/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ SendPulse API error:', errorData);
      return {
        success: false,
        error: errorData.message || 'Failed to send email'
      };
    }

    const result = await response.json();
    console.log('✅ SendPulse response:', result);

    return {
      success: true,
      messageId: result.id || 'sent'
    };

  } catch (error) {
    console.error('❌ Error sending SendPulse email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error sending email'
    };
  }
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(
  userEmail: string,
  userName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const template = generateWelcomeEmail(userName);
    
    const result = await sendSendPulseEmail(
      { email: userEmail, name: userName },
      template,
      { email: 'support@ragzy.ai', name: 'Ragzy Team' }
    );

    return result;
  } catch (error) {
    console.error('❌ Error in sendWelcomeEmail:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send welcome email'
    };
  }
}

/**
 * Other reusable email templates
 */
export function generateInviteEmail(inviterName: string, companyName: string, inviteLink: string, role: string = 'Member'): EmailTemplate {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Team Invitation - Ragzy</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1 0%, #3b82f6 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                🎉 You're Invited!
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #1f2937; font-size: 18px; line-height: 1.6;">
                Hello! 👋
              </p>
              
              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                <strong>${inviterName}</strong> has invited you to join <strong>${companyName}</strong> on Ragzy!
              </p>
              
              <!-- Invitation Details Box -->
              <table cellpadding="0" cellspacing="0" style="width: 100%; margin: 25px 0; background-color: #eff6ff; border-radius: 12px; overflow: hidden;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 12px 0; color: #1e40af; font-size: 15px; font-weight: 600;">
                      📋 Invitation Details
                    </p>
                    <div style="margin: 8px 0;">
                      <span style="color: #6b7280; font-size: 14px;">Company:</span>
                      <span style="color: #1f2937; font-size: 14px; font-weight: 600; margin-left: 8px;">${companyName}</span>
                    </div>
                    <div style="margin: 8px 0;">
                      <span style="color: #6b7280; font-size: 14px;">Role:</span>
                      <span style="color: #1f2937; font-size: 14px; font-weight: 600; margin-left: 8px; text-transform: capitalize;">${role}</span>
                    </div>
                    <div style="margin: 8px 0;">
                      <span style="color: #6b7280; font-size: 14px;">Invited by:</span>
                      <span style="color: #1f2937; font-size: 14px; font-weight: 600; margin-left: 8px;">${inviterName}</span>
                    </div>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                By joining, you'll be able to collaborate with your team, manage conversations, and access all the powerful features of Ragzy.
              </p>
              
              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${inviteLink}" 
                       style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6366f1 0%, #3b82f6 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(99, 102, 241, 0.4);">
                      Accept Invitation →
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Alternative Link -->
              <div style="margin: 25px 0; padding: 15px; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
                <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px;">
                  If the button doesn't work, copy and paste this link into your browser:
                </p>
                <p style="margin: 0; color: #3b82f6; font-size: 13px; word-break: break-all;">
                  ${inviteLink}
                </p>
              </div>
              
              <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                ⏰ <strong>Note:</strong> This invitation will expire in 7 days.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                © ${new Date().getFullYear()} Ragzy. All rights reserved.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
You're Invited to Join ${companyName}!

Hello!

${inviterName} has invited you to join ${companyName} on Ragzy!

Invitation Details:
- Company: ${companyName}
- Role: ${role}
- Invited by: ${inviterName}

By joining, you'll be able to collaborate with your team, manage conversations, and access all the powerful features of Ragzy.

Accept your invitation by clicking this link:
${inviteLink}

Note: This invitation will expire in 7 days.

If you didn't expect this invitation, you can safely ignore this email.

© ${new Date().getFullYear()} Ragzy. All rights reserved.
  `;

  return {
    subject: `${inviterName} invited you to join ${companyName} on Ragzy`,
    html,
    text
  };
}

export function generatePasswordResetEmail(resetLink: string): EmailTemplate {
  return {
    subject: 'Reset your Ragzy password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Reset your password</h2>
        <p>You requested to reset your password. Click the button below to create a new password:</p>
        <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">
          Reset Password
        </a>
        <p style="color: #6b7280; font-size: 14px;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
    text: `Reset your password by clicking this link: ${resetLink}`
  };
}

export function generateKnowledgeBaseArticleEmail(
  articleTitle: string,
  articleType: string,
  widgetName?: string,
  chunksCount?: number,
  dashboardLink?: string
): EmailTemplate {
  const typeEmoji = {
    'text': '📝',
    'pdf': '📄',
    'website': '🌐',
    'faq': '❓',
    'notion': '📓',
    'manual': '✍️'
  }[articleType] || '📚';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Knowledge Base Article - Ragzy</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                ${typeEmoji} New Article Added!
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #1f2937; font-size: 18px; line-height: 1.6;">
                Great news! 🎉
              </p>
              
              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                A new article has been successfully added to your knowledge base!
              </p>
              
              <!-- Article Details Box -->
              <table cellpadding="0" cellspacing="0" style="width: 100%; margin: 25px 0; background-color: #ecfdf5; border-radius: 12px; overflow: hidden;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 12px 0; color: #065f46; font-size: 15px; font-weight: 600;">
                      📋 Article Details
                    </p>
                    <div style="margin: 8px 0;">
                      <span style="color: #6b7280; font-size: 14px;">Title:</span>
                      <span style="color: #1f2937; font-size: 14px; font-weight: 600; margin-left: 8px;">${articleTitle}</span>
                    </div>
                    <div style="margin: 8px 0;">
                      <span style="color: #6b7280; font-size: 14px;">Type:</span>
                      <span style="color: #1f2937; font-size: 14px; font-weight: 600; margin-left: 8px; text-transform: capitalize;">${typeEmoji} ${articleType}</span>
                    </div>
                    ${widgetName ? `
                    <div style="margin: 8px 0;">
                      <span style="color: #6b7280; font-size: 14px;">Widget:</span>
                      <span style="color: #1f2937; font-size: 14px; font-weight: 600; margin-left: 8px;">${widgetName}</span>
                    </div>
                    ` : ''}
                    ${chunksCount ? `
                    <div style="margin: 8px 0;">
                      <span style="color: #6b7280; font-size: 14px;">Chunks Created:</span>
                      <span style="color: #1f2937; font-size: 14px; font-weight: 600; margin-left: 8px;">${chunksCount}</span>
                    </div>
                    ` : ''}
                    <div style="margin: 8px 0;">
                      <span style="color: #6b7280; font-size: 14px;">Added:</span>
                      <span style="color: #1f2937; font-size: 14px; font-weight: 600; margin-left: 8px;">${new Date().toLocaleString()}</span>
                    </div>
                  </td>
                </tr>
              </table>
              
              <!-- Features List -->
              <p style="margin: 20px 0 15px 0; color: #4b5563; font-size: 16px; line-height: 1.6; font-weight: 600;">
                What this means:
              </p>
              
              <table cellpadding="0" cellspacing="0" style="width: 100%; margin: 15px 0;">
                <tr>
                  <td style="padding: 12px; background-color: #f0fdf4; border-left: 4px solid #10b981; margin-bottom: 8px;">
                    <p style="margin: 0; color: #065f46; font-size: 14px;">
                      <strong>✅ Article is live</strong> - Your AI assistant can now answer questions using this content
                    </p>
                  </td>
                </tr>
                <tr><td style="height: 8px;"></td></tr>
                <tr>
                  <td style="padding: 12px; background-color: #eff6ff; border-left: 4px solid #3b82f6; margin-bottom: 8px;">
                    <p style="margin: 0; color: #1e40af; font-size: 14px;">
                      <strong>🤖 AI Powered</strong> - The content has been processed and embedded for intelligent search
                    </p>
                  </td>
                </tr>
                <tr><td style="height: 8px;"></td></tr>
                <tr>
                  <td style="padding: 12px; background-color: #fef3c7; border-left: 4px solid #f59e0b;">
                    <p style="margin: 0; color: #92400e; font-size: 14px;">
                      <strong>📊 Track Performance</strong> - Monitor how customers interact with this content
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              ${dashboardLink ? `
              <table cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${dashboardLink}" 
                       style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.4);">
                      View Knowledge Base →
                    </a>
                  </td>
                </tr>
              </table>
              ` : ''}
              
              <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Keep adding more content to make your AI assistant even smarter! 🚀
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                © ${new Date().getFullYear()} Ragzy. All rights reserved.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                You're receiving this because you manage this knowledge base.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
New Knowledge Base Article Added!

Great news! A new article has been successfully added to your knowledge base.

Article Details:
- Title: ${articleTitle}
- Type: ${articleType}
${widgetName ? `- Widget: ${widgetName}` : ''}
${chunksCount ? `- Chunks Created: ${chunksCount}` : ''}
- Added: ${new Date().toLocaleString()}

What this means:
✅ Article is live - Your AI assistant can now answer questions using this content
🤖 AI Powered - The content has been processed and embedded for intelligent search
📊 Track Performance - Monitor how customers interact with this content

${dashboardLink ? `View your knowledge base: ${dashboardLink}` : ''}

Keep adding more content to make your AI assistant even smarter! 🚀

© ${new Date().getFullYear()} Ragzy. All rights reserved.
  `;

  return {
    subject: `New ${articleType} article added: ${articleTitle}`,
    html,
    text
  };
}

/**
 * Generate email for new customer message notification (to business)
 */
export function generateNewCustomerMessageEmail(
  customerName: string,
  customerEmail: string,
  messageText: string,
  conversationLink: string,
  widgetName?: string
): EmailTemplate {
  const preview = messageText.length > 100 ? messageText.substring(0, 100) + '...' : messageText;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Customer Message - Ragzy</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                💬 New Customer Message
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #1f2937; font-size: 18px; line-height: 1.6;">
                You have a new message! 📩
              </p>
              
              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                <strong>${customerName}</strong> sent you a message${widgetName ? ` via ${widgetName}` : ''}.
              </p>
              
              <!-- Customer Details Box -->
              <table cellpadding="0" cellspacing="0" style="width: 100%; margin: 25px 0; background-color: #fef3c7; border-radius: 12px; overflow: hidden;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 12px 0; color: #92400e; font-size: 15px; font-weight: 600;">
                      👤 Customer Details
                    </p>
                    <div style="margin: 8px 0;">
                      <span style="color: #6b7280; font-size: 14px;">Name:</span>
                      <span style="color: #1f2937; font-size: 14px; font-weight: 600; margin-left: 8px;">${customerName}</span>
                    </div>
                    <div style="margin: 8px 0;">
                      <span style="color: #6b7280; font-size: 14px;">Email:</span>
                      <span style="color: #1f2937; font-size: 14px; font-weight: 600; margin-left: 8px;">${customerEmail}</span>
                    </div>
                    ${widgetName ? `
                    <div style="margin: 8px 0;">
                      <span style="color: #6b7280; font-size: 14px;">Widget:</span>
                      <span style="color: #1f2937; font-size: 14px; font-weight: 600; margin-left: 8px;">${widgetName}</span>
                    </div>
                    ` : ''}
                  </td>
                </tr>
              </table>
              
              <!-- Message Preview Box -->
              <table cellpadding="0" cellspacing="0" style="width: 100%; margin: 25px 0; background-color: #f9fafb; border-left: 4px solid #f59e0b; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase;">Message:</p>
                    <p style="margin: 0; color: #1f2937; font-size: 15px; line-height: 1.6; font-style: italic;">
                      "${preview}"
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${conversationLink}" 
                       style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(245, 158, 11, 0.4);">
                      View & Reply →
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                💡 <strong>Tip:</strong> Quick responses improve customer satisfaction!
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                © ${new Date().getFullYear()} Ragzy. All rights reserved.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                You're receiving this because you have an active conversation.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
New Customer Message!

${customerName} sent you a message${widgetName ? ` via ${widgetName}` : ''}.

Customer Details:
- Name: ${customerName}
- Email: ${customerEmail}
${widgetName ? `- Widget: ${widgetName}` : ''}

Message:
"${preview}"

View and reply to this conversation:
${conversationLink}

💡 Tip: Quick responses improve customer satisfaction!

© ${new Date().getFullYear()} Ragzy. All rights reserved.
  `;

  return {
    subject: `New message from ${customerName}`,
    html,
    text
  };
}

/**
 * Generate email for business reply notification (to customer)
 */
export function generateBusinessReplyEmail(
  customerName: string,
  businessName: string,
  messageText: string,
  conversationLink: string
): EmailTemplate {
  const firstName = customerName.split(' ')[0] || customerName;
  const preview = messageText.length > 150 ? messageText.substring(0, 150) + '...' : messageText;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Reply from ${businessName} - Ragzy</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                💬 New Reply from ${businessName}
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #1f2937; font-size: 18px; line-height: 1.6;">
                Hi <strong>${firstName}</strong>! 👋
              </p>
              
              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                <strong>${businessName}</strong> has replied to your message.
              </p>
              
              <!-- Message Preview Box -->
              <table cellpadding="0" cellspacing="0" style="width: 100%; margin: 25px 0; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 8px 0; color: #1e40af; font-size: 12px; font-weight: 600; text-transform: uppercase;">Their Reply:</p>
                    <p style="margin: 0; color: #1f2937; font-size: 15px; line-height: 1.6;">
                      "${preview}"
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${conversationLink}" 
                       style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.4);">
                      View & Reply →
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Click the button above to continue your conversation!
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                © ${new Date().getFullYear()} Ragzy. All rights reserved.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                You're receiving this because you have an active conversation with ${businessName}.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
New Reply from ${businessName}

Hi ${firstName}!

${businessName} has replied to your message.

Their Reply:
"${preview}"

View and continue your conversation:
${conversationLink}

© ${new Date().getFullYear()} Ragzy. All rights reserved.
  `;

  return {
    subject: `${businessName} replied to your message`,
    html,
    text
  };
}

/**
 * Generate email for workspace creation confirmation
 */
export function generateWorkspaceCreatedEmail(
  userName: string,
  workspaceName: string,
  dashboardLink?: string
): EmailTemplate {
  const firstName = userName.split(' ')[0] || userName;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Workspace Created - Ragzy</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                🎉 Workspace Created!
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #1f2937; font-size: 18px; line-height: 1.6;">
                Hi <strong>${firstName}</strong>! 👋
              </p>
              
              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Congratulations! Your workspace <strong>"${workspaceName}"</strong> has been successfully created.
              </p>
              
              <!-- Workspace Details Box -->
              <table cellpadding="0" cellspacing="0" style="width: 100%; margin: 25px 0; background-color: #e3f2fd; border-radius: 12px; overflow: hidden;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 12px 0; color: #1565c0; font-size: 15px; font-weight: 600;">
                      📋 Workspace Details
                    </p>
                    <div style="margin: 8px 0;">
                      <span style="color: #6b7280; font-size: 14px;">Name:</span>
                      <span style="color: #1f2937; font-size: 14px; font-weight: 600; margin-left: 8px;">${workspaceName}</span>
                    </div>
                    <div style="margin: 8px 0;">
                      <span style="color: #6b7280; font-size: 14px;">Created:</span>
                      <span style="color: #1f2937; font-size: 14px; font-weight: 600; margin-left: 8px;">${new Date().toLocaleString()}</span>
                    </div>
                    <div style="margin: 8px 0;">
                      <span style="color: #6b7280; font-size: 14px;">Status:</span>
                      <span style="color: #1f2937; font-size: 14px; font-weight: 600; margin-left: 8px;">Active ✅</span>
                    </div>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                You're all set! Now you can start building AI agents, adding knowledge bases, and engaging with your customers.
              </p>
              
              <!-- CTA Button -->
              ${dashboardLink ? `
              <table cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${dashboardLink}" 
                       style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(33, 150, 243, 0.4);">
                      Go to Dashboard →
                    </a>
                  </td>
                </tr>
              </table>
              ` : ''}
              
              <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Need help getting started? Check out our documentation or reach out to our support team.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                © ${new Date().getFullYear()} Ragzy. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
Workspace Created!

Hi ${firstName}!

Congratulations! Your workspace "${workspaceName}" has been successfully created.

Workspace Details:
- Name: ${workspaceName}
- Created: ${new Date().toLocaleString()}
- Status: Active ✅

You're all set! Now you can start building AI agents, adding knowledge bases, and engaging with your customers.

${dashboardLink ? `Go to your dashboard: ${dashboardLink}` : ''}

Need help getting started? Check out our documentation or reach out to our support team.

© ${new Date().getFullYear()} Ragzy. All rights reserved.
  `;

  return {
    subject: `Your workspace "${workspaceName}" has been created! 🎉`,
    html,
    text
  };
}

/**
 * Generate email for agent deployment success notification
 */
export function generateAgentDeployedEmail(
  userName: string,
  agentName: string,
  agentId: string,
  workspaceId: string,
  dashboardLink?: string
): EmailTemplate {
  const firstName = userName.split(' ')[0] || userName;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Agent Deployed - Ragzy</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                🚀 Agent Deployed Successfully!
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #1f2937; font-size: 18px; line-height: 1.6;">
                Hi <strong>${firstName}</strong>! 👋
              </p>
              
              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Great news! Your AI agent <strong>"${agentName}"</strong> has been successfully deployed and is now live! 🎉
              </p>
              
              <!-- Agent Details Box -->
              <table cellpadding="0" cellspacing="0" style="width: 100%; margin: 25px 0; background-color: #ecfdf5; border-radius: 12px; overflow: hidden;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 12px 0; color: #065f46; font-size: 15px; font-weight: 600;">
                      🤖 Agent Details
                    </p>
                    <div style="margin: 8px 0;">
                      <span style="color: #6b7280; font-size: 14px;">Name:</span>
                      <span style="color: #1f2937; font-size: 14px; font-weight: 600; margin-left: 8px;">${agentName}</span>
                    </div>
                    <div style="margin: 8px 0;">
                      <span style="color: #6b7280; font-size: 14px;">Status:</span>
                      <span style="color: #1f2937; font-size: 14px; font-weight: 600; margin-left: 8px;">Deployed ✅</span>
                    </div>
                    <div style="margin: 8px 0;">
                      <span style="color: #6b7280; font-size: 14px;">Deployed:</span>
                      <span style="color: #1f2937; font-size: 14px; font-weight: 600; margin-left: 8px;">${new Date().toLocaleString()}</span>
                    </div>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Your agent is now ready to handle customer conversations, answer questions, and provide support 24/7!
              </p>
              
              <!-- CTA Button -->
              ${dashboardLink ? `
              <table cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${dashboardLink}" 
                       style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.4);">
                      View Agent →
                    </a>
                  </td>
                </tr>
              </table>
              ` : ''}
              
              <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                💡 <strong>Tip:</strong> Monitor your agent's performance in the analytics dashboard to optimize its responses.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                © ${new Date().getFullYear()} Ragzy. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
Agent Deployed Successfully!

Hi ${firstName}!

Great news! Your AI agent "${agentName}" has been successfully deployed and is now live! 🎉

Agent Details:
- Name: ${agentName}
- Status: Deployed ✅
- Deployed: ${new Date().toLocaleString()}

Your agent is now ready to handle customer conversations, answer questions, and provide support 24/7!

${dashboardLink ? `View your agent: ${dashboardLink}` : ''}

💡 Tip: Monitor your agent's performance in the analytics dashboard to optimize its responses.

© ${new Date().getFullYear()} Ragzy. All rights reserved.
  `;

  return {
    subject: `Your agent "${agentName}" has been deployed! 🚀`,
    html,
    text
  };
}

/**
 * Generate email for knowledge base processing completion
 */
export function generateKnowledgeBaseProcessedEmail(
  userName: string,
  articleTitle: string,
  articleType: string,
  chunksCount?: number,
  dashboardLink?: string
): EmailTemplate {
  const firstName = userName.split(' ')[0] || userName;
  const typeEmoji = {
    'text': '📝',
    'pdf': '📄',
    'website': '🌐',
    'faq': '❓',
    'notion': '📓',
    'google_sheets': '📊',
    'manual': '✍️'
  }[articleType] || '📚';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Knowledge Base Processed - Ragzy</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                ${typeEmoji} Knowledge Base Processed!
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #1f2937; font-size: 18px; line-height: 1.6;">
                Hi <strong>${firstName}</strong>! 👋
              </p>
              
              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Your knowledge base article has been successfully processed and is now ready for your AI agents to use!
              </p>
              
              <!-- Article Details Box -->
              <table cellpadding="0" cellspacing="0" style="width: 100%; margin: 25px 0; background-color: #f3e8ff; border-radius: 12px; overflow: hidden;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 12px 0; color: #6b21a8; font-size: 15px; font-weight: 600;">
                      📋 Article Details
                    </p>
                    <div style="margin: 8px 0;">
                      <span style="color: #6b7280; font-size: 14px;">Title:</span>
                      <span style="color: #1f2937; font-size: 14px; font-weight: 600; margin-left: 8px;">${articleTitle}</span>
                    </div>
                    <div style="margin: 8px 0;">
                      <span style="color: #6b7280; font-size: 14px;">Type:</span>
                      <span style="color: #1f2937; font-size: 14px; font-weight: 600; margin-left: 8px; text-transform: capitalize;">${typeEmoji} ${articleType}</span>
                    </div>
                    ${chunksCount ? `
                    <div style="margin: 8px 0;">
                      <span style="color: #6b7280; font-size: 14px;">Chunks Created:</span>
                      <span style="color: #1f2937; font-size: 14px; font-weight: 600; margin-left: 8px;">${chunksCount}</span>
                    </div>
                    ` : ''}
                    <div style="margin: 8px 0;">
                      <span style="color: #6b7280; font-size: 14px;">Processed:</span>
                      <span style="color: #1f2937; font-size: 14px; font-weight: 600; margin-left: 8px;">${new Date().toLocaleString()}</span>
                    </div>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Your AI agents can now use this content to answer customer questions more accurately and intelligently!
              </p>
              
              <!-- CTA Button -->
              ${dashboardLink ? `
              <table cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${dashboardLink}" 
                       style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(139, 92, 246, 0.4);">
                      View Knowledge Base →
                    </a>
                  </td>
                </tr>
              </table>
              ` : ''}
              
              <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Keep adding more content to make your AI agents even smarter! 🚀
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                © ${new Date().getFullYear()} Ragzy. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
Knowledge Base Processed!

Hi ${firstName}!

Your knowledge base article has been successfully processed and is now ready for your AI agents to use!

Article Details:
- Title: ${articleTitle}
- Type: ${articleType}
${chunksCount ? `- Chunks Created: ${chunksCount}` : ''}
- Processed: ${new Date().toLocaleString()}

Your AI agents can now use this content to answer customer questions more accurately and intelligently!

${dashboardLink ? `View your knowledge base: ${dashboardLink}` : ''}

Keep adding more content to make your AI agents even smarter! 🚀

© ${new Date().getFullYear()} Ragzy. All rights reserved.
  `;

  return {
    subject: `Knowledge base processed: ${articleTitle}`,
    html,
    text
  };
}

/**
 * Generate email for lead collection notification
 */
export function generateLeadCollectedEmail(
  userName: string,
  leadName: string,
  leadEmail: string,
  leadData?: Record<string, unknown>,
  dashboardLink?: string
): EmailTemplate {
  const firstName = userName.split(' ')[0] || userName;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Lead Collected - Ragzy</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                🎯 New Lead Collected!
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #1f2937; font-size: 18px; line-height: 1.6;">
                Hi <strong>${firstName}</strong>! 👋
              </p>
              
              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Great news! You've collected a new lead through your AI agent!
              </p>
              
              <!-- Lead Details Box -->
              <table cellpadding="0" cellspacing="0" style="width: 100%; margin: 25px 0; background-color: #fef3c7; border-radius: 12px; overflow: hidden;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 12px 0; color: #92400e; font-size: 15px; font-weight: 600;">
                      👤 Lead Details
                    </p>
                    <div style="margin: 8px 0;">
                      <span style="color: #6b7280; font-size: 14px;">Name:</span>
                      <span style="color: #1f2937; font-size: 14px; font-weight: 600; margin-left: 8px;">${leadName}</span>
                    </div>
                    <div style="margin: 8px 0;">
                      <span style="color: #6b7280; font-size: 14px;">Email:</span>
                      <span style="color: #1f2937; font-size: 14px; font-weight: 600; margin-left: 8px;">${leadEmail}</span>
                    </div>
                    ${leadData && Object.keys(leadData).length > 0 ? `
                    ${Object.entries(leadData).map(([key, value]) => `
                    <div style="margin: 8px 0;">
                      <span style="color: #6b7280; font-size: 14px;">${key}:</span>
                      <span style="color: #1f2937; font-size: 14px; font-weight: 600; margin-left: 8px;">${String(value)}</span>
                    </div>
                    `).join('')}
                    ` : ''}
                    <div style="margin: 8px 0;">
                      <span style="color: #6b7280; font-size: 14px;">Collected:</span>
                      <span style="color: #1f2937; font-size: 14px; font-weight: 600; margin-left: 8px;">${new Date().toLocaleString()}</span>
                    </div>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                This lead has been automatically saved to your contacts. Follow up with them to convert them into customers!
              </p>
              
              <!-- CTA Button -->
              ${dashboardLink ? `
              <table cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${dashboardLink}" 
                       style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(245, 158, 11, 0.4);">
                      View Contacts →
                    </a>
                  </td>
                </tr>
              </table>
              ` : ''}
              
              <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                💡 <strong>Tip:</strong> Quick follow-ups increase conversion rates. Reach out within 24 hours for best results!
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                © ${new Date().getFullYear()} Ragzy. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
New Lead Collected!

Hi ${firstName}!

Great news! You've collected a new lead through your AI agent!

Lead Details:
- Name: ${leadName}
- Email: ${leadEmail}
${leadData && Object.keys(leadData).length > 0 ? Object.entries(leadData).map(([key, value]) => `- ${key}: ${value}`).join('\n') : ''}
- Collected: ${new Date().toLocaleString()}

This lead has been automatically saved to your contacts. Follow up with them to convert them into customers!

${dashboardLink ? `View your contacts: ${dashboardLink}` : ''}

💡 Tip: Quick follow-ups increase conversion rates. Reach out within 24 hours for best results!

© ${new Date().getFullYear()} Ragzy. All rights reserved.
  `;

  return {
    subject: `New lead collected: ${leadName}`,
    html,
    text
  };
}


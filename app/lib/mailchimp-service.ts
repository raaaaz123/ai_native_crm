/**
 * Mailchimp Service - Modular email sending utility
 * Handles all Mailchimp transactional email operations
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
  <title>Welcome to Rexa AI</title>
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
                Welcome to Rexa AI! 🎉
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
                I'm <strong>James William</strong>, founder of Rexa AI, and I wanted to personally welcome you to our platform! 🚀
              </p>
              
              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                You're now part of a growing community of businesses using AI to transform their customer engagement. Here's what you can do with Rexa:
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
                <span style="color: #6b7280; font-size: 14px;">Founder, Rexa AI</span>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                © ${new Date().getFullYear()} Rexa AI. All rights reserved.
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

I'm James William, founder of Rexa AI, and I wanted to personally welcome you to our platform! 🚀

You're now part of a growing community of businesses using AI to transform their customer engagement.

Here's what you can do with Rexa:

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
Founder, Rexa AI

© ${new Date().getFullYear()} Rexa AI. All rights reserved.
  `;

  return {
    subject: `Welcome to Rexa AI, ${firstName}! 🎉`,
    html,
    text
  };
}

/**
 * Send email via Mailchimp Transactional API
 */
export async function sendMailchimpEmail(
  to: EmailRecipient,
  template: EmailTemplate,
  from: EmailRecipient = {
    email: 'hello@rexa.ai',
    name: 'James William - Rexa AI'
  }
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    const apiKey = process.env.MAILCHIMP_API_KEY;
    
    if (!apiKey) {
      console.error('❌ MAILCHIMP_API_KEY not set in environment variables');
      return {
        success: false,
        error: 'Mailchimp API key not configured'
      };
    }

    // Mailchimp Transactional API endpoint
    const apiUrl = 'https://mandrillapp.com/api/1.0/messages/send';

    const payload = {
      key: apiKey,
      message: {
        from_email: from.email,
        from_name: from.name,
        to: [
          {
            email: to.email,
            name: to.name,
            type: 'to'
          }
        ],
        subject: template.subject,
        html: template.html,
        text: template.text,
        auto_text: true,
        important: true,
        track_opens: true,
        track_clicks: true,
        tags: ['welcome-email', 'new-user'],
        metadata: {
          template: 'welcome',
          sent_at: new Date().toISOString()
        }
      }
    };

    console.log('📧 Sending email via Mailchimp to:', to.email);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Mailchimp API error:', errorData);
      return {
        success: false,
        error: errorData.message || 'Failed to send email'
      };
    }

    const result = await response.json();
    
    // Mandrill returns an array of results
    if (Array.isArray(result) && result.length > 0) {
      const emailResult = result[0];
      
      if (emailResult.status === 'sent' || emailResult.status === 'queued') {
        console.log('✅ Welcome email sent successfully:', emailResult);
        return {
          success: true,
          messageId: emailResult._id
        };
      } else {
        console.error('❌ Email sending failed:', emailResult);
        return {
          success: false,
          error: emailResult.reject_reason || 'Email was rejected'
        };
      }
    }

    return {
      success: false,
      error: 'Invalid response from Mailchimp'
    };

  } catch (error) {
    console.error('❌ Error sending Mailchimp email:', error);
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
    
    const result = await sendMailchimpEmail(
      { email: userEmail, name: userName },
      template,
      { email: 'james@rexa.ai', name: 'James William' }
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
export function generateInviteEmail(inviterName: string, companyName: string, inviteLink: string): EmailTemplate {
  return {
    subject: `${inviterName} invited you to join ${companyName} on Rexa AI`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>You've been invited!</h2>
        <p>${inviterName} has invited you to join <strong>${companyName}</strong> on Rexa AI.</p>
        <a href="${inviteLink}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">
          Accept Invitation
        </a>
        <p style="color: #6b7280; font-size: 14px;">
          If the button doesn't work, copy and paste this link into your browser:<br/>
          ${inviteLink}
        </p>
      </div>
    `,
    text: `${inviterName} has invited you to join ${companyName} on Rexa AI. Click here to accept: ${inviteLink}`
  };
}

export function generatePasswordResetEmail(resetLink: string): EmailTemplate {
  return {
    subject: 'Reset your Rexa AI password',
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


// Email utility functions for sending invitations
// This is a placeholder for email functionality
// In a real implementation, you would integrate with an email service like SendGrid, AWS SES, etc.

export interface InvitationEmailData {
  to: string;
  companyName: string;
  inviterName: string;
  inviteToken: string;
  role: string;
  permissions: string[];
}

export async function sendInvitationEmail(data: InvitationEmailData): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('📧 [Email] Sending invitation email to:', data.to);
    console.log('📧 [Email] Email data:', {
      company: data.companyName,
      inviter: data.inviterName,
      role: data.role
    });

    // Call the invite email API endpoint
    const response = await fetch('/api/emails/invite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: data.to,
        companyName: data.companyName,
        inviterName: data.inviterName,
        inviteToken: data.inviteToken,
        role: data.role
      })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      console.error('❌ [Email] Failed to send invitation email:', result.error);
      return { 
        success: false, 
        error: result.error || 'Failed to send invitation email' 
      };
    }

    console.log('✅ [Email] Invitation email sent successfully to:', data.to);
    return { success: true };
  } catch (error) {
    console.error('❌ [Email] Error sending invitation email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send invitation email' 
    };
  }
}

export function generateInvitationEmailTemplate(data: InvitationEmailData): string {
  const invitationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${data.inviteToken}`;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>You're invited to join ${data.companyName}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">You're invited to join ${data.companyName}</h2>
        
        <p>Hello!</p>
        
        <p><strong>${data.inviterName}</strong> has invited you to join <strong>${data.companyName}</strong> as a <strong>${data.role}</strong>.</p>
        
        <p>Your permissions will include:</p>
        <ul>
          ${data.permissions.map(permission => `<li>${permission}</li>`).join('')}
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${invitationLink}" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Accept Invitation
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          This invitation will expire in 7 days. If you don't have an account, you'll be prompted to create one.
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #666; font-size: 12px;">
          If you didn't expect this invitation, you can safely ignore this email.
        </p>
      </div>
    </body>
    </html>
  `;
}

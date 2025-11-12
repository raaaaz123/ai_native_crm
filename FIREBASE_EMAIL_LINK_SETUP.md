# Firebase Email Link Authentication Setup Guide

## Problem
Users are not receiving email sign-in links after signing up.

## Solution: Configure Firebase Email Link Authentication

Follow these steps **exactly** in your Firebase Console:

### Step 1: Enable Email Link Sign-In

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click on **Authentication** in the left sidebar
4. Click on the **Sign-in method** tab
5. Find **Email/Password** in the list
6. Click on it to expand
7. **Enable** the Email/Password provider if not already enabled
8. **IMPORTANT**: Enable **"Email link (passwordless sign-in)"** toggle
9. Click **Save**

### Step 2: Configure Authorized Domains

1. Still in **Authentication** > **Settings** tab
2. Scroll to **Authorized domains** section
3. Make sure these domains are listed:
   - `localhost` (for local development)
   - Your production domain (e.g., `ai-native-crm.vercel.app`)
   - `vercel.app` (if using Vercel)
4. If missing, click **Add domain** and add them

### Step 3: Configure Email Templates

1. In Firebase Console, go to **Authentication** > **Templates**
2. Find **Email link sign in** (or **Passwordless sign-in**)
3. Click the edit icon (pencil)
4. Configure the template:
   ```
   Subject: Sign in to Rexa Engage

   Body:
   Hello,

   Follow this link to sign in to your Rexa Engage account:
   %LINK%

   If you didn't request this link, you can safely ignore this email.

   Thanks,
   The Rexa Engage Team
   ```
5. **IMPORTANT**: Set the **Action URL** to match your callback URL:
   - For local: `http://localhost:3000/auth/callback`
   - For production: `https://your-domain.com/auth/callback`
6. Click **Save**

### Step 4: Verify Email Sender

1. Go to **Authentication** > **Settings** > **Email** section
2. Make sure "From" email is set (e.g., `noreply@your-domain.com`)
3. If you have a custom domain:
   - Configure **Custom SMTP** with your email provider
   - Or use **SendGrid**, **Mailgun**, or **AWS SES** for better deliverability

### Step 5: Test the Setup

1. Go to your local signup page: `http://localhost:3000/signup`
2. Enter your email and click "Create account"
3. Check your email inbox (and spam folder)
4. Click the link in the email
5. You should be redirected to `/auth/callback` and signed in

## Common Issues & Solutions

### Issue 1: Email not received
**Solutions:**
- Check spam/junk folder
- Wait 5-10 minutes (Firebase can be slow)
- Verify Email Link Sign-in is enabled (Step 1)
- Check authorized domains include your domain (Step 2)
- Verify email sender is configured (Step 4)

### Issue 2: "Invalid action code" error
**Solutions:**
- The action URL in email template doesn't match your callback URL
- Update email template with correct Action URL (Step 3)
- Make sure you're using the same domain (localhost vs production)

### Issue 3: "Unauthorized domain" error
**Solutions:**
- Add your domain to authorized domains list (Step 2)
- Wait a few minutes after adding domain
- Clear browser cache and try again

### Issue 4: Email goes to spam
**Solutions:**
- Configure custom SMTP with proper SPF/DKIM records
- Use a professional email service (SendGrid, Mailgun)
- Verify sender email domain matches your app domain

## Better Email Deliverability (Production)

For production, consider using a dedicated email service:

### Option 1: SendGrid (Recommended)
1. Create SendGrid account
2. Get API key
3. Configure in Firebase: Authentication > Templates > SMTP settings
4. Add SPF and DKIM records to your domain DNS

### Option 2: Resend (Modern alternative)
1. Create Resend account at https://resend.com
2. Get API key
3. Use custom backend email sending (see below)

### Custom Email Implementation (Alternative)
If Firebase emails aren't working, you can use a custom backend:

```typescript
// backend/app/routers/auth_router.py
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

async def send_signup_link(email: string, link: str):
    message = Mail(
        from_email='noreply@yourdomain.com',
        to_emails=email,
        subject='Sign in to Rexa Engage',
        html_content=f'''
        <h2>Welcome to Rexa Engage!</h2>
        <p>Click the button below to complete your sign-up:</p>
        <a href="{link}" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Complete Sign Up
        </a>
        <p>Or copy this link: {link}</p>
        '''
    )
    sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
    response = sg.send(message)
    return response.status_code == 202
```

## Debugging Tips

### Check Browser Console
Open DevTools Console and look for logs:
```
📧 [Email Link] Sending sign-in link to: user@example.com
🔗 [Email Link] Callback URL: http://localhost:3000/auth/callback
⚙️ [Email Link] Action code settings: {...}
✅ [Email Link] Sign-in link sent successfully
```

If you see an error, it will show:
```
❌ [Email Link] Error sending sign-in link: [error details]
```

### Check Firebase Console Logs
1. Go to Firebase Console
2. Click **Authentication** > **Usage** tab
3. Check if sign-in attempts are being logged
4. If nothing appears, Firebase isn't receiving the request

### Test with Firebase CLI
```bash
firebase auth:export users.json --project your-project-id
```
This verifies your Firebase connection works.

## Current Implementation Status

✅ **Code**: Properly implemented
- Email is saved to localStorage
- Callback page handles email links correctly
- Error handling in place

❌ **Firebase Console**: Needs configuration
- Follow Steps 1-5 above to complete setup

## Need Help?

If issues persist after following this guide:
1. Check Firebase Console > Usage for error logs
2. Verify all 5 steps above are completed
3. Try with a different email provider (Gmail, Outlook)
4. Consider using custom email implementation

## Quick Fix Checklist

- [ ] Email Link Sign-in enabled in Firebase Console
- [ ] Email/Password provider enabled
- [ ] `localhost` added to authorized domains
- [ ] Production domain added to authorized domains
- [ ] Email template configured with correct action URL
- [ ] Email sender configured
- [ ] Tested on localhost
- [ ] Tested in production
- [ ] Checked spam folder
- [ ] Waited at least 5 minutes for email

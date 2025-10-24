# Email Setup Guide - Mailchimp Integration

## Overview
This project uses **Mailchimp Transactional API (Mandrill)** to send automated emails to users.

## Features
- ✅ Welcome emails from founder James William
- ✅ Modular, reusable email service
- ✅ Template-based email generation
- ✅ Async, non-blocking email sending
- ✅ Comprehensive error handling

## Setup Instructions

### 1. Get Mailchimp API Key

1. Go to [Mailchimp Transactional](https://mandrillapp.com/)
2. Sign up or log in to your account
3. Navigate to **Settings → API Keys**
4. Generate a new API key
5. Copy the API key (starts with `md-` or similar)

### 2. Configure Environment Variables

Add the following to your `.env.local` file:

```env
# Mailchimp Configuration
MAILCHIMP_API_KEY=your_mailchimp_api_key_here

# App URL (for email links)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

For production, update `.env.production`:

```env
MAILCHIMP_API_KEY=your_production_mailchimp_api_key
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 3. Email Templates

#### Welcome Email
Sent automatically when:
- New user signs up via email
- New user signs up via Google

**From:** James William (james@rexa.ai)  
**Subject:** Welcome to Rexa AI, [FirstName]! 🎉

Features:
- Personalized greeting with user's first name
- Introduction from founder
- Feature highlights with icons
- Getting started checklist
- CTA button to dashboard
- Beautiful responsive HTML design

## Architecture

### File Structure
```
app/
├── lib/
│   ├── mailchimp-service.ts    # Core Mailchimp logic
│   └── email-client.ts          # Frontend API wrapper
├── api/
│   └── emails/
│       └── welcome/
│           └── route.ts         # Welcome email endpoint
└── lib/
    └── auth-context.tsx         # Triggers welcome emails
```

### Data Flow

```
User Signs Up
    ↓
Firestore User Created
    ↓
Trigger Welcome Email (async)
    ↓
Call /api/emails/welcome
    ↓
email-client.ts
    ↓
API Route (route.ts)
    ↓
mailchimp-service.ts
    ↓
Mailchimp API (Mandrill)
    ↓
Email Delivered ✅
```

## Usage Examples

### 1. Send Welcome Email (Automatic)
Triggered automatically in `auth-context.tsx` when new user is created:

```typescript
// Automatically called on signup
signUpWithEmail(email, password, additionalData);
// or
signInWithGoogle();
```

### 2. Send Welcome Email (Manual)
You can also trigger it manually:

```typescript
import { sendWelcomeEmailToUser } from '@/app/lib/email-client';

const result = await sendWelcomeEmailToUser({
  email: 'user@example.com',
  name: 'John Doe'
});

if (result.success) {
  console.log('Email sent!', result.messageId);
}
```

### 3. Create Custom Email Templates

Add new templates to `mailchimp-service.ts`:

```typescript
export function generateCustomEmail(data: YourData): EmailTemplate {
  return {
    subject: 'Your subject',
    html: 'Your HTML content',
    text: 'Plain text version'
  };
}
```

Then create an API route at `app/api/emails/your-template/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { sendMailchimpEmail, generateCustomEmail } from '@/app/lib/mailchimp-service';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const template = generateCustomEmail(body.data);
  
  const result = await sendMailchimpEmail(
    { email: body.email, name: body.name },
    template
  );
  
  return NextResponse.json(result);
}
```

## Email Templates Included

### 1. Welcome Email ✅
- **File:** `mailchimp-service.ts` → `generateWelcomeEmail()`
- **From:** James William
- **When:** New user signup
- **Features:** Personalized, feature highlights, CTA

### 2. Team Invite Email 🚀
- **File:** `mailchimp-service.ts` → `generateInviteEmail()`
- **When:** Team member invited
- **Features:** Invitation link, company info

### 3. Password Reset Email 🔐
- **File:** `mailchimp-service.ts` → `generatePasswordResetEmail()`
- **When:** Password reset requested
- **Features:** Secure reset link

## Testing

### Test Welcome Email

1. Sign up with a new account
2. Check console logs for:
   ```
   📧 Triggering welcome email for: John Doe
   ✅ Welcome email sent successfully!
   ```
3. Check email inbox (including spam folder)

### Test Locally

You can test the email template HTML by copying it from `mailchimp-service.ts` and viewing it in a browser.

## Error Handling

The system handles errors gracefully:
- ✅ Missing API key → Logs warning, doesn't break signup
- ✅ Mailchimp API down → Logs warning, user can still sign in
- ✅ Invalid email → Validation error
- ✅ Network error → Caught and logged

**Important:** Email sending is non-blocking. If emails fail, the signup process still completes successfully.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MAILCHIMP_API_KEY` | Yes | - | Your Mailchimp/Mandrill API key |
| `NEXT_PUBLIC_APP_URL` | No | `http://localhost:3000` | Your app's URL for email links |

## Mailchimp Dashboard

View sent emails and analytics:
1. Go to [Mailchimp Transactional](https://mandrillapp.com/)
2. Navigate to **Outbound → Activity**
3. View delivery status, opens, clicks

## Troubleshooting

### Email not sending?

1. **Check API Key:**
   ```bash
   echo $MAILCHIMP_API_KEY
   ```

2. **Check Console Logs:**
   Look for `📧` and `✅` or `❌` emoji logs

3. **Verify Domain:**
   Mailchimp may require domain verification for production

4. **Check Spam Folder:**
   First emails might go to spam

5. **Test API Key:**
   ```bash
   curl -X POST https://mandrillapp.com/api/1.0/users/ping \
     -d '{"key":"YOUR_API_KEY"}'
   ```

### Common Issues

**Issue:** API key not found  
**Solution:** Add `MAILCHIMP_API_KEY` to `.env.local`

**Issue:** Emails go to spam  
**Solution:** Verify your domain in Mailchimp settings

**Issue:** API rate limit  
**Solution:** Mailchimp has limits; check your plan

## Future Enhancements

Potential additions:
- [ ] Email templates for conversation notifications
- [ ] Digest emails for team activity
- [ ] Marketing campaigns integration
- [ ] Email preferences management
- [ ] Unsubscribe handling

## Support

For Mailchimp/Mandrill support:
- [Mandrill Documentation](https://mailchimp.com/developer/transactional/docs/fundamentals/)
- [API Reference](https://mailchimp.com/developer/transactional/api/)

For project-specific issues:
- Check console logs
- Review `mailchimp-service.ts`
- Test with Postman/curl

---

**Created by:** Rexa AI Team  
**Last Updated:** ${new Date().toLocaleDateString()}


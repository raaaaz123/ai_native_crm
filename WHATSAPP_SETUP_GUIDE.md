# WhatsApp Business Integration Setup Guide

## Issue: "Your request could not be processed" Error

This error occurs when trying to authenticate with Facebook/Meta OAuth for WhatsApp Business integration. Here's how to resolve it.

## Root Causes

1. **App not approved**: WhatsApp Business API scopes require Meta's app review
2. **Development Mode**: App must be in "Live" mode for production use
3. **Redirect URI not configured**: OAuth redirect URIs must be whitelisted
4. **Missing permissions**: App needs proper permissions and business verification

## Step-by-Step Solution

### 1. Configure Facebook App Settings

Go to [Meta for Developers](https://developers.facebook.com/apps/) and select your app (ID: 1350549256477298)

#### A. Add Valid OAuth Redirect URIs

1. Navigate to **App Settings** → **Basic**
2. Scroll to **App Domains** and add:
   - `localhost` (for development)
   - `ai-native-crm.vercel.app` (for production)

3. Go to **Products** → **Facebook Login** → **Settings**
4. Under **Valid OAuth Redirect URIs**, add:
   ```
   http://localhost:3000/api/whatsapp/callback
   https://ai-native-crm.vercel.app/api/whatsapp/callback
   ```
5. Click **Save Changes**

#### B. Add WhatsApp Product

1. In the left sidebar, click **Add Products**
2. Find **WhatsApp** and click **Set Up**
3. Follow the setup wizard to:
   - Create or select a Business Account
   - Add a phone number for testing
   - Verify your business

#### C. Configure WhatsApp Settings

1. Go to **Products** → **WhatsApp** → **Configuration**
2. Under **Webhook**, configure:
   - **Callback URL**: `https://git-branch-m-main.onrender.com/api/whatsapp/webhook`
   - **Verify Token**: Generate a random token and add to your `.env` as `WHATSAPP_VERIFY_TOKEN`
3. Subscribe to webhook fields:
   - `messages`
   - `message_status`

### 2. Accept Updated Platform Terms

1. Go to [Facebook Business Manager](https://business.facebook.com/)
2. Look for any banners or notifications about updated terms
3. Review and accept the updated **Platform Terms** and **Developer Policies**
4. Complete any required business verification steps

### 3. Switch App to Live Mode (Important!)

**For Testing (Development Mode):**
1. Go to **App Settings** → **Basic**
2. Keep app in **Development Mode**
3. Add test users:
   - Go to **Roles** → **Test Users** → **Add**
   - Add your Facebook account as a test user
   - These users can test WhatsApp integration without app review

**For Production (Live Mode - Requires App Review):**
1. Complete all required app review steps
2. Go to **App Settings** → **Basic**
3. Toggle **App Mode** to **Live**

⚠️ **Note**: In Development Mode, only test users can authenticate. For public access, you need app review.

### 4. Request App Review for WhatsApp Permissions

1. Go to **App Review** → **Permissions and Features**
2. Request the following permissions:
   - `whatsapp_business_management`
   - `whatsapp_business_messaging`
   - `business_management`

3. For each permission, provide:
   - **Purpose**: "AI-powered customer engagement platform for WhatsApp Business automation"
   - **Use Case**: "Allow users to connect their WhatsApp Business accounts and enable automated AI agent responses to customer messages"
   - **Screencast**: Record a video showing your integration flow
   - **Instructions**: Provide test credentials for Meta reviewers

4. Submit for review (typically takes 3-5 business days)

### 5. Become a Tech Provider (Required for WhatsApp Business API)

1. Go to [Meta Business Partners](https://www.facebook.com/business/partner-directory)
2. Apply to become a **Tech Provider**
3. Complete the verification requirements:
   - Business information
   - Tax documentation (if applicable)
   - Use case description
   - Access verification (typically includes security review)

4. Once approved, you'll have access to WhatsApp Business Platform APIs

### 6. Alternative: Use Test Mode First

While waiting for app review, you can test with Development Mode:

1. Keep app in **Development Mode**
2. Add yourself as a **Test User** or **Developer**:
   - Go to **Roles** → **Roles**
   - Add your Facebook account as an **Administrator** or **Developer**

3. Add test phone numbers:
   - Go to **WhatsApp** → **API Setup**
   - Add test phone numbers for development

4. Test the OAuth flow - it should work for users with roles in the app

### 7. Update Environment Variables for Production

Once approved, update your production `.env` file:

```bash
# Frontend (.env.local)
NEXT_PUBLIC_BACKEND_URL=https://git-branch-m-main.onrender.com

# Backend (.env)
META_APP_ID=1350549256477298
META_APP_SECRET=fbabe2f43251ec47862c3ffc6dd1578f
WHATSAPP_REDIRECT_URI=https://ai-native-crm.vercel.app/api/whatsapp/callback  # Production URL
WHATSAPP_VERIFY_TOKEN=your-random-verify-token-here  # Generate a random string
```

## Testing Checklist

Before going live, verify:

- [ ] Redirect URIs are configured in Facebook App settings
- [ ] App Domains include your production and development domains
- [ ] WhatsApp product is added and configured
- [ ] Business account is verified
- [ ] Test phone number is added
- [ ] You are added as a test user/developer (for Development Mode)
- [ ] Platform terms are accepted
- [ ] Environment variables are correctly set
- [ ] OAuth flow works in Development Mode with test users

## Common Errors and Solutions

### Error: "App Not Set Up: This app is still in development mode"
**Solution**: Add yourself as a test user or switch to Live Mode after app review

### Error: "redirect_uri is not allowed"
**Solution**: Add the exact redirect URI to Facebook Login settings

### Error: "Permissions error: whatsapp_business_management"
**Solution**: Request this permission through App Review

### Error: "Invalid verification code"
**Solution**: Check that META_APP_SECRET in .env matches Facebook App settings

### Error: "Business not verified"
**Solution**: Complete business verification in Meta Business Manager

## Quick Fix for Immediate Testing

To test RIGHT NOW (without waiting for app review):

1. Go to your Facebook app → **Roles** → **Roles**
2. Add your Facebook account as **Administrator**
3. Keep app in **Development Mode**
4. Configure redirect URI: `http://localhost:3000/api/whatsapp/callback`
5. Try the OAuth flow again - it should work for administrators

## Production Deployment Timeline

- **Immediate**: Test with Development Mode (administrators only)
- **Day 1-2**: Complete business verification
- **Day 3-5**: Submit app review for permissions
- **Week 1-2**: Meta reviews your app (3-5 business days typically)
- **Week 2+**: Become a Tech Provider (if required for your use case)
- **After approval**: Switch to Live Mode for public access

## Support Resources

- [WhatsApp Business Platform Documentation](https://developers.facebook.com/docs/whatsapp/business-platform)
- [Meta App Review Process](https://developers.facebook.com/docs/app-review)
- [Business Verification Guide](https://www.facebook.com/business/help/2058515294227817)
- [Tech Provider Program](https://developers.facebook.com/docs/whatsapp/business-management-api/get-started#tech-provider)

## Next Steps

1. **Immediate**: Add yourself as an app administrator to test now
2. **Short-term**: Configure all redirect URIs and accept platform terms
3. **Medium-term**: Complete business verification
4. **Long-term**: Submit for app review and become a Tech Provider

---

**Note**: The current error occurs because the app is trying to request permissions that require either (1) the user to be an app administrator/developer, or (2) the app to be in Live Mode with approved permissions. Following the "Quick Fix" above will let you test immediately while you work on getting full approval.

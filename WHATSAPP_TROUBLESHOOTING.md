# WhatsApp OAuth Troubleshooting Guide

## Error: "Your request couldn't be processed"

This error typically occurs due to one of these issues:

### 1. **Redirect URI Not Configured in Meta Dashboard**

**Solution:**
1. Go to [Meta for Developers](https://developers.facebook.com/apps/)
2. Select your app (ID: 1350549256477298)
3. Go to **Products** → **Facebook Login** → **Settings**
4. Under **Valid OAuth Redirect URIs**, add:
   ```
   http://localhost:3000/api/whatsapp/callback
   https://ai-native-crm.vercel.app/api/whatsapp/callback
   ```
5. Click **Save Changes**
6. Wait 1-2 minutes for changes to propagate

### 2. **App in Development Mode Without Test Users**

**Solution:**
1. Go to your app → **Roles** → **Roles**
2. Add your Facebook account as **Administrator** or **Developer**
3. Make sure you're logged into Facebook with the same account
4. Try the OAuth flow again

### 3. **App Domains Not Configured**

**Solution:**
1. Go to **Settings** → **Basic**
2. Under **App Domains**, add:
   ```
   localhost
   ai-native-crm.vercel.app
   ```
3. Click **Save Changes**

### 4. **WhatsApp Product Not Added**

**Solution:**
1. Go to **Add Product** (left sidebar)
2. Find **WhatsApp** and click **Set Up**
3. Follow the setup wizard
4. Complete business verification if required

### 5. **Try Page Redirect Mode Instead of Popup**

If popup mode fails, try the simpler page redirect mode:

1. Click **"Connect WhatsApp Business (Page Redirect)"** button
2. This uses a simpler OAuth flow that's more reliable
3. Make sure your redirect URI is configured first

## Quick Checklist

Before trying OAuth again, verify:

- [ ] Redirect URI is added in Facebook Login settings
- [ ] App Domains include your domain
- [ ] You're added as Administrator/Developer in app roles
- [ ] WhatsApp product is added to your app
- [ ] You're logged into Facebook with the correct account
- [ ] App is in Development Mode (for testing) or Live Mode (for production)

## Testing Steps

1. **First, try Page Redirect Mode:**
   - Click "Connect WhatsApp Business (Page Redirect)"
   - This is simpler and more reliable for initial testing

2. **If Page Redirect works, then try Popup Mode:**
   - Click "Connect WhatsApp Business (Popup)"
   - This provides a better UX but requires proper xd_arbiter configuration

3. **Check Browser Console:**
   - Open browser DevTools (F12)
   - Look for any error messages
   - Check Network tab for failed requests

4. **Check Backend Logs:**
   - Look at backend server logs
   - Check for OAuth URL generation errors
   - Verify redirect URI format

## Common Error Messages

### "redirect_uri is not allowed"
- **Fix**: Add the exact redirect URI to Facebook Login settings

### "App Not Set Up: This app is still in development mode"
- **Fix**: Add yourself as Administrator in app roles

### "Permissions error: whatsapp_business_management"
- **Fix**: Request permission through App Review (or add as Administrator for testing)

### "Invalid verification code"
- **Fix**: Check that META_APP_SECRET in .env matches Facebook App settings

## Still Having Issues?

1. **Verify Environment Variables:**
   ```bash
   # Check backend/.env has:
   META_APP_ID=1350549256477298
   META_APP_SECRET=your_app_secret
   WHATSAPP_REDIRECT_URI=http://localhost:3000/api/whatsapp/callback
   ```

2. **Test OAuth URL Directly:**
   - Copy the OAuth URL from backend logs
   - Paste it in a new browser tab
   - See what error Facebook shows

3. **Check Meta Dashboard:**
   - Go to **App Review** → **Permissions and Features**
   - See if any permissions are pending approval
   - Check if business verification is required

4. **Use Simple Mode First:**
   - Start with page redirect mode (simpler)
   - Once that works, then try popup mode
   - Popup mode requires more configuration

## Production Checklist

Before going live:

- [ ] App is switched to **Live Mode**
- [ ] All required permissions are approved through App Review
- [ ] Business is verified in Meta Business Manager
- [ ] Production redirect URI is configured
- [ ] Test with production URL, not just localhost


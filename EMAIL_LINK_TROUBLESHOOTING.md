# Email Link Authentication Troubleshooting Guide

## Common Issues and Solutions

### 1. **Email Not Received**

#### Check Firebase Console Configuration

1. **Enable Email Link Sign-In:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Navigate to **Authentication** → **Sign-in method**
   - Enable **Email/Password** provider (if not already enabled)
   - Enable **Email link (passwordless sign-in)** option
   - Click **Save**

2. **Add Authorized Domains:**
   - Go to **Authentication** → **Settings** → **Authorized domains**
   - Add your domain:
     - For development: `localhost` (usually auto-added)
     - For production: Your actual domain (e.g., `yourdomain.com`)
   - Click **Add Domain**

#### Check Email Delivery

- **Check Spam Folder:** Firebase emails sometimes go to spam
- **Wait a Few Minutes:** Email delivery can take 1-5 minutes
- **Check Email Provider:** Some email providers block Firebase emails
- **Try Different Email:** Test with Gmail, Outlook, or another provider

### 2. **Error: "Invalid email" or "User not found"**

These errors are normal for new sign-ups. Firebase will create the account when the user clicks the email link.

### 3. **Error: "Domain not authorized"**

**Solution:**
1. Go to Firebase Console → Authentication → Settings
2. Under **Authorized domains**, add your domain
3. For localhost development, ensure `localhost` is listed
4. Wait a few minutes for changes to propagate

### 4. **Link Doesn't Work After Clicking**

**Check:**
- The callback URL matches exactly: `/auth/callback`
- The domain is authorized in Firebase Console
- The link hasn't expired (links expire after 1 hour)
- You're using the same browser/device (or entering email if different device)

### 5. **Development vs Production**

**For Localhost:**
- Ensure `localhost` is in authorized domains
- Use `http://localhost:3000` (not `127.0.0.1`)
- Check browser console for errors

**For Production:**
- Add your production domain to authorized domains
- Use HTTPS URLs
- Ensure Firebase project is configured correctly

## Debugging Steps

### Step 1: Check Browser Console
Open browser DevTools (F12) and check the Console tab for:
- `📧 [Email Link] Sending sign-in link to: [email]`
- `✅ [Email Link] Sign-in link sent successfully`
- Any error messages with codes

### Step 2: Check Firebase Console
1. Go to Firebase Console → Authentication → Users
2. Check if user was created (may not appear until link is clicked)
3. Check Firebase Console → Authentication → Templates
4. Verify email templates are configured

### Step 3: Test Email Delivery
1. Try sending to a different email address
2. Check spam/junk folder
3. Wait 5-10 minutes
4. Try with Gmail or another provider

### Step 4: Verify Configuration
Check that:
- ✅ Email/Password provider is enabled
- ✅ Email link (passwordless) is enabled
- ✅ Domain is authorized
- ✅ Firebase project is active
- ✅ No billing/quota issues

## Firebase Console Checklist

- [ ] **Authentication** → **Sign-in method** → **Email/Password** → Enabled
- [ ] **Authentication** → **Sign-in method** → **Email link (passwordless sign-in)** → Enabled
- [ ] **Authentication** → **Settings** → **Authorized domains** → Your domain added
- [ ] **Authentication** → **Templates** → Email templates configured
- [ ] **Project Settings** → **General** → Project is active

## Common Error Codes

| Error Code | Meaning | Solution |
|------------|---------|----------|
| `auth/invalid-email` | Invalid email format | Check email format |
| `auth/user-disabled` | Account disabled | Contact support |
| `auth/operation-not-allowed` | Email link not enabled | Enable in Firebase Console |
| `auth/unauthorized-domain` | Domain not authorized | Add domain to authorized list |

## Still Not Working?

1. **Check Firebase Status:** [status.firebase.google.com](https://status.firebase.google.com/)
2. **Review Firebase Logs:** Firebase Console → Functions → Logs
3. **Test with Firebase CLI:** `firebase auth:export users.json`
4. **Contact Support:** Firebase Support or check documentation

## Quick Test

Try this in browser console after clicking "Create account":
```javascript
// Check if email was stored
localStorage.getItem('emailForSignIn')
localStorage.getItem('pendingFullName')

// Check Firebase auth state
import { auth } from './lib/firebase';
auth.currentUser
```

## Production Checklist

Before deploying to production:
- [ ] Add production domain to authorized domains
- [ ] Update callback URL to production domain
- [ ] Test email delivery on production domain
- [ ] Configure custom email templates (optional)
- [ ] Set up email domain verification (optional, for better deliverability)


# Calendly Integration Setup Guide

This guide walks you through setting up the Calendly integration for your AI Native CRM application.

## Overview

The Calendly integration allows your AI agents to:
- Schedule meetings automatically based on user requests
- Access your Calendly event types
- Trigger booking flows through natural conversation
- Display available time slots to users

## Prerequisites

1. A Calendly account (Pro plan or higher recommended for API access)
2. Access to Calendly Developer Portal
3. Your application running locally or deployed

## Step 1: Create Calendly OAuth Application

1. **Go to Calendly Developer Portal**
   - Visit: https://developer.calendly.com/
   - Sign in with your Calendly account

2. **Create a New Application**
   - Click "Create App" or "New Application"
   - Fill in the application details:
     - **App Name**: Your CRM Application Name
     - **Description**: AI Native CRM Calendly Integration
     - **Website URL**: Your application URL (e.g., `http://localhost:3000` for development)

3. **Configure OAuth Settings**
   - **Redirect URI**: `http://localhost:3001/api/calendly/callback` (for development)
   - **Scopes**: Select the following scopes:
     - `read` - Read access to user's Calendly data
     - `write` - Write access (if you plan to create events)
   
4. **Save and Get Credentials**
   - After creating the app, you'll receive:
     - **Client ID**: Your OAuth client identifier
     - **Client Secret**: Your OAuth client secret (keep this secure!)

## Step 2: Configure Environment Variables

### Backend Configuration (`backend/.env`)

Add the following to your backend environment file:

```bash
# Calendly OAuth Integration
CALENDLY_CLIENT_ID=your-calendly-oauth-client-id
CALENDLY_CLIENT_SECRET=your-calendly-oauth-client-secret
CALENDLY_REDIRECT_URI=http://localhost:3001/api/calendly/callback
```

### Frontend Configuration (`.env.local`)

Add the following to your frontend environment file:

```bash
# Backend API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8001

# Calendly OAuth Integration (Frontend)
NEXT_PUBLIC_CALENDLY_CLIENT_ID=your-calendly-oauth-client-id
NEXT_PUBLIC_CALENDLY_REDIRECT_URI=http://localhost:3001/api/calendly/callback
```

## Step 3: Production Setup

For production deployment, update the redirect URIs:

### Backend Production Environment
```bash
CALENDLY_REDIRECT_URI=https://yourdomain.com/api/calendly/callback
```

### Frontend Production Environment
```bash
NEXT_PUBLIC_API_BASE_URL=https://your-backend-api.com
NEXT_PUBLIC_CALENDLY_REDIRECT_URI=https://yourdomain.com/api/calendly/callback
```

### Update Calendly App Settings
1. Go back to your Calendly Developer Portal
2. Edit your application
3. Add production redirect URI: `https://yourdomain.com/api/calendly/callback`
4. Save the changes

## Step 4: Test the Integration

1. **Start your application**
   ```bash
   # Frontend
   npm run dev
   
   # Backend (in separate terminal)
   cd backend
   python -m uvicorn app.main:app --reload --port 8001
   ```

2. **Navigate to Agent Settings**
   - Go to your agent's settings page
   - Click on "Integrations"
   - Find the Calendly integration card

3. **Connect Calendly**
   - Click "Connect" on the Calendly card
   - You'll be redirected to Calendly's OAuth flow
   - Authorize the application
   - You should be redirected back with a success message

4. **Verify Connection**
   - The Calendly card should show "Connected" status
   - You should see your Calendly user information
   - Available event types should be displayed

## Step 5: Configure Agent Actions

1. **Create Calendly Action**
   - Go to your agent's Actions page
   - Click "Create Action"
   - Select "Calendly Booking" as the action type
   - Configure the action:
     - **Name**: e.g., "Schedule Meeting"
     - **Description**: When to use this action
     - **Event Type**: Select from your connected Calendly event types
     - **Trigger Phrases**: Add phrases that should trigger booking

2. **Test in Playground**
   - Go to the agent playground
   - Try phrases like:
     - "I'd like to schedule a meeting"
     - "Can we set up a call?"
     - "Book a consultation"
   - The AI should respond with booking options

## Troubleshooting

### Common Issues

1. **OAuth Redirect Mismatch**
   - Ensure redirect URIs match exactly in Calendly app settings and environment variables
   - Check for trailing slashes or protocol mismatches

2. **CORS Issues**
   - Make sure your backend CORS settings allow your frontend domain
   - Check `ALLOWED_ORIGINS` in backend environment

3. **API Connection Failed**
   - Verify `NEXT_PUBLIC_API_BASE_URL` points to your running backend
   - Check that backend is running on the correct port

4. **Calendly API Errors**
   - Verify your Calendly account has API access
   - Check that client ID and secret are correct
   - Ensure your Calendly account is active

### Debug Steps

1. **Check Browser Console**
   - Look for JavaScript errors during OAuth flow
   - Check network requests for failed API calls

2. **Check Backend Logs**
   - Monitor backend console for error messages
   - Verify OAuth token exchange is working

3. **Test API Endpoints**
   - Test backend endpoints directly:
     - `GET /api/calendly/status`
     - `POST /api/calendly/connect`

## Security Considerations

1. **Keep Client Secret Secure**
   - Never expose client secret in frontend code
   - Use environment variables only
   - Rotate secrets periodically

2. **Validate Redirect URIs**
   - Only use HTTPS in production
   - Whitelist specific domains in Calendly app settings

3. **Token Storage**
   - Tokens are stored securely in your database
   - Implement token refresh logic for long-term usage

## API Endpoints

The integration provides the following API endpoints:

- `POST /api/calendly/connect` - Initiate OAuth flow
- `POST /api/calendly/callback` - Handle OAuth callback
- `GET /api/calendly/status` - Check connection status
- `GET /api/calendly/event-types` - Get available event types
- `POST /api/calendly/disconnect` - Disconnect integration
- `POST /api/calendly/refresh-token` - Refresh access token

## Support

For additional help:
- Check Calendly Developer Documentation: https://developer.calendly.com/docs
- Review Calendly API Reference: https://developer.calendly.com/api-docs
- Contact support if you encounter persistent issues
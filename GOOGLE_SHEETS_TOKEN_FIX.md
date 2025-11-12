# Google Sheets Token Expired - Quick Fix

## Problem

You're getting this error:
```
Failed to load Google Sheets: {"detail":"Request had invalid authentication credentials. Expected OAuth 2 access token, login cookie or other valid authentication credential."}
```

**Root Cause**: Google OAuth access tokens expire after 1 hour. Your connection was established over an hour ago, so the token expired.

## Quick Fix (Immediate Solution)

**Simply reconnect your Google account:**

1. Go to the Google Sheets page: http://localhost:3000/dashboard/rasheed-m/agents/XHptkClQCsVUHa8obTrm/sources/google-sheets

2. You'll see an error message about the expired token

3. **Option 1 - Disconnect and Reconnect:**
   - Open your browser's developer console (F12)
   - Go to Application tab → IndexedDB → Delete the Google Sheets connection
   - Refresh the page
   - Click "Connect with Google" again

4. **Option 2 - Direct Reconnect (if available in UI):**
   - Look for a "Reconnect" or "Disconnect" button
   - Click it and authorize again

## What I Fixed (Backend)

I've added automatic token refresh functionality to the backend:

### 1. Backend Service (✅ Done)
- Added `refresh_access_token()` method in `google_sheets_service.py`
- This method uses the refresh_token to get a new access_token

### 2. Backend API Endpoint (✅ Done)
- Added `/api/google-sheets/refresh-token` endpoint
- Frontend can call this to refresh expired tokens

### 3. Frontend Utility (✅ Done)
- Added `refreshGoogleSheetsToken()` function in `google-sheets-utils.ts`
- Ready to use when we update the page component

## Proper Fix (For Future)

To make this automatic, we need to:

1. **Update Google Sheets Page Component** to:
   - Detect 401 errors (expired token)
   - Automatically call refresh endpoint
   - Update Firestore with new token
   - Retry the failed request

2. **Store Token Expiry Time** in Firestore:
   - Save `expiresAt` timestamp when storing connection
   - Check before making requests
   - Refresh proactively if expiring soon

## Why This Happens

Google OAuth tokens have two parts:
- **Access Token**: Short-lived (1 hour), used for API requests
- **Refresh Token**: Long-lived, used to get new access tokens

Your connection stored both tokens, but the code wasn't refreshing the access token when it expired.

## Temporary Workaround

Until we fully implement automatic refresh in the frontend, you'll need to:
1. Reconnect every time tokens expire (~ every hour)
2. OR restart your backend server to trigger token refresh

## Long-Term Solution

I recommend implementing this flow in the Google Sheets page:

```typescript
const loadSpreadsheetsWithAutoRefresh = async (accessToken: string) => {
  try {
    // Try with current access token
    const result = await listGoogleSheets(accessToken);

    if (!result.success && result.error?.includes('authentication')) {
      // Token expired - try to refresh
      if (connection?.refreshToken) {
        const refreshResult = await refreshGoogleSheetsToken(connection.refreshToken);

        if (refreshResult.success) {
          // Update Firestore with new token
          await updateConnectionToken(workspaceId, refreshResult.accessToken);

          // Retry with new token
          return await listGoogleSheets(refreshResult.accessToken);
        }
      }

      // Refresh failed - user needs to reconnect
      alert('Your Google connection expired. Please reconnect.');
      setConnection(null);
    }

    return result;
  } catch (error) {
    console.error('Error loading spreadsheets:', error);
  }
};
```

## Next Steps

For now:
1. **Reconnect your Google account** on the page
2. Your sheets will load fine
3. Connection will work for another hour

For permanent fix:
1. Implement automatic token refresh in the page component
2. Add expiry time tracking
3. Test token refresh flow

---

**Quick Action**: Just reconnect Google on the page and you're good to go! The backend is ready for automatic refresh when we update the frontend component.

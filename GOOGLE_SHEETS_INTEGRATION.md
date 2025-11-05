# Google Sheets Integration - Complete Implementation

This document describes the complete Google Sheets integration implementation for Rexa Engage.

## Overview

The Google Sheets integration allows users to:
- Connect their Google account via OAuth 2.0
- Browse and select spreadsheets from Google Drive
- Import spreadsheet data into the agent's knowledge base (RAG)
- Enable AI agents to answer questions using spreadsheet data
- Track imported sheets in Firestore

## Architecture

The integration follows the same pattern as the Notion integration:

### Flow Diagram
```
User → Connect with Google → OAuth Flow → Google Authorization
  ↓
Backend receives code → Exchange for access token
  ↓
Save token to Firestore → Redirect to sources page
  ↓
List spreadsheets → User selects sheets → Train RAG
  ↓
Fetch sheet data → Format as markdown table → Generate embeddings
  ↓
Store in Qdrant (dense + sparse vectors) → Save metadata to Firestore
  ↓
Agent can now answer questions using sheet data
```

## Setup Instructions

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable APIs:
   - Google Sheets API
   - Google Drive API

### 2. Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Configure OAuth consent screen:
   - User Type: External
   - App name: Rexa Engage
   - Support email: your-email@example.com
   - Scopes: Add these scopes:
     - `https://www.googleapis.com/auth/spreadsheets.readonly`
     - `https://www.googleapis.com/auth/drive.readonly`
4. Create OAuth Client ID:
   - Application type: Web application
   - Name: Rexa Engage Google Sheets
   - Authorized redirect URIs:
     - `http://localhost:3000/api/google-sheets/callback` (development)
     - `https://your-domain.com/api/google-sheets/callback` (production)
5. Copy Client ID and Client Secret

### 3. Update Environment Variables

**Backend (.env):**
```bash
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google-sheets/callback
```

**Frontend (.env.local):**
No additional variables needed - uses `NEXT_PUBLIC_BACKEND_URL`

### 4. Deploy Firestore Rules

The rules are already added in `firestore.rules`. Deploy them:
```bash
firebase deploy --only firestore:rules
```

## File Structure

### Backend Files

**Services:**
- `backend/app/services/google_sheets_service.py` - Google Sheets API integration
  - OAuth token exchange
  - List spreadsheets from Drive
  - Fetch and format sheet data

**Routers:**
- `backend/app/routers/google_sheets_router.py` - API endpoints
  - `GET /api/google-sheets/oauth/authorize` - Initiate OAuth
  - `POST /api/google-sheets/oauth/callback` - Handle callback
  - `POST /api/google-sheets/list-spreadsheets` - List sheets
  - `POST /api/google-sheets/import-sheet` - Import to RAG

**Configuration:**
- `backend/app/config.py` - OAuth credentials
- `backend/app/main.py` - Router registration

### Frontend Files

**Utilities:**
- `app/lib/google-sheets-utils.ts` - Helper functions
  - `getGoogleSheetsConnection()` - Get stored connection
  - `listGoogleSheets()` - List spreadsheets
  - `importGoogleSheet()` - Import sheet
  - `initiateGoogleOAuth()` - Start OAuth flow

**Agent Knowledge:**
- `app/lib/agent-knowledge-utils.ts` - Updated with Google Sheets support
  - Added `google_sheets` type
  - Added `storeGoogleSheetInQdrant()` function
  - Updated `createAgentKnowledgeItem()` to handle sheets

**Pages:**
- `app/dashboard/[workspace]/agents/[agentId]/sources/google-sheets/page.tsx`
  - OAuth connection UI
  - Spreadsheet listing and search
  - Multi-select with checkboxes
  - "Train RAG with Selected" button
  - Import progress tracking
  - Already imported vs available sections

**API Routes:**
- `app/api/google-sheets/callback/route.ts` - OAuth callback handler

**UI:**
- `app/components/layout/Sidebar.tsx` - Added Google Sheets menu item

## How to Use

### 1. Navigate to Google Sheets Sources

1. Go to Dashboard → Select Agent → Sources → Google Sheets
2. Click "Connect with Google"
3. Authorize Rexa Engage to access your Google Sheets (read-only)
4. You'll be redirected back with your spreadsheets listed

### 2. Import Spreadsheets

1. Browse your spreadsheets
2. Use search to filter by name
3. Select one or more sheets using checkboxes
4. Click "Train RAG with Selected (X)"
5. Confirm the import
6. Wait for processing (shows progress)

### 3. View Imported Sheets

The page shows three sections:
- **Stats Cards**: Total, In Knowledge Base, Available
- **Available to Import**: Sheets not yet in RAG
- **Already in Knowledge Base**: Previously imported sheets with metadata

## Data Format

### Spreadsheet to Markdown Conversion

Sheets are converted to markdown tables:

**Original Sheet:**
| Name | Email | Role |
|------|-------|------|
| John | john@example.com | Admin |
| Jane | jane@example.com | User |

**Stored as:**
```markdown
# Spreadsheet Title
## Sheet: Sheet1

| Name | Email | Role |
|---|---|---|
| John | john@example.com | Admin |
| Jane | jane@example.com | User |
```

### Firestore Schema

**Connection Document** (`googleSheetsConnections/{workspaceId}_google_sheets`):
```typescript
{
  workspaceId: string;
  agentId: string | null;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Knowledge Item** (`agentKnowledge/{itemId}`):
```typescript
{
  id: string;
  agentId: string;
  workspaceId: string;
  title: string;
  content: string; // Markdown formatted table
  type: "google_sheets";
  googleSheetId: string;
  sheetName: string;
  rowsCount: number;
  chunksCreated: number;
  embeddingProvider: "voyage";
  embeddingModel: "voyage-3";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Qdrant Payload

```json
{
  "id": "gsheet-abc123",
  "workspaceId": "workspace_123",
  "agentId": "agent_456",
  "title": "Sales Data - Q1 2024",
  "type": "google_sheets",
  "googleSheetId": "1ABC...",
  "sheetName": "Sheet1",
  "rowsCount": 150
}
```

## API Endpoints

### 1. Initiate OAuth
```http
GET /api/google-sheets/oauth/authorize?workspace_id={id}&agent_id={id}
```
Redirects to Google OAuth authorization page.

### 2. OAuth Callback
```http
POST /api/google-sheets/oauth/callback
Content-Type: application/json

{
  "code": "4/0AY0...",
  "state": "workspace_id:agent_id"
}
```

**Response:**
```json
{
  "success": true,
  "access_token": "ya29...",
  "refresh_token": "1//0...",
  "expires_in": 3600,
  "workspace_id": "workspace_123",
  "agent_id": "agent_456"
}
```

### 3. List Spreadsheets
```http
POST /api/google-sheets/list-spreadsheets
Content-Type: application/json

{
  "access_token": "ya29...",
  "query": "optional search term"
}
```

**Response:**
```json
{
  "success": true,
  "spreadsheets": [
    {
      "id": "1ABC...",
      "name": "Sales Data",
      "url": "https://docs.google.com/spreadsheets/d/1ABC...",
      "modifiedTime": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 15
}
```

### 4. Import Sheet
```http
POST /api/google-sheets/import-sheet
Content-Type: application/json

{
  "access_token": "ya29...",
  "spreadsheet_id": "1ABC...",
  "sheet_name": "Sheet1",
  "agent_id": "agent_456",
  "title": "Sales Data - Q1",
  "embedding_provider": "voyage",
  "embedding_model": "voyage-3",
  "metadata": {
    "workspace_id": "workspace_123"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Google Sheet 'Sales Data - Q1' imported successfully",
  "id": "gsheet-abc123",
  "title": "Sales Data - Q1",
  "chunks_created": 12,
  "rows_count": 150,
  "url": "https://docs.google.com/spreadsheets/d/1ABC..."
}
```

## Security

### OAuth Scopes
- `spreadsheets.readonly` - Read-only access to sheets
- `drive.readonly` - List sheets from Drive (read-only)

### Firestore Rules
```javascript
match /googleSheetsConnections/{connectionId} {
  allow read, write, delete, create: if request.auth != null;
}
```

### Token Storage
- Access tokens stored in Firestore (encrypted at rest)
- Refresh tokens stored for token renewal
- Tokens scoped per workspace

## Features

✅ **OAuth 2.0 Integration** - Secure Google authentication
✅ **Read-Only Access** - Only reads spreadsheet data
✅ **Multi-Sheet Support** - Import multiple sheets at once
✅ **Search & Filter** - Find sheets by name
✅ **Progress Tracking** - Shows import progress
✅ **Duplicate Prevention** - Can't import same sheet twice
✅ **Markdown Formatting** - Converts tables to readable format
✅ **Hybrid RAG** - Dense + sparse vectors with reranking
✅ **Workspace Scoped** - Isolated per workspace
✅ **Visual Indicators** - Shows imported vs available

## Troubleshooting

### Common Issues

**1. "OAuth not configured" error**
- Ensure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in backend/.env
- Restart backend server after adding credentials

**2. "Redirect URI mismatch" error**
- Check that redirect URI in Google Cloud Console matches exactly:
  - `http://localhost:3000/api/google-sheets/callback` (dev)
- No trailing slashes
- Correct protocol (http vs https)

**3. "Access denied" error**
- Check OAuth scopes in Google Cloud Console
- Ensure consent screen is published (if in production)

**4. "Failed to list spreadsheets" error**
- Verify Google Drive API is enabled
- Check access token hasn't expired
- Reconnect Google account if needed

**5. Import fails silently**
- Check backend logs for detailed error
- Ensure Qdrant is connected
- Verify Voyage AI embeddings are initialized

## Testing Checklist

- [ ] OAuth flow completes successfully
- [ ] Spreadsheets list loads
- [ ] Search filters sheets correctly
- [ ] Can select multiple sheets
- [ ] "Train RAG" button appears when selected
- [ ] Import creates Qdrant vectors
- [ ] Import saves Firestore metadata
- [ ] Imported sheets show in "Already in KB" section
- [ ] Can't re-import same sheet
- [ ] Stats cards show correct counts
- [ ] External links open in new tab

## Comparison with Notion Integration

| Feature | Notion | Google Sheets |
|---------|--------|---------------|
| OAuth Flow | ✅ | ✅ |
| List Items | Pages | Spreadsheets |
| Data Format | Blocks → Text | Rows → Markdown Table |
| Multi-select | ✅ | ✅ |
| Search | ✅ | ✅ |
| Duplicate Prevention | ✅ | ✅ |
| Progress Tracking | ✅ | ✅ |
| Firestore Storage | ✅ | ✅ |
| Qdrant RAG | ✅ | ✅ |

## Future Enhancements

- [ ] Auto-sync on sheet updates
- [ ] Select specific sheet tabs
- [ ] Import cell ranges
- [ ] Support for formulas
- [ ] Chart/graph data extraction
- [ ] Refresh token auto-renewal
- [ ] Batch import optimization
- [ ] Export from KB to Sheets

## Support

For issues or questions:
1. Check backend logs: `backend/logs/`
2. Check browser console for frontend errors
3. Verify OAuth setup in Google Cloud Console
4. Test with a simple spreadsheet first
5. Check Firestore and Qdrant connectivity

---

**Implementation Date:** 2025-11-02
**Status:** ✅ Complete and Ready to Use

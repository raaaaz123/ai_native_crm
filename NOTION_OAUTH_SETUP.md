# Notion OAuth Integration Setup Guide

This guide will walk you through setting up Notion OAuth integration for Rexa Engage, allowing users to seamlessly connect their Notion workspaces and import content into their AI knowledge base.

---

## 🎯 Overview

The Notion OAuth integration enables:
- **Seamless Connection**: Users click "Connect with Notion" and authorize access directly
- **Automatic Token Management**: OAuth tokens are securely stored and managed
- **Workspace-Scoped**: Each workspace has its own Notion connection
- **Full Feature Access**: Import pages, databases, and sync content

**Flow:**
```
User clicks "Connect with Notion"
  → Redirects to Notion authorization page
  → User selects pages to share
  → Clicks "Allow access"
  → Redirects back to app with auth code
  → Backend exchanges code for access token
  → Token stored in Firestore
  → User can import Notion content
```

---

## 📋 Prerequisites

Before starting, ensure you have:
- [ ] A Notion account
- [ ] Admin access to your Notion workspace
- [ ] Access to the Rexa Engage backend repository
- [ ] Firestore and Firebase project set up

---

## 🔧 Step 1: Create Notion OAuth Integration

### 1.1 Navigate to Notion Integrations

1. Go to [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Sign in with your Notion account
3. Click "**+ New integration**"

### 1.2 Configure Integration Settings

**Basic Information:**
- **Name**: `Rexa Engage` (or your app name)
- **Associated workspace**: Select your Notion workspace
- **Logo**: Upload your app logo (optional)

**Capabilities:**
- ✅ **Read content**
- ✅ **Read user information without email**
- ⬜ No write permissions needed (we only read content)

**Integration Type:**
- Select "**Public integration**" (NOT Internal)
  - This allows other users to connect their own Notion workspaces
  - Required for OAuth flow

**Redirect URIs:**
Add your callback URLs:
```
http://localhost:3000/api/notion/callback (for development)
https://your-production-domain.com/api/notion/callback (for production)
```

Example for Rexa Engage:
```
http://localhost:3000/api/notion/callback
https://ai-native-crm.vercel.app/api/notion/callback
```

**Distribution:**
- Select "**Public**" to allow any user to install
- Or "**Selected workspaces**" if you want to limit access

### 1.3 Save and Copy Credentials

After creating the integration:

1. Copy the **OAuth client ID** (starts with a long alphanumeric string)
2. Copy the **OAuth client secret** (also a long string)
3. Keep these secure - you'll add them to environment variables

**Example:**
```
Client ID: abc123def456ghi789jkl012mno345
Client Secret: secret_xyz789abc456def123ghi890jkl123
```

---

## 🔐 Step 2: Configure Environment Variables

### 2.1 Backend Environment Variables

Add to `backend/.env`:

```bash
# Notion OAuth Configuration
NOTION_CLIENT_ID=your_notion_client_id_here
NOTION_CLIENT_SECRET=your_notion_client_secret_here
NOTION_REDIRECT_URI=http://localhost:3000/api/notion/callback
```

**Production Backend (.env):**
```bash
NOTION_CLIENT_ID=your_notion_client_id_here
NOTION_CLIENT_SECRET=your_notion_client_secret_here
NOTION_REDIRECT_URI=https://ai-native-crm.vercel.app/api/notion/callback
```

### 2.2 Frontend Environment Variables

Add to `frontend/.env.local`:

```bash
# Backend API URL (used for OAuth redirect)
NEXT_PUBLIC_BACKEND_URL=http://localhost:8001
```

**Production Frontend (.env.local):**
```bash
NEXT_PUBLIC_BACKEND_URL=https://git-branch-m-main.onrender.com
```

### 2.3 Verify Configuration

Restart your backend and frontend servers:

```bash
# Backend
cd backend
python main.py

# Frontend (in new terminal)
cd ..
npm run dev
```

---

## 🔒 Step 3: Configure Firestore Security Rules

The security rules have already been added to `firestore.rules`. Ensure they're deployed:

```bash
firebase deploy --only firestore:rules
```

**Relevant Rules for Notion Connections:**
```javascript
// Notion Connections - workspace members can manage their workspace's Notion connections
match /notionConnections/{connectionId} {
  // Allow read if user is a member of the workspace
  allow read: if request.auth != null &&
    resource.data.workspaceId != null &&
    exists(/databases/$(database)/documents/workspace_members/$(request.auth.uid + '_' + resource.data.workspaceId));

  // Allow write/delete if user is owner or admin of the workspace
  allow write, delete: if request.auth != null &&
    resource.data.workspaceId != null &&
    exists(/databases/$(database)/documents/workspace_members/$(request.auth.uid + '_' + resource.data.workspaceId)) &&
    get(/databases/$(database)/documents/workspace_members/$(request.auth.uid + '_' + resource.data.workspaceId)).data.role in ['owner', 'admin'];

  // Allow create if user is owner or admin of the workspace
  allow create: if request.auth != null &&
    request.resource.data.workspaceId != null &&
    exists(/databases/$(database)/documents/workspace_members/$(request.auth.uid + '_' + request.resource.data.workspaceId)) &&
    get(/databases/$(database)/documents/workspace_members/$(request.auth.uid + '_' + request.resource.data.workspaceId)).data.role in ['owner', 'admin'];
}
```

---

## 🎨 Step 4: Add UI Components to Your App

### 4.1 Import Components

The following components have been created for you:

**1. NotionConnectButton** (`app/components/knowledge-base/NotionConnectButton.tsx`)
- Displays connection status
- Initiates OAuth flow
- Allows disconnection

**2. NotionImportDialog** (`app/components/knowledge-base/NotionImportDialog.tsx`)
- Shows available Notion pages
- Imports single pages or entire databases
- Displays import progress

### 4.2 Add to Agent Knowledge Page

Example usage in an agent's knowledge management page:

```tsx
import { NotionConnectButton } from '@/app/components/knowledge-base/NotionConnectButton';
import { NotionImportDialog } from '@/app/components/knowledge-base/NotionImportDialog';

export default function AgentKnowledgePage({ params }) {
  const workspaceId = params.workspace;
  const agentId = params.agentId;
  const [notionConnected, setNotionConnected] = useState(false);
  const [notionConnection, setNotionConnection] = useState(null);

  return (
    <div className="space-y-6">
      <h1>Agent Knowledge Base</h1>

      {/* Notion Connection */}
      <section>
        <h2>Notion Integration</h2>
        <NotionConnectButton
          workspaceId={workspaceId}
          agentId={agentId}
          onConnectionChange={(connected) => setNotionConnected(connected)}
        />
      </section>

      {/* Import Dialog (only shown when connected) */}
      {notionConnected && notionConnection && (
        <section>
          <h2>Import from Notion</h2>
          <NotionImportDialog
            workspaceId={workspaceId}
            agentId={agentId}
            accessToken={notionConnection.accessToken}
            onImportComplete={() => {
              // Refresh knowledge base list
            }}
          />
        </section>
      )}
    </div>
  );
}
```

---

## 🧪 Step 5: Test the Integration

### 5.1 Test OAuth Flow

1. **Navigate to your agent's knowledge page**
   ```
   http://localhost:3000/dashboard/[workspace]/agents/[agentId]
   ```

2. **Click "Connect with Notion"**
   - Should redirect to Notion authorization page
   - URL will be: `https://api.notion.com/v1/oauth/authorize?...`

3. **Select Pages to Share**
   - Choose specific pages or databases
   - Or grant access to all content

4. **Click "Allow access"**
   - Notion redirects back to your app
   - URL: `http://localhost:3000/api/notion/callback?code=...&state=...`

5. **Verify Connection**
   - You should be redirected to the agent page
   - Connection status should show "Connected"
   - Notion workspace name should be displayed

### 5.2 Test Page Import

1. **View Available Pages**
   - NotionImportDialog should load your shared pages
   - Pages appear in dropdown

2. **Import a Single Page**
   - Select a page from dropdown
   - Click "Import Page"
   - Wait for success message

3. **Verify in Firestore**
   - Check `agentKnowledge` collection
   - Should see new document with type: "notion"

4. **Verify in Qdrant**
   - Content should be chunked and embedded
   - Searchable in agent's knowledge base

### 5.3 Test Database Import

1. **Get Database ID**
   - Open a Notion database
   - Copy URL: `https://notion.so/DATABASE_ID?v=...`
   - Extract the `DATABASE_ID` part

2. **Import Database**
   - Select "Entire Database" option
   - Paste database ID
   - Click "Import Database"

3. **Verify Import**
   - Should see progress for each page
   - All pages added to knowledge base

---

## 🔍 Troubleshooting

### Issue: "Notion OAuth not configured"

**Cause:** Missing environment variables

**Solution:**
1. Check `backend/.env` has `NOTION_CLIENT_ID` and `NOTION_CLIENT_SECRET`
2. Restart backend server
3. Verify variables are loaded: `echo $NOTION_CLIENT_ID` (Linux/Mac) or check in code

---

### Issue: "Redirect URI mismatch"

**Cause:** The redirect URI in Notion integration doesn't match your app's callback URL

**Solution:**
1. Go to [Notion integrations](https://www.notion.so/my-integrations)
2. Edit your integration
3. Add exact callback URL to "Redirect URIs"
4. Ensure it matches `NOTION_REDIRECT_URI` in backend `.env`

---

### Issue: "No pages found"

**Cause:** No pages have been shared with the integration

**Solution:**
1. Open a Notion page
2. Click "..." menu → "Connections"
3. Add your integration
4. Refresh the import dialog

---

### Issue: "Failed to exchange code for token"

**Cause:** Invalid client credentials or expired auth code

**Solution:**
1. Verify `NOTION_CLIENT_ID` and `NOTION_CLIENT_SECRET` are correct
2. Re-initiate OAuth flow (codes expire quickly)
3. Check backend logs for detailed error

---

### Issue: "Access token invalid"

**Cause:** Token expired or integration was removed

**Solution:**
1. Disconnect Notion
2. Reconnect (initiates new OAuth flow)
3. Verify integration is still active in Notion

---

## 📊 Data Flow Architecture

### OAuth Authorization Flow

```
┌─────────────┐
│   User      │
│   Clicks    │
│   Connect   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Backend: /api/notion/oauth/authorize   │
│  Builds authorization URL with:         │
│  - client_id                            │
│  - redirect_uri                         │
│  - state (workspace + agent IDs)        │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Notion: Authorization Page             │
│  User selects pages and clicks          │
│  "Allow access"                         │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Frontend: /api/notion/callback         │
│  Receives: code, state                  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Backend: /api/notion/oauth/callback    │
│  Exchanges code for access_token        │
│  Returns: token + workspace info        │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Frontend: Store in Firestore           │
│  Collection: notionConnections          │
│  ID: {workspaceId}_notion               │
│  Data: accessToken, workspaceInfo       │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  User: Can now import Notion content    │
└─────────────────────────────────────────┘
```

### Content Import Flow

```
User selects Notion page
       │
       ▼
Backend: /api/notion/import-page
  1. Fetch page content from Notion API
  2. Convert blocks to text
  3. Chunk content (800 chars)
  4. Generate embeddings (Voyage)
  5. Store in Qdrant (hybrid vectors)
       │
       ▼
Frontend: Create Firestore record
  Collection: agentKnowledge
  Type: "notion"
  Metadata: pageId, url, chunks
       │
       ▼
User: Content searchable in agent
```

---

## 🗂️ Firestore Schema

### notionConnections Collection

```typescript
{
  id: "{workspaceId}_notion",
  workspaceId: string,
  agentId: string | null,  // Optional agent-specific connection
  accessToken: string,      // OAuth access token
  notionWorkspaceId: string,
  notionWorkspaceName: string,
  notionWorkspaceIcon: string,
  botId: string,
  owner: {
    type: "user" | "workspace",
    user?: { id: string, name: string, email: string }
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### agentKnowledge Collection (Notion Items)

```typescript
{
  id: string,
  agentId: string,
  workspaceId: string,
  title: string,
  content: string,
  type: "notion",
  notionPageId: string,
  notionUrl: string,
  chunksCreated: number,
  embeddingProvider: "voyage" | "openai",
  embeddingModel: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] Notion OAuth integration created and configured
- [ ] Client ID and Secret added to production backend `.env`
- [ ] Redirect URI updated for production domain
- [ ] Frontend `NEXT_PUBLIC_BACKEND_URL` points to production backend
- [ ] Firestore security rules deployed
- [ ] Backend endpoints tested with production credentials
- [ ] OAuth flow tested end-to-end in production
- [ ] Error handling tested (invalid tokens, expired codes, etc.)
- [ ] User documentation updated with connection instructions

---

## 📚 API Reference

### Backend Endpoints

#### `GET /api/notion/oauth/authorize`

Initiates OAuth flow by redirecting to Notion.

**Query Parameters:**
- `workspace_id` (required): Workspace ID to associate the connection
- `agent_id` (optional): Agent ID for agent-specific connections

**Response:**
- Redirects to Notion authorization page

---

#### `POST /api/notion/oauth/callback`

Handles OAuth callback and exchanges code for token.

**Request Body:**
```json
{
  "code": "authorization_code_from_notion",
  "state": "workspace_id:agent_id"
}
```

**Response:**
```json
{
  "success": true,
  "access_token": "secret_...",
  "workspace_id": "workspace_id",
  "agent_id": "agent_id",
  "notion_workspace_id": "...",
  "notion_workspace_name": "My Workspace",
  "notion_workspace_icon": "...",
  "bot_id": "...",
  "owner": {...}
}
```

---

### Frontend Utilities

**`app/lib/notion-utils.ts`**

```typescript
// Get Notion connection for workspace
getNotionConnection(workspaceId: string): Promise<NotionConnection | null>

// Disconnect Notion from workspace
disconnectNotion(workspaceId: string): Promise<boolean>

// Search pages in connected Notion workspace
searchNotionPages(accessToken: string, query?: string): Promise<{...}>

// Import single Notion page
importNotionPage(
  accessToken: string,
  pageId: string,
  agentId: string,
  workspaceId: string,
  title?: string
): Promise<{...}>

// Import entire Notion database
importNotionDatabase(
  accessToken: string,
  databaseId: string,
  agentId: string,
  workspaceId: string
): Promise<{...}>

// Initiate OAuth flow
initiateNotionOAuth(workspaceId: string, agentId?: string): void
```

---

## 🎯 Next Steps

After successful setup:

1. **User Documentation**: Create user-facing guide on how to connect Notion
2. **Auto-Sync** (Future): Implement webhooks for automatic content updates
3. **Selective Sync** (Future): Allow users to choose specific databases/pages
4. **Sync Status** (Future): Show last sync time and pending updates
5. **Rich Content** (Future): Preserve images, tables, and formatting

---

## 📞 Support

If you encounter issues:

1. Check logs in backend console for detailed errors
2. Verify all environment variables are set correctly
3. Test with Notion API directly using curl/Postman
4. Review Notion integration settings in Notion dashboard
5. Check Firestore security rules are deployed

**Common Log Locations:**
- Backend: `backend/app/routers/notion_router.py` (search for print statements)
- Frontend: Browser console and Next.js terminal

---

**Last Updated:** 2025-11-02
**Version:** 1.0.0
**Status:** ✅ Production Ready

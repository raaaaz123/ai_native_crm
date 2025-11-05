# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rexa Engage is an AI-native customer engagement platform featuring intelligent chatbots, knowledge base management, review systems, and workspace collaboration. The platform uses advanced hybrid RAG (Retrieval-Augmented Generation) with dual vector search (dense + sparse) and Voyage AI reranking.

**Tech Stack:**
- Frontend: Next.js 15.5.3 (App Router), React 19, TypeScript, Tailwind CSS 4
- Backend: FastAPI (Python 3.11), Uvicorn
- Databases: Firebase Firestore (NoSQL), Qdrant Cloud (Vector DB)
- AI: OpenRouter (LLM), OpenAI (embeddings), Voyage AI (embeddings & reranking)
- Auth: Firebase Auth (Google OAuth + Email/Password)

## Development Commands

### Frontend (Next.js)
```bash
# Development server with Turbopack (http://localhost:3000)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Backend (FastAPI)
```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements-pinecone.txt

# Run development server (default: http://0.0.0.0:8001)
python main.py

# Or with uvicorn directly
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

### Environment Variables
- Frontend: `.env.local` (Firebase config, `NEXT_PUBLIC_API_URL`)
- Backend: `.env` (Qdrant, OpenAI, Voyage, OpenRouter, Firebase project ID)

## Architecture

### Multi-Tenant Workspace System
The codebase has transitioned from a company-based system to a workspace-based multi-tenant architecture:

- **Workspaces** (`workspaces/` collection): Top-level containers for organizations
- **Workspace Members** (`workspace_members/` collection): User memberships with roles (owner, admin, member)
- **Agents** (`agents/` collection): AI agents scoped to workspaces
- **Agent Channels** (`agentChannels/` collection): Deployment channels for agents

**Key Files:**
- `app/lib/workspace-auth-context.tsx` - Workspace authentication and context
- `app/lib/workspace-firestore-utils.ts` - Workspace CRUD operations
- `app/lib/workspace-types.ts` - TypeScript types for workspaces
- `app/lib/agent-utils.ts` - Agent management utilities
- `app/lib/agent-types.ts` - Agent type definitions

**Pattern:** All new features should be workspace-scoped. Legacy company-based code still exists but is being phased out.

### Hybrid RAG System
The core intelligence system uses dual vector search with reranking:

1. **Dual Vector Storage** (Qdrant):
   - Dense vectors: 3072-dim (OpenAI) or 1024-dim (Voyage) for semantic search
   - Sparse vectors: BM42 algorithm for keyword matching

2. **Search Pipeline**:
   ```
   Query → Generate Dense+Sparse Vectors → Qdrant Hybrid Search (RRF Fusion)
   → Top 15 Candidates → Voyage Reranker → Top 5 Results → LLM Response
   ```

3. **Performance**:
   - Accuracy: 95%+ on exact keywords, 90%+ on semantic queries
   - Latency: ~18ms total overhead
   - Cost: $0.00013 per query

**Key Files:**
- `backend/app/services/qdrant_service.py` - Vector storage and hybrid search
- `backend/app/services/voyage_service.py` - Voyage embeddings
- `backend/app/services/reranker_service.py` - Voyage reranking
- `backend/app/services/ai_service.py` - LLM integration and RAG orchestration
- `backend/app/services/openrouter_service.py` - OpenRouter LLM gateway

**Configuration:**
- Qdrant collection: `rexa-engage`
- Chunking: 800 chars with 200 char overlap
- Search limit: 15 candidates for reranking, top 5 for LLM context
- RRF formula: `1/(60 + rank)`

### Frontend Structure
Uses Next.js 15 App Router with these key patterns:

- **Server Components**: Default for pages
- **Client Components**: Mark with `'use client'` for interactivity
- **Context Providers**: `WorkspaceAuthProvider` for auth/workspace state
- **Route Organization**:
  - `/app/page.tsx` - Public landing page
  - `/app/dashboard/` - Protected dashboard routes
  - `/app/dashboard/[workspace]/` - Workspace-scoped routes (new pattern)
  - `/app/api/` - API routes for server-side logic

**UI Components:**
- `app/components/ui/` - Shared primitives (duplicated in `components/ui/`)
- Built on Radix UI primitives
- Styled with Tailwind CSS utility classes
- Use `cn()` helper from `lib/utils` for conditional classes

### Backend Structure
FastAPI with modular router pattern:

- **Routers** (`backend/app/routers/`): API endpoint handlers
  - `ai_router.py` - Chat and AI responses
  - `knowledge_router.py` - Knowledge base CRUD
  - `crawler_router.py` - Website scraping
  - `review_router.py` - Review forms and submissions
  - `health_router.py` - Health checks

- **Services** (`backend/app/services/`): Business logic layer
  - `qdrant_service.py` - Vector database operations
  - `ai_service.py` - LLM orchestration
  - `firestore_service.py` - Firestore operations
  - `email_service.py` - Email sending
  - `web_crawler.py` - Website crawling

- **Models** (`backend/app/models.py`): Pydantic data models
- **Config** (`backend/app/config.py`): Environment-based configuration

### Data Flow Patterns

#### AI Chat Flow
```
Widget → Frontend → /api/ai/chat → Backend
  → Generate vectors (dense + sparse)
  → Qdrant hybrid search (15 candidates)
  → Voyage reranker (top 5)
  → LLM generation with context
  → Save to Firestore → Response to widget
```

#### Knowledge Base Upload
```
Dashboard → Upload file → Extract text (PyPDF2/pdfplumber)
  → Chunk text (800/200 overlap)
  → Generate embeddings (dense + sparse)
  → Store in Qdrant + Firestore metadata
  → Update UI
```

#### Workspace Context Loading
```
Login → Auth state change → Load user data
  → Query workspace_members → Load workspace details
  → Set current workspace → Update context
  → Dashboard loads workspace-scoped data
```

### Firestore Collections

**Workspace System (Primary):**
- `workspaces/{workspaceId}` - Workspace metadata
- `workspace_members/{userId_workspaceId}` - Memberships
- `workspace_invites/{inviteId}` - Pending invites
- `agents/{agentId}` - AI agents per workspace
- `agentChannels/{channelId}` - Agent deployment channels

**Company System (Legacy - being phased out):**
- `companies/{companyId}` - Company profiles
- `companyMembers/{memberId}` - Team members
- `companyInvites/{inviteId}` - Team invitations

**Core Collections:**
- `users/{userId}` - User profiles with subscription data
- `chatWidgets/{widgetId}` - Widget configurations
- `chatConversations/{conversationId}` - Conversation threads
- `chatMessages/{messageId}` - Individual messages
- `knowledgeBase/{itemId}` - Knowledge base metadata
- `reviewForms/{formId}` - Review form definitions
- `reviewSubmissions/{submissionId}` - User submissions

**Security:** Firestore rules enforce workspace membership checks. See `firestore.rules` for access patterns.

### Subscription System
- **Free Trial**: 14 days auto-initialized on signup
- **Paid Plans**: Starter ($29/mo), Professional ($99/mo), Enterprise ($299/mo)
- **User Data Model**: Includes `subscriptionPlan`, `subscriptionStatus`, `trialStartDate`, `trialEndDate`
- **Implementation**: `app/lib/subscription-utils.ts`

### Agent System
AI agents are workspace-scoped entities that can be deployed to multiple channels:

**Agent Properties:**
- `id`, `workspaceId`, `name`, `status` (active/inactive/training)
- `settings`: model, temperature, maxTokens, systemPrompt
- `knowledgeSources`: Links to knowledge base items
- `stats`: totalConversations, totalMessages, lastActiveAt

**Agent Channels:**
- Multiple deployment channels per agent (chat widget, API, etc.)
- Each channel has unique ID and configuration
- Channels inherit agent settings but can override

**Files:**
- `app/lib/agent-utils.ts` - Agent CRUD operations
- `app/lib/agent-channel-utils.ts` - Channel management
- `app/lib/agent-types.ts` - Type definitions

## Common Development Patterns

### Adding a New Dashboard Feature
1. Create page in `app/dashboard/[feature]/page.tsx`
2. Add workspace-scoped data fetching using `workspace_members` check
3. Use `WorkspaceAuthProvider` context for current workspace
4. Add Firestore security rules for the new collection
5. Test with different workspace roles (owner, admin, member)

### Adding a New AI Model
1. Update `backend/app/config.py` with new model configuration
2. Add model to `backend/app/services/openrouter_service.py`
3. Update frontend AI config types in widget settings
4. Test token limits and pricing
5. Update documentation

### Adding a New Knowledge Source Type
1. Add type to `knowledgeBase` collection schema
2. Implement extraction in backend service (e.g., `notion_service.py`)
3. Generate embeddings using `qdrant_service.py`
4. Update frontend UI in `app/dashboard/knowledge-base/`
5. Add Qdrant payload metadata for filtering

### Working with Vector Search
- Always generate both dense and sparse vectors for new content
- Use `QdrantService.add_document()` for single items
- Use `QdrantService.add_documents_batch()` for bulk uploads
- Delete vectors using `QdrantService.delete_by_item_id()` (deletes all chunks)
- Search with `QdrantService.hybrid_search()` for best results
- Enable reranking for production queries

## Deployment

### Frontend (Vercel)
- Auto-deploys from Git on push
- Environment variables set in Vercel dashboard
- Production URL: https://ai-native-crm.vercel.app
- Preview deployments for PRs

### Backend (Render.com)
- Auto-deploys from Git (master branch)
- Configuration: `backend/render.yaml`
- Production URL: https://git-branch-m-main.onrender.com
- Health check: GET `/health`
- Logs available in Render dashboard

### Alternative Backend (Google Cloud Run)
- Dockerfile: `backend/Dockerfile`
- App Engine config: `backend/app.yaml`
- Deploy: `gcloud app deploy backend/app.yaml`

## Important Notes

### Code Organization
- Avoid duplicating UI components between `app/components/ui/` and `components/ui/`
- New workspace features should go in `app/dashboard/[workspace]/`
- Legacy company code exists but should not be extended
- Keep backend services focused and modular

### Performance Considerations
- Hybrid search adds only ~18ms latency vs. dense-only
- Reranking adds ~15ms but improves accuracy by 18%
- Chunk size (800 chars) is optimized for context quality
- Use batch operations for bulk knowledge base uploads

### Security
- Never commit API keys or credentials
- Workspace membership must be verified for all protected routes
- Firestore rules are the primary security layer
- Backend validates Firebase Auth tokens on protected endpoints

### Testing
- Test workspace isolation thoroughly
- Verify agent knowledge sources are properly linked
- Test subscription expiration and trial periods
- Validate vector search accuracy with diverse queries
- Check CORS settings for new frontend origins

## Key Documentation
- `HYBRID_SEARCH_IMPLEMENTATION.md` - Comprehensive RAG documentation
- `SUBSCRIPTION_SYSTEM.md` - Subscription and trial system
- `NOTION_INTEGRATION.md` - Notion integration guide
- `RERANKER_IMPLEMENTATION.md` - Voyage reranker details
- `firestore.rules` - Security rules and access patterns

# Project Structure

## Monorepo Layout

This is a monorepo containing both frontend (Next.js) and backend (FastAPI) in a single repository.

## Frontend Structure (`/app`)

```
app/
├── api/              # Next.js API routes
├── components/       # Shared React components
│   └── layout/       # Layout-specific components
├── conversations/    # Conversation management pages
├── dashboard/        # Main dashboard pages
├── invite/           # Team invitation flow
├── review/           # Review form pages
├── signin/           # Authentication pages
├── signup/           # Registration pages
├── widget/           # Embeddable widget pages
├── lib/              # Utility functions and contexts
├── layout.tsx        # Root layout with AuthProvider
├── page.tsx          # Landing page
└── globals.css       # Global styles
```

## Backend Structure (`/backend`)

```
backend/
├── app/
│   ├── main.py           # FastAPI application
│   ├── config.py         # Configuration settings
│   ├── models.py         # Pydantic models
│   ├── services/         # Business logic
│   │   ├── qdrant_service.py    # Vector operations
│   │   ├── ai_service.py        # AI/RAG operations
│   │   └── review_service.py    # Review forms
│   └── routers/          # API endpoints
│       ├── health_router.py     # Health checks
│       ├── knowledge_router.py  # Knowledge base
│       ├── ai_router.py         # AI chat
│       └── review_router.py     # Review forms
├── main.py               # Entry point
├── test_*.py            # Test scripts
└── requirements-pinecone.txt  # Python dependencies
```

## Shared Components (`/components`)

- Reusable UI components (shadcn/ui)
- Located at root level for cross-app usage

## Public Assets (`/public`)

- Static files, images, and embeddable scripts
- Widget embed scripts: `widget-embed.js`, `review-embed.js`

## Configuration Files

- `next.config.ts` - Next.js configuration with image domains
- `tsconfig.json` - TypeScript configuration with path aliases (`@/*`)
- `components.json` - shadcn/ui configuration (New York style)
- `firebase.json` - Firestore rules and hosting setup
- `firestore.rules` - Security rules for Firestore
- `firestore.indexes.json` - Database indexes

## Documentation

Multiple markdown files document specific features:
- `EMAIL_SETUP.md`, `TEAM_INVITE_EMAIL_SETUP.md` - Email configuration
- `HYBRID_SEARCH_IMPLEMENTATION.md` - Search functionality
- `MESSAGE_NOTIFICATION_SYSTEM.md` - Notification system
- `NOTION_INTEGRATION.md`, `NOTION_SETUP_GUIDE.md` - Notion integration
- `SUBSCRIPTION_SYSTEM.md` - Subscription management
- `GPT5_MINI_INTEGRATION.md` - AI model integration

## Key Conventions

- **Path Aliases**: Use `@/` for imports from root (e.g., `@/components/ui/button`)
- **Component Style**: shadcn/ui New York style with Radix UI primitives
- **API Routes**: Backend at `/api/*` endpoints, served from FastAPI on port 8001
- **Authentication**: Firebase Auth with workspace context provider
- **Styling**: Tailwind CSS with custom configuration, Inter font family
- **TypeScript**: Strict mode enabled, ES2017 target

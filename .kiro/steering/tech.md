# Technology Stack

## Frontend

- **Framework**: Next.js 15.5.3 (App Router)
- **React**: 19.1.0
- **TypeScript**: 5.x with strict mode enabled
- **Styling**: Tailwind CSS 4.x
- **UI Components**: shadcn/ui (New York style) with Radix UI primitives
- **Icons**: Lucide React
- **Authentication**: Firebase 12.3.0
- **Markdown**: react-markdown with syntax highlighting (rehype-highlight)
- **Drag & Drop**: @hello-pangea/dnd

## Backend

- **Framework**: FastAPI
- **Runtime**: Python with uvicorn server
- **Vector Database**: Qdrant (migrated from Pinecone)
- **AI/LLM**: OpenRouter API with Grok model (x-ai/grok-4-fast:free)
- **Embeddings**: ChromaDB (free) or OpenAI
- **RAG Framework**: LangChain
- **Document Processing**: PyPDF2, pdfplumber, BeautifulSoup4
- **Database**: Firebase Admin SDK for Firestore

## Development Tools

- **Package Manager**: npm
- **Linting**: ESLint 9
- **Build Tool**: Next.js Turbopack

## Common Commands

### Frontend
```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Backend
```bash
# Install dependencies
pip install -r backend/requirements-pinecone.txt

# Run development server
python backend/main.py

# Test endpoints
python backend/test_endpoints.py

# Test OpenRouter integration
python backend/test_openrouter.py
```

## Environment Configuration

- Frontend: `.env.local` for local development, `.env.production` for production
- Backend: `backend/.env` with Qdrant, OpenRouter, and Firebase credentials
- Firebase: `firebase.json` for Firestore rules and hosting configuration

## Deployment

- **Frontend**: Vercel (recommended) or Firebase Hosting
- **Backend**: Render (free tier), Railway, or Google Cloud Run
- **Port Configuration**: Backend uses dynamic PORT env variable for cloud platforms

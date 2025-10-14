# 🚀 Frontend-Backend Integration Setup Guide

## ✅ **Integration Complete!**

Your AI-powered chat widget system is now fully integrated with the FastAPI backend. Here's what has been implemented:

### **🔗 What's Connected:**

#### **1. API Client (`app/lib/api-client.ts`)**
- Complete TypeScript API client for FastAPI backend
- Type-safe interfaces for all endpoints
- Error handling and response formatting
- Support for all AI, Knowledge Base, and Chat APIs

#### **2. Enhanced Chat Widget (`app/widget/[id]/page.tsx`)**
- ✅ **AI Response Integration**: Real-time AI responses using backend
- ✅ **Confidence Scoring**: Shows AI confidence levels
- ✅ **Fallback Handling**: Automatic human handoff when AI confidence is low
- ✅ **Source Attribution**: Shows knowledge base sources used
- ✅ **Visual Indicators**: AI thinking states and response metadata

#### **3. Knowledge Base Integration (`app/dashboard/knowledge-base/page.tsx`)**
- ✅ **Backend Upload**: Documents processed via FastAPI backend
- ✅ **AI Search**: Semantic search using vector embeddings
- ✅ **Real-time Processing**: Document processing status tracking
- ✅ **Fallback Support**: Local processing if backend unavailable

#### **4. AI-Powered Conversations (`app/dashboard/conversations/page.tsx`)**
- ✅ **AI Toggle**: Enable/disable AI responses per conversation
- ✅ **Smart Responses**: AI generates contextual responses
- ✅ **Confidence Monitoring**: Track AI response quality
- ✅ **Human Handoff**: Seamless transition to human agents

### **🛠️ Setup Instructions:**

#### **Step 1: Start the Backend**
```bash
cd backend
python start.py
```
- Backend will run on: http://localhost:8001
- API Documentation: http://localhost:8001docs

#### **Step 2: Start the Frontend**
```bash
npm run dev
```
- Frontend will run on: http://localhost:3000

#### **Step 3: Test the Integration**
```bash
node test-integration.js
```

### **🎯 Key Features Implemented:**

#### **AI Chat Widget Features:**
- **Multi-LLM Support**: OpenAI, Anthropic, Google, Local models
- **RAG Pipeline**: Retrieval-Augmented Generation with knowledge base
- **Confidence Scoring**: AI response quality assessment
- **Source Attribution**: Shows which knowledge base items were used
- **Fallback Handling**: Automatic human handoff when needed

#### **Knowledge Base Features:**
- **Document Processing**: PDF, DOCX, TXT, HTML support
- **Vector Search**: Semantic search using embeddings
- **Real-time Indexing**: Automatic document processing and indexing
- **Search Analytics**: Track search performance and usage

#### **Conversation Management:**
- **AI Toggle**: Enable/disable AI per conversation
- **Smart Responses**: Context-aware AI responses
- **Status Management**: Track conversation status and AI involvement
- **Analytics**: Monitor AI performance and usage

### **🔧 Configuration:**

#### **Environment Variables (`.env.local`):**
```env
# AI Backend API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000

# Firebase Configuration (already set)
NEXT_PUBLIC_FIREBASE_API_KEY=your-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=rexa-engage.firebaseapp.com
# ... other Firebase config
```

#### **Backend Configuration (`.env`):**
```env
# Firebase Configuration
FIREBASE_PROJECT_ID=rexa-engage
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# AI API Keys (optional)
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
GOOGLE_API_KEY=your-google-key

# Pinecone Configuration (optional)
PINECONE_API_KEY=your-pinecone-key
```

### **📊 API Endpoints Available:**

#### **Chat API:**
- `POST /api/chat/ai-respond` - Generate AI responses
- `POST /api/chat/feedback` - Submit user feedback
- `GET /api/chat/conversation/{id}` - Get conversation history

#### **Knowledge Base API:**
- `POST /api/knowledge-base/upload` - Upload documents
- `POST /api/knowledge-base/search` - Search knowledge base
- `GET /api/knowledge-base/items/{widget_id}` - Get widget items

#### **LLM API:**
- `GET /api/llm/providers` - Get available LLM providers
- `POST /api/llm/test` - Test LLM configuration
- `GET /api/llm/health` - Check LLM health

#### **RAG API:**
- `POST /api/rag/retrieve` - Retrieve relevant context
- `POST /api/rag/generate` - Generate RAG responses
- `GET /api/rag/performance/{widget_id}` - Get performance metrics

### **🧪 Testing the Integration:**

#### **1. Test Chat Widget with AI:**
1. Go to: http://localhost:3000/dashboard
2. Create a chat widget
3. Visit: http://localhost:3000/widget/{widget-id}
4. Start a conversation
5. AI should respond automatically

#### **2. Test Knowledge Base:**
1. Go to: http://localhost:3000/dashboard/knowledge-base
2. Select a widget
3. Upload a document (PDF, TXT, etc.)
4. Search for content
5. AI should use the knowledge base for responses

#### **3. Test AI Conversations:**
1. Go to: http://localhost:3000/dashboard/conversations
2. Select a conversation
3. Enable "AI responses" toggle
4. Send a message
5. AI should generate a response

### **🚨 Troubleshooting:**

#### **Backend Not Starting:**
```bash
cd backend
pip install -r requirements-minimal.txt
python start.py
```

#### **Frontend Not Connecting:**
- Check if backend is running on port 8001
- Verify `NEXT_PUBLIC_API_URL` in `.env.local`
- Check browser console for CORS errors

#### **AI Not Responding:**
- Check if OpenAI/Anthropic API keys are set
- Verify Pinecone configuration
- Check backend logs for errors

#### **Firebase Connection Issues:**
- Verify Firebase credentials in backend `.env`
- Check Firestore security rules
- Ensure Firebase project is active

### **📈 Next Steps:**

1. **Add API Keys**: Get OpenAI, Anthropic, or Google API keys for AI responses
2. **Set up Pinecone**: Configure vector database for better search
3. **Test AI Responses**: Upload documents and test AI-powered conversations
4. **Monitor Performance**: Use the analytics endpoints to track usage
5. **Deploy**: Set up production environment with proper API keys

### **🎉 Success Indicators:**

- ✅ Backend running on http://localhost:8001
- ✅ Frontend running on http://localhost:3000
- ✅ Chat widget shows AI responses
- ✅ Knowledge base search works
- ✅ Conversations have AI toggle
- ✅ Firebase connection established

Your AI-powered chat widget system is now fully integrated and ready for testing! 🚀

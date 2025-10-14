# Modular Backend API

This is a refactored, modular version of the Pinecone Knowledge Base API. The original monolithic `pinecone_backend.py` file has been broken down into organized modules for better maintainability and scalability.

## 🏗️ Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # Main FastAPI application
│   ├── config.py              # Configuration settings
│   ├── models.py              # Pydantic models
│   ├── services/              # Business logic services
│   │   ├── __init__.py
│   │   ├── pinecone_service.py    # Pinecone vector operations
│   │   ├── ai_service.py          # AI/RAG operations
│   │   └── review_service.py      # Review form operations
│   └── routers/               # API route handlers
│       ├── __init__.py
│       ├── health_router.py      # Health check endpoints
│       ├── knowledge_router.py   # Knowledge base endpoints
│       ├── ai_router.py           # AI chat endpoints
│       └── review_router.py       # Review form endpoints
├── main.py                   # Entry point (maintains same API structure)
├── requirements.txt          # Python dependencies
├── test_endpoints.py        # Endpoint testing script
└── README.md               # This file
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Set Environment Variables
Create a `.env` file with:
```env
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_INDEX_NAME=rexa-engage
OPENAI_API_KEY=your-openai-api-key
OPENROUTER_API_KEY=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
OPENROUTER_SITE_URL=http://localhost:3000
OPENROUTER_SITE_NAME=Rexa CRM
```

### 3. Run the Server
```bash
python main.py
```

The API will be available at `http://localhost:8001`

## 📚 API Endpoints

### Health & Testing
- `GET /` - Root health check
- `GET /health` - Detailed health status
- `POST /api/test-pinecone` - Test Pinecone connection
- `POST /api/test-store-dummy` - Test dummy data storage
- `POST /api/test-openrouter` - Test OpenRouter API connection

### Knowledge Base
- `POST /api/knowledge-base/store` - Store knowledge item
- `POST /api/knowledge-base/upload` - Upload document (PDF/text)
- `POST /api/knowledge-base/search` - Search knowledge base
- `DELETE /api/knowledge-base/delete/{item_id}` - Delete knowledge item

### AI Chat
- `POST /api/ai/chat` - Generate AI response using OpenRouter (Grok model) with RAG

### Review Forms
- `POST /api/review-forms/` - Create review form
- `GET /api/review-forms/business/{business_id}` - Get business forms
- `GET /api/review-forms/{form_id}` - Get specific form
- `POST /api/review-forms/{form_id}/submit` - Submit review
- `GET /api/review-forms/{form_id}/submissions` - Get submissions
- `GET /api/review-forms/{form_id}/analytics` - Get analytics
- `PUT /api/review-forms/{form_id}` - Update form
- `DELETE /api/review-forms/{form_id}` - Delete form

## 🧪 Testing

### Test All Endpoints
Run the comprehensive endpoint test script:
```bash
python test_endpoints.py
```

### Test OpenRouter Integration
Run the OpenRouter-specific test script:
```bash
python test_openrouter.py
```

These will test all API endpoints to ensure they work correctly.

## 🤖 OpenRouter Integration

The backend now uses **OpenRouter API** with the **Grok model** instead of OpenAI:

### ✅ **Features:**
- **Free Grok Model**: Uses `x-ai/grok-4-fast:free` for cost-effective AI responses
- **RAG Support**: Full Retrieval-Augmented Generation with Pinecone knowledge base
- **Fallback Handling**: Graceful error handling and human fallback options
- **Context Awareness**: Uses business knowledge base for accurate responses

### ✅ **Configuration:**
- **API Key**: Pre-configured with your OpenRouter API key
- **Site Tracking**: Includes site URL and name for OpenRouter rankings
- **Model Selection**: Easy to switch between different OpenRouter models

### ✅ **Benefits:**
- **Cost Effective**: Free Grok model reduces API costs
- **High Performance**: Fast response times with Grok
- **Reliable**: OpenRouter provides stable API access
- **Flexible**: Easy to switch models or providers

## 🔧 Benefits of Modular Structure

### ✅ **Maintainability**
- Each module has a single responsibility
- Easy to locate and modify specific functionality
- Clear separation of concerns

### ✅ **Scalability**
- Services can be easily extended or replaced
- New features can be added without affecting existing code
- Better code organization for team development

### ✅ **Testability**
- Individual services can be unit tested
- Mock services can be easily created for testing
- Better error isolation and debugging

### ✅ **Code Reusability**
- Services can be reused across different routers
- Common functionality is centralized
- Easier to maintain consistent behavior

## 🔄 Migration from Monolithic Structure

The modular backend maintains **100% API compatibility** with the original `pinecone_backend.py`. All endpoints, request/response formats, and functionality remain exactly the same.

### What Changed:
- **Code organization**: Split into logical modules
- **File structure**: Organized into services and routers
- **Import structure**: Cleaner dependency management

### What Stayed the Same:
- **All API endpoints**: Same URLs and methods
- **Request/Response formats**: Identical data structures
- **Functionality**: All features work exactly the same
- **Configuration**: Same environment variables and settings

## 🛠️ Development

### Adding New Features
1. **New Service**: Add to `app/services/`
2. **New Router**: Add to `app/routers/`
3. **New Models**: Add to `app/models.py`
4. **Update Main**: Include new router in `app/main.py`

### Modifying Existing Features
1. **Service Logic**: Update the relevant service file
2. **API Endpoints**: Update the relevant router file
3. **Data Models**: Update `app/models.py`

## 📝 Notes

- The original `pinecone_backend.py` file is preserved for reference
- All API calls from the frontend will continue to work without changes
- The modular structure makes it easier to add new features and maintain the codebase
- Each service is self-contained and can be tested independently

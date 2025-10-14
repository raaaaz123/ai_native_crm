# RAG Integration Fix & Testing Guide

## Issues Fixed

### 1. **AI Not Using Pinecone Vector Database**
**Problem**: The AI was giving generic responses without retrieving data from the knowledge base.

**Root Causes**:
- RAG was disabled by default in widget creation
- BusinessId was not being passed correctly to the AI endpoint
- Model dropdown was limited and didn't include free OpenRouter models
- Insufficient logging made debugging difficult

**Solutions Implemented**:
- ✅ Enabled RAG by default in all new widgets
- ✅ Set default provider to OpenRouter with free model (Google Gemini 2.0 Flash)
- ✅ Added businessId to WidgetPreview component
- ✅ Enhanced backend logging for RAG retrieval debugging
- ✅ Updated AI Configuration UI with proper model dropdown

### 2. **OpenRouter Integration**
**Problem**: Need to use OpenRouter API with proper headers and free models.

**Solution**: 
- ✅ OpenRouter is already properly integrated in backend (`openrouter_service.py`)
- ✅ Uses OpenAI client with OpenRouter base URL
- ✅ Includes required headers: `HTTP-Referer` and `X-Title`
- ✅ Added free model options to frontend dropdown

### 3. **Model Selection Limited**
**Problem**: Frontend only had generic provider/model inputs.

**Solution**:
- ✅ Added dropdown with curated free models:
  - `google/gemini-2.0-flash-exp:free` (Default)
  - `deepseek/deepseek-chat-v3.1:free`
  - `meta-llama/llama-3.2-3b-instruct:free`
  - `microsoft/phi-3-mini-128k-instruct:free`
  - Plus paid options (GPT-3.5, GPT-4, Claude-3)

---

## How RAG Works Now

### Flow Diagram
```
User Question
    ↓
Widget Preview/Chat
    ↓
Frontend sends to /api/ai/chat with:
    - message
    - widgetId
    - businessId ✅ (NOW INCLUDED)
    - aiConfig (with ragEnabled: true ✅)
    ↓
Backend AI Service
    ↓
Pinecone Vector Search
    - Filter: businessId ✅
    - Query: user's message
    - Returns: top 5 relevant docs
    ↓
OpenRouter API (with context)
    - Model: google/gemini-2.0-flash-exp:free
    - Context: Retrieved knowledge base docs
    - System Prompt: Instructs AI to use context
    ↓
AI Response (RAG-enhanced)
    - Uses knowledge base data
    - Includes confidence score
    - Lists source documents
    ↓
Display to User
```

---

## Testing RAG Integration

### Step 1: Add Knowledge Base Items

1. **Navigate to Knowledge Base**:
   ```
   Dashboard → Knowledge Base
   ```

2. **Add a Test Document**:
   - Click "Add Knowledge"
   - Enter title: "Business Hours"
   - Enter content:
     ```
     Our business hours are:
     Monday - Friday: 9:00 AM - 5:00 PM
     Saturday: 10:00 AM - 3:00 PM
     Sunday: Closed
     
     We are available 24/7 for emergency support via email.
     ```
   - Click "Save"

3. **Add More Test Documents** (recommended):
   - "Pricing Information"
   - "Return Policy"
   - "Contact Information"
   - "Product Features"

### Step 2: Verify Widget Configuration

1. **Go to Widgets Page**:
   ```
   Dashboard → Widgets → [Your Widget] → Customize
   ```

2. **Check AI Configuration**:
   - ✅ Enable AI Assistant: **ON**
   - ✅ AI Provider: **OpenRouter (Recommended)**
   - ✅ AI Model: **Google Gemini 2.0 Flash (Free)**
   - ✅ Enable RAG: **ON**
   - ✅ Use knowledge base for responses: **ON**
   - ✅ Transfer to human when AI is uncertain: **ON**

3. **Save Changes**

### Step 3: Test in Widget Preview

1. **Open Widget Customization Page**
2. **Click the floating chat button** (bottom-right or bottom-left)
3. **Enter customer info** (name, email if required)
4. **Ask test questions**:

   **Test 1: Business Hours**
   ```
   Question: "What are your business hours?"
   
   Expected Result:
   ✅ AI should respond with the exact hours from knowledge base
   ✅ Should show confidence score (0.8-1.0)
   ✅ Should list source documents
   ✅ Response should be specific, not generic
   ```

   **Test 2: Unrelated Question**
   ```
   Question: "What's the weather like today?"
   
   Expected Result:
   ✅ AI should show lower confidence (<0.6)
   ✅ Should suggest connecting with human agent
   ✅ Should NOT make up weather information
   ```

   **Test 3: Greeting**
   ```
   Question: "Hello!"
   
   Expected Result:
   ✅ AI should respond warmly
   ✅ Should offer to help
   ✅ May have medium confidence
   ```

### Step 4: Check Backend Logs

**Run the backend and watch the logs**:

```bash
cd backend
python -m app.main
```

**When you ask a question in the chat, you should see**:

```
🔍 RAG RETRIEVAL DEBUG:
   Widget ID: abc123
   Business ID: xyz789 ✅ (Should NOT be empty)
   Search Filter: {'businessId': 'xyz789'}
   Query: 'What are your business hours?'
   Max Docs: 5

📊 RAG RETRIEVAL RESULTS:
   Documents Found: 2 ✅ (Should be > 0)

   Document 1:
      Score: 0.8543
      Metadata: {'businessId': 'xyz789', 'title': 'Business Hours', ...}
      Content Preview: Our business hours are: Monday - Friday...

📝 CONTEXT FOR AI:
   Total Sources: 2
   Context Length: 487 chars
   Top Source: Business Hours (score: 0.8543)

🤖 OpenRouter Response - Length: 156 chars

🎯 Fallback Decision:
   Confidence: 0.85
   Threshold: 0.6
   Sources: 2
   Fallback enabled: True
   → Should fallback: False ✅ (AI is confident)
```

**⚠️ If you see this WARNING**:
```
⚠️ WARNING: No documents found in knowledge base!
   Make sure you have added knowledge base items for businessId: xyz789
```
**Solution**: You need to add knowledge base items for your business/widget.

---

## Troubleshooting

### Issue 1: "No context available - AI will respond without knowledge base"

**Diagnosis**:
- Check backend logs for: `Documents Found: 0`
- Verify businessId in logs is not empty

**Solutions**:
1. **Add Knowledge Base Items**:
   - Go to Dashboard → Knowledge Base
   - Add documents with proper businessId/widgetId

2. **Check Pinecone Connection**:
   ```bash
   # In backend directory
   curl http://localhost:8001/api/knowledge-base/stats
   ```

3. **Verify OpenAI API Key** (for embeddings):
   - Check `backend/.env` has valid `OPENAI_API_KEY`
   - If not set, embeddings won't work for semantic search

### Issue 2: "AI always gives generic responses"

**Check**:
1. Is RAG enabled in widget config? (Should be ON)
2. Is businessId being passed? (Check browser console)
3. Are there knowledge base items? (Check Dashboard)
4. Check backend logs for retrieval details

### Issue 3: "OpenRouter API error"

**Check**:
1. `backend/.env` has valid `OPENROUTER_API_KEY`
2. Model name is correct (e.g., `google/gemini-2.0-flash-exp:free`)
3. Check backend logs for specific error message

### Issue 4: "Vector store not initialized"

**Diagnosis**: Pinecone or OpenAI embeddings not set up

**Solutions**:
1. Check `backend/.env`:
   ```env
   PINECONE_API_KEY=your-key-here
   OPENAI_API_KEY=your-key-here
   PINECONE_INDEX_NAME=rexa-engage
   ```

2. Restart backend:
   ```bash
   cd backend
   python -m app.main
   ```

---

## Configuration Files Updated

### Frontend Files:
- ✅ `app/dashboard/widgets/[id]/page.tsx` - Customization page
  - Added model dropdown with free options
  - Default AI config: RAG enabled, OpenRouter, Gemini model
  - Pass businessId to WidgetPreview

- ✅ `app/dashboard/widgets/page.tsx` - Widgets list page
  - Updated create widget dialog
  - Default AI config: RAG enabled, OpenRouter, Gemini model

### Backend Files:
- ✅ `backend/app/services/ai_service.py` - Enhanced logging
  - Detailed RAG retrieval logs
  - Context preparation logs
  - Confidence calculation logs
  - Fallback decision logs

---

## Default Configuration (New Widgets)

```javascript
aiConfig: {
  enabled: true,                              // ✅ AI is ON by default
  provider: 'openrouter',                     // ✅ Using OpenRouter
  model: 'google/gemini-2.0-flash-exp:free', // ✅ Free model
  temperature: 0.7,
  maxTokens: 500,
  confidenceThreshold: 0.6,                   // ✅ Lower threshold
  maxRetrievalDocs: 5,
  ragEnabled: true,                           // ✅ RAG is ON
  fallbackToHuman: true                       // ✅ Safe fallback
}
```

---

## Next Steps

1. **Add Knowledge Base Content**:
   - Add at least 5-10 documents to test RAG properly
   - Include FAQs, policies, product info, contact details

2. **Test Different Questions**:
   - Questions that should find knowledge base answers
   - Questions outside your knowledge base
   - Edge cases and complex queries

3. **Monitor Confidence Scores**:
   - Adjust `confidenceThreshold` if needed (0.5 - 0.8 recommended)
   - Lower = more AI responses, Higher = more human handoffs

4. **Customize System Prompts** (optional):
   - Edit `backend/app/services/openrouter_service.py`
   - Modify `generate_rag_response()` system prompt

5. **Production Deployment**:
   - Use environment variables for API keys
   - Consider upgrading to paid models for better quality
   - Monitor usage and costs

---

## Summary of Changes

| Component | Before | After |
|-----------|--------|-------|
| **AI Provider** | Generic "openai" | OpenRouter (recommended) |
| **Default Model** | gpt-3.5-turbo | google/gemini-2.0-flash-exp:free |
| **RAG Enabled** | ❌ False | ✅ True |
| **Model Selection** | Text input | Dropdown with free models |
| **BusinessId** | ❌ Not passed | ✅ Passed to AI endpoint |
| **Logging** | Minimal | ✅ Comprehensive debug logs |
| **Confidence Threshold** | 0.8 (too high) | 0.6 (balanced) |

---

## Support

If you encounter issues:

1. **Check Backend Logs** - Most issues show up there
2. **Verify Environment Variables** - API keys must be valid
3. **Test Knowledge Base** - Must have documents to retrieve
4. **Browser Console** - Check for frontend errors
5. **Network Tab** - Verify API requests are being sent

The RAG integration should now work correctly with proper retrieval from Pinecone! 🎉


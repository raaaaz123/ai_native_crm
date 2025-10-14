# Debugging RAG Integration - Log Analysis Guide

## Critical Changes Made

### 1. **Stronger System Prompt** ✅
The system prompt now **FORCES** the AI to use only the knowledge base context:

```
You are a helpful customer support assistant. You MUST answer questions using ONLY 
the information provided in the KNOWLEDGE BASE CONTEXT below.

===== KNOWLEDGE BASE CONTEXT =====
[Your Pinecone data here]
===== END OF KNOWLEDGE BASE =====

CRITICAL RULES:
1. ONLY use information from the KNOWLEDGE BASE CONTEXT above
2. If the answer is in the context, provide it clearly and directly  
3. DO NOT use your general knowledge or training data
4. DO NOT make up information that is not in the context
```

### 2. **Enhanced Error Logging** ✅
Now you'll see clear errors if Pinecone retrieval fails.

### 3. **Detailed Debug Output** ✅
Every step of the RAG process is now logged.

---

## How to Test

### Step 1: Start the Backend

```bash
cd backend
python -m app.main
```

### Step 2: Ask a Question in the Widget

In your widget preview, ask: **"What are your business hours?"**

### Step 3: Watch the Backend Logs

You should see detailed logs. Here's what to look for:

---

## ✅ SUCCESS: What Good Logs Look Like

### 1. RAG Retrieval (Should find documents)

```
============================================================
🤖 RAG-ENABLED AI RESPONSE
============================================================
   Widget ID: 6k4PxwgXvafUQ7Gj7WUf
   Business ID: ygtGolij4bCKpovFMRF8
   Model: google/gemini-2.0-flash-exp:free
   User Question: What are your business hours?
   RAG Config: maxDocs=5, threshold=0.6

🔍 RAG RETRIEVAL DEBUG:
   Widget ID: 6k4PxwgXvafUQ7Gj7WUf
   Business ID: ygtGolij4bCKpovFMRF8
   Search Filter: {'businessId': 'ygtGolij4bCKpovFMRF8'}
   Query: 'What are your business hours?'
   Max Docs: 5

📊 RAG RETRIEVAL RESULTS:
   Documents Found: 1 ✅ (THIS IS GOOD!)

   Document 1:
      Score: 0.8543
      Metadata: {'businessId': 'ygtGolij4bCKpovFMRF8', 'title': 'hours', ...}
      Content Preview: Question: What are your business hours?

Answer: Our business hours are Monday to Friday, 9:00 AM to 6:00 PM.
We are closed on weekends (Saturday and Sunday)...

📝 CONTEXT RETRIEVED FOR AI:
   Total Sources: 1
   Context Length: 234 chars
   ✅ Top Source: 'hours' (score: 0.8543)
   Preview: Question: What are your business hours?

Answer: Our business hours are Monday to Friday...
============================================================
```

**✅ KEY INDICATORS:**
- `Documents Found: 1` or more (NOT zero!)
- You see the actual content from Pinecone
- businessId matches your company

### 2. Sending to OpenRouter

```
============================================================
🤖 SENDING TO OPENROUTER API
============================================================
   Model: google/gemini-2.0-flash-exp:free
   Temperature: 0.7
   Max Tokens: 500
   User Message: What are your business hours?
   Context Included: Yes ✅ (MUST BE YES!)
   Context Preview: Question: What are your business hours?

Answer: Our business hours are Monday to Friday, 9:00 AM to 6:00 PM...
   System Prompt Length: 456 chars
============================================================
```

**✅ KEY INDICATOR:**
- `Context Included: Yes` ← **CRITICAL!**
- You see the context preview with your business hours

### 3. Receiving AI Response

```
============================================================
✅ RECEIVED FROM OPENROUTER API
============================================================
   Response Length: 120 chars
   Response Preview: Our business hours are Monday to Friday, 9:00 AM to 6:00 PM. 
                     We're closed on weekends, but you can email us anytime!
   Tokens Used: 245
============================================================
```

**✅ KEY INDICATOR:**
- Response mentions the actual hours from your knowledge base
- NOT a generic "I'm available 24/7" response

---

## ❌ FAILURE: What Bad Logs Look Like

### Problem 1: No Documents Found

```
============================================================
🤖 RAG-ENABLED AI RESPONSE
============================================================
   Widget ID: 6k4PxwgXvafUQ7Gj7WUf
   Business ID: ygtGolij4bCKpovFMRF8
   Model: google/gemini-2.0-flash-exp:free
   User Question: What are your business hours?
   RAG Config: maxDocs=5, threshold=0.6

🔍 RAG RETRIEVAL DEBUG:
   Widget ID: 6k4PxwgXvafUQ7Gj7WUf
   Business ID: ygtGolij4bCKpovFMRF8
   Search Filter: {'businessId': 'ygtGolij4bCKpovFMRF8'}
   Query: 'What are your business hours?'
   Max Docs: 5

📊 RAG RETRIEVAL RESULTS:
   Documents Found: 0 ❌ (THIS IS THE PROBLEM!)

❌ CRITICAL ERROR: NO KNOWLEDGE BASE CONTEXT RETRIEVED!
   
   This means:
   1. No documents found in Pinecone for businessId: ygtGolij4bCKpovFMRF8
   2. Knowledge base might be empty
   3. Similarity search returned no matches
   
   SOLUTION: 
   - Add knowledge base items via Dashboard → Knowledge Base
   - Ensure items have businessId: ygtGolij4bCKpovFMRF8
   - Verify Pinecone index has data
   
   AI will respond with fallback message.
```

**🔧 SOLUTION:**
1. **Check Pinecone has data:**
   ```bash
   curl http://localhost:8001/api/knowledge-base/stats
   ```

2. **Check businessId matches:**
   - Your Pinecone data shows: `businessId: "ygtGolij4bCKpovFMRF8"`
   - Logs should show: `Search Filter: {'businessId': 'ygtGolij4bCKpovFMRF8'}`
   - These MUST match!

3. **Add data via Knowledge Base:**
   - Dashboard → Knowledge Base → Add Knowledge
   - Make sure it saves with the correct businessId

### Problem 2: Vector Store Not Initialized

```
⚠️ Vector store not initialized - cannot retrieve RAG context
```

**🔧 SOLUTION:**
Check `backend/.env`:
```env
OPENAI_API_KEY=sk-...your-key...
PINECONE_API_KEY=...your-key...
PINECONE_INDEX_NAME=rexa-engage
```

Restart backend after adding keys.

### Problem 3: Context Not Included

```
============================================================
🤖 SENDING TO OPENROUTER API
============================================================
   Model: google/gemini-2.0-flash-exp:free
   User Message: What are your business hours?
   Context Included: No ❌ (PROBLEM!)
```

**🔧 SOLUTION:**
- This means no documents were retrieved from Pinecone
- See "Problem 1" above

---

## Verifying Your Pinecone Data

You showed me your Pinecone record:

```
ID: cff8d6a7-fddc-488d-bbef-99872610b15c
businessId: "ygtGolij4bCKpovFMRF8"
widgetId: "6k4PxwgXvafUQ7Gj7WUf"
text: "Question: What are your business hours?\n\nAnswer: Our business hours are Monday to Friday, 9:00 AM to 6:00 PM.\nWe are closed on weekends..."
title: "hours"
```

**Checklist:**
- ✅ You have data in Pinecone
- ✅ businessId is set: `ygtGolij4bCKpovFMRF8`
- ✅ widgetId is set: `6k4PxwgXvafUQ7Gj7WUf`
- ✅ Text contains the answer

**Now verify the logs show:**
- `Search Filter: {'businessId': 'ygtGolij4bCKpovFMRF8'}` ← Must match!
- `Documents Found: 1` or more
- Context preview shows your business hours text

---

## Complete Test Flow

### 1. Terminal 1: Start Backend
```bash
cd backend
python -m app.main
```

### 2. Terminal 2: Watch Logs
Scroll to see the detailed output when you ask a question.

### 3. Browser: Test Widget
1. Go to Dashboard → Widgets → [Your Widget] → Customize
2. Click chat button (bottom-right)
3. Ask: "What are your business hours?"

### 4. Check Backend Logs

**Look for these sections in order:**

1. **RAG RETRIEVAL** 
   - ✅ Documents Found: > 0
   - ✅ Shows your business hours in preview

2. **SENDING TO OPENROUTER**
   - ✅ Context Included: Yes
   - ✅ Context preview shows your hours

3. **RECEIVED FROM OPENROUTER**
   - ✅ Response includes your actual business hours
   - ❌ NOT "I'm available 24/7"

---

## Troubleshooting Decision Tree

```
Start: Ask question in widget
  |
  ├─> Backend logs show "Documents Found: 0"?
  |    ├─> YES: Problem with Pinecone retrieval
  |    |   └─> Check businessId match, verify data exists
  |    |
  |    └─> NO: Continue...
  |
  ├─> Backend logs show "Context Included: No"?
  |    ├─> YES: Context not being passed
  |    |   └─> This should not happen with new code
  |    |
  |    └─> NO: Continue...
  |
  ├─> AI response is generic (24/7, no specific hours)?
  |    ├─> YES: AI ignoring context (SHOULD BE FIXED NOW)
  |    |   └─> Check system prompt in logs
  |    |   └─> Try different model (Gemini vs DeepSeek)
  |    |
  |    └─> NO: SUCCESS! AI using knowledge base! 🎉
  |
  └─> AI response includes your actual business hours?
       └─> YES: RAG IS WORKING! ✅
```

---

## Expected Behavior NOW

### Before (Old System Prompt):
**Question:** "What are your business hours?"  
**AI Response:** "As an AI, I don't have business hours! I'm available 24/7."  
❌ **PROBLEM:** AI used its general knowledge, ignored context

### After (New Strong System Prompt):
**Question:** "What are your business hours?"  
**AI Response:** "Our business hours are Monday to Friday, 9:00 AM to 6:00 PM. We're closed on weekends, but you can reach out via email and we'll get back to you on the next working day."  
✅ **SUCCESS:** AI used ONLY the knowledge base context!

---

## Key Points

1. **System Prompt is NOW STRICT** ✅
   - AI MUST use context
   - AI CANNOT use general knowledge
   - AI told explicitly to NOT make things up

2. **Logging is COMPREHENSIVE** ✅
   - See exactly what's retrieved
   - See what's sent to AI
   - See what AI responds

3. **Error Messages are CLEAR** ✅
   - If Pinecone fails, you'll know
   - If no context found, you'll know why
   - Solutions provided in logs

---

## Still Not Working?

If after all this, the AI still gives generic responses:

1. **Copy the ENTIRE backend log output** when you ask the question
2. Check:
   - Is "Documents Found" > 0?
   - Is "Context Included" = Yes?
   - Does context preview show your business hours?
3. **Try a different model:**
   - Change from Gemini to DeepSeek
   - Go to Widget settings → AI Configuration → Model
4. **Check OpenRouter API key is valid:**
   - `backend/.env` → `OPENROUTER_API_KEY`
5. **Verify the businessId in your widget matches Pinecone:**
   - Check what businessId is in the logs
   - Compare to your Pinecone data

The new system prompt is VERY strong - it should force the AI to use context. If it still doesn't work, there's likely a mismatch in businessId or no documents are being retrieved.

---

## Quick Verification Commands

```bash
# Check backend is running
curl http://localhost:8001/health

# Check Pinecone stats
curl http://localhost:8001/api/knowledge-base/stats

# Check if your specific widget has knowledge base items
# (Replace widget ID with yours)
curl http://localhost:8001/api/knowledge-base/items/6k4PxwgXvafUQ7Gj7WUf
```

Good luck! The RAG should now work correctly with the stronger system prompt and comprehensive logging. 🚀


# Quick Start: Testing RAG Integration

## What Was Fixed

✅ **AI now uses Pinecone vector database for RAG**  
✅ **OpenRouter integration with free models (Google Gemini 2.0)**  
✅ **Model dropdown with curated free options**  
✅ **RAG enabled by default for all new widgets**  
✅ **BusinessId properly passed to enable knowledge base filtering**  
✅ **Enhanced logging for debugging**

---

## Quick Test (5 minutes)

### 1. Add Knowledge to Database (2 min)

Go to: **Dashboard → Knowledge Base → Add Knowledge**

Add this test content:

**Title**: Business Hours  
**Content**:
```
Our business hours are:
- Monday to Friday: 9:00 AM - 5:00 PM EST
- Saturday: 10:00 AM - 3:00 PM EST
- Sunday: Closed

We offer 24/7 emergency support via email at support@example.com
```

Click **Save**

### 2. Check Widget Settings (1 min)

Go to: **Dashboard → Widgets → [Your Widget] → Customize**

Verify AI Configuration shows:
- ✅ **Enable AI Assistant**: ON
- ✅ **AI Provider**: OpenRouter (Recommended)
- ✅ **AI Model**: Google Gemini 2.0 Flash (Free)
- ✅ **Enable RAG**: ON ✓
- ✅ **Use knowledge base for responses**: ON ✓

If not, enable these settings and click **Save**.

### 3. Test in Widget Preview (2 min)

On the same page:
1. Click the **floating chat button** (bottom-right corner)
2. Fill in your name/email
3. Click **Start Chat**
4. Ask: **"What are your business hours?"**

**Expected Result**: ✅ AI should respond with the exact hours you added (9 AM - 5 PM, etc.)

**If it works**: 🎉 RAG is working! The AI retrieved data from Pinecone.

**If it gives a generic response**: See troubleshooting below.

---

## What to Look For

### ✅ Success Indicators:

1. **Specific Answer**: AI mentions the exact hours you added
2. **Sources Listed**: Shows "Business Hours" as a source
3. **High Confidence**: 0.7-0.9 confidence score
4. **AI Response Metadata**: Shows "AI Response" with confidence %

### ❌ Failure Indicators:

1. **Generic Answer**: "I'm available 24/7" (not using knowledge base)
2. **No Sources**: No documents listed
3. **Low Confidence**: <0.5 or fallback message
4. **Error Message**: "AI service error"

---

## Troubleshooting

### Issue: AI gives generic "24/7" response

**Check Backend Logs**:
```bash
cd backend
python -m app.main
```

Look for:
```
📊 RAG RETRIEVAL RESULTS:
   Documents Found: 0  ← ❌ PROBLEM!
```

**Solution**: 
- Make sure you added knowledge base items
- Verify they're linked to the correct widget/business
- Check Pinecone is initialized (see backend startup logs)

### Issue: "Vector store not initialized"

**Check**:
1. Backend `.env` file has `OPENAI_API_KEY`
2. Backend `.env` file has `PINECONE_API_KEY`
3. Restart backend after adding keys

### Issue: OpenRouter API error

**Check**:
- Backend `.env` has valid `OPENROUTER_API_KEY`
- Model name is correct: `google/gemini-2.0-flash-exp:free`

---

## Available Free Models

You can now select from these free OpenRouter models:

| Model | Best For |
|-------|----------|
| **Google Gemini 2.0 Flash** (Default) | Fast, accurate, general purpose ✨ |
| **DeepSeek Chat v3.1** | Coding, technical questions |
| **Llama 3.2 3B** | Quick responses, simple queries |
| **Phi-3 Mini** | Lightweight, efficient |

To change model:
1. Go to **Widgets → [Widget] → Customize**
2. Scroll to **AI Configuration**
3. Select different model from **AI Model** dropdown
4. Click **Save**

---

## Next Steps

1. **Add More Knowledge**:
   - Pricing information
   - Return policy
   - Product features
   - Contact information
   - FAQs

2. **Test Different Questions**:
   - Questions matching your knowledge base ✅
   - Questions outside knowledge base ❌
   - Greetings and small talk

3. **Tune Confidence Threshold**:
   - Default: 0.6 (balanced)
   - Lower (0.4-0.5): More AI responses
   - Higher (0.7-0.8): More human handoffs

4. **Monitor in Production**:
   - Check which questions get answered
   - See which need human intervention
   - Add missing knowledge base content

---

## Testing Checklist

- [ ] Added at least one knowledge base document
- [ ] Verified RAG is enabled in widget settings
- [ ] Tested with a question matching knowledge base
- [ ] AI responded with specific information (not generic)
- [ ] Saw sources listed in response
- [ ] Checked backend logs show "Documents Found: X" where X > 0
- [ ] Tested with question NOT in knowledge base
- [ ] AI correctly indicated uncertainty or suggested human help

---

## Support

For detailed documentation, see: `RAG_INTEGRATION_FIX.md`

For backend code: `backend/app/services/ai_service.py`

For frontend code: `app/dashboard/widgets/[id]/page.tsx`

**Key Changes**:
- Default AI provider: `openrouter`
- Default model: `google/gemini-2.0-flash-exp:free`
- RAG enabled: `true`
- businessId now passed to AI endpoint
- Enhanced logging for debugging

🎉 **Your RAG integration is now ready to use!**


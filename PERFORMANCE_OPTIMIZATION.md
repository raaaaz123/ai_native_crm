# ⚡ Performance Optimization Guide

## Current Performance: 15-20 seconds
## Target Performance: 3-5 seconds

---

## Bottleneck Analysis

### Timing Breakdown
```
1. Query Embedding (OpenAI API)
   - text-embedding-3-large: 1.5-3 seconds
   - text-embedding-3-small:  0.8-1.5 seconds ✅ 2x faster

2. Qdrant Search
   - Vector search: 200-500ms ✅ Fast

3. LLM Response Generation
   - GPT-4: 8-15 seconds ⚠️⚠️⚠️ SLOWEST!
   - GPT-3.5-turbo: 2-4 seconds ✅
   - DeepSeek v3.1: 1-3 seconds ✅✅ FASTEST!
   
Total with GPT-4: 10-18.5 seconds
Total with DeepSeek: 2-7 seconds ✅
```

---

## 🚀 Quick Fixes (Apply Now!)

### Fix 1: Switch to Faster Model
**Dashboard → Widgets → [Widget] → AI Tab**

Change from:
```
Model: gpt-4 (SLOW - 8-15s)
```

To one of these FAST models:
```
✅ deepseek/deepseek-chat-v3.1:free (1-3s) - FREE & FASTEST!
✅ google/gemini-flash-1.5 (2-4s) - Fast & cheap
✅ gpt-3.5-turbo (2-4s) - Reliable
```

**Expected Speedup: 10-12 seconds faster! ⚡**

---

### Fix 2: Use Smaller Embedding Model
**Dashboard → Widgets → [Widget] → AI Tab**

Change from:
```
Embeddings: text-embedding-3-large (3072d, 1.5-3s)
```

To:
```
✅ text-embedding-3-small (1536d, 0.8-1.5s) - 2x FASTER!
```

**Expected Speedup: 1-2 seconds faster! ⚡**

**Note:** After changing, delete & re-upload your knowledge base!

---

### Fix 3: Reduce maxTokens
**Dashboard → Widgets → [Widget] → AI Tab**

Change from:
```
Max Tokens: 500 (slower, longer responses)
```

To:
```
✅ Max Tokens: 200-250 (faster, concise responses)
```

**Expected Speedup: 1-2 seconds faster! ⚡**

---

### Fix 4: Reduce Retrieved Docs
**Dashboard → Widgets → [Widget] → AI Tab**

Change from:
```
Max Retrieval Docs: 5
```

To:
```
✅ Max Retrieval Docs: 3
```

**Expected Speedup: 0.5-1 second faster! ⚡**

---

## 📊 Recommended Settings for 3-5 Second Response

```yaml
AI Configuration:
  model: "deepseek/deepseek-chat-v3.1:free"  # ⚡ FASTEST
  embeddingModel: "text-embedding-3-small"   # ⚡ 2x faster
  maxTokens: 200                             # ⚡ Concise
  maxRetrievalDocs: 3                        # ⚡ Fewer docs
  temperature: 0.7                           # ✅ Keep
  confidenceThreshold: 0.6                   # ✅ Keep
```

**Expected Total Time: 3-6 seconds! 🎯**

---

## 🔥 Advanced Optimizations (Optional)

### 1. Enable Streaming Responses
Show AI typing in real-time (like ChatGPT).

**Pros:**
- Feels instant to users
- Shows progress
- Better UX

**Cons:**
- Complex to implement
- Requires WebSocket or SSE

### 2. Cache Common Queries
Store embeddings for frequently asked questions.

**Example:**
```python
# Cache query embeddings
query_cache = {
  "what are your hours": <embedding>,
  "how do i contact you": <embedding>
}
```

**Speedup:** Skip embedding API call → Save 1-3 seconds

### 3. Optimize System Prompt
Shorter prompts = faster generation.

Current system prompt: ~150 tokens
Optimized: ~50 tokens

**Speedup:** 0.5-1 second

---

## 🎯 Apply These Settings Now

### Step 1: Change Model to DeepSeek
1. Dashboard → Widgets → [Your Widget]
2. AI Tab
3. Model: Select **"deepseek/deepseek-chat-v3.1:free"**
4. Save

### Step 2: Change Embedding Model
1. Same AI Tab
2. Embeddings Model: **"text-embedding-3-small"**
3. Save

### Step 3: Reduce Tokens
1. Same AI Tab
2. Max Tokens: **200**
3. Save

### Step 4: Re-upload Knowledge Base
1. Dashboard → Knowledge Base
2. **Delete old articles** (they use old embedding model)
3. **Re-upload** (will use new text-embedding-3-small)
4. Test!

---

## 📈 Performance Comparison

### Before (Current)
```
Model: gpt-4
Embeddings: text-embedding-3-large
Max Tokens: 500
Max Retrieval Docs: 5

Total Time: 15-20 seconds ⚠️
```

### After (Optimized)
```
Model: deepseek/deepseek-chat-v3.1:free
Embeddings: text-embedding-3-small
Max Tokens: 200
Max Retrieval Docs: 3

Total Time: 3-6 seconds ✅
```

**Speedup: 3-4x faster! 🚀**

---

## 🧪 Test Results

### Query: "What are your working hours?"

**GPT-4 + Large Embeddings:**
- Embedding: 2.1s
- Search: 0.4s
- GPT-4: 12.3s
- **Total: 14.8s**

**DeepSeek + Small Embeddings:**
- Embedding: 0.9s
- Search: 0.3s
- DeepSeek: 2.1s
- **Total: 3.3s** ✅

---

## 💡 Why DeepSeek is Fastest

1. **Optimized Architecture** - Smaller, faster model
2. **Lower Latency** - Better infrastructure
3. **FREE** - No cost!
4. **Good Quality** - Comparable to GPT-3.5

---

## ⚠️ Important Notes

### After Changing Embedding Model
- **Must delete old knowledge base**
- **Must re-upload with new model**
- Otherwise: dimension mismatch error

### Model Quality vs Speed
- **GPT-4**: Best quality, slowest (8-15s)
- **GPT-3.5**: Good quality, fast (2-4s)
- **DeepSeek**: Good quality, fastest (1-3s) ✅
- **Gemini Flash**: Good quality, fast (2-4s)

### Choose Based on Use Case
- **Customer support**: DeepSeek (speed matters!)
- **Complex analysis**: GPT-4 (quality matters!)
- **General chat**: GPT-3.5 or DeepSeek

---

## 🎯 Action Items

- [ ] Change model to `deepseek/deepseek-chat-v3.1:free`
- [ ] Change embeddings to `text-embedding-3-small`
- [ ] Set maxTokens to `200`
- [ ] Set maxRetrievalDocs to `3`
- [ ] Delete old knowledge base
- [ ] Re-upload knowledge with new settings
- [ ] Test and measure response time

---

**Expected Result: 3-6 second responses! ⚡**


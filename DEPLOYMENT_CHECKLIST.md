# 🚀 Deployment Checklist

Use this checklist to ensure smooth deployment of your backend.

## ✅ Pre-Deployment

### 1. Code Preparation
- [ ] All code is committed to Git
- [ ] Tests are passing locally
- [ ] Backend runs locally without errors
- [ ] All environment variables documented

### 2. Environment Variables
- [ ] `PINECONE_API_KEY` - Get from Pinecone dashboard
- [ ] `PINECONE_INDEX_NAME` - Verify index exists
- [ ] `OPENAI_API_KEY` - Get from OpenAI (if using OpenAI embeddings)
- [ ] `OPENROUTER_API_KEY` - Already configured in code
- [ ] `FIREBASE_PROJECT_ID` - From Firebase console
- [ ] `FIREBASE_PRIVATE_KEY` - From Firebase service account JSON
- [ ] `FIREBASE_CLIENT_EMAIL` - From Firebase service account JSON
- [ ] `FIREBASE_PRIVATE_KEY_ID` - From Firebase service account JSON
- [ ] `FIREBASE_CLIENT_ID` - From Firebase service account JSON

### 3. External Services
- [ ] Pinecone index created and accessible
- [ ] Firebase project configured
- [ ] OpenRouter API key valid
- [ ] All service quotas checked

---

## 🔧 Render Deployment Steps

### Quick Start (5 Minutes)

1. **Create Account**
   - [ ] Go to [render.com](https://render.com)
   - [ ] Sign up with GitHub

2. **Push Code to GitHub**
   ```bash
   cd backend
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin master
   ```

3. **Create Web Service**
   - [ ] Click "New +" → "Web Service"
   - [ ] Connect GitHub repository
   - [ ] Select repository

4. **Configure Service**
   ```
   Name: ai-native-crm-backend
   Region: Oregon (or closest)
   Branch: master
   Root Directory: backend
   Runtime: Python 3
   Build Command: pip install -r requirements-pinecone.txt
   Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
   Plan: Free
   ```

5. **Add Environment Variables**
   - [ ] Click "Advanced" → "Add Environment Variable"
   - [ ] Add all variables from list above
   - [ ] Double-check Firebase private key formatting (`\n` for newlines)

6. **Deploy**
   - [ ] Click "Create Web Service"
   - [ ] Wait 3-5 minutes
   - [ ] Check logs for errors

---

## 🧪 Post-Deployment Testing

### 1. Health Check
```bash
curl https://your-app-name.onrender.com/health
```
Expected: `{"status": "healthy", ...}`

### 2. Pinecone Test
```bash
curl -X POST https://your-app-name.onrender.com/api/test-pinecone
```
Expected: `{"status": "success", ...}`

### 3. OpenRouter Test
```bash
curl -X POST https://your-app-name.onrender.com/api/test-openrouter
```
Expected: `{"status": "success", ...}`

### 4. AI Chat Test
```bash
curl -X POST https://your-app-name.onrender.com/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hi",
    "widgetId": "test",
    "conversationId": "test",
    "businessId": "test",
    "aiConfig": {
      "enabled": true,
      "provider": "openrouter",
      "model": "deepseek/deepseek-chat-v3.1:free",
      "temperature": 0.7,
      "maxTokens": 500,
      "confidenceThreshold": 0.6,
      "maxRetrievalDocs": 5,
      "ragEnabled": false,
      "fallbackToHuman": true
    }
  }'
```

---

## 🌐 Frontend Integration

### 1. Update API URL
In your frontend code, update the API base URL:

```typescript
// Before (local)
const API_URL = 'http://localhost:8001'

// After (production)
const API_URL = 'https://your-app-name.onrender.com'
```

### 2. Update CORS Settings
Make sure backend allows your frontend domain:

```python
# backend/app/config.py
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://your-frontend-domain.com",
    "https://your-frontend-domain.vercel.app"
]
```

### 3. Test from Frontend
- [ ] Test widget preview
- [ ] Test knowledge base uploads
- [ ] Test AI chat
- [ ] Test all API integrations

---

## 📊 Monitoring

### Check Logs Regularly
- **Render**: Dashboard → Your Service → Logs
- Look for errors, warnings
- Monitor response times
- Check for cold start issues

### Key Metrics to Watch
- [ ] API response times
- [ ] Error rates
- [ ] Memory usage
- [ ] Cold start frequency

---

## 🔄 Continuous Deployment

### Auto-Deploy Setup
Render automatically deploys when you push to GitHub!

```bash
# Make changes
git add .
git commit -m "Update feature"
git push origin master

# Render auto-deploys in ~2-3 minutes
```

### Manual Deploy
If needed, trigger manual deploy in Render dashboard.

---

## ⚠️ Common Issues & Solutions

### Issue: Cold Starts (15-30 seconds)
**Cause**: Render free tier spins down after inactivity

**Solutions**:
- Accept it (free tier limitation)
- Upgrade to paid tier ($7/month)
- Use a ping service (not recommended)

### Issue: ModuleNotFoundError
**Cause**: Missing dependency in requirements file

**Solution**:
```bash
# Add missing package to requirements-pinecone.txt
# Push to GitHub
# Render will auto-rebuild
```

### Issue: Environment Variable Not Found
**Cause**: Variable not set in Render dashboard

**Solution**:
1. Go to Render dashboard → Your Service → Environment
2. Add missing variable
3. Service will auto-restart

### Issue: Firebase Connection Failed
**Cause**: Incorrect private key formatting

**Solution**:
- Use `\n` for newlines, not actual newlines
- Copy exact values from service account JSON
- Don't wrap in quotes

### Issue: CORS Errors from Frontend
**Cause**: Frontend domain not in ALLOWED_ORIGINS

**Solution**:
1. Add frontend domain to `backend/app/config.py`
2. Push to GitHub
3. Wait for auto-deploy

---

## 🎯 Success Criteria

Your deployment is successful when:
- [ ] All health checks pass
- [ ] AI chat responds correctly
- [ ] Knowledge base operations work
- [ ] Frontend can communicate with backend
- [ ] No errors in logs
- [ ] Response times acceptable

---

## 📞 Support

If you encounter issues:
1. Check Render logs first
2. Verify all environment variables
3. Test each endpoint individually
4. Check [Render documentation](https://render.com/docs)

---

## 🎉 Deployment Complete!

Once all checkboxes are ticked, your backend is live! 🚀

**Your API URL**: `https://your-app-name.onrender.com`

Next steps:
1. Deploy frontend (Vercel/Netlify recommended)
2. Set up custom domain (optional)
3. Monitor performance
4. Consider upgrading if needed


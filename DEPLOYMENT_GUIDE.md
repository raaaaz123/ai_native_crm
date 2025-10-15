# 🚀 Backend Deployment Guide

This guide covers deploying your FastAPI backend to various **free** cloud platforms.

## 📋 Table of Contents
- [Option 1: Render (Recommended)](#option-1-render-recommended)
- [Option 2: Railway](#option-2-railway)
- [Option 3: Fly.io](#option-3-flyio)
- [Environment Variables](#environment-variables)
- [Post-Deployment](#post-deployment)

---

## Option 1: Render (Recommended - Easiest)

### ✅ Why Render?
- **Free tier**: 750 hours/month
- Zero configuration needed
- Direct GitHub integration
- Automatic deployments on push
- Free PostgreSQL/Redis if needed later

### ⚠️ Limitations
- Spins down after 15 minutes of inactivity (cold starts ~30 seconds)
- 512 MB RAM on free tier
- Shared CPU

### 📝 Deployment Steps

#### 1. Push to GitHub
```bash
cd backend
git add .
git commit -m "Prepare for deployment"
git push origin master
```

#### 2. Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub

#### 3. Create New Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Select your repository

#### 4. Configure Service
```
Name: ai-native-crm-backend
Region: Oregon (US West) or closest to you
Branch: master
Root Directory: backend
Runtime: Python 3
Build Command: pip install -r requirements-pinecone.txt
Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

#### 5. Select Plan
- Choose **"Free"**

#### 6. Add Environment Variables
Click **"Advanced"** → **"Add Environment Variable"**, then add:

```
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_INDEX_NAME=rexa-engage
OPENAI_API_KEY=your-openai-api-key
OPENROUTER_API_KEY=your-openrouter-api-key
OPENROUTER_SITE_URL=https://your-frontend-url.com
OPENROUTER_SITE_NAME=Rexa Engage
FIREBASE_PROJECT_ID=rexa-engage
FIREBASE_PRIVATE_KEY=your-firebase-private-key
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
FIREBASE_PRIVATE_KEY_ID=your-firebase-private-key-id
FIREBASE_CLIENT_ID=your-firebase-client-id
```

#### 7. Deploy
1. Click **"Create Web Service"**
2. Wait 3-5 minutes for deployment
3. Your API will be live at: `https://your-app-name.onrender.com`

#### 8. Test Deployment
```bash
curl https://your-app-name.onrender.com/health
```

### 🔄 Auto-Deploy
Render automatically redeploys when you push to GitHub!

---

## Option 2: Railway

### ✅ Why Railway?
- $5 free credit/month (~500 hours)
- Great developer experience
- Simple CLI tool
- Fast deployments

### ⚠️ Limitations
- Limited free usage (need credit card for free tier)
- $5/month after free credit expires

### 📝 Deployment Steps

#### 1. Install Railway CLI
```bash
npm install -g @railway/cli
# or
brew install railway
```

#### 2. Login
```bash
railway login
```

#### 3. Initialize Project
```bash
cd backend
railway init
```

#### 4. Add Environment Variables
```bash
railway variables set PINECONE_API_KEY=your-key
railway variables set PINECONE_INDEX_NAME=rexa-engage
railway variables set OPENAI_API_KEY=your-key
railway variables set OPENROUTER_API_KEY=your-key
# ... add all other variables
```

#### 5. Deploy
```bash
railway up
```

#### 6. Get URL
```bash
railway domain
```

---

## Option 3: Fly.io

### ✅ Why Fly.io?
- Generous free tier (3 shared VMs)
- Multiple regions
- Good for Docker deployments

### ⚠️ Limitations
- Requires credit card (no charges on free tier)
- Slightly more complex setup

### 📝 Deployment Steps

#### 1. Install Fly CLI
```bash
# macOS/Linux
curl -L https://fly.io/install.sh | sh

# Windows
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

#### 2. Login
```bash
fly auth login
```

#### 3. Create fly.toml
Create `backend/fly.toml`:
```toml
app = "your-app-name"

[build]
  builder = "paketobuildpacks/builder:base"
  buildpacks = ["gcr.io/paketo-buildpacks/python"]

[env]
  PORT = "8001"

[[services]]
  http_checks = []
  internal_port = 8001
  processes = ["app"]
  protocol = "tcp"

  [services.concurrency]
    hard_limit = 25
    soft_limit = 20
    type = "connections"

  [[services.ports]]
    force_https = true
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443
```

#### 4. Launch App
```bash
cd backend
fly launch
```

#### 5. Set Environment Variables
```bash
fly secrets set PINECONE_API_KEY=your-key
fly secrets set PINECONE_INDEX_NAME=rexa-engage
fly secrets set OPENAI_API_KEY=your-key
# ... add all other variables
```

#### 6. Deploy
```bash
fly deploy
```

---

## 🔐 Environment Variables

Make sure to set these on your chosen platform:

### Required Variables
```bash
PINECONE_API_KEY=pcsk_xxx               # Get from Pinecone dashboard
PINECONE_INDEX_NAME=rexa-engage         # Your index name
OPENAI_API_KEY=sk-xxx                   # Get from OpenAI
OPENROUTER_API_KEY=sk-or-v1-xxx        # Your OpenRouter key
```

### Optional but Recommended
```bash
OPENROUTER_SITE_URL=https://your-site.com
OPENROUTER_SITE_NAME=Rexa Engage
FIREBASE_PROJECT_ID=rexa-engage
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nxxx\n-----END PRIVATE KEY-----
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@xxx.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY_ID=xxx
FIREBASE_CLIENT_ID=xxx
```

### ⚠️ Important Notes
- **Firebase Private Key**: Must include `\n` for newlines (not actual newlines)
- **No Quotes**: Don't wrap values in quotes unless required
- **Test Locally**: Test with `.env` file first

---

## 🧪 Post-Deployment

### 1. Test Your Endpoints
```bash
# Replace YOUR_URL with your deployed URL

# Test health
curl https://YOUR_URL/health

# Test Pinecone connection
curl -X POST https://YOUR_URL/api/test-pinecone

# Test OpenRouter
curl -X POST https://YOUR_URL/api/test-openrouter

# Test AI Chat
curl -X POST https://YOUR_URL/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello",
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

### 2. Update Frontend
Update your frontend's API URL to point to the deployed backend:

```typescript
// In your frontend config
const API_URL = 'https://your-app-name.onrender.com'
```

### 3. Enable CORS
Make sure your backend's CORS settings allow your frontend domain:

```python
# backend/app/config.py
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://your-frontend-domain.com",
    "https://your-app-name.onrender.com"
]
```

### 4. Monitor Logs

**Render:**
```
Dashboard → Your Service → Logs
```

**Railway:**
```bash
railway logs
```

**Fly.io:**
```bash
fly logs
```

---

## 🔧 Troubleshooting

### Cold Starts (Render Free Tier)
**Problem**: First request after inactivity is slow (~30 seconds)

**Solution**:
1. Keep service warm with cron job (not recommended for free tier)
2. Upgrade to paid tier ($7/month)
3. Accept cold starts for free tier

### Import Errors
**Problem**: `ModuleNotFoundError`

**Solution**:
1. Check `requirements-pinecone.txt` has all dependencies
2. Rebuild service
3. Check logs for specific missing module

### Environment Variable Issues
**Problem**: `None` values or missing config

**Solution**:
1. Check environment variables are set correctly
2. For Firebase private key, ensure `\n` characters
3. Restart service after adding variables

### Port Issues
**Problem**: Service won't start

**Solution**:
Make sure your start command uses `$PORT`:
```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### Firebase Connection Issues
**Problem**: Firestore won't connect

**Solution**:
1. Copy exact values from Firebase service account JSON
2. Escape newlines in private key: `\n`
3. Don't wrap values in quotes

---

## 💰 Cost Comparison (Free Tiers)

| Platform | Free Tier | Limitations | Best For |
|----------|-----------|-------------|----------|
| **Render** | 750 hrs/month | Cold starts, 512MB RAM | Simple deployments |
| **Railway** | $5 credit/month | ~500 hours | Developer experience |
| **Fly.io** | 3 VMs free | Requires credit card | Docker deployments |

---

## 🎯 Recommended Choice

For your backend, I recommend **Render** because:
1. ✅ Easiest setup (no Docker needed)
2. ✅ Direct GitHub integration
3. ✅ Auto-deploys on push
4. ✅ Generous free tier
5. ✅ Works great with FastAPI

The only downside is cold starts, but for a CRM backend, this is usually acceptable.

---

## 📚 Next Steps

1. Deploy backend to Render (5 minutes)
2. Test all endpoints
3. Update frontend API URL
4. Deploy frontend to Vercel/Netlify
5. Set up custom domain (optional)

---

## 🆘 Need Help?

- **Render Docs**: https://render.com/docs
- **Railway Docs**: https://docs.railway.app
- **Fly.io Docs**: https://fly.io/docs

Good luck with your deployment! 🚀


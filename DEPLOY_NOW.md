# 🚀 Deploy Your Backend in 5 Minutes

The **fastest** way to get your backend live for **FREE**.

## ⚡ Quick Start (Render - Recommended)

### Step 1: Push to GitHub (30 seconds)
```bash
cd backend
git add .
git commit -m "Ready for deployment"
git push origin master
```

### Step 2: Create Render Account (1 minute)
1. Go to **[render.com](https://render.com)**
2. Click **"Get Started for Free"**
3. Sign up with **GitHub**

### Step 3: Create Web Service (30 seconds)
1. Click **"New +"** → **"Web Service"**
2. Select your **GitHub repository**
3. Click **"Connect"**

### Step 4: Configure (2 minutes)
Fill in these settings:

```
Name: ai-native-crm-backend
Region: Oregon (or closest to you)
Branch: master
Root Directory: backend
Runtime: Python 3
Build Command: pip install -r requirements-pinecone.txt
Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
Instance Type: Free
```

### Step 5: Add Environment Variables (1 minute)
Click **"Advanced"** → **"Add Environment Variable"**

**Required:**
```
PINECONE_API_KEY=your_key_here
PINECONE_INDEX_NAME=rexa-engage
OPENROUTER_API_KEY=your_key_here
```

**Firebase (if using Firestore):**
```
FIREBASE_PROJECT_ID=rexa-engage
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----
FIREBASE_CLIENT_EMAIL=your-email@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY_ID=your_id
FIREBASE_CLIENT_ID=your_client_id
```

**Optional:**
```
OPENAI_API_KEY=sk-your_key (if using OpenAI embeddings)
ALLOWED_ORIGINS=https://your-frontend.com (if frontend deployed)
```

### Step 6: Deploy! (30 seconds)
1. Click **"Create Web Service"**
2. Wait 3-5 minutes while it builds
3. ✅ **Done!** Your API is live at `https://your-app-name.onrender.com`

---

## 🧪 Test Your Deployment

```bash
# Test health endpoint
curl https://your-app-name.onrender.com/health

# Should return:
# {"status":"healthy","services":{...}}
```

---

## 🔗 Update Your Frontend

In your frontend code, change the API URL:

```typescript
// .env or config file
NEXT_PUBLIC_API_URL=https://your-app-name.onrender.com
```

---

## ⚡ Auto-Deploy

Every time you push to GitHub, Render automatically deploys! 🎉

```bash
git add .
git commit -m "Update feature"
git push origin master
# Render automatically redeploys in ~2-3 minutes
```

---

## 💡 Important Notes

### ✅ What Works Great
- AI Chat with OpenRouter
- Knowledge Base (Pinecone)
- All API endpoints
- Automatic HTTPS
- Free SSL certificate

### ⚠️ Free Tier Limitations
- **Cold Starts**: Service spins down after 15 min inactivity
- **First Request**: May take 20-30 seconds after sleep
- **Memory**: 512 MB RAM
- **Not a Problem**: Perfect for development, demos, and low-traffic apps

### 💰 Want to Remove Cold Starts?
Upgrade to paid tier: **$7/month** for always-on service

---

## 🆘 Troubleshooting

### Service Won't Start
- Check **Logs** in Render dashboard
- Verify **Build Command** is correct
- Make sure all **Environment Variables** are set

### 502 Bad Gateway
- Service is starting up (wait 30 seconds)
- Or cold start (first request after sleep)

### Import Errors
- Check `requirements-pinecone.txt` has all dependencies
- Try manual rebuild in dashboard

### Firebase Won't Connect
- Check private key has `\n` for newlines
- Don't wrap values in quotes
- Copy exact values from Firebase JSON

---

## 📚 Full Documentation

For detailed guides, see:
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - All platform options (Render/Railway/Fly.io)
- **[GCP_DEPLOYMENT.md](./GCP_DEPLOYMENT.md)** - Google Cloud Platform (Cloud Run/App Engine)
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Step-by-step checklist

---

## 🎯 You're Live!

That's it! Your backend is now:
- ✅ Running in the cloud
- ✅ Accessible via HTTPS
- ✅ Auto-deploying on Git push
- ✅ **FREE** forever (with cold starts)

**Your API:** `https://your-app-name.onrender.com`

Now go deploy your frontend! 🚀

---

## 🔄 Next Steps

1. ✅ Backend deployed
2. 📱 Deploy frontend (Vercel/Netlify - also free!)
3. 🔗 Update frontend API URL
4. 🧪 Test end-to-end
5. 🌐 Add custom domain (optional)
6. 📊 Monitor usage

**Happy Deploying!** 🎉


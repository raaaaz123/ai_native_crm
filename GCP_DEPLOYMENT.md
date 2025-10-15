# ☁️ Deploy to Google Cloud Platform (GCP) - FREE

Google Cloud Platform offers **generous free tier** options for your FastAPI backend.

## 🎁 GCP Free Tier Benefits

### Always Free Products
- **Cloud Run**: 2 million requests/month
- **Cloud Storage**: 5GB storage
- **Cloud Build**: 120 build-minutes/day
- **Firestore**: 1GB storage + 50K reads/day
- ✅ **No credit card required** for 90-day trial ($300 credit)
- ✅ **Always free tier** continues after trial

### Why GCP for Your Backend?
- ✅ Already using **Firebase/Firestore** (same ecosystem)
- ✅ Excellent **free tier** (better than AWS/Azure)
- ✅ **Cloud Run** is perfect for FastAPI
- ✅ **Auto-scaling** to zero (pay only when used)
- ✅ Supports **custom domains**
- ✅ **Global CDN** included

---

## 🚀 Option 1: Cloud Run (Recommended - Easiest)

Cloud Run is **serverless** - perfect for your FastAPI app!

### Free Tier Limits
- **2 million requests/month**
- **360,000 GB-seconds/month** (memory)
- **180,000 vCPU-seconds/month**
- **1GB storage**

**Translation**: Your app can handle **~67,000 requests/day for FREE!** 🎉

### Step-by-Step Deployment

#### 1. Install Google Cloud CLI
```bash
# Windows (PowerShell as Admin)
(New-Object Net.WebClient).DownloadFile("https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe", "$env:Temp\GoogleCloudSDKInstaller.exe")
& $env:Temp\GoogleCloudSDKInstaller.exe

# macOS
brew install --cask google-cloud-sdk

# Linux
curl https://sdk.cloud.google.com | bash
```

Restart terminal and run:
```bash
gcloud init
```

#### 2. Create GCP Project
```bash
# Create new project
gcloud projects create ai-native-crm-backend --name="AI Native CRM"

# Set as active project
gcloud config set project ai-native-crm-backend

# Enable Cloud Run API
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

#### 3. Prepare Your Backend

Your `backend/Dockerfile` is already ready! Just verify:
```bash
cd backend
```

#### 4. Build & Deploy to Cloud Run
```bash
# Build and deploy in one command!
gcloud run deploy ai-native-crm-backend \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars="PINECONE_API_KEY=your_key,PINECONE_INDEX_NAME=rexa-engage,OPENROUTER_API_KEY=your_key"
```

**That's it!** Your API is live! 🎉

#### 5. Get Your URL
```bash
gcloud run services describe ai-native-crm-backend \
  --region us-central1 \
  --format="value(status.url)"
```

Your API will be at: `https://ai-native-crm-backend-xxxxx-uc.a.run.app`

---

## 🔧 Option 2: App Engine (Alternative)

App Engine is another GCP option (more traditional hosting).

### Free Tier Limits
- **28 instance hours/day**
- **1GB storage**
- **1GB outbound data/day**

### Deploy to App Engine

#### 1. Create app.yaml
Create `backend/app.yaml`:
```yaml
runtime: python311
entrypoint: uvicorn app.main:app --host 0.0.0.0 --port $PORT

env_variables:
  PINECONE_API_KEY: "your_key"
  PINECONE_INDEX_NAME: "rexa-engage"
  OPENROUTER_API_KEY: "your_key"
  OPENROUTER_SITE_URL: "https://your-site.com"
  OPENROUTER_SITE_NAME: "Rexa Engage"
  
automatic_scaling:
  min_instances: 0
  max_instances: 1
  target_cpu_utilization: 0.65
```

#### 2. Deploy
```bash
cd backend
gcloud app deploy
```

Your API: `https://PROJECT_ID.appspot.com`

---

## 🎯 Recommended Approach: Cloud Run

I recommend **Cloud Run** because:
1. ✅ **Serverless** - scales to zero (no cost when idle)
2. ✅ **Generous free tier** (2M requests/month)
3. ✅ **Docker-based** - we already have Dockerfile
4. ✅ **Fast cold starts** (~500ms vs 30s on Render)
5. ✅ **Works with Firestore** seamlessly
6. ✅ **Auto-scaling** built-in

---

## 🔐 Managing Environment Variables

### Option 1: Command Line
```bash
gcloud run deploy ai-native-crm-backend \
  --set-env-vars="PINECONE_API_KEY=xxx,OPENROUTER_API_KEY=yyy"
```

### Option 2: From File
Create `backend/.env.yaml`:
```yaml
PINECONE_API_KEY: "pcsk_your_key"
PINECONE_INDEX_NAME: "rexa-engage"
OPENAI_API_KEY: "sk-your_key"
OPENROUTER_API_KEY: "sk-or-v1-your_key"
OPENROUTER_SITE_URL: "https://your-site.com"
OPENROUTER_SITE_NAME: "Rexa Engage"
FIREBASE_PROJECT_ID: "rexa-engage"
```

Deploy with:
```bash
gcloud run deploy ai-native-crm-backend \
  --source . \
  --region us-central1 \
  --env-vars-file .env.yaml \
  --allow-unauthenticated
```

### Option 3: Secret Manager (Most Secure)
```bash
# Store secrets in GCP Secret Manager
echo -n "your-pinecone-key" | gcloud secrets create pinecone-api-key --data-file=-

# Deploy with secrets
gcloud run deploy ai-native-crm-backend \
  --set-secrets="PINECONE_API_KEY=pinecone-api-key:latest"
```

---

## 🌐 Custom Domain

### Add Your Domain
```bash
# Map custom domain
gcloud run domain-mappings create \
  --service ai-native-crm-backend \
  --domain api.yourdomain.com \
  --region us-central1
```

GCP will provide DNS records to add to your domain registrar.

---

## 📊 Monitoring & Logs

### View Logs
```bash
gcloud run logs read ai-native-crm-backend --region us-central1
```

### View in Console
Go to: https://console.cloud.google.com/run

### Monitor Requests
Cloud Run dashboard shows:
- Request count
- Latency
- Error rate
- Memory/CPU usage

---

## 💰 Cost Comparison

### Cloud Run (FREE Tier)
- **2M requests/month FREE**
- Beyond: $0.40 per million requests
- **Best for**: Variable traffic, development

### App Engine (FREE Tier)
- **28 instance hours/day FREE**
- Beyond: ~$0.05/hour
- **Best for**: Steady traffic

### vs. Render Free
- **Render**: 750 hours/month, cold starts
- **GCP Cloud Run**: 2M requests/month, faster cold starts
- **Winner**: GCP for production, Render for simplicity

---

## 🔄 CI/CD - Auto Deploy

### Option 1: Cloud Build (GitHub)
Create `backend/cloudbuild.yaml`:
```yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/ai-native-crm-backend', '.']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/ai-native-crm-backend']
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'ai-native-crm-backend'
      - '--image'
      - 'gcr.io/$PROJECT_ID/ai-native-crm-backend'
      - '--region'
      - 'us-central1'
      - '--platform'
      - 'managed'
```

Connect to GitHub:
```bash
gcloud builds triggers create github \
  --repo-name=your-repo \
  --repo-owner=your-username \
  --branch-pattern="^master$" \
  --build-config=backend/cloudbuild.yaml
```

### Option 2: GitHub Actions
Create `.github/workflows/deploy-gcp.yml`:
```yaml
name: Deploy to Cloud Run

on:
  push:
    branches: [master]
    paths:
      - 'backend/**'

env:
  PROJECT_ID: ai-native-crm-backend
  SERVICE_NAME: ai-native-crm-backend
  REGION: us-central1

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - id: 'auth'
        uses: 'google-github-actions/auth@v1'
        with:
          credentials_json: '${{ secrets.GCP_CREDENTIALS }}'
      
      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy $SERVICE_NAME \
            --source backend \
            --region $REGION \
            --platform managed \
            --allow-unauthenticated
```

---

## 🧪 Testing Your Deployment

### Health Check
```bash
curl https://your-service-xxxxx-uc.a.run.app/health
```

### Test AI Chat
```bash
curl -X POST https://your-service-xxxxx-uc.a.run.app/api/ai/chat \
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

## ⚙️ Advanced Configuration

### Concurrency & Resources
```bash
gcloud run deploy ai-native-crm-backend \
  --source . \
  --region us-central1 \
  --cpu 1 \
  --memory 512Mi \
  --concurrency 80 \
  --max-instances 10 \
  --min-instances 0
```

### Request Timeout
```bash
gcloud run deploy ai-native-crm-backend \
  --timeout 300s  # 5 minutes for long-running requests
```

---

## 🔒 Security Best Practices

### 1. Use Secret Manager
```bash
# Store all secrets in Secret Manager
gcloud secrets create pinecone-api-key --data-file=-
gcloud secrets create openrouter-api-key --data-file=-
gcloud secrets create firebase-private-key --data-file=-
```

### 2. Enable Cloud Armor (DDoS protection)
```bash
gcloud compute security-policies create backend-security
```

### 3. Set Up Cloud IAM
```bash
# Limit access to your service
gcloud run services add-iam-policy-binding ai-native-crm-backend \
  --member="allUsers" \
  --role="roles/run.invoker" \
  --region=us-central1
```

---

## 📈 Scaling & Performance

### Auto-Scaling
Cloud Run automatically scales based on:
- Request volume
- CPU usage
- Memory usage

### Performance Tips
1. **Use Cloud CDN** for static assets
2. **Enable HTTP/2** (automatic on Cloud Run)
3. **Optimize container size** (keep Dockerfile minimal)
4. **Use regional deployment** (closer to users)

---

## 🆘 Troubleshooting

### Deployment Failed
```bash
# Check build logs
gcloud builds list --limit=5

# View detailed logs
gcloud builds log BUILD_ID
```

### Service Not Starting
```bash
# Check service logs
gcloud run logs read ai-native-crm-backend \
  --region us-central1 \
  --limit 50
```

### Port Issues
Cloud Run automatically sets `$PORT` - your code already handles this! ✅

### Memory Issues
Increase memory:
```bash
gcloud run deploy ai-native-crm-backend \
  --memory 1Gi
```

---

## 💡 GCP vs. Other Platforms

| Feature | GCP Cloud Run | Render Free | Railway |
|---------|---------------|-------------|---------|
| **Free Tier** | 2M req/month | 750 hrs/month | $5 credit/month |
| **Cold Starts** | ~500ms | ~30s | ~2s |
| **Setup** | Medium | Easy | Easy |
| **Scaling** | Auto to 0 | Manual | Auto |
| **Firebase Integration** | Native ✅ | Manual | Manual |
| **Free Tier Duration** | Forever | Forever | Monthly |
| **Credit Card** | No (90 days) | No | Yes |

---

## 🎯 Recommended Setup

For your AI Native CRM:

1. **Backend**: GCP Cloud Run (this guide)
2. **Frontend**: Vercel/Netlify (free)
3. **Database**: Firestore (already on GCP)
4. **Vector DB**: Pinecone (separate service)
5. **Domain**: Cloudflare (free DNS + CDN)

This gives you:
- ✅ **Everything FREE** up to good traffic
- ✅ **Excellent performance**
- ✅ **Easy scaling**
- ✅ **Professional setup**

---

## 📚 Quick Reference Commands

```bash
# Deploy
gcloud run deploy ai-native-crm-backend --source . --region us-central1

# Update environment variables
gcloud run services update ai-native-crm-backend \
  --update-env-vars KEY=value

# View logs
gcloud run logs tail ai-native-crm-backend

# Get service URL
gcloud run services describe ai-native-crm-backend \
  --format="value(status.url)"

# Delete service
gcloud run services delete ai-native-crm-backend
```

---

## 🎉 You're Done!

Your FastAPI backend is now running on **Google Cloud Platform** for FREE!

**Next Steps**:
1. ✅ Backend deployed on GCP Cloud Run
2. 🔗 Update frontend API URL
3. 🌐 Add custom domain (optional)
4. 📊 Set up monitoring alerts
5. 🚀 Deploy frontend to Vercel

**Happy Deploying!** ☁️


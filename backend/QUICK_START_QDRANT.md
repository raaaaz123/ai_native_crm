# 🚀 Quick Start - Qdrant Vector Database

## ✅ Migration Complete!

Your backend has been successfully migrated from Pinecone to **Qdrant**.

## 1. Install Dependencies

```bash
cd backend
pip install -r requirements-pinecone.txt
```

This will install:
- ✅ `qdrant-client>=1.7.0` - Qdrant Python client
- ✅ `sentence-transformers>=2.2.2` - Free ChromaDB embeddings
- ✅ All other required packages

## 2. Start the Server

```bash
# From backend directory
python -m uvicorn app.main:app --reload --port 8001
```

You should see:
```
🔄 Connecting to Qdrant at https://44cce1a4...
✅ Connected to Qdrant! Found X collections
🔄 Initializing ChromaDB embeddings (free, open-source)...
✅ ChromaDB embeddings initialized with dimension: 384
✅ Collection 'rexa-engage' already exists
✅ Qdrant service initialized successfully
✅ Pinecone client initialized successfully
🚀 Modular Qdrant Knowledge Base API started successfully
```

## 3. Test the Connection

### Check Health
```bash
curl http://localhost:8001/health
```

Expected response:
```json
{
  "status": "healthy",
  "services": {
    "qdrant": "connected",
    "embeddings": "available",
    "openrouter": "available"
  }
}
```

### Test Qdrant Connection
```bash
curl -X POST http://localhost:8001/api/test-qdrant
```

Expected response:
```json
{
  "status": "success",
  "message": "Qdrant connection test successful",
  "collection_name": "rexa-engage",
  "stats": {
    "total_points": 0,
    "vector_size": 384,
    "status": "green"
  }
}
```

## 4. Upload Test Document

```bash
curl -X POST http://localhost:8001/api/test-store-dummy
```

Expected response:
```json
{
  "status": "success",
  "message": "Dummy data stored successfully in Qdrant",
  "stored_id": "xxx-xxx-xxx",
  "updated_stats": {
    "total_points": 1,
    "vector_size": 384
  }
}
```

## 5. Key Differences from Pinecone

| Feature | Old (Pinecone) | New (Qdrant) |
|---------|---------------|-------------|
| Service file | `pinecone_service.py` | `qdrant_service.py` |
| API endpoint | `/api/test-pinecone` | `/api/test-qdrant` |
| Clean endpoint | `/clean-pinecone` | `/clean-qdrant` |
| Collection name | Index name | Collection name |
| Vector dimensions | 3072 (OpenAI) | 384 (ChromaDB) or 3072 (OpenAI) |

## 6. Common Operations

### Upload Knowledge Base Item
```python
import requests

data = {
    "id": "test-123",
    "businessId": "business-456",
    "widgetId": "widget-789",
    "title": "Test Article",
    "content": "This is test content for the knowledge base.",
    "type": "text"
}

response = requests.post(
    "http://localhost:8001/api/knowledge-base/store",
    json=data
)
print(response.json())
```

### Search Knowledge Base
```python
import requests

search_data = {
    "query": "test content",
    "widgetId": "widget-789",
    "limit": 5
}

response = requests.post(
    "http://localhost:8001/api/knowledge-base/search",
    json=search_data
)
print(response.json())
```

### Delete All Data for Widget
```python
import requests

delete_data = {
    "businessId": "business-456",
    "widgetId": "widget-789"
}

response = requests.delete(
    "http://localhost:8001/api/knowledge-base/delete-all",
    json=delete_data
)
print(response.json())
```

## 7. Troubleshooting

### Issue: Connection Failed
**Check**:
1. Internet connection is active
2. Qdrant URL is correct in `.env`
3. API key is valid

### Issue: Collection Not Found
**Solution**: Collection is auto-created on first use. Check Qdrant Cloud dashboard.

### Issue: Embeddings Failed
**Solution**: 
1. First run may take time to download ChromaDB model (~90MB)
2. Check logs for specific error
3. Verify OpenAI API key if using OpenAI embeddings

### Issue: Dimension Mismatch
**Solution**: If switching embedding providers, recreate collection:
```bash
curl -X DELETE http://localhost:8001/api/knowledge-base/clean-qdrant
```

## 8. Monitoring

### Qdrant Cloud Dashboard
Visit: https://cloud.qdrant.io/

- View collection stats
- Monitor vector count
- Check storage usage
- View API usage

### Local Monitoring
```bash
# Get collection stats
curl -X POST http://localhost:8001/api/test-qdrant

# Check health
curl http://localhost:8001/health

# View logs
tail -f logs/app.log  # if logging configured
```

## 9. Production Deployment

### Environment Variables
Ensure `.env` has:
```bash
# Qdrant Configuration
QDRANT_URL=https://44cce1a4-277d-4473-b8d3-728cebfc6e09.europe-west3-0.gcp.cloud.qdrant.io:6333
QDRANT_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
QDRANT_COLLECTION_NAME=rexa-engage

# Embeddings (optional - defaults to ChromaDB)
OPENAI_API_KEY=sk-...  # Only if using OpenAI embeddings
```

### Deploy to Cloud Run / Heroku / Render
1. Update `requirements-pinecone.txt` ✅ (already done)
2. Update environment variables in platform
3. Deploy as usual
4. Test with `/health` endpoint

## 10. Next Steps

- ✅ Migration complete
- ✅ Server running
- ✅ Connection tested
- 🎯 Upload your knowledge base content
- 🎯 Test search functionality
- 🎯 Update frontend (if needed)
- 🎯 Monitor Qdrant dashboard

## Support

- **Qdrant Docs**: https://qdrant.tech/documentation/
- **API Reference**: https://qdrant.github.io/qdrant/redoc/
- **Discord**: https://qdrant.to/discord
- **GitHub Issues**: https://github.com/qdrant/qdrant/issues

---

**Status**: ✅ Ready to Use  
**Database**: Qdrant Cloud (europe-west3)  
**Embeddings**: ChromaDB (Free) + OpenAI (Fallback)  
**Collection**: rexa-engage


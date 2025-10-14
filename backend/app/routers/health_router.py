"""
Health check and testing router
"""
from fastapi import APIRouter, HTTPException

from app.services.pinecone_service import pinecone_service
from app.services.openrouter_service import openrouter_service

router = APIRouter(tags=["health"])


@router.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "Pinecone Knowledge Base API",
        "version": "1.0.0",
        "status": "healthy"
    }


@router.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "services": {
            "pinecone": "connected" if pinecone_service.pinecone_client else "disconnected",
            "embeddings": "available" if pinecone_service.embeddings else "unavailable",
            "openrouter": "available"
        }
    }


@router.post("/api/test-pinecone")
async def test_pinecone_connection():
    """Test Pinecone connection by checking index stats"""
    try:
        result = pinecone_service.get_index_stats()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/test-store-dummy")
async def test_store_dummy_data():
    """Test storing dummy data in Pinecone with mock embeddings"""
    try:
        result = pinecone_service.store_dummy_data()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/test-openrouter")
async def test_openrouter_connection():
    """Test OpenRouter API connection"""
    try:
        result = openrouter_service.test_connection()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

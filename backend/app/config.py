"""
Configuration settings for the backend
"""
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Pinecone Configuration
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "rexa-engage")

# OpenAI Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# OpenRouter Configuration
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "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")
OPENROUTER_SITE_URL = os.getenv("OPENROUTER_SITE_URL", "http://localhost:3000")
OPENROUTER_SITE_NAME = os.getenv("OPENROUTER_SITE_NAME", "Rexa Engage")

# Firebase Configuration
FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", "rexa-engage")

# CORS Configuration
ALLOWED_ORIGINS = ["http://localhost:3000", "http://localhost:3001"]

# API Configuration
API_HOST = "0.0.0.0"
API_PORT = 8001

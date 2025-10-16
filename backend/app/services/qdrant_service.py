"""
Qdrant vector database service
"""
import io
import uuid
from typing import List, Dict, Any, Optional
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    VectorParams,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue,
    SearchRequest
)
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
import PyPDF2
import pdfplumber

from app.config import QDRANT_URL, QDRANT_API_KEY, QDRANT_COLLECTION_NAME, OPENAI_API_KEY, VOYAGE_API_KEY
from app.services.voyage_service import voyage_service


class QdrantService:
    def __init__(self):
        self.qdrant_client = None
        self.embeddings = None
        self.base_collection_name = QDRANT_COLLECTION_NAME
        self.collection_name = QDRANT_COLLECTION_NAME  # Active collection
        self.embedding_provider = "openai"  # Default: openai or voyage
        self.embedding_model = "text-embedding-3-large"  # Default OpenAI model
        self.voyage_service = voyage_service
        self._initialize()

    def _initialize(self):
        """Initialize Qdrant client (embeddings initialized on-demand)"""
        try:
            # Initialize Qdrant client
            print(f"🔄 Connecting to Qdrant at {QDRANT_URL}...")
            self.qdrant_client = QdrantClient(
                url=QDRANT_URL,
                api_key=QDRANT_API_KEY,
            )
            
            # Test connection
            collections = self.qdrant_client.get_collections()
            print(f"✅ Connected to Qdrant! Found {len(collections.collections)} collections")
            
            # Check which embedding providers are available (don't initialize yet)
            available_providers = []
            if OPENAI_API_KEY and OPENAI_API_KEY != "your-openai-api-key-here":
                available_providers.append("OpenAI")
            if VOYAGE_API_KEY and VOYAGE_API_KEY != "your-voyage-api-key-here":
                available_providers.append("Voyage AI")
            
            print(f"📦 Available embedding providers: {', '.join(available_providers) if available_providers else 'None'}")
            print(f"💡 Embeddings will be initialized on-demand when first needed")
            
            # Note: We don't initialize embeddings here to save costs
            # They will be initialized on-demand via set_embedding_provider()
            self.embeddings = None
            
            print("✅ Qdrant service initialized successfully")
            
        except Exception as e:
            print(f"❌ Error initializing Qdrant: {e}")
            raise

    def _ensure_collection_exists(self, vector_size: int):
        """Ensure the collection exists, create if it doesn't"""
        try:
            # Check if collection exists
            collections = self.qdrant_client.get_collections()
            collection_names = [col.name for col in collections.collections]
            
            if self.collection_name not in collection_names:
                print(f"📦 Creating new collection: {self.collection_name} with dimension {vector_size}")
                self.qdrant_client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(
                        size=vector_size,
                        distance=Distance.COSINE
                    )
                )
                print(f"✅ Collection '{self.collection_name}' created successfully")
            else:
                print(f"✅ Collection '{self.collection_name}' already exists")
                
                # Verify vector size matches
                collection_info = self.qdrant_client.get_collection(self.collection_name)
                existing_size = collection_info.config.params.vectors.size
                
                if existing_size != vector_size:
                    print(f"⚠️ Warning: Collection has dimension {existing_size}, but embeddings have dimension {vector_size}")
                    print(f"💡 You may need to recreate the collection with correct dimensions")
            
            # Create payload indexes for filtering (critical for search performance)
            print(f"🔍 Creating payload indexes for widgetId and businessId...")
            try:
                # Create index for widgetId (keyword type for exact matching)
                self.qdrant_client.create_payload_index(
                    collection_name=self.collection_name,
                    field_name="widgetId",
                    field_schema="keyword"
                )
                print(f"✅ Created payload index for 'widgetId'")
            except Exception as idx_error:
                if "already exists" in str(idx_error).lower():
                    print(f"✅ Payload index for 'widgetId' already exists")
                else:
                    print(f"⚠️ Could not create widgetId index: {idx_error}")
            
            try:
                # Create index for businessId (keyword type for exact matching)
                self.qdrant_client.create_payload_index(
                    collection_name=self.collection_name,
                    field_name="businessId",
                    field_schema="keyword"
                )
                print(f"✅ Created payload index for 'businessId'")
            except Exception as idx_error:
                if "already exists" in str(idx_error).lower():
                    print(f"✅ Payload index for 'businessId' already exists")
                else:
                    print(f"⚠️ Could not create businessId index: {idx_error}")
                    
        except Exception as e:
            print(f"❌ Error ensuring collection exists: {e}")
            raise
    
    def get_embeddings(self, model: str = "text-embedding-3-large"):
        """Get OpenAI embeddings instance with specified model"""
        try:
            if not OPENAI_API_KEY or OPENAI_API_KEY == "your-openai-api-key-here":
                raise Exception("OpenAI API key not configured")
            
            return OpenAIEmbeddings(
                openai_api_key=OPENAI_API_KEY,
                model=model
            )
        except Exception as e:
            print(f"Error getting embeddings: {e}")
            raise
    
    def _get_collection_name(self, provider: str) -> str:
        """Get collection name based on embedding provider"""
        if provider == "voyage":
            return f"{self.base_collection_name}-voyage"
        else:
            return self.base_collection_name  # Keep original name for OpenAI
    
    def set_embedding_provider(self, provider: str, model: str):
        """Set the embedding provider (openai or voyage) and model, initializing on-demand"""
        try:
            # Check if we need to re-initialize
            needs_init = False
            
            if self.embedding_provider != provider or self.embedding_model != model:
                needs_init = True
            elif provider == "openai" and not self.embeddings:
                needs_init = True
            elif provider == "voyage" and not self.voyage_service.client:
                needs_init = True
            
            if not needs_init:
                print(f"✅ Already using {provider}/{model} (initialized)")
                return
            
            print(f"🔄 Setting up embeddings: {provider}/{model}")
            self.embedding_provider = provider
            self.embedding_model = model
            
            # Update collection name based on provider
            self.collection_name = self._get_collection_name(provider)
            print(f"   📦 Collection: {self.collection_name}")
            
            if provider == "voyage":
                # Use Voyage AI
                if not self.voyage_service.client:
                    raise Exception("Voyage AI client not initialized - check VOYAGE_API_KEY in .env")
                
                print(f"✅ Switched to Voyage AI embeddings (model: {model})")
                print(f"   🚢 Voyage AI ready for use")
                print(f"   📊 Dimension: {self.voyage_service.get_embedding_dimension(model)}")
                
                # Ensure collection exists with correct dimensions
                self._ensure_collection_exists(self.voyage_service.get_embedding_dimension(model))
                    
            elif provider == "openai":
                # Initialize OpenAI embeddings
                if not OPENAI_API_KEY or OPENAI_API_KEY == "your-openai-api-key-here":
                    raise Exception("OpenAI API key not configured - check OPENAI_API_KEY in .env")
                
                # Always initialize/re-initialize to ensure it's ready
                print(f"🔄 Initializing OpenAI embeddings (model: {model})...")
                self.embeddings = OpenAIEmbeddings(
                    openai_api_key=OPENAI_API_KEY,
                    model=model
                )
                # Get embedding dimension
                test_embedding = self.embeddings.embed_query("test")
                embedding_dim = len(test_embedding)
                print(f"✅ OpenAI embeddings initialized")
                print(f"   🤖 Model: {model}")
                print(f"   📊 Dimension: {embedding_dim}")
                
                # Ensure collection exists with correct dimensions
                self._ensure_collection_exists(embedding_dim)
            else:
                raise Exception(f"Unknown embedding provider: {provider}")
                
        except Exception as e:
            print(f"❌ Error setting embedding provider: {e}")
            raise
    
    def set_embedding_model(self, model: str):
        """Set the embedding model to use (legacy method for backward compatibility)"""
        try:
            # Determine provider from model name
            if model.startswith("voyage-"):
                self.set_embedding_provider("voyage", model)
            else:
                self.set_embedding_provider("openai", model)
        except Exception as e:
            print(f"Error setting embedding model: {e}")
            raise

    def extract_text_from_pdf(self, file_content: bytes) -> str:
        """Extract text from PDF file using multiple methods for better accuracy"""
        try:
            # Method 1: Try pdfplumber first (better for complex layouts)
            pdf_file = io.BytesIO(file_content)
            text_content = ""
            
            with pdfplumber.open(pdf_file) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text_content += page_text + "\n"
            
            if text_content.strip():
                return text_content.strip()
            
            # Method 2: Fallback to PyPDF2 if pdfplumber fails
            pdf_file.seek(0)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            text_content = ""
            
            for page in pdf_reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text_content += page_text + "\n"
            
            return text_content.strip() if text_content.strip() else "No text could be extracted from this PDF"
            
        except Exception as e:
            print(f"Error extracting text from PDF: {e}")
            return f"Error extracting text from PDF: {str(e)}"

    def store_knowledge_item(self, item: Dict[str, Any], embedding_provider: str = None, embedding_model: str = None) -> Dict[str, Any]:
        """Store a knowledge base item in Qdrant using specified embedding provider"""
        try:
            if not self.qdrant_client:
                raise Exception("Qdrant client not initialized")
            
            # Use provided provider/model or fall back to current settings
            provider = embedding_provider or self.embedding_provider
            model = embedding_model or self.embedding_model
            
            print(f"📦 Storing knowledge item with {provider}/{model}")
            
            # Check embeddings are available
            if provider == "voyage":
                if not self.voyage_service.client:
                    raise Exception("Voyage AI embeddings not initialized")
            else:
                if not self.embeddings:
                    raise Exception("OpenAI embeddings not initialized")
            
            # Split the content into chunks
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1500,
                chunk_overlap=300,
                length_function=len,
            )
            
            # Split the content
            texts = text_splitter.split_text(item["content"])
            
            # Generate embeddings based on provider
            if provider == "voyage":
                print(f"   🚢 Generating Voyage AI embeddings for {len(texts)} chunks...")
                embeddings = self.voyage_service.embed_documents(texts, model)
            else:
                print(f"   🤖 Generating OpenAI embeddings for {len(texts)} chunks...")
                embeddings = self.embeddings.embed_documents(texts)
            
            # Prepare points for Qdrant
            points = []
            for i, (text, embedding) in enumerate(zip(texts, embeddings)):
                point_id = str(uuid.uuid4())
                
                payload = {
                    "businessId": item["businessId"],
                    "widgetId": item["widgetId"],
                    "itemId": item["id"],
                    "title": item["title"],
                    "type": item["type"],
                    "text": text,
                    "chunkIndex": i,
                    "totalChunks": len(texts),
                }
                
                # Add file metadata if available
                if item.get("fileName"):
                    payload["fileName"] = item["fileName"]
                if item.get("fileUrl"):
                    payload["fileUrl"] = item["fileUrl"]
                if item.get("fileSize"):
                    payload["fileSize"] = item["fileSize"]
                
                points.append(PointStruct(
                    id=point_id,
                    vector=embedding,
                    payload=payload
                ))
            
            # Upload points to Qdrant
            self.qdrant_client.upsert(
                collection_name=self.collection_name,
                points=points
            )
            
            return {
                "success": True,
                "message": f"Successfully stored {len(texts)} chunks for item {item['id']}",
                "chunks_created": len(texts),
                "point_ids": [point.id for point in points]
            }
            
        except Exception as e:
            print(f"Error storing knowledge item: {e}")
            raise Exception(str(e))

    def search_knowledge_base(self, query: str, widget_id: str, limit: int = 5, score_threshold: float = 0.05) -> Dict[str, Any]:
        """Search knowledge base using semantic search with liberal matching (threshold: 0.05 = very lenient, let AI decide relevance)"""
        try:
            if not self.qdrant_client:
                raise Exception("Qdrant client not initialized")
            
            # Check if embeddings are available based on provider
            if self.embedding_provider == "voyage":
                if not self.voyage_service.client:
                    raise Exception("Voyage AI embeddings not initialized")
            else:
                if not self.embeddings:
                    raise Exception("OpenAI embeddings not initialized")
            
            # Preprocess query to handle typos and variations
            preprocessed_query = self._preprocess_query(query)
            
            print(f"🔍 RAG Search:")
            print(f"   Provider: {self.embedding_provider}")
            print(f"   Model: {self.embedding_model}")
            print(f"   Original query: '{query}'")
            if preprocessed_query != query:
                print(f"   Preprocessed: '{preprocessed_query}'")
            print(f"   Score threshold: {score_threshold}")
            
            # Generate query embedding based on provider
            if self.embedding_provider == "voyage":
                if not self.voyage_service.client:
                    raise Exception("Voyage AI client not initialized")
                query_embedding = self.voyage_service.embed_query(preprocessed_query, self.embedding_model)
                print(f"   🚢 Using Voyage AI embeddings")
            else:
                # Use OpenAI (default)
                if not self.embeddings:
                    raise Exception("OpenAI embeddings not initialized")
                query_embedding = self.embeddings.embed_query(preprocessed_query)
                print(f"   🤖 Using OpenAI embeddings")
            
            # Search in Qdrant with filter (get more results for filtering)
            # Note: We get all results and filter by score ourselves for better control
            search_results = self.qdrant_client.search(
                collection_name=self.collection_name,
                query_vector=query_embedding,
                query_filter=Filter(
                    must=[
                        FieldCondition(
                            key="widgetId",
                            match=MatchValue(value=widget_id)
                        )
                    ]
                ),
                limit=limit * 3,  # Get more results for quality filtering
                score_threshold=None  # Don't filter by Qdrant, we'll filter ourselves
            )
            
            # Format results and apply additional quality checks
            results = []
            for result in search_results:
                score = float(result.score)
                print(f"   📄 Found: '{result.payload.get('title', 'Untitled')}' (score: {score:.4f})")
                
                # Only include results above threshold
                if score >= score_threshold:
                    results.append({
                        "content": result.payload.get("text", ""),
                        "metadata": result.payload,
                        "score": score
                    })
            
            # Limit to requested number
            results = results[:limit]
            
            print(f"   ✅ Returning {len(results)} results (threshold: {score_threshold})")
            
            return {
                "success": True,
                "results": results,
                "query": preprocessed_query,
                "total_results": len(results)
            }
            
        except Exception as e:
            print(f"Error searching knowledge base: {e}")
            raise Exception(str(e))
    
    def _preprocess_query(self, query: str) -> str:
        """Preprocess query to improve search quality with typo correction and semantic expansion"""
        # Common typo corrections
        corrections = {
            "buisnus": "business",
            "buisness": "business",
            "busines": "business",
            "bussiness": "business",
            "tme": "time",
            "tym": "time",
            "wrking": "working",
            "workin": "working",
            "hrs": "hours",
            "hr": "hour",
            "prcng": "pricing",
            "prcing": "pricing",
            "prce": "price",
            "cntact": "contact",
            "questn": "question",
            "questin": "question"
        }
        
        # Semantic variations - expand common phrases to improve matching
        semantic_expansions = {
            "business time": "business hours working hours schedule",
            "business hours": "business hours working hours schedule office hours",
            "working time": "working hours business hours schedule",
            "office time": "office hours business hours working hours",
            "price": "pricing cost price fees",
            "cost": "pricing cost price fees",
            "contact info": "contact information email phone address",
            "reach you": "contact information email phone",
            "location": "address location where find"
        }
        
        query_lower = query.lower()
        
        # First, check for semantic expansions
        expanded_query = query_lower
        for phrase, expansion in semantic_expansions.items():
            if phrase in query_lower:
                expanded_query = expansion
                print(f"   🔄 Semantic expansion: '{phrase}' → '{expansion}'")
                break
        
        # Then apply typo corrections
        words = expanded_query.split()
        corrected_words = []
        
        for word in words:
            # Remove punctuation for matching
            clean_word = word.strip('.,!?;:')
            corrected = corrections.get(clean_word, clean_word)
            # Preserve original punctuation
            if word != clean_word:
                corrected += word[len(clean_word):]
            corrected_words.append(corrected)
        
        corrected_query = ' '.join(corrected_words)
        
        if corrected_query != query.lower():
            print(f"   ✏️ Final query: '{query}' → '{corrected_query}'")
        
        return corrected_query

    def get_collection_stats(self) -> Dict[str, Any]:
        """Get Qdrant collection statistics"""
        try:
            if not self.qdrant_client:
                raise Exception("Qdrant client not initialized")
            
            collection_info = self.qdrant_client.get_collection(self.collection_name)
            
            return {
                "status": "success",
                "message": "Qdrant connection test successful",
                "collection_name": self.collection_name,
                "stats": {
                    "total_points": collection_info.points_count,
                    "vector_size": collection_info.config.params.vectors.size,
                    "status": collection_info.status
                }
            }
            
        except Exception as e:
            raise Exception(f"Qdrant connection test failed: {str(e)}")

    def delete_all_data(self, business_id: str, widget_id: str = "all") -> Dict[str, Any]:
        """Delete all knowledge base data for a business or widget"""
        try:
            if not self.qdrant_client:
                raise Exception("Qdrant client not initialized")
            
            # Build filter
            if widget_id == "all":
                filter_condition = Filter(
                    must=[
                        FieldCondition(
                            key="businessId",
                            match=MatchValue(value=business_id)
                        )
                    ]
                )
            else:
                filter_condition = Filter(
                    must=[
                        FieldCondition(
                            key="businessId",
                            match=MatchValue(value=business_id)
                        ),
                        FieldCondition(
                            key="widgetId",
                            match=MatchValue(value=widget_id)
                        )
                    ]
                )
            
            # Delete points matching filter
            self.qdrant_client.delete(
                collection_name=self.collection_name,
                points_selector=filter_condition
            )
            
            return {
                "success": True,
                "message": f"Successfully deleted data for business {business_id}" + 
                          (f" and widget {widget_id}" if widget_id != "all" else ""),
                "business_id": business_id,
                "widget_id": widget_id
            }
            
        except Exception as e:
            print(f"Error deleting data: {e}")
            raise Exception(str(e))

    def clean_collection(self) -> Dict[str, Any]:
        """Clean entire Qdrant collection (dangerous!)"""
        try:
            if not self.qdrant_client:
                raise Exception("Qdrant client not initialized")
            
            # Get stats before deletion
            collection_info = self.qdrant_client.get_collection(self.collection_name)
            total_points = collection_info.points_count
            
            # Delete the collection
            self.qdrant_client.delete_collection(self.collection_name)
            print(f"🗑️ Deleted collection: {self.collection_name}")
            
            # Recreate the collection
            vector_size = collection_info.config.params.vectors.size
            self.qdrant_client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(
                    size=vector_size,
                    distance=Distance.COSINE
                )
            )
            print(f"🔄 Recreated collection: {self.collection_name}")
            
            return {
                "success": True,
                "message": f"Successfully cleaned collection! Deleted {total_points} points and recreated collection.",
                "deleted_count": total_points,
                "total_points_before": total_points,
                "collection_recreated": True
            }
            
        except Exception as e:
            print(f"Error cleaning collection: {e}")
            raise Exception(str(e))

    def store_dummy_data(self) -> Dict[str, Any]:
        """Store dummy data for testing"""
        try:
            if not self.qdrant_client:
                raise Exception("Qdrant client not initialized")
            
            if not self.embeddings:
                raise Exception("Embeddings not initialized")
            
            # Create dummy data
            dummy_text = "This is a test dummy knowledge base item to verify Qdrant storage is working correctly."
            dummy_id = str(uuid.uuid4())
            
            # Generate embedding
            embedding = self.embeddings.embed_query(dummy_text)
            
            # Create point
            point = PointStruct(
                id=dummy_id,
                vector=embedding,
                payload={
                    "businessId": "test-business-123",
                    "widgetId": "test-widget-456",
                    "itemId": dummy_id,
                    "title": "Test Dummy Knowledge Item",
                    "type": "text",
                    "text": dummy_text,
                    "chunkIndex": 0,
                    "totalChunks": 1
                }
            )
            
            # Upload to Qdrant
            self.qdrant_client.upsert(
                collection_name=self.collection_name,
                points=[point]
            )
            
            # Get updated stats
            collection_info = self.qdrant_client.get_collection(self.collection_name)
            
            return {
                "status": "success",
                "message": "Dummy data stored successfully in Qdrant",
                "stored_id": dummy_id,
                "payload": point.payload,
                "updated_stats": {
                    "total_points": collection_info.points_count,
                    "vector_size": collection_info.config.params.vectors.size
                }
            }
            
        except Exception as e:
            raise Exception(f"Failed to store dummy data: {str(e)}")


# Global service instance
qdrant_service = QdrantService()


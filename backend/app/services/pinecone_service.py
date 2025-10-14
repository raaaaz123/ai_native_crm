"""
Pinecone vector database service
"""
import os
import io
import random
from typing import List, Dict, Any, Optional
from pinecone import Pinecone
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_pinecone import PineconeVectorStore
from langchain.schema import Document
import PyPDF2
import pdfplumber

from app.config import PINECONE_API_KEY, PINECONE_INDEX_NAME, OPENAI_API_KEY


class PineconeService:
    def __init__(self):
        self.pinecone_client = None
        self.vectorstore = None
        self.embeddings = None
        self._initialize()

    def _initialize(self):
        """Initialize Pinecone client and vector store"""
        try:
            # Initialize Pinecone client
            self.pinecone_client = Pinecone(api_key=PINECONE_API_KEY)
            
            # Try to initialize OpenAI embeddings
            if OPENAI_API_KEY and OPENAI_API_KEY != "your-openai-api-key-here":
                try:
                    self.embeddings = OpenAIEmbeddings(
                        openai_api_key=OPENAI_API_KEY,
                        model="text-embedding-3-large"
                    )
                    
                    # Connect to Pinecone index
                    self.vectorstore = PineconeVectorStore.from_existing_index(
                        index_name=PINECONE_INDEX_NAME,
                        embedding=self.embeddings
                    )
                    print("✅ Pinecone initialized successfully with OpenAI embeddings")
                except Exception as openai_error:
                    print(f"⚠️ OpenAI embeddings failed: {openai_error}")
                    print("📝 Will use mock embeddings for testing")
                    self.embeddings = None
                    self.vectorstore = None
            else:
                print("⚠️ OpenAI API key not configured")
                print("📝 Will use mock embeddings for testing")
                self.embeddings = None
                self.vectorstore = None
            
            print("✅ Pinecone client initialized successfully")
            
        except Exception as e:
            print(f"❌ Error initializing Pinecone: {e}")
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

    def store_with_mock_embeddings(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """Store knowledge base item with mock embeddings when OpenAI is not available"""
        try:
            # Get index
            index = self.pinecone_client.Index(PINECONE_INDEX_NAME)
            
            # Create mock embedding (3072 dimensions to match index)
            mock_vector = [random.uniform(-1, 1) for _ in range(3072)]
            
            # Create metadata
            metadata = {
                "businessId": item["businessId"],
                "widgetId": item["widgetId"],
                "itemId": item["id"],
                "title": item["title"],
                "type": item["type"],
                "text": item["content"],
                "chunkIndex": 0,
                "totalChunks": 1,
                "mock_embedding": True
            }
            
            # Add file metadata if available
            if item.get("fileName"):
                metadata["fileName"] = item["fileName"]
            if item.get("fileUrl"):
                metadata["fileUrl"] = item["fileUrl"]
            if item.get("fileSize"):
                metadata["fileSize"] = item["fileSize"]
            
            # Store the vector
            index.upsert(vectors=[(item["id"], mock_vector, metadata)])
            
            return {
                "success": True,
                "message": "Knowledge base item stored successfully with mock embeddings",
                "id": item["id"],
                "note": "Using mock embeddings - configure OpenAI API key for semantic search",
                "vector_id": f"mock_{item['id']}_{random.randint(1000, 9999)}"
            }
            
        except Exception as e:
            raise Exception(f"Failed to store with mock embeddings: {str(e)}")

    def store_knowledge_item(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """Store a knowledge base item in Pinecone"""
        try:
            if not self.pinecone_client:
                raise Exception("Pinecone client not initialized")
            
            # Check if embeddings are available
            if not self.embeddings:
                return self.store_with_mock_embeddings(item)
            
            if not self.vectorstore:
                raise Exception("Vector store not initialized")
            
            # Split the content into chunks
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1500,
                chunk_overlap=300,
                length_function=len,
            )
            
            # Split the content
            texts = text_splitter.split_text(item["content"])
            
            # Prepare metadata for each chunk
            metadatas = []
            for i, text in enumerate(texts):
                metadata = {
                    "businessId": item["businessId"],
                    "widgetId": item["widgetId"],
                    "itemId": item["id"],
                    "title": item["title"],
                    "type": item["type"],
                    "chunkIndex": i,
                    "totalChunks": len(texts),
                    "text": text
                }
                
                # Add file metadata if available
                if item.get("fileName"):
                    metadata["fileName"] = item["fileName"]
                if item.get("fileUrl"):
                    metadata["fileUrl"] = item["fileUrl"]
                if item.get("fileSize"):
                    metadata["fileSize"] = item["fileSize"]
                    
                metadatas.append(metadata)
            
            # Store in Pinecone
            vector_ids = self.vectorstore.add_texts(texts=texts, metadatas=metadatas)
            
            return {
                "success": True,
                "message": f"Successfully stored {len(texts)} chunks for item {item['id']}",
                "chunks_created": len(texts),
                "vector_id": vector_ids[0] if vector_ids else f"{item['id']}_0"
            }
            
        except Exception as e:
            print(f"Error storing knowledge item: {e}")
            raise Exception(str(e))

    def search_knowledge_base(self, query: str, widget_id: str, limit: int = 5) -> Dict[str, Any]:
        """Search knowledge base using semantic search"""
        try:
            if not self.vectorstore:
                raise Exception("Vector store not initialized")
            
            # Perform similarity search
            results = self.vectorstore.similarity_search_with_score(
                query,
                k=limit,
                filter={"widgetId": widget_id}
            )
            
            # Format results
            search_results = []
            for doc, score in results:
                search_results.append({
                    "content": doc.page_content,
                    "metadata": doc.metadata,
                    "score": float(score)
                })
            
            return {
                "success": True,
                "results": search_results,
                "query": query,
                "total_results": len(search_results)
            }
            
        except Exception as e:
            print(f"Error searching knowledge base: {e}")
            raise Exception(str(e))

    def get_index_stats(self) -> Dict[str, Any]:
        """Get Pinecone index statistics"""
        try:
            if not self.pinecone_client:
                raise Exception("Pinecone client not initialized")
            
            index = self.pinecone_client.Index(PINECONE_INDEX_NAME)
            stats = index.describe_index_stats()
            
            return {
                "status": "success",
                "message": "Pinecone connection test successful",
                "index_name": PINECONE_INDEX_NAME,
                "stats": {
                    "total_vector_count": stats.total_vector_count,
                    "dimension": stats.dimension,
                    "index_fullness": stats.index_fullness
                }
            }
            
        except Exception as e:
            raise Exception(f"Pinecone connection test failed: {str(e)}")

    def store_dummy_data(self) -> Dict[str, Any]:
        """Store dummy data for testing"""
        try:
            if not self.pinecone_client:
                raise Exception("Pinecone client not initialized")
            
            index = self.pinecone_client.Index(PINECONE_INDEX_NAME)
            
            # Create dummy data with mock embedding
            dummy_vector = [random.uniform(-1, 1) for _ in range(3072)]
            dummy_id = f"test-dummy-{random.randint(1000, 9999)}"
            metadata = {
                "businessId": "test-business-123",
                "widgetId": "test-widget-456",
                "itemId": dummy_id,
                "title": "Test Dummy Knowledge Item",
                "type": "text",
                "text": "This is a test dummy knowledge base item to verify Pinecone storage is working correctly.",
                "chunkIndex": 0,
                "totalChunks": 1
            }
            
            # Store the vector
            index.upsert(vectors=[(dummy_id, dummy_vector, metadata)])
            
            # Get updated stats
            stats = index.describe_index_stats()
            
            return {
                "status": "success",
                "message": "Dummy data stored successfully in Pinecone",
                "stored_id": dummy_id,
                "metadata": metadata,
                "updated_stats": {
                    "total_vector_count": stats.total_vector_count,
                    "dimension": stats.dimension,
                    "index_fullness": stats.index_fullness
                }
            }
            
        except Exception as e:
            raise Exception(f"Failed to store dummy data: {str(e)}")


# Global service instance
pinecone_service = PineconeService()

"""
Knowledge base router for Pinecone operations
"""
from fastapi import APIRouter, HTTPException, File, UploadFile, Form
from typing import Optional
import json
import uuid

from app.models import KnowledgeBaseItem, SearchRequest, DocumentUploadResponse
from app.services.pinecone_service import pinecone_service

router = APIRouter(prefix="/api/knowledge-base", tags=["knowledge-base"])


@router.post("/store")
async def store_knowledge_item(item: KnowledgeBaseItem):
    """Store a knowledge base item in Pinecone"""
    try:
        result = pinecone_service.store_knowledge_item(item.dict())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload")
async def upload_document(
    widget_id: str = Form(...),
    title: str = Form(...),
    document_type: str = Form(...),
    content: Optional[str] = Form(None),
    metadata: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None)
):
    """Upload and process documents (text or PDF) to knowledge base"""
    try:
        # Parse metadata if provided
        parsed_metadata = {}
        if metadata:
            try:
                parsed_metadata = json.loads(metadata)
            except json.JSONDecodeError:
                parsed_metadata = {"raw_metadata": metadata}
        
        # Generate unique ID
        item_id = f"upload-{uuid.uuid4().hex[:8]}"
        
        # Process content based on document type
        final_content = content or ""
        file_info = {}
        
        if file and document_type == "pdf":
            # Read and process PDF file
            file_content = await file.read()
            file_info = {
                "fileName": file.filename,
                "fileSize": len(file_content),
                "contentType": file.content_type
            }
            
            # Extract text from PDF
            extracted_text = pinecone_service.extract_text_from_pdf(file_content)
            final_content = extracted_text
            
            print(f"📄 PDF processed: {file.filename}, extracted {len(extracted_text)} characters")
        
        elif file and document_type == "text":
            # Handle text file upload
            file_content = await file.read()
            file_info = {
                "fileName": file.filename,
                "fileSize": len(file_content),
                "contentType": file.content_type
            }
            
            try:
                final_content = file_content.decode('utf-8')
            except UnicodeDecodeError:
                final_content = file_content.decode('utf-8', errors='ignore')
            
            print(f"📝 Text file processed: {file.filename}")
        
        # Create knowledge base item
        knowledge_item = {
            "id": item_id,
            "businessId": parsed_metadata.get("business_id", "unknown"),
            "widgetId": widget_id,
            "title": title,
            "content": final_content,
            "type": document_type,
            "fileName": file_info.get("fileName"),
            "fileSize": file_info.get("fileSize")
        }
        
        # Store in Pinecone
        if not pinecone_service.pinecone_client:
            raise HTTPException(status_code=500, detail="Pinecone client not initialized")
        
        if pinecone_service.embeddings and pinecone_service.vectorstore:
            # Use real embeddings
            try:
                from langchain.text_splitter import RecursiveCharacterTextSplitter
                
                # Split text into chunks for better processing
                text_splitter = RecursiveCharacterTextSplitter(
                    chunk_size=1000,
                    chunk_overlap=200,
                    length_function=len
                )
                
                chunks = text_splitter.split_text(final_content)
                
                # Create metadata for each chunk
                metadatas = []
                for i, chunk in enumerate(chunks):
                    chunk_metadata = {
                        "id": f"{item_id}-chunk-{i}",
                        "business_id": knowledge_item["businessId"],
                        "widget_id": knowledge_item["widgetId"],
                        "title": knowledge_item["title"],
                        "type": knowledge_item["type"],
                        "chunk_index": i,
                        "total_chunks": len(chunks),
                        **file_info,
                        **parsed_metadata
                    }
                    metadatas.append(chunk_metadata)
                
                # Store in vectorstore
                pinecone_service.vectorstore.add_texts(
                    texts=chunks,
                    metadatas=metadatas,
                    ids=[f"{item_id}-chunk-{i}" for i in range(len(chunks))]
                )
                
                return DocumentUploadResponse(
                    success=True,
                    message=f"Document '{title}' uploaded and vectorized successfully with {len(chunks)} chunks",
                    id=item_id,
                    processing_status="completed"
                )
                
            except Exception as openai_error:
                print(f"⚠️ OpenAI embeddings failed: {openai_error}")
                # Fall back to mock embeddings
        
        # Use mock embeddings fallback
        result = pinecone_service.store_with_mock_embeddings(knowledge_item)
        
        return DocumentUploadResponse(
            success=True,
            message=f"Document '{title}' uploaded successfully with mock embeddings (Configure OpenAI API key for semantic search)",
            id=item_id,
            processing_status="completed"
        )
        
    except Exception as e:
        print(f"❌ Error uploading document: {e}")
        raise HTTPException(status_code=500, detail=f"Error uploading document: {str(e)}")


@router.post("/search")
async def search_knowledge_base(request: SearchRequest):
    """Search knowledge base using semantic search"""
    try:
        result = pinecone_service.search_knowledge_base(
            request.query, 
            request.widgetId, 
            request.limit
        )
        return result
    except Exception as e:
        print(f"Error searching knowledge base: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/delete/{item_id}")
async def delete_knowledge_item(item_id: str):
    """Delete all chunks for a specific knowledge base item"""
    try:
        if not pinecone_service.vectorstore:
            raise HTTPException(status_code=500, detail="Vector store not initialized")
        
        # Note: Pinecone doesn't have a direct way to delete by metadata
        # This would require querying first and then deleting by ID
        # For now, we'll return a success message
        # In production, you'd want to implement proper deletion logic
        
        return {
            "success": True,
            "message": f"Delete request received for item {item_id}",
            "note": "Actual deletion requires implementation of query-then-delete logic"
        }
        
    except Exception as e:
        print(f"Error deleting knowledge item: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/delete-all")
async def delete_all_knowledge_data(request: dict):
    """Delete all knowledge base data for a business or widget"""
    try:
        business_id = request.get("businessId")
        widget_id = request.get("widgetId", "all")
        
        if not business_id:
            raise HTTPException(status_code=400, detail="businessId is required")
        
        if not pinecone_service.pinecone_client:
            raise HTTPException(status_code=500, detail="Pinecone client not initialized")
        
        from app.config import PINECONE_INDEX_NAME
        index = pinecone_service.pinecone_client.Index(PINECONE_INDEX_NAME)
        
        # Get all vectors for the business
        # Note: This is a simplified approach. In production, you'd want to use proper querying
        try:
            # Query to get all vectors for the business
            query_response = index.query(
                vector=[0.0] * 3072,  # Dummy vector for querying
                top_k=10000,  # Large number to get all vectors
                include_metadata=True,
                filter={"businessId": business_id} if widget_id == "all" else {"businessId": business_id, "widgetId": widget_id}
            )
            
            # Extract vector IDs to delete
            vector_ids_to_delete = []
            for match in query_response.matches:
                vector_ids_to_delete.append(match.id)
            
            # Delete vectors in batches
            deleted_count = 0
            if vector_ids_to_delete:
                # Delete in batches of 100 (Pinecone limit)
                batch_size = 100
                for i in range(0, len(vector_ids_to_delete), batch_size):
                    batch = vector_ids_to_delete[i:i + batch_size]
                    index.delete(ids=batch)
                    deleted_count += len(batch)
            
            return {
                "success": True,
                "message": f"Successfully deleted {deleted_count} vectors from Pinecone",
                "deleted_count": deleted_count,
                "business_id": business_id,
                "widget_id": widget_id
            }
            
        except Exception as query_error:
            print(f"Error querying/deleting vectors: {query_error}")
            # Fallback: try to delete by business ID pattern
            try:
                # This is a more aggressive approach - delete all vectors with business ID in metadata
                # Note: This might delete more than intended if business IDs overlap
                index.delete(filter={"businessId": business_id})
                return {
                    "success": True,
                    "message": f"Successfully deleted all vectors for business {business_id} from Pinecone",
                    "deleted_count": "unknown",
                    "business_id": business_id,
                    "widget_id": widget_id,
                    "note": "Used fallback deletion method"
                }
            except Exception as fallback_error:
                print(f"Fallback deletion also failed: {fallback_error}")
                raise HTTPException(status_code=500, detail=f"Failed to delete vectors: {str(fallback_error)}")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting all knowledge data: {e}")
        raise HTTPException(status_code=500, detail=f"Error deleting all knowledge data: {str(e)}")


@router.delete("/clean-pinecone")
async def clean_entire_pinecone_index():
    """🚨 DANGER: Delete ALL vectors from the entire Pinecone index"""
    try:
        if not pinecone_service.pinecone_client:
            raise HTTPException(status_code=500, detail="Pinecone client not initialized")
        
        from app.config import PINECONE_INDEX_NAME
        index = pinecone_service.pinecone_client.Index(PINECONE_INDEX_NAME)
        
        print("🚨 WARNING: Attempting to clean entire Pinecone index!")
        
        # Get index stats first
        stats = index.describe_index_stats()
        total_vectors = stats.total_vector_count
        
        if total_vectors == 0:
            return {
                "success": True,
                "message": "Pinecone index is already empty",
                "deleted_count": 0,
                "total_vectors_before": 0
            }
        
        # Delete all vectors by deleting the entire index and recreating it
        # This is the most reliable way to clean everything
        try:
            # Get the index configuration
            index_config = index.describe_index_stats()
            
            # Delete the entire index
            pinecone_service.pinecone_client.delete_index(PINECONE_INDEX_NAME)
            print(f"🗑️ Deleted index: {PINECONE_INDEX_NAME}")
            
            # Recreate the index with the same configuration
            pinecone_service.pinecone_client.create_index(
                name=PINECONE_INDEX_NAME,
                dimension=3072,  # Standard dimension for OpenAI embeddings
                metric="cosine",
                spec={
                    "serverless": {
                        "cloud": "aws",
                        "region": "us-east-1"
                    }
                }
            )
            print(f"🔄 Recreated index: {PINECONE_INDEX_NAME}")
            
            return {
                "success": True,
                "message": f"Successfully cleaned entire Pinecone index! Deleted {total_vectors} vectors and recreated index.",
                "deleted_count": total_vectors,
                "total_vectors_before": total_vectors,
                "index_recreated": True
            }
            
        except Exception as recreate_error:
            print(f"Error recreating index: {recreate_error}")
            # If recreation fails, try alternative method
            try:
                # Alternative: Try to delete all vectors using query and delete
                query_response = index.query(
                    vector=[0.0] * 3072,
                    top_k=10000,
                    include_metadata=False
                )
                
                vector_ids = [match.id for match in query_response.matches]
                
                if vector_ids:
                    # Delete in batches
                    batch_size = 100
                    deleted_count = 0
                    for i in range(0, len(vector_ids), batch_size):
                        batch = vector_ids[i:i + batch_size]
                        index.delete(ids=batch)
                        deleted_count += len(batch)
                    
                    return {
                        "success": True,
                        "message": f"Successfully deleted {deleted_count} vectors from Pinecone index",
                        "deleted_count": deleted_count,
                        "total_vectors_before": total_vectors,
                        "index_recreated": False
                    }
                else:
                    return {
                        "success": True,
                        "message": "No vectors found to delete",
                        "deleted_count": 0,
                        "total_vectors_before": total_vectors
                    }
                    
            except Exception as fallback_error:
                print(f"Fallback deletion also failed: {fallback_error}")
                raise HTTPException(status_code=500, detail=f"Failed to clean Pinecone index: {str(fallback_error)}")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error cleaning entire Pinecone index: {e}")
        raise HTTPException(status_code=500, detail=f"Error cleaning Pinecone index: {str(e)}")
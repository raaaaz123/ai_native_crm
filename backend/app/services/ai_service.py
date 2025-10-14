"""
AI and chat service for RAG pipeline using OpenRouter
"""
import os
from typing import List, Dict, Any
from app.services.pinecone_service import pinecone_service
from app.services.openrouter_service import openrouter_service
from app.models import AIConfig, AIResponse


class AIService:
    def __init__(self):
        self.openrouter_service = openrouter_service

    def get_rag_context(self, widget_id: str, business_id: str, query: str, max_docs: int = 5) -> List[Dict[str, Any]]:
        """Get relevant context from Pinecone for RAG"""
        try:
            if not pinecone_service.vectorstore:
                print("⚠️ Vector store not initialized - cannot retrieve RAG context")
                return []
            
            # Use businessId if provided, otherwise try widgetId
            search_filter = {"businessId": business_id} if business_id else {"widgetId": widget_id}
            
            print(f"\n🔍 RAG RETRIEVAL DEBUG:")
            print(f"   Widget ID: {widget_id}")
            print(f"   Business ID: {business_id}")
            print(f"   Search Filter: {search_filter}")
            print(f"   Query: '{query}'")
            print(f"   Max Docs: {max_docs}")
            
            # Perform similarity search
            results = pinecone_service.vectorstore.similarity_search_with_score(
                query,
                k=max_docs,
                filter=search_filter
            )
            
            print(f"\n📊 RAG RETRIEVAL RESULTS:")
            print(f"   Documents Found: {len(results)}")
            
            # Format results
            context_docs = []
            for idx, (doc, score) in enumerate(results):
                print(f"\n   Document {idx + 1}:")
                print(f"      Score: {float(score):.4f}")
                print(f"      Metadata: {doc.metadata}")
                print(f"      Content Preview: {doc.page_content[:200]}...")
                
                context_docs.append({
                    "content": doc.page_content,
                    "metadata": doc.metadata,
                    "score": float(score)
                })
            
            if len(context_docs) == 0:
                print("\n⚠️ WARNING: No documents found in knowledge base!")
                print(f"   Make sure you have added knowledge base items for businessId: {business_id}")
            
            return context_docs
            
        except Exception as e:
            print(f"\n❌ ERROR getting RAG context: {e}")
            import traceback
            traceback.print_exc()
            return []

    def calculate_confidence(self, response: str, sources: List[dict]) -> float:
        """Calculate confidence score based on response and sources"""
        try:
            # Start with good confidence if we have sources
            base_confidence = 0.7 if len(sources) > 0 else 0.3
            
            print(f"\n📊 CONFIDENCE CALCULATION:")
            print(f"   Base: {base_confidence} (sources: {len(sources)})")
            
            # Boost confidence based on number of sources
            if len(sources) > 1:
                source_boost = min((len(sources) - 1) * 0.1, 0.2)
                base_confidence += source_boost
                print(f"   + Extra Sources ({len(sources)}): +{source_boost:.2f} → {base_confidence:.2f}")
            
            # Boost for comprehensive responses
            if len(response) > 100:
                base_confidence += 0.05
                print(f"   + Comprehensive: +0.05 → {base_confidence:.2f}")
            
            # Check source relevance scores
            if len(sources) > 0:
                avg_score = sum(s.get('score', 0) for s in sources) / len(sources)
                print(f"   Average Source Score: {avg_score:.4f}")
                
                # If similarity score is very low, it might be mock embeddings
                if avg_score < 0.1:
                    print(f"   ⚠️ Very low similarity scores - might be using mock embeddings")
                    print(f"   Consider configuring OpenAI API key for semantic search")
                    # Still trust the content if we have sources
                    base_confidence = 0.75
            
            # Only reduce confidence for STRONG uncertainty in the response
            strong_uncertainty_phrases = [
                "i don't know",
                "i cannot answer",
                "i'm unable to help",
                "no information available",
                "not provided in the context",
                "i don't have access to",
                "cannot find"
            ]
            
            # Don't penalize for "I'm not confident" - that's our fallback message
            response_lower = response.lower()
            uncertainty_found = False
            
            # Skip confidence check if response is our own fallback message
            if "let me connect you with" in response_lower:
                print(f"   ⚠️ Detected fallback message - setting confidence to 0")
                return 0.0
            
            for phrase in strong_uncertainty_phrases:
                if phrase in response_lower:
                    base_confidence -= 0.4
                    print(f"   - Uncertainty phrase '{phrase}': -0.40 → {base_confidence:.2f}")
                    uncertainty_found = True
                    break
            
            # Ensure confidence is between 0 and 1
            final_confidence = max(0.0, min(1.0, base_confidence))
            
            if not uncertainty_found:
                print(f"   ✅ No uncertainty detected in response")
            print(f"   📊 Final Confidence: {final_confidence:.2f}")
            
            return final_confidence
            
        except Exception as e:
            print(f"❌ Error calculating confidence: {e}")
            return 0.5

    def generate_ai_response(self, message: str, widget_id: str, ai_config: AIConfig, business_id: str = None) -> AIResponse:
        """Generate AI response using OpenRouter with RAG pipeline"""
        try:
            if not ai_config.enabled:
                return AIResponse(
                    success=False,
                    response="AI is disabled for this widget",
                    confidence=0.0,
                    sources=[],
                    shouldFallbackToHuman=True,
                    metadata={"reason": "AI disabled"}
                )
            
            if not ai_config.ragEnabled:
                # Direct OpenRouter response without RAG
                result = self.openrouter_service.generate_response(
                    message=message,
                    model=ai_config.model,
                    temperature=ai_config.temperature,
                    max_tokens=ai_config.maxTokens
                )
                
                if result["success"]:
                    return AIResponse(
                        success=True,
                        response=result["content"],
                        confidence=0.7,
                        sources=[],
                        shouldFallbackToHuman=False,
                        metadata={"mode": "direct_openrouter", "model": ai_config.model}
                    )
                else:
                    return AIResponse(
                        success=False,
                        response=f"AI service error: {result['error']}",
                        confidence=0.0,
                        sources=[],
                        shouldFallbackToHuman=True,
                        metadata={"error": result["error"]}
                    )
            
            # RAG-enabled response
            print(f"\n{'='*60}")
            print(f"🤖 RAG-ENABLED AI RESPONSE")
            print(f"{'='*60}")
            print(f"   Widget ID: {widget_id}")
            print(f"   Business ID: {business_id}")
            print(f"   Model: {ai_config.model}")
            print(f"   User Question: {message}")
            print(f"   RAG Config: maxDocs={ai_config.maxRetrievalDocs}, threshold={ai_config.confidenceThreshold}")
            
            # Get relevant context from Pinecone
            context_docs = self.get_rag_context(widget_id, business_id, message, ai_config.maxRetrievalDocs)
            
            # CRITICAL: Check if we got any context
            if len(context_docs) == 0:
                error_msg = f"""
❌ CRITICAL ERROR: NO KNOWLEDGE BASE CONTEXT RETRIEVED!
   
   This means:
   1. No documents found in Pinecone for businessId: {business_id}
   2. Knowledge base might be empty
   3. Similarity search returned no matches
   
   SOLUTION: 
   - Add knowledge base items via Dashboard → Knowledge Base
   - Ensure items have businessId: {business_id}
   - Verify Pinecone index has data
   
   AI will respond with fallback message.
"""
                print(error_msg)
            
            # Format context for the model
            context_text = ""
            sources = []
            for doc in context_docs:
                context_text += f"{doc['content']}\n\n"
                sources.append({
                    "content": doc["content"][:200] + "..." if len(doc["content"]) > 200 else doc["content"],
                    "metadata": doc["metadata"],
                    "title": doc["metadata"].get("title", "Unknown"),
                    "type": doc["metadata"].get("type", "text"),
                    "score": doc["score"]
                })
            
            print(f"\n📝 CONTEXT RETRIEVED FOR AI:")
            print(f"   Total Sources: {len(sources)}")
            print(f"   Context Length: {len(context_text)} chars")
            if len(sources) > 0:
                print(f"   ✅ Top Source: '{sources[0]['title']}' (score: {sources[0]['score']:.4f})")
                print(f"   Preview: {sources[0]['content'][:150]}...")
            else:
                print(f"   ⚠️ WARNING: No context available - AI will respond without knowledge base!")
            print(f"{'='*60}\n")
            
            # Generate response with context
            result = self.openrouter_service.generate_rag_response(
                message=message,
                context=context_text,
                model=ai_config.model,
                temperature=ai_config.temperature,
                max_tokens=ai_config.maxTokens
            )
            
            if result["success"]:
                ai_response = result["content"]
                
                print(f"\n🤖 OpenRouter Response:")
                print(f"   Length: {len(ai_response)} chars")
                print(f"   Preview: {ai_response[:200]}...")
                
                # Calculate confidence
                confidence = self.calculate_confidence(ai_response, sources)
                
                print(f"\n🎯 Fallback Decision:")
                print(f"   Confidence: {confidence:.2f}")
                print(f"   Threshold: {ai_config.confidenceThreshold}")
                print(f"   Sources: {len(sources)}")
                print(f"   Fallback enabled: {ai_config.fallbackToHuman}")
                
                # Determine if should fallback to human
                # Don't check for "contact a human" in response - that's the AI being helpful!
                should_fallback = (
                    confidence < ai_config.confidenceThreshold or
                    len(sources) == 0
                ) and ai_config.fallbackToHuman
                
                print(f"   → Should fallback: {should_fallback}")
                
                return AIResponse(
                    success=True,
                    response=ai_response,
                    confidence=confidence,
                    sources=sources,
                    shouldFallbackToHuman=should_fallback,
                    metadata={
                        "mode": "rag_openrouter",
                        "model": ai_config.model,
                        "sources_count": len(sources),
                        "widget_id": widget_id
                    }
                )
            else:
                return AIResponse(
                    success=False,
                    response=f"AI service error: {result['error']}",
                    confidence=0.0,
                    sources=[],
                    shouldFallbackToHuman=True,
                    metadata={"error": result["error"]}
                )
            
        except Exception as e:
            print(f"Error generating AI response: {e}")
            return AIResponse(
                success=False,
                response=f"I'm sorry, I encountered an error while processing your request. Please try again or contact support.",
                confidence=0.0,
                sources=[],
                shouldFallbackToHuman=True,
                metadata={"error": str(e)}
            )


# Global service instance
ai_service = AIService()

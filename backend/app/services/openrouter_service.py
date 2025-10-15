"""
OpenRouter service for AI chat using OpenAI client
"""
import requests
import json
from typing import List, Dict, Any, Optional
from openai import OpenAI
from app.config import OPENROUTER_API_KEY, OPENROUTER_SITE_URL, OPENROUTER_SITE_NAME


class OpenRouterService:
    def __init__(self):
        self.api_key = OPENROUTER_API_KEY
        self.site_url = OPENROUTER_SITE_URL
        self.site_name = OPENROUTER_SITE_NAME
        self.base_url = "https://openrouter.ai/api/v1"
        
        # Initialize OpenAI client for OpenRouter
        self.client = OpenAI(
            base_url=self.base_url,
            api_key=self.api_key,
        )

    def generate_response(
        self, 
        message: str, 
        model: str = "deepseek/deepseek-chat-v3.1:free",
        temperature: float = 0.7,
        max_tokens: int = 500,
        system_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate AI response using OpenRouter API with OpenAI client"""
        try:
            # Prepare messages
            messages = []
            
            # Add system prompt if provided
            if system_prompt:
                messages.append({
                    "role": "system",
                    "content": system_prompt
                })
            
            # Add user message
            messages.append({
                "role": "user",
                "content": message
            })
            
            print(f"🤖 OpenRouter Request - Model: {model}, Message: {message[:50]}...")
            
            # Use OpenAI client for OpenRouter
            completion = self.client.chat.completions.create(
                extra_headers={
                    "HTTP-Referer": self.site_url,
                    "X-Title": self.site_name,
                },
                extra_body={},
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens
            )
            
            # Extract response content
            content = completion.choices[0].message.content
            print(f"✅ OpenRouter Response - Length: {len(content)} chars")
            
            return {
                "success": True,
                "content": content,
                "model": model,
                "usage": {
                    "prompt_tokens": completion.usage.prompt_tokens,
                    "completion_tokens": completion.usage.completion_tokens,
                    "total_tokens": completion.usage.total_tokens
                },
                "raw_response": {
                    "id": completion.id,
                    "object": completion.object,
                    "created": completion.created,
                    "model": completion.model,
                    "choices": [{"message": {"content": content}}],
                    "usage": {
                        "prompt_tokens": completion.usage.prompt_tokens,
                        "completion_tokens": completion.usage.completion_tokens,
                        "total_tokens": completion.usage.total_tokens
                    }
                }
            }
                
        except Exception as e:
            print(f"❌ OpenRouter Exception: {e}")
            return {
                "success": False,
                "error": f"OpenRouter API error: {str(e)}",
                "content": None
            }

    def get_system_prompt_text(self, prompt_type: str, custom_prompt: str = "") -> str:
        """Get system prompt text based on preset type"""
        presets = {
            "support": "You are a helpful customer support assistant. Your role is to assist customers with their questions, resolve issues, and provide excellent service. Be friendly, patient, and professional.",
            "sales": "You are a sales assistant focused on helping customers find the right products or services. Highlight benefits, answer product questions, and guide customers toward making a purchase. Be enthusiastic and informative.",
            "booking": "You are a booking and scheduling assistant. Help customers book appointments, check availability, and manage reservations. Be organized, clear about timing, and confirm all details.",
            "technical": "You are a technical support specialist. Help customers troubleshoot technical issues, provide step-by-step solutions, and explain technical concepts clearly. Be precise and patient.",
            "general": "You are a versatile AI assistant ready to help with any customer inquiry. Adapt your tone and approach based on the customer's needs. Be helpful, professional, and friendly."
        }
        
        if prompt_type == "custom" and custom_prompt:
            return custom_prompt
        
        return presets.get(prompt_type, presets["support"])

    def generate_rag_response(
        self, 
        message: str, 
        context: str,
        model: str = "deepseek/deepseek-chat-v3.1:free",
        temperature: float = 0.7,
        max_tokens: int = 500,
        system_prompt_type: str = "support",
        custom_system_prompt: str = ""
    ) -> Dict[str, Any]:
        """Generate AI response with RAG context using OpenRouter API"""
        try:
            # Get base system prompt from preset
            base_system_prompt = self.get_system_prompt_text(system_prompt_type, custom_system_prompt)
            
            # Create ASSERTIVE system prompt for RAG
            if context and context.strip():
                system_prompt = f"""{base_system_prompt}

===== KNOWLEDGE BASE (Verified Information) =====
{context}
===== END OF KNOWLEDGE BASE =====

Your task: Answer the user's question using the KNOWLEDGE BASE above.

IMPORTANT:
- The KNOWLEDGE BASE contains the correct answer - use it directly
- Answer confidently and naturally based on what you read above
- Do NOT say you're unsure if the answer is clearly in the KNOWLEDGE BASE
- Be helpful and conversational
- Stay in character according to your role

User Question: {message}

Answer (use the KNOWLEDGE BASE information):"""
            else:
                # No context available - inform user
                system_prompt = f"""{base_system_prompt}

You do not have access to the knowledge base right now.

Respond to the user by saying: "I don't have access to my knowledge base at the moment. Let me connect you with a team member who can help you with that."

Be polite and helpful."""
            
            # Prepare messages - use system prompt only (message already included in prompt)
            messages = [
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user", 
                    "content": "Please provide your answer now."
                }
            ]
            
            print(f"\n{'='*60}")
            print(f"🤖 SENDING TO OPENROUTER API")
            print(f"{'='*60}")
            print(f"   Model: {model}")
            print(f"   Temperature: {temperature}")
            print(f"   Max Tokens: {max_tokens}")
            print(f"   User Message: {message}")
            print(f"   Context Included: {'Yes' if (context and context.strip()) else 'No'}")
            if context and context.strip():
                print(f"   Context Preview: {context[:200]}...")
            print(f"   System Prompt Length: {len(system_prompt)} chars")
            print(f"{'='*60}\n")
            
            # Use OpenAI client for OpenRouter
            completion = self.client.chat.completions.create(
                extra_headers={
                    "HTTP-Referer": self.site_url,
                    "X-Title": self.site_name,
                },
                extra_body={},
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens
            )
            
            # Extract response content
            content = completion.choices[0].message.content
            
            print(f"\n{'='*60}")
            print(f"✅ RECEIVED FROM OPENROUTER API")
            print(f"{'='*60}")
            print(f"   Response Length: {len(content)} chars")
            print(f"   Response Preview: {content[:300]}...")
            print(f"   Tokens Used: {completion.usage.total_tokens}")
            print(f"   Model Used: {completion.model}")
            print(f"{'='*60}\n")
            
            return {
                "success": True,
                "content": content,
                "model": model,
                "usage": {
                    "prompt_tokens": completion.usage.prompt_tokens,
                    "completion_tokens": completion.usage.completion_tokens,
                    "total_tokens": completion.usage.total_tokens
                },
                "raw_response": {
                    "id": completion.id,
                    "object": completion.object,
                    "created": completion.created,
                    "model": completion.model,
                    "choices": [{"message": {"content": content}}],
                    "usage": {
                        "prompt_tokens": completion.usage.prompt_tokens,
                        "completion_tokens": completion.usage.completion_tokens,
                        "total_tokens": completion.usage.total_tokens
                    }
                }
            }
                
        except requests.exceptions.RequestException as e:
            print(f"\n{'='*60}")
            print(f"❌ OPENROUTER API REQUEST ERROR")
            print(f"{'='*60}")
            print(f"   Error Type: RequestException")
            print(f"   Error: {str(e)}")
            print(f"{'='*60}\n")
            return {
                "success": False,
                "error": f"Request failed: {str(e)}",
                "content": None
            }
        except Exception as e:
            print(f"\n{'='*60}")
            print(f"❌ OPENROUTER API ERROR")
            print(f"{'='*60}")
            print(f"   Error Type: {type(e).__name__}")
            print(f"   Error Message: {str(e)}")
            print(f"   Full Error: {repr(e)}")
            print(f"{'='*60}\n")
            
            # Check if it's a rate limit error
            error_str = str(e).lower()
            if '429' in error_str or 'rate limit' in error_str:
                print(f"\n⚠️ RATE LIMIT DETECTED!")
                print(f"   Model '{model}' is rate-limited")
                print(f"   Try switching to: deepseek/deepseek-chat-v3.1:free")
                print(f"   Or: meta-llama/llama-3.2-3b-instruct:free\n")
            
            return {
                "success": False,
                "error": f"OpenRouter API error: {str(e)}",
                "content": None
            }

    def test_connection(self) -> Dict[str, Any]:
        """Test OpenRouter API connection"""
        try:
            test_message = "Hello, this is a test message. Please respond with 'Connection successful'."
            result = self.generate_response(test_message)
            
            if result["success"]:
                return {
                    "status": "success",
                    "message": "OpenRouter API connection test successful",
                    "model": "x-ai/grok-4-fast:free",
                    "response": result["content"]
                }
            else:
                return {
                    "status": "error",
                    "message": f"OpenRouter API connection test failed: {result['error']}"
                }
        except Exception as e:
            return {
                "status": "error",
                "message": f"OpenRouter API connection test failed: {str(e)}"
            }


# Global service instance
openrouter_service = OpenRouterService()

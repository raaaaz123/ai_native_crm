#!/usr/bin/env python3
"""
Test script to send a message that generates markdown content
"""
import requests
import json
import time

def test_markdown_ui():
    url = "http://localhost:8001/api/ai/chat/stream"
    
    # Test query that should generate markdown content
    payload = {
        "message": "Can you explain how to create a simple Python function with code examples?",
        "agentId": "test-agent",
        "aiConfig": {
            "enabled": True,
            "model": "gpt-4o-mini",
            "temperature": 0.7,
            "systemPrompt": "You are a helpful programming assistant. Always format your responses with proper markdown including code blocks, headers, and lists.",
            "ragEnabled": False,  # Disable RAG to get direct response
            "embeddingProvider": "voyage",
            "embeddingModel": "voyage-3",
            "maxRetrievalDocs": 5,
            "maxTokens": 800,
            "confidenceThreshold": 0.6,
            "fallbackToHuman": False,
            "rerankerEnabled": True,
            "rerankerModel": "rerank-2.5"
        }
    }
    
    print("🚀 Testing enhanced markdown UI...")
    print(f"URL: {url}")
    print(f"Query: {payload['message']}")
    
    try:
        start_time = time.time()
        response = requests.post(
            url,
            json=payload,
            headers={"Content-Type": "application/json"},
            stream=True
        )
        
        print(f"Response status: {response.status_code}")
        
        if response.status_code == 200:
            print("\n📥 Markdown response streaming:")
            full_content = ""
            
            for line in response.iter_lines(decode_unicode=True):
                if line and line.startswith('data: '):
                    try:
                        data = json.loads(line[6:])
                        
                        if data.get('type') == 'status':
                            print(f"📢 Status: {data.get('message')}")
                        elif data.get('type') == 'content':
                            content = data.get('content', '')
                            full_content += content
                            print(content, end='', flush=True)
                        elif data.get('type') == 'complete':
                            print(f"\n\n✅ MARKDOWN CONTENT RECEIVED:")
                            print("=" * 60)
                            print(full_content)
                            print("=" * 60)
                            print("\nThis content should now render beautifully with:")
                            print("- ✅ Syntax highlighted code blocks")
                            print("- ✅ Proper headers and formatting")
                            print("- ✅ Copy buttons on code blocks")
                            print("- ✅ Enhanced message styling")
                            
                        elif data.get('done'):
                            break
                            
                    except json.JSONDecodeError as e:
                        print(f"JSON decode error: {e}")
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Response text: {response.text}")
            
    except Exception as e:
        print(f"❌ Request failed: {e}")

if __name__ == "__main__":
    test_markdown_ui()
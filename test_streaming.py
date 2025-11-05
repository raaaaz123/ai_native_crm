#!/usr/bin/env python3
"""
Test script to verify optimized streaming functionality
"""
import requests
import json
import time

def test_optimized_streaming():
    url = "http://localhost:8001/api/ai/chat/stream"
    
    # Test simple query (should use rerank-lite-1)
    simple_payload = {
        "message": "who is your owner?",
        "agentId": "test-agent",
        "aiConfig": {
            "enabled": True,
            "model": "gpt-4o-mini",
            "temperature": 0.7,
            "systemPrompt": "You are a helpful assistant",
            "ragEnabled": True,
            "embeddingProvider": "voyage",
            "embeddingModel": "voyage-3",
            "maxRetrievalDocs": 5,
            "maxTokens": 500,
            "confidenceThreshold": 0.6,
            "fallbackToHuman": False,
            "rerankerEnabled": True,
            "rerankerModel": "rerank-2.5"
        }
    }
    
    print("🚀 Testing OPTIMIZED streaming with simple query...")
    print(f"URL: {url}")
    print(f"Query: {simple_payload['message']}")
    
    try:
        start_time = time.time()
        response = requests.post(
            url,
            json=simple_payload,
            headers={"Content-Type": "application/json"},
            stream=True
        )
        
        print(f"Response status: {response.status_code}")
        
        if response.status_code == 200:
            print("\n📥 Optimized streaming response:")
            retrieval_time = None
            llm_time = None
            total_time = None
            
            for line in response.iter_lines(decode_unicode=True):
                if line and line.startswith('data: '):
                    try:
                        data = json.loads(line[6:])
                        
                        if data.get('type') == 'status':
                            print(f"📢 Status: {data.get('message')}")
                        elif data.get('type') == 'content':
                            print(f"📝 Content: {data.get('content')}", end='', flush=True)
                        elif data.get('type') == 'complete':
                            metrics = data.get('metrics', {})
                            retrieval_time = metrics.get('retrieval_time', 0)
                            llm_time = metrics.get('llm_time', 0)
                            total_time = metrics.get('total_time', 0)
                            sources_count = metrics.get('sources_count', 0)
                            
                            print(f"\n\n✅ OPTIMIZATION RESULTS:")
                            print(f"   Retrieval Time: {retrieval_time:.3f}s")
                            print(f"   LLM Time: {llm_time:.3f}s")
                            print(f"   Total Time: {total_time:.3f}s")
                            print(f"   Sources: {sources_count}")
                            
                            actual_total = time.time() - start_time
                            print(f"   Actual Total: {actual_total:.3f}s")
                            
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
    test_optimized_streaming()
#!/usr/bin/env python3
"""
Test script for debugging chunking function
"""

def split_content_into_chunks(content: str, max_chunk_size: int = 1000) -> list:
    """Split content into chunks for better vectorization"""
    print(f"Input content: {repr(content)}")
    print(f"Content length: {len(content)}")
    print(f"Content stripped: {repr(content.strip())}")
    
    if not content or not content.strip():
        print("Content is empty or whitespace only")
        return []
    
    content = content.strip()
    print(f"After strip: {repr(content)}")
    
    # Always return at least one chunk if there's content
    if len(content) <= max_chunk_size:
        print(f"Content fits in one chunk (length {len(content)} <= {max_chunk_size})")
        return [content]
    
    # Split by paragraphs first
    paragraphs = content.split('\n\n')
    print(f"Split into {len(paragraphs)} paragraphs")
    chunks = []
    current_chunk = ""
    
    for i, paragraph in enumerate(paragraphs):
        paragraph = paragraph.strip()
        print(f"Processing paragraph {i}: {repr(paragraph[:50])}...")
        if not paragraph:
            continue
            
        # If adding this paragraph would exceed max_chunk_size, save current chunk
        if len(current_chunk) + len(paragraph) > max_chunk_size and current_chunk:
            print(f"Saving chunk: {len(current_chunk)} chars")
            chunks.append(current_chunk.strip())
            current_chunk = paragraph
        else:
            current_chunk += "\n\n" + paragraph if current_chunk else paragraph
    
    # Add the last chunk
    if current_chunk.strip():
        print(f"Adding final chunk: {len(current_chunk)} chars")
        chunks.append(current_chunk.strip())
    
    # Ensure we always return at least one chunk if there's content
    if not chunks and content:
        print("No chunks created, forcing single chunk")
        chunks = [content]
    
    print(f"Final chunks count: {len(chunks)}")
    return chunks

if __name__ == "__main__":
    # Test with example.com content
    content = """# Example Domain

Example Domain Example Domain This domain is for use in illustrative examples in documents. You may use this domain in literature without prior coordination or asking for permission."""
    
    print("=== Testing chunking function ===")
    chunks = split_content_into_chunks(content, 1000)
    
    print(f"\nResult: {len(chunks)} chunks created")
    for i, chunk in enumerate(chunks):
        print(f"Chunk {i}: {repr(chunk)}")
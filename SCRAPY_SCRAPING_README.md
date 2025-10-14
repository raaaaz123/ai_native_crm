# Scrapy Web Scraping - Production Ready

## Overview

This implementation uses **Scrapy**, the industry-standard web scraping framework, to extract ALL content from websites. Simple, powerful, and battle-tested.

## Why Scrapy?

- ✅ **Production-ready** - Used by thousands of companies
- ✅ **Powerful** - Gets ALL content from websites
- ✅ **Fast** - Concurrent requests, automatic throttling
- ✅ **Respectful** - Follows robots.txt, polite delays
- ✅ **Reliable** - Automatic retries, error handling
- ✅ **Simple** - No complex dependencies

## Features

### Intelligent Crawling
- Automatically discovers and follows internal links
- Respects website structure and robots.txt
- Configurable depth and page limits
- Automatic deduplication

### Complete Content Extraction
- Extracts ALL text content from pages
- Preserves structure (headings, paragraphs, lists)
- Removes navigation/footer noise automatically
- Smart chunking for vector storage

### Production Settings
- **Concurrent Requests**: 16 simultaneous requests
- **Auto-throttling**: Adapts to website speed
- **Retries**: 3 automatic retries on failure
- **Timeout**: 30 seconds per page
- **Politeness**: 0.5s delay between requests

## Installation

```bash
cd backend
pip install -r requirements-scrapy.txt
```

### Dependencies
- **Scrapy 2.11.0** - Web scraping framework
- **Twisted** - Async networking (required by Scrapy)
- **FastAPI** - API framework
- **Pinecone** - Vector database
- **OpenAI** - Embeddings

## API Endpoints

### 1. Scrape Website with Scrapy

**POST** `/api/scraping/scrape-website-scrapy`

Scrapes a website and stores content in Pinecone.

**Request Body:**
```json
{
  "url": "https://example.com",
  "widget_id": "your-widget-id",
  "title": "Website Name",
  "max_pages": 100,
  "max_depth": 3,
  "metadata": {
    "business_id": "your-business-id"
  }
}
```

**Parameters:**
- `url` (required): Starting URL to scrape
- `widget_id` (required): Widget ID for organization
- `title` (required): Title for the scraped content
- `max_pages` (optional): Maximum pages to scrape (default: 100)
- `max_depth` (optional): Maximum crawl depth (default: 3)
- `metadata` (optional): Additional metadata to store

**Response:**
```json
{
  "success": true,
  "message": "Website scraped successfully using Scrapy",
  "data": {
    "url": "https://example.com",
    "title": "Website Name",
    "scraper": "scrapy",
    "total_pages": 45,
    "successful_pages": 45,
    "total_word_count": 12543,
    "chunks_created": 38,
    "elapsed_time": 23.5,
    "chunks": [
      {
        "chunk_index": 0,
        "vector_id": "vec_abc123",
        "content_preview": "Content preview...",
        "content_length": 987
      }
    ]
  }
}
```

### 2. Quick Test

**GET** `/api/scraping/scraping-test`

Tests the Scrapy scraper with example.com.

**Response:**
```json
{
  "success": true,
  "message": "Scrapy test completed",
  "data": {
    "url": "https://example.com",
    "success": true,
    "pages_scraped": 3,
    "word_count": 543,
    "chunks_created": 2
  }
}
```

## Usage Examples

### Frontend (TypeScript)

```typescript
const scrapingRequest = {
  url: 'https://example.com',
  widget_id: 'widget-123',
  title: 'Example Website',
  max_pages: 50,
  max_depth: 2,
  metadata: {
    business_id: 'business-456'
  }
};

const response = await fetch('http://localhost:8001/api/scraping/scrape-website-scrapy', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(scrapingRequest)
});

const result = await response.json();
console.log(`Scraped ${result.data.total_pages} pages`);
console.log(`Created ${result.data.chunks_created} chunks`);
```

### Backend (Python)

```python
import requests

response = requests.post(
    'http://localhost:8001/api/scraping/scrape-website-scrapy',
    json={
        'url': 'https://example.com',
        'widget_id': 'widget-123',
        'title': 'Example Website',
        'max_pages': 50,
        'max_depth': 2,
        'metadata': {
            'business_id': 'business-456'
        }
    }
)

result = response.json()
print(f"Scraped {result['data']['total_pages']} pages")
print(f"Created {result['data']['chunks_created']} chunks")
```

## Testing

### Run Test Suite

```bash
cd backend
python test_scrapy.py
```

The test suite includes:
1. **Quick Test** - Tests basic scraping with example.com
2. **Full Scraping Test** - Complete scraping with multiple pages

### Manual Testing

```bash
# Start backend
cd backend
python -m uvicorn app.main:app --reload --port 8001

# In another terminal, run tests
python test_scrapy.py
```

## How It Works

### 1. Spider Initialization
```python
spider = WebsiteSpider(
    start_url='https://example.com',
    allowed_domain='example.com',
    max_pages=100,
    max_depth=3
)
```

### 2. Intelligent Crawling
- Spider starts at the base URL
- Extracts all internal links
- Follows links up to specified depth
- Respects robots.txt and crawl delays

### 3. Content Extraction
For each page:
- Removes scripts, styles, navigation, footers
- Extracts title, meta description, headings
- Extracts all text content from body
- Cleans and normalizes text
- Preserves document structure

### 4. Smart Chunking
- Chunks content into 1000-character segments
- 200-character overlap for context
- Breaks at paragraph or sentence boundaries
- Preserves semantic meaning

### 5. Vector Storage
- Each chunk is embedded using OpenAI
- Stored in Pinecone with metadata
- Metadata includes:
  - `widget_id` - Widget identifier
  - `businessId` - Business identifier
  - `url` - Source URL
  - `title` - Page title
  - `chunk_index` - Position in sequence
  - `total_chunks` - Total chunks from page
  - `scraper` - Always "scrapy"
  - `scraped_at` - Timestamp

## Configuration

### Spider Settings

Edit `backend/app/services/scrapy_service.py`:

```python
custom_settings = {
    'CONCURRENT_REQUESTS': 16,           # Parallel requests
    'DOWNLOAD_DELAY': 0.5,               # Delay between requests
    'DEPTH_LIMIT': 3,                    # Max crawl depth
    'CLOSESPIDER_PAGECOUNT': 100,        # Max pages
    'ROBOTSTXT_OBEY': True,              # Follow robots.txt
    'AUTOTHROTTLE_ENABLED': True,        # Auto speed control
}
```

### Chunking Settings

```python
chunks = chunk_content(
    content,
    chunk_size=1000,    # Characters per chunk
    overlap=200         # Character overlap
)
```

## Performance

### Typical Performance
- **Small site** (10 pages): ~10 seconds
- **Medium site** (50 pages): ~30 seconds
- **Large site** (100 pages): ~60 seconds

### Factors Affecting Speed
- Website response time
- Number of pages
- Content size
- Network latency
- Concurrent request settings

## Troubleshooting

### Issue: "No content extracted"
**Solution**: Check if website blocks scrapers. Try adjusting USER_AGENT or adding delays.

### Issue: "Timeout error"
**Solution**: Website is slow or large. Increase timeout or reduce max_pages.

### Issue: "Failed to store in Pinecone"
**Solution**: Check Pinecone API key and index name in `.env`.

### Issue: "Reactor already running"
**Solution**: This is normal - Scrapy runs in a separate process to handle Twisted reactor.

## Best Practices

### 1. Start Small
Begin with `max_pages: 10` to test, then increase.

### 2. Monitor Logs
Watch for:
- `✅ Scraped: <url> (X words)` - Successful scrapes
- `📦 Created X chunks` - Chunking results
- `💾 Stored in Firestore` - Storage confirmation

### 3. Respect Websites
- Don't set `DOWNLOAD_DELAY` below 0.5s
- Always obey robots.txt
- Monitor for 429 (rate limit) errors

### 4. Optimize Chunks
- 1000 characters works well for most content
- Increase overlap for better context in RAG
- Adjust based on your use case

## Comparison with Other Methods

| Feature | Scrapy | LangChain | Simple BeautifulSoup |
|---------|--------|-----------|---------------------|
| **Production Ready** | ✅ | ⚠️ | ❌ |
| **Gets All Content** | ✅ | ⚠️ | ❌ |
| **Fast** | ✅ | ❌ | ⚠️ |
| **Concurrent** | ✅ | ❌ | ❌ |
| **Auto-throttling** | ✅ | ❌ | ❌ |
| **Follows Links** | ✅ | ⚠️ | ❌ |
| **Simple Setup** | ✅ | ❌ | ✅ |
| **Battle-tested** | ✅ | ⚠️ | ⚠️ |

## Migration from Old System

The old scraping system has been completely replaced. No migration needed - just start using the new endpoints.

**Old endpoint** (deprecated):
```
POST /api/scraping/scrape-website-advanced
```

**New endpoint**:
```
POST /api/scraping/scrape-website-scrapy
```

## Support

For issues or questions:
1. Check logs in terminal running backend
2. Run test suite: `python test_scrapy.py`
3. Verify environment variables in `.env`
4. Check Pinecone dashboard for stored vectors

## License

MIT License - Use freely in production

---

**Built with ❤️ using Scrapy - The production-ready web scraping framework**


/**
 * API Client for connecting to FastAPI backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://git-branch-m-main.onrender.com';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ChatRequest {
  message: string;
  conversation_id: string;
  widget_id: string;
  user_id?: string;
  context?: Record<string, unknown>;
}

export interface ChatResponse {
  message: string;
  conversation_id: string;
  sources: Array<{
    content: string;
    title: string;
    similarity_score: number;
    source: string;
  }>;
  confidence: number;
  response_time: number;
  ai_generated: boolean;
  fallback_to_human: boolean;
}

// New AI Chat interfaces for RAG integration
export interface AIConfig {
  enabled: boolean;
  provider: string;
  model: string;
  temperature: number;
  maxTokens: number;
  confidenceThreshold: number;
  maxRetrievalDocs: number;
  ragEnabled: boolean;
  fallbackToHuman: boolean;
  embeddingProvider: string;
  embeddingModel: string;
  rerankerEnabled: boolean;
  rerankerModel: string;
  systemPrompt: string;
  customSystemPrompt?: string;
}

export interface CustomerHandoverConfig {
  enabled: boolean;
  showHandoverButton: boolean;
  handoverButtonText: string;
  handoverButtonPosition: string;
  includeInQuickReplies: boolean;
  autoDetectKeywords: boolean;
  detectionKeywords: string[];
  handoverMessage: string;
  notificationToAgent: boolean;
  allowCustomerToSwitch: boolean;
  smartFallbackEnabled: boolean;
}

export interface AIChatRequest {
  message: string;
  widgetId: string;
  conversationId: string;
  aiConfig: AIConfig;
  businessId?: string;
  customerName?: string;
  customerEmail?: string;
  customerHandover?: CustomerHandoverConfig;
}

export interface AIChatResponse {
  success: boolean;
  response: string;
  confidence: number;
  sources: Array<{
    content: string;
    metadata: Record<string, unknown>;
    title: string;
    type: string;
  }>;
  shouldFallbackToHuman: boolean;
  metadata: Record<string, unknown>;
}

export interface KnowledgeBaseItem {
  id: string;
  business_id: string;
  widget_id: string;
  title: string;
  content: string;
  document_type: 'text' | 'pdf' | 'docx' | 'html' | 'markdown';
  file_name?: string;
  file_url?: string;
  file_size?: number;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  embedding_id?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface DocumentUploadRequest {
  title: string;
  content?: string;
  document_type: 'text' | 'pdf' | 'docx' | 'html' | 'markdown' | 'website';
  file_name?: string;
  website_url?: string;
  metadata?: Record<string, unknown>;
  embeddingProvider?: string;
  embeddingModel?: string;
}

export interface WebsiteScrapingRequest {
  url: string;
  widget_id: string;
  title: string;
  max_pages?: number;
  metadata?: Record<string, unknown>;
}

export interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'google' | 'local';
  model: string;
  temperature: number;
  max_tokens: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
  timeout: number;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.detail || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Chat API methods
  async sendMessage(request: ChatRequest): Promise<ApiResponse<ChatResponse>> {
    return this.request<ChatResponse>('/api/chat', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // New AI Chat method for RAG integration
  async sendAIMessage(request: AIChatRequest): Promise<ApiResponse<AIChatResponse>> {
    return this.request<AIChatResponse>('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async submitFeedback(feedback: {
    conversation_id: string;
    message_id: string;
    feedback: 'helpful' | 'not_helpful';
    rating?: number;
    comment?: string;
  }): Promise<ApiResponse> {
    return this.request('/api/chat/feedback', {
      method: 'POST',
      body: JSON.stringify(feedback),
    });
  }

  async getConversation(conversationId: string): Promise<ApiResponse> {
    return this.request(`/api/chat/conversation/${conversationId}`);
  }

  async getWidgetConversations(widgetId: string, limit: number = 50): Promise<ApiResponse> {
    return this.request(`/api/chat/conversations/${widgetId}?limit=${limit}`);
  }

  // Knowledge Base API methods
  async uploadDocument(
    widgetId: string,
    document: DocumentUploadRequest,
    file?: File
  ): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('widget_id', widgetId);
    formData.append('title', document.title);
    formData.append('document_type', document.document_type);
    
    if (document.content) {
      formData.append('content', document.content);
    }
    
    if (file) {
      formData.append('file', file);
    }
    
    if (document.metadata) {
      formData.append('metadata', JSON.stringify(document.metadata));
    }
    
    // Add embedding configuration
    if (document.embeddingProvider) {
      formData.append('embedding_provider', document.embeddingProvider);
    }
    
    if (document.embeddingModel) {
      formData.append('embedding_model', document.embeddingModel);
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/knowledge-base/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.detail || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async searchKnowledgeBase(
    query: string,
    widgetId: string,
    limit: number = 5,
    similarityThreshold: number = 0.7
  ): Promise<ApiResponse> {
    return this.request('/api/knowledge-base/search', {
      method: 'POST',
      body: JSON.stringify({
        query,
        widget_id: widgetId,
        limit,
        similarity_threshold: similarityThreshold,
      }),
    });
  }

  async getKnowledgeBaseItems(widgetId: string): Promise<ApiResponse<KnowledgeBaseItem[]>> {
    return this.request<KnowledgeBaseItem[]>(`/api/knowledge-base/items/${widgetId}`);
  }

  async deleteKnowledgeBaseItem(itemId: string): Promise<ApiResponse> {
    return this.request(`/api/knowledge-base/items/${itemId}`, {
      method: 'DELETE',
    });
  }

  async reindexWidget(widgetId: string): Promise<ApiResponse> {
    return this.request(`/api/knowledge-base/reindex/${widgetId}`, {
      method: 'POST',
    });
  }

  // Website Scraping API methods
  async scrapeWebsite(request: WebsiteScrapingRequest): Promise<ApiResponse> {
    return this.request('/api/scraping/scrape-website', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getScrapingStatus(widgetId: string): Promise<ApiResponse> {
    return this.request(`/api/scraping/scraping-status/${widgetId}`);
  }

  async testScraping(): Promise<ApiResponse> {
    return this.request('/api/scraping/test-scraping', {
      method: 'POST',
    });
  }

  // LLM API methods
  async getAvailableProviders(): Promise<ApiResponse> {
    return this.request('/api/llm/providers');
  }

  async getProviderModels(provider: string): Promise<ApiResponse> {
    return this.request(`/api/llm/models/${provider}`);
  }

  async testLLMConfig(config: LLMConfig): Promise<ApiResponse> {
    return this.request('/api/llm/test', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async getLLMHealth(): Promise<ApiResponse> {
    return this.request('/api/llm/health');
  }

  async getUsageStats(widgetId: string, days: number = 30): Promise<ApiResponse> {
    return this.request(`/api/llm/usage/${widgetId}?days=${days}`);
  }

  // RAG API methods
  async retrieveContext(
    query: string,
    widgetId: string,
    limit: number = 5,
    similarityThreshold: number = 0.7
  ): Promise<ApiResponse> {
    return this.request('/api/rag/retrieve', {
      method: 'POST',
      body: JSON.stringify({
        query,
        widget_id: widgetId,
        limit,
        similarity_threshold: similarityThreshold,
      }),
    });
  }

  async generateResponse(
    query: string,
    context: unknown[],
    widgetId: string,
    llmConfig: LLMConfig
  ): Promise<ApiResponse> {
    return this.request('/api/rag/generate', {
      method: 'POST',
      body: JSON.stringify({
        query,
        context,
        widget_id: widgetId,
        llm_config: llmConfig,
      }),
    });
  }

  async getRAGPerformance(widgetId: string, days: number = 30): Promise<ApiResponse> {
    return this.request(`/api/rag/performance/${widgetId}?days=${days}`);
  }

  // Chat History API methods
  async getUserChatHistory(
    widgetId: string,
    userEmail: string,
    limit: number = 10
  ): Promise<ApiResponse> {
    return this.request(`/api/firestore/user-chat-history?widget_id=${widgetId}&user_email=${encodeURIComponent(userEmail)}&limit=${limit}`);
  }

  async getConversationById(
    conversationId: string,
    userEmail: string
  ): Promise<ApiResponse> {
    return this.request(`/api/firestore/conversation/${conversationId}?user_email=${encodeURIComponent(userEmail)}`);
  }

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    return this.request('/health');
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();

// Export the class for custom instances
export default ApiClient;

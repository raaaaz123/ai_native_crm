export interface Agent {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'training';
  createdAt: Date;
  updatedAt: Date;
  settings: {
    model: string;
    temperature: number;
    maxTokens: number;
    systemPrompt?: string;
  };
  aiConfig?: {
    enabled: boolean;
    provider: string;
    model: string;
    temperature: number;
    maxTokens: number;
    confidenceThreshold: number;
    maxRetrievalDocs: number;
    ragEnabled: boolean;
    fallbackToHuman: boolean;
    systemPrompt: string;
    customSystemPrompt: string;
    autoRetrain: boolean;
    lastTrainedAt: string;
  };
  securityConfig?: {
    requireAuth: boolean;
    rateLimiting: boolean;
    rateLimit: number;
    rateLimitWindow: number;
    rateLimitMessage: string;
    ipWhitelist: string;
    allowedDomains: string;
    sessionEncryption: boolean;
    dataRetention: number;
    logLevel: string;
  };
  knowledgeSources: AgentKnowledgeSource[];
  stats: {
    totalConversations: number;
    totalMessages: number;
    lastActiveAt?: Date;
  };
}

export interface AgentKnowledgeSource {
  id: string;
  type: 'files' | 'text' | 'website' | 'faq' | 'notion';
  title: string;
  content: string;
  fileName?: string;
  fileUrl?: string;
  fileSize?: number;
  websiteUrl?: string;
  createdAt: Date;
  status: 'processing' | 'ready' | 'error';
  qdrantId?: string; // ID in Qdrant vector database
}

export interface CreateAgentData {
  name: string;
  description?: string;
  settings?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
  };
}

export interface UpdateAgentData {
  name?: string;
  description?: string;
  status?: 'active' | 'inactive' | 'training';
  settings?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
  };
  aiConfig?: {
    enabled?: boolean;
    provider?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    confidenceThreshold?: number;
    maxRetrievalDocs?: number;
    ragEnabled?: boolean;
    fallbackToHuman?: boolean;
    systemPrompt?: string;
    customSystemPrompt?: string;
    autoRetrain?: boolean;
    lastTrainedAt?: string;
  };
  securityConfig?: {
    requireAuth?: boolean;
    rateLimiting?: boolean;
    rateLimit?: number;
    rateLimitWindow?: number;
    rateLimitMessage?: string;
    ipWhitelist?: string;
    allowedDomains?: string;
    sessionEncryption?: boolean;
    dataRetention?: number;
    logLevel?: string;
  };
}

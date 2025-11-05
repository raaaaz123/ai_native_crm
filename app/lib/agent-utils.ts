import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs,
  getDoc,
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  onSnapshot 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from './firebase';
import { Agent, AgentKnowledgeSource, CreateAgentData, UpdateAgentData } from './agent-types';
import { DEFAULT_SYSTEM_PROMPT, DEFAULT_AGENT_SETTINGS } from './agent-constants';

// Re-export types for convenience
export type { Agent, AgentKnowledgeSource, CreateAgentData, UpdateAgentData };

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

// Store knowledge source in Qdrant for semantic search
async function storeInQdrant(source: AgentKnowledgeSource, agentId: string, workspaceId: string, embeddingModel: string = 'text-embedding-3-large'): Promise<string> {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://git-branch-m-main.onrender.com';
    const response = await fetch(`${backendUrl}/api/knowledge-base/store?embedding_model=${encodeURIComponent(embeddingModel)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: source.id,
        workspaceId: workspaceId,
        agentId: agentId,
        title: source.title,
        content: source.content,
        type: source.type,
        fileName: source.fileName,
        fileUrl: source.fileUrl,
        fileSize: source.fileSize,
        websiteUrl: source.websiteUrl
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Qdrant API error: ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(`Qdrant storage failed: ${result.message || 'Unknown error'}`);
    }

    console.log('✅ Successfully stored in Qdrant:', result);
    return result.qdrantId || result.data?.id || source.id;
  } catch (error) {
    console.error('❌ Error storing in Qdrant:', error);
    throw error;
  }
}

// Create a new agent
export async function createAgent(
  workspaceId: string,
  agentData: CreateAgentData
): Promise<ApiResponse<Agent>> {
  try {
    const docData: Record<string, unknown> = {
      workspaceId,
      name: agentData.name,
      description: agentData.description || '',
      status: 'active',
      model: agentData.settings?.model || DEFAULT_AGENT_SETTINGS.model,
      temperature: agentData.settings?.temperature ?? DEFAULT_AGENT_SETTINGS.temperature,
      systemPrompt: agentData.settings?.systemPrompt || DEFAULT_SYSTEM_PROMPT,
      settings: {
        model: agentData.settings?.model || DEFAULT_AGENT_SETTINGS.model,
        temperature: agentData.settings?.temperature ?? DEFAULT_AGENT_SETTINGS.temperature,
        maxTokens: agentData.settings?.maxTokens || DEFAULT_AGENT_SETTINGS.maxTokens,
        systemPrompt: agentData.settings?.systemPrompt || DEFAULT_SYSTEM_PROMPT
      },
      knowledgeSources: [],
      actions: [],
      stats: {
        totalConversations: 0,
        totalMessages: 0
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'agents'), docData);

    const newAgent: Agent = {
      id: docRef.id,
      workspaceId,
      name: agentData.name,
      description: agentData.description || '',
      status: 'active',
      settings: {
        model: agentData.settings?.model || DEFAULT_AGENT_SETTINGS.model,
        temperature: agentData.settings?.temperature ?? DEFAULT_AGENT_SETTINGS.temperature,
        maxTokens: agentData.settings?.maxTokens || DEFAULT_AGENT_SETTINGS.maxTokens,
        systemPrompt: agentData.settings?.systemPrompt || DEFAULT_SYSTEM_PROMPT
      },
      knowledgeSources: [],
      stats: {
        totalConversations: 0,
        totalMessages: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return {
      success: true,
      data: newAgent
    };
  } catch (error) {
    return {
      success: false,
      data: {} as Agent,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Get agents for a workspace
export async function getWorkspaceAgents(workspaceId: string): Promise<ApiResponse<Agent[]>> {
  try {
    const q = query(
      collection(db, 'agents'),
      where('workspaceId', '==', workspaceId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const agents = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        knowledgeSources: (data.knowledgeSources || []).map((source: AgentKnowledgeSource & { createdAt?: { toDate: () => Date } }) => ({
          ...source,
          createdAt: source.createdAt?.toDate() || new Date()
        }))
      } as Agent;
    });

    return {
      success: true,
      data: agents
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Get a specific agent
export async function getAgent(agentId: string): Promise<ApiResponse<Agent>> {
  try {
    const docRef = doc(db, 'agents', agentId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return {
        success: false,
        data: {} as Agent,
        error: 'Agent not found'
      };
    }

    const data = docSnap.data();
    const agent: Agent = {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      knowledgeSources: (data.knowledgeSources || []).map((source: AgentKnowledgeSource & { createdAt?: { toDate: () => Date } }) => ({
        ...source,
        createdAt: source.createdAt?.toDate() || new Date()
      }))
    } as Agent;

    return {
      success: true,
      data: agent
    };
  } catch (error) {
    return {
      success: false,
      data: {} as Agent,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Add knowledge source to agent
export async function addAgentKnowledgeSource(
  agentId: string,
  sourceData: {
    type: 'files' | 'text' | 'website' | 'faq' | 'notion';
    title: string;
    content: string;
    file?: File;
    websiteUrl?: string;
    embeddingModel?: string;
  }
): Promise<ApiResponse<AgentKnowledgeSource>> {
  try {
    // Get the agent first
    const agentResponse = await getAgent(agentId);
    if (!agentResponse.success) {
      return {
        success: false,
        data: {} as AgentKnowledgeSource,
        error: agentResponse.error
      };
    }

    const agent = agentResponse.data;
    let fileUrl: string | undefined;
    let fileName: string | undefined;
    let fileSize: number | undefined;

    // Upload file to Firebase Storage if it's a file type
    if (sourceData.type === 'files' && sourceData.file) {
      const fileRef = ref(storage, `agents/${agentId}/knowledge/${Date.now()}-${sourceData.file.name}`);
      const uploadResult = await uploadBytes(fileRef, sourceData.file);
      fileUrl = await getDownloadURL(uploadResult.ref);
      fileName = sourceData.file.name;
      fileSize = sourceData.file.size;
    }

    // Create knowledge source
    const sourceId = Date.now().toString();
    const newSource: AgentKnowledgeSource = {
      id: sourceId,
      type: sourceData.type,
      title: sourceData.title,
      content: sourceData.content,
      createdAt: new Date(),
      status: 'processing'
    };

    // Only add optional fields if they exist
    if (fileName) newSource.fileName = fileName;
    if (fileUrl) newSource.fileUrl = fileUrl;
    if (fileSize) newSource.fileSize = fileSize;
    if (sourceData.websiteUrl) newSource.websiteUrl = sourceData.websiteUrl;

    // Handle website scraping separately
    if (sourceData.type === 'website' && sourceData.websiteUrl) {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://git-branch-m-main.onrender.com';
        const response = await fetch(`${backendUrl}/api/scraping/scrape-website`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: sourceData.websiteUrl,
            title: sourceData.title,
            agent_id: agentId,
            workspace_id: agent.workspaceId,
            metadata: {
              workspace_id: agent.workspaceId,
              agent_id: agentId,
            },
            embedding_model: sourceData.embeddingModel || 'text-embedding-3-large'
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || data.detail || 'Failed to scrape website');
        }

        newSource.status = 'ready';
        newSource.qdrantId = data.data?.chunks_created?.toString() || sourceId;
        console.log('✅ Successfully scraped and stored website:', newSource.title);
      } catch (websiteError) {
        console.error('❌ Failed to scrape website:', websiteError);
        newSource.status = 'error';
        throw websiteError;
      }
    } else {
      // Store in Qdrant (optional - don't fail if backend is down)
      try {
        const qdrantId = await storeInQdrant(newSource, agentId, agent.workspaceId, sourceData.embeddingModel);
        newSource.qdrantId = qdrantId;
        newSource.status = 'ready';
        console.log('✅ Successfully stored source in Qdrant:', newSource.title);
      } catch (qdrantError) {
        console.warn('⚠️ Failed to store in Qdrant (continuing with Firestore only):', qdrantError);
        newSource.status = 'ready'; // Mark as ready even without Qdrant
        // Continue with Firestore storage even if Qdrant fails
      }
    }

    // Update agent with new knowledge source
    const agentRef = doc(db, 'agents', agentId);
    const updatedSources = [...agent.knowledgeSources, newSource];
    
    const updateData: Record<string, unknown> = {
      knowledgeSources: updatedSources,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(agentRef, updateData);

    return {
      success: true,
      data: newSource
    };
  } catch (error) {
    return {
      success: false,
      data: {} as AgentKnowledgeSource,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Update agent
export async function updateAgent(
  agentId: string,
  updates: UpdateAgentData
): Promise<ApiResponse<Agent>> {
  try {
    const agentRef = doc(db, 'agents', agentId);
    
    const updateData: Record<string, unknown> = {
      updatedAt: serverTimestamp()
    };

    if (updates.name !== undefined && updates.name !== null) updateData.name = updates.name;
    if (updates.description !== undefined && updates.description !== null) updateData.description = updates.description;
    if (updates.status !== undefined && updates.status !== null) updateData.status = updates.status;
    if (updates.settings !== undefined && updates.settings !== null) updateData.settings = updates.settings;

    await updateDoc(agentRef, updateData);

    // Return updated agent
    const updatedAgentResponse = await getAgent(agentId);
    return updatedAgentResponse;
  } catch (error) {
    return {
      success: false,
      data: {} as Agent,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Delete agent
export async function deleteAgent(agentId: string): Promise<ApiResponse<void>> {
  try {
    // Get agent to access knowledge sources
    const agentResponse = await getAgent(agentId);
    if (agentResponse.success) {
      const agent = agentResponse.data;

      // Delete files from Storage
      for (const source of agent.knowledgeSources) {
        if (source.fileUrl) {
          try {
            const fileRef = ref(storage, source.fileUrl);
            await deleteObject(fileRef);
          } catch (storageError) {
            console.warn('Could not delete file from storage:', storageError);
          }
        }
      }
    }

    // Delete agent from Firestore
    await deleteDoc(doc(db, 'agents', agentId));

    return {
      success: true,
      data: undefined
    };
  } catch (error) {
    return {
      success: false,
      data: undefined,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Duplicate agent
export async function duplicateAgent(agentId: string): Promise<ApiResponse<Agent>> {
  try {
    // Get the original agent
    const agentResponse = await getAgent(agentId);
    if (!agentResponse.success) {
      return {
        success: false,
        data: {} as Agent,
        error: agentResponse.error
      };
    }

    const originalAgent = agentResponse.data;

    // Create a new agent with duplicated data
    const docData: Record<string, unknown> = {
      workspaceId: originalAgent.workspaceId,
      name: `${originalAgent.name} (Copy)`,
      description: originalAgent.description || '',
      status: 'active',
      model: originalAgent.settings?.model || DEFAULT_AGENT_SETTINGS.model,
      temperature: originalAgent.settings?.temperature ?? DEFAULT_AGENT_SETTINGS.temperature,
      systemPrompt: originalAgent.settings?.systemPrompt || DEFAULT_SYSTEM_PROMPT,
      settings: {
        model: originalAgent.settings?.model || DEFAULT_AGENT_SETTINGS.model,
        temperature: originalAgent.settings?.temperature ?? DEFAULT_AGENT_SETTINGS.temperature,
        maxTokens: originalAgent.settings?.maxTokens || DEFAULT_AGENT_SETTINGS.maxTokens,
        systemPrompt: originalAgent.settings?.systemPrompt || DEFAULT_SYSTEM_PROMPT
      },
      knowledgeSources: originalAgent.knowledgeSources || [],
      stats: {
        totalConversations: 0,
        totalMessages: 0
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'agents'), docData);

    const newAgent: Agent = {
      id: docRef.id,
      workspaceId: originalAgent.workspaceId,
      name: `${originalAgent.name} (Copy)`,
      description: originalAgent.description || '',
      status: 'active',
      settings: {
        model: originalAgent.settings?.model || DEFAULT_AGENT_SETTINGS.model,
        temperature: originalAgent.settings?.temperature ?? DEFAULT_AGENT_SETTINGS.temperature,
        maxTokens: originalAgent.settings?.maxTokens || DEFAULT_AGENT_SETTINGS.maxTokens,
        systemPrompt: originalAgent.settings?.systemPrompt || DEFAULT_SYSTEM_PROMPT
      },
      knowledgeSources: originalAgent.knowledgeSources || [],
      stats: {
        totalConversations: 0,
        totalMessages: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return {
      success: true,
      data: newAgent
    };
  } catch (error) {
    return {
      success: false,
      data: {} as Agent,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Remove knowledge source from agent
export async function removeAgentKnowledgeSource(
  agentId: string,
  sourceId: string
): Promise<ApiResponse<void>> {
  try {
    const agentResponse = await getAgent(agentId);
    if (!agentResponse.success) {
      return {
        success: false,
        data: undefined,
        error: agentResponse.error
      };
    }

    const agent = agentResponse.data;
    const sourceToRemove = agent.knowledgeSources.find(s => s.id === sourceId);
    
    if (sourceToRemove?.fileUrl) {
      try {
        const fileRef = ref(storage, sourceToRemove.fileUrl);
        await deleteObject(fileRef);
      } catch (storageError) {
        console.warn('Could not delete file from storage:', storageError);
      }
    }

    // Update agent without the removed source
    const updatedSources = agent.knowledgeSources.filter(s => s.id !== sourceId);
    const agentRef = doc(db, 'agents', agentId);
    
    const updateData: Record<string, unknown> = {
      knowledgeSources: updatedSources,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(agentRef, updateData);

    return {
      success: true,
      data: undefined
    };
  } catch (error) {
    return {
      success: false,
      data: undefined,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Subscribe to real-time agents
export function subscribeToWorkspaceAgents(
  workspaceId: string,
  callback: (agents: Agent[]) => void
): () => void {
  const q = query(
    collection(db, 'agents'),
    where('workspaceId', '==', workspaceId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
          const agents = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          knowledgeSources: (data.knowledgeSources || []).map((source: AgentKnowledgeSource & { createdAt?: { toDate: () => Date } }) => ({
            ...source,
            createdAt: source.createdAt?.toDate() || new Date()
          }))
        } as Agent;
      });
      callback(agents);
  });
}

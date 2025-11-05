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

export interface AgentKnowledgeItem {
  id: string;
  agentId: string;
  workspaceId: string;
  title: string;
  content: string;
  type: 'text' | 'pdf' | 'faq' | 'website' | 'notion' | 'google_sheets';
  fileName?: string;
  fileUrl?: string;
  fileSize?: number;
  websiteUrl?: string;
  faqQuestion?: string;
  faqAnswer?: string;
  notionPageId?: string;
  notionUrl?: string;
  googleSheetId?: string;
  sheetName?: string;
  rowsCount?: number;
  chunksCreated?: number;
  createdAt: number;
  updatedAt: number;
  embeddingProvider?: string;
  embeddingModel?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

// Store knowledge source in Qdrant for semantic search
async function storeInQdrant(
  item: AgentKnowledgeItem,
  embeddingProvider: string = 'voyage',
  embeddingModel: string = 'voyage-3'
): Promise<string> {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://git-branch-m-main.onrender.com';
    const response = await fetch(`${backendUrl}/api/knowledge-base/store?embedding_model=${encodeURIComponent(embeddingModel)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: item.id,
        workspaceId: item.workspaceId,
        agentId: item.agentId,
        title: item.title,
        content: item.content,
        type: item.type,
        fileName: item.fileName,
        fileUrl: item.fileUrl,
        fileSize: item.fileSize,
        websiteUrl: item.websiteUrl,
        faqQuestion: item.faqQuestion,
        faqAnswer: item.faqAnswer
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
    return result.qdrantId || result.data?.id || item.id;
  } catch (error) {
    console.error('❌ Error storing in Qdrant:', error);
    throw error;
  }
}

// Store Notion page in Qdrant
async function storeNotionInQdrant(
  accessToken: string,
  pageId: string,
  agentId: string,
  workspaceId: string,
  title: string,
  embeddingProvider: string = 'voyage',
  embeddingModel: string = 'voyage-3'
): Promise<{ success: boolean; message?: string; error?: string; chunks_created?: number; content?: string; url?: string }> {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://git-branch-m-main.onrender.com';

    const response = await fetch(`${backendUrl}/api/notion/import-page`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: accessToken,
        page_id: pageId,
        agent_id: agentId,
        title: title,
        embedding_provider: embeddingProvider,
        embedding_model: embeddingModel,
        metadata: {
          workspace_id: workspaceId
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Notion import failed: ${errorText}`);
    }

    const result = await response.json();
    return {
      success: result.success,
      message: result.message,
      chunks_created: result.chunks_created,
      content: result.content,
      url: result.url
    };
  } catch (error) {
    console.error('❌ Error storing Notion page in Qdrant:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Store Google Sheet in Qdrant
async function storeGoogleSheetInQdrant(
  accessToken: string,
  spreadsheetId: string,
  agentId: string,
  workspaceId: string,
  title: string,
  sheetName?: string,
  embeddingProvider: string = 'voyage',
  embeddingModel: string = 'voyage-3'
): Promise<{ success: boolean; message?: string; error?: string; chunks_created?: number; rows_count?: number; content?: string; url?: string }> {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://git-branch-m-main.onrender.com';

    const response = await fetch(`${backendUrl}/api/google-sheets/import-sheet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_token: accessToken,
        spreadsheet_id: spreadsheetId,
        sheet_name: sheetName,
        agent_id: agentId,
        title: title,
        embedding_provider: embeddingProvider,
        embedding_model: embeddingModel,
        metadata: {
          workspace_id: workspaceId
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Sheets import failed: ${errorText}`);
    }

    const result = await response.json();
    return {
      success: result.success,
      message: result.message,
      chunks_created: result.chunks_created,
      rows_count: result.rows_count,
      content: result.content,
      url: result.url
    };
  } catch (error) {
    console.error('❌ Error storing Google Sheet in Qdrant:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Store FAQ in Qdrant
async function storeFAQInQdrant(
  agentId: string,
  workspaceId: string,
  question: string,
  answer: string,
  title: string,
  embeddingProvider: string = 'voyage',
  embeddingModel: string = 'voyage-3',
  widgetId?: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://git-branch-m-main.onrender.com';

    const faqRequest: Record<string, unknown> = {
      agent_id: agentId,
      title: title,
      question: question.trim(),
      answer: answer.trim(),
      type: 'faq',
      embedding_provider: embeddingProvider,
      embedding_model: embeddingModel,
      metadata: {
        workspace_id: workspaceId
      }
    };

    if (widgetId) {
      faqRequest.widget_id = widgetId;
    }

    const response = await fetch(`${backendUrl}/api/knowledge-base/store-faq`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(faqRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`FAQ storage failed: ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ Error storing FAQ in Qdrant:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Upload file to backend (PDF or text file)
async function uploadFileToBackend(
  file: File,
  agentId: string,
  workspaceId: string,
  title: string,
  documentType: 'pdf' | 'text',
  embeddingProvider: string = 'voyage',
  embeddingModel: string = 'voyage-3'
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://git-branch-m-main.onrender.com';

    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('agent_id', agentId);
    uploadFormData.append('title', title);
    uploadFormData.append('document_type', documentType);
    uploadFormData.append('embedding_provider', embeddingProvider);
    uploadFormData.append('embedding_model', embeddingModel);
    uploadFormData.append('metadata', JSON.stringify({
      workspace_id: workspaceId
    }));

    const response = await fetch(`${backendUrl}/api/knowledge-base/upload`, {
      method: 'POST',
      body: uploadFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to upload file';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.detail || errorData.message || errorText;
      } catch {
        errorMessage = errorText;
      }
      console.error('Upload error:', errorMessage);
      throw new Error(errorMessage);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ Error uploading file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Create a new agent knowledge item
export async function createAgentKnowledgeItem(
  agentId: string,
  workspaceId: string,
  itemData: {
    widgetId?: string;
    title: string;
    content: string;
    type: 'text' | 'pdf' | 'faq' | 'website' | 'notion' | 'google_sheets';
    file?: File;
    websiteUrl?: string;
    faqQuestion?: string;
    faqAnswer?: string;
    notionAccessToken?: string;
    notionPageId?: string;
    notionUrl?: string;
    googleSheetsAccessToken?: string;
    googleSheetId?: string;
    sheetName?: string;
    embeddingProvider?: string;
    embeddingModel?: string;
  }
): Promise<ApiResponse<AgentKnowledgeItem>> {
  try {
    const embeddingProvider = itemData.embeddingProvider || 'voyage';
    const embeddingModel = itemData.embeddingModel || 'voyage-3';

    // Handle FAQ type
    if (itemData.type === 'faq' && itemData.faqQuestion && itemData.faqAnswer) {
      // Store FAQ in Qdrant first
      const qdrantResult = await storeFAQInQdrant(
        agentId,
        workspaceId,
        itemData.faqQuestion,
        itemData.faqAnswer,
        itemData.title,
        embeddingProvider,
        embeddingModel,
        itemData.widgetId
      );

      if (!qdrantResult.success) {
        throw new Error(qdrantResult.error || 'Failed to store FAQ in Qdrant');
      }

      // Create Firestore record
      const docData: Record<string, unknown> = {
        agentId,
        workspaceId,
        title: itemData.title,
        content: `Q: ${itemData.faqQuestion}\n\nA: ${itemData.faqAnswer}`,
        type: 'faq',
        faqQuestion: itemData.faqQuestion,
        faqAnswer: itemData.faqAnswer,
        embeddingProvider,
        embeddingModel,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'agentKnowledge'), docData);

      const newItem: AgentKnowledgeItem = {
        id: docRef.id,
        agentId,
        workspaceId,
        title: itemData.title,
        content: docData.content as string,
        type: 'faq',
        faqQuestion: itemData.faqQuestion,
        faqAnswer: itemData.faqAnswer,
        embeddingProvider,
        embeddingModel,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      return {
        success: true,
        data: newItem
      };
    }

    // Handle Notion type
    if (itemData.type === 'notion' && itemData.notionAccessToken && itemData.notionPageId) {
      // Store Notion page in Qdrant first
      const qdrantResult = await storeNotionInQdrant(
        itemData.notionAccessToken,
        itemData.notionPageId,
        agentId,
        workspaceId,
        itemData.title,
        embeddingProvider,
        embeddingModel
      );

      if (!qdrantResult.success) {
        throw new Error(qdrantResult.error || 'Failed to store Notion page in Qdrant');
      }

      // Create Firestore record
      const docData: Record<string, unknown> = {
        agentId,
        workspaceId,
        title: itemData.title,
        content: qdrantResult.content || itemData.content,
        type: 'notion',
        notionPageId: itemData.notionPageId,
        notionUrl: itemData.notionUrl || qdrantResult.url,
        chunksCreated: qdrantResult.chunks_created || 0,
        embeddingProvider,
        embeddingModel,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'agentKnowledge'), docData);

      const newItem: AgentKnowledgeItem = {
        id: docRef.id,
        agentId,
        workspaceId,
        title: itemData.title,
        content: docData.content as string,
        type: 'notion',
        embeddingProvider,
        embeddingModel,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      return {
        success: true,
        data: newItem
      };
    }

    // Handle Google Sheets type
    if (itemData.type === 'google_sheets' && itemData.googleSheetsAccessToken && itemData.googleSheetId) {
      // Store Google Sheet in Qdrant first
      const qdrantResult = await storeGoogleSheetInQdrant(
        itemData.googleSheetsAccessToken,
        itemData.googleSheetId,
        agentId,
        workspaceId,
        itemData.title,
        itemData.sheetName,
        embeddingProvider,
        embeddingModel
      );

      if (!qdrantResult.success) {
        throw new Error(qdrantResult.error || 'Failed to store Google Sheet in Qdrant');
      }

      // Create Firestore record
      const docData: Record<string, unknown> = {
        agentId,
        workspaceId,
        title: itemData.title,
        content: qdrantResult.content || itemData.content,
        type: 'google_sheets',
        googleSheetId: itemData.googleSheetId,
        sheetName: itemData.sheetName,
        rowsCount: qdrantResult.rows_count || 0,
        chunksCreated: qdrantResult.chunks_created || 0,
        embeddingProvider,
        embeddingModel,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'agentKnowledge'), docData);

      const newItem: AgentKnowledgeItem = {
        id: docRef.id,
        agentId,
        workspaceId,
        title: itemData.title,
        content: docData.content as string,
        type: 'google_sheets',
        googleSheetId: itemData.googleSheetId,
        sheetName: itemData.sheetName,
        rowsCount: qdrantResult.rows_count,
        chunksCreated: qdrantResult.chunks_created,
        embeddingProvider,
        embeddingModel,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      return {
        success: true,
        data: newItem
      };
    }

    // Handle file upload (PDF or text)
    if ((itemData.type === 'pdf' || itemData.type === 'text') && itemData.file) {
      // Upload file to backend
      const uploadResult = await uploadFileToBackend(
        itemData.file,
        agentId,
        workspaceId,
        itemData.title,
        itemData.type,
        embeddingProvider,
        embeddingModel
      );

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Failed to upload file');
      }

      // Create Firestore record
      const docData: Record<string, unknown> = {
        agentId,
        workspaceId,
        title: itemData.title,
        content: `${itemData.type.toUpperCase()} file uploaded: ${itemData.file.name} (${(itemData.file.size / 1024 / 1024).toFixed(2)} MB)`,
        type: itemData.type,
        fileName: itemData.file.name,
        fileSize: itemData.file.size,
        fileUrl: (uploadResult as { fileUrl?: string }).fileUrl || null,
        embeddingProvider,
        embeddingModel,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'agentKnowledge'), docData);

      const newItem: AgentKnowledgeItem = {
        id: docRef.id,
        agentId,
        workspaceId,
        title: itemData.title,
        content: docData.content as string,
        type: itemData.type,
        fileName: itemData.file.name,
        fileSize: itemData.file.size,
        embeddingProvider,
        embeddingModel,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      return {
        success: true,
        data: newItem
      };
    }

    // Handle text type without file
    if (itemData.type === 'text' && !itemData.file) {
      // Create Firestore record first
      const docData: Record<string, unknown> = {
        agentId,
        workspaceId,
        title: itemData.title,
        content: itemData.content,
        type: 'text',
        embeddingProvider,
        embeddingModel,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'agentKnowledge'), docData);

      const newItem: AgentKnowledgeItem = {
        id: docRef.id,
        agentId,
        workspaceId,
        title: itemData.title,
        content: itemData.content,
        type: 'text',
        embeddingProvider,
        embeddingModel,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      // Store in Qdrant
      try {
        await storeInQdrant(newItem, embeddingProvider, embeddingModel);
      } catch (qdrantError) {
        console.warn('⚠️ Failed to store in Qdrant (continuing with Firestore only):', qdrantError);
      }

      return {
        success: true,
        data: newItem
      };
    }

    throw new Error('Invalid item data or missing required fields');
  } catch (error) {
    return {
      success: false,
      data: {} as AgentKnowledgeItem,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Get knowledge items for a specific agent
export async function getAgentKnowledgeItems(agentId: string): Promise<ApiResponse<AgentKnowledgeItem[]>> {
  try {
    const q = query(
      collection(db, 'agentKnowledge'),
      where('agentId', '==', agentId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const items = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toMillis() || Date.now(),
        updatedAt: data.updatedAt?.toMillis() || Date.now()
      } as AgentKnowledgeItem;
    });

    return {
      success: true,
      data: items
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Delete an agent knowledge item
export async function deleteAgentKnowledgeItem(itemId: string): Promise<ApiResponse<void>> {
  try {
    // Get item data to access file URL and for Qdrant deletion
    const itemRef = doc(db, 'agentKnowledge', itemId);
    const itemSnap = await getDoc(itemRef);

    if (itemSnap.exists()) {
      const itemData = itemSnap.data();

      // Delete from Qdrant first
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://git-branch-m-main.onrender.com';
        const qdrantResponse = await fetch(`${backendUrl}/api/knowledge-base/delete/${itemId}`, {
          method: 'DELETE',
        });

        if (qdrantResponse.ok) {
          const qdrantResult = await qdrantResponse.json();
          console.log(`✅ Deleted ${qdrantResult.deleted_chunks || 0} vector chunks from Qdrant`);
        }
      } catch (qdrantError) {
        console.warn('Could not delete from Qdrant:', qdrantError);
      }

      // Delete file from Storage if it exists
      if (itemData.fileUrl) {
        try {
          const fileRef = ref(storage, itemData.fileUrl);
          await deleteObject(fileRef);
        } catch (storageError) {
          console.warn('Could not delete file from storage:', storageError);
        }
      }
    }

    // Delete document from Firestore
    await deleteDoc(itemRef);

    console.log('✅ Successfully deleted from Firestore:', itemId);

    return {
      success: true,
      data: undefined
    };
  } catch (error) {
    console.error('❌ Error deleting knowledge item:', error);
    return {
      success: false,
      data: undefined,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Subscribe to real-time agent knowledge items
export function subscribeToAgentKnowledgeItems(
  agentId: string,
  callback: (items: AgentKnowledgeItem[]) => void
): () => void {
  const q = query(
    collection(db, 'agentKnowledge'),
    where('agentId', '==', agentId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toMillis() || Date.now(),
        updatedAt: data.updatedAt?.toMillis() || Date.now()
      } as AgentKnowledgeItem;
    });
    callback(items);
  });
}

// Get all knowledge items for a workspace
export async function getWorkspaceKnowledgeItems(workspaceId: string): Promise<ApiResponse<AgentKnowledgeItem[]>> {
  try {
    const q = query(
      collection(db, 'agentKnowledge'),
      where('workspaceId', '==', workspaceId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const items = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toMillis() || Date.now(),
        updatedAt: data.updatedAt?.toMillis() || Date.now()
      } as AgentKnowledgeItem;
    });

    return {
      success: true,
      data: items
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
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

export interface KnowledgeBaseItem {
  id: string;
  businessId: string;
  widgetId: string;
  title: string;
  content: string;
  type: 'text' | 'pdf' | 'website';
  fileName?: string;
  fileUrl?: string;
  fileSize?: number;
  websiteUrl?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

// Store knowledge base item in Qdrant for semantic search
async function storeInQdrant(item: KnowledgeBaseItem, embeddingModel: string = 'text-embedding-3-large'): Promise<void> {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
    const response = await fetch(`${backendUrl}/api/knowledge-base/store?embedding_model=${encodeURIComponent(embeddingModel)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: item.id,
        businessId: item.businessId,
        widgetId: item.widgetId,
        title: item.title,
        content: item.content,
        type: item.type,
        fileName: item.fileName,
        fileUrl: item.fileUrl,
        fileSize: item.fileSize
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
  } catch (error) {
    console.error('❌ Error storing in Qdrant:', error);
    throw error;
  }
}

// Create a new knowledge base item
export async function createKnowledgeBaseItem(
  businessId: string,
  widgetId: string,
  itemData: {
    title: string;
    content: string;
    type: 'text' | 'pdf' | 'website';
    file?: File;
    websiteUrl?: string;
    embeddingModel?: string;
  }
): Promise<ApiResponse<KnowledgeBaseItem>> {
  try {
    let fileUrl: string | undefined;
    let fileName: string | undefined;
    let fileSize: number | undefined;

    // Upload file to Firebase Storage if it's a PDF
    if (itemData.type === 'pdf' && itemData.file) {
      const fileRef = ref(storage, `knowledge-base/${businessId}/${widgetId}/${Date.now()}-${itemData.file.name}`);
      const uploadResult = await uploadBytes(fileRef, itemData.file);
      fileUrl = await getDownloadURL(uploadResult.ref);
      fileName = itemData.file.name;
      fileSize = itemData.file.size;
    }

    // Create knowledge base item in Firestore
    const docData: Record<string, unknown> = {
      businessId,
      widgetId,
      title: itemData.title,
      content: itemData.content,
      type: itemData.type,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Only add file-related fields if they exist
    if (fileName) docData.fileName = fileName;
    if (fileUrl) docData.fileUrl = fileUrl;
    if (fileSize) docData.fileSize = fileSize;
    
    // Add website URL if it's a website type
    if (itemData.type === 'website' && itemData.websiteUrl) {
      docData.websiteUrl = itemData.websiteUrl;
    }

    const docRef = await addDoc(collection(db, 'knowledgeBase'), docData);

    const newItem: KnowledgeBaseItem = {
      id: docRef.id,
      businessId,
      widgetId,
      title: itemData.title,
      content: itemData.content,
      type: itemData.type,
      fileName,
      fileUrl,
      fileSize,
      websiteUrl: itemData.websiteUrl,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // Also store in Qdrant for semantic search
    try {
      const embeddingModel = itemData.embeddingModel || 'text-embedding-3-large';
      console.log('📤 Storing in Qdrant with model:', embeddingModel);
      await storeInQdrant(newItem, embeddingModel);
      console.log('✅ Qdrant storage successful');
    } catch (qdrantError) {
      console.error('❌ Failed to store in Qdrant:', qdrantError);
      // Don't fail the whole operation if Qdrant fails
      // Firestore storage is still successful
    }

    return {
      success: true,
      data: newItem
    };
  } catch (error) {
    return {
      success: false,
      data: {} as KnowledgeBaseItem,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Get knowledge base items for a specific widget
export async function getKnowledgeBaseItems(widgetId: string): Promise<ApiResponse<KnowledgeBaseItem[]>> {
  try {
    // Fetch traditional knowledge base items
    const q = query(
      collection(db, 'knowledgeBase'),
      where('widgetId', '==', widgetId),
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
      } as KnowledgeBaseItem;
    });

    // Fetch scraped website data
    const scrapedQuery = query(
      collection(db, 'scraped_websites'),
      where('widget_id', '==', widgetId),
      orderBy('scraped_at', 'desc')
    );
    
    const scrapedSnapshot = await getDocs(scrapedQuery);
    const scrapedItems = scrapedSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        businessId: data.metadata?.business_id || '',
        widgetId: data.widget_id,
        title: data.title,
        content: data.content || '',
        type: 'website' as const,
        websiteUrl: data.url,
        createdAt: data.scraped_at?.toMillis() || Date.now(),
        updatedAt: data.scraped_at?.toMillis() || Date.now()
      } as KnowledgeBaseItem;
    });

    // Combine both types of items and sort by creation date
    const allItems = [...items, ...scrapedItems].sort((a, b) => b.createdAt - a.createdAt);

    return {
      success: true,
      data: allItems
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Subscribe to real-time knowledge base items
export function subscribeToKnowledgeBaseItems(
  widgetId: string,
  callback: (items: KnowledgeBaseItem[]) => void
): () => void {
  const q = query(
    collection(db, 'knowledgeBase'),
    where('widgetId', '==', widgetId),
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
      } as KnowledgeBaseItem;
    });
    callback(items);
  });
}

// Update a knowledge base item
export async function updateKnowledgeBaseItem(
  itemId: string,
  updates: {
    title?: string;
    content?: string;
    file?: File;
  }
): Promise<ApiResponse<KnowledgeBaseItem>> {
  try {
    const itemRef = doc(db, 'knowledgeBase', itemId);
    
    const updateData: Record<string, unknown> = {
      updatedAt: serverTimestamp()
    };

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.content !== undefined) updateData.content = updates.content;

    // Handle file upload if provided
    if (updates.file) {
      // Get current item to access businessId and widgetId
      const currentItem = await getDocs(query(collection(db, 'knowledgeBase'), where('__name__', '==', itemId)));
      if (currentItem.empty) {
        throw new Error('Item not found');
      }
      
      const currentData = currentItem.docs[0].data();
      const fileRef = ref(storage, `knowledge-base/${currentData.businessId}/${currentData.widgetId}/${Date.now()}-${updates.file.name}`);
      const uploadResult = await uploadBytes(fileRef, updates.file);
      const fileUrl = await getDownloadURL(uploadResult.ref);
      
      updateData.fileName = updates.file.name;
      updateData.fileUrl = fileUrl;
      updateData.fileSize = updates.file.size;
      updateData.type = 'pdf';
    }

    await updateDoc(itemRef, updateData);

    // Return updated item (simplified for now)
    return {
      success: true,
      data: {} as KnowledgeBaseItem
    };
  } catch (error) {
    return {
      success: false,
      data: {} as KnowledgeBaseItem,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Delete a knowledge base item
export async function deleteKnowledgeBaseItem(itemId: string): Promise<ApiResponse<void>> {
  try {
    // Get item data to access file URL
    const itemRef = doc(db, 'knowledgeBase', itemId);
    const itemSnap = await getDocs(query(collection(db, 'knowledgeBase'), where('__name__', '==', itemId)));
    
    if (!itemSnap.empty) {
      const itemData = itemSnap.docs[0].data();
      
      // Delete file from Storage if it exists
      if (itemData.fileUrl) {
        const fileRef = ref(storage, itemData.fileUrl);
        await deleteObject(fileRef);
      }
    }

    // Delete document from Firestore
    await deleteDoc(itemRef);

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

// Create a website knowledge base item from backend scraping
export async function createWebsiteKnowledgeBaseItem(
  businessId: string,
  widgetId: string,
  itemData: {
    title: string;
    websiteUrl: string;
    totalPages: number;
    successfulPages: number;
    totalWordCount: number;
    chunksCreated: number;
  }
): Promise<ApiResponse<KnowledgeBaseItem>> {
  try {
    // Create knowledge base item in Firestore
    const docData = {
      businessId,
      widgetId,
      title: itemData.title,
      content: `Website scraped from ${itemData.websiteUrl}. Total pages: ${itemData.totalPages}, Successful pages: ${itemData.successfulPages}, Word count: ${itemData.totalWordCount}, Chunks created: ${itemData.chunksCreated}`,
      type: 'website' as const,
      websiteUrl: itemData.websiteUrl,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'knowledgeBase'), docData);

    const newItem: KnowledgeBaseItem = {
      id: docRef.id,
      businessId,
      widgetId,
      title: itemData.title,
      content: docData.content,
      type: 'website',
      websiteUrl: itemData.websiteUrl,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    return {
      success: true,
      data: newItem
    };
  } catch (error) {
    return {
      success: false,
      data: {} as KnowledgeBaseItem,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Get all knowledge base items for a business
export async function getBusinessKnowledgeBaseItems(businessId: string): Promise<ApiResponse<KnowledgeBaseItem[]>> {
  try {
    const q = query(
      collection(db, 'knowledgeBase'),
      where('businessId', '==', businessId),
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
      } as KnowledgeBaseItem;
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

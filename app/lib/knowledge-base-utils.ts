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
  type: 'text' | 'pdf';
  fileName?: string;
  fileUrl?: string;
  fileSize?: number;
  createdAt: number;
  updatedAt: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

// Create a new knowledge base item
export async function createKnowledgeBaseItem(
  businessId: string,
  widgetId: string,
  itemData: {
    title: string;
    content: string;
    type: 'text' | 'pdf';
    file?: File;
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
    const docRef = await addDoc(collection(db, 'knowledgeBase'), {
      businessId,
      widgetId,
      title: itemData.title,
      content: itemData.content,
      type: itemData.type,
      fileName,
      fileUrl,
      fileSize,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

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

// Get knowledge base items for a specific widget
export async function getKnowledgeBaseItems(widgetId: string): Promise<ApiResponse<KnowledgeBaseItem[]>> {
  try {
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
    
    const updateData: any = {
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
      data: undefined as any
    };
  } catch (error) {
    return {
      success: false,
      data: undefined as any,
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

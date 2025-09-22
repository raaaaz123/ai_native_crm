import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp,
  increment,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

// Types
export interface ChatMessage {
  id: string;
  conversationId: string;
  text: string;
  sender: 'customer' | 'business';
  senderName: string;
  createdAt: number;
  readAt?: number;
}

export interface ChatConversation {
  id: string;
  businessId: string;
  widgetId: string;
  customerName: string;
  customerEmail: string;
  status: 'active' | 'closed' | 'pending' | 'resolved' | 'unsolved' | 'custom';
  customStatus?: string; // For custom status text
  lastMessage?: string;
  lastMessageAt?: number;
  unreadCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface ChatWidget {
  id: string;
  businessId: string;
  name: string;
  welcomeMessage: string;
  primaryColor: string;
  position: 'bottom-right' | 'bottom-left';
  buttonText: string;
  placeholderText: string;
  offlineMessage: string;
  collectEmail: boolean;
  collectPhone: boolean;
  autoReply: string;
  businessHours: {
    enabled: boolean;
    timezone: string;
    monday: { start: string; end: string; enabled: boolean };
    tuesday: { start: string; end: string; enabled: boolean };
    wednesday: { start: string; end: string; enabled: boolean };
    thursday: { start: string; end: string; enabled: boolean };
    friday: { start: string; end: string; enabled: boolean };
    saturday: { start: string; end: string; enabled: boolean };
    sunday: { start: string; end: string; enabled: boolean };
  };
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

// API Response type
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

// Widget functions
export async function createChatWidget(
  businessId: string, 
  widgetData: Omit<ChatWidget, 'id' | 'businessId' | 'isActive' | 'createdAt' | 'updatedAt'>
): Promise<ApiResponse<ChatWidget>> {
  try {
    const docRef = await addDoc(collection(db, 'chatWidgets'), {
      businessId,
      ...widgetData,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    const doc = await getDoc(docRef);
    const data = doc.data();
    
    return {
      success: true,
      data: {
        id: doc.id,
        ...data,
        createdAt: data?.createdAt?.toMillis() || Date.now(),
        updatedAt: data?.updatedAt?.toMillis() || Date.now()
      } as ChatWidget
    };
  } catch (error) {
    return {
      success: false,
      data: {} as ChatWidget,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function getChatWidget(widgetId: string): Promise<ApiResponse<ChatWidget>> {
  try {
    const docRef = doc(db, 'chatWidgets', widgetId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return {
        success: false,
        data: {} as ChatWidget,
        error: 'Widget not found'
      };
    }

    const data = docSnap.data();
    return {
      success: true,
      data: {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toMillis() || Date.now(),
        updatedAt: data.updatedAt?.toMillis() || Date.now()
      } as ChatWidget
    };
  } catch (error) {
    return {
      success: false,
      data: {} as ChatWidget,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function getBusinessWidgets(businessId: string): Promise<ApiResponse<ChatWidget[]>> {
  try {
    const q = query(
      collection(db, 'chatWidgets'),
      where('businessId', '==', businessId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const widgets = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toMillis() || Date.now(),
        updatedAt: data.updatedAt?.toMillis() || Date.now()
      } as ChatWidget;
    });

    return {
      success: true,
      data: widgets
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Conversation functions
export async function createChatConversation(
  businessId: string,
  widgetId: string,
  customerData: { customerName: string; customerEmail: string }
): Promise<ApiResponse<ChatConversation>> {
  try {
    const docRef = await addDoc(collection(db, 'chatConversations'), {
      businessId,
      widgetId,
      ...customerData,
      status: 'active',
      unreadCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    const docSnap = await getDoc(docRef);
    const data = docSnap.data();
    
    return {
      success: true,
      data: {
        id: docSnap.id,
        ...data,
        createdAt: data?.createdAt?.toMillis() || Date.now(),
        updatedAt: data?.updatedAt?.toMillis() || Date.now()
      } as ChatConversation
    };
  } catch (error) {
    return {
      success: false,
      data: {} as ChatConversation,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function getBusinessConversations(businessId: string): Promise<ApiResponse<ChatConversation[]>> {
  try {
    const q = query(
      collection(db, 'chatConversations'),
      where('businessId', '==', businessId),
      orderBy('updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const conversations = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toMillis() || Date.now(),
        updatedAt: data.updatedAt?.toMillis() || Date.now(),
        lastMessageAt: data.lastMessageAt?.toMillis()
      } as ChatConversation;
    });

    return {
      success: true,
      data: conversations
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function getConversation(conversationId: string): Promise<ApiResponse<ChatConversation>> {
  try {
    const docRef = doc(db, 'chatConversations', conversationId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return {
        success: false,
        data: {} as ChatConversation,
        error: 'Conversation not found'
      };
    }

    const data = docSnap.data();
    return {
      success: true,
      data: {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toMillis() || Date.now(),
        updatedAt: data.updatedAt?.toMillis() || Date.now(),
        lastMessageAt: data.lastMessageAt?.toMillis()
      } as ChatConversation
    };
  } catch (error) {
    return {
      success: false,
      data: {} as ChatConversation,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Message functions
export async function sendMessage(
  conversationId: string,
  messageData: { text: string; sender: 'customer' | 'business'; senderName: string }
): Promise<ApiResponse<ChatMessage>> {
  try {
    // Add message
    const messageRef = await addDoc(collection(db, 'chatMessages'), {
      conversationId,
      ...messageData,
      createdAt: serverTimestamp()
    });

    // Update conversation
    const conversationRef = doc(db, 'chatConversations', conversationId);
    const updateData: any = {
      lastMessage: messageData.text,
      lastMessageAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Increment unread count if message is from customer
    if (messageData.sender === 'customer') {
      updateData.unreadCount = increment(1);
    }

    await updateDoc(conversationRef, updateData);

    const messageDoc = await getDoc(messageRef);
    const data = messageDoc.data();
    
    return {
      success: true,
      data: {
        id: messageDoc.id,
        ...data,
        createdAt: data?.createdAt?.toMillis() || Date.now()
      } as ChatMessage
    };
  } catch (error) {
    return {
      success: false,
      data: {} as ChatMessage,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function getMessages(conversationId: string): Promise<ApiResponse<ChatMessage[]>> {
  try {
    const q = query(
      collection(db, 'chatMessages'),
      where('conversationId', '==', conversationId),
      orderBy('createdAt', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const messages = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toMillis() || Date.now(),
        readAt: data.readAt?.toMillis()
      } as ChatMessage;
    });

    return {
      success: true,
      data: messages
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Real-time subscriptions
export function subscribeToConversations(
  businessId: string, 
  callback: (conversations: ChatConversation[]) => void
): () => void {
  const q = query(
    collection(db, 'chatConversations'),
    where('businessId', '==', businessId),
    orderBy('updatedAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const conversations = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toMillis() || Date.now(),
        updatedAt: data.updatedAt?.toMillis() || Date.now(),
        lastMessageAt: data.lastMessageAt?.toMillis()
      } as ChatConversation;
    });
    callback(conversations);
  });
}

export function subscribeToMessages(
  conversationId: string,
  callback: (messages: ChatMessage[]) => void
): () => void {
  const q = query(
    collection(db, 'chatMessages'),
    where('conversationId', '==', conversationId),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toMillis() || Date.now(),
        readAt: data.readAt?.toMillis()
      } as ChatMessage;
    });
    callback(messages);
  });
}

// Utility functions
export async function markConversationAsRead(conversationId: string): Promise<void> {
  try {
    const conversationRef = doc(db, 'chatConversations', conversationId);
    await updateDoc(conversationRef, {
      unreadCount: 0,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error marking conversation as read:', error);
  }
}

export async function updateConversationStatus(
  conversationId: string, 
  status: 'active' | 'closed' | 'pending' | 'resolved' | 'unsolved' | 'custom',
  customStatus?: string
): Promise<void> {
  try {
    const conversationRef = doc(db, 'chatConversations', conversationId);
    const updateData: any = {
      status,
      updatedAt: serverTimestamp()
    };
    
    if (status === 'custom' && customStatus) {
      updateData.customStatus = customStatus;
    } else if (status !== 'custom') {
      // Remove customStatus if not using custom status
      updateData.customStatus = null;
    }
    
    await updateDoc(conversationRef, updateData);
  } catch (error) {
    console.error('Error updating conversation status:', error);
  }
}
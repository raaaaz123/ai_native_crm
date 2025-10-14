import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  serverTimestamp,
  increment
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
  metadata?: Record<string, unknown>;
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
  // Handover fields
  handoverRequested?: boolean;
  handoverRequestedAt?: number;
  handoverMethod?: 'button' | 'keyword' | 'quick_reply' | 'manual';
  handoverMode?: 'ai' | 'human';
  handoverTakenAt?: number;
}

export interface ChatWidget {
  id: string;
  businessId: string;
  name: string;
  welcomeMessage: string;
  primaryColor: string;
  secondaryColor?: string;
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  buttonText: string;
  placeholderText: string;
  offlineMessage: string;
  collectEmail: boolean;
  collectPhone: boolean;
  autoReply: string;
  // Widget branding
  widgetIcon?: string; // AI icon name or custom
  logoUrl?: string; // Uploaded logo URL
  // Data collection settings
  enableDataCollection?: boolean;
  dataCollectionFields?: {
    name: { enabled: boolean; required: boolean; label: string };
    email: { enabled: boolean; required: boolean; label: string };
    phone: { enabled: boolean; required: boolean; label: string };
  };
  // Widget size options
  widgetSize?: 'compact' | 'standard' | 'large';
  // Chat button customization
  buttonStyle?: 'circular' | 'rounded' | 'square' | 'pill' | 'modern' | 'gradient';
  buttonIcon?: string; // Icon name from lucide-react
  buttonSize?: 'small' | 'medium' | 'large' | 'xl';
  buttonAnimation?: 'bounce' | 'pulse' | 'shake' | 'glow' | 'none';
  showButtonText?: boolean;
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
  aiConfig?: {
    enabled: boolean;
    provider?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    confidenceThreshold?: number;
    maxRetrievalDocs?: number;
    ragEnabled?: boolean;
    fallbackToHuman?: boolean;
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
        createdAt: data?.createdAt && typeof data.createdAt.toMillis === 'function' 
          ? data.createdAt.toMillis() 
          : (typeof data?.createdAt === 'number' ? data.createdAt : Date.now()),
        updatedAt: data?.updatedAt && typeof data.updatedAt.toMillis === 'function' 
          ? data.updatedAt.toMillis() 
          : (typeof data?.updatedAt === 'number' ? data.updatedAt : Date.now())
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
        createdAt: data.createdAt && typeof data.createdAt.toMillis === 'function' 
          ? data.createdAt.toMillis() 
          : (typeof data.createdAt === 'number' ? data.createdAt : Date.now()),
        updatedAt: data.updatedAt && typeof data.updatedAt.toMillis === 'function' 
          ? data.updatedAt.toMillis() 
          : (typeof data.updatedAt === 'number' ? data.updatedAt : Date.now())
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

export async function updateChatWidget(
  widgetId: string,
  widgetData: Partial<ChatWidget>
): Promise<ApiResponse<ChatWidget>> {
  console.log('updateChatWidget: Starting update process');
  console.log('updateChatWidget: Widget ID:', widgetId);
  console.log('updateChatWidget: Widget data to update:', widgetData);
  
  try {
    const docRef = doc(db, 'chatWidgets', widgetId);
    console.log('updateChatWidget: Document reference created for collection chatWidgets');
    
    const updateData = {
      ...widgetData,
      updatedAt: serverTimestamp()
    };
    console.log('updateChatWidget: Prepared update data with serverTimestamp:', updateData);
    
    await updateDoc(docRef, updateData);
    console.log('updateChatWidget: Document updated successfully in Firestore');

    const docSnap = await getDoc(docRef);
    console.log('updateChatWidget: Retrieved updated document');
    console.log('updateChatWidget: Document exists:', docSnap.exists());
    
    const data = docSnap.data();
    console.log('updateChatWidget: Document data:', data);
    
    const result = {
      success: true,
      data: {
        id: docSnap.id,
        ...data,
        createdAt: data?.createdAt && typeof data.createdAt.toMillis === 'function' 
          ? data.createdAt.toMillis() 
          : (typeof data?.createdAt === 'number' ? data.createdAt : Date.now()),
        updatedAt: data?.updatedAt && typeof data.updatedAt.toMillis === 'function' 
          ? data.updatedAt.toMillis() 
          : (typeof data?.updatedAt === 'number' ? data.updatedAt : Date.now())
      } as ChatWidget
    };
    
    console.log('updateChatWidget: Success - Returning result:', result);
    return result;
  } catch (error) {
    console.error('updateChatWidget: Error occurred:', error);
    console.error('updateChatWidget: Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      widgetId: widgetId,
      widgetData: widgetData
    });
    
    return {
      success: false,
      data: {} as ChatWidget,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function getBusinessWidgets(businessId: string): Promise<ApiResponse<ChatWidget[]>> {
  try {
    console.log('getBusinessWidgets: Searching for businessId:', businessId);
    const q = query(
      collection(db, 'chatWidgets'),
      where('businessId', '==', businessId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    console.log('getBusinessWidgets: Found', querySnapshot.docs.length, 'widgets');
    
    const widgets = querySnapshot.docs.map(doc => {
      const data = doc.data();
      console.log('getBusinessWidgets: Processing widget:', doc.id, data);
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt && typeof data.createdAt.toMillis === 'function' 
          ? data.createdAt.toMillis() 
          : (typeof data.createdAt === 'number' ? data.createdAt : Date.now()),
        updatedAt: data.updatedAt && typeof data.updatedAt.toMillis === 'function' 
          ? data.updatedAt.toMillis() 
          : (typeof data.updatedAt === 'number' ? data.updatedAt : Date.now())
      } as ChatWidget;
    });

    console.log('getBusinessWidgets: Returning widgets:', widgets);
    return {
      success: true,
      data: widgets
    };
  } catch (error) {
    console.error('Error fetching business widgets:', error);
    
    // Handle specific Firestore errors
    if (error instanceof Error) {
      if (error.message.includes('unavailable') || error.message.includes('connection')) {
        return {
          success: false,
          data: [],
          error: 'Connection failed. Please check your internet connection and try again.'
        };
      }
      
      if (error.message.includes('permission')) {
        return {
          success: false,
          data: [],
          error: 'Permission denied. Please check your account permissions.'
        };
      }
    }
    
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function deleteChatWidget(widgetId: string): Promise<ApiResponse<boolean>> {
  try {
    const docRef = doc(db, 'chatWidgets', widgetId);
    await deleteDoc(docRef);

    return {
      success: true,
      data: true
    };
  } catch (error) {
    return {
      success: false,
      data: false,
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
    console.log('💬 Creating new conversation...');
    console.log('  Business ID:', businessId);
    console.log('  Widget ID:', widgetId);
    console.log('  Customer Name:', customerData.customerName);
    console.log('  Customer Email:', customerData.customerEmail);
    
    const docRef = await addDoc(collection(db, 'chatConversations'), {
      businessId,
      widgetId,
      ...customerData,
      status: 'active',
      unreadCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log('  ✅ Conversation created with ID:', docRef.id);

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
    console.error('❌ Error creating conversation:', error);
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
  messageData: { 
    text: string; 
    sender: 'customer' | 'business'; 
    senderName: string;
    metadata?: Record<string, unknown>;
  }
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
    const updateData: Record<string, unknown> = {
      lastMessage: messageData.text,
      lastMessageAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Increment unread count if message is from customer
    if (messageData.sender === 'customer') {
      updateData.unreadCount = increment(1);
    }

    await updateDoc(conversationRef, updateData);

    // Send email notification
    try {
      await sendEmailNotification(conversationId, messageData);
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
      // Don't fail the message send if email fails
    }

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
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    console.log(`📥 Loaded ${snapshot.docs.length} conversations for businessId: ${businessId}`);
    
    const conversations = snapshot.docs.map(doc => {
      const data = doc.data();
      const conv = {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toMillis() || Date.now(),
        updatedAt: data.updatedAt?.toMillis() || Date.now(),
        lastMessageAt: data.lastMessageAt?.toMillis()
      } as ChatConversation;
      
      console.log(`  - Conversation: ${conv.customerName} (${conv.id}), created: ${new Date(conv.createdAt).toLocaleString()}`);
      return conv;
    });
    
    // Sort by lastMessageAt (most recent first), fallback to createdAt
    conversations.sort((a, b) => {
      const aTime = a.lastMessageAt || a.createdAt;
      const bTime = b.lastMessageAt || b.createdAt;
      return bTime - aTime;
    });
    
    callback(conversations);
  }, (error: Error & { code?: string }) => {
    if (error.code === 'failed-precondition' || error.message?.includes('index')) {
      console.warn('⏳ Firestore index is building. This usually takes 2-5 minutes.');
      console.warn('   Conversations will load automatically once the index is ready.');
      console.warn('   You can check the status here: https://console.firebase.google.com/project/rexa-engage/firestore/indexes');
      
      // Retry after 10 seconds
      setTimeout(() => {
        console.log('🔄 Retrying conversation subscription...');
        subscribeToConversations(businessId, callback);
      }, 10000);
    } else {
      console.error('❌ Error subscribing to conversations:', error);
      console.error('  Error code:', error.code);
      console.error('  Error message:', error.message);
    }
    
    // Return empty array on error
    callback([]);
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
    const updateData: Record<string, unknown> = {
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

// Request handover to human agent
export async function requestHandover(
  conversationId: string,
  method: 'button' | 'keyword' | 'quick_reply' | 'manual'
): Promise<void> {
  try {
    const conversationRef = doc(db, 'chatConversations', conversationId);
    await updateDoc(conversationRef, {
      handoverRequested: true,
      handoverRequestedAt: serverTimestamp(),
      handoverMethod: method,
      handoverMode: 'human',
      updatedAt: serverTimestamp()
    });
    
    console.log(`Handover requested for conversation ${conversationId} via ${method}`);
  } catch (error) {
    console.error('Error requesting handover:', error);
    throw error;
  }
}

// Clear handover request (when switching back to AI or when agent takes over)
export async function clearHandover(conversationId: string): Promise<void> {
  try {
    const conversationRef = doc(db, 'chatConversations', conversationId);
    await updateDoc(conversationRef, {
      handoverRequested: false,
      handoverMode: 'ai',
      handoverTakenAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log(`Handover cleared for conversation ${conversationId}`);
  } catch (error) {
    console.error('Error clearing handover:', error);
    throw error;
  }
}

// Email notification function
async function sendEmailNotification(
  conversationId: string,
  messageData: { text: string; sender: 'customer' | 'business'; senderName: string; metadata?: Record<string, unknown> }
): Promise<void> {
  try {
    // Get conversation details
    const conversationDoc = await getDoc(doc(db, 'chatConversations', conversationId));
    if (!conversationDoc.exists()) {
      console.error('Conversation not found for email notification');
      return;
    }

    const conversation = conversationDoc.data();
    const { customerName, customerEmail } = conversation;

    // Get business details (you might need to fetch from users collection)
    // For now, we'll use a placeholder - you should fetch actual business email
    const businessEmail = 'support@rexahire.com'; // This should be fetched from business profile
    const businessName = 'Business'; // This should be fetched from business profile

    // Determine sender type for email template
    let senderType: 'customer' | 'business' | 'ai' = messageData.sender;
    if (messageData.metadata?.ai_generated) {
      senderType = 'ai';
    }

    // Send email notification to backend
    const emailPayload = {
      conversationId,
      message: messageData.text,
      senderType,
      senderName: messageData.senderName,
      customerName,
      customerEmail,
      businessName,
      businessEmail,
      metadata: messageData.metadata
    };

    // Try to call backend email service, but don't fail if it's not available
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/email/send-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPayload)
      });

      if (!response.ok) {
        console.error('Failed to send email notification:', await response.text());
      }
    } catch (fetchError) {
      console.log('Email service not available, skipping email notification:', fetchError);
      // Don't throw error - email is optional
    }
  } catch (error) {
    console.error('Error sending email notification:', error);
  }
}
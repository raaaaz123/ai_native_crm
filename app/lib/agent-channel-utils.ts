import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

export interface AgentChannel {
  id: string;
  agentId: string;
  workspaceSlug: string;
  type: 'chat-widget' | 'help-page';
  name: string;
  isActive: boolean;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  settings?: {
    widgetTitle?: string;
    welcomeMessage?: string;
    placeholder?: string;
    primaryColor?: string;
    position?: string;
    theme?: string;
    suggestedMessages?: string[];
    collectFeedback?: boolean;
    keepSuggestedMessages?: boolean;
    footerMessage?: string;
    appearance?: 'light' | 'dark';
    profilePictureUrl?: string;
    chatIconUrl?: string;
    chatBubbleColor?: string;
    chatBubbleAlignment?: 'left' | 'right';
    aiInstructions?: string;
    aiModel?: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Create a new agent channel
export async function createAgentChannel(
  channelData: {
    agentId: string;
    workspaceSlug: string;
    type: 'chat-widget' | 'help-page';
    name: string;
    settings?: AgentChannel['settings'];
  }
): Promise<ApiResponse<AgentChannel>> {
  try {
    const docData = {
      ...channelData,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'agentChannels'), docData);
    
    const newChannel: AgentChannel = {
      id: docRef.id,
      ...channelData,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      settings: channelData.settings || {}
    };

    return { success: true, data: newChannel };
  } catch (error) {
    console.error('Error creating agent channel:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create channel' 
    };
  }
}

// Get all channels for an agent
export async function getAgentChannels(
  agentId: string
): Promise<ApiResponse<AgentChannel[]>> {
  try {
    const q = query(
      collection(db, 'agentChannels'),
      where('agentId', '==', agentId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const channels: AgentChannel[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      channels.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
      } as AgentChannel);
    });

    return { success: true, data: channels };
  } catch (error) {
    console.error('Error getting agent channels:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get channels'
    };
  }
}

// Get a single agent channel by ID
export async function getAgentChannel(
  channelId: string
): Promise<ApiResponse<AgentChannel>> {
  try {
    const channelRef = doc(db, 'agentChannels', channelId);
    const channelSnap = await getDoc(channelRef);

    if (!channelSnap.exists()) {
      return {
        success: false,
        error: 'Channel not found'
      };
    }

    const data = channelSnap.data();
    const channel: AgentChannel = {
      id: channelSnap.id,
      ...data,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
    } as AgentChannel;

    return { success: true, data: channel };
  } catch (error) {
    console.error('Error getting agent channel:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get channel'
    };
  }
}

// Update channel status
export async function updateChannelStatus(
  channelId: string,
  isActive: boolean
): Promise<ApiResponse<void>> {
  try {
    const channelRef = doc(db, 'agentChannels', channelId);
    await updateDoc(channelRef, {
      isActive,
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating channel status:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update channel' 
    };
  }
}

// Get all channels for a workspace
export async function getWorkspaceChannels(
  workspaceSlug: string
): Promise<ApiResponse<AgentChannel[]>> {
  try {
    const q = query(
      collection(db, 'agentChannels'),
      where('workspaceSlug', '==', workspaceSlug),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const channels: AgentChannel[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      channels.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
      } as AgentChannel);
    });

    return { success: true, data: channels };
  } catch (error) {
    console.error('Error getting workspace channels:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get channels'
    };
  }
}

// Update agent channel
export async function updateAgentChannel(
  channelId: string,
  updates: Partial<Omit<AgentChannel, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<ApiResponse<void>> {
  try {
    const channelRef = doc(db, 'agentChannels', channelId);
    await updateDoc(channelRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating agent channel:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update channel'
    };
  }
}

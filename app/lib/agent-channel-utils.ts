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
import { getAgent } from './agent-utils';
import { getWorkspaceBySlug } from './workspace-firestore-utils';

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
    // Messages to show near the bubble when the widget is closed
    closedWelcomeMessages?: string[];
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
    // Show preset suggestions above the bubble when widget is closed
    showClosedSuggestions?: boolean;
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

    // Send agent deployed email notification (non-blocking)
    try {
      const { sendAgentDeployedEmail } = await import('./email-utils');
      // Get agent and workspace info for email
      const agentResult = await getAgent(channelData.agentId);
      if (agentResult.success && agentResult.data) {
        const workspaceResult = await getWorkspaceBySlug(channelData.workspaceSlug);
        if (workspaceResult.success && workspaceResult.data) {
          // Get workspace owner email
          const ownerDoc = await getDoc(doc(db, 'users', workspaceResult.data.ownerId));
          if (ownerDoc.exists()) {
            const ownerData = ownerDoc.data();
            const userEmail = ownerData.email || '';
            const userName = ownerData.displayName || ownerData.firstName || 'User';
            if (userEmail) {
              await sendAgentDeployedEmail(
                userEmail,
                userName,
                agentResult.data.name,
                channelData.agentId,
                workspaceResult.data.id
              );
            }
          }
        }
      }
    } catch (emailError) {
      // Don't fail channel creation if email fails
      console.error('❌ [Create Channel] Failed to send agent deployed email:', emailError);
    }

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

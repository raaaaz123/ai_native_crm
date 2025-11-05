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
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import {
  AgentAction,
  CreateActionData,
  UpdateActionData,
  CollectLeadsSubmission,
  CollectLeadsConfig,
  CustomButtonConfig,
  CalendlyConfig
} from './action-types';

// Re-export types for convenience
export type { AgentAction, CollectLeadsConfig, CustomButtonConfig, CalendlyConfig, CollectLeadsSubmission };

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

// Collections
const ACTIONS_COLLECTION = 'agentActions';
const SUBMISSIONS_COLLECTION = 'collectLeadsSubmissions';

// Create a new action for an agent
export async function createAgentAction(
  agentId: string,
  workspaceId: string,
  actionData: CreateActionData
): Promise<ApiResponse<AgentAction>> {
  try {
    const docData = {
      agentId,
      workspaceId,
      type: actionData.type,
      name: actionData.name,
      description: actionData.description,
      status: 'draft' as const,
      configuration: actionData.configuration,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, ACTIONS_COLLECTION), docData);
    
    const createdAction: AgentAction = {
      id: docRef.id,
      agentId,
      workspaceId,
      type: actionData.type,
      name: actionData.name,
      description: actionData.description,
      status: 'draft',
      configuration: actionData.configuration,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return {
      success: true,
      data: createdAction
    };
  } catch (error) {
    console.error('Error creating agent action:', error);
    return {
      success: false,
      data: {} as AgentAction,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Get all actions for an agent
export async function getAgentActions(agentId: string): Promise<ApiResponse<AgentAction[]>> {
  try {
    const q = query(
      collection(db, ACTIONS_COLLECTION),
      where('agentId', '==', agentId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const actions: AgentAction[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      actions.push({
        id: doc.id,
        agentId: data.agentId,
        workspaceId: data.workspaceId,
        type: data.type,
        name: data.name,
        description: data.description,
        status: data.status,
        configuration: data.configuration,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      });
    });

    return {
      success: true,
      data: actions
    };
  } catch (error) {
    console.error('Error fetching agent actions:', error);
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Save Calendly configuration
export async function saveCalendlyConfig(
  actionId: string,
  config: Partial<CalendlyConfig>
): Promise<ApiResponse<AgentAction>> {
  try {
    const docRef = doc(db, ACTIONS_COLLECTION, actionId);
    
    // Get current action to merge configurations
    const currentDoc = await getDoc(docRef);
    if (!currentDoc.exists()) {
      throw new Error('Action not found');
    }

    const currentData = currentDoc.data();
    const updatedConfiguration = {
      ...currentData.configuration,
      ...config
    };

    await updateDoc(docRef, {
      configuration: updatedConfiguration,
      updatedAt: serverTimestamp()
    });

    // Return updated action
    return getAgentAction(actionId);
  } catch (error) {
    console.error('Error saving Calendly config:', error);
    return {
      success: false,
      data: {} as AgentAction,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Get active Calendly actions for an agent
export async function getActiveCalendlyActions(
  agentId: string
): Promise<ApiResponse<AgentAction[]>> {
  try {
    const q = query(
      collection(db, ACTIONS_COLLECTION),
      where('agentId', '==', agentId),
      where('type', '==', 'calendly-slots'),
      where('status', '==', 'active')
    );

    const querySnapshot = await getDocs(q);
    const actions: AgentAction[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      actions.push({
        id: doc.id,
        agentId: data.agentId,
        workspaceId: data.workspaceId,
        type: data.type,
        name: data.name,
        description: data.description,
        status: data.status,
        configuration: data.configuration,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      });
    });

    return {
      success: true,
      data: actions
    };
  } catch (error) {
    console.error('Error fetching active Calendly actions:', error);
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Get a specific action by ID
export async function getAgentAction(actionId: string): Promise<ApiResponse<AgentAction>> {
  try {
    const docRef = doc(db, ACTIONS_COLLECTION, actionId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return {
        success: false,
        data: {} as AgentAction,
        error: 'Action not found'
      };
    }

    const data = docSnap.data();
    const action: AgentAction = {
      id: docSnap.id,
      agentId: data.agentId,
      workspaceId: data.workspaceId,
      type: data.type,
      name: data.name,
      description: data.description,
      status: data.status,
      configuration: data.configuration,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    };

    return {
      success: true,
      data: action
    };
  } catch (error) {
    console.error('Error fetching agent action:', error);
    return {
      success: false,
      data: {} as AgentAction,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Update an existing action
export async function updateAgentAction(
  actionId: string,
  updates: UpdateActionData
): Promise<ApiResponse<AgentAction>> {
  try {
    const docRef = doc(db, ACTIONS_COLLECTION, actionId);
    
    const updateData: Record<string, unknown> = {
      ...updates,
      updatedAt: serverTimestamp()
    };

    await updateDoc(docRef, updateData);
    
    // Fetch the updated document
    const updatedDoc = await getDoc(docRef);
    if (!updatedDoc.exists()) {
      throw new Error('Action not found after update');
    }

    const data = updatedDoc.data();
    const updatedAction: AgentAction = {
      id: updatedDoc.id,
      agentId: data.agentId,
      workspaceId: data.workspaceId,
      type: data.type,
      name: data.name,
      description: data.description,
      status: data.status,
      configuration: data.configuration,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    };

    return {
      success: true,
      data: updatedAction
    };
  } catch (error) {
    console.error('Error updating agent action:', error);
    return {
      success: false,
      data: {} as AgentAction,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Delete an action
export async function deleteAgentAction(actionId: string): Promise<ApiResponse<void>> {
  try {
    const docRef = doc(db, ACTIONS_COLLECTION, actionId);
    await deleteDoc(docRef);

    return {
      success: true,
      data: undefined
    };
  } catch (error) {
    console.error('Error deleting agent action:', error);
    return {
      success: false,
      data: undefined,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Save collect leads configuration
export async function saveCollectLeadsConfig(
  actionId: string,
  config: Partial<CollectLeadsConfig>
): Promise<ApiResponse<AgentAction>> {
  try {
    const docRef = doc(db, ACTIONS_COLLECTION, actionId);
    
    // Get current action to merge configurations
    const currentDoc = await getDoc(docRef);
    if (!currentDoc.exists()) {
      throw new Error('Action not found');
    }

    const currentData = currentDoc.data();
    const currentConfig = currentData.configuration as CollectLeadsConfig;
    
    // Merge the configurations
    const updatedConfig: CollectLeadsConfig = {
      general: { ...currentConfig.general, ...config.general },
      fields: config.fields || currentConfig.fields,
      messages: { ...currentConfig.messages, ...config.messages },
      channels: { ...currentConfig.channels, ...config.channels }
    };

    const updateData = {
      configuration: updatedConfig,
      updatedAt: serverTimestamp()
    };

    await updateDoc(docRef, updateData);
    
    // Return updated action
    return getAgentAction(actionId);
  } catch (error) {
    console.error('Error saving collect leads config:', error);
    return {
      success: false,
      data: {} as AgentAction,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Submit collect leads form data
export async function submitCollectLeadsForm(
  agentId: string,
  actionId: string,
  formData: Record<string, string>,
  conversationId?: string,
  metadata?: { ipAddress?: string; userAgent?: string }
): Promise<ApiResponse<CollectLeadsSubmission>> {
  try {
    const docData = {
      agentId,
      actionId,
      conversationId,
      data: formData,
      submittedAt: serverTimestamp(),
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent
    };

    const docRef = await addDoc(collection(db, SUBMISSIONS_COLLECTION), docData);
    
    const submission: CollectLeadsSubmission = {
      id: docRef.id,
      agentId,
      actionId,
      conversationId,
      data: formData,
      submittedAt: new Date(),
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent
    };

    return {
      success: true,
      data: submission
    };
  } catch (error) {
    console.error('Error submitting collect leads form:', error);
    return {
      success: false,
      data: {} as CollectLeadsSubmission,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Get collect leads submissions for an action
export async function getCollectLeadsSubmissions(
  actionId: string
): Promise<ApiResponse<CollectLeadsSubmission[]>> {
  try {
    const q = query(
      collection(db, SUBMISSIONS_COLLECTION),
      where('actionId', '==', actionId),
      orderBy('submittedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const submissions: CollectLeadsSubmission[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      submissions.push({
        id: doc.id,
        agentId: data.agentId,
        actionId: data.actionId,
        conversationId: data.conversationId,
        data: data.data,
        submittedAt: data.submittedAt?.toDate() || new Date(),
        ipAddress: data.ipAddress,
        userAgent: data.userAgent
      });
    });

    return {
      success: true,
      data: submissions
    };
  } catch (error) {
    console.error('Error fetching collect leads submissions:', error);
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Get all collect leads submissions for an agent (across all actions)
export async function getAgentLeadSubmissions(
  agentId: string
): Promise<ApiResponse<CollectLeadsSubmission[]>> {
  try {
    const q = query(
      collection(db, SUBMISSIONS_COLLECTION),
      where('agentId', '==', agentId),
      orderBy('submittedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const submissions: CollectLeadsSubmission[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      submissions.push({
        id: doc.id,
        agentId: data.agentId,
        actionId: data.actionId,
        conversationId: data.conversationId,
        data: data.data,
        submittedAt: data.submittedAt?.toDate() || new Date(),
        ipAddress: data.ipAddress,
        userAgent: data.userAgent
      });
    });

    return {
      success: true,
      data: submissions
    };
  } catch (error) {
    console.error('Error fetching agent lead submissions:', error);
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Save custom button configuration
export async function saveCustomButtonConfig(
  actionId: string,
  config: Partial<CustomButtonConfig>
): Promise<ApiResponse<AgentAction>> {
  try {
    const docRef = doc(db, ACTIONS_COLLECTION, actionId);

    // Get current action to merge configurations
    const currentDoc = await getDoc(docRef);
    if (!currentDoc.exists()) {
      throw new Error('Action not found');
    }

    const currentData = currentDoc.data();
    const currentConfig = currentData.configuration as CustomButtonConfig;

    // Merge the configurations
    const updatedConfig: CustomButtonConfig = {
      general: { ...currentConfig.general, ...config.general },
      button: { ...currentConfig.button, ...config.button },
      channels: { ...currentConfig.channels, ...config.channels }
    };

    const updateData = {
      configuration: updatedConfig,
      updatedAt: serverTimestamp()
    };

    await updateDoc(docRef, updateData);

    // Return updated action
    return getAgentAction(actionId);
  } catch (error) {
    console.error('Error saving custom button config:', error);
    return {
      success: false,
      data: {} as AgentAction,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Get active custom button actions for an agent
export async function getActiveCustomButtonActions(
  agentId: string
): Promise<ApiResponse<AgentAction[]>> {
  try {
    const q = query(
      collection(db, ACTIONS_COLLECTION),
      where('agentId', '==', agentId),
      where('type', '==', 'custom-button'),
      where('status', '==', 'active')
    );

    const querySnapshot = await getDocs(q);
    const actions: AgentAction[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      actions.push({
        id: doc.id,
        agentId: data.agentId,
        workspaceId: data.workspaceId,
        type: data.type,
        name: data.name,
        description: data.description,
        status: data.status,
        configuration: data.configuration,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      });
    });

    return {
      success: true,
      data: actions
    };
  } catch (error) {
    console.error('Error fetching active custom button actions:', error);
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
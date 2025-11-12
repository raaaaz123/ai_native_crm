import {
  doc,
  getDoc,
  deleteDoc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

export interface ZendeskConnection {
  id: string;
  workspaceId: string;
  agentId: string;
  subdomain: string; // e.g., "yourcompany" from yourcompany.zendesk.com
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: number;
  accountName?: string;
  accountEmail?: string;
  // Integration settings
  zendeskAgentId?: string; // selected Zendesk agent ID
  zendeskAgentName?: string; // selected Zendesk agent name/email
  autoAssignEnabled?: boolean;
  baseInstructions?: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Get Zendesk connection for a workspace and agent
 */
export async function getZendeskConnection(
  workspaceId: string,
  agentId: string
): Promise<ZendeskConnection | null> {
  try {
    const connectionId = `${workspaceId}_${agentId}_zendesk`;
    const connectionRef = doc(db, 'zendeskConnections', connectionId);
    const connectionSnap = await getDoc(connectionRef);

    if (!connectionSnap.exists()) {
      return null;
    }

    const data = connectionSnap.data();
    return {
      id: connectionSnap.id,
      ...data,
      createdAt: data.createdAt?.toMillis() || Date.now(),
      updatedAt: data.updatedAt?.toMillis() || Date.now()
    } as ZendeskConnection;
  } catch (error) {
    console.error('Error getting Zendesk connection:', error);
    return null;
  }
}

/**
 * Disconnect Zendesk from workspace and agent
 */
export async function disconnectZendesk(
  workspaceId: string,
  agentId: string
): Promise<boolean> {
  try {
    const connectionId = `${workspaceId}_${agentId}_zendesk`;
    const connectionRef = doc(db, 'zendeskConnections', connectionId);
    await deleteDoc(connectionRef);
    return true;
  } catch (error) {
    console.error('Error disconnecting Zendesk:', error);
    return false;
  }
}

/**
 * Check if Zendesk is connected for a workspace and agent
 */
export async function checkZendeskConnectionStatus(
  workspaceId: string,
  agentId: string
): Promise<boolean> {
  try {
    const connection = await getZendeskConnection(workspaceId, agentId);
    return connection !== null;
  } catch (error) {
    console.error('Error checking Zendesk connection status:', error);
    return false;
  }
}

/**
 * Check if Zendesk integration is configured (has integration settings)
 */
export async function checkZendeskIntegrationStatus(
  workspaceId: string,
  agentId: string
): Promise<boolean> {
  try {
    const integration = await getZendeskIntegration(workspaceId, agentId);
    // Check if integration has required settings configured
    return integration !== null && 
           !!integration.zendeskAgentId && 
           !!integration.baseInstructions;
  } catch (error) {
    console.error('Error checking Zendesk integration status:', error);
    return false;
  }
}

/**
 * Save Zendesk connection to Firestore
 * This is typically called from the backend after OAuth callback
 */
export async function saveZendeskConnection(
  workspaceId: string,
  agentId: string,
  connectionData: {
    subdomain: string;
    accessToken: string;
    refreshToken?: string;
    tokenExpiresAt?: number;
    accountName?: string;
    accountEmail?: string;
  }
): Promise<boolean> {
  try {
    const connectionId = `${workspaceId}_${agentId}_zendesk`;
    const connectionRef = doc(db, 'zendeskConnections', connectionId);
    
    await setDoc(connectionRef, {
      workspaceId,
      agentId,
      ...connectionData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    return true;
  } catch (error) {
    console.error('Error saving Zendesk connection:', error);
    return false;
  }
}

/**
 * Get Zendesk integration settings (includes connection + integration config)
 */
export async function getZendeskIntegration(
  workspaceId: string,
  agentId: string
): Promise<ZendeskConnection | null> {
  try {
    return await getZendeskConnection(workspaceId, agentId);
  } catch (error) {
    console.error('Error getting Zendesk integration:', error);
    return null;
  }
}

/**
 * Save Zendesk integration settings
 */
export async function saveZendeskIntegration(
  workspaceId: string,
  agentId: string,
  integrationData: {
    zendeskAgentId: string;
    zendeskAgentName: string;
    autoAssignEnabled: boolean;
    baseInstructions: string;
  }
): Promise<boolean> {
  try {
    const connectionId = `${workspaceId}_${agentId}_zendesk`;
    const connectionRef = doc(db, 'zendeskConnections', connectionId);
    
    await setDoc(connectionRef, {
      workspaceId,
      agentId,
      ...integrationData,
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    return true;
  } catch (error) {
    console.error('Error saving Zendesk integration:', error);
    return false;
  }
}

/**
 * Update Zendesk integration settings
 */
export async function updateZendeskIntegration(
  workspaceId: string,
  agentId: string,
  updates: Partial<{
    zendeskAgentId: string;
    zendeskAgentName: string;
    autoAssignEnabled: boolean;
    baseInstructions: string;
  }>
): Promise<boolean> {
  try {
    const connectionId = `${workspaceId}_${agentId}_zendesk`;
    const connectionRef = doc(db, 'zendeskConnections', connectionId);
    
    await setDoc(connectionRef, {
      ...updates,
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    return true;
  } catch (error) {
    console.error('Error updating Zendesk integration:', error);
    return false;
  }
}


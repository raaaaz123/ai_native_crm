import {
  doc,
  getDoc,
  deleteDoc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

export interface WhatsAppConnection {
  id: string;
  workspaceId: string;
  agentId: string;
  accessToken: string;
  businessAccounts: Array<{
    id: string;
    name: string;
  }>;
  // Integration settings
  phoneNumberId?: string;
  phoneNumber?: string;
  businessAccountId?: string;
  autoReplyEnabled?: boolean;
  baseInstructions?: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Get WhatsApp connection for a workspace and agent
 */
export async function getWhatsAppConnection(
  workspaceId: string,
  agentId: string
): Promise<WhatsAppConnection | null> {
  try {
    const connectionId = `${workspaceId}_${agentId}_whatsapp`;
    const connectionRef = doc(db, 'whatsappConnections', connectionId);
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
    } as WhatsAppConnection;
  } catch (error) {
    console.error('Error getting WhatsApp connection:', error);
    return null;
  }
}

/**
 * Disconnect WhatsApp from workspace and agent
 */
export async function disconnectWhatsApp(
  workspaceId: string,
  agentId: string
): Promise<boolean> {
  try {
    const connectionId = `${workspaceId}_${agentId}_whatsapp`;
    const connectionRef = doc(db, 'whatsappConnections', connectionId);
    await deleteDoc(connectionRef);
    return true;
  } catch (error) {
    console.error('Error disconnecting WhatsApp:', error);
    return false;
  }
}

/**
 * Check if WhatsApp is connected for a workspace and agent
 */
export async function checkWhatsAppConnectionStatus(
  workspaceId: string,
  agentId: string
): Promise<boolean> {
  try {
    const connection = await getWhatsAppConnection(workspaceId, agentId);
    return connection !== null;
  } catch (error) {
    console.error('Error checking WhatsApp connection status:', error);
    return false;
  }
}

/**
 * Get WhatsApp integration settings (includes connection + integration config)
 */
export async function getWhatsAppIntegration(
  workspaceId: string,
  agentId: string
): Promise<WhatsAppConnection | null> {
  try {
    return await getWhatsAppConnection(workspaceId, agentId);
  } catch (error) {
    console.error('Error getting WhatsApp integration:', error);
    return null;
  }
}

/**
 * Save WhatsApp integration settings
 */
export async function saveWhatsAppIntegration(
  workspaceId: string,
  agentId: string,
  integrationData: {
    phoneNumberId: string;
    phoneNumber: string;
    businessAccountId: string;
    autoReplyEnabled: boolean;
    baseInstructions: string;
  }
): Promise<boolean> {
  try {
    const connectionId = `${workspaceId}_${agentId}_whatsapp`;
    const connectionRef = doc(db, 'whatsappConnections', connectionId);
    
    await setDoc(connectionRef, {
      workspaceId,
      agentId,
      ...integrationData,
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    return true;
  } catch (error) {
    console.error('Error saving WhatsApp integration:', error);
    return false;
  }
}

/**
 * Update WhatsApp integration settings
 */
export async function updateWhatsAppIntegration(
  workspaceId: string,
  agentId: string,
  updates: Partial<{
    phoneNumberId: string;
    phoneNumber: string;
    businessAccountId: string;
    autoReplyEnabled: boolean;
    baseInstructions: string;
  }>
): Promise<boolean> {
  try {
    const connectionId = `${workspaceId}_${agentId}_whatsapp`;
    const connectionRef = doc(db, 'whatsappConnections', connectionId);
    
    await setDoc(connectionRef, {
      ...updates,
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    return true;
  } catch (error) {
    console.error('Error updating WhatsApp integration:', error);
    return false;
  }
}

/**
 * Check if WhatsApp integration is configured (has integration settings)
 */
export async function checkWhatsAppIntegrationStatus(
  workspaceId: string,
  agentId: string
): Promise<boolean> {
  try {
    const integration = await getWhatsAppIntegration(workspaceId, agentId);
    // Check if integration has required settings configured
    return integration !== null && 
           !!integration.phoneNumberId && 
           !!integration.baseInstructions;
  } catch (error) {
    console.error('Error checking WhatsApp integration status:', error);
    return false;
  }
}


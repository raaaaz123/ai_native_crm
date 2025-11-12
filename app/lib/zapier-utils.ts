import {
  doc,
  getDoc,
  deleteDoc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

export interface ZapierIntegration {
  id: string;
  workspaceId: string;
  agentId: string;
  zapierAgentId: string; // selected Zapier agent ID
  zapierAgentName: string; // selected Zapier agent name/email
  autoAssignEnabled: boolean;
  baseInstructions: string;
  webhookUrl?: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Get Zapier integration for a workspace and agent
 */
export async function getZapierIntegration(
  workspaceId: string,
  agentId: string
): Promise<ZapierIntegration | null> {
  try {
    const integrationId = `${workspaceId}_${agentId}_zapier`;
    const integrationRef = doc(db, 'zapierIntegrations', integrationId);
    const integrationSnap = await getDoc(integrationRef);

    if (!integrationSnap.exists()) {
      return null;
    }

    const data = integrationSnap.data();
    return {
      id: integrationSnap.id,
      ...data,
      createdAt: data.createdAt?.toMillis() || Date.now(),
      updatedAt: data.updatedAt?.toMillis() || Date.now()
    } as ZapierIntegration;
  } catch (error) {
    console.error('Error getting Zapier integration:', error);
    return null;
  }
}

/**
 * Save Zapier integration to Firestore
 */
export async function saveZapierIntegration(
  workspaceId: string,
  agentId: string,
  integrationData: {
    zapierAgentId: string;
    zapierAgentName: string;
    autoAssignEnabled: boolean;
    baseInstructions: string;
    webhookUrl?: string;
  }
): Promise<boolean> {
  try {
    const integrationId = `${workspaceId}_${agentId}_zapier`;
    const integrationRef = doc(db, 'zapierIntegrations', integrationId);
    
    await setDoc(integrationRef, {
      workspaceId,
      agentId,
      ...integrationData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    return true;
  } catch (error) {
    console.error('Error saving Zapier integration:', error);
    return false;
  }
}

/**
 * Update Zapier integration
 */
export async function updateZapierIntegration(
  workspaceId: string,
  agentId: string,
  updates: Partial<{
    zapierAgentId: string;
    zapierAgentName: string;
    autoAssignEnabled: boolean;
    baseInstructions: string;
    webhookUrl: string;
  }>
): Promise<boolean> {
  try {
    const integrationId = `${workspaceId}_${agentId}_zapier`;
    const integrationRef = doc(db, 'zapierIntegrations', integrationId);
    
    await setDoc(integrationRef, {
      ...updates,
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    return true;
  } catch (error) {
    console.error('Error updating Zapier integration:', error);
    return false;
  }
}

/**
 * Delete Zapier integration
 */
export async function deleteZapierIntegration(
  workspaceId: string,
  agentId: string
): Promise<boolean> {
  try {
    const integrationId = `${workspaceId}_${agentId}_zapier`;
    const integrationRef = doc(db, 'zapierIntegrations', integrationId);
    await deleteDoc(integrationRef);
    return true;
  } catch (error) {
    console.error('Error deleting Zapier integration:', error);
    return false;
  }
}

/**
 * Check if Zapier is configured for a workspace and agent
 */
export async function checkZapierIntegrationStatus(
  workspaceId: string,
  agentId: string
): Promise<boolean> {
  try {
    const integration = await getZapierIntegration(workspaceId, agentId);
    return integration !== null;
  } catch (error) {
    console.error('Error checking Zapier integration status:', error);
    return false;
  }
}


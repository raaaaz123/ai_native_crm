import {
  doc,
  getDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from './firebase';

export interface NotionConnection {
  id: string;
  workspaceId: string;
  agentId?: string | null;
  accessToken: string;
  notionWorkspaceId: string;
  notionWorkspaceName: string;
  notionWorkspaceIcon?: string;
  botId: string;
  owner: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export interface NotionPage {
  id: string;
  title: string;
  url: string;
  created_time: string;
  last_edited_time: string;
}

/**
 * Get Notion connection for a workspace
 */
export async function getNotionConnection(workspaceId: string): Promise<NotionConnection | null> {
  try {
    const connectionRef = doc(db, 'notionConnections', `${workspaceId}_notion`);
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
    } as NotionConnection;
  } catch (error) {
    console.error('Error getting Notion connection:', error);
    return null;
  }
}

/**
 * Disconnect Notion from workspace
 */
export async function disconnectNotion(workspaceId: string): Promise<boolean> {
  try {
    const connectionRef = doc(db, 'notionConnections', `${workspaceId}_notion`);
    await deleteDoc(connectionRef);
    return true;
  } catch (error) {
    console.error('Error disconnecting Notion:', error);
    return false;
  }
}

/**
 * Search for pages in connected Notion workspace
 */
export async function searchNotionPages(
  accessToken: string,
  query: string = ''
): Promise<{ success: boolean; pages?: NotionPage[]; error?: string }> {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://git-branch-m-main.onrender.com';
    const response = await fetch(`${backendUrl}/api/notion/search-pages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: accessToken,
        query
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `Failed to search pages: ${errorText}`
      };
    }

    const result = await response.json();
    return {
      success: true,
      pages: result.pages || []
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Import a Notion page to agent knowledge base
 */
export async function importNotionPage(
  accessToken: string,
  pageId: string,
  agentId: string,
  workspaceId: string,
  title?: string,
  embeddingProvider: string = 'voyage',
  embeddingModel: string = 'voyage-3'
): Promise<{ success: boolean; message?: string; error?: string; data?: unknown }> {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://git-branch-m-main.onrender.com';
    const response = await fetch(`${backendUrl}/api/notion/import-page`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: accessToken,
        page_id: pageId,
        widget_id: agentId, // Using agent_id instead of widget_id for new system
        title,
        embedding_provider: embeddingProvider,
        embedding_model: embeddingModel,
        metadata: {
          workspace_id: workspaceId,
          agent_id: agentId
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `Failed to import page: ${errorText}`
      };
    }

    const result = await response.json();
    return {
      success: true,
      message: result.message,
      data: result
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Import all pages from a Notion database
 */
export async function importNotionDatabase(
  accessToken: string,
  databaseId: string,
  agentId: string,
  workspaceId: string,
  embeddingProvider: string = 'voyage',
  embeddingModel: string = 'voyage-3'
): Promise<{ success: boolean; message?: string; error?: string; data?: unknown }> {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://git-branch-m-main.onrender.com';
    const response = await fetch(`${backendUrl}/api/notion/import-database`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: accessToken,
        database_id: databaseId,
        widget_id: agentId, // Using agent_id instead of widget_id for new system
        embedding_provider: embeddingProvider,
        embedding_model: embeddingModel,
        metadata: {
          workspace_id: workspaceId,
          agent_id: agentId
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `Failed to import database: ${errorText}`
      };
    }

    const result = await response.json();
    return {
      success: true,
      message: result.message,
      data: result
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Initiate Notion OAuth flow
 */
export function initiateNotionOAuth(workspaceId: string, agentId?: string) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://git-branch-m-main.onrender.com';
  const params = new URLSearchParams({
    workspace_id: workspaceId
  });

  if (agentId) {
    params.append('agent_id', agentId);
  }

  window.location.href = `${backendUrl}/api/notion/oauth/authorize?${params.toString()}`;
}

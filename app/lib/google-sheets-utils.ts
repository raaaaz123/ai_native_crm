import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

export interface GoogleSheetsConnection {
  workspaceId: string;
  agentId: string | null;
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  createdAt: number | { toDate: () => Date } | { toMillis: () => number };
  updatedAt: number | { toDate: () => Date } | { toMillis: () => number };
}

export interface GoogleSpreadsheet {
  id: string;
  name: string;
  url: string;
  modifiedTime: string;
}

/**
 * Get stored Google Sheets connection for a workspace
 */
export async function getGoogleSheetsConnection(workspaceId: string): Promise<GoogleSheetsConnection | null> {
  try {
    const connectionId = `${workspaceId}_google_sheets`;
    const connectionRef = doc(db, 'googleSheetsConnections', connectionId);
    const connectionSnap = await getDoc(connectionRef);

    if (connectionSnap.exists()) {
      return connectionSnap.data() as GoogleSheetsConnection;
    }

    return null;
  } catch (error) {
    console.error('Error fetching Google Sheets connection:', error);
    return null;
  }
}

/**
 * List Google Sheets spreadsheets
 */
export async function listGoogleSheets(
  accessToken: string,
  searchQuery?: string
): Promise<{ success: boolean; spreadsheets?: GoogleSpreadsheet[]; total?: number; error?: string }> {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://git-branch-m-main.onrender.com';

    const response = await fetch(`${backendUrl}/api/google-sheets/list-spreadsheets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_token: accessToken,
        query: searchQuery || ''
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: errorText || 'Failed to list spreadsheets'
      };
    }

    const result = await response.json();
    return {
      success: true,
      spreadsheets: result.spreadsheets,
      total: result.total
    };
  } catch (error) {
    console.error('Error listing Google Sheets:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Import a Google Sheet to the knowledge base
 */
export async function importGoogleSheet(
  accessToken: string,
  spreadsheetId: string,
  agentId: string,
  workspaceId: string,
  title: string,
  sheetName?: string,
  embeddingProvider: string = 'voyage',
  embeddingModel: string = 'voyage-3'
): Promise<{
  success: boolean;
  data?: {
    id: string;
    title: string;
    chunks_created: number;
    rows_count: number;
    url: string;
  };
  error?: string
}> {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://git-branch-m-main.onrender.com';

    const response = await fetch(`${backendUrl}/api/google-sheets/import-sheet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_token: accessToken,
        spreadsheet_id: spreadsheetId,
        sheet_name: sheetName,
        agent_id: agentId,
        title: title,
        embedding_provider: embeddingProvider,
        embedding_model: embeddingModel,
        metadata: {
          workspace_id: workspaceId
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: errorText || 'Failed to import sheet'
      };
    }

    const result = await response.json();
    return {
      success: true,
      data: {
        id: result.id,
        title: result.title,
        chunks_created: result.chunks_created,
        rows_count: result.rows_count,
        url: result.url
      }
    };
  } catch (error) {
    console.error('Error importing Google Sheet:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Initiate Google OAuth flow
 */
export function initiateGoogleOAuth(workspaceId: string, agentId?: string) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://git-branch-m-main.onrender.com';
  const agentParam = agentId ? `&agent_id=${agentId}` : '';
  window.location.href = `${backendUrl}/api/google-sheets/oauth/authorize?workspace_id=${workspaceId}${agentParam}`;
}

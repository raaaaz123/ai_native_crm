'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import {
  getGoogleSheetsConnection,
  listGoogleSheets,
  refreshGoogleSheetsToken,
  type GoogleSheetsConnection,
  type GoogleSpreadsheet
} from '@/app/lib/google-sheets-utils';
import {
  createAgentKnowledgeItem,
  getAgentKnowledgeItems,
  type AgentKnowledgeItem
} from '@/app/lib/agent-knowledge-utils';
import { doc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import { Sheet, Search, Check, Loader2, ExternalLink, CheckCircle2, Database, Trash2, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { deleteAgentKnowledgeItem } from '@/app/lib/agent-knowledge-utils';
import { useAuth } from '@/app/lib/workspace-auth-context';

interface ImportedSheet {
  id: string;
  googleSheetId: string;
  title: string;
  sheetName?: string;
  rowsCount: number;
  chunksCreated: number;
  createdAt: number;
}

export default function GoogleSheetsSourcePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { workspaceContext } = useAuth();
  const workspaceSlug = params.workspace as string;
  const agentId = params.agentId as string;

  // Get actual workspace ID from context (not the URL slug)
  const workspaceId = workspaceContext?.currentWorkspace?.id || '';

  const [connection, setConnection] = useState<GoogleSheetsConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  // Google Sheets
  const [spreadsheets, setSpreadsheets] = useState<GoogleSpreadsheet[]>([]);
  const [filteredSheets, setFilteredSheets] = useState<GoogleSpreadsheet[]>([]);
  const [loadingSheets, setLoadingSheets] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Imported sheets tracking
  const [importedSheets, setImportedSheets] = useState<Map<string, ImportedSheet>>(new Map());
  const [loadingImported, setLoadingImported] = useState(false);

  // Selection and import
  const [selectedSheets, setSelectedSheets] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  // Deletion
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);

  // Check for OAuth success/error in URL params
  const googleSheetsData = searchParams.get('google_sheets_data');
  const googleSheetsError = searchParams.get('google_sheets_error');

  useEffect(() => {
    // Wait for workspace context to load
    if (!workspaceId) return;

    checkConnection();
    loadImportedSheets();
  }, [workspaceId, agentId]);

  useEffect(() => {
    if (connection) {
      loadSpreadsheets(connection.accessToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connection]);

  // Handle OAuth callback with connection data
  useEffect(() => {
    if (googleSheetsData && workspaceId) {
      handleGoogleSheetsCallback(googleSheetsData);
    }
  }, [googleSheetsData, workspaceId]);

  // Handle errors
  useEffect(() => {
    if (googleSheetsError) {
      const errorMessages: Record<string, string> = {
        'access_denied': 'You denied access to Google Sheets. Please try again if you want to connect.',
        'missing_code': 'Authorization failed. Please try again.',
        'token_exchange_failed': 'Failed to exchange authorization code. Please try again.',
        'invalid_token': 'Received invalid token from Google. Please try again.',
        'unknown': 'An unknown error occurred. Please try again.'
      };
      alert(errorMessages[googleSheetsError] || 'An error occurred during Google Sheets connection.');
      router.replace(`/dashboard/${workspaceSlug}/agents/${agentId}/sources/google-sheets`);
    }
  }, [googleSheetsError]);

  const handleGoogleSheetsCallback = async (encodedData: string) => {
    if (!workspaceId) {
      console.error('Workspace ID not available when saving connection');
      alert('Workspace not loaded. Please refresh the page and try again.');
      router.replace(`/dashboard/${workspaceSlug}/agents/${agentId}/sources/google-sheets`);
      return;
    }

    try {
      // Decode the connection data
      const decodedData = JSON.parse(atob(encodedData));

      // Save to Firestore (client-side where user is authenticated)
      const connectionId = `${workspaceId}_google_sheets`;
      await setDoc(doc(db, 'googleSheetsConnections', connectionId), {
        ...decodedData,
        workspaceId: workspaceId, // Required for Firestore rules validation
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Clean URL and reload connection
      router.replace(`/dashboard/${workspaceSlug}/agents/${agentId}/sources/google-sheets`);
      await checkConnection();
    } catch (error: unknown) {
      const firestoreError = error as { code?: string };
      console.error('Error saving Google Sheets connection:', error);
      const errorMessage = firestoreError?.code === 'permission-denied' 
        ? 'Permission denied. Please ensure you are a member of this workspace.'
        : 'Failed to save connection data. Please try again.';
      alert(errorMessage);
      router.replace(`/dashboard/${workspaceSlug}/agents/${agentId}/sources/google-sheets`);
    }
  };

  const checkConnection = async () => {
    if (!workspaceId) {
      console.log('Waiting for workspace ID to load...');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      console.log('Checking Google Sheets connection for workspace:', workspaceId);
      const conn = await getGoogleSheetsConnection(workspaceId);
      console.log('Connection result:', conn ? 'Found' : 'Not found');
      setConnection(conn);
    } catch (error) {
      console.error('Error checking Google Sheets connection:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadImportedSheets = async () => {
    setLoadingImported(true);
    try {
      const result = await getAgentKnowledgeItems(agentId);

      if (result.success) {
        const imported = new Map<string, ImportedSheet>();

        // Filter Google Sheets type items and map them
        result.data
          .filter(item => item.type === 'google_sheets' && item.googleSheetId)
          .forEach(item => {
            imported.set(item.googleSheetId!, {
              id: item.id,
              googleSheetId: item.googleSheetId!,
              title: item.title,
              sheetName: item.sheetName,
              rowsCount: item.rowsCount || 0,
              chunksCreated: item.chunksCreated || 0,
              createdAt: item.createdAt
            });
          });

        setImportedSheets(imported);
      }
    } catch (error) {
      console.error('Error loading imported sheets:', error);
    } finally {
      setLoadingImported(false);
    }
  };

  const loadSpreadsheets = useCallback(async (accessToken: string) => {
    setLoadingSheets(true);
    try {
      const result = await listGoogleSheets(accessToken);
      if (result.success && result.spreadsheets) {
        setSpreadsheets(result.spreadsheets);
        setFilteredSheets(result.spreadsheets);
      } else {
        // Check if error is due to expired token (authentication error)
        const errorMsg = result.error || '';
        if (errorMsg.includes('authentication') || errorMsg.includes('credentials') || errorMsg.includes('OAuth') || errorMsg.includes('Invalid Credentials')) {
          console.log('🔄 Token expired, attempting to refresh...');

          // Try to refresh token if we have a refresh token
          if (connection?.refreshToken) {
            const refreshResult = await refreshGoogleSheetsToken(connection.refreshToken);

            if (refreshResult.success && refreshResult.accessToken) {
              console.log('✅ Token refreshed successfully');

              // Update connection in Firestore with new access token
              const connectionId = `${workspaceId}_google_sheets`;
              await setDoc(doc(db, 'googleSheetsConnections', connectionId), {
                ...connection,
                accessToken: refreshResult.accessToken,
                updatedAt: serverTimestamp()
              }, { merge: true });

              // Update local state
              setConnection({ ...connection, accessToken: refreshResult.accessToken });

              // Retry loading sheets with new token
              const retryResult = await listGoogleSheets(refreshResult.accessToken);
              if (retryResult.success && retryResult.spreadsheets) {
                setSpreadsheets(retryResult.spreadsheets);
                setFilteredSheets(retryResult.spreadsheets);
              } else {
                alert('Failed to load Google Sheets after token refresh: ' + (retryResult.error || 'Unknown error'));
              }
            } else {
              console.error('❌ Failed to refresh token:', refreshResult.error);
              alert('Your Google Sheets connection expired. Please reconnect.\n\nError: ' + (refreshResult.error || 'Failed to refresh token'));
              setConnection(null); // Clear connection to show reconnect button
            }
          } else {
            console.error('❌ No refresh token available');
            alert('Your Google Sheets connection expired and no refresh token is available. Please reconnect.');
            setConnection(null); // Clear connection to show reconnect button
          }
        } else {
          alert('Failed to load Google Sheets: ' + errorMsg);
        }
      }
    } catch (error) {
      console.error('Error loading Google Sheets:', error);
      alert('An error occurred while loading Google Sheets');
    } finally {
      setLoadingSheets(false);
    }
  }, [connection, workspaceId]);

  const handleConnectGoogle = () => {
    if (!workspaceId) {
      alert('Workspace not loaded. Please refresh the page.');
      return;
    }
    setConnecting(true);
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://git-branch-m-main.onrender.com';
    console.log('Connecting to Google Sheets with workspace ID:', workspaceId);
    window.location.href = `${backendUrl}/api/google-sheets/oauth/authorize?workspace_id=${workspaceId}&agent_id=${agentId}`;
  };

  const executeDisconnectGoogle = async () => {
    if (!workspaceId) {
      toast.error('Workspace not loaded. Please refresh the page.');
      setShowDisconnectDialog(false);
      return;
    }
    try {
      await deleteDoc(doc(db, 'googleSheetsConnections', `${workspaceId}_google_sheets`));
      setConnection(null);
      setSpreadsheets([]);
      setFilteredSheets([]);
      setSelectedSheets(new Set());
      toast.success('Disconnected Google Sheets. You can now connect a new account.');
      router.replace(`/dashboard/${workspaceSlug}/agents/${agentId}/sources/google-sheets`);
    } catch (error) {
      console.error('Error disconnecting Google Sheets:', error);
      toast.error('Failed to disconnect Google Sheets. Please try again.');
    } finally {
      setShowDisconnectDialog(false);
    }
  };

  const toggleSheetSelection = (sheetId: string) => {
    // Don't allow selecting already imported sheets
    if (importedSheets.has(sheetId)) return;

    const newSelected = new Set(selectedSheets);
    if (newSelected.has(sheetId)) {
      newSelected.delete(sheetId);
    } else {
      newSelected.add(sheetId);
    }
    setSelectedSheets(newSelected);
  };

  const handleTrainRAG = async () => {
    if (selectedSheets.size === 0) {
      alert('Please select at least one spreadsheet to train');
      return;
    }

    if (!connection) return;

    const confirmMessage = `This will import ${selectedSheets.size} spreadsheet(s) and add them to your agent's knowledge base (RAG). Continue?`;
    if (!confirm(confirmMessage)) return;

    setImporting(true);
    setImportedCount(0);

    try {
      let successCount = 0;
      const totalSheets = selectedSheets.size;

      for (const sheetId of Array.from(selectedSheets)) {
        const sheet = spreadsheets.find(s => s.id === sheetId);
        if (!sheet) continue;

        try {
          // Import sheet using createAgentKnowledgeItem (handles both Qdrant and Firestore)
          const result = await createAgentKnowledgeItem(
            agentId,
            workspaceId,
            {
              title: sheet.name,
              content: `Google Sheet: ${sheet.name}`,
              type: 'google_sheets',
              googleSheetsAccessToken: connection.accessToken,
              googleSheetId: sheetId,
              embeddingProvider: 'voyage',
              embeddingModel: 'voyage-3'
            }
          );

          if (result.success) {
            // Add to imported sheets map
            importedSheets.set(sheetId, {
              id: result.data.id,
              googleSheetId: sheetId,
              title: sheet.name,
              sheetName: result.data.sheetName,
              rowsCount: result.data.rowsCount || 0,
              chunksCreated: result.data.chunksCreated || 0,
              createdAt: result.data.createdAt || Date.now()
            });

            successCount++;
            setImportedCount(successCount);
          } else {
            console.error(`Failed to import sheet ${sheet.name}:`, result.error);
          }
        } catch (error) {
          console.error(`Failed to import sheet ${sheet.name}:`, error);
        }
      }

      alert(`✅ Successfully trained RAG with ${successCount} of ${totalSheets} spreadsheet(s)!\n\nAdded ${successCount} sheets to your agent's knowledge base.`);
      setSelectedSheets(new Set());
      setImportedSheets(new Map(importedSheets)); // Trigger re-render

    } catch (error) {
      console.error('Error during RAG training:', error);
      alert('An error occurred during RAG training');
    } finally {
      setImporting(false);
    }
  };

  const handleDeleteSheet = async (itemId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}" from your knowledge base? This will remove all vector embeddings from both Qdrant and Firestore.`)) {
      return;
    }

    setDeletingItemId(itemId);
    try {
      const result = await deleteAgentKnowledgeItem(itemId);

      if (result.success) {
        // Remove from importedSheets map
        const googleSheetId = Array.from(importedSheets.entries()).find(([_, v]) => v.id === itemId)?.[0];
        if (googleSheetId) {
          const newImportedSheets = new Map(importedSheets);
          newImportedSheets.delete(googleSheetId);
          setImportedSheets(newImportedSheets);
        }
        // Reload to refresh the list
        await loadImportedSheets();
        alert(`✅ Successfully deleted "${title}" from knowledge base`);
      } else {
        alert(`❌ Failed to delete: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting Google Sheet:', error);
      alert('An error occurred while deleting the sheet');
    } finally {
      setDeletingItemId(null);
    }
  };

  // Filter sheets based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSheets(spreadsheets);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = spreadsheets.filter(sheet =>
        sheet.name.toLowerCase().includes(query)
      );
      setFilteredSheets(filtered);
    }
  }, [searchQuery, spreadsheets]);

  if (loading || !workspaceId) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex max-w-7xl mx-auto">
          <div className="flex-1 p-8">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If connected, show sheets list
  if (connection) {
    const notImportedSheets = filteredSheets.filter(s => !importedSheets.has(s.id));
    const alreadyImportedSheets = filteredSheets.filter(s => importedSheets.has(s.id));
    
    // Also show imported sheets that might not be in the current Google Sheets list
    // (e.g., if they were deleted from Google Drive but still exist in knowledge base)
    const importedSheetIds = new Set(importedSheets.keys());
    const currentSheetIds = new Set(filteredSheets.map(s => s.id));
    const orphanedImportedSheets = Array.from(importedSheetIds).filter(id => !currentSheetIds.has(id));

    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Google Sheets Sources</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Connected to Google Account
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => connection && loadSpreadsheets(connection.accessToken)}
                  disabled={loadingSheets}
                  className="rounded-lg border-border"
                >
                  {loadingSheets ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh Sheets
                    </>
                  )}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDisconnectDialog(true)}
                  className="rounded-lg"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Disconnect
                </Button>
                <Badge variant="default" className="bg-success text-success-foreground">Connected</Badge>
              </div>
            </div>
          </div>

          {/* Disconnect Confirmation Dialog */}
          <Dialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Disconnect Google Sheets</DialogTitle>
                <DialogDescription>
                  This will disconnect the current Google account from this workspace.
                  Imported knowledge stays intact. You can connect a different account afterward.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDisconnectDialog(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={executeDisconnectGoogle}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Disconnect
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="Search spreadsheets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-lg border-border"
              />
            </div>
          </div>

          {/* Action Buttons */}
          {selectedSheets.size > 0 && (
            <div className="mb-4 flex items-center justify-between bg-primary/10 border border-primary/20 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  {selectedSheets.size} spreadsheet{selectedSheets.size !== 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedSheets(new Set())}
                  disabled={importing}
                  className="rounded-lg border-border"
                >
                  Clear Selection
                </Button>
                <Button
                  size="sm"
                  onClick={handleTrainRAG}
                  disabled={importing}
                  className="bg-primary hover:bg-primary/90 rounded-lg"
                >
                  {importing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Training RAG ({importedCount}/{selectedSheets.size})
                    </>
                  ) : (
                    <>
                      <Database className="w-4 h-4 mr-2" />
                      Train RAG with Selected
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Sheets List */}
          {loadingSheets ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="animate-spin h-8 w-8 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Loading your Google Sheets...</p>
              </div>
            </div>
          ) : filteredSheets.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Sheet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {searchQuery ? 'No spreadsheets found' : 'No spreadsheets available'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery
                    ? 'Try a different search term'
                    : 'Make sure you have Google Sheets in your Google Drive'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Available to Import Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  Available to Import ({notImportedSheets.length})
                </h3>
                {notImportedSheets.length > 0 ? (
                  <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
                    {notImportedSheets.map((sheet) => {
                      const isSelected = selectedSheets.has(sheet.id);
                      return (
                        <Card
                          key={sheet.id}
                          className={`cursor-pointer transition-all hover:shadow-md border ${
                            isSelected ? 'border-primary bg-primary/5' : 'border-border'
                          }`}
                          onClick={() => toggleSheetSelection(sheet.id)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                isSelected
                                  ? 'border-primary bg-primary'
                                  : 'border-border'
                              }`}>
                                {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium text-foreground text-sm truncate">{sheet.name}</h3>
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  Modified: {new Date(sheet.modifiedTime).toLocaleDateString()}
                                </div>
                              </div>
                              <a
                                href={sheet.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-muted-foreground hover:text-foreground flex-shrink-0"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Sheet className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                      <p className="text-sm text-muted-foreground">No spreadsheets available to import</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Already in Knowledge Base Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  In Knowledge Base ({alreadyImportedSheets.length + orphanedImportedSheets.length})
                </h3>
                {(alreadyImportedSheets.length > 0 || orphanedImportedSheets.length > 0) ? (
                  <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
                    {/* Already imported sheets */}
                    {alreadyImportedSheets.map((sheet) => {
                      const imported = importedSheets.get(sheet.id);
                      const isDeleting = deletingItemId === imported?.id;
                      return (
                        <Card
                          key={sheet.id}
                          className="border border-success/20 bg-success/5"
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center gap-3">
                              <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium text-foreground text-sm truncate">{sheet.name}</h3>
                                  <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/20">
                                    In RAG
                                  </Badge>
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  {imported?.chunksCreated || 0} chunks • {imported?.rowsCount || 0} rows • Added {imported?.createdAt ? new Date(imported.createdAt).toLocaleDateString() : 'N/A'}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <a
                                  href={sheet.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-muted-foreground hover:text-foreground"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => imported && handleDeleteSheet(imported.id, sheet.name)}
                                  disabled={isDeleting}
                                  className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive rounded-lg"
                                >
                                  {isDeleting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}

                    {/* Orphaned imported sheets (not in Google Drive anymore) */}
                    {orphanedImportedSheets.map((sheetId) => {
                      const imported = importedSheets.get(sheetId);
                      if (!imported) return null;
                      const isDeleting = deletingItemId === imported.id;
                      return (
                        <Card
                          key={sheetId}
                          className="border border-warning/20 bg-warning/5"
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center gap-3">
                              <CheckCircle2 className="w-4 h-4 text-warning flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium text-foreground text-sm truncate">{imported.title}</h3>
                                  <Badge variant="outline" className="text-xs bg-warning/10 text-warning border-warning/20">
                                    In RAG
                                  </Badge>
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  {imported.chunksCreated || 0} chunks • {imported.rowsCount || 0} rows • Added {imported.createdAt ? new Date(imported.createdAt).toLocaleDateString() : 'N/A'}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteSheet(imported.id, imported.title)}
                                  disabled={isDeleting}
                                  className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive rounded-lg"
                                >
                                  {isDeleting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <CheckCircle2 className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                      <p className="text-sm text-muted-foreground">No spreadsheets in knowledge base yet</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Not connected - show connect option
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold text-foreground">Google Sheets Sources</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Connect your Google account to import spreadsheets into your AI agent&apos;s knowledge base.
          </p>
        </div>

        <Card className="border border-border hover:border-primary/20 transition-colors duration-200">
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <Sheet className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-foreground">Connect Google Sheets</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Import your Google Sheets to enhance your AI agent&apos;s knowledge base with spreadsheet data.
                </p>
              </div>

              <Button
                onClick={handleConnectGoogle}
                disabled={connecting}
                className="bg-primary hover:bg-primary/90 px-8 py-2 rounded-lg"
              >
                {connecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Sheet className="w-4 h-4 mr-2" />
                    Connect with Google
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground">
                You&apos;ll be redirected to Google to authorize access
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

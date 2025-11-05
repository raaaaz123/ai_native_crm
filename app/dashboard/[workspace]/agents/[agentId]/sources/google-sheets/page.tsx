'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import {
  getGoogleSheetsConnection,
  listGoogleSheets,
  type GoogleSheetsConnection,
  type GoogleSpreadsheet
} from '@/app/lib/google-sheets-utils';
import {
  createAgentKnowledgeItem,
  getAgentKnowledgeItems,
  type AgentKnowledgeItem
} from '@/app/lib/agent-knowledge-utils';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import { Sheet, Search, Check, Loader2, ExternalLink, CheckCircle2, Database } from 'lucide-react';

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
  const workspaceId = params.workspace as string;
  const agentId = params.agentId as string;

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

  // Check for OAuth success/error in URL params
  const googleSheetsData = searchParams.get('google_sheets_data');
  const googleSheetsError = searchParams.get('google_sheets_error');

  useEffect(() => {
    checkConnection();
    loadImportedSheets();
  }, [workspaceId, agentId]);

  // Handle OAuth callback with connection data
  useEffect(() => {
    if (googleSheetsData) {
      handleGoogleSheetsCallback(googleSheetsData);
    }
  }, [googleSheetsData]);

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
      router.replace(`/dashboard/${workspaceId}/agents/${agentId}/sources/google-sheets`);
    }
  }, [googleSheetsError]);

  const handleGoogleSheetsCallback = async (encodedData: string) => {
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
      router.replace(`/dashboard/${workspaceId}/agents/${agentId}/sources/google-sheets`);
      await checkConnection();
    } catch (error) {
      console.error('Error saving Google Sheets connection:', error);
      alert('Failed to save connection data');
    }
  };

  const checkConnection = async () => {
    setLoading(true);
    try {
      const conn = await getGoogleSheetsConnection(workspaceId);
      setConnection(conn);

      if (conn) {
        await loadSpreadsheets(conn.accessToken);
      }
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

  const loadSpreadsheets = async (accessToken: string) => {
    setLoadingSheets(true);
    try {
      const result = await listGoogleSheets(accessToken);
      if (result.success && result.spreadsheets) {
        setSpreadsheets(result.spreadsheets);
        setFilteredSheets(result.spreadsheets);
      } else {
        alert('Failed to load Google Sheets: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error loading Google Sheets:', error);
      alert('An error occurred while loading Google Sheets');
    } finally {
      setLoadingSheets(false);
    }
  };

  const handleConnectGoogle = () => {
    setConnecting(true);
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://git-branch-m-main.onrender.com';
    window.location.href = `${backendUrl}/api/google-sheets/oauth/authorize?workspace_id=${workspaceId}&agent_id=${agentId}`;
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

  if (loading) {
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

    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Sheet className="w-5 h-5 text-green-600" />
              </div>
              <h1 className="text-2xl font-semibold text-foreground">Google Sheets</h1>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>Connected</span>
            </div>
          </div>

          {/* Stats - Minimal */}
          <div className="flex items-center justify-center gap-8 mb-8 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground mb-1">{spreadsheets.length}</div>
              <div className="text-muted-foreground">Total</div>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">{importedSheets.size}</div>
              <div className="text-muted-foreground">Imported</div>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">{selectedSheets.size}</div>
              <div className="text-muted-foreground">Selected</div>
            </div>
          </div>

          {/* Search - Centered */}
          <div className="max-w-md mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="Search spreadsheets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Train RAG Button */}
          {selectedSheets.size > 0 && (
            <div className="mb-6 max-w-md mx-auto">
              <Button
                onClick={handleTrainRAG}
                disabled={importing}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Training ({importedCount}/{selectedSheets.size})
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-2" />
                    Train RAG with {selectedSheets.size} sheet{selectedSheets.size !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          )}

          {loadingSheets ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredSheets.length === 0 ? (
            <div className="text-center py-12">
              <Sheet className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-sm text-muted-foreground">No spreadsheets found</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Available to Import Section */}
              {notImportedSheets.length > 0 && (
                <div>
                  <h2 className="text-sm font-medium text-muted-foreground text-center mb-4">
                    Available to Import ({notImportedSheets.length})
                  </h2>
                  <div className="space-y-2">
                    {notImportedSheets.map((sheet) => (
                      <Card
                        key={sheet.id}
                        className={`cursor-pointer transition-all hover:border-primary/50 ${
                          selectedSheets.has(sheet.id) ? 'border-primary bg-primary/5' : ''
                        }`}
                        onClick={() => toggleSheetSelection(sheet.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            {/* Checkbox */}
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                              selectedSheets.has(sheet.id)
                                ? 'bg-primary border-primary'
                                : 'border-muted-foreground/30'
                            }`}>
                              {selectedSheets.has(sheet.id) && (
                                <Check className="w-3 h-3 text-primary-foreground" />
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 flex items-center justify-between">
                              <div className="min-w-0 flex-1">
                                <h3 className="font-medium text-foreground truncate">{sheet.name}</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Modified {new Date(sheet.modifiedTime).toLocaleDateString()}
                                </p>
                              </div>
                              <a
                                href={sheet.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-muted-foreground hover:text-foreground ml-2"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Already in Knowledge Base Section */}
              {alreadyImportedSheets.length > 0 && (
                <div>
                  <h2 className="text-sm font-medium text-muted-foreground text-center mb-4">
                    In Knowledge Base ({alreadyImportedSheets.length})
                  </h2>
                  <div className="space-y-2">
                    {alreadyImportedSheets.map((sheet) => {
                      const imported = importedSheets.get(sheet.id);
                      return (
                        <Card key={sheet.id} className="bg-green-50/50 border-green-200">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                              <div className="flex-1 min-w-0 flex items-center justify-between">
                                <div className="min-w-0 flex-1">
                                  <h3 className="font-medium text-foreground truncate">{sheet.name}</h3>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {imported?.chunksCreated || 0} chunks • {imported?.rowsCount || 0} rows
                                  </p>
                                </div>
                                <a
                                  href={sheet.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-muted-foreground hover:text-foreground ml-2"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Not connected - show connect button
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Sheet className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">Google Sheets</h2>
              <p className="text-sm text-muted-foreground mb-8">
                Import spreadsheet data into your agent&apos;s knowledge base
              </p>

              <Button
                onClick={handleConnectGoogle}
                disabled={connecting}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mb-6"
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

              <div className="space-y-3 text-left border-t pt-6">
                <div className="flex items-start gap-3 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Import spreadsheet data</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">AI-powered Q&A on your data</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Automatic content formatting</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

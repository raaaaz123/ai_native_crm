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
        <div className="flex max-w-7xl mx-auto">
          <div className="flex-1 p-8 pr-4">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-semibold text-foreground">Google Sheets Sources</h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Connected to Google Account
                  </p>
                </div>
                <Badge variant="default" className="bg-green-500">Connected</Badge>
              </div>
            </div>

            {/* Search */}
            <div className="mb-6">
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

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-foreground">{spreadsheets.length}</div>
                  <div className="text-sm text-muted-foreground">Total Sheets</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-600">{importedSheets.size}</div>
                  <div className="text-sm text-muted-foreground">In Knowledge Base</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-blue-600">{notImportedSheets.length}</div>
                  <div className="text-sm text-muted-foreground">Available to Import</div>
                </CardContent>
              </Card>
            </div>

            {/* Train RAG Button */}
            {selectedSheets.size > 0 && (
              <div className="mb-6">
                <Button
                  onClick={handleTrainRAG}
                  disabled={importing}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                >
                  {importing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Training RAG ({importedCount}/{selectedSheets.size})
                    </>
                  ) : (
                    <>
                      <Database className="w-5 h-5 mr-2" />
                      Train RAG with Selected ({selectedSheets.size})
                    </>
                  )}
                </Button>
              </div>
            )}

            {loadingSheets ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Available to Import Section */}
                {notImportedSheets.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-foreground mb-3">
                      Available to Import ({notImportedSheets.length})
                    </h2>
                    <div className="grid gap-3">
                      {notImportedSheets.map((sheet) => (
                        <Card
                          key={sheet.id}
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            selectedSheets.has(sheet.id) ? 'border-blue-500 border-2 bg-blue-50' : ''
                          }`}
                          onClick={() => toggleSheetSelection(sheet.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              {/* Checkbox */}
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 ${
                                selectedSheets.has(sheet.id)
                                  ? 'bg-blue-600 border-blue-600'
                                  : 'border-gray-300'
                              }`}>
                                {selectedSheets.has(sheet.id) && (
                                  <Check className="w-3 h-3 text-white" />
                                )}
                              </div>

                              {/* Icon */}
                              <div className="w-10 h-10 bg-green-100 rounded flex items-center justify-center flex-shrink-0">
                                <Sheet className="w-5 h-5 text-green-600" />
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <h3 className="font-medium text-foreground truncate">{sheet.name}</h3>
                                  <a
                                    href={sheet.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-muted-foreground hover:text-foreground"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Modified: {new Date(sheet.modifiedTime).toLocaleDateString()}
                                </p>
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
                    <h2 className="text-lg font-semibold text-foreground mb-3">
                      Already in Knowledge Base ({alreadyImportedSheets.length})
                    </h2>
                    <div className="grid gap-3">
                      {alreadyImportedSheets.map((sheet) => {
                        const imported = importedSheets.get(sheet.id);
                        return (
                          <Card key={sheet.id} className="bg-green-50 border-green-200">
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                {/* Checkmark */}
                                <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <Check className="w-3 h-3 text-white" />
                                </div>

                                {/* Icon */}
                                <div className="w-10 h-10 bg-green-100 rounded flex items-center justify-center flex-shrink-0">
                                  <Sheet className="w-5 h-5 text-green-600" />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <h3 className="font-medium text-foreground truncate">{sheet.name}</h3>
                                      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                                        In RAG
                                      </Badge>
                                    </div>
                                    <a
                                      href={sheet.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-muted-foreground hover:text-foreground"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </a>
                                  </div>
                                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                    <span>{imported?.chunksCreated || 0} chunks created</span>
                                    <span>•</span>
                                    <span>{imported?.rowsCount || 0} rows</span>
                                    <span>•</span>
                                    <span>Added: {imported?.createdAt ? new Date(imported.createdAt).toLocaleDateString() : 'N/A'}</span>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                {filteredSheets.length === 0 && (
                  <div className="text-center py-12">
                    <Sheet className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">No spreadsheets found</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Not connected - show connect button
  return (
    <div className="min-h-screen bg-background">
      <div className="flex max-w-7xl mx-auto">
        <div className="flex-1 p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-foreground mb-2">Google Sheets Sources</h1>
            <p className="text-muted-foreground">
              Connect your Google account to import spreadsheets into your agent&apos;s knowledge base
            </p>
          </div>

          <Card className="max-w-2xl">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sheet className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">Connect Google Sheets</h2>
                <p className="text-muted-foreground mb-6">
                  Import data from your Google Sheets to enhance your AI agent&apos;s knowledge
                </p>

                <Button
                  onClick={handleConnectGoogle}
                  disabled={connecting}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                >
                  {connecting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Sheet className="w-5 h-5 mr-2" />
                      Connect with Google
                    </>
                  )}
                </Button>

                <div className="mt-8 text-left space-y-2">
                  <h3 className="font-medium text-foreground mb-3">What you can do:</h3>
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Import spreadsheet data into your knowledge base</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Enable AI to answer questions using your sheet data</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Automatically format data as searchable content</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

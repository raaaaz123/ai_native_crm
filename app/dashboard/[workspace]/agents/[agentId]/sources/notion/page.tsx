'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import {
  getNotionConnection,
  searchNotionPages,
  type NotionConnection,
  type NotionPage
} from '@/app/lib/notion-utils';
import {
  createAgentKnowledgeItem,
  getAgentKnowledgeItems,
  type AgentKnowledgeItem
} from '@/app/lib/agent-knowledge-utils';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import { FileText, Plus, Info, Search, Check, Loader2, ExternalLink, CheckCircle2, Database } from 'lucide-react';

interface ImportedPage {
  id: string;
  notionPageId: string;
  title: string;
  chunksCreated: number;
  createdAt: number; // timestamp in milliseconds
}

export default function NotionSourcePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceId = params.workspace as string;
  const agentId = params.agentId as string;

  const [connection, setConnection] = useState<NotionConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  // Notion pages
  const [notionPages, setNotionPages] = useState<NotionPage[]>([]);
  const [filteredPages, setFilteredPages] = useState<NotionPage[]>([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Imported pages tracking
  const [importedPages, setImportedPages] = useState<Map<string, ImportedPage>>(new Map());
  const [loadingImported, setLoadingImported] = useState(false);

  // Selection and import
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  // Check for OAuth success/error in URL params
  const notionData = searchParams.get('notion_data');
  const notionError = searchParams.get('notion_error');

  useEffect(() => {
    checkConnection();
    loadImportedPages();
  }, [workspaceId, agentId]);

  // Handle OAuth callback with connection data
  useEffect(() => {
    if (notionData) {
      handleNotionCallback(notionData);
    }
  }, [notionData]);

  // Handle errors
  useEffect(() => {
    if (notionError) {
      const errorMessages: Record<string, string> = {
        'access_denied': 'You denied access to Notion. Please try again if you want to connect.',
        'missing_code': 'Authorization failed. Please try again.',
        'token_exchange_failed': 'Failed to exchange authorization code. Please try again.',
        'invalid_token': 'Received invalid token from Notion. Please try again.',
        'unknown': 'An unknown error occurred. Please try again.'
      };
      alert(errorMessages[notionError] || 'An error occurred during Notion connection.');
      router.replace(`/dashboard/${workspaceId}/agents/${agentId}/sources/notion`);
    }
  }, [notionError]);

  const handleNotionCallback = async (encodedData: string) => {
    try {
      // Decode the connection data
      const decodedData = JSON.parse(atob(encodedData));

      // Save to Firestore (client-side where user is authenticated)
      const connectionId = `${workspaceId}_notion`;
      await setDoc(doc(db, 'notionConnections', connectionId), {
        ...decodedData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Clean URL and reload connection
      router.replace(`/dashboard/${workspaceId}/agents/${agentId}/sources/notion`);

      // Show success and reload
      alert('Successfully connected to Notion! Loading your pages...');
      checkConnection();

    } catch (error) {
      console.error('Error saving Notion connection:', error);
      alert('Failed to save Notion connection. Please try again.');
      router.replace(`/dashboard/${workspaceId}/agents/${agentId}/sources/notion`);
    }
  };

  useEffect(() => {
    if (connection) {
      loadNotionPages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connection]);

  useEffect(() => {
    // Filter pages based on search query
    if (searchQuery.trim()) {
      const filtered = notionPages.filter(page =>
        page.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredPages(filtered);
    } else {
      setFilteredPages(notionPages);
    }
  }, [searchQuery, notionPages]);

  const checkConnection = async () => {
    setLoading(true);
    try {
      const conn = await getNotionConnection(workspaceId);
      setConnection(conn);
    } catch (error) {
      console.error('Error checking Notion connection:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadImportedPages = async () => {
    setLoadingImported(true);
    try {
      const result = await getAgentKnowledgeItems(agentId);

      if (result.success) {
        const imported = new Map<string, ImportedPage>();

        // Filter Notion type items and map them
        result.data
          .filter(item => item.type === 'notion' && item.notionPageId)
          .forEach(item => {
            imported.set(item.notionPageId!, {
              id: item.id,
              notionPageId: item.notionPageId!,
              title: item.title,
              chunksCreated: item.chunksCreated || 0,
              createdAt: item.createdAt
            });
          });

        setImportedPages(imported);
      }
    } catch (error) {
      console.error('Error loading imported pages:', error);
    } finally {
      setLoadingImported(false);
    }
  };

  const loadNotionPages = async () => {
    if (!connection) return;

    setLoadingPages(true);
    try {
      const result = await searchNotionPages(connection.accessToken);
      if (result.success && result.pages) {
        setNotionPages(result.pages);
        setFilteredPages(result.pages);
      } else {
        alert('Failed to load Notion pages: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error loading Notion pages:', error);
      alert('An error occurred while loading Notion pages');
    } finally {
      setLoadingPages(false);
    }
  };

  const handleConnectNotion = () => {
    setConnecting(true);
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://git-branch-m-main.onrender.com';
    window.location.href = `${backendUrl}/api/notion/oauth/authorize?workspace_id=${workspaceId}&agent_id=${agentId}`;
  };

  const togglePageSelection = (pageId: string) => {
    // Don't allow selecting already imported pages
    if (importedPages.has(pageId)) return;

    const newSelected = new Set(selectedPages);
    if (newSelected.has(pageId)) {
      newSelected.delete(pageId);
    } else {
      newSelected.add(pageId);
    }
    setSelectedPages(newSelected);
  };

  const handleTrainRAG = async () => {
    if (selectedPages.size === 0) {
      alert('Please select at least one page to train');
      return;
    }

    if (!connection) return;

    const confirmMessage = `This will import ${selectedPages.size} page(s) and add them to your agent's knowledge base (RAG). Continue?`;
    if (!confirm(confirmMessage)) return;

    setImporting(true);
    setImportedCount(0);

    try {
      let successCount = 0;
      const totalPages = selectedPages.size;

      for (const pageId of Array.from(selectedPages)) {
        const page = notionPages.find(p => p.id === pageId);
        if (!page) continue;

        try {
          // Import page using createAgentKnowledgeItem (handles both Qdrant and Firestore)
          const result = await createAgentKnowledgeItem(
            agentId,
            workspaceId,
            {
              title: page.title,
              content: `Notion page: ${page.title}`,
              type: 'notion',
              notionAccessToken: connection.accessToken,
              notionPageId: pageId,
              notionUrl: page.url,
              embeddingProvider: 'voyage',
              embeddingModel: 'voyage-3'
            }
          );

          if (result.success) {
            // Add to imported pages map
            importedPages.set(pageId, {
              id: result.data.id,
              notionPageId: pageId,
              title: page.title,
              chunksCreated: result.data.chunksCreated || 0,
              createdAt: result.data.createdAt || Date.now()
            });

            successCount++;
            setImportedCount(successCount);
          } else {
            console.error(`Failed to import page ${page.title}:`, result.error);
          }
        } catch (error) {
          console.error(`Failed to import page ${page.title}:`, error);
        }
      }

      alert(`✅ Successfully trained RAG with ${successCount} of ${totalPages} pages!\n\nAdded ${successCount} pages to your agent's knowledge base.`);
      setSelectedPages(new Set());
      setImportedPages(new Map(importedPages)); // Trigger re-render

    } catch (error) {
      console.error('Error during RAG training:', error);
      alert('An error occurred during RAG training');
    } finally {
      setImporting(false);
    }
  };

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

  // If connected, show pages list
  if (connection) {
    const notImportedPages = filteredPages.filter(p => !importedPages.has(p.id));
    const alreadyImportedPages = filteredPages.filter(p => importedPages.has(p.id));

    return (
      <div className="min-h-screen bg-background">
        <div className="flex max-w-7xl mx-auto">
          <div className="flex-1 p-8 pr-4">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-semibold text-foreground">Notion Sources</h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Connected to <strong>{connection.notionWorkspaceName}</strong>
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
                  placeholder="Search pages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Action Buttons */}
            {selectedPages.size > 0 && (
              <div className="mb-4 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium">
                    {selectedPages.size} page{selectedPages.size !== 1 ? 's' : ''} selected
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedPages(new Set())}
                    disabled={importing}
                  >
                    Clear Selection
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleTrainRAG}
                    disabled={importing}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                  >
                    {importing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Training RAG ({importedCount}/{selectedPages.size})
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

            {/* Stats Bar */}
            <div className="mb-6 grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-foreground">{notionPages.length}</div>
                  <div className="text-xs text-muted-foreground">Total Pages</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-600">{importedPages.size}</div>
                  <div className="text-xs text-muted-foreground">In Knowledge Base</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-blue-600">{notImportedPages.length}</div>
                  <div className="text-xs text-muted-foreground">Available to Import</div>
                </CardContent>
              </Card>
            </div>

            {/* Pages List */}
            {loadingPages ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="animate-spin h-8 w-8 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading your Notion pages...</p>
                </div>
              </div>
            ) : filteredPages.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    {searchQuery ? 'No pages found' : 'No pages available'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery
                      ? 'Try a different search term'
                      : 'Make sure you have shared pages with your Notion integration'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Available to Import Section */}
                {notImportedPages.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">
                      Available to Import ({notImportedPages.length})
                    </h3>
                    <div className="space-y-3">
                      {notImportedPages.map((page) => {
                        const isSelected = selectedPages.has(page.id);
                        return (
                          <Card
                            key={page.id}
                            className={`cursor-pointer transition-all hover:shadow-md ${
                              isSelected ? 'border-blue-500 bg-blue-50' : ''
                            }`}
                            onClick={() => togglePageSelection(page.id)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3 flex-1">
                                  <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center ${
                                    isSelected
                                      ? 'border-blue-500 bg-blue-500'
                                      : 'border-gray-300'
                                  }`}>
                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <h3 className="font-medium text-foreground">{page.title}</h3>
                                      <a
                                        href={page.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-muted-foreground hover:text-foreground"
                                      >
                                        <ExternalLink className="w-4 h-4" />
                                      </a>
                                    </div>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                      <span>Last edited: {new Date(page.last_edited_time).toLocaleDateString()}</span>
                                    </div>
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

                {/* Already in Knowledge Base Section */}
                {alreadyImportedPages.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">
                      Already in Knowledge Base ({alreadyImportedPages.length})
                    </h3>
                    <div className="space-y-3">
                      {alreadyImportedPages.map((page) => {
                        const imported = importedPages.get(page.id);
                        return (
                          <Card
                            key={page.id}
                            className="border-green-200 bg-green-50/50"
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3 flex-1">
                                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <h3 className="font-medium text-foreground">{page.title}</h3>
                                      <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">
                                        In RAG
                                      </Badge>
                                      <a
                                        href={page.url}
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
                                      <span>Added: {imported?.createdAt ? new Date(imported.createdAt).toLocaleDateString() : 'N/A'}</span>
                                    </div>
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
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-80 p-8 pl-4 border-l border-border">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">Quick Stats</h2>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Pages</span>
                    <span className="font-medium">{notionPages.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">In Knowledge Base</span>
                    <span className="font-medium text-green-600">{importedPages.size}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Selected</span>
                    <span className="font-medium text-blue-600">{selectedPages.size}</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t">
                <h3 className="font-medium text-foreground mb-2">How to use:</h3>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li>1. Browse available Notion pages</li>
                  <li>2. Click to select pages to import</li>
                  <li>3. Click &quot;Train RAG with Selected&quot;</li>
                  <li>4. Pages will be processed and added to your agent&apos;s knowledge base</li>
                </ol>
              </div>

              <div className="pt-6 border-t">
                <h3 className="font-medium text-foreground mb-2">What happens:</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>✓ Content is fetched from Notion</li>
                  <li>✓ Text is chunked (800 chars)</li>
                  <li>✓ Embeddings generated (Voyage AI)</li>
                  <li>✓ Stored in vector database (RAG)</li>
                  <li>✓ Saved to Firestore for tracking</li>
                </ul>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={loadNotionPages}
                disabled={loadingPages}
                className="w-full"
              >
                {loadingPages ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  'Refresh Pages'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not connected - show connect option
  return (
    <div className="min-h-screen bg-background">
      <div className="flex max-w-7xl mx-auto">
        <div className="flex-1 p-8 pr-4">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-semibold text-foreground">Notion</h1>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <Info className="w-4 h-4 mr-2" />
                Learn more
              </Button>
            </div>
            <p className="text-muted-foreground text-sm mb-8">
              Add Notion sources to train your AI Agent with precise information.
            </p>
          </div>

          <Card className="border border-border hover:border-primary/20 transition-colors duration-200">
            <CardContent className="p-8">
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-foreground">Connect Notion Pages</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Import your Notion pages to enhance your AI agent&apos;s knowledge base with structured content.
                  </p>
                </div>

                <Button
                  onClick={handleConnectNotion}
                  disabled={connecting}
                  className="bg-foreground hover:bg-foreground/90 text-background px-8 py-2"
                >
                  {connecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Connect with Notion
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground">
                  You&apos;ll be redirected to Notion to authorize access
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="w-80 p-8 pl-4 border-l border-border">
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground">Get Started</h2>
            <div className="space-y-4 text-sm">
              <p className="text-muted-foreground">
                Connect your Notion workspace to import pages and databases into your agent&apos;s knowledge base.
              </p>
              <div className="space-y-2">
                <h3 className="font-medium text-foreground">Benefits:</h3>
                <ul className="space-y-1 text-muted-foreground">
                  <li>✓ Instant content import</li>
                  <li>✓ No manual copying</li>
                  <li>✓ Select specific pages</li>
                  <li>✓ AI-powered RAG search</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

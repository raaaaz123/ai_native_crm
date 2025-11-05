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
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-foreground/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-foreground" />
              </div>
              <h1 className="text-2xl font-semibold text-foreground">Notion</h1>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>Connected to {connection.notionWorkspaceName}</span>
            </div>
          </div>

          {/* Stats - Minimal */}
          <div className="flex items-center justify-center gap-8 mb-8 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground mb-1">{notionPages.length}</div>
              <div className="text-muted-foreground">Total</div>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">{importedPages.size}</div>
              <div className="text-muted-foreground">Imported</div>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">{selectedPages.size}</div>
              <div className="text-muted-foreground">Selected</div>
            </div>
          </div>

          {/* Search - Centered */}
          <div className="max-w-md mx-auto mb-8">
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

          {/* Train RAG Button */}
          {selectedPages.size > 0 && (
            <div className="mb-6 max-w-md mx-auto">
              <Button
                onClick={handleTrainRAG}
                disabled={importing}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Training ({importedCount}/{selectedPages.size})
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-2" />
                    Train RAG with {selectedPages.size} page{selectedPages.size !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Pages List */}
          {loadingPages ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredPages.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'No pages found' : 'No pages available'}
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Available to Import Section */}
              {notImportedPages.length > 0 && (
                <div>
                  <h2 className="text-sm font-medium text-muted-foreground text-center mb-4">
                    Available to Import ({notImportedPages.length})
                  </h2>
                  <div className="space-y-2">
                    {notImportedPages.map((page) => {
                      const isSelected = selectedPages.has(page.id);
                      return (
                        <Card
                          key={page.id}
                          className={`cursor-pointer transition-all hover:border-primary/50 ${
                            isSelected ? 'border-primary bg-primary/5' : ''
                          }`}
                          onClick={() => togglePageSelection(page.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              {/* Checkbox */}
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                isSelected
                                  ? 'bg-primary border-primary'
                                  : 'border-muted-foreground/30'
                              }`}>
                                {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0 flex items-center justify-between">
                                <div className="min-w-0 flex-1">
                                  <h3 className="font-medium text-foreground truncate">{page.title}</h3>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    Edited {new Date(page.last_edited_time).toLocaleDateString()}
                                  </p>
                                </div>
                                <a
                                  href={page.url}
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
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Already in Knowledge Base Section */}
              {alreadyImportedPages.length > 0 && (
                <div>
                  <h2 className="text-sm font-medium text-muted-foreground text-center mb-4">
                    In Knowledge Base ({alreadyImportedPages.length})
                  </h2>
                  <div className="space-y-2">
                    {alreadyImportedPages.map((page) => {
                      const imported = importedPages.get(page.id);
                      return (
                        <Card key={page.id} className="bg-green-50/50 border-green-200">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                              <div className="flex-1 min-w-0 flex items-center justify-between">
                                <div className="min-w-0 flex-1">
                                  <h3 className="font-medium text-foreground truncate">{page.title}</h3>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {imported?.chunksCreated || 0} chunks created
                                  </p>
                                </div>
                                <a
                                  href={page.url}
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

  // Not connected - show connect option
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-foreground/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FileText className="w-8 h-8 text-foreground" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">Notion</h2>
              <p className="text-sm text-muted-foreground mb-8">
                Import pages into your agent&apos;s knowledge base
              </p>

              <Button
                onClick={handleConnectNotion}
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
                    <Plus className="w-4 h-4 mr-2" />
                    Connect with Notion
                  </>
                )}
              </Button>

              <div className="space-y-3 text-left border-t pt-6">
                <div className="flex items-start gap-3 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Instant content import</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">AI-powered search</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Select specific pages</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

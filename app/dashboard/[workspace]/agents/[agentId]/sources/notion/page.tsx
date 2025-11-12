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
  deleteAgentKnowledgeItem,
  type AgentKnowledgeItem
} from '@/app/lib/agent-knowledge-utils';
import { doc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import { FileText, Plus, Info, Search, Check, Loader2, ExternalLink, CheckCircle2, Database, Trash2, RefreshCw } from 'lucide-react';
import { disconnectNotion } from '@/app/lib/notion-utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

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

  // Deletion
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  // Success dialog
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  // Disconnect confirmation
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);

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

      // Show success dialog and reload
      setShowSuccessDialog(true);
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

  // Auto-close success dialog when pages are loaded
  useEffect(() => {
    if (showSuccessDialog && connection && !loadingPages && notionPages.length > 0) {
      const timer = setTimeout(() => {
        setShowSuccessDialog(false);
      }, 2000); // Close after 2 seconds
      return () => clearTimeout(timer);
    }
  }, [showSuccessDialog, connection, loadingPages, notionPages.length]);

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

  const executeDisconnectNotion = async () => {
    try {
      const ok = await disconnectNotion(workspaceId);
      if (!ok) {
        await deleteDoc(doc(db, 'notionConnections', `${workspaceId}_notion`));
      }
      setConnection(null);
      setNotionPages([]);
      setFilteredPages([]);
      setSelectedPages(new Set());
      toast.success('Disconnected Notion. You can now connect a new account.');
      router.replace(`/dashboard/${workspaceId}/agents/${agentId}/sources/notion`);
    } catch (error) {
      console.error('Error disconnecting Notion:', error);
      toast.error('Failed to disconnect Notion. Please try again.');
    } finally {
      setShowDisconnectDialog(false);
    }
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

  const handleDeletePage = async (itemId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}" from your knowledge base? This will remove all vector embeddings.`)) {
      return;
    }

    setDeletingItemId(itemId);
    try {
      const result = await deleteAgentKnowledgeItem(itemId);

      if (result.success) {
        // Remove from importedPages map
        const notionPageId = Array.from(importedPages.entries()).find(([_, v]) => v.id === itemId)?.[0];
        if (notionPageId) {
          const newImportedPages = new Map(importedPages);
          newImportedPages.delete(notionPageId);
          setImportedPages(newImportedPages);
        }
        alert(`✅ Successfully deleted "${title}" from knowledge base`);
      } else {
        alert(`❌ Failed to delete: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting page:', error);
      alert('An error occurred while deleting the page');
    } finally {
      setDeletingItemId(null);
    }
  };

  if (loading) {
    return (
      <>
        {/* Success Dialog */}
        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-success" />
                </div>
              </div>
              <DialogTitle className="text-center text-xl font-semibold">
                Successfully Connected!
              </DialogTitle>
              <DialogDescription className="text-center pt-2">
                Your Notion workspace has been connected successfully. We&apos;re now loading your pages...
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          </DialogContent>
        </Dialog>
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
      </>
    );
  }

  // If connected, show pages list
  if (connection) {
    const notImportedPages = filteredPages.filter(p => !importedPages.has(p.id));
    const alreadyImportedPages = filteredPages.filter(p => importedPages.has(p.id));

    return (
      <>
        {/* Success Dialog */}
        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-success" />
                </div>
              </div>
              <DialogTitle className="text-center text-xl font-semibold">
                Successfully Connected!
              </DialogTitle>
              <DialogDescription className="text-center pt-2">
                Your Notion workspace has been connected successfully. We&apos;re now loading your pages...
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          </DialogContent>
        </Dialog>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Notion Sources</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Connected to <strong>{connection.notionWorkspaceName}</strong>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadNotionPages}
                  disabled={loadingPages}
                  className="rounded-lg border-border"
                >
                  {loadingPages ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh Pages
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
                <DialogTitle>Disconnect Notion</DialogTitle>
                <DialogDescription>
                  This will disconnect the current Notion account from this workspace.
                  Imported knowledge stays intact. You can connect a different account afterward.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDisconnectDialog(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={executeDisconnectNotion}>
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
                placeholder="Search pages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-lg border-border"
              />
            </div>
          </div>

          {/* Action Buttons */}
          {selectedPages.size > 0 && (
            <div className="mb-4 flex items-center justify-between bg-primary/10 border border-primary/20 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  {selectedPages.size} page{selectedPages.size !== 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedPages(new Set())}
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Available to Import Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  Available to Import ({notImportedPages.length})
                </h3>
                {notImportedPages.length > 0 ? (
                  <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
                    {notImportedPages.map((page) => {
                      const isSelected = selectedPages.has(page.id);
                      return (
                        <Card
                          key={page.id}
                          className={`cursor-pointer transition-all hover:shadow-md border ${
                            isSelected ? 'border-primary bg-primary/5' : 'border-border'
                          }`}
                          onClick={() => togglePageSelection(page.id)}
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
                                  <h3 className="font-medium text-foreground text-sm truncate">{page.title}</h3>
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  Last edited: {new Date(page.last_edited_time).toLocaleDateString()}
                                </div>
                              </div>
                              <a
                                href={page.url}
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
                      <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                      <p className="text-sm text-muted-foreground">No pages available to import</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Already in Knowledge Base Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  In Knowledge Base ({alreadyImportedPages.length})
                </h3>
                {alreadyImportedPages.length > 0 ? (
                  <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
                    {alreadyImportedPages.map((page) => {
                      const imported = importedPages.get(page.id);
                      const isDeleting = deletingItemId === imported?.id;
                      return (
                        <Card
                          key={page.id}
                          className="border border-success/20 bg-success/5"
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center gap-3">
                              <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium text-foreground text-sm truncate">{page.title}</h3>
                                  <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/20">
                                    In RAG
                                  </Badge>
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  {imported?.chunksCreated || 0} chunks • Added {imported?.createdAt ? new Date(imported.createdAt).toLocaleDateString() : 'N/A'}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <a
                                  href={page.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-muted-foreground hover:text-foreground"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => imported && handleDeletePage(imported.id, page.title)}
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
                      <p className="text-sm text-muted-foreground">No pages in knowledge base yet</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      </>
    );
  }

  // Not connected - show connect option
  return (
    <>
      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
            </div>
            <DialogTitle className="text-center text-xl font-semibold">
              Successfully Connected!
            </DialogTitle>
            <DialogDescription className="text-center pt-2">
              Your Notion workspace has been connected successfully. We&apos;re now loading your pages...
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold text-foreground">Notion Sources</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Connect your Notion workspace to import pages into your AI agent&apos;s knowledge base.
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
                className="bg-primary hover:bg-primary/90 px-8 py-2 rounded-lg"
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
    </div>
    </>
  );
}

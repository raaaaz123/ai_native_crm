'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Globe, ArrowLeft, Loader2, CheckCircle2, AlertCircle, Link2, Map, ExternalLink, Trash2, FileText } from 'lucide-react';
import { useAuth } from '@/app/lib/workspace-auth-context';
import { toast } from 'sonner';
import { getAgentKnowledgeItems, deleteAgentKnowledgeItem, type AgentKnowledgeItem } from '@/app/lib/agent-knowledge-utils';

interface ScrapingResult {
  url: string;
  title: string;
  total_pages: number;
  total_word_count: number;
  chunks_created: number;
  elapsed_time: number;
}

type CrawlMethod = 'individual' | 'sitemap' | 'crawl-links';

export default function WebsiteSourcePage() {
  const params = useParams();
  const router = useRouter();
  const { workspaceContext } = useAuth();

  const workspaceSlug = params.workspace as string;
  const agentId = params.agentId as string;

  // Crawl method selection
  const [crawlMethod, setCrawlMethod] = useState<CrawlMethod>('individual');

  // Form state
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [crawling, setCrawling] = useState(false);
  const [result, setResult] = useState<ScrapingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Connected websites state
  const [connectedWebsites, setConnectedWebsites] = useState<AgentKnowledgeItem[]>([]);
  const [loadingWebsites, setLoadingWebsites] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load connected websites
  useEffect(() => {
    loadConnectedWebsites();
  }, [agentId]);

  const loadConnectedWebsites = async () => {
    setLoadingWebsites(true);
    try {
      const result = await getAgentKnowledgeItems(agentId);
      if (result.success) {
        const websites = result.data.filter(item => item.type === 'website');
        setConnectedWebsites(websites);
      }
    } catch (error) {
      console.error('Error loading websites:', error);
    } finally {
      setLoadingWebsites(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this website source? This will remove all associated data from both Firestore and Qdrant.')) {
      return;
    }

    setDeletingId(itemId);
    try {
      const result = await deleteAgentKnowledgeItem(itemId);
      if (result.success) {
        toast.success('Website source deleted successfully');
        await loadConnectedWebsites();
      } else {
        toast.error(result.error || 'Failed to delete website source');
      }
    } catch (error) {
      console.error('Error deleting website:', error);
      toast.error('Failed to delete website source');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCrawl = async () => {
    if (!title.trim() || !url.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!workspaceContext?.currentWorkspace?.id) {
      toast.error('No workspace found');
      return;
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      toast.error('Please enter a valid URL');
      return;
    }

    // Note: Currently only individual link crawling is supported
    // Sitemap and crawl-links features are coming soon
    if (crawlMethod !== 'individual') {
      toast.error('Sitemap and crawl-links features are coming soon. Please use individual link crawling for now.');
      return;
    }

    setCrawling(true);
    setError(null);
    setResult(null);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://git-branch-m-main.onrender.com';

      const response = await fetch(`${backendUrl}/api/scraping/scrape-website`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url.trim(),
          title: title.trim(),
          agent_id: agentId,
          workspace_id: workspaceContext?.currentWorkspace?.id,
          metadata: {
            workspace_id: workspaceContext?.currentWorkspace?.id,
            agent_id: agentId,
          },
          embedding_model: 'text-embedding-3-large'
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.detail || 'Failed to scrape website');
      }

      // Success!
      setResult({
        url: data.data.url,
        title: data.data.title,
        total_pages: data.data.total_pages,
        total_word_count: data.data.total_word_count,
        chunks_created: data.data.chunks_created,
        elapsed_time: data.data.elapsed_time
      });

      toast.success('Website scraped and added to knowledge base successfully!');

      // Clear form
      setTitle('');
      setUrl('');

      // Reload connected websites list
      await loadConnectedWebsites();

      // Redirect back to sources page after a delay
      setTimeout(() => {
        router.push(`/dashboard/${workspaceSlug}/agents/${agentId}/sources`);
      }, 2000);

    } catch (err) {
      console.error('Error scraping website:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to scrape website';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setCrawling(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-4 p-2 h-auto text-muted-foreground hover:text-foreground"
            disabled={crawling}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <h1 className="text-3xl font-bold text-foreground mb-2">Website Sources</h1>
          <p className="text-muted-foreground">
            Crawl web pages or submit sitemaps to update your AI with the latest content
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Add Website Form */}
          <div className="lg:col-span-2">
            {/* Crawl Method Selection */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Choose Crawl Method</h2>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setCrawlMethod('individual')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      crawlMethod === 'individual'
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    disabled={crawling}
                  >
                    <Link2 className={`w-6 h-6 mx-auto mb-2 ${
                      crawlMethod === 'individual' ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                    <div className="text-sm font-medium">Individual Link</div>
                    <div className="text-xs text-muted-foreground mt-1">Single URL</div>
                  </button>

                  <button
                    onClick={() => setCrawlMethod('sitemap')}
                    className={`p-4 rounded-lg border-2 transition-all relative ${
                      crawlMethod === 'sitemap'
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    disabled={crawling}
                  >
                    <Badge variant="secondary" className="absolute top-2 right-2 text-xs py-0 h-5">
                      Soon
                    </Badge>
                    <Map className={`w-6 h-6 mx-auto mb-2 ${
                      crawlMethod === 'sitemap' ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                    <div className="text-sm font-medium">Sitemap</div>
                    <div className="text-xs text-muted-foreground mt-1">XML sitemap</div>
                  </button>

                  <button
                    onClick={() => setCrawlMethod('crawl-links')}
                    className={`p-4 rounded-lg border-2 transition-all relative ${
                      crawlMethod === 'crawl-links'
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    disabled={crawling}
                  >
                    <Badge variant="secondary" className="absolute top-2 right-2 text-xs py-0 h-5">
                      Soon
                    </Badge>
                    <Globe className={`w-6 h-6 mx-auto mb-2 ${
                      crawlMethod === 'crawl-links' ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                    <div className="text-sm font-medium">Crawl Links</div>
                    <div className="text-xs text-muted-foreground mt-1">Follow links</div>
                  </button>
                </div>
              </CardContent>
            </Card>

            <Card>
          <CardContent className="p-6 space-y-6">
            {/* Success Message */}
            {result && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-green-900 mb-1">
                      Website scraped successfully!
                    </h3>
                    <div className="text-sm text-green-800 space-y-1">
                      <p><strong>Pages:</strong> {result.total_pages}</p>
                      <p><strong>Words:</strong> {result.total_word_count.toLocaleString()}</p>
                      <p><strong>Chunks Created:</strong> {result.chunks_created}</p>
                      <p><strong>Time:</strong> {result.elapsed_time.toFixed(1)}s</p>
                    </div>
                    <p className="text-sm text-green-700 mt-2">
                      Redirecting back to sources...
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-900 mb-1">Error</h3>
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Form Fields */}
            <div>
              <Label htmlFor="title" className="text-sm font-medium text-foreground">
                Website Title *
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter website title"
                className="mt-2"
                disabled={crawling}
              />
              <p className="text-xs text-muted-foreground mt-1">
                A descriptive name for this website source
              </p>
            </div>

            <div>
              <Label htmlFor="url" className="text-sm font-medium text-foreground">
                {crawlMethod === 'individual' && 'Website URL *'}
                {crawlMethod === 'sitemap' && 'Sitemap URL *'}
                {crawlMethod === 'crawl-links' && 'Starting URL *'}
              </Label>
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={
                  crawlMethod === 'individual' ? 'https://example.com' :
                  crawlMethod === 'sitemap' ? 'https://example.com/sitemap.xml' :
                  'https://example.com'
                }
                className="mt-2"
                disabled={crawling}
              />
              <p className="text-xs text-muted-foreground mt-2">
                {crawlMethod === 'individual' && "We'll extract and index the content from this URL"}
                {crawlMethod === 'sitemap' && "We'll crawl all pages listed in the sitemap"}
                {crawlMethod === 'crawl-links' && "We'll follow and crawl all links found on this page"}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setTitle('');
                  setUrl('');
                  setError(null);
                  setResult(null);
                }}
                disabled={crawling}
              >
                Clear
              </Button>
              <Button
                onClick={handleCrawl}
                disabled={!title.trim() || !url.trim() || crawling}
                className="bg-primary hover:bg-primary/90"
              >
                {crawling ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Crawling...
                  </>
                ) : (
                  <>
                    <Globe className="w-4 h-4 mr-2" />
                    Crawl Website
                  </>
                )}
              </Button>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <div className="flex items-start gap-3">
                {crawlMethod === 'individual' && <Link2 className="w-5 h-5 text-blue-600 mt-0.5" />}
                {crawlMethod === 'sitemap' && <Map className="w-5 h-5 text-blue-600 mt-0.5" />}
                {crawlMethod === 'crawl-links' && <Globe className="w-5 h-5 text-blue-600 mt-0.5" />}
                <div className="flex-1 text-sm text-blue-900">
                  <p className="font-semibold mb-1">
                    {crawlMethod === 'individual' && 'Individual Link Crawling'}
                    {crawlMethod === 'sitemap' && 'Sitemap Crawling'}
                    {crawlMethod === 'crawl-links' && 'Link Crawling'}
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-blue-800">
                    {crawlMethod === 'individual' && (
                      <>
                        <li>Extracts content from a single URL</li>
                        <li>Best for specific pages or articles</li>
                        <li>Fastest processing time</li>
                      </>
                    )}
                    {crawlMethod === 'sitemap' && (
                      <>
                        <li>Crawls all URLs from your sitemap.xml</li>
                        <li>Best for complete site indexing</li>
                        <li>Processes multiple pages automatically</li>
                      </>
                    )}
                    {crawlMethod === 'crawl-links' && (
                      <>
                        <li>Follows and crawls all links on the page</li>
                        <li>Best for discovering related content</li>
                        <li>Processing time varies by link count</li>
                      </>
                    )}
                    <li>Content is automatically chunked and vectorized</li>
                    <li>Your AI agent will use this content to answer questions</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
          </div>

          {/* Right Column - Connected Websites */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Connected Websites
                </h2>

                {loadingWebsites ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : connectedWebsites.length === 0 ? (
                  <div className="text-center py-8">
                    <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-sm text-muted-foreground">
                      No websites connected yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {connectedWebsites.map((website) => (
                      <Card key={website.id} className="border-gray-200">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                              <Globe className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-foreground text-sm truncate">
                                {website.title}
                              </h3>
                              {website.websiteUrl && (
                                <a
                                  href={website.websiteUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Visit
                                </a>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {website.chunksCreated || 0} chunks
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(website.id)}
                                  disabled={deletingId === website.id}
                                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  {deletingId === website.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-3 h-3" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

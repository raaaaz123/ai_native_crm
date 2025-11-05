'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Globe, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/app/lib/workspace-auth-context';
import { toast } from 'sonner';

interface ScrapingResult {
  url: string;
  title: string;
  total_pages: number;
  total_word_count: number;
  chunks_created: number;
  elapsed_time: number;
}

export default function WebsiteSourcePage() {
  const params = useParams();
  const router = useRouter();
  const { workspaceContext } = useAuth();

  const workspaceSlug = params.workspace as string;
  const agentId = params.agentId as string;

  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [crawling, setCrawling] = useState(false);
  const [result, setResult] = useState<ScrapingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      <div className="max-w-4xl mx-auto p-8">
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

          <h1 className="text-3xl font-bold text-foreground mb-2">Add Website</h1>
          <p className="text-muted-foreground">
            Scrape a website to extract content for your AI agent&apos;s knowledge base
          </p>
        </div>

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
                Website URL *
              </Label>
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="mt-2"
                disabled={crawling}
              />
              <p className="text-xs text-muted-foreground mt-2">
                We&apos;ll extract and index the content from this URL using Crawl4AI
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
                <Globe className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1 text-sm text-blue-900">
                  <p className="font-semibold mb-1">About Web Scraping</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-800">
                    <li>Powered by Crawl4AI for fast and accurate extraction</li>
                    <li>Content is automatically chunked and vectorized</li>
                    <li>Your AI agent will use this content to answer questions</li>
                    <li>Processing time depends on the website size</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

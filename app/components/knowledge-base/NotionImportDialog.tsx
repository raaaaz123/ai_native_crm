'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  searchNotionPages,
  importNotionPage,
  importNotionDatabase,
  type NotionPage
} from '@/app/lib/notion-utils';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';

interface NotionImportDialogProps {
  workspaceId: string;
  agentId: string;
  accessToken: string;
  onImportComplete?: () => void;
}

export function NotionImportDialog({
  workspaceId,
  agentId,
  accessToken,
  onImportComplete
}: NotionImportDialogProps) {
  const [importType, setImportType] = useState<'page' | 'database'>('page');
  const [pages, setPages] = useState<NotionPage[]>([]);
  const [selectedPageId, setSelectedPageId] = useState('');
  const [databaseId, setDatabaseId] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  const loadPages = useCallback(async () => {
    setSearching(true);
    setError('');
    try {
      const result = await searchNotionPages(accessToken);
      if (result.success && result.pages) {
        setPages(result.pages);
        if (result.pages.length === 0) {
          setError('No pages found. Make sure you have shared pages with the integration.');
        }
      } else {
        setError(result.error || 'Failed to load pages');
      }
    } catch (err) {
      setError('An error occurred while loading pages');
      console.error(err);
    } finally {
      setSearching(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (accessToken) {
      loadPages();
    }
  }, [accessToken, loadPages]);

  const handleImport = async () => {
    setLoading(true);
    setError('');

    try {
      if (importType === 'page') {
        if (!selectedPageId) {
          setError('Please select a page to import');
          setLoading(false);
          return;
        }

        // Get selected page details
        const selectedPage = pages.find(p => p.id === selectedPageId);
        const title = customTitle || selectedPage?.title || 'Untitled';

        // Import the page
        const result = await importNotionPage(
          accessToken,
          selectedPageId,
          agentId,
          workspaceId,
          title,
          'voyage',
          'voyage-3'
        );

        if (!result.success) {
          setError(result.error || 'Failed to import page');
          setLoading(false);
          return;
        }

        // Create Firestore record
        await addDoc(collection(db, 'agentKnowledge'), {
          agentId,
          workspaceId,
          title,
          content: `Notion page imported: ${title}`,
          type: 'notion',
          notionPageId: selectedPageId,
          notionUrl: selectedPage?.url,
          chunksCreated: (result.data as { chunks_created?: number })?.chunks_created || 0,
          embeddingProvider: 'voyage',
          embeddingModel: 'voyage-3',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        alert(`Successfully imported: ${title}`);
        onImportComplete?.();

      } else {
        // Import database
        if (!databaseId) {
          setError('Please enter a database ID');
          setLoading(false);
          return;
        }

        const result = await importNotionDatabase(
          accessToken,
          databaseId,
          agentId,
          workspaceId,
          'voyage',
          'voyage-3'
        );

        if (!result.success) {
          setError(result.error || 'Failed to import database');
          setLoading(false);
          return;
        }

        // Create Firestore records for imported pages
        const importedPages = (result.data as { imported_pages?: Array<{ id: string; title: string; url: string; chunks_created: number }> })?.imported_pages || [];
        for (const pageData of importedPages) {
          await addDoc(collection(db, 'agentKnowledge'), {
            agentId,
            workspaceId,
            title: pageData.title,
            content: `Notion page imported: ${pageData.title}`,
            type: 'notion',
            notionPageId: pageData.id,
            notionUrl: pageData.url,
            chunksCreated: pageData.chunks_created || 0,
            embeddingProvider: 'voyage',
            embeddingModel: 'voyage-3',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }

        alert(`Successfully imported ${importedPages.length} pages from database`);
        onImportComplete?.();
      }

      // Reset form
      setSelectedPageId('');
      setDatabaseId('');
      setCustomTitle('');

    } catch (err) {
      console.error('Import error:', err);
      setError('An unexpected error occurred during import');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Import Type</Label>
        <div className="flex gap-2 mt-2">
          <Button
            type="button"
            variant={importType === 'page' ? 'default' : 'outline'}
            onClick={() => setImportType('page')}
            className="flex-1"
          >
            📄 Single Page
          </Button>
          <Button
            type="button"
            variant={importType === 'database' ? 'default' : 'outline'}
            onClick={() => setImportType('database')}
            className="flex-1"
          >
            📊 Entire Database
          </Button>
        </div>
      </div>

      {importType === 'page' ? (
        <>
          <div>
            <Label htmlFor="notion-page">Select Page</Label>
            {searching ? (
              <p className="text-sm text-muted-foreground mt-2">Loading pages...</p>
            ) : (
              <Select value={selectedPageId} onValueChange={setSelectedPageId}>
                <SelectTrigger id="notion-page" className="mt-2">
                  <SelectValue placeholder="Choose a Notion page" />
                </SelectTrigger>
                <SelectContent>
                  {pages.map((page) => (
                    <SelectItem key={page.id} value={page.id}>
                      {page.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {pages.length === 0 && !searching && (
              <p className="text-sm text-muted-foreground mt-2">
                No pages found. Make sure you&apos;ve shared pages with your Notion integration.
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="custom-title">Custom Title (Optional)</Label>
            <Input
              id="custom-title"
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Leave blank to use Notion page title"
              className="mt-2"
            />
          </div>
        </>
      ) : (
        <div>
          <Label htmlFor="database-id">Database ID</Label>
          <Input
            id="database-id"
            type="text"
            value={databaseId}
            onChange={(e) => setDatabaseId(e.target.value)}
            placeholder="Paste your Notion database ID"
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-2">
            You can find the database ID in the Notion URL: notion.so/DATABASE_ID?v=...
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <Button
        onClick={handleImport}
        disabled={loading || (importType === 'page' && !selectedPageId) || (importType === 'database' && !databaseId)}
        className="w-full"
      >
        {loading ? 'Importing...' : `Import ${importType === 'page' ? 'Page' : 'Database'}`}
      </Button>
    </div>
  );
}

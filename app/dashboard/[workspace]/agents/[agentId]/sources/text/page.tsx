'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/app/lib/workspace-auth-context';
import {
  createAgentKnowledgeItem,
  getAgentKnowledgeItems,
  deleteAgentKnowledgeItem,
  type AgentKnowledgeItem
} from '@/app/lib/agent-knowledge-utils';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlignLeft, Save, Trash2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function TextSourcePage() {
  const params = useParams();
  const agentId = params.agentId as string;
  const { workspaceContext } = useAuth();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [existingTexts, setExistingTexts] = useState<AgentKnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');

  const loadExistingTexts = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getAgentKnowledgeItems(agentId);

      if (result.success) {
        // Filter only text type items (not files, just manual text entry)
        const textItems = result.data.filter(item => item.type === 'text' && !item.fileName);
        setExistingTexts(textItems);
      }
    } catch (error) {
      console.error('Error loading texts:', error);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    if (agentId) {
      loadExistingTexts();
    }
  }, [agentId, loadExistingTexts]);

  const handleSave = async () => {
    if (!title.trim()) {
      setUploadStatus('error');
      setUploadMessage('Please enter a title');
      return;
    }

    if (!content.trim()) {
      setUploadStatus('error');
      setUploadMessage('Please enter text content');
      return;
    }

    if (!workspaceContext?.currentWorkspace?.id) {
      setUploadStatus('error');
      setUploadMessage('Workspace not found');
      return;
    }

    try {
      setSaving(true);
      setUploadStatus('uploading');
      setUploadMessage('Saving text content...');

      const result = await createAgentKnowledgeItem(
        agentId,
        workspaceContext?.currentWorkspace?.id,
        {
          title: title,
          content: content,
          type: 'text',
          embeddingProvider: 'openai',
          embeddingModel: 'text-embedding-3-large'
        }
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to save text');
      }

      setUploadStatus('success');
      setUploadMessage('Text content saved successfully!');

      // Reload existing texts
      await loadExistingTexts();

      // Reset form
      setTitle('');
      setContent('');

      // Clear success message after 3 seconds
      setTimeout(() => {
        setUploadStatus('idle');
        setUploadMessage('');
      }, 3000);
    } catch (error) {
      setUploadStatus('error');
      setUploadMessage(error instanceof Error ? error.message : 'Failed to save text');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this text content?')) {
      return;
    }

    try {
      setUploadStatus('uploading');
      setUploadMessage('Deleting text...');

      const result = await deleteAgentKnowledgeItem(id);

      if (result.success) {
        setUploadStatus('success');
        setUploadMessage('Text deleted successfully!');
        await loadExistingTexts();

        setTimeout(() => {
          setUploadStatus('idle');
          setUploadMessage('');
        }, 2000);
      } else {
        throw new Error(result.error || 'Failed to delete text');
      }
    } catch (error) {
      setUploadStatus('error');
      setUploadMessage(error instanceof Error ? error.message : 'Failed to delete text');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Add Text</h1>
          <p className="text-gray-600">Add custom text content to train your AI agent</p>
        </div>

        {/* Status Message */}
        {uploadStatus !== 'idle' && uploadMessage && (
          <div className={`mb-4 p-4 rounded-lg flex items-center gap-3 ${
            uploadStatus === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
            uploadStatus === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
            'bg-blue-50 text-blue-800 border border-blue-200'
          }`}>
            {uploadStatus === 'success' && <CheckCircle className="w-5 h-5" />}
            {uploadStatus === 'error' && <AlertCircle className="w-5 h-5" />}
            {uploadStatus === 'uploading' && <Loader2 className="w-5 h-5 animate-spin" />}
            <span>{uploadMessage}</span>
          </div>
        )}

        <Card>
          <CardContent className="p-6 space-y-6">
            <div>
              <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                Title *
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a title for this text"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="content" className="text-sm font-medium text-gray-700">
                Text Content *
              </Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={12}
                placeholder="Enter the text content..."
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-2">
                {content.length} characters
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setTitle('');
                  setContent('');
                }}
                disabled={saving}
              >
                Clear
              </Button>
              <Button
                onClick={handleSave}
                disabled={!title.trim() || !content.trim() || saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Text
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Existing Text Content */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Existing Text Content</h3>

            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-gray-400" />
                <p className="text-gray-500">Loading text content...</p>
              </div>
            ) : existingTexts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <AlignLeft className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No text content added yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {existingTexts.map((item) => (
                  <Card key={item.id} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-2">{item.title}</h4>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                            {item.content}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>{item.content.length} characters</span>
                            <span>•</span>
                            <span>Added {new Date(item.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          className="ml-4 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
  );
}

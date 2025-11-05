'use client';

import { useState, useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, X, Trash2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function FilesSourcePage() {
  const params = useParams();
  const agentId = params.agentId as string;
  const { workspaceContext } = useAuth();

  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [existingFiles, setExistingFiles] = useState<AgentKnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');

  useEffect(() => {
    if (agentId) {
      loadExistingFiles();
    }
  }, [agentId]);

  const loadExistingFiles = async () => {
    try {
      setLoading(true);
      const result = await getAgentKnowledgeItems(agentId);

      if (result.success) {
        // Filter only file type items (pdf and text files)
        const fileItems = result.data.filter(item => item.type === 'pdf' || item.type === 'text');
        setExistingFiles(fileItems);
      }
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setUploadStatus('error');
      setUploadMessage('Please select at least one file to upload');
      return;
    }

    if (!title.trim()) {
      setUploadStatus('error');
      setUploadMessage('Please enter a title for the file collection');
      return;
    }

    if (!workspaceContext?.currentWorkspace?.id) {
      setUploadStatus('error');
      setUploadMessage('Workspace not found');
      return;
    }

    try {
      setUploading(true);
      setUploadStatus('uploading');
      setUploadMessage(`Uploading ${files.length} file(s)...`);

      // Upload each file individually
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadMessage(`Uploading file ${i + 1} of ${files.length}: ${file.name}...`);

        // Determine file type
        const fileType = file.name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'text';

        const result = await createAgentKnowledgeItem(
          agentId,
          workspaceContext?.currentWorkspace?.id,
          {
            title: `${title} - ${file.name}`,
            content: '', // Content will be extracted by backend
            type: fileType,
            file: file,
            embeddingProvider: 'voyage',
            embeddingModel: 'voyage-3'
          }
        );

        if (!result.success) {
          throw new Error(result.error || `Failed to upload ${file.name}`);
        }
      }

      setUploadStatus('success');
      setUploadMessage(`Successfully uploaded ${files.length} file(s)!`);

      // Reload existing files
      await loadExistingFiles();

      // Reset form
      setFiles([]);
      setTitle('');

      // Clear success message after 3 seconds
      setTimeout(() => {
        setUploadStatus('idle');
        setUploadMessage('');
      }, 3000);
    } catch (error) {
      setUploadStatus('error');
      setUploadMessage(error instanceof Error ? error.message : 'Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      setUploadStatus('uploading');
      setUploadMessage('Deleting file...');

      const result = await deleteAgentKnowledgeItem(id);

      if (result.success) {
        setUploadStatus('success');
        setUploadMessage('File deleted successfully!');
        await loadExistingFiles();

        setTimeout(() => {
          setUploadStatus('idle');
          setUploadMessage('');
        }, 2000);
      } else {
        throw new Error(result.error || 'Failed to delete file');
      }
    } catch (error) {
      setUploadStatus('error');
      setUploadMessage(error instanceof Error ? error.message : 'Failed to delete file');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Files</h1>
          <p className="text-gray-600">Upload documents to train your AI agent</p>
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
            {/* Title Input */}
            <div>
              <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                Collection Title *
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a title for this file collection"
                className="mt-2"
              />
            </div>

            {/* File Upload Area */}
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Files *
              </Label>
              <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">
                  <label htmlFor="file-upload" className="text-blue-600 hover:text-blue-700 cursor-pointer font-medium">
                    Click to upload
                  </label>
                  {' '}or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  PDF, DOC, TXT, MD files up to 10MB
                </p>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.md"
                  onChange={handleFileChange}
                />
              </div>
            </div>

            {/* Selected Files List */}
            {files.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Selected Files ({files.length})
                </Label>
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setFiles([]);
                  setTitle('');
                }}
                disabled={uploading}
              >
                Clear All
              </Button>
              <Button
                onClick={handleUpload}
                disabled={files.length === 0 || !title.trim() || uploading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Files
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Existing Files */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Existing Files</h3>

            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-gray-400" />
                <p className="text-gray-500">Loading files...</p>
              </div>
            ) : existingFiles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No files uploaded yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {existingFiles.map((item) => (
                  <Card key={item.id} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-gray-900">{item.title}</h4>
                            <Badge variant="secondary" className={`text-xs ${
                              item.type === 'pdf' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                            }`}>
                              {item.type.toUpperCase()}
                            </Badge>
                          </div>
                          {item.fileName && (
                            <p className="text-sm text-gray-600 mb-1">
                              File: {item.fileName}
                            </p>
                          )}
                          {item.fileSize && (
                            <p className="text-xs text-gray-500 mb-2">
                              Size: {(item.fileSize / 1024 / 1024).toFixed(2)} MB
                            </p>
                          )}
                          <p className="text-xs text-gray-500">
                            Uploaded {new Date(item.createdAt).toLocaleDateString()}
                          </p>
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

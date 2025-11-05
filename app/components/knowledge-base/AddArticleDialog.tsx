'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Plus, 
  Upload, 
  Loader2,
  CheckCircle,
  Globe,
  MessageSquare,
  Database,
  File,
  BookOpen
} from 'lucide-react';

interface FormData {
  title: string;
  type: string;
  content: string;
  tags: string | string[];
  question?: string;
  answer?: string;
  websiteUrl?: string;
  isSitemap?: boolean;
  notionApiKey?: string;
  notionPageId?: string;
  notionImportType?: string;
  file?: File | null;
}

interface AddArticleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FormData) => Promise<void>;
  isSubmitting: boolean;
  editingItem?: unknown;
}

const documentTypes = [
  {
    value: 'faq',
    label: 'FAQ',
    description: 'Question & Answer pairs',
    icon: MessageSquare
  },
  {
    value: 'website',
    label: 'Website',
    description: 'Crawl website content',
    icon: Globe
  },
  {
    value: 'notion',
    label: 'Notion',
    description: 'Import from Notion',
    icon: Database
  },
  {
    value: 'pdf',
    label: 'PDF',
    description: 'Upload PDF document',
    icon: File
  },
  {
    value: 'text',
    label: 'Text File',
    description: 'Upload text/markdown',
    icon: BookOpen
  }
];

export default function AddArticleDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  editingItem
}: AddArticleDialogProps) {
  const [formData, setFormData] = useState<FormData>(() => {
    const item = editingItem as Record<string, unknown> | null | undefined;
    return {
      title: (item?.title as string) || '',
      type: (item?.type as string) || 'faq',
      content: (item?.content as string) || '',
      tags: Array.isArray(item?.tags) ? (item.tags as string[]).join(', ') : ((item?.tags as string) || ''),
      question: (item?.question as string) || '',
      answer: (item?.answer as string) || '',
      websiteUrl: (item?.websiteUrl as string) || '',
      isSitemap: (item?.isSitemap as boolean) || false,
      notionApiKey: '',
      notionPageId: '',
      notionImportType: 'page',
      file: null
    };
  });

  const [notionConnected, setNotionConnected] = useState(false);
  const [notionSearching, setNotionSearching] = useState(false);
  const [notionPages, setNotionPages] = useState<Array<{ id: string; title: string; [key: string]: unknown }>>([]);
  const hasResetRef = useRef(false);

  const resetForm = () => {
    setFormData({
      title: '',
      type: 'faq',
      content: '',
      tags: '',
      question: '',
      answer: '',
      websiteUrl: '',
      isSitemap: false,
      notionApiKey: '',
      notionPageId: '',
      notionImportType: 'page',
      file: null
    });
    setNotionConnected(false);
    setNotionPages([]);
  };

  // Reset form when dialog opens for new items (only once per session)
  useEffect(() => {
    if (open && !editingItem && !hasResetRef.current) {
      resetForm();
      hasResetRef.current = true;
    } else if (!open) {
      hasResetRef.current = false;
    }
  }, [open, editingItem]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔍 Dialog validation - formData.type:', formData.type);
    console.log('🔍 Dialog validation - formData:', formData);
    
    // Validate based on content type
    if (formData.type === 'faq') {
      if (!formData.question?.trim()) {
        alert('Please enter a question for the FAQ');
        return;
      }
      if (!formData.answer?.trim()) {
        alert('Please enter an answer for the FAQ');
        return;
      }
    } else if (formData.type === 'website') {
      if (!formData.websiteUrl?.trim()) {
        alert('Please enter a website URL');
        return;
      }
    } else if (formData.type === 'notion') {
      if (!formData.notionApiKey?.trim()) {
        alert('Please enter your Notion API key');
        return;
      }
      if (!formData.notionPageId?.trim()) {
        alert('Please select a Notion page or enter a page/database ID');
        return;
      }
    } else if (formData.type === 'pdf' || formData.type === 'text') {
      if (!formData.file) {
        alert(`Please select a ${formData.type.toUpperCase()} file to upload`);
        return;
      }
    } else {
      // For any other type, check if we have a title at least
      if (!formData.title?.trim()) {
        alert('Please enter a title for the article');
        return;
      }
    }
    
    const submitData = {
      ...formData,
      tags: typeof formData.tags === 'string' 
        ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        : Array.isArray(formData.tags) 
          ? formData.tags 
          : []
    };
    
    await onSubmit(submitData);
  };

  const handleNotionConnect = async () => {
    if (!formData.notionApiKey?.trim()) return;
    
    setNotionSearching(true);
    try {
      // Simulate API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      setNotionConnected(true);
      setNotionPages([
        { id: '1', title: 'Getting Started' },
        { id: '2', title: 'API Documentation' },
        { id: '3', title: 'FAQ' }
      ]);
    } catch (error) {
      console.error('Failed to connect to Notion:', error);
    } finally {
      setNotionSearching(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, file }));
    }
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-8 pt-8 pb-6 border-b">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Plus className="w-4 h-4 text-primary" />
            </div>
            {editingItem ? 'Edit Article' : 'Add New Article'}
          </DialogTitle>
          <DialogDescription>
            {editingItem ? 'Update your knowledge base article' : 'Add content to your AI knowledge base'}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(90vh-140px)] px-8 py-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">
                Article Title
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter article title"
                className="h-10"
                required
              />
            </div>

            {/* Content Type Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Content Type</Label>
              <div className="grid grid-cols-3 gap-3">
                {documentTypes.map((type) => {
                  const IconComponent = type.icon;
                  return (
                    <Card
                      key={type.value}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        formData.type === type.value
                          ? 'ring-2 ring-primary border-primary'
                          : 'hover:border-primary/50'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, type: type.value, file: null }))}
                    >
                      <CardContent className="p-3">
                        <div className="flex flex-col items-center gap-2 text-center">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                            formData.type === type.value ? 'bg-primary/10' : 'bg-muted'
                          }`}>
                            <IconComponent className={`w-3 h-3 ${
                              formData.type === type.value ? 'text-primary' : 'text-muted-foreground'
                            }`} />
                          </div>
                          <h4 className="font-medium text-xs">{type.label}</h4>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* FAQ Section */}
            {formData.type === 'faq' && (
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="question" className="text-sm font-medium">
                    Question
                  </Label>
                  <Input
                    id="question"
                    value={formData.question}
                    onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                    placeholder="What is your return policy?"
                    className="h-10"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="answer" className="text-sm font-medium">
                    Answer
                  </Label>
                  <Textarea
                    id="answer"
                    value={formData.answer}
                    onChange={(e) => setFormData(prev => ({ ...prev, answer: e.target.value }))}
                    placeholder="Our return policy allows returns within 30 days..."
                    rows={4}
                    className="resize-none"
                    required
                  />
                </div>
              </div>
            )}

            {/* Notion Section */}
            {formData.type === 'notion' && (
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="notionApiKey" className="text-sm font-medium">
                    Notion API Key
                  </Label>
                  <Input
                    id="notionApiKey"
                    type="password"
                    value={formData.notionApiKey}
                    onChange={(e) => setFormData(prev => ({ ...prev, notionApiKey: e.target.value }))}
                    placeholder="secret_xxxxxxxxxxxxxxxxxxxxx"
                    className="h-10"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Get your integration token from Notion Integrations
                  </p>
                </div>

                {!notionConnected && (
                  <Button
                    type="button"
                    onClick={handleNotionConnect}
                    disabled={!formData.notionApiKey?.trim() || notionSearching}
                    className="w-full"
                  >
                    {notionSearching ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      'Connect to Notion'
                    )}
                  </Button>
                )}

                {notionConnected && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Import Type</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant={formData.notionImportType === 'page' ? 'default' : 'outline'}
                          onClick={() => setFormData(prev => ({ ...prev, notionImportType: 'page' }))}
                          className="h-10"
                        >
                          📄 Single Page
                        </Button>
                        <Button
                          type="button"
                          variant={formData.notionImportType === 'database' ? 'default' : 'outline'}
                          onClick={() => setFormData(prev => ({ ...prev, notionImportType: 'database' }))}
                          className="h-10"
                        >
                          📊 Database
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        {formData.notionImportType === 'page' ? 'Select Page' : 'Database ID'}
                      </Label>
                      {formData.notionImportType === 'page' ? (
                        <Select
                          value={formData.notionPageId}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, notionPageId: value }))}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Select a Notion page" />
                          </SelectTrigger>
                          <SelectContent>
                            {notionPages.map((page) => (
                              <SelectItem key={page.id} value={page.id}>
                                {page.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          value={formData.notionPageId}
                          onChange={(e) => setFormData(prev => ({ ...prev, notionPageId: e.target.value }))}
                          placeholder="Enter Notion database ID"
                          className="h-10"
                          required
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Website Section */}
            {formData.type === 'website' && (
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="websiteUrl" className="text-sm font-medium">
                    Website URL
                  </Label>
                  <Input
                    id="websiteUrl"
                    type="url"
                    value={formData.websiteUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, websiteUrl: e.target.value }))}
                    placeholder="https://example.com"
                    className="h-10"
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isSitemap"
                    checked={formData.isSitemap}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isSitemap: !!checked }))}
                  />
                  <Label htmlFor="isSitemap" className="text-sm">
                    This is a sitemap URL
                  </Label>
                </div>
              </div>
            )}

            {/* File Upload Section */}
            {(formData.type === 'pdf' || formData.type === 'text') && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Upload File</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept={formData.type === 'pdf' ? '.pdf' : '.txt,.md'}
                    onChange={handleFileUpload}
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm font-medium mb-2">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formData.type === 'pdf' ? 'PDF files up to 10MB' : 'TXT, MD files up to 10MB'}
                    </p>
                  </label>
                  
                  {formData.file && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-sm text-primary">
                      <CheckCircle className="w-4 h-4" />
                      <span className="font-medium">
                        {formData.file.name} ({(formData.file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}


            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags" className="text-sm font-medium">
                Tags
              </Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="e.g., getting-started, tutorial, help"
                className="h-10"
              />
              <p className="text-xs text-muted-foreground">
                Separate tags with commas
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1 h-10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 h-10"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {editingItem ? 'Updating...' : 'Adding...'}
                  </>
                ) : (
                  editingItem ? 'Update Article' : 'Add Article'
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

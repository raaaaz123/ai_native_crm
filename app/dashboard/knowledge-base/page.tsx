'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingDialog } from '../../components/ui/loading-dialog';
import { 
  Database, 
  Plus, 
  Search, 
  FileText, 
  Upload, 
  Trash2, 
  Edit,
  Loader2,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';
import { getBusinessWidgets, type ChatWidget } from '@/app/lib/chat-utils';
import { 
  getKnowledgeBaseItems, 
  createKnowledgeBaseItem, 
  updateKnowledgeBaseItem,
  type KnowledgeBaseItem 
} from '@/app/lib/knowledge-base-utils';

interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  isActive: boolean;
  type?: string;
  fileName?: string;
  fileSize?: number;
  websiteUrl?: string;
}

interface ChunkData {
  text: string;
  source_url?: string;
  source_title?: string;
  quality_score?: number;
  originalIndex?: number;
  [key: string]: unknown;
}



const documentTypes = [
  { value: 'manual', label: 'Manual Text Entry', description: 'Type or paste content directly' },
  { value: 'faq', label: 'FAQ / Q&A', description: 'Add question and answer pairs' },
  { value: 'text', label: 'Text File Upload', description: 'Upload .txt, .md, or other text files' },
  { value: 'pdf', label: 'PDF Document', description: 'Upload PDF files with text extraction' },
  { value: 'website', label: 'Website Scraping', description: 'Scrape content from a website URL' }
] as const;

export default function KnowledgeBasePage() {
  const { user, companyContext } = useAuth();
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);
  const [widgets, setWidgets] = useState<ChatWidget[]>([]);
  const [selectedWidget, setSelectedWidget] = useState<string>('');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [deleteAllLoading, setDeleteAllLoading] = useState(false);
  const [showSecretButton, setShowSecretButton] = useState(false);
  const [cleanPineconeLoading, setCleanPineconeLoading] = useState(false);
  const [crawledData, setCrawledData] = useState<{
    url: string;
    total_pages: number;
    crawl_method: string;
    total_word_count: number;
    chunks: ChunkData[];
    [key: string]: unknown;
  } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [editableChunks, setEditableChunks] = useState<ChunkData[]>([]);
  const [saveProgress, setSaveProgress] = useState({ current: 0, total: 0 });

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: '',
    type: 'manual' as 'manual' | 'text' | 'pdf' | 'website' | 'faq',
    file: null as File | null,
    websiteUrl: '',
    isSitemap: false,
    question: '',
    answer: ''
  });

  useEffect(() => {
    if (user && companyContext?.company?.id) {
      loadWidgets();
    } else {
      setIsLoading(false);
      setInitialLoadComplete(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, companyContext]);

  useEffect(() => {
    if (selectedWidget) {
      loadKnowledgeItems();
    } else {
      setKnowledgeItems([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWidget]);

  const loadWidgets = async () => {
    if (!user?.uid || !companyContext?.company?.id) {
      return;
    }

    try {
      const businessId = companyContext.company.id;
      const result = await getBusinessWidgets(businessId);
      
      if (result.success && result.data.length > 0) {
        setWidgets(result.data);
        // Auto-select the first widget if none is selected
        if (!selectedWidget && result.data.length > 0) {
          setSelectedWidget(result.data[0].id);
        }
      } else {
        // Create a default widget if none exist
        const defaultWidget: ChatWidget = {
          id: 'default-widget',
          name: 'Default Widget',
          businessId: businessId,
          welcomeMessage: 'Hello! How can we help you today?',
          primaryColor: '#3b82f6',
          position: 'bottom-right',
          buttonText: 'Chat with us',
          placeholderText: 'Type your message...',
          offlineMessage: 'We are currently offline. Please leave a message.',
          collectEmail: true,
          collectPhone: false,
          autoReply: 'Thanks for your message! We will get back to you soon.',
          businessHours: {
            enabled: false,
            timezone: 'UTC',
            monday: { start: '09:00', end: '17:00', enabled: true },
            tuesday: { start: '09:00', end: '17:00', enabled: true },
            wednesday: { start: '09:00', end: '17:00', enabled: true },
            thursday: { start: '09:00', end: '17:00', enabled: true },
            friday: { start: '09:00', end: '17:00', enabled: true },
            saturday: { start: '09:00', end: '17:00', enabled: false },
            sunday: { start: '09:00', end: '17:00', enabled: false }
          },
          isActive: true,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        
        setWidgets([defaultWidget]);
        setSelectedWidget(defaultWidget.id);
      }
    } catch (error) {
      console.error('Error loading widgets:', error);
      
      // Create a default widget on error
      const businessId = companyContext.company.id;
      const defaultWidget: ChatWidget = {
        id: 'default-widget',
        name: 'Default Widget',
        businessId: businessId,
        welcomeMessage: 'Hello! How can we help you today?',
        primaryColor: '#3b82f6',
        position: 'bottom-right',
        buttonText: 'Chat with us',
        placeholderText: 'Type your message...',
        offlineMessage: 'We are currently offline. Please leave a message.',
        collectEmail: true,
        collectPhone: false,
        autoReply: 'Thanks for your message! We will get back to you soon.',
        businessHours: {
          enabled: false,
          timezone: 'UTC',
          monday: { start: '09:00', end: '17:00', enabled: true },
          tuesday: { start: '09:00', end: '17:00', enabled: true },
          wednesday: { start: '09:00', end: '17:00', enabled: true },
          thursday: { start: '09:00', end: '17:00', enabled: true },
          friday: { start: '09:00', end: '17:00', enabled: true },
          saturday: { start: '09:00', end: '17:00', enabled: false },
          sunday: { start: '09:00', end: '17:00', enabled: false }
        },
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      setWidgets([defaultWidget]);
      setSelectedWidget(defaultWidget.id);
    } finally {
      setIsLoading(false);
      setInitialLoadComplete(true);
    }
  };

  const loadKnowledgeItems = async () => {
    if (!selectedWidget) return;
    
    try {
      setIsLoading(true);
      const result = await getKnowledgeBaseItems(selectedWidget);
      
      if (result.success) {
        // Convert KnowledgeBaseItem to KnowledgeItem format
        const convertedItems: KnowledgeItem[] = result.data.map((item: KnowledgeBaseItem) => ({
          id: item.id,
          title: item.title,
          content: item.content,
          tags: [], // Default empty tags since KnowledgeBaseItem doesn't have tags
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          isActive: true
        }));
        
        setKnowledgeItems(convertedItems);
      } else {
        console.error('Error loading knowledge items:', result.error);
        setKnowledgeItems([]);
      }
    } catch (error) {
      console.error('Error loading knowledge items:', error);
      setKnowledgeItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedWidget) {
      alert('Please select a widget first');
      return;
    }

    try {
      setIsSubmitting(true);
      setUploadStatus('uploading');

      let content = formData.content;
      let fileName = '';
      let fileSize = 0;

      // Handle FAQ
      if (formData.type === 'faq') {
        if (!formData.question.trim() || !formData.answer.trim()) {
          alert('Please enter both question and answer');
          return;
        }

        // Format FAQ content
        content = `Q: ${formData.question.trim()}\n\nA: ${formData.answer.trim()}`;
        
        // Get widget's embedding configuration
        const selectedWidgetObj = widgets.find(w => w.id === selectedWidget);
        
        // Debug what's in the widget
        console.log('🔍 Widget aiConfig:', selectedWidgetObj?.aiConfig);
        
        const embeddingProvider = (selectedWidgetObj?.aiConfig as {embeddingProvider?: string})?.embeddingProvider || 'openai';
        const embeddingModel = (selectedWidgetObj?.aiConfig as {embeddingModel?: string})?.embeddingModel || 'text-embedding-3-large';
        
        console.log(`📤 Sending FAQ with embeddings: ${embeddingProvider}/${embeddingModel}`);
        
        // Store FAQ in Qdrant via backend
        const faqRequest = {
          widget_id: selectedWidget,
          title: formData.title || formData.question.substring(0, 50),
          question: formData.question.trim(),
          answer: formData.answer.trim(),
          type: 'faq',
          embedding_provider: embeddingProvider,
          embedding_model: embeddingModel,
          metadata: {
            business_id: companyContext?.company?.id ?? '',
            tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
          }
        };

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
        const faqResponse = await fetch(`${backendUrl}/api/knowledge-base/store-faq`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(faqRequest),
        });

        if (!faqResponse.ok) {
          throw new Error('Failed to store FAQ');
        }

        const faqResult = await faqResponse.json();
        
        if (faqResult.success) {
          setUploadStatus('success');
          setUploadMessage(`FAQ added successfully!`);
          
          // Reload knowledge items
          await loadKnowledgeItems();
          
          // Reset form
          setFormData({ 
            title: '', 
            content: '', 
            tags: '', 
            type: 'manual' as 'manual' | 'text' | 'pdf' | 'website' | 'faq', 
            file: null,
            websiteUrl: '',
            isSitemap: false,
            question: '',
            answer: ''
          });
          setShowAddForm(false);
          setEditingItem(null);
          setIsSubmitting(false);
          return;
        } else {
          throw new Error(faqResult.error || 'FAQ storage failed');
        }
      }

      // Handle website scraping
      if (formData.type === 'website') {
        if (!formData.websiteUrl.trim()) {
          alert('Please enter a website URL');
          return;
        }

        const crawlRequest = {
          url: formData.websiteUrl,
          widget_id: selectedWidget,
          title: formData.title,
          max_pages: 100,
          max_depth: 3,
          is_sitemap: formData.isSitemap,
          metadata: {
            business_id: companyContext?.company?.id ?? ''
          }
        };

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
        const scrapingResponse = await fetch(`${backendUrl}/api/crawler/crawl-website-preview`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(crawlRequest),
        });

        if (!scrapingResponse.ok) {
          throw new Error('Failed to crawl website');
        }

        const scrapingResult = await scrapingResponse.json();
        
        if (scrapingResult.success) {
          // Store crawled data for preview
          setCrawledData(scrapingResult.data);
          setEditableChunks(scrapingResult.data.chunks);
          setShowPreview(true);
          setIsSubmitting(false);
          setUploadStatus('success');
          const method = scrapingResult.data.crawl_method === 'sitemap' ? 'sitemap' : 'URL crawling';
          setUploadMessage(`Website crawled successfully using ${method}! Found ${scrapingResult.data.total_pages} pages with ${scrapingResult.data.chunks.length} chunks. Review and edit below, then click Submit to save.`);
          
          return;
        } else {
          throw new Error(scrapingResult.error || 'Website crawling failed');
        }
      }

      // Handle file upload for PDF and text files
      if ((formData.type === 'pdf' || formData.type === 'text') && formData.file) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', formData.file);
        uploadFormData.append('widget_id', selectedWidget);
        uploadFormData.append('title', formData.title);

        // Upload file to backend
        const uploadResponse = await fetch('/api/knowledge-base/upload', {
          method: 'POST',
          body: uploadFormData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload file');
        }

        const uploadResult = await uploadResponse.json();
        
        if (uploadResult.success) {
          content = uploadResult.data.content;
          fileName = formData.file.name;
          fileSize = formData.file.size;
        } else {
          throw new Error(uploadResult.error || 'Upload failed');
        }
      } else if (formData.type === 'manual' && !formData.content.trim()) {
        alert('Please enter content for manual entry');
        return;
      } else if ((formData.type === 'pdf' || formData.type === 'text') && !formData.file) {
        alert(`Please select a ${formData.type.toUpperCase()} file to upload`);
        return;
      }

      // Get the widget's embedding configuration
      const selectedWidgetObj = widgets.find(w => w.id === selectedWidget);
      
      // Debug what's in the widget
      console.log('🔍 Widget aiConfig (document):', selectedWidgetObj?.aiConfig);
      
      const embeddingProvider = (selectedWidgetObj?.aiConfig as {embeddingProvider?: string})?.embeddingProvider || 'openai';
      const embeddingModel = (selectedWidgetObj?.aiConfig as {embeddingModel?: string})?.embeddingModel || 'text-embedding-3-large';
      
      console.log(`📊 Using embeddings: ${embeddingProvider}/${embeddingModel} (from widget config)`);

      // Create knowledge base item
      const itemData = {
        title: formData.title,
        content: content,
        type: formData.type as 'text' | 'pdf' | 'website',
        fileName: fileName || undefined,
        fileSize: fileSize || undefined,
        embeddingProvider: embeddingProvider,
        embeddingModel: embeddingModel
      };

      let result;
      if (editingItem) {
        const knowledgeData: Partial<KnowledgeBaseItem> = {
          title: formData.title,
          content: content,
          type: formData.type as 'text' | 'pdf' | 'website',
          fileName: fileName || undefined,
          fileSize: fileSize || undefined,
        };
        result = await updateKnowledgeBaseItem(editingItem.id, knowledgeData);
      } else {
        result = await createKnowledgeBaseItem(companyContext!.company.id, selectedWidget, itemData);
      }

      if (result.success) {
        // Reload knowledge items to get the updated list
        await loadKnowledgeItems();
        
        // Reset form
        setFormData({ 
          title: '', 
          content: '', 
          tags: '', 
          type: 'manual' as 'manual' | 'text' | 'pdf' | 'website' | 'faq', 
          file: null,
          websiteUrl: '',
          isSitemap: false,
          question: '',
          answer: ''
        });
        setShowAddForm(false);
        setEditingItem(null);
        setUploadStatus('success');
        setUploadMessage(editingItem ? 'Article updated successfully!' : 'Article added successfully!');
      } else {
        throw new Error(result.error || 'Failed to save article');
      }
    } catch (error) {
      console.error('Error saving knowledge item:', error);
      setUploadStatus('error');
      setUploadMessage(`Error: ${error instanceof Error ? error.message : 'Failed to save article'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitChunks = async () => {
    if (!crawledData || !editableChunks.length) return;
    
    try {
      setIsSubmitting(true);
      setUploadStatus('uploading');
      setSaveProgress({ current: 0, total: editableChunks.length });
      
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
      const BATCH_SIZE = 50; // Process 50 chunks at a time
      const totalChunks = editableChunks.length;
      let allStoredChunks: ChunkData[] = [];
      let totalSaved = 0;
      
      // Process in batches
      for (let i = 0; i < totalChunks; i += BATCH_SIZE) {
        const batch = editableChunks.slice(i, Math.min(i + BATCH_SIZE, totalChunks));
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(totalChunks / BATCH_SIZE);
        
        setUploadMessage(`Saving batch ${batchNum}/${totalBatches} (${i + 1}-${Math.min(i + BATCH_SIZE, totalChunks)} of ${totalChunks} chunks)...`);
        setSaveProgress({ current: i, total: totalChunks });
        
        const saveRequest = {
          widget_id: selectedWidget,
          title: formData.title,
          url: crawledData.url,
          crawl_method: crawledData.crawl_method,
          chunks: batch,
          batch_info: {
            batch_num: batchNum,
            total_batches: totalBatches,
            is_first_batch: i === 0,
            is_last_batch: i + BATCH_SIZE >= totalChunks
          },
          metadata: {
            business_id: companyContext?.company?.id ?? ''
          }
        };
        
        const response = await fetch(`${backendUrl}/api/crawler/save-chunks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(saveRequest),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to save batch ${batchNum}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
          totalSaved += result.data.chunks_created;
          allStoredChunks = [...allStoredChunks, ...(result.data.chunks || [])];
          setSaveProgress({ current: i + batch.length, total: totalChunks });
        } else {
          throw new Error(result.error || `Failed to save batch ${batchNum}`);
        }
      }
      
      // Final success
      setUploadStatus('success');
      setUploadMessage(`✅ Successfully saved all ${totalSaved} chunks to Qdrant!`);
      setSaveProgress({ current: totalChunks, total: totalChunks });
      
      // Wait a moment to show completion
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reload knowledge items
      await loadKnowledgeItems();
      
      // Reset everything
      setCrawledData(null);
      setEditableChunks([]);
      setShowPreview(false);
      setSaveProgress({ current: 0, total: 0 });
      setFormData({ 
        title: '', 
        content: '', 
        tags: '', 
        type: 'manual' as 'manual' | 'text' | 'pdf' | 'website' | 'faq', 
        file: null,
        websiteUrl: '',
        isSitemap: false,
        question: '',
        answer: ''
      });
      setShowAddForm(false);
      
    } catch (error) {
      console.error('Error saving chunks:', error);
      setUploadStatus('error');
      setUploadMessage(`Error: ${error instanceof Error ? error.message : 'Failed to save chunks'}`);
      setSaveProgress({ current: 0, total: 0 });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (item: KnowledgeItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      content: item.content,
      tags: item.tags.join(', '),
      type: 'manual' as 'manual' | 'text' | 'pdf' | 'website' | 'faq',
      file: null,
      websiteUrl: '',
      isSitemap: false,
      question: '',
      answer: ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this knowledge item?')) {
      setKnowledgeItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleDeleteAllData = async () => {
    if (!companyContext?.company?.id) {
      alert('No company context available');
      return;
    }

    try {
      setDeleteAllLoading(true);
      setUploadStatus('uploading');
      setUploadMessage('Deleting all data from Qdrant and Firestore...');

      const businessId = companyContext.company.id;
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';

      // Delete from Qdrant
      const qdrantResponse = await fetch(`${backendUrl}/api/knowledge-base/delete-all`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId: businessId,
          widgetId: selectedWidget || 'all'
        }),
      });

      if (!qdrantResponse.ok) {
        throw new Error('Failed to delete data from Qdrant');
      }

      // Delete from Firestore
      const firestoreResponse = await fetch(`${backendUrl}/api/firestore/delete-all`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId: businessId,
          widgetId: selectedWidget || 'all'
        }),
      });

      if (!firestoreResponse.ok) {
        throw new Error('Failed to delete data from Firestore');
      }

      const qdrantResult = await qdrantResponse.json();
      const firestoreResult = await firestoreResponse.json();

      setUploadStatus('success');
      setUploadMessage(`Successfully deleted all data! Qdrant: ${qdrantResult.message}, Firestore: ${firestoreResult.message}`);
      
      // Reload knowledge items to show empty state
      await loadKnowledgeItems();
      
      // Close dialog
      setShowDeleteAllDialog(false);

    } catch (error) {
      console.error('Error deleting all data:', error);
      setUploadStatus('error');
      setUploadMessage(`Error: ${error instanceof Error ? error.message : 'Failed to delete all data'}`);
    } finally {
      setDeleteAllLoading(false);
    }
  };

  const handleCleanQdrant = async () => {
    if (!confirm('⚠️ DANGER: This will delete ALL records from Qdrant collection. This action cannot be undone!\n\nAre you absolutely sure?')) {
      return;
    }

    if (!confirm('🚨 FINAL WARNING: This will permanently delete ALL points from the entire Qdrant collection!\n\nThis affects ALL users and ALL data. Continue?')) {
      return;
    }

    try {
      setCleanPineconeLoading(true);
      setUploadStatus('uploading');
      setUploadMessage('Cleaning entire Qdrant collection...');

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';

      // Call the clean Qdrant endpoint
      const response = await fetch(`${backendUrl}/api/knowledge-base/clean-qdrant`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to clean Qdrant collection');
      }

      const result = await response.json();

      setUploadStatus('success');
      setUploadMessage(`Successfully cleaned Qdrant collection! ${result.message}`);
      
      // Reload knowledge items to show empty state
      await loadKnowledgeItems();

    } catch (error) {
      console.error('Error cleaning Qdrant:', error);
      setUploadStatus('error');
      setUploadMessage(`Error: ${error instanceof Error ? error.message : 'Failed to clean Qdrant collection'}`);
    } finally {
      setCleanPineconeLoading(false);
    }
  };

  const filteredItems = knowledgeItems.filter(item => {
    const matchesSearch = !searchTerm || 
                         item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch && item.isActive;
  });

  if (isLoading || !initialLoadComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <LoadingDialog 
          open={true}
          message="Loading Knowledge Base" 
          submessage="Loading your articles and content..."
        />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-50 to-blue-50/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 
            className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3 cursor-pointer select-none"
            onClick={() => {
              // Secret: Click title 5 times to show secret button
              const clickCount = parseInt(sessionStorage.getItem('titleClickCount') || '0');
              const newCount = clickCount + 1;
              sessionStorage.setItem('titleClickCount', newCount.toString());
              
              if (newCount >= 5) {
                setShowSecretButton(true);
                sessionStorage.setItem('titleClickCount', '0'); // Reset counter
              }
            }}
            title="Click 5 times for secret..."
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
              <Database className="w-6 h-6 text-white" />
            </div>
            Knowledge Base
          </h1>
          <p className="text-gray-600 mb-6 font-light">Manage your knowledge base content for AI-powered responses</p>
        
        {/* Widget Selection - Modern Design */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Database className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Select Widget</h3>
              <p className="text-sm text-gray-600">Choose a widget to manage its knowledge base</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select
                value={selectedWidget}
                onValueChange={setSelectedWidget}
              >
                <SelectTrigger className="w-full h-12 px-4 bg-white border-2 border-gray-300 rounded-lg shadow-sm hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium transition-all duration-200">
                  <SelectValue placeholder="Choose a widget to manage knowledge base" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {widgets.map(widget => (
                    <SelectItem key={widget.id} value={widget.id} className="cursor-pointer hover:bg-blue-50">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">{widget.name}</span>
                        <span className="text-xs text-gray-500">({widget.id})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedWidget && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1">
                  <FileText className="w-3 h-3 mr-1" />
                  {knowledgeItems.length} articles
                </Badge>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            )}
          </div>
          
          {/* Embedding Provider Info */}
          {selectedWidget && (() => {
            const selectedWidgetObj = widgets.find(w => w.id === selectedWidget);
            const embeddingProvider = (selectedWidgetObj?.aiConfig as {embeddingProvider?: string})?.embeddingProvider || 'openai';
            const embeddingModel = (selectedWidgetObj?.aiConfig as {embeddingModel?: string})?.embeddingModel || 'text-embedding-3-large';
            
            return (
              <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{
                      backgroundColor: embeddingProvider === 'voyage' ? '#06b6d4' : '#3b82f6'
                    }}>
                      <span className="text-xl">{embeddingProvider === 'voyage' ? '🚢' : '🤖'}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Embedding Provider</p>
                      <p className="text-xs text-gray-600">All items will use this configuration</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">
                      {embeddingProvider === 'voyage' ? 'Voyage AI' : 'OpenAI'}
                    </p>
                    <p className="text-xs text-gray-600">
                      {embeddingModel === 'voyage-3' ? 'voyage-3 (1024d)' :
                       embeddingModel === 'voyage-3-lite' ? 'voyage-3-lite (512d)' :
                       embeddingModel === 'text-embedding-3-large' ? 'text-emb-3-large (3072d)' :
                       embeddingModel === 'text-embedding-3-small' ? 'text-emb-3-small (1536d)' :
                       embeddingModel}
                    </p>
                  </div>
                </div>
                <div className="mt-3 p-2 bg-white rounded border border-green-200">
                  <p className="text-xs text-gray-700">
                    💡 <strong>Note:</strong> To change embedding provider, go to{' '}
                    <a href={`/dashboard/widgets/${selectedWidget}`} className="text-blue-600 hover:underline font-semibold">
                      Widget Settings → AI Tab
                    </a>
                  </p>
                </div>
              </div>
            );
          })()}
          
          {!selectedWidget && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Please select a widget to view and manage its knowledge base articles
              </p>
            </div>
          )}
        </div>
      </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <Card className="bg-white/95 backdrop-blur-md border-0 shadow-md hover:shadow-lg transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Articles</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{knowledgeItems.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/95 backdrop-blur-md border-0 shadow-md hover:shadow-lg transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Active Articles</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    {knowledgeItems.filter(item => item.isActive).length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/95 backdrop-blur-md border-0 shadow-md hover:shadow-lg transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Widgets</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{widgets.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                  <Upload className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        {selectedWidget && (
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search knowledge base..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11 border-2 focus:ring-2 focus:ring-blue-500 rounded-xl"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowAddForm(true);
                  setEditingItem(null);
                  setFormData({ 
                    title: '', 
                    content: '', 
                    tags: '', 
                    type: 'manual' as 'manual' | 'text' | 'pdf' | 'website' | 'faq', 
                    file: null,
                    websiteUrl: '',
                    isSitemap: false,
                    question: '',
                    answer: ''
                  });
                }}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white flex items-center gap-2 shadow-md hover:shadow-lg transition-all rounded-xl px-6 h-11"
                disabled={!selectedWidget}
              >
                <Plus className="w-5 h-5" />
                Add Article
              </Button>

              <Button
                onClick={() => setShowDeleteAllDialog(true)}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white flex items-center gap-2 shadow-md hover:shadow-lg transition-all rounded-xl px-6 h-11"
                disabled={!selectedWidget || knowledgeItems.length === 0}
                title={knowledgeItems.length === 0 ? "No data to delete" : "Delete all knowledge base data"}
              >
                <Trash2 className="w-5 h-5" />
                Delete All Data
              </Button>

              {/* Secret Clean Qdrant Button */}
              {showSecretButton && (
                <Button
                  onClick={handleCleanQdrant}
                  disabled={cleanPineconeLoading}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white flex items-center gap-2 shadow-md hover:shadow-lg transition-all rounded-xl px-6 h-11 animate-pulse"
                  title="🚨 DANGER: Cleans entire Qdrant collection - affects ALL users!"
                >
                  {cleanPineconeLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Cleaning...
                    </>
                  ) : (
                    <>
                      <Database className="w-5 h-5" />
                      Clean Qdrant
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}

      {/* Add/Edit Form */}
      {showAddForm && selectedWidget && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{editingItem ? 'Edit Article' : 'Add New Article'}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingItem(null);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter article title"
                    required
                  />
                </div>
              </div>

              {/* Document Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Document Type
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {documentTypes.map((type) => (
                    <div
                      key={type.value}
                      className={`relative cursor-pointer rounded-lg border p-4 transition-all duration-200 ${
                        formData.type === type.value
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, type: type.value, file: null }))}
                    >
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="documentType"
                          value={type.value}
                          checked={formData.type === type.value}
                          onChange={() => setFormData(prev => ({ ...prev, type: type.value, file: null }))}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <div className="ml-3">
                          <label className="block text-sm font-medium text-gray-900 cursor-pointer">
                            {type.label}
                          </label>
                          <p className="text-xs text-gray-500 mt-1">{type.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* FAQ Section */}
              {formData.type === 'faq' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Question
                    </label>
                    <Input
                      value={formData.question}
                      onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                      placeholder="What is your return policy?"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Answer
                    </label>
                    <Textarea
                      value={formData.answer}
                      onChange={(e) => setFormData(prev => ({ ...prev, answer: e.target.value }))}
                      placeholder="Our return policy allows returns within 30 days of purchase..."
                      rows={6}
                      required
                    />
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>💡 Tip:</strong> Write clear, concise answers. The AI will use these Q&A pairs to respond to similar customer questions.
                    </p>
                  </div>
                </div>
              )}

              {/* Website URL Section */}
              {formData.type === 'website' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Website or Sitemap URL
                    </label>
                    <Input
                      type="url"
                      value={formData.websiteUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, websiteUrl: e.target.value }))}
                      placeholder="https://example.com or https://example.com/sitemap.xml"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter a website URL (will auto-detect sitemap) or direct sitemap.xml URL
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isSitemap"
                      checked={formData.isSitemap}
                      onChange={(e) => setFormData(prev => ({ ...prev, isSitemap: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isSitemap" className="text-sm text-gray-700">
                      This is a sitemap URL (sitemap.xml)
                    </label>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>💡 Tip:</strong> If you provide a website URL, we&apos;ll automatically try to find and use the sitemap for better coverage. You can also provide a direct sitemap.xml URL for faster crawling.
                    </p>
                  </div>
                </div>
              )}

              {/* File Upload Section */}
              {(formData.type === 'text' || formData.type === 'pdf') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload File
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                    <div className="space-y-1 text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                        >
                          <span>Upload a file</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            accept={formData.type === 'pdf' ? '.pdf' : '.txt,.md,.text'}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setFormData(prev => ({ ...prev, file }));
                              }
                            }}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        {formData.type === 'pdf' ? 'PDF files up to 10MB' : 'TXT, MD files up to 10MB'}
                      </p>
                      {formData.file && (
                        <div className="mt-2 flex items-center justify-center gap-2 text-sm text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span>{formData.file.name} ({(formData.file.size / 1024 / 1024).toFixed(2)} MB)</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Content Section - Only show for manual entry or as preview for file uploads */}
              {formData.type !== 'website' && formData.type !== 'faq' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {formData.type === 'manual' ? 'Content' : 'Content Preview'}
                  </label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder={
                      formData.type === 'manual' 
                        ? "Enter article content" 
                        : "Content will be extracted from uploaded file"
                    }
                    rows={6}
                    required={formData.type === 'manual'}
                    disabled={formData.type !== 'manual'}
                    className={formData.type !== 'manual' ? 'bg-gray-50' : ''}
                  />
                  {formData.type !== 'manual' && (
                    <p className="text-xs text-gray-500 mt-1">
                      Content will be automatically extracted from your uploaded file
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (comma-separated)
                </label>
                <Input
                  value={formData.tags}
                  onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="e.g., getting-started, tutorial, help"
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingItem ? 'Update Article' : 'Add Article'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingItem(null);
                    setUploadStatus('idle');
                    setUploadMessage('');
                  }}
                >
                  Cancel
                </Button>
              </div>

              {/* Preview and Edit Chunks */}
              {showPreview && crawledData && editableChunks.length > 0 && (
                <div className="mt-6 space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">📝 Review Crawled Data</h3>
                    <p className="text-sm text-blue-800 mb-4">
                      Review and edit the {editableChunks.length} chunks below. Click on any chunk to edit its content.
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><strong>Pages Crawled:</strong> {crawledData.total_pages}</div>
                      <div><strong>Method:</strong> {crawledData.crawl_method === 'sitemap' ? 'Sitemap' : 'URL Crawling'}</div>
                      <div><strong>Total Words:</strong> {crawledData.total_word_count.toLocaleString()}</div>
                      <div><strong>Total Chunks:</strong> {editableChunks.length}</div>
                    </div>
                  </div>

                  <div className="max-h-[600px] overflow-y-auto space-y-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
                    {(() => {
                      // Group chunks by source URL
                      const groupedChunks: { [key: string]: ChunkData[] } = {};
                      editableChunks.forEach((chunk, index) => {
                        const url = String(chunk.source_url || crawledData.url);
                        if (!groupedChunks[url]) {
                          groupedChunks[url] = [];
                        }
                        groupedChunks[url].push({ ...chunk, originalIndex: index });
                      });

                      return Object.entries(groupedChunks).map(([url, chunks]) => (
                        <div key={url} className="bg-white border-2 border-blue-200 rounded-lg p-4">
                          <div className="mb-3 pb-2 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 text-sm mb-1">
                                  📄 {chunks[0].source_title || 'Page'}
                                </h4>
                                <a 
                                  href={url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline truncate block"
                                >
                                  {url}
                                </a>
                              </div>
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded ml-2">
                                {chunks.length} chunk{chunks.length > 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-3">
                            {chunks.map((chunk) => (
                              <div key={chunk.originalIndex} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium bg-gray-200 text-gray-700 px-2 py-1 rounded">
                                      #{(chunk.originalIndex ?? 0) + 1}
                                    </span>
                                    <span className="text-xs text-gray-600">
                                      {chunk.text.split(' ').length} words • {chunk.text.length} chars
                                    </span>
                                    {chunk.quality_score && (
                                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                                        chunk.quality_score >= 70 ? 'bg-green-100 text-green-800' :
                                        chunk.quality_score >= 50 ? 'bg-blue-100 text-blue-800' :
                                        'bg-yellow-100 text-yellow-800'
                                      }`}>
                                        Quality: {Math.round(chunk.quality_score)}%
                                      </span>
                                    )}
                                    {chunk.text.match(/[.!?]/) && (
                                      <span className="text-xs text-green-600">
                                        ✓ Complete sentences
                                      </span>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => {
                                      const newChunks = editableChunks.filter((_, i) => i !== chunk.originalIndex);
                                      setEditableChunks(newChunks);
                                    }}
                                    className="text-red-600 hover:text-red-800 text-xs font-medium"
                                  >
                                    ✕ Remove
                                  </button>
                                </div>
                                <Textarea
                                  value={chunk.text}
                                  onChange={(e) => {
                                    const newChunks = [...editableChunks];
                                    const idx = chunk.originalIndex ?? 0;
                                    newChunks[idx] = { ...newChunks[idx], text: e.target.value };
                                    setEditableChunks(newChunks);
                                  }}
                                  rows={5}
                                  className="text-sm font-mono"
                                  placeholder="Edit chunk content..."
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>

                  <div className="flex gap-3 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setCrawledData(null);
                        setEditableChunks([]);
                        setShowPreview(false);
                        setUploadStatus('idle');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleSubmitChunks}
                      disabled={isSubmitting || editableChunks.length === 0}
                      className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white flex items-center gap-2"
                    >
                      {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                      💾 Submit & Save {editableChunks.length} Chunks
                    </Button>
                  </div>
                </div>
              )}

              {/* Upload Status */}
              {uploadStatus !== 'idle' && (
                <div className={`p-4 rounded-md ${
                  uploadStatus === 'success' ? 'bg-green-50 border border-green-200' :
                  uploadStatus === 'error' ? 'bg-red-50 border border-red-200' :
                  'bg-blue-50 border border-blue-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {uploadStatus === 'uploading' && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
                    {uploadStatus === 'success' && <CheckCircle className="w-4 h-4 text-green-600" />}
                    {uploadStatus === 'error' && <AlertCircle className="w-4 h-4 text-red-600" />}
                    <span className={`text-sm font-medium ${
                      uploadStatus === 'success' ? 'text-green-800' :
                      uploadStatus === 'error' ? 'text-red-800' :
                      'text-blue-800'
                    }`}>
                      {uploadStatus === 'uploading' ? 'Processing...' :
                       uploadStatus === 'success' ? 'Success!' :
                       'Error'}
                    </span>
                  </div>
                  {uploadMessage && (
                    <p className={`text-sm mt-1 ${
                      uploadStatus === 'success' ? 'text-green-700' :
                      uploadStatus === 'error' ? 'text-red-700' :
                      'text-blue-700'
                    }`}>
                      {uploadMessage}
                    </p>
                  )}
                  
                  {/* Progress Bar */}
                  {uploadStatus === 'uploading' && saveProgress.total > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-blue-700 mb-1">
                        <span>Progress: {saveProgress.current} / {saveProgress.total} chunks</span>
                        <span className="font-semibold">
                          {Math.round((saveProgress.current / saveProgress.total) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${(saveProgress.current / saveProgress.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      )}

        {/* Knowledge Items */}
        {selectedWidget && (
          <div className="grid grid-cols-1 gap-4">
            {filteredItems.length === 0 ? (
              <Card className="bg-white/95 backdrop-blur-md border-0 shadow-md">
                <CardContent className="text-center py-12">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-10 h-10 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Articles Found</h3>
                  <p className="text-gray-600 mb-4 max-w-md mx-auto font-light">
                    {searchTerm 
                      ? 'No articles match your search criteria.' 
                      : 'Get started by adding your first knowledge base article for this widget.'
                    }
                  </p>
                  {!searchTerm && (
                    <Button
                      onClick={() => {
                        setShowAddForm(true);
                        setEditingItem(null);
                        setFormData({ 
                          title: '', 
                          content: '', 
                          tags: '', 
                          type: 'manual' as 'manual' | 'text' | 'pdf' | 'website' | 'faq', 
                          file: null,
                          websiteUrl: '',
                          isSitemap: false,
                          question: '',
                          answer: ''
                        });
                      }}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white flex items-center gap-2 shadow-md hover:shadow-lg transition-all rounded-xl"
                      disabled={!selectedWidget}
                    >
                      <Plus className="w-4 h-4" />
                      Add Article
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
            filteredItems.map((item) => (
              <Card key={item.id} className="bg-white/95 backdrop-blur-md border-0 shadow-md hover:shadow-lg transition-all duration-200">
                <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                      {item.type === 'website' && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                          Website
                        </Badge>
                      )}
                      {item.type === 'pdf' && (
                        <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                          PDF
                        </Badge>
                      )}
                      {item.type === 'text' && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                          Text
                        </Badge>
                      )}
                      {item.type === 'faq' && (
                        <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                          FAQ
                        </Badge>
                      )}
                    </div>
                    
                    {item.type === 'website' && item.websiteUrl && (
                      <p className="text-sm text-blue-600 mb-2">
                        <a href={item.websiteUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {item.websiteUrl}
                        </a>
                      </p>
                    )}
                    
                    <p className="text-gray-600 mb-3 line-clamp-2">
                      {item.content.substring(0, 200)}
                      {item.content.length > 200 && '...'}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Updated {new Date(item.updatedAt).toLocaleDateString()}</span>
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex gap-1">
                          {item.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(item)}
                        disabled={item.type === 'website'} // Disable editing for scraped websites
                        className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:bg-red-50 hover:border-red-300 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                </div>
              </CardContent>
            </Card>
          ))
          )}
          </div>
        )}

        {/* Delete All Data Confirmation Dialog */}
        {showDeleteAllDialog && (
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 border-2 border-red-200 pointer-events-auto">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete All Data</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700 mb-3">
                  Are you sure you want to delete <strong>ALL</strong> knowledge base data for this widget?
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800 font-medium mb-1">This will permanently delete:</p>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li>• All articles and content from Qdrant</li>
                    <li>• All scraped website data from Firestore</li>
                    <li>• All knowledge chunks and metadata</li>
                    <li>• {knowledgeItems.length} current articles</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={handleDeleteAllData}
                  disabled={deleteAllLoading}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium shadow-lg"
                >
                  {deleteAllLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Yes, Delete All Data
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setShowDeleteAllDialog(false)}
                  disabled={deleteAllLoading}
                  variant="outline"
                  className="flex-1 bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50 font-medium"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

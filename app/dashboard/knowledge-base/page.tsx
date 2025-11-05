'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/workspace-auth-context';
import { sendArticleNotificationEmail } from '../../lib/email-client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingDialog } from '../../components/ui/loading-dialog';
import AddArticleDialog from '../../components/knowledge-base/AddArticleDialog';
import { 
  Database, 
  Plus, 
  Search, 
  FileText, 
  Trash2, 
  Edit,
  Loader2,
  CheckCircle,
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



// eslint-disable-next-line @typescript-eslint/no-unused-vars
const documentTypes = [
  { value: 'manual', label: 'Manual Text Entry', description: 'Type or paste content directly' },
  { value: 'faq', label: 'FAQ / Q&A', description: 'Add question and answer pairs' },
  { value: 'notion', label: 'Notion Page/Database', description: 'Import content from Notion workspace' },
  { value: 'text', label: 'Text File Upload', description: 'Upload .txt, .md, or other text files' },
  { value: 'pdf', label: 'PDF Document', description: 'Upload PDF files with text extraction' },
  { value: 'website', label: 'Website Scraping', description: 'Scrape content from a website URL' }
] as const;

export default function KnowledgeBasePage() {
  const { user, workspaceContext } = useAuth();
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);
  const [widgets, setWidgets] = useState<ChatWidget[]>([]);
  const [selectedWidget, setSelectedWidget] = useState<string>('');
  const [totalChunks] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [uploadMessage, setUploadMessage] = useState('');
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [deleteAllLoading, setDeleteAllLoading] = useState(false);
  const [showSecretButton] = useState(false);
  const [cleanPineconeLoading, setCleanPineconeLoading] = useState(false);
  const [crawledData, setCrawledData] = useState<{
    url: string;
    total_pages: number;
    crawl_method: string;
    total_word_count: number;
    chunks: ChunkData[];
    [key: string]: unknown;
  } | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showPreview, setShowPreview] = useState(false);
  const [editableChunks, setEditableChunks] = useState<ChunkData[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [saveProgress, setSaveProgress] = useState({ current: 0, total: 0 });

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: '',
    type: 'faq' as 'faq' | 'text' | 'pdf' | 'website' | 'notion',
    file: null as File | null,
    websiteUrl: '',
    isSitemap: false,
    question: '',
    answer: '',
    notionApiKey: '',
    notionPageId: '',
    notionImportType: 'page' as 'page' | 'database'
  });
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [notionPages, setNotionPages] = useState<Array<{id: string, title: string, url: string}>>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [notionSearching, setNotionSearching] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [notionConnected, setNotionConnected] = useState(false);

  // Helper function to send article notification email
  const sendArticleEmail = async (articleTitle: string, articleType: string, chunksCount?: number) => {
    try {
      if (user?.email) {
        const widgetName = widgets.find(w => w.id === selectedWidget)?.name;
        
        await sendArticleNotificationEmail({
          email: user.email,
          userName: user.displayName || user.email,
          articleTitle,
          articleType,
          widgetName,
          chunksCount
        });
        
        console.log('✅ Article notification email sent');
      }
    } catch (error) {
      console.error('❌ Error sending article notification:', error);
      // Don't block the main flow if email fails
    }
  };

  useEffect(() => {
    if (user && workspaceContext?.currentWorkspace?.id) {
      loadWidgets();
    } else {
      setIsLoading(false);
      setInitialLoadComplete(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, workspaceContext]);

  useEffect(() => {
    if (selectedWidget) {
      loadKnowledgeItems();
    } else {
      setKnowledgeItems([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWidget]);

  const loadWidgets = async () => {
    if (!user?.uid || !workspaceContext?.currentWorkspace?.id) {
      return;
    }

    try {
      const businessId = workspaceContext?.currentWorkspace?.id;
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
      const businessId = workspaceContext?.currentWorkspace?.id;
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleNotionConnect = async () => {
    if (!formData.notionApiKey.trim()) {
      alert('Please enter your Notion API key');
      return;
    }
    
    try {
      setNotionSearching(true);
      setUploadStatus('uploading');
      setUploadMessage('Testing Notion connection...');
      
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://git-branch-m-main.onrender.com';
      const response = await fetch(`${backendUrl}/api/notion/test-connection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: formData.notionApiKey })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setNotionConnected(true);
        setUploadStatus('success');
        setUploadMessage(`Connected to Notion! User: ${result.user || 'Unknown'}`);
        
        // Fetch available pages
        handleNotionSearch('');
      } else {
        setUploadStatus('error');
        setUploadMessage(`Connection failed: ${result.error || 'Invalid API key'}`);
      }
    } catch (error) {
      setUploadStatus('error');
      setUploadMessage(`Error: ${error instanceof Error ? error.message : 'Failed to connect'}`);
    } finally {
      setNotionSearching(false);
    }
  };

  const handleNotionSearch = async (query: string = '') => {
    if (!formData.notionApiKey.trim()) return;
    
    try {
      setNotionSearching(true);
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://git-branch-m-main.onrender.com';
      
      const response = await fetch(`${backendUrl}/api/notion/search-pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: formData.notionApiKey,
          query: query
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setNotionPages(result.pages || []);
        console.log(`📄 Found ${result.total} Notion pages`);
      } else {
        console.error('Failed to search Notion pages:', result.error);
      }
    } catch (error) {
      console.error('Error searching Notion:', error);
    } finally {
      setNotionSearching(false);
    }
  };

  type KnowledgeBaseFormData = {
    title: string;
    content: string;
    tags: string;
    type: 'faq' | 'text' | 'pdf' | 'website' | 'notion';
    file: File | null;
    websiteUrl: string;
    isSitemap: boolean;
    question: string;
    answer: string;
    notionApiKey: string;
    notionPageId: string;
    notionImportType: 'page' | 'database';
  };

  const handleSubmitWithData = async (data: KnowledgeBaseFormData, e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedWidget) {
      alert('Please select a widget first');
      return;
    }

    try {
      setIsSubmitting(true);
      setUploadStatus('uploading');

      let content = data.content;
      const fileName = '';
      const fileSize = 0;

      // Handle FAQ
      if (data.type === 'faq') {
        if (!data.question?.trim() || !data.answer?.trim()) {
          alert('Please enter both question and answer');
          return;
        }

        // Format FAQ content
        content = `Q: ${data.question.trim()}\n\nA: ${data.answer.trim()}`;
        
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
          title: data.title || data.question.substring(0, 50),
          question: data.question.trim(),
          answer: data.answer.trim(),
          type: 'faq',
          embedding_provider: embeddingProvider,
          embedding_model: embeddingModel,
          metadata: {
            business_id: workspaceContext?.currentWorkspace?.id ?? '',
            tags: typeof data.tags === 'string' 
              ? data.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
              : Array.isArray(data.tags) 
                ? data.tags 
                : []
          }
        };

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://git-branch-m-main.onrender.com';
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
          // Backend stored in Qdrant successfully
          // Now create ONLY Firestore record (without Qdrant duplicate)
          const { collection: firestoreCollection, addDoc, serverTimestamp } = await import('firebase/firestore');
          const { db } = await import('@/app/lib/firebase');
          
          const docData = {
            businessId: workspaceContext!.currentWorkspace!.id,
            widgetId: selectedWidget,
            title: data.title || data.question.substring(0, 50),
            content: content, // Already formatted as Q: ... A: ...
            type: 'text', // Store FAQs as text type for consistency
            faqQuestion: data.question,
            faqAnswer: data.answer,
            embeddingProvider: embeddingProvider,
            embeddingModel: embeddingModel,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          
          await addDoc(firestoreCollection(db, 'knowledgeBase'), docData);
          
          setUploadStatus('success');
          setUploadMessage(`FAQ added to Qdrant and saved to Firestore successfully!`);
          
          // Send email notification
          await sendArticleEmail(data.title || data.question.substring(0, 50), 'faq');
          
          // Reload knowledge items
          await loadKnowledgeItems();
          
          // Reset form
          setFormData({ 
            title: '', 
            content: '', 
            tags: '', 
            type: 'faq' as 'faq' | 'text' | 'pdf' | 'website' | 'notion', 
            file: null,
            websiteUrl: '',
            isSitemap: false,
            question: '',
            answer: '',
            notionApiKey: '',
            notionPageId: '',
            notionImportType: 'page' as 'page' | 'database'
          });
          setShowAddForm(false);
          setEditingItem(null);
          setIsSubmitting(false);
          return;
        } else {
          throw new Error(faqResult.error || 'FAQ storage failed');
        }
      }

      // Handle Notion import
      if (data.type === 'notion') {
        if (!data.notionApiKey?.trim()) {
          alert('Please enter your Notion API key');
          return;
        }
        
        if (!data.notionPageId?.trim()) {
          alert('Please select a Notion page or enter a page/database ID');
          return;
        }
        
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://git-branch-m-main.onrender.com';
        const selectedWidgetObj = widgets.find(w => w.id === selectedWidget);
        const embeddingProvider = (selectedWidgetObj?.aiConfig as {embeddingProvider?: string})?.embeddingProvider || 'openai';
        const embeddingModel = (selectedWidgetObj?.aiConfig as {embeddingModel?: string})?.embeddingModel || 'text-embedding-3-large';
        
        setUploadMessage('Importing from Notion...');
        
        const endpoint = data.notionImportType === 'database' 
          ? '/api/notion/import-database'
          : '/api/notion/import-page';
        
        const notionRequest = {
          api_key: data.notionApiKey,
          [data.notionImportType === 'database' ? 'database_id' : 'page_id']: data.notionPageId,
          widget_id: selectedWidget,
          title: data.title,
          embedding_provider: embeddingProvider,
          embedding_model: embeddingModel,
          metadata: {
            business_id: workspaceContext?.currentWorkspace?.id ?? ''
          }
        };
        
        const notionResponse = await fetch(`${backendUrl}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(notionRequest)
        });
        
        if (!notionResponse.ok) {
          const errorData = await notionResponse.json();
          throw new Error(errorData.detail || 'Failed to import from Notion');
        }
        
        const notionResult = await notionResponse.json();
        
        if (notionResult.success) {
          // Create Firestore record
          const { collection: firestoreCollection, addDoc, serverTimestamp } = await import('firebase/firestore');
          const { db } = await import('@/app/lib/firebase');
          
          const docData = {
            businessId: workspaceContext!.currentWorkspace!.id,
            widgetId: selectedWidget,
            title: notionResult.title || data.title,
            content: `Notion ${data.notionImportType === 'database' ? 'database' : 'page'} imported: ${notionResult.title || data.title}`,
            type: 'text',
            notionPageId: data.notionPageId,
            notionUrl: notionResult.url,
            chunksCreated: notionResult.chunks_created,
            embeddingProvider: embeddingProvider,
            embeddingModel: embeddingModel,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          
          await addDoc(firestoreCollection(db, 'knowledgeBase'), docData);
          
          setUploadStatus('success');
          if (data.notionImportType === 'database') {
            setUploadMessage(`✅ Imported ${notionResult.imported || 0} pages from Notion database!`);
          } else {
            setUploadMessage(`✅ Imported Notion page with ${notionResult.chunks_created || 0} chunks!`);
          }
          
          // Send email notification
          await sendArticleEmail(notionResult.title || data.title, 'notion', notionResult.chunks_created);
          
          // Reload knowledge items
          await loadKnowledgeItems();
          
          // Reset form
          setFormData({ 
            title: '', 
            content: '', 
            tags: '', 
            type: 'faq' as 'faq' | 'text' | 'pdf' | 'website' | 'notion', 
            file: null,
            websiteUrl: '',
            isSitemap: false,
            question: '',
            answer: '',
            notionApiKey: '',
            notionPageId: '',
            notionImportType: 'page' as 'page' | 'database'
          });
          setNotionPages([]);
          setNotionConnected(false);
          setShowAddForm(false);
          setEditingItem(null);
          setIsSubmitting(false);
          return;
        } else {
          throw new Error(notionResult.error || 'Notion import failed');
        }
      }

      // Handle website scraping
      if (data.type === 'website') {
        if (!data.websiteUrl?.trim()) {
          alert('Please enter a website URL');
          return;
        }

        const crawlRequest = {
          url: data.websiteUrl,
          widget_id: selectedWidget,
          title: data.title,
          max_pages: 100,
          max_depth: 3,
          is_sitemap: data.isSitemap,
          metadata: {
            business_id: workspaceContext?.currentWorkspace?.id ?? ''
          }
        };

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://git-branch-m-main.onrender.com';
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
      if ((data.type === 'pdf' || data.type === 'text') && data.file) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', data.file);
        uploadFormData.append('widget_id', selectedWidget);
        uploadFormData.append('title', data.title);
        uploadFormData.append('document_type', data.type);
        
        // Get widget's embedding configuration
        const selectedWidgetObj = widgets.find(w => w.id === selectedWidget);
        const embeddingProvider = (selectedWidgetObj?.aiConfig as {embeddingProvider?: string})?.embeddingProvider || 'openai';
        const embeddingModel = (selectedWidgetObj?.aiConfig as {embeddingModel?: string})?.embeddingModel || 'text-embedding-3-large';
        
        uploadFormData.append('embedding_provider', embeddingProvider);
        uploadFormData.append('embedding_model', embeddingModel);
        uploadFormData.append('metadata', JSON.stringify({
          business_id: workspaceContext?.currentWorkspace?.id ?? ''
        }));

        // Upload file to backend
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://git-branch-m-main.onrender.com';
        const uploadResponse = await fetch(`${backendUrl}/api/knowledge-base/upload`, {
          method: 'POST',
          body: uploadFormData,
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.detail || 'Failed to upload file');
        }

        const uploadResult = await uploadResponse.json();
        
        if (uploadResult.success) {
          // Backend stored in Qdrant successfully
          // Now create ONLY Firestore record (without Qdrant duplicate)
          const { collection: firestoreCollection, addDoc, serverTimestamp } = await import('firebase/firestore');
          const { db } = await import('@/app/lib/firebase');
          
          const docData = {
            businessId: workspaceContext!.currentWorkspace!.id,
            widgetId: selectedWidget,
            title: data.title,
            content: `${data.type.toUpperCase()} file uploaded: ${data.file.name} (${(data.file.size / 1024 / 1024).toFixed(2)} MB)`,
            type: data.type,
            fileName: data.file.name,
            fileSize: data.file.size,
            embeddingProvider: embeddingProvider,
            embeddingModel: embeddingModel,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          
          await addDoc(firestoreCollection(db, 'knowledgeBase'), docData);
          
          setUploadStatus('success');
          setUploadMessage(`${data.type.toUpperCase()} file uploaded to Qdrant and saved to Firestore successfully!`);
          
          // Send email notification
          await sendArticleEmail(data.title, data.type);
          
          // Reload knowledge items
          await loadKnowledgeItems();
          
          // Reset form
          setFormData({ 
            title: '', 
            content: '', 
            tags: '', 
            type: 'faq' as 'faq' | 'text' | 'pdf' | 'website' | 'notion', 
            file: null,
            websiteUrl: '',
            isSitemap: false,
            question: '',
            answer: '',
            notionApiKey: '',
            notionPageId: '',
            notionImportType: 'page' as 'page' | 'database'
          });
          setShowAddForm(false);
          setEditingItem(null);
          setIsSubmitting(false);
          return;
        } else {
          throw new Error(uploadResult.error || 'Upload failed');
        }
      } else if ((data.type === 'pdf' || data.type === 'text') && !data.file) {
        alert(`Please select a ${data.type.toUpperCase()} file to upload`);
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
        title: data.title,
        content: content,
        type: data.type as 'text' | 'pdf' | 'website',
        fileName: fileName || undefined,
        fileSize: fileSize || undefined,
        embeddingProvider: embeddingProvider,
        embeddingModel: embeddingModel
      };

      let result;
      if (editingItem) {
        const knowledgeData: Partial<KnowledgeBaseItem> = {
          title: data.title,
          content: content,
          type: data.type as 'text' | 'pdf' | 'website',
          fileName: fileName || undefined,
          fileSize: fileSize || undefined,
        };
        result = await updateKnowledgeBaseItem(editingItem.id, knowledgeData);
      } else {
        result = await createKnowledgeBaseItem(workspaceContext!.currentWorkspace!.id, selectedWidget, itemData);
      }

      if (result.success) {
        // Reload knowledge items to get the updated list
        await loadKnowledgeItems();
        
        // Reset form
        setFormData({ 
          title: '', 
          content: '', 
          tags: '', 
          type: 'faq' as 'faq' | 'text' | 'pdf' | 'website' | 'notion', 
          file: null,
          websiteUrl: '',
          isSitemap: false,
          question: '',
          answer: '',
          notionApiKey: '',
          notionPageId: '',
          notionImportType: 'page' as 'page' | 'database'
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

  // Keep original handleSubmit for backward compatibility
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSubmit = async (e: React.FormEvent) => {
    await handleSubmitWithData(formData, e);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSubmitChunks = async () => {
    if (!crawledData || !editableChunks.length) return;
    
    try {
      setIsSubmitting(true);
      setUploadStatus('uploading');
      setSaveProgress({ current: 0, total: editableChunks.length });
      
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://git-branch-m-main.onrender.com';
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
            business_id: workspaceContext?.currentWorkspace?.id ?? ''
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
        type: 'faq' as 'faq' | 'text' | 'pdf' | 'website' | 'notion', 
        file: null,
        websiteUrl: '',
        isSitemap: false,
        question: '',
        answer: '',
        notionApiKey: '',
        notionPageId: '',
        notionImportType: 'page' as 'page' | 'database'
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
      type: 'faq' as 'faq' | 'text' | 'pdf' | 'website' | 'notion',
      file: null,
      websiteUrl: '',
      isSitemap: false,
      question: '',
      answer: '',
      notionApiKey: '',
      notionPageId: '',
      notionImportType: 'page' as 'page' | 'database'
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this knowledge item? This will remove it from both Firestore and Qdrant vector database.')) {
      return;
    }
    
    try {
      setUploadStatus('uploading');
      setUploadMessage('Deleting from Firestore and Qdrant...');
      
      let qdrantChunksDeleted = 0;
      
      // Step 1: Delete from Qdrant FIRST (all vector chunks with this itemId)
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://git-branch-m-main.onrender.com';
        console.log(`🗑️ Deleting all vector chunks for itemId: ${id} from Qdrant...`);
        
        const qdrantResponse = await fetch(`${backendUrl}/api/knowledge-base/delete/${id}`, {
          method: 'DELETE',
        });
        
        if (qdrantResponse.ok) {
          const qdrantResult = await qdrantResponse.json();
          qdrantChunksDeleted = qdrantResult.deleted_chunks || 0;
          console.log(`✅ Deleted ${qdrantChunksDeleted} vector chunks from Qdrant`);
          setUploadMessage(`Deleted ${qdrantChunksDeleted} vectors from Qdrant. Now deleting from Firestore...`);
        } else {
          const errorData = await qdrantResponse.json();
          console.warn('Failed to delete from Qdrant:', errorData);
          setUploadMessage('Qdrant deletion failed, continuing with Firestore deletion...');
        }
      } catch (qdrantError) {
        console.warn('Could not delete from Qdrant:', qdrantError);
        setUploadMessage('Qdrant deletion failed, continuing with Firestore deletion...');
      }
      
      // Step 2: Delete from Firestore
      const { deleteKnowledgeBaseItem } = await import('@/app/lib/knowledge-base-utils');
      const firestoreResult = await deleteKnowledgeBaseItem(id);
      
      if (!firestoreResult.success) {
        throw new Error(`Failed to delete from Firestore: ${firestoreResult.error}`);
      }
      
      console.log(`✅ Deleted from Firestore`);
      
      // Update local state
      setKnowledgeItems(prev => prev.filter(item => item.id !== id));
      
      setUploadStatus('success');
      setUploadMessage(
        qdrantChunksDeleted > 0 
          ? `Item deleted successfully! Removed ${qdrantChunksDeleted} vector chunks from Qdrant and record from Firestore.`
          : 'Item deleted from Firestore successfully!'
      );
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setUploadStatus('idle');
        setUploadMessage('');
      }, 3000);
      
    } catch (error) {
      console.error('Error deleting knowledge item:', error);
      setUploadStatus('error');
      setUploadMessage(`Error: ${error instanceof Error ? error.message : 'Failed to delete item'}`);
      
      // Clear error after 5 seconds
      setTimeout(() => {
        setUploadStatus('idle');
        setUploadMessage('');
      }, 5000);
    }
  };

  const handleDeleteAllData = async () => {
    if (!workspaceContext?.currentWorkspace?.id) {
      alert('No workspace context available');
      return;
    }

    try {
      setDeleteAllLoading(true);
      setUploadStatus('uploading');
      setUploadMessage('Deleting all data from Qdrant and Firestore...');

      const businessId = workspaceContext?.currentWorkspace?.id;
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://git-branch-m-main.onrender.com';

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

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://git-branch-m-main.onrender.com';

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
      <div className="fixed inset-0 bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center z-50">
        <LoadingDialog 
          open={true}
          message="Loading Knowledge Base" 
          submessage="Loading your articles and content..."
        />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="w-full h-full px-6 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 md:py-4 pt-28">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <h1 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-foreground flex items-center gap-1 sm:gap-2 truncate">
                <Database className="w-3 h-3 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                <span className="truncate">Knowledge Base</span>
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">Manage your AI knowledge content</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-wrap">
            <Button
              onClick={() => {
                setShowAddForm(true);
                setEditingItem(null);
                setFormData({ 
                  title: '', 
                  content: '', 
                  tags: '', 
                  type: 'faq' as 'faq' | 'text' | 'pdf' | 'website' | 'notion', 
                  file: null,
                  websiteUrl: '',
                  isSitemap: false,
                  question: '',
                  answer: '',
                  notionApiKey: '',
                  notionPageId: '',
                  notionImportType: 'page' as 'page' | 'database'
                });
              }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2 shadow-sm hover:shadow-md transition-all rounded-lg px-3 sm:px-4 h-7 sm:h-8"
              disabled={!selectedWidget}
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Add Article</span>
              <span className="sm:hidden">Add</span>
            </Button>

            <Button
              onClick={() => setShowDeleteAllDialog(true)}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground flex items-center gap-2 shadow-sm hover:shadow-md transition-all rounded-lg px-3 sm:px-4 h-7 sm:h-8"
              disabled={!selectedWidget || knowledgeItems.length === 0}
              title={knowledgeItems.length === 0 ? "No data to delete" : "Delete all knowledge base data"}
            >
              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Delete All</span>
              <span className="sm:hidden">Delete</span>
            </Button>

            {/* Secret Clean Qdrant Button */}
            {showSecretButton && (
              <Button
                onClick={handleCleanQdrant}
                disabled={cleanPineconeLoading}
                className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2 shadow-sm hover:shadow-md transition-all rounded-lg px-3 sm:px-4 h-7 sm:h-8 animate-pulse"
                title="🚨 DANGER: Cleans entire Qdrant collection - affects ALL users!"
              >
                {cleanPineconeLoading ? (
                  <>
                    <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                    <span className="hidden sm:inline">Cleaning...</span>
                  </>
                ) : (
                  <>
                    <Database className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Clean Qdrant</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Widget Selection - Minimal */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-6 h-6 bg-primary/10 rounded flex items-center justify-center">
            <Database className="w-3 h-3 text-primary" />
          </div>
          <span className="text-sm font-medium text-foreground">Select Widget:</span>
          
          <Select
            value={selectedWidget}
            onValueChange={setSelectedWidget}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Choose a widget" />
            </SelectTrigger>
            <SelectContent>
              {widgets.map(widget => (
                <SelectItem key={widget.id} value={widget.id}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{widget.name}</span>
                    <span className="text-muted-foreground text-sm">({widget.id})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedWidget && (
            <Badge variant="secondary" className="bg-accent text-accent-foreground">
              {knowledgeItems.length} articles
            </Badge>
          )}
        </div>

        {/* Stats Cards - Fixed Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <Card className="bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Articles</p>
                  <p className="text-lg sm:text-xl font-bold text-foreground min-h-[28px] flex items-center">
                    {selectedWidget ? knowledgeItems.length : '0'}
                  </p>
                </div>
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Active Articles</p>
                  <p className="text-lg sm:text-xl font-bold text-foreground min-h-[28px] flex items-center">
                    {selectedWidget ? knowledgeItems.filter(item => item.isActive).length : '0'}
                  </p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Chunks</p>
                  <p className="text-lg sm:text-xl font-bold text-foreground min-h-[28px] flex items-center">
                    {selectedWidget ? totalChunks : '0'}
                  </p>
                </div>
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Database className="w-4 h-4 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        {selectedWidget && (
          <div className="mb-4 sm:mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full text-sm bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>
        )}

      {/* Add Article Dialog */}
      <AddArticleDialog
        open={showAddForm && !!selectedWidget}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddForm(false);
            setEditingItem(null);
            setUploadStatus('idle');
            setUploadMessage('');
            // Reset form data when dialog closes
            setFormData({ 
              title: '', 
              content: '', 
              tags: '', 
              type: 'faq' as 'faq' | 'text' | 'pdf' | 'website' | 'notion', 
              file: null,
              websiteUrl: '',
              isSitemap: false,
              question: '',
              answer: '',
              notionApiKey: '',
              notionPageId: '',
              notionImportType: 'page' as 'page' | 'database'
            });
          }
        }}
        onSubmit={async (data) => {
          // Update formData with the data from dialog, ensuring tags is a string
          const updatedData = {
            ...formData,
            ...data,
            tags: Array.isArray(data.tags) ? data.tags.join(', ') : (data.tags || ''),
            type: data.type as 'faq' | 'text' | 'pdf' | 'website' | 'notion',
            notionImportType: (data.notionImportType as 'page' | 'database') || formData.notionImportType
          };
          setFormData(updatedData);

          // Call handleSubmit with the new data directly
          await handleSubmitWithData(updatedData, { preventDefault: () => {} } as React.FormEvent);
        }}
        isSubmitting={isSubmitting}
        editingItem={editingItem}
      />

        {/* Knowledge Items */}
        {selectedWidget && (
          <div className="grid grid-cols-1 gap-4">
            {filteredItems.length === 0 ? (
              <Card className="bg-card border border-border rounded-lg shadow-sm">
                <CardContent className="text-center py-8 sm:py-12">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold text-foreground mb-2">No Articles Found</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-4 max-w-md mx-auto">
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
                          type: 'faq' as 'faq' | 'text' | 'pdf' | 'website' | 'notion', 
                          file: null,
                          websiteUrl: '',
                          isSitemap: false,
                          question: '',
                          answer: '',
                          notionApiKey: '',
                          notionPageId: '',
                          notionImportType: 'page' as 'page' | 'database'
                        });
                      }}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2 shadow-sm hover:shadow-md transition-all rounded-lg px-3 sm:px-4 h-7 sm:h-8"
                      disabled={!selectedWidget}
                    >
                      <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="text-xs sm:text-sm">Add Article</span>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
            filteredItems.map((item) => (
              <Card key={item.id} className="bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-sm sm:text-base font-semibold text-foreground">{item.title}</h3>
                        {item.type === 'website' && (
                          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                            Website
                          </Badge>
                        )}
                        {item.type === 'pdf' && (
                          <Badge variant="secondary" className="text-xs bg-red-100 text-red-700 border-red-200">
                            PDF
                          </Badge>
                        )}
                        {item.type === 'text' && (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200">
                            Text
                          </Badge>
                        )}
                        {item.type === 'faq' && (
                          <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 border-purple-200">
                            FAQ
                          </Badge>
                        )}
                        {item.type === 'notion' && (
                          <Badge variant="secondary" className="text-xs bg-pink-100 text-pink-700 border-pink-200">
                            Notion
                          </Badge>
                        )}
                        <div className={`w-2 h-2 rounded-full ${item.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      </div>
                      
                      {item.type === 'website' && item.websiteUrl && (
                        <p className="text-xs sm:text-sm text-primary mb-2">
                          <a href={item.websiteUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {item.websiteUrl}
                          </a>
                        </p>
                      )}
                      
                      <p className="text-xs sm:text-sm text-muted-foreground mb-3 line-clamp-2">
                        {item.content.substring(0, 200)}
                        {item.content.length > 200 && '...'}
                      </p>
                      
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>Updated {new Date(item.updatedAt).toLocaleDateString()}</span>
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex gap-1">
                            {item.tags.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs bg-accent text-accent-foreground">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(item)}
                        disabled={item.type === 'website'}
                        className="h-7 w-7 p-0 text-primary border-border hover:bg-accent"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        className="h-7 w-7 p-0 text-destructive border-border hover:bg-destructive/10"
                      >
                        <Trash2 className="w-3 h-3" />
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

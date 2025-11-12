'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { LoadingDialog } from '@/app/components/ui/loading-dialog';
import { useAuth } from '@/app/lib/workspace-auth-context';
import { createAgent, addAgentKnowledgeSource } from '@/app/lib/agent-utils';
import { createAgentKnowledgeItem } from '@/app/lib/agent-knowledge-utils';
import { toast } from 'sonner';
import { doc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import { getNotionConnection, disconnectNotion, searchNotionPages, type NotionPage } from '@/app/lib/notion-utils';
import { getGoogleSheetsConnection, listGoogleSheets, type GoogleSpreadsheet } from '@/app/lib/google-sheets-utils';
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  Link, 
  Plus,
  Trash2,
  Check,
  X,
  Globe,
  MessageCircle,
  FileIcon,
  AlignLeft,
  Loader2,
  Bot,
  CheckCircle,
  AlertCircle,
  Link2,
  Map,
  Sheet
} from 'lucide-react';

export default function KnowledgeBasePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const workspaceSlug = params.workspace as string;
  const { workspaceContext } = useAuth();
  
  const [selectedType, setSelectedType] = useState('files');
  const [knowledgeSources, setKnowledgeSources] = useState<Array<{
    id: string;
    type: 'files' | 'text' | 'website' | 'faq' | 'notion' | 'google_sheets';
    content: string;
    title: string;
    files?: File[];
    websiteUrl?: string;
    crawlMethod?: 'individual' | 'sitemap' | 'crawl-links';
    faqs?: Array<{ question: string; answer: string }>;
    notionPages?: Array<{ id: string; title: string; url: string }>;
    notionAccessToken?: string;
    googleSheets?: Array<{ id: string; name: string; url: string }>;
    googleSheetsAccessToken?: string;
  }>>([]);
  const [newSource, setNewSource] = useState({
    type: 'files' as 'files' | 'text' | 'website' | 'faq' | 'notion' | 'google_sheets',
    content: '',
    title: '',
    files: [] as File[],
    websiteUrl: '',
    crawlMethod: 'individual' as 'individual' | 'sitemap' | 'crawl-links',
    faqs: [{ question: '', answer: '' }] as Array<{ question: string; answer: string }>
  });
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const [showAgentDialog, setShowAgentDialog] = useState(false);
  const [agentName, setAgentName] = useState('');
  const [agentDescription, setAgentDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const [notionStatus, setNotionStatus] = useState<{
    connected: boolean;
    workspaceName?: string;
    accessToken?: string;
  }>({ connected: false });
  const [googleSheetsStatus, setGoogleSheetsStatus] = useState<{
    connected: boolean;
    accountEmail?: string;
    accessToken?: string;
  }>({ connected: false });
  const [connectingNotion, setConnectingNotion] = useState(false);
  const [connectingGoogleSheets, setConnectingGoogleSheets] = useState(false);
  const [showDisconnectNotionDialog, setShowDisconnectNotionDialog] = useState(false);
  const [disconnectingNotion, setDisconnectingNotion] = useState(false);
  const [showDisconnectGoogleSheetsDialog, setShowDisconnectGoogleSheetsDialog] = useState(false);
  const [disconnectingGoogleSheets, setDisconnectingGoogleSheets] = useState(false);

  // Notion pages state
  const [notionPages, setNotionPages] = useState<NotionPage[]>([]);
  const [loadingNotionPages, setLoadingNotionPages] = useState(false);
  const [selectedNotionPages, setSelectedNotionPages] = useState<Set<string>>(new Set());

  // Google Sheets state
  const [googleSpreadsheets, setGoogleSpreadsheets] = useState<GoogleSpreadsheet[]>([]);
  const [loadingGoogleSheets, setLoadingGoogleSheets] = useState(false);
  const [selectedGoogleSheets, setSelectedGoogleSheets] = useState<Set<string>>(new Set());

  const sourceTypes = [
    { id: 'files', label: 'Files', icon: FileIcon, description: 'Upload PDF, DOC, TXT files' },
    { id: 'text', label: 'Text', icon: AlignLeft, description: 'Add custom text content' },
    { id: 'website', label: 'Website', icon: Globe, description: 'Scrape website content' },
    { id: 'faq', label: 'FAQ', icon: MessageCircle, description: 'Add Q&A pairs' }
  ];

  const postCreationSourceTypes = [
    { id: 'notion', label: 'Notion', icon: FileText, description: 'Add after agent creation' },
    { id: 'google_sheets', label: 'Google Sheets', icon: Sheet, description: 'Add after agent creation' }
  ];

  useEffect(() => {
    const type = searchParams.get('type');
    if (type && sourceTypes.some(t => t.id === type)) {
      setSelectedType(type);
      setNewSource(prev => ({ ...prev, type: type as 'files' | 'text' | 'website' | 'faq' | 'notion' | 'google_sheets' }));
    } else if (!type) {
      // Set default URL parameter to 'files' when no type is specified
      const url = new URL(window.location.href);
      url.searchParams.set('type', 'files');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams]);

  useEffect(() => {
    if (workspaceContext?.currentWorkspace?.id) {
      checkNotionConnection();
      checkGoogleSheetsConnection();
    }
  }, [workspaceContext?.currentWorkspace?.id]);

  // Handle OAuth callbacks from URL params
  useEffect(() => {
    if (!workspaceContext?.currentWorkspace?.id) return;

    const notionData = searchParams.get('notion_data');
    const notionError = searchParams.get('notion_error');
    const googleSheetsData = searchParams.get('google_sheets_data');
    const googleSheetsError = searchParams.get('google_sheets_error');

    if (notionData) {
      handleNotionCallback(notionData);
    }

    if (notionError) {
      const errorMessages: Record<string, string> = {
        'access_denied': 'You denied access to Notion. Please try again if you want to connect.',
        'missing_code': 'Authorization failed. Please try again.',
        'token_exchange_failed': 'Failed to exchange authorization code. Please try again.',
        'invalid_token': 'Received invalid token from Notion. Please try again.',
        'unknown': 'An unknown error occurred. Please try again.'
      };
      toast.error(errorMessages[notionError] || 'An error occurred during Notion connection.');
      // Clean URL
      const url = new URL(window.location.href);
      url.searchParams.delete('notion_error');
      window.history.replaceState({}, '', url.toString());
    }

    if (googleSheetsData) {
      handleGoogleSheetsCallback(googleSheetsData);
    }

    if (googleSheetsError) {
      const errorMessages: Record<string, string> = {
        'access_denied': 'You denied access to Google Sheets. Please try again if you want to connect.',
        'missing_code': 'Authorization failed. Please try again.',
        'token_exchange_failed': 'Failed to exchange authorization code. Please try again.',
        'invalid_token': 'Received invalid token from Google. Please try again.',
        'unknown': 'An unknown error occurred. Please try again.'
      };
      toast.error(errorMessages[googleSheetsError] || 'An error occurred during Google Sheets connection.');
      // Clean URL
      const url = new URL(window.location.href);
      url.searchParams.delete('google_sheets_error');
      window.history.replaceState({}, '', url.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, workspaceContext?.currentWorkspace?.id]);

  const handleNotionCallback = async (encodedData: string) => {
    if (!workspaceContext?.currentWorkspace?.id) {
      toast.error('Workspace not found');
      return;
    }

    try {
      // Decode the connection data
      const decodedData = JSON.parse(atob(encodedData));

      // Save to Firestore (client-side where user is authenticated)
      const connectionId = `${workspaceContext.currentWorkspace.id}_notion`;
      await setDoc(doc(db, 'notionConnections', connectionId), {
        ...decodedData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Clean URL
      const url = new URL(window.location.href);
      url.searchParams.delete('notion_data');
      window.history.replaceState({}, '', url.toString());

      toast.success('Notion connected successfully!');

      // Wait a bit for Firestore to propagate, then check connection
      setTimeout(async () => {
        await checkNotionConnection();
      }, 500);
    } catch (error) {
      console.error('Error saving Notion connection:', error);
      toast.error('Failed to save Notion connection. Please try again.');
      // Clean URL
      const url = new URL(window.location.href);
      url.searchParams.delete('notion_data');
      window.history.replaceState({}, '', url.toString());
    }
  };

  const handleGoogleSheetsCallback = async (encodedData: string) => {
    if (!workspaceContext?.currentWorkspace?.id) {
      toast.error('Workspace not found');
      return;
    }

    try {
      // Decode the connection data
      const decodedData = JSON.parse(atob(encodedData));

      // Save to Firestore (client-side where user is authenticated)
      const connectionId = `${workspaceContext.currentWorkspace.id}_google_sheets`;
      await setDoc(doc(db, 'googleSheetsConnections', connectionId), {
        ...decodedData,
        workspaceId: workspaceContext.currentWorkspace.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Clean URL
      const url = new URL(window.location.href);
      url.searchParams.delete('google_sheets_data');
      window.history.replaceState({}, '', url.toString());

      toast.success('Google Sheets connected successfully!');

      // Wait a bit for Firestore to propagate, then check connection
      setTimeout(async () => {
        await checkGoogleSheetsConnection();
      }, 500);
    } catch (error) {
      console.error('Error saving Google Sheets connection:', error);
      toast.error('Failed to save Google Sheets connection. Please try again.');
      // Clean URL
      const url = new URL(window.location.href);
      url.searchParams.delete('google_sheets_data');
      window.history.replaceState({}, '', url.toString());
    }
  };

  const checkNotionConnection = async () => {
    if (!workspaceContext?.currentWorkspace?.id) {
      console.log('No workspace ID available for Notion connection check');
      return;
    }

    try {
      console.log('Checking Notion connection for workspace:', workspaceContext.currentWorkspace.id);
      const connection = await getNotionConnection(workspaceContext.currentWorkspace.id);

      if (connection) {
        console.log('Notion connection found:', connection.notionWorkspaceName);
        setNotionStatus({
          connected: true,
          workspaceName: connection.notionWorkspaceName,
          accessToken: connection.accessToken
        });
        // Load pages after confirming connection
        loadNotionPages(connection.accessToken);
      } else {
        console.log('No Notion connection found');
        setNotionStatus({ connected: false });
      }
    } catch (error) {
      console.error('Error checking Notion connection:', error);
      setNotionStatus({ connected: false });
    }
  };

  const loadNotionPages = async (accessToken: string) => {
    setLoadingNotionPages(true);
    try {
      console.log('Loading Notion pages...');
      const result = await searchNotionPages(accessToken);
      if (result.success && result.pages) {
        console.log(`Loaded ${result.pages.length} Notion pages`);
        setNotionPages(result.pages);
      } else {
        console.error('Failed to load Notion pages:', result.error);
        toast.error('Failed to load Notion pages: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error loading Notion pages:', error);
      toast.error('An error occurred while loading Notion pages');
    } finally {
      setLoadingNotionPages(false);
    }
  };

  const checkGoogleSheetsConnection = async () => {
    if (!workspaceContext?.currentWorkspace?.id) {
      console.log('No workspace ID available for Google Sheets connection check');
      return;
    }

    try {
      console.log('Checking Google Sheets connection for workspace:', workspaceContext.currentWorkspace.id);
      const connection = await getGoogleSheetsConnection(workspaceContext.currentWorkspace.id);

      if (connection) {
        console.log('Google Sheets connection found');
        setGoogleSheetsStatus({
          connected: true,
          accessToken: connection.accessToken
        });
        // Load spreadsheets after confirming connection
        loadGoogleSpreadsheets(connection.accessToken);
      } else {
        console.log('No Google Sheets connection found');
        setGoogleSheetsStatus({ connected: false });
      }
    } catch (error) {
      console.error('Error checking Google Sheets connection:', error);
      setGoogleSheetsStatus({ connected: false });
    }
  };

  const loadGoogleSpreadsheets = async (accessToken: string) => {
    setLoadingGoogleSheets(true);
    try {
      console.log('Loading Google Sheets spreadsheets...');
      const result = await listGoogleSheets(accessToken);
      if (result.success && result.spreadsheets) {
        console.log(`Loaded ${result.spreadsheets.length} Google Sheets`);
        setGoogleSpreadsheets(result.spreadsheets);
      } else {
        console.error('Failed to load Google Sheets:', result.error);
        toast.error('Failed to load Google Sheets: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error loading Google Sheets:', error);
      toast.error('An error occurred while loading Google Sheets');
    } finally {
      setLoadingGoogleSheets(false);
    }
  };

  const executeDisconnectNotion = async () => {
    if (!workspaceContext?.currentWorkspace?.id) return;
    setDisconnectingNotion(true);
    try {
      const success = await disconnectNotion(workspaceContext.currentWorkspace.id);
      if (success) {
        toast.success('Notion disconnected successfully');
        setNotionStatus({ connected: false });
        setNotionPages([]);
        setSelectedNotionPages(new Set());
      } else {
        toast.error('Failed to disconnect Notion');
      }
    } catch (error) {
      console.error('Error disconnecting Notion:', error);
      toast.error('An error occurred while disconnecting Notion');
    } finally {
      setDisconnectingNotion(false);
      setShowDisconnectNotionDialog(false);
    }
  };

  const executeDisconnectGoogleSheets = async () => {
    if (!workspaceContext?.currentWorkspace?.id) return;
    setDisconnectingGoogleSheets(true);
    try {
      const connectionId = `${workspaceContext.currentWorkspace.id}_google_sheets`;
      await deleteDoc(doc(db, 'googleSheetsConnections', connectionId));
      toast.success('Google Sheets disconnected successfully');
      setGoogleSheetsStatus({ connected: false });
      setGoogleSpreadsheets([]);
      setSelectedGoogleSheets(new Set());
    } catch (error) {
      console.error('Error disconnecting Google Sheets:', error);
      toast.error('An error occurred while disconnecting Google Sheets');
    } finally {
      setDisconnectingGoogleSheets(false);
      setShowDisconnectGoogleSheetsDialog(false);
    }
  };

  const handleNotionConnect = () => {
    if (!workspaceContext?.currentWorkspace?.id) {
      toast.error('Workspace not found');
      return;
    }

    setConnectingNotion(true);
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://git-branch-m-main.onrender.com';

    // Don't pass redirect_uri to avoid URL parsing issues in backend
    // The callback will be handled by the frontend API route which will use the default redirect logic
    // We'll detect we're in create-new-agent flow by checking the URL params after redirect
    window.location.href = `${backendUrl}/api/notion/oauth/authorize?workspace_id=${workspaceContext.currentWorkspace.id}&agent_id=create-new-agent`;
  };

  const handleGoogleSheetsConnect = () => {
    if (!workspaceContext?.currentWorkspace?.id) {
      toast.error('Workspace not found');
      return;
    }

    setConnectingGoogleSheets(true);
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://git-branch-m-main.onrender.com';

    // Don't pass redirect_uri to avoid URL parsing issues in backend
    // Use special agent_id to indicate create-new-agent flow
    window.location.href = `${backendUrl}/api/google-sheets/oauth/authorize?workspace_id=${workspaceContext.currentWorkspace.id}&agent_id=create-new-agent`;
  };

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    // Reset the form when changing types
    setNewSource({
      type: type as 'files' | 'text' | 'website' | 'faq' | 'notion' | 'google_sheets',
      content: '',
      title: '',
      files: [],
      websiteUrl: '',
      crawlMethod: 'individual',
      faqs: [{ question: '', answer: '' }]
    });
    setSelectedNotionPages(new Set()); // Clear Notion page selection
    setSelectedGoogleSheets(new Set()); // Clear Google Sheets selection

    // Auto-open form if already connected to Notion or Google Sheets
    if ((type === 'notion' && notionStatus.connected) || (type === 'google_sheets' && googleSheetsStatus.connected)) {
      setIsAddingSource(true);
    } else {
      setIsAddingSource(false);
    }

    // Update URL without page reload
    const url = new URL(window.location.href);
    url.searchParams.set('type', type);
    window.history.replaceState({}, '', url.toString());
  };

  const handleAddSource = () => {
    // Validation based on type
    if (!newSource.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (newSource.type === 'files' && newSource.files.length === 0) {
      toast.error('Please select at least one file');
      return;
    }

    if (newSource.type === 'text' && !newSource.content.trim()) {
      toast.error('Please enter text content');
      return;
    }

    if (newSource.type === 'website' && !newSource.websiteUrl.trim()) {
      toast.error('Please enter a website URL');
      return;
    }

    if (newSource.type === 'faq') {
      const validFaqs = newSource.faqs.filter(faq => faq.question.trim() && faq.answer.trim());
      if (validFaqs.length === 0) {
        toast.error('Please add at least one FAQ with both question and answer');
        return;
      }
    }

    // Notion and Google Sheets require connection
    if (newSource.type === 'notion' && !notionStatus.connected) {
      toast.error('Please connect your Notion workspace first');
      return;
    }

    if (newSource.type === 'notion' && selectedNotionPages.size === 0) {
      toast.error('Please select at least one Notion page');
      return;
    }

    if (newSource.type === 'google_sheets' && !googleSheetsStatus.connected) {
      toast.error('Please connect your Google account first');
      return;
    }

    if (newSource.type === 'google_sheets' && selectedGoogleSheets.size === 0) {
      toast.error('Please select at least one Google Sheet');
      return;
    }

    if (newSource.type === 'notion' && !newSource.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (newSource.type === 'google_sheets' && !newSource.title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    
    const source = {
      id: Date.now().toString(),
      type: newSource.type,
      content: newSource.content,
      title: newSource.title,
      files: newSource.files.length > 0 ? [...newSource.files] : undefined,
      websiteUrl: newSource.websiteUrl || undefined,
      crawlMethod: newSource.crawlMethod,
      faqs: newSource.type === 'faq' ? [...newSource.faqs] : undefined,
      notionPages: newSource.type === 'notion' && selectedNotionPages.size > 0
        ? Array.from(selectedNotionPages).map(pageId => {
            const page = notionPages.find(p => p.id === pageId);
            return page ? { id: page.id, title: page.title, url: page.url } : null;
          }).filter(Boolean) as Array<{ id: string; title: string; url: string }>
        : undefined,
      notionAccessToken: newSource.type === 'notion' ? notionStatus.accessToken : undefined,
      googleSheets: newSource.type === 'google_sheets' && selectedGoogleSheets.size > 0
        ? Array.from(selectedGoogleSheets).map(sheetId => {
            const sheet = googleSpreadsheets.find(s => s.id === sheetId);
            return sheet ? { id: sheet.id, name: sheet.name, url: sheet.url } : null;
          }).filter(Boolean) as Array<{ id: string; name: string; url: string }>
        : undefined,
      googleSheetsAccessToken: newSource.type === 'google_sheets' ? googleSheetsStatus.accessToken : undefined
    };

    setKnowledgeSources(prev => [...prev, source]);
    setNewSource({
      type: selectedType as 'files' | 'text' | 'website' | 'faq' | 'notion' | 'google_sheets',
      content: '',
      title: '',
      files: [],
      websiteUrl: '',
      crawlMethod: 'individual',
      faqs: [{ question: '', answer: '' }]
    });
    setSelectedNotionPages(new Set()); // Clear selection
    setSelectedGoogleSheets(new Set()); // Clear Google Sheets selection
    setIsAddingSource(false);
    toast.success('Knowledge source added!');
  };

  const handleRemoveSource = (id: string) => {
    setKnowledgeSources(prev => prev.filter(source => source.id !== id));
  };

  const handleContinue = () => {
    if (knowledgeSources.length === 0) {
      toast.error('Please add at least one knowledge source before continuing.');
      return;
    }
    setShowAgentDialog(true);
  };

  const handleCreateAgent = async () => {
    if (!agentName.trim()) {
      toast.error('Agent name is required.');
      return;
    }

    if (!workspaceContext?.currentWorkspace?.id) {
      console.error('No workspace found:', workspaceContext);
      toast.error('No workspace found. Please try again.');
      return;
    }

    console.log('Creating agent for workspace:', workspaceContext?.currentWorkspace?.id);

    setIsCreatingAgent(true);
    setIsUploading(true);
    setUploadStatus('uploading');
    setUploadMessage('Creating agent...');
    
    // Calculate total items to upload (files, FAQs, Notion pages, and Google Sheets count individually)
    let totalItems = 0;
    knowledgeSources.forEach(source => {
      if (source.type === 'files' && source.files) {
        totalItems += source.files.length;
      } else if (source.type === 'faq' && source.faqs) {
        const validFaqs = source.faqs.filter(faq => faq.question.trim() && faq.answer.trim());
        totalItems += validFaqs.length;
      } else if (source.type === 'notion' && source.notionPages) {
        totalItems += source.notionPages.length;
      } else if (source.type === 'google_sheets' && source.googleSheets) {
        totalItems += source.googleSheets.length;
      } else {
        totalItems += 1;
      }
    });
    
    setUploadProgress({ current: 0, total: totalItems });

    try {
      // Create the agent
      const agentResponse = await createAgent(workspaceContext?.currentWorkspace?.id, {
        name: agentName.trim(),
        description: agentDescription.trim() || undefined
      });

      if (!agentResponse.success) {
        console.error('Agent creation failed:', agentResponse.error);
        throw new Error(agentResponse.error || 'Failed to create agent');
      }

      const agent = agentResponse.data;
      toast.success('Agent created successfully!');
      setUploadMessage('Uploading knowledge sources...');

      let currentItem = 0;

      // Upload knowledge sources
      for (let i = 0; i < knowledgeSources.length; i++) {
        const source = knowledgeSources[i];

        try {
          if (source.type === 'files' && source.files) {
            // Handle multiple files
            for (const file of source.files) {
              currentItem++;
              setUploadProgress({ current: currentItem, total: totalItems });
              setUploadMessage(`Uploading file ${currentItem} of ${totalItems}: ${file.name}...`);

              const sourceResponse = await addAgentKnowledgeSource(agent.id, {
                type: 'files',
                title: `${source.title} - ${file.name}`,
                content: '',
                file: file,
                embeddingProvider: 'voyage',
                embeddingModel: 'voyage-3'
              });

              if (!sourceResponse.success) {
                console.error(`Failed to add file "${file.name}":`, sourceResponse.error);
                toast.error(`Failed to add file "${file.name}"`);
              }
            }
          } else if (source.type === 'text') {
            currentItem++;
            setUploadProgress({ current: currentItem, total: totalItems });
            setUploadMessage(`Uploading text content ${currentItem} of ${totalItems}...`);

            const sourceResponse = await addAgentKnowledgeSource(agent.id, {
              type: 'text',
              title: source.title,
              content: source.content,
              embeddingProvider: 'openai',
              embeddingModel: 'text-embedding-3-large'
            });

            if (!sourceResponse.success) {
              console.error(`Failed to add text "${source.title}":`, sourceResponse.error);
              toast.error(`Failed to add text "${source.title}"`);
            }
          } else if (source.type === 'website') {
            currentItem++;
            setUploadProgress({ current: currentItem, total: totalItems });
            setUploadMessage(`Crawling website ${currentItem} of ${totalItems}...`);

            const sourceResponse = await addAgentKnowledgeSource(agent.id, {
              type: 'website',
              title: source.title,
              content: '',
              websiteUrl: source.websiteUrl,
              embeddingProvider: 'openai',
              embeddingModel: 'text-embedding-3-large'
            });

            if (!sourceResponse.success) {
              console.error(`Failed to add website "${source.title}":`, sourceResponse.error);
              toast.error(`Failed to add website "${source.title}"`);
            }
          } else if (source.type === 'faq' && source.faqs) {
            // Handle FAQ - each Q&A pair is a separate item
            const validFaqs = source.faqs.filter(faq => faq.question.trim() && faq.answer.trim());
            
            for (let j = 0; j < validFaqs.length; j++) {
              const faq = validFaqs[j];
              currentItem++;
              setUploadProgress({ current: currentItem, total: totalItems });
              setUploadMessage(`Uploading FAQ ${j + 1} of ${validFaqs.length}...`);

              const sourceResponse = await addAgentKnowledgeSource(agent.id, {
                type: 'faq',
                title: `${source.title} - Q${j + 1}`,
                content: `Q: ${faq.question}\n\nA: ${faq.answer}`,
                faqQuestion: faq.question,
                faqAnswer: faq.answer,
                embeddingProvider: 'voyage',
                embeddingModel: 'voyage-3'
              });

              if (!sourceResponse.success) {
                console.error(`Failed to add FAQ "${faq.question}":`, sourceResponse.error);
                toast.error(`Failed to add FAQ "${faq.question}"`);
              }
            }
          } else if (source.type === 'notion' && source.notionPages && source.notionAccessToken) {
            // Handle Notion pages - import each selected page
            for (let j = 0; j < source.notionPages.length; j++) {
              const page = source.notionPages[j];
              currentItem++;
              setUploadProgress({ current: currentItem, total: totalItems });
              setUploadMessage(`Importing Notion page ${j + 1} of ${source.notionPages.length}: ${page.title}...`);

              try {
                const result = await createAgentKnowledgeItem(
                  agent.id,
                  workspaceContext?.currentWorkspace?.id || '',
                  {
                    title: page.title,
                    content: `Notion page: ${page.title}`,
                    type: 'notion',
                    notionAccessToken: source.notionAccessToken,
                    notionPageId: page.id,
                    notionUrl: page.url,
                    embeddingProvider: 'voyage',
                    embeddingModel: 'voyage-3'
                  }
                );

                if (!result.success) {
                  console.error(`Failed to import Notion page "${page.title}":`, result.error);
                  toast.error(`Failed to import Notion page "${page.title}"`);
                } else {
                  console.log(`Successfully imported Notion page "${page.title}" with ${result.data.chunksCreated} chunks`);
                }
              } catch (error) {
                console.error(`Error importing Notion page "${page.title}":`, error);
                toast.error(`Error importing Notion page "${page.title}"`);
              }
            }
          } else if (source.type === 'google_sheets' && source.googleSheets && source.googleSheetsAccessToken) {
            // Handle Google Sheets - import each selected spreadsheet
            for (let j = 0; j < source.googleSheets.length; j++) {
              const sheet = source.googleSheets[j];
              currentItem++;
              setUploadProgress({ current: currentItem, total: totalItems });
              setUploadMessage(`Importing Google Sheet ${j + 1} of ${source.googleSheets.length}: ${sheet.name}...`);

              try {
                const result = await createAgentKnowledgeItem(
                  agent.id,
                  workspaceContext?.currentWorkspace?.id || '',
                  {
                    title: sheet.name,
                    content: `Google Sheet: ${sheet.name}`,
                    type: 'google_sheets',
                    googleSheetsAccessToken: source.googleSheetsAccessToken,
                    googleSheetId: sheet.id,
                    embeddingProvider: 'voyage',
                    embeddingModel: 'voyage-3'
                  }
                );

                if (!result.success) {
                  console.error(`Failed to import Google Sheet "${sheet.name}":`, result.error);
                  toast.error(`Failed to import Google Sheet "${sheet.name}"`);
                } else {
                  console.log(`Successfully imported Google Sheet "${sheet.name}" with ${result.data.chunksCreated} chunks`);
                }
              } catch (error) {
                console.error(`Error importing Google Sheet "${sheet.name}":`, error);
                toast.error(`Error importing Google Sheet "${sheet.name}"`);
              }
            }
          } else {
            // Handle any other types
            currentItem++;
            setUploadProgress({ current: currentItem, total: totalItems });
            setUploadMessage(`Uploading ${source.type} ${currentItem} of ${totalItems}...`);

          const sourceResponse = await addAgentKnowledgeSource(agent.id, {
            type: source.type,
            title: source.title,
            content: source.content,
              embeddingProvider: 'openai',
            embeddingModel: 'text-embedding-3-large'
          });

          if (!sourceResponse.success) {
            console.error(`Failed to add source "${source.title}":`, sourceResponse.error);
            toast.error(`Failed to add source "${source.title}"`);
            }
          }
        } catch (sourceError) {
          console.error(`Error adding source "${source.title}":`, sourceError);
          toast.error(`Error adding source "${source.title}"`);
        }
      }

      setUploadStatus('success');
      setUploadMessage(`Agent "${agent.name}" created successfully with ${totalItems} knowledge sources!`);
      toast.success(`Agent "${agent.name}" created successfully! You can now add Notion and Google Sheets sources.`);

      // Navigate to agent's sources page (Notion or general sources)
      setTimeout(() => {
        router.push(`/dashboard/${workspaceSlug}/agents/${agent.id}/sources/notion`);
      }, 1500);
      
    } catch (error) {
      console.error('Error creating agent:', error);
      setUploadStatus('error');
      setUploadMessage(error instanceof Error ? error.message : 'Failed to create agent');
      toast.error(error instanceof Error ? error.message : 'Failed to create agent');
    } finally {
      setIsCreatingAgent(false);
      setIsUploading(false);
    }
  };

  const handleBack = () => {
    window.history.back();
  };

  const renderSourceUI = () => {
    switch (selectedType) {
      case 'files':
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="title" className="text-sm font-medium text-foreground">
                Collection Title *
              </Label>
              <Input
                id="title"
                value={newSource.title}
                onChange={(e) => setNewSource(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter a title for this file collection"
                className="mt-2 rounded-lg border-border"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-foreground">
                Files *
              </Label>
              <div className="mt-2 border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 hover:bg-primary/5 transition-all">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-foreground mb-2">
                  <label htmlFor="file-upload" className="text-primary hover:text-primary/80 cursor-pointer font-medium">
                    Click to upload
                  </label>
                  {' '}or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF, DOC, TXT, MD files up to 10MB
                </p>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.md"
                  onChange={(e) => {
                    const selectedFiles = Array.from(e.target.files || []);
                      setNewSource(prev => ({ 
                        ...prev, 
                      files: [...prev.files, ...selectedFiles],
                      content: selectedFiles.map(f => f.name).join(', ')
                      }));
                  }}
                />
              </div>
            </div>

            {/* Selected Files List */}
            {newSource.files.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">
                  Selected Files ({newSource.files.length})
                </Label>
                <div className="space-y-2">
                  {newSource.files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted/50 border border-border rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setNewSource(prev => ({
                            ...prev,
                            files: prev.files.filter((_, i) => i !== index),
                            content: prev.files.filter((_, i) => i !== index).map(f => f.name).join(', ')
                          }));
                        }}
                        className="p-1 hover:bg-destructive/10 rounded-full transition-colors"
                      >
                        <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      
      case 'text':
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="title" className="text-sm font-medium text-foreground">
                Title *
              </Label>
              <Input
                id="title"
                value={newSource.title}
                onChange={(e) => setNewSource(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter a title for this text"
                className="mt-2 rounded-lg border-border"
              />
            </div>
            <div>
              <Label htmlFor="content" className="text-sm font-medium text-foreground">
                Text Content *
              </Label>
              <Textarea
                id="content"
                value={newSource.content}
                onChange={(e) => setNewSource(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Enter the text content..."
                rows={12}
                className="mt-2 rounded-lg border-border resize-none"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {newSource.content.length} characters
              </p>
            </div>
          </div>
        );
      
      case 'website':
        return (
          <div className="space-y-6">
            {/* Crawl Method Selection */}
            <div>
              <Label className="text-sm font-medium text-foreground mb-3 block">
                Choose Crawl Method
              </Label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setNewSource(prev => ({ ...prev, crawlMethod: 'individual' }))}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    newSource.crawlMethod === 'individual'
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  type="button"
                >
                  <Link2 className={`w-6 h-6 mx-auto mb-2 ${
                    newSource.crawlMethod === 'individual' ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                  <div className="text-sm font-medium">Individual Link</div>
                  <div className="text-xs text-muted-foreground mt-1">Single URL</div>
                </button>

                <button
                  onClick={() => setNewSource(prev => ({ ...prev, crawlMethod: 'sitemap' }))}
                  className={`p-4 rounded-lg border-2 transition-all relative ${
                    newSource.crawlMethod === 'sitemap'
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  type="button"
                >
                  <Badge variant="secondary" className="absolute top-2 right-2 text-xs py-0 h-5">
                    Soon
                  </Badge>
                  <Map className={`w-6 h-6 mx-auto mb-2 ${
                    newSource.crawlMethod === 'sitemap' ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                  <div className="text-sm font-medium">Sitemap</div>
                  <div className="text-xs text-muted-foreground mt-1">XML sitemap</div>
                </button>

                <button
                  onClick={() => setNewSource(prev => ({ ...prev, crawlMethod: 'crawl-links' }))}
                  className={`p-4 rounded-lg border-2 transition-all relative ${
                    newSource.crawlMethod === 'crawl-links'
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  type="button"
                >
                  <Badge variant="secondary" className="absolute top-2 right-2 text-xs py-0 h-5">
                    Soon
                  </Badge>
                  <Globe className={`w-6 h-6 mx-auto mb-2 ${
                    newSource.crawlMethod === 'crawl-links' ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                  <div className="text-sm font-medium">Crawl Links</div>
                  <div className="text-xs text-muted-foreground mt-1">Follow links</div>
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="title" className="text-sm font-medium text-foreground">
                Website Title *
              </Label>
              <Input
                id="title"
                value={newSource.title}
                onChange={(e) => setNewSource(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter website title"
                className="mt-2 rounded-lg border-border"
              />
              <p className="text-xs text-muted-foreground mt-1">
                A descriptive name for this website source
              </p>
            </div>
            <div>
              <Label htmlFor="websiteUrl" className="text-sm font-medium text-foreground">
                {newSource.crawlMethod === 'individual' && 'Website URL *'}
                {newSource.crawlMethod === 'sitemap' && 'Sitemap URL *'}
                {newSource.crawlMethod === 'crawl-links' && 'Starting URL *'}
              </Label>
              <Input
                id="websiteUrl"
                type="url"
                value={newSource.websiteUrl}
                onChange={(e) => setNewSource(prev => ({ ...prev, websiteUrl: e.target.value }))}
                placeholder={
                  newSource.crawlMethod === 'individual' ? 'https://example.com' :
                  newSource.crawlMethod === 'sitemap' ? 'https://example.com/sitemap.xml' :
                  'https://example.com'
                }
                className="mt-2 rounded-lg border-border"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {newSource.crawlMethod === 'individual' && "We'll extract and index the content from this URL"}
                {newSource.crawlMethod === 'sitemap' && "We'll crawl all pages listed in the sitemap"}
                {newSource.crawlMethod === 'crawl-links' && "We'll follow and crawl all links found on this page"}
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                {newSource.crawlMethod === 'individual' && <Link2 className="w-5 h-5 text-blue-600 mt-0.5" />}
                {newSource.crawlMethod === 'sitemap' && <Map className="w-5 h-5 text-blue-600 mt-0.5" />}
                {newSource.crawlMethod === 'crawl-links' && <Globe className="w-5 h-5 text-blue-600 mt-0.5" />}
                <div className="flex-1 text-sm text-blue-900">
                  <p className="font-semibold mb-1">
                    {newSource.crawlMethod === 'individual' && 'Individual Link Crawling'}
                    {newSource.crawlMethod === 'sitemap' && 'Sitemap Crawling (Coming Soon)'}
                    {newSource.crawlMethod === 'crawl-links' && 'Link Crawling (Coming Soon)'}
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-blue-800">
                    {newSource.crawlMethod === 'individual' && (
                      <>
                        <li>Extracts content from a single URL</li>
                        <li>Best for specific pages or articles</li>
                        <li>Fastest processing time</li>
                      </>
                    )}
                    {newSource.crawlMethod === 'sitemap' && (
                      <>
                        <li>Crawls all URLs from your sitemap.xml</li>
                        <li>Best for complete site indexing</li>
                        <li>Processes multiple pages automatically</li>
                      </>
                    )}
                    {newSource.crawlMethod === 'crawl-links' && (
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
          </div>
        );
      
      case 'faq':
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="title" className="text-sm font-medium text-foreground">
                FAQ Collection Title *
              </Label>
              <Input
                id="title"
                value={newSource.title}
                onChange={(e) => setNewSource(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Product FAQ, Support FAQ, Billing Questions"
                className="mt-2 rounded-lg border-border"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-foreground">
                  Questions & Answers *
                </Label>
                <Button
                  onClick={() => setNewSource(prev => ({ 
                    ...prev, 
                    faqs: [...prev.faqs, { question: '', answer: '' }] 
                  }))}
                  variant="outline"
                  size="sm"
                  type="button"
                  className="h-8 px-3 text-primary border-primary/20 hover:bg-primary/5 rounded-lg"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add FAQ
                </Button>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                {newSource.faqs.map((faq, index) => (
                  <div key={index} className="bg-muted/50 rounded-lg p-3 border border-border">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-primary/10 rounded flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-medium text-primary">{index + 1}</span>
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          FAQ #{index + 1}
                        </span>
                      </div>
                      {newSource.faqs.length > 1 && (
                        <button
                          onClick={() => setNewSource(prev => ({
                            ...prev,
                            faqs: prev.faqs.filter((_, i) => i !== index)
                          }))}
                          type="button"
                          className="p-1 hover:bg-destructive/10 rounded transition-colors"
                        >
                          <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
            <div>
                        <Label className="text-xs font-medium text-foreground mb-1 block">
                          Question
                        </Label>
                        <Input
                          value={faq.question}
                          onChange={(e) => {
                            const updated = [...newSource.faqs];
                            updated[index].question = e.target.value;
                            setNewSource(prev => ({ ...prev, faqs: updated }));
                          }}
                          placeholder="What question do customers frequently ask?"
                          className="text-sm rounded-lg border-border"
                        />
                      </div>

                      <div>
                        <Label className="text-xs font-medium text-foreground mb-1 block">
                          Answer
              </Label>
              <Textarea
                          value={faq.answer}
                          onChange={(e) => {
                            const updated = [...newSource.faqs];
                            updated[index].answer = e.target.value;
                            setNewSource(prev => ({ ...prev, faqs: updated }));
                          }}
                          rows={3}
                          placeholder="Provide a clear and helpful answer..."
                          className="text-sm resize-none rounded-lg border-border"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      
      case 'notion':
        return (
          <div className="space-y-6">
            {notionStatus.connected ? (
              <>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold text-green-900 mb-1">Connected to Notion</p>
                      {notionStatus.workspaceName && (
                        <p className="text-sm text-green-800 mb-3">
                          Workspace: <strong>{notionStatus.workspaceName}</strong>
                        </p>
                      )}
                      <p className="text-sm text-green-800 mb-3">
                        Select pages below to add to your agent&apos;s knowledge base.
                      </p>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setShowDisconnectNotionDialog(true)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Disconnect
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="title" className="text-sm font-medium text-foreground">
                    Source Title *
                  </Label>
                  <Input
                    id="title"
                    value={newSource.title}
                    onChange={(e) => setNewSource(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Product Documentation"
                    className="mt-2 rounded-lg border-border"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    A descriptive name for this collection of Notion pages
                  </p>
                </div>

                {/* Notion Pages List */}
                <div>
                  <Label className="text-sm font-medium text-foreground mb-3 block">
                    Select Pages to Import *
                  </Label>
                  {loadingNotionPages ? (
                    <div className="flex items-center justify-center py-8 border border-border rounded-lg">
                      <div className="text-center">
                        <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Loading Notion pages...</p>
                      </div>
                    </div>
                  ) : notionPages.length === 0 ? (
                    <div className="border border-border rounded-lg p-6 text-center">
                      <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No pages found</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Make sure you have shared pages with your Notion integration
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-2 text-sm text-muted-foreground">
                        {selectedNotionPages.size > 0 ? (
                          <span className="font-medium text-primary">
                            {selectedNotionPages.size} page{selectedNotionPages.size !== 1 ? 's' : ''} selected
                          </span>
                        ) : (
                          'Select pages to import'
                        )}
                      </div>
                      <div className="border border-border rounded-lg max-h-80 overflow-y-auto">
                        <div className="divide-y divide-border">
                          {notionPages.map((page) => {
                            const isSelected = selectedNotionPages.has(page.id);
                            return (
                              <div
                                key={page.id}
                                className={`p-3 cursor-pointer transition-colors hover:bg-muted ${
                                  isSelected ? 'bg-primary/5' : ''
                                }`}
                                onClick={() => {
                                  const newSelection = new Set(selectedNotionPages);
                                  if (isSelected) {
                                    newSelection.delete(page.id);
                                  } else {
                                    newSelection.add(page.id);
                                  }
                                  setSelectedNotionPages(newSelection);
                                }}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                    isSelected
                                      ? 'border-primary bg-primary'
                                      : 'border-border'
                                  }`}>
                                    {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-foreground text-sm truncate">{page.title}</h4>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      Last edited: {new Date(page.last_edited_time).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 text-sm text-blue-900">
                    <p className="font-semibold mb-2">Connect Notion Workspace</p>
                    <p className="text-blue-800 mb-4">
                      Connect your Notion workspace to import pages into your knowledge base.
                    </p>
                    <Button
                      onClick={handleNotionConnect}
                      disabled={connectingNotion}
                      size="sm"
                    >
                      {connectingNotion ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Link2 className="w-4 h-4 mr-2" />
                          Connect with Notion
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Disconnect Notion Confirmation Dialog */}
            <Dialog open={showDisconnectNotionDialog} onOpenChange={setShowDisconnectNotionDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Disconnect Notion</DialogTitle>
                  <DialogDescription>
                    This will disconnect the current Notion account from this workspace.
                    Imported knowledge stays intact. You can connect a different account afterward.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowDisconnectNotionDialog(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={executeDisconnectNotion} disabled={disconnectingNotion}>
                    {disconnectingNotion ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Disconnecting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Disconnect
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        );
      
      case 'google_sheets':
        return (
          <div className="space-y-6">
            {googleSheetsStatus.connected ? (
              <>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold text-green-900 mb-1">Connected to Google Sheets</p>
                      <p className="text-sm text-green-800 mb-3">
                        Select spreadsheets below to add to your agent&apos;s knowledge base.
                      </p>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setShowDisconnectGoogleSheetsDialog(true)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Disconnect
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="title" className="text-sm font-medium text-foreground">
                    Source Title *
                  </Label>
                  <Input
                    id="title"
                    value={newSource.title}
                    onChange={(e) => setNewSource(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Sales Data Sheets"
                    className="mt-2 rounded-lg border-border"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    A descriptive name for this collection of spreadsheets
                  </p>
                </div>

                {/* Google Sheets List */}
                <div>
                  <Label className="text-sm font-medium text-foreground mb-3 block">
                    Select Spreadsheets to Import *
                  </Label>
                  {loadingGoogleSheets ? (
                    <div className="flex items-center justify-center py-8 border border-border rounded-lg">
                      <div className="text-center">
                        <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Loading Google Sheets...</p>
                      </div>
                    </div>
                  ) : googleSpreadsheets.length === 0 ? (
                    <div className="border border-border rounded-lg p-6 text-center">
                      <Sheet className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No spreadsheets found</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Make sure you have spreadsheets in your Google Drive
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-2 text-sm text-muted-foreground">
                        {selectedGoogleSheets.size > 0 ? (
                          <span className="font-medium text-primary">
                            {selectedGoogleSheets.size} spreadsheet{selectedGoogleSheets.size !== 1 ? 's' : ''} selected
                          </span>
                        ) : (
                          'Select spreadsheets to import'
                        )}
                      </div>
                      <div className="border border-border rounded-lg max-h-80 overflow-y-auto">
                        <div className="divide-y divide-border">
                          {googleSpreadsheets.map((sheet) => {
                            const isSelected = selectedGoogleSheets.has(sheet.id);
                            return (
                              <div
                                key={sheet.id}
                                className={`p-3 cursor-pointer transition-colors hover:bg-muted ${
                                  isSelected ? 'bg-primary/5' : ''
                                }`}
                                onClick={() => {
                                  const newSelection = new Set(selectedGoogleSheets);
                                  if (isSelected) {
                                    newSelection.delete(sheet.id);
                                  } else {
                                    newSelection.add(sheet.id);
                                  }
                                  setSelectedGoogleSheets(newSelection);
                                }}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                    isSelected
                                      ? 'border-primary bg-primary'
                                      : 'border-border'
                                  }`}>
                                    {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-foreground text-sm truncate">{sheet.name}</h4>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      Last modified: {new Date(sheet.modifiedTime).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Sheet className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 text-sm text-green-900">
                    <p className="font-semibold mb-2">Connect Google Account</p>
                    <p className="text-green-800 mb-4">
                      Connect your Google account to import spreadsheets into your knowledge base.
                    </p>
                    <Button
                      onClick={handleGoogleSheetsConnect}
                      disabled={connectingGoogleSheets}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      size="sm"
                    >
                      {connectingGoogleSheets ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Link2 className="w-4 h-4 mr-2" />
                          Connect with Google
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Disconnect Google Sheets Confirmation Dialog */}
            <Dialog open={showDisconnectGoogleSheetsDialog} onOpenChange={setShowDisconnectGoogleSheetsDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Disconnect Google Sheets</DialogTitle>
                  <DialogDescription>
                    This will disconnect the current Google account from this workspace.
                    Imported knowledge stays intact. You can connect a different account afterward.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowDisconnectGoogleSheetsDialog(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={executeDisconnectGoogleSheets} disabled={disconnectingGoogleSheets}>
                    {disconnectingGoogleSheets ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Disconnecting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Disconnect
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Loading Dialog */}
      {isUploading && (
        <LoadingDialog
          open={isUploading}
          message="Creating Agent"
          submessage={uploadMessage || `Uploading knowledge sources... ${uploadProgress.current}/${uploadProgress.total}`}
        />
      )}

      {/* Status Message */}
      {uploadStatus !== 'idle' && uploadMessage && !isUploading && (
        <div className="fixed top-4 right-4 z-50 w-96">
          <div className={`p-4 rounded-lg flex items-center gap-3 border shadow-lg ${
            uploadStatus === 'success' ? 'bg-green-50 text-green-800 border-green-200' :
            uploadStatus === 'error' ? 'bg-red-50 text-red-800 border-red-200' :
            'bg-blue-50 text-blue-800 border-blue-200'
          }`}>
            {uploadStatus === 'success' && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
            {uploadStatus === 'error' && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            {uploadStatus === 'uploading' && <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />}
            <span className="text-sm flex-1">{uploadMessage}</span>
          </div>
        </div>
      )}

      {/* Agent Creation Dialog */}
      <Dialog open={showAgentDialog} onOpenChange={setShowAgentDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-foreground flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary-foreground" />
              </div>
              Create AI Agent
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="agentName" className="text-sm font-medium text-foreground mb-2 block">
                Agent Name *
              </Label>
              <Input
                id="agentName"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="e.g., Customer Support Assistant"
                className="h-10"
                disabled={isCreatingAgent}
              />
            </div>
            <div>
              <Label htmlFor="agentDescription" className="text-sm font-medium text-foreground mb-2 block">
                Description (Optional)
              </Label>
              <Textarea
                id="agentDescription"
                value={agentDescription}
                onChange={(e) => setAgentDescription(e.target.value)}
                placeholder="Describe what this agent will do..."
                rows={3}
                className="resize-none"
                disabled={isCreatingAgent}
              />
            </div>
            <div className="bg-muted p-3 rounded-lg border">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Knowledge Sources</span>
              </div>
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">{knowledgeSources.length}</strong> source{knowledgeSources.length !== 1 ? 's' : ''} will be added to this agent.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAgentDialog(false)}
              disabled={isCreatingAgent}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateAgent}
              disabled={isCreatingAgent || !agentName.trim()}
              className="bg-primary hover:bg-primary/90"
            >
              {isCreatingAgent ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Bot className="w-4 h-4 mr-2" />
                  Create Agent
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-4 p-2 h-auto text-muted-foreground hover:text-foreground"
            disabled={isUploading || isCreatingAgent}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              Knowledge Base
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Add knowledge sources to train your AI agent
            </p>
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Left Sidebar - Source Types */}
          <div className="lg:col-span-3">
            <Card className="border border-border sticky top-6">
              <CardContent className="p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-foreground mb-3">Choose Source Type</h3>
              <div className="space-y-2">
                {sourceTypes.map((type) => {
                  const Icon = type.icon;
                  const isSelected = selectedType === type.id;
                  return (
                    <button
                      key={type.id}
                      onClick={() => handleTypeChange(type.id)}
                        disabled={isAddingSource}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                        isSelected
                            ? 'border-primary bg-primary/10 text-foreground shadow-sm'
                            : 'border-border hover:border-primary/50 hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                        } ${isAddingSource ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      suppressHydrationWarning
                    >
                        <div className={`w-8 h-8 rounded-md flex items-center justify-center ${
                          isSelected ? 'bg-primary/20' : 'bg-muted'
                        }`}>
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                      <span className="text-sm font-medium">{type.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Post-creation sources */}
              <div className="mt-6 pt-5 border-t border-border">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Add After Creation</h3>
                </div>
                <div className="space-y-2">
                  {postCreationSourceTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <div
                        key={type.id}
                        className="w-full flex items-center gap-3 p-3 rounded-lg border-2 border-border bg-muted/30 opacity-70 cursor-not-allowed"
                      >
                        <div className="w-8 h-8 rounded-md flex items-center justify-center bg-muted">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-foreground block">{type.label}</span>
                          <span className="text-xs text-muted-foreground">{type.description}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                  These sources use dedicated pages for better management. You&apos;ll be redirected to add them after creating your agent.
                </p>
              </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-6">
            <div className="space-y-4 sm:space-y-5">
              {/* Add New Source */}
              {!isAddingSource ? (
                <Card className="border border-border">
                  <CardContent className="p-8 sm:p-10 text-center">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Plus className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                  </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
                    Add {sourceTypes.find(t => t.id === selectedType)?.label} Source
                  </h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                    Add {sourceTypes.find(t => t.id === selectedType)?.label.toLowerCase()} content to train your AI agent
                  </p>
                  <Button
                    onClick={() => setIsAddingSource(true)}
                      className="bg-primary hover:bg-primary/90 shadow-sm"
                      size="lg"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add {sourceTypes.find(t => t.id === selectedType)?.label}
                  </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border border-border">
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      {React.createElement(sourceTypes.find(t => t.id === selectedType)?.icon || FileText, {
                          className: "w-5 h-5 text-primary"
                      })}
                      Add {sourceTypes.find(t => t.id === selectedType)?.label}
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                        onClick={() => {
                          setIsAddingSource(false);
                          setNewSource({
                            type: selectedType as 'files' | 'text' | 'website' | 'faq' | 'notion' | 'google_sheets',
                            content: '',
                            title: '',
                            files: [],
                            websiteUrl: '',
                            crawlMethod: 'individual',
                            faqs: [{ question: '', answer: '' }]
                          });
                          setSelectedNotionPages(new Set()); // Clear selection
                          setSelectedGoogleSheets(new Set()); // Clear Google Sheets selection
                        }}
                        className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                    <div className="space-y-5">
                    {renderSourceUI()}

                      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-5 border-t border-border">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsAddingSource(false);
                            setNewSource({
                              type: selectedType as 'files' | 'text' | 'website' | 'faq' | 'notion' | 'google_sheets',
                              content: '',
                              title: '',
                              files: [],
                              websiteUrl: '',
                              crawlMethod: 'individual',
                              faqs: [{ question: '', answer: '' }]
                            });
                            setSelectedNotionPages(new Set()); // Clear selection
                            setSelectedGoogleSheets(new Set()); // Clear Google Sheets selection
                          }}
                          className="border-border rounded-lg"
                        >
                          Cancel
                        </Button>
                      <Button
                        onClick={handleAddSource}
                          disabled={
                            !newSource.title.trim() || 
                            (newSource.type === 'files' && newSource.files.length === 0) ||
                            (newSource.type === 'text' && !newSource.content.trim()) ||
                            (newSource.type === 'website' && !newSource.websiteUrl.trim()) ||
                            (newSource.type === 'faq' && newSource.faqs.filter(faq => faq.question.trim() && faq.answer.trim()).length === 0) ||
                            (newSource.type === 'notion' && !notionStatus.connected) ||
                            (newSource.type === 'google_sheets' && !googleSheetsStatus.connected)
                          }
                          className="bg-primary hover:bg-primary/90 rounded-lg flex-1 sm:flex-initial"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Add Source
                      </Button>
                    </div>
                  </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Right Sidebar - Added Sources */}
          <div className="lg:col-span-3">
            <Card className="border border-border sticky top-6">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Check className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Added Sources
                </h3>
              </div>
              
              {knowledgeSources.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-muted/50 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <FileText className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    No sources added yet
                  </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Add sources to get started
                    </p>
                </div>
              ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                  {knowledgeSources.map((source) => {
                    const sourceType = sourceTypes.find(t => t.id === source.type);
                    const Icon = sourceType?.icon || FileText;
                      let itemCount = 1;
                      if (source.files && source.files.length > 0) {
                        itemCount = source.files.length;
                      } else if (source.faqs && source.faqs.length > 0) {
                        const validFaqs = source.faqs.filter(faq => faq.question.trim() && faq.answer.trim());
                        itemCount = validFaqs.length;
                      } else if (source.notionPages && source.notionPages.length > 0) {
                        itemCount = source.notionPages.length;
                      } else if (source.googleSheets && source.googleSheets.length > 0) {
                        itemCount = source.googleSheets.length;
                      }

                    return (
                        <div key={source.id} className="p-3 bg-muted/50 hover:bg-muted rounded-lg border border-border transition-colors">
                          <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5">
                                <div className="w-6 h-6 bg-background rounded flex items-center justify-center flex-shrink-0">
                                  <Icon className="w-3.5 h-3.5 text-primary" />
                                </div>
                                <span className="text-sm font-medium text-foreground truncate">
                                {source.title}
                              </span>
                            </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="secondary" className="text-xs h-5 px-1.5">
                              {sourceType?.label}
                                </Badge>
                                {itemCount > 1 && (
                                  <Badge variant="outline" className="text-xs h-5 px-1.5">
                                    {itemCount} {
                                      source.type === 'faq' ? 'FAQs' :
                                      source.type === 'notion' ? 'pages' :
                                      source.type === 'google_sheets' ? 'sheets' :
                                      'items'
                                    }
                                  </Badge>
                                )}
                              </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveSource(source.id)}
                              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-7 w-7 p-0 flex-shrink-0"
                          >
                              <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Continue Button */}
                <div className="mt-5 pt-4 border-t border-border">
                <Button
                  onClick={handleContinue}
                  disabled={knowledgeSources.length === 0 || isCreatingAgent || isUploading}
                    className="w-full bg-primary hover:bg-primary/90 rounded-lg shadow-sm"
                    size="default"
                >
                  {isCreatingAgent || isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Bot className="w-4 h-4 mr-2" />
                      Create Agent ({knowledgeSources.length})
                    </>
                  )}
                </Button>
                {knowledgeSources.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center mt-3">
                    Add at least one source to continue
                  </p>
                )}
              </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

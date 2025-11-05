'use client';

import React, { useEffect, useRef, useState } from 'react';
import { getAgent, Agent } from '@/app/lib/agent-utils';
import { getAgentChannel } from '@/app/lib/agent-channel-utils';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  updateDoc,
  doc 
} from 'firebase/firestore';
import { db } from '@/app/lib/firebase';

interface ChatIframeProps {
  agentId: string;
  workspaceSlug: string;
  channelId: string;
  baseUrl?: string;
  width?: string | number;
  height?: string | number;
  className?: string;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: (error: Event) => void;
}

interface WidgetConfig {
  widgetTitle: string;
  welcomeMessage: string;
  placeholder: string;
  primaryColor: string;
  chatBubbleColor: string;
  appearance: 'light' | 'dark';
  profilePictureUrl?: string;
  chatIconUrl?: string;
  suggestedMessages?: string[];
  footerMessage?: string;
  aiInstructions?: string;
  aiModel?: string;
}

export default function ChatIframe({
  agentId,
  workspaceSlug,
  channelId,
  baseUrl = 'http://localhost:3001',
  width = '100%',
  height = 600,
  className = '',
  style = {},
  onLoad,
  onError
}: ChatIframeProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [widgetConfig, setWidgetConfig] = useState<WidgetConfig | null>(null);
  const [agentData, setAgentData] = useState<Agent | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_showMainInterface, _setShowMainInterface] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_previousConversations, _setPreviousConversations] = useState<Array<{ id: string; [key: string]: unknown }>>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_loadingConversations, _setLoadingConversations] = useState(false);
  const [, setDeviceId] = useState<string>('');

  // Generate or get persistent device ID
  const getDeviceId = () => {
    let id = localStorage.getItem('rexa_device_id');
    if (!id) {
      // Generate a unique device ID
      id = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('rexa_device_id', id);
    }
    return id;
  };

  // Initialize device ID on component mount
  useEffect(() => {
    const id = getDeviceId();
    setDeviceId(id);
  }, []);

  // Load previous conversations for this device and agent
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _loadPreviousConversations = async (deviceId: string) => {
    if (!deviceId) return;
    
    try {
      _setLoadingConversations(true);
      const conversationsQuery = query(
        collection(db, 'conversations'),
        where('agentId', '==', agentId),
        where('deviceId', '==', deviceId),
        orderBy('lastMessageTime', 'desc')
      );

      const unsubscribe = onSnapshot(conversationsQuery, (snapshot) => {
        const conversations: Array<{ id: string; [key: string]: unknown }> = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          conversations.push({
            id: doc.id,
            ...data,
            lastMessageTime: data.lastMessageTime?.toDate() || new Date()
          });
        });
        _setPreviousConversations(conversations);
        _setLoadingConversations(false);
      }, (error) => {
        console.error('Error loading conversations:', error);
        _setLoadingConversations(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up conversations listener:', error);
      _setLoadingConversations(false);
    }
  };

  // Load widget configuration and agent data from database
  useEffect(() => {
    const loadData = async () => {
      try {
        setConfigLoading(true);
        console.log('🔄 Loading data for agent:', agentId, 'channel:', channelId);
        
        // Load agent data from Firestore
        let agent = null;
        try {
          const agentResponse = await getAgent(agentId);
          if (agentResponse.success && agentResponse.data) {
            agent = agentResponse.data;
            setAgentData(agent);
            console.log('Loaded agent data:', agent);
          } else {
            console.error('Failed to load agent:', agentResponse.error);
          }
        } catch (error) {
          console.error('Error loading agent data:', error);
        }

        // Load channel configuration from Firestore
        let channelData = null;
        try {
          const channelResponse = await getAgentChannel(channelId);
          if (channelResponse.success && channelResponse.data) {
            channelData = channelResponse.data;
            console.log('Loaded channel data:', channelData);
          } else {
            console.error('Failed to load channel:', channelResponse.error);
          }
        } catch (error) {
          console.error('Error loading channel data:', error);
        }

        const settings = channelData?.settings || {};
        
        // Create widget configuration with real data
        const config = {
          widgetTitle: settings.widgetTitle || agent?.name || 'Chat with us',
          welcomeMessage: settings.welcomeMessage || 'Hi! How can I help you today?',
          placeholder: settings.placeholder || 'Type your message...',
          primaryColor: settings.primaryColor || '#3B82F6',
          chatBubbleColor: settings.chatBubbleColor || '#3B82F6',
          appearance: (settings.appearance as 'light' | 'dark') || 'light',
          profilePictureUrl: settings.profilePictureUrl,
          chatIconUrl: settings.chatIconUrl,
          suggestedMessages: settings.suggestedMessages || ['How can you help me?', 'Tell me more about your services', 'What are your hours?'],
          footerMessage: settings.footerMessage || 'Powered by Rexa',
          aiInstructions: settings.aiInstructions || agent?.settings?.systemPrompt || 'You are a helpful AI assistant. Provide clear, concise, and helpful responses to user questions.',
          aiModel: (settings && typeof settings === 'object' && 'aiModel' in settings && typeof settings.aiModel === 'string') ? settings.aiModel : 'gpt-4o-mini'
        };
        
        setWidgetConfig(config);
        console.log('Widget configuration set:', config);

        // If no real data was loaded, use fallback data
        if (!agent) {
          setAgentData({
            id: agentId,
            workspaceId: workspaceSlug,
            name: 'AI Assistant',
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
            settings: {
              model: 'gpt-4o-mini',
              temperature: 0.7,
              maxTokens: 500
            },
            knowledgeSources: [],
            stats: {
              totalConversations: 0,
              totalMessages: 0
            }
          });
        }
      } catch (error) {
        console.error('Failed to load widget configuration:', error);
        // Use complete defaults as fallback
        setWidgetConfig({
          widgetTitle: 'Chat with us',
          welcomeMessage: 'Hi! How can I help you today?',
          placeholder: 'Type your message...',
          primaryColor: '#3B82F6',
          chatBubbleColor: '#3B82F6',
          appearance: 'light',
          suggestedMessages: ['How can you help me?', 'Tell me more about your services'],
          footerMessage: 'Powered by Rexa',
          aiInstructions: 'You are a helpful AI assistant.'
        });
        
        setAgentData({
          id: agentId,
          workspaceId: workspaceSlug,
          name: 'AI Assistant',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
          settings: {
            model: 'gpt-4o-mini',
            temperature: 0.7,
            maxTokens: 500
          },
          knowledgeSources: [],
          stats: {
            totalConversations: 0,
            totalMessages: 0
          }
        });
      } finally {
        setConfigLoading(false);
      }
    };

    loadData();
  }, [agentId, channelId, workspaceSlug]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      console.log('Chat iframe loaded successfully');
      setIsLoading(false);
      setHasError(false);
      onLoad?.();
    };

    const handleError = (error: Event) => {
      console.error('Chat iframe failed to load:', error);
      setIsLoading(false);
      setHasError(true);
      onError?.(error);
    };

    iframe.addEventListener('load', handleLoad);
    iframe.addEventListener('error', handleError);

    return () => {
      iframe.removeEventListener('load', handleLoad);
      iframe.removeEventListener('error', handleError);
    };
  }, [onLoad, onError]);

  // Listen for messages from iframe
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Only accept messages from our iframe
      if (event.origin !== baseUrl) return;

      console.log('Received message from chat iframe:', event.data);
      
      // Handle different message types
      switch (event.data.type) {
        case 'CHAT_READY':
          console.log('Chat iframe is ready');
          setIsLoading(false);
          break;
        case 'NEW_MESSAGE':
          console.log('New message in chat:', event.data.message);
          // Save message to Firestore if we have conversation context
          if (event.data.message && conversationId) {
            try {
              await addDoc(collection(db, 'messages'), {
                conversationId: conversationId,
                content: event.data.message.content,
                role: event.data.message.role,
                timestamp: serverTimestamp(),
                agentId: agentId
              });

              // Update conversation
              await updateDoc(doc(db, 'conversations', conversationId), {
                lastMessage: event.data.message.content,
                lastMessageTime: serverTimestamp()
              });
            } catch (error) {
              console.error('Error saving message to Firestore:', error);
            }
          }
          break;
        case 'CONVERSATION_STARTED':
          console.log('Conversation started:', event.data);
          // Create or get conversation
          if (event.data.userEmail && !conversationId) {
            try {
              const newConversation = {
                agentId: agentId,
                userEmail: event.data.userEmail,
                userName: event.data.userName || event.data.userEmail.split('@')[0],
                lastMessage: 'Conversation started',
                lastMessageTime: serverTimestamp(),
                messageCount: 0,
                status: 'active',
                createdAt: serverTimestamp()
              };
              
              const docRef = await addDoc(collection(db, 'conversations'), newConversation);
              setConversationId(docRef.id);
              
              // Send conversation ID back to iframe
              if (iframeRef.current) {
                iframeRef.current.contentWindow?.postMessage({
                  type: 'CONVERSATION_ID',
                  conversationId: docRef.id
                }, baseUrl);
              }
            } catch (error) {
              console.error('Error creating conversation:', error);
            }
          }
          break;
        case 'RESIZE_REQUEST':
          if (event.data.height && iframeRef.current) {
            iframeRef.current.style.height = `${event.data.height}px`;
          }
          break;
        case 'ERROR':
          console.error('Error from chat iframe:', event.data.error);
          setHasError(true);
          break;
        default:
          console.log('Unknown message type:', event.data.type);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [baseUrl, conversationId, agentId]);

  // Send configuration to iframe when it's ready
  useEffect(() => {
    const sendConfig = () => {
      if (iframeRef.current && !isLoading && widgetConfig && agentData) {
        const config = {
          type: 'INIT_CONFIG',
          agentId,
          workspaceSlug,
          channelId,
          baseUrl,
          widgetConfig,
          agentData
        };
        
        iframeRef.current.contentWindow?.postMessage(config, baseUrl);
      }
    };

    // Send config after a short delay to ensure iframe is ready
    const timer = setTimeout(sendConfig, 1000);
    return () => clearTimeout(timer);
  }, [agentId, workspaceSlug, channelId, baseUrl, isLoading, widgetConfig, agentData]);

  const iframeUrl = `${baseUrl}/chat/${workspaceSlug}/${agentId}/${channelId}`;

  // Don't render until config is loaded
  if (configLoading) {
    return (
      <div className="relative" style={{ width, height }}>
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading configuration...</p>
          </div>
        </div>
      </div>
    );
  }

  // Theme-based styling
  const themeStyles = widgetConfig?.appearance === 'dark' ? {
    container: 'bg-gray-800 border-gray-600',
    loading: 'bg-gray-700 border-gray-600 text-gray-300',
    error: 'bg-red-900 border-red-700 text-red-300',
    spinner: 'border-gray-400'
  } : {
    container: 'bg-white border-gray-200',
    loading: 'bg-gray-50 border-gray-200 text-gray-600',
    error: 'bg-red-50 border-red-200 text-red-600',
    spinner: 'border-blue-500'
  };

  return (
    <div className="relative" style={{ width, height }}>
      {/* Loading State */}
      {isLoading && (
        <div className={`absolute inset-0 flex items-center justify-center ${themeStyles.loading} border rounded-lg`}>
          <div className="text-center">
            <div 
              className={`animate-spin rounded-full h-8 w-8 border-b-2 ${themeStyles.spinner} mx-auto mb-2`}
              style={{ borderTopColor: widgetConfig?.primaryColor || '#3B82F6' }}
            ></div>
            <p className="text-sm">Loading {widgetConfig?.widgetTitle || 'chat'}...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className={`absolute inset-0 flex items-center justify-center ${themeStyles.error} border rounded-lg`}>
          <div className="text-center p-4">
            <div className="mb-2">
              <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm mb-2">Failed to load {widgetConfig?.widgetTitle || 'chat'}</p>
            <button
              onClick={() => {
                setHasError(false);
                setIsLoading(true);
                if (iframeRef.current) {
                  iframeRef.current.src = iframeUrl;
                }
              }}
              className="text-xs hover:underline"
              style={{ color: widgetConfig?.primaryColor || '#3B82F6' }}
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Iframe */}
      <iframe
        ref={iframeRef}
        src={iframeUrl}
        width={width}
        height={height}
        frameBorder="0"
        allow="microphone; camera"
        className={`border-0 rounded-lg ${isLoading || hasError ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300 ${className}`}
        style={{
          minHeight: '400px',
          border: `1px solid ${widgetConfig?.appearance === 'dark' ? '#374151' : '#E5E7EB'}`,
          backgroundColor: widgetConfig?.appearance === 'dark' ? '#1F2937' : '#FFFFFF',
          ...style
        }}
        title={`${widgetConfig?.widgetTitle || 'Chat'} Interface`}
        loading="lazy"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
      />
    </div>
  );
}
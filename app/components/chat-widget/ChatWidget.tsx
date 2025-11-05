'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { MessageCircle, X, Send, Plus, ArrowLeft, Clock, MoreVertical, Smile, Copy, RotateCw, ThumbsUp, ThumbsDown, Check } from 'lucide-react';
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

interface ChatWidgetProps {
  agentId: string;
  workspaceSlug: string;
  channelId: string;
  baseUrl?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  className?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
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

export default function ChatWidget({
  agentId,
  workspaceSlug,
  channelId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  baseUrl: _baseUrl = 'http://localhost:3001',
  position = 'bottom-right',
  className = ''
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [widgetConfig, setWidgetConfig] = useState<WidgetConfig | null>(null);
  const [agentData, setAgentData] = useState<Agent | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_userEmail, _setUserEmail] = useState<string>('');
  const [deviceId, setDeviceId] = useState<string>('');
  const messagesUnsubscribeRef = useRef<(() => void) | null>(null);
  const [showMainInterface, setShowMainInterface] = useState(true);
  const [previousConversations, setPreviousConversations] = useState<Array<{ id: string; [key: string]: unknown }>>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Menu and interaction states
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [likedMessages, setLikedMessages] = useState<Set<string>>(new Set());
  const [dislikedMessages, setDislikedMessages] = useState<Set<string>>(new Set());
  const [regeneratingMessageId, setRegeneratingMessageId] = useState<string | null>(null);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);

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
  const loadPreviousConversations = useCallback(async (deviceId: string) => {
    if (!deviceId) return;
    
    try {
      setLoadingConversations(true);
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
        setPreviousConversations(conversations);
        setLoadingConversations(false);
      }, (error) => {
        console.error('Error loading conversations:', error);
        setLoadingConversations(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up conversations listener:', error);
      setLoadingConversations(false);
    }
  }, [agentId]);

  // Load conversations when device ID is available
  useEffect(() => {
    if (deviceId && isOpen) {
      loadPreviousConversations(deviceId);
    }
  }, [deviceId, isOpen, loadPreviousConversations]);

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
          aiModel: settings.aiModel || 'gpt-4o-mini'
        };
        
        setWidgetConfig(config);
        console.log('Widget configuration set:', config);

        // Add initial welcome message if configured
        if (config.welcomeMessage) {
          setMessages([{
            id: '1',
            role: 'assistant',
            content: config.welcomeMessage,
            timestamp: new Date()
          }]);
        }

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

        // Add default welcome message
        setMessages([{
          id: '1',
          role: 'assistant',
          content: 'Hi! How can I help you today?',
          timestamp: new Date()
        }]);
      } finally {
        setConfigLoading(false);
      }
    };

    loadData();
  }, [agentId, channelId, workspaceSlug]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close menu and emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.menu-dropdown') && !target.closest('.menu-button')) {
        setIsMenuOpen(false);
      }
      if (!target.closest('.emoji-picker') && !target.closest('.emoji-button')) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Create or get existing conversation
  const getOrCreateConversation = useCallback(async (deviceId: string) => {
    try {
      // Check if conversation already exists for this device and agent
      const conversationsQuery = query(
        collection(db, 'conversations'),
        where('agentId', '==', agentId),
        where('deviceId', '==', deviceId)
      );

      return new Promise((resolve) => {
        const unsubscribe = onSnapshot(conversationsQuery, async (snapshot) => {
          unsubscribe(); // Unsubscribe immediately after getting data
          
          if (!snapshot.empty) {
            // Use existing conversation
            const existingConv = snapshot.docs[0];
            const convId = existingConv.id;
            setConversationId(convId);
            console.log('Found existing conversation:', convId);
            resolve(convId);
          } else {
            // Create new conversation
            const newConversation = {
              agentId: agentId,
              deviceId: deviceId,
              userEmail: `${deviceId}@anonymous.local`, // Anonymous email for compatibility
              userName: `User ${deviceId.slice(-6)}`, // Use last 6 chars of device ID as name
              lastMessage: widgetConfig?.welcomeMessage || 'Conversation started',
              lastMessageTime: serverTimestamp(),
              messageCount: 0,
              status: 'active',
              createdAt: serverTimestamp()
            };
            
            addDoc(collection(db, 'conversations'), newConversation).then((docRef) => {
              const convId = docRef.id;
              setConversationId(convId);
              console.log('Created new conversation:', convId);
              resolve(convId);
            });
          }
        }, (error) => {
          console.error('Error in conversation query:', error);
          // If there's a permission error, create a local conversation ID
          const localConvId = `local_${deviceId}_${agentId}`;
          setConversationId(localConvId);
          resolve(localConvId);
        });
      });
    } catch (error) {
      console.error('Error getting/creating conversation:', error);
      // Fallback to local conversation ID
      const localConvId = `local_${deviceId}_${agentId}`;
      setConversationId(localConvId);
      return localConvId;
    }
  }, [agentId, widgetConfig?.welcomeMessage]);

  // Force create a new conversation (for "Start New Chat")
  const createNewConversation = async (deviceId: string) => {
    try {
      const newConversation = {
        agentId: agentId,
        deviceId: deviceId,
        userEmail: `${deviceId}@anonymous.local`,
        userName: `User ${deviceId.slice(-6)}`,
        lastMessage: widgetConfig?.welcomeMessage || 'New conversation started',
        lastMessageTime: serverTimestamp(),
        messageCount: 0,
        status: 'active',
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'conversations'), newConversation);
      const convId = docRef.id;
      setConversationId(convId);
      console.log('Force created new conversation:', convId);
      return convId;
    } catch (error) {
      console.error('Error creating new conversation:', error);
      // Fallback to local conversation ID with timestamp to ensure uniqueness
      const localConvId = `local_${deviceId}_${agentId}_${Date.now()}`;
      setConversationId(localConvId);
      return localConvId;
    }
  };

  // Initialize conversation when widget opens
  useEffect(() => {
    if (isOpen && !conversationId && widgetConfig && deviceId) {
      // Use device ID instead of prompting for email
      getOrCreateConversation(deviceId);
    }
  }, [isOpen, conversationId, widgetConfig, deviceId, getOrCreateConversation]);

  // Set up real-time message listener when conversation ID is available
  useEffect(() => {
    if (!conversationId || conversationId.startsWith('local_')) {
      return;
    }

    // Clean up previous listener
    if (messagesUnsubscribeRef.current) {
      messagesUnsubscribeRef.current();
    }

    console.log('Setting up real-time message listener for conversation:', conversationId);

    // Set up real-time message listener
    const messagesQuery = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(
      messagesQuery, 
      (messagesSnapshot) => {
        console.log('Received message update, total messages:', messagesSnapshot.size);
        const messagesList: Message[] = [];
        messagesSnapshot.forEach((doc) => {
          const data = doc.data();
          messagesList.push({
            id: doc.id,
            role: data.role,
            content: data.content,
            timestamp: data.timestamp?.toDate() || new Date()
          });
        });
        
        // Add welcome message if no messages exist
        if (messagesList.length === 0 && widgetConfig?.welcomeMessage) {
          messagesList.push({
            id: 'welcome',
            role: 'assistant',
            content: widgetConfig.welcomeMessage,
            timestamp: new Date()
          });
        }
        
        setMessages(messagesList);
      },
      (error) => {
        console.error('Error in message listener:', error);
        // If there's an error, we'll continue with local messages
      }
    );

    messagesUnsubscribeRef.current = unsubscribe;

    // Cleanup function
    return () => {
      unsubscribe();
    };
  }, [conversationId, widgetConfig?.welcomeMessage]);

  // Cleanup message listener on component unmount
  useEffect(() => {
    return () => {
      if (messagesUnsubscribeRef.current) {
        messagesUnsubscribeRef.current();
      }
    };
  }, []);

  // Handle starting a new conversation
  const handleStartNewChat = async () => {
    setShowMainInterface(false);
    setConversationId(null);
    setMessages([]);
    
    // Clean up any existing message listener
    if (messagesUnsubscribeRef.current) {
      messagesUnsubscribeRef.current();
      messagesUnsubscribeRef.current = null;
    }
    
    // Add welcome message
    if (widgetConfig?.welcomeMessage) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: widgetConfig.welcomeMessage,
        timestamp: new Date()
      }]);
    }
    
    // Force create a new conversation (don't reuse existing ones)
    if (deviceId) {
      await createNewConversation(deviceId);
    }
  };

  // Handle selecting an existing conversation
  const handleSelectConversation = async (conversation: { id: string; [key: string]: unknown }) => {
    setShowMainInterface(false);
    setConversationId(conversation.id);
    
    // Load messages for this conversation
    const messagesQuery = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversation.id),
      orderBy('timestamp', 'asc')
    );

    try {
      const unsubscribe = onSnapshot(messagesQuery, (messagesSnapshot) => {
        const messagesList: Message[] = [];
        messagesSnapshot.forEach((doc) => {
          const data = doc.data();
          messagesList.push({
            id: doc.id,
            role: data.role,
            content: data.content,
            timestamp: data.timestamp?.toDate() || new Date()
          });
        });
        
        // Add welcome message if no messages exist
        if (messagesList.length === 0 && widgetConfig?.welcomeMessage) {
          messagesList.push({
            id: 'welcome',
            role: 'assistant',
            content: widgetConfig.welcomeMessage,
            timestamp: new Date()
          });
        }
        
        setMessages(messagesList);
      });

      messagesUnsubscribeRef.current = unsubscribe;
    } catch (error) {
      console.error('Error loading conversation messages:', error);
    }
  };

  // Handle going back to main interface
  const handleBackToMain = () => {
    setShowMainInterface(true);
    setConversationId(null);
    setMessages([]);
    
    // Clean up message listener
    if (messagesUnsubscribeRef.current) {
      messagesUnsubscribeRef.current();
      messagesUnsubscribeRef.current = null;
    }
  };

  // Handler functions for message interactions
  const handleCopyMessage = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  const handleLikeMessage = (messageId: string) => {
    setLikedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
        dislikedMessages.delete(messageId);
      }
      return newSet;
    });
    setDislikedMessages(prev => {
      const newSet = new Set(prev);
      newSet.delete(messageId);
      return newSet;
    });
  };

  const handleDislikeMessage = (messageId: string) => {
    setDislikedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
        likedMessages.delete(messageId);
      }
      return newSet;
    });
    setLikedMessages(prev => {
      const newSet = new Set(prev);
      newSet.delete(messageId);
      return newSet;
    });
  };

  const handleRegenerateResponse = async (messageId: string) => {
    setRegeneratingMessageId(messageId);
    // Find the user message before this assistant message
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex > 0) {
      const userMessage = messages[messageIndex - 1];
      if (userMessage.role === 'user') {
        // Remove the assistant message and regenerate
        setMessages(prev => prev.filter(m => m.id !== messageId));
        setInputValue(userMessage.content);
        await sendMessage();
      }
    }
    setRegeneratingMessageId(null);
  };

  const handleEmojiSelect = (emoji: string) => {
    setInputValue(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleEndChat = () => {
    setIsMenuOpen(false);
    setIsOpen(false);
    setMessages([]);
    setConversationId(null);
    setShowMainInterface(true);
  };

  const handleViewRecentChats = () => {
    setIsMenuOpen(false);
    setShowMainInterface(true);
  };

  // Common emojis for quick access
  const commonEmojis = ['😊', '👍', '❤️', '😂', '🎉', '🤔', '👋', '🙏', '✨', '🔥', '💯', '👏', '😎', '💪', '🚀'];

  // Format timestamp
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Enhanced markdown renderer with clean, minimal styling and link handling
  const renderMarkdown = (text: string) => {
    if (!text) return text;

    let rendered = text;

    // Replace **bold** with <strong>
    rendered = rendered.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>');

    // Replace *italic* with <em> (but not if it's part of a list item)
    rendered = rendered.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em class="italic text-gray-700">$1</em>');

    // Handle URLs - make them clickable with proper breaking
    rendered = rendered.replace(
      /(https?:\/\/[^\s<]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline hover:text-blue-800 break-all" style="word-break: break-all; overflow-wrap: break-word;">$1</a>'
    );

    // Handle bullet points - convert to proper HTML lists with clean styling
    const lines = rendered.split('\n');
    const processedLines: string[] = [];
    let inList = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Check if this line is a bullet point
      if (line.match(/^\s*\*\s+(.+)$/)) {
        const content = line.replace(/^\s*\*\s+/, '');
        if (!inList) {
          processedLines.push('<ul class="space-y-1.5 my-3 ml-1">');
          inList = true;
        }
        processedLines.push(`<li class="text-sm leading-relaxed flex items-start gap-2 break-words" style="word-break: break-word;"><span class="text-gray-400 mt-0.5 flex-shrink-0">•</span><span class="flex-1 min-w-0">${content}</span></li>`);
      } else {
        // If we were in a list and this line is not a bullet point, close the list
        if (inList) {
          processedLines.push('</ul>');
          inList = false;
        }

        // Add the regular line
        if (line) {
          processedLines.push(line);
        } else {
          processedLines.push('<br class="my-2">');
        }
      }
    }

    // Close any open list
    if (inList) {
      processedLines.push('</ul>');
    }

    rendered = processedLines.join('\n');

    // Replace double line breaks with paragraph breaks
    rendered = rendered.replace(/\n\n+/g, '</p><p class="mt-3 text-sm leading-relaxed break-words">');

    // Replace single line breaks with <br>
    rendered = rendered.replace(/\n/g, '<br class="my-1">');

    // Wrap in paragraph if it doesn't start with a tag
    if (!rendered.startsWith('<')) {
      rendered = '<p class="text-sm leading-relaxed break-words">' + rendered + '</p>';
    }

    return rendered;
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading || isSending || !widgetConfig || !conversationId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    // Add user message to local state immediately
    setMessages(prev => [...prev, userMessage]);
    const messageContent = inputValue;
    setInputValue('');
    setIsSending(true); // Show sending state immediately

    // Add assistant message placeholder with sending state
    const assistantMessageId = (Date.now() + 1).toString();
    setStreamingMessageId(assistantMessageId); // Mark as streaming
    setMessages(prev => [...prev, {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date()
    }]);

    try {
      // Try to save user message to Firestore (skip if permission denied)
      if (!conversationId.startsWith('local_')) {
        try {
          await addDoc(collection(db, 'messages'), {
            conversationId: conversationId,
            content: messageContent,
            role: 'user',
            timestamp: serverTimestamp(),
            agentId: agentId
          });

          // Update conversation with last message
          await updateDoc(doc(db, 'conversations', conversationId), {
            lastMessage: messageContent,
            lastMessageTime: serverTimestamp(),
            messageCount: messages.length + 1
          });
        } catch (firestoreError) {
          console.warn('Firestore save failed, continuing with local storage:', firestoreError);
          // Continue without Firestore - messages will be stored locally in state
        }
      }

      // Get AI response with conversation history
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
      
      // Prepare conversation history (exclude welcome messages and limit to last 20 messages)
      const conversationHistory = messages
        .filter(msg => msg.id !== 'welcome') // Exclude welcome message
        .slice(-20) // Get last 20 messages only
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));
      
      // Add the current user message to history
      conversationHistory.push({
        role: 'user',
        content: messageContent
      });
      
      // Switch from sending to loading (AI thinking)
      setIsSending(false);
      setIsLoading(true);
      
      // Small delay to ensure typing animation is visible
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const response = await fetch(`${apiUrl}/api/ai/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageContent,
          conversationHistory: conversationHistory, // Include full conversation context
          agentId: agentId,
          conversationId: conversationId,
          aiConfig: {
            enabled: true,
            model: widgetConfig.aiModel || agentData?.settings?.model || agentData?.aiConfig?.model || 'gpt-4o-mini',
            temperature: agentData?.settings?.temperature || agentData?.aiConfig?.temperature || 0.7,
            systemPrompt: 'custom',
            customSystemPrompt: widgetConfig.aiInstructions || '',
            ragEnabled: true,
            embeddingProvider: 'voyage',
            embeddingModel: 'voyage-3-large', // Use voyage-3-large for consistency
            rerankerEnabled: true,
            rerankerModel: 'rerank-2.5-lite', // Use rerank-2.5-lite for consistency
            maxRetrievalDocs: 5,
            maxTokens: agentData?.settings?.maxTokens || agentData?.aiConfig?.maxTokens || 500,
            confidenceThreshold: 0.6,
            fallbackToHuman: false
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to get response: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const jsonData = line.slice(6).trim();
                if (!jsonData) continue;

                const data = JSON.parse(jsonData);
                if (data.type === 'content') {
                  assistantContent += data.content;
                  // Only update content if we have actual content to show
                  if (assistantContent.trim()) {
                    setMessages(prev => prev.map(msg =>
                      msg.id === assistantMessageId
                        ? { ...msg, content: assistantContent }
                        : msg
                    ));
                  }
                } else if (data.type === 'complete') {
                  // Try to save assistant message to Firestore (skip if permission denied)
                  if (!conversationId.startsWith('local_')) {
                    try {
                      await addDoc(collection(db, 'messages'), {
                        conversationId: conversationId,
                        content: assistantContent,
                        role: 'assistant',
                        timestamp: serverTimestamp(),
                        agentId: agentId
                      });

                      // Update conversation with assistant's last message
                      await updateDoc(doc(db, 'conversations', conversationId), {
                        lastMessage: assistantContent,
                        lastMessageTime: serverTimestamp(),
                        messageCount: messages.length + 2
                      });
                    } catch (firestoreError) {
                      console.warn('Firestore save failed for assistant message:', firestoreError);
                      // Continue without Firestore - messages will be stored locally in state
                    }
                  }

                  setMessages(prev => prev.map(msg =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: assistantContent }
                      : msg
                  ));
                } else if (data.type === 'error') {
                  throw new Error(data.message);
                }
              } catch (parseError) {
                console.error('Error parsing SSE data:', parseError);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.map(msg =>
        msg.id === assistantMessageId
          ? { ...msg, content: "I'm sorry, I encountered an error. Please try again." }
          : msg
      ));
    } finally {
      setIsSending(false);
      setIsLoading(false);
      setStreamingMessageId(null); // Clear streaming state
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestedMessage = (message: string) => {
    setInputValue(message);
  };

  if (configLoading) {
    return null; // Don't render until config is loaded
  }

  if (!widgetConfig) {
    return null;
  }

  // Position classes - Standard responsive positioning
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4 md:bottom-6 md:right-6',
    'bottom-left': 'bottom-4 left-4 md:bottom-6 md:left-6',
    'top-right': 'top-4 right-4 md:top-6 md:right-6',
    'top-left': 'top-4 left-4 md:top-6 md:left-6'
  };

  // Get button position for close button alignment
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _getCloseButtonPosition = () => {
    if (position.includes('right')) return 'right-4 md:right-6';
    return 'left-4 md:left-6';
  };

  // Get chat window position classes - Enhanced dimensions with reduced gap from button and top spacing
  const getChatWindowClasses = () => {
    const baseClasses = 'fixed z-50 transition-all duration-300 ease-in-out';

    // Mobile: Full screen with proper spacing
    const mobileClasses = 'inset-4 w-auto h-auto max-h-[90vh]';

    // Desktop: Reduced gap from button (24px gap) and proper top spacing (80px from top)
    let desktopClasses = '';
    if (position === 'bottom-right') {
      desktopClasses = 'md:bottom-24 md:right-6 md:w-[420px] md:h-[calc(100vh-180px)] md:max-h-[680px] lg:w-[440px] lg:max-h-[700px] md:inset-auto';
    } else if (position === 'bottom-left') {
      desktopClasses = 'md:bottom-24 md:left-6 md:w-[420px] md:h-[calc(100vh-180px)] md:max-h-[680px] lg:w-[440px] lg:max-h-[700px] md:inset-auto';
    } else if (position === 'top-right') {
      desktopClasses = 'md:top-24 md:right-6 md:w-[420px] md:h-[calc(100vh-180px)] md:max-h-[680px] lg:w-[440px] lg:max-h-[700px] md:inset-auto';
    } else if (position === 'top-left') {
      desktopClasses = 'md:top-24 md:left-6 md:w-[420px] md:h-[calc(100vh-180px)] md:max-h-[680px] lg:w-[440px] lg:max-h-[700px] md:inset-auto';
    }

    return `${baseClasses} ${mobileClasses} ${desktopClasses}`;
  };

  // Theme classes
  const themeClasses = {
    light: {
      bg: 'bg-white',
      text: 'text-gray-900',
      border: 'border-gray-200',
      input: 'bg-gray-50',
      userBubble: `text-white`,
      assistantBubble: 'bg-gray-100 text-gray-900',
      header: 'bg-white border-gray-200'
    },
    dark: {
      bg: 'bg-gray-800',
      text: 'text-white',
      border: 'border-gray-600',
      input: 'bg-gray-700',
      userBubble: `text-white`,
      assistantBubble: 'bg-gray-700 text-white',
      header: 'bg-gray-800 border-gray-600'
    }
  };

  const currentTheme = themeClasses[widgetConfig.appearance];

  return (
    <div className={`fixed ${positionClasses[position]} z-50 ${className}`}>
      {/* Chat Window */}
      {isOpen && (
        <div className={getChatWindowClasses()}>
          <div className={`w-full h-full ${currentTheme.bg} ${currentTheme.border} border-2 rounded-2xl shadow-2xl flex flex-col overflow-hidden`}>
            {showMainInterface ? (
                /* Main Interface */
                <>
                  {/* Header - Clean minimal design with top padding */}
                  <div className={`pt-6 pb-5 px-5 md:pt-7 md:pb-6 md:px-6 ${currentTheme.header} border-b-2 flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                      {widgetConfig.profilePictureUrl ? (
                        <Image
                          src={widgetConfig.profilePictureUrl}
                          alt="Agent"
                          width={44}
                          height={44}
                          className="w-10 h-10 md:w-11 md:h-11 rounded-full object-cover ring-2 ring-gray-100"
                        />
                      ) : (
                        <div
                          className="w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center text-white text-base font-semibold shadow-sm"
                          style={{ backgroundColor: widgetConfig.primaryColor }}
                        >
                          {widgetConfig.widgetTitle.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h3 className={`font-semibold text-base md:text-lg ${currentTheme.text}`}>
                          {widgetConfig.widgetTitle}
                        </h3>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <p className="text-xs text-gray-500 font-medium">Online</p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsOpen(false)}
                      className={`p-2 hover:bg-gray-100 rounded-xl transition-all duration-200 ${currentTheme.text}`}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                {/* Main Content - Clean minimal design */}
                  <div className="flex-1 p-6 md:p-8 overflow-y-auto">
                    {/* Welcome Section - Clean centered design */}
                    <div className="text-center mb-8">
                      <div
                        className="w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center text-white text-2xl md:text-3xl font-bold mx-auto mb-5 shadow-lg"
                        style={{ backgroundColor: widgetConfig.primaryColor }}
                      >
                        {widgetConfig.widgetTitle.charAt(0).toUpperCase()}
                      </div>
                      <h2 className={`text-xl md:text-2xl font-bold ${currentTheme.text} mb-3`}>
                        Welcome to {widgetConfig.widgetTitle}
                      </h2>
                      <p className="text-sm md:text-base text-gray-500 px-4 leading-relaxed">
                        {widgetConfig.welcomeMessage || 'How can I help you today?'}
                      </p>
                    </div>

                  {/* Start New Chat Button - Clean card design */}
                    <button
                      onClick={handleStartNewChat}
                      className="w-full p-5 mb-5 rounded-2xl border-2 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                      style={{
                        borderColor: widgetConfig.primaryColor + '40',
                        backgroundColor: widgetConfig.primaryColor + '08'
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-md"
                          style={{ backgroundColor: widgetConfig.primaryColor }}
                        >
                          <Plus className="w-6 h-6" />
                        </div>
                        <div className="text-left flex-1">
                          <div className={`font-semibold text-base ${currentTheme.text}`}>Start New Chat</div>
                          <div className="text-sm text-gray-500">Begin a fresh conversation</div>
                        </div>
                      </div>
                    </button>

                  {/* Recent Conversations - Clean minimal cards */}
                    {loadingConversations ? (
                      <div className="text-center py-10">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 mx-auto mb-3" style={{ borderColor: widgetConfig.primaryColor }}></div>
                        <p className="text-sm text-gray-500">Loading conversations...</p>
                      </div>
                    ) : previousConversations.length > 0 ? (
                      <div>
                        <h3 className={`font-semibold text-sm ${currentTheme.text} mb-3`}>Recent Conversations</h3>
                        <div className="space-y-2.5">
                          {previousConversations.slice(0, 5).map((conversation) => (
                            <button
                              key={conversation.id}
                              onClick={() => handleSelectConversation(conversation)}
                              className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md hover:scale-[1.01] active:scale-[0.99] ${currentTheme.border}`}
                              style={{ backgroundColor: widgetConfig.appearance === 'dark' ? '#374151' : '#f9fafb' }}
                            >
                              <div className="flex items-center gap-3">
                                <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className={`text-sm font-semibold ${currentTheme.text} truncate mb-0.5`}>
                                    {String(conversation.lastMessage || 'New conversation')}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {conversation.updatedAt && typeof conversation.updatedAt === 'object' && 'toDate' in conversation.updatedAt && typeof (conversation.updatedAt as { toDate: () => Date }).toDate === 'function'
                                      ? (conversation.updatedAt as { toDate: () => Date }).toDate().toLocaleDateString()
                                      : 'Recent'}
                                  </div>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-10">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                          <MessageCircle className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-500 font-medium">No previous conversations</p>
                      </div>
                    )}
                </div>

                {/* Footer - Clean minimal design */}
                  {widgetConfig.footerMessage && (
                    <div className={`p-4 ${currentTheme.border} border-t-2 bg-gray-50/50`}>
                      <div className="flex items-center justify-center">
                        <span className="text-xs text-gray-500 font-medium">
                          {widgetConfig.footerMessage}
                        </span>
                      </div>
                    </div>
                  )}
              </>
            ) : (
              /* Chat Interface - Clean minimal design */
              <>
                {/* Header - Clean minimal spacing with top padding */}
                <div className={`pt-6 pb-5 px-5 md:pt-7 md:pb-6 md:px-6 ${currentTheme.header} border-b-2 flex items-center justify-between`}>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleBackToMain}
                      className={`p-2 hover:bg-gray-100 rounded-xl transition-all duration-200 ${currentTheme.text}`}
                    >
                      <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                    {widgetConfig.profilePictureUrl ? (
                      <Image
                        src={widgetConfig.profilePictureUrl}
                        alt="Agent"
                        width={40}
                        height={40}
                        className="w-9 h-9 md:w-10 md:h-10 rounded-full object-cover ring-2 ring-gray-100"
                      />
                    ) : (
                      <div
                        className="w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-sm"
                        style={{ backgroundColor: widgetConfig.primaryColor }}
                      >
                        {widgetConfig.widgetTitle.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className={`font-semibold text-sm md:text-base ${currentTheme.text}`}>
                        {widgetConfig.widgetTitle}
                      </h3>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <p className="text-xs text-gray-500 font-medium">Online</p>
                      </div>
                    </div>
                  </div>

                  {/* 3-dot menu */}
                  <div className="relative">
                    <button
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                      className={`menu-button p-2 hover:bg-gray-100 rounded-xl transition-all duration-200 ${currentTheme.text}`}
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>

                    {/* Menu dropdown */}
                    {isMenuOpen && (
                      <div className={`menu-dropdown absolute right-0 top-12 ${currentTheme.bg} border-2 ${currentTheme.border} rounded-xl shadow-xl z-50 min-w-[200px] overflow-hidden`}>
                        <button
                          onClick={handleStartNewChat}
                          className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${currentTheme.text} text-left text-sm`}
                        >
                          <Plus className="w-4 h-4" />
                          <span>Start New Chat</span>
                        </button>
                        <button
                          onClick={handleViewRecentChats}
                          className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${currentTheme.text} text-left text-sm`}
                        >
                          <Clock className="w-4 h-4" />
                          <span>View Recent Chats</span>
                        </button>
                        <button
                          onClick={handleEndChat}
                          className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-red-600 text-left text-sm border-t ${currentTheme.border}`}
                        >
                          <X className="w-4 h-4" />
                          <span>End Chat</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Messages Area - Clean minimal design with proper width constraints */}
                <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.role === 'assistant' && (
                        <div className="flex items-start gap-2.5 w-full max-w-[90%]">
                          {/* AI Avatar - Clean minimal sizing */}
                          {widgetConfig.profilePictureUrl ? (
                            <Image
                              src={widgetConfig.profilePictureUrl}
                              alt="AI"
                              width={32}
                              height={32}
                              className="w-7 h-7 md:w-8 md:h-8 rounded-full object-cover flex-shrink-0 mt-0.5 ring-2 ring-gray-100"
                            />
                          ) : (
                            <div
                              className="w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 mt-0.5 shadow-sm"
                              style={{ backgroundColor: widgetConfig.primaryColor }}
                            >
                              AI
                            </div>
                          )}

                          {/* Message Bubble - Fixed width with proper word breaking */}
                          <div className="min-w-0 flex-1" style={{ maxWidth: 'calc(100% - 44px)' }}>
                            {streamingMessageId === message.id && (!message.content || message.content.length < 10) ? (
                              /* Typing Animation - Visible animated dots like preview */
                              <div className={`px-4 py-3 rounded-xl shadow-sm ${currentTheme.assistantBubble} w-fit`}>
                                <div className="flex items-center gap-1">
                                  <span className="text-2xl animate-bounce" style={{ animationDuration: '1s' }}>•</span>
                                  <span className="text-2xl animate-bounce" style={{ animationDuration: '1s', animationDelay: '0.2s' }}>•</span>
                                  <span className="text-2xl animate-bounce" style={{ animationDuration: '1s', animationDelay: '0.4s' }}>•</span>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div
                                  className={`px-4 py-3 rounded-xl shadow-sm ${currentTheme.assistantBubble}`}
                                  style={{
                                    wordBreak: 'break-word',
                                    overflowWrap: 'break-word',
                                    wordWrap: 'break-word'
                                  }}
                                >
                                  <div
                                    className="prose prose-sm max-w-none [&>p]:m-0 [&>p]:text-sm [&>p]:leading-relaxed [&>p]:break-words [&>ul]:my-2 [&>ul]:ml-0 [&>li]:text-sm [&>li]:break-words [&_a]:break-all [&_a]:text-blue-600 [&_a]:underline"
                                    style={{
                                      wordBreak: 'break-word',
                                      overflowWrap: 'break-word'
                                    }}
                                    dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
                                  />
                                </div>

                                {/* Action icons and timestamp */}
                                <div className="flex items-center gap-2 mt-1.5 px-1">
                                  <span className="text-xs text-gray-400">{formatTime(message.timestamp)}</span>
                                  <div className="flex items-center gap-1 ml-auto">
                                    <button
                                      onClick={() => handleCopyMessage(message.id, message.content)}
                                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                      title="Copy message"
                                    >
                                      {copiedMessageId === message.id ? (
                                        <Check className="w-3.5 h-3.5 text-green-600" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5 text-gray-500" />
                                      )}
                                    </button>
                                    <button
                                      onClick={() => handleRegenerateResponse(message.id)}
                                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                      title="Regenerate response"
                                      disabled={regeneratingMessageId === message.id}
                                    >
                                      <RotateCw className={`w-3.5 h-3.5 text-gray-500 ${regeneratingMessageId === message.id ? 'animate-spin' : ''}`} />
                                    </button>
                                    <button
                                      onClick={() => handleLikeMessage(message.id)}
                                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                      title="Like"
                                    >
                                      <ThumbsUp className={`w-3.5 h-3.5 ${likedMessages.has(message.id) ? 'text-blue-600 fill-blue-600' : 'text-gray-500'}`} />
                                    </button>
                                    <button
                                      onClick={() => handleDislikeMessage(message.id)}
                                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                      title="Dislike"
                                    >
                                      <ThumbsDown className={`w-3.5 h-3.5 ${dislikedMessages.has(message.id) ? 'text-red-600 fill-red-600' : 'text-gray-500'}`} />
                                    </button>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      {message.role === 'user' && (
                        <div style={{ maxWidth: 'min(90%, 340px)' }}>
                          <div
                            className={`px-4 py-3 rounded-xl shadow-sm ${currentTheme.userBubble}`}
                            style={{
                              backgroundColor: widgetConfig.chatBubbleColor,
                              wordBreak: 'break-word',
                              overflowWrap: 'break-word',
                              wordWrap: 'break-word'
                            }}
                          >
                            <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</div>
                          </div>
                          {/* Timestamp for user message */}
                          <div className="flex justify-end mt-1.5 px-1">
                            <span className="text-xs text-gray-400">{formatTime(message.timestamp)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Suggested Messages - Clean minimal pills */}
                  {widgetConfig.suggestedMessages && widgetConfig.suggestedMessages.length > 0 && messages.length <= 1 && (
                    <div className="flex flex-wrap gap-2 pt-3">
                      {widgetConfig.suggestedMessages.slice(0, 3).map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestedMessage(suggestion)}
                          className={`px-4 py-2 border-2 rounded-full text-xs font-medium transition-all duration-200 hover:shadow-md hover:scale-105 active:scale-95 ${currentTheme.border} ${currentTheme.text}`}
                          style={{
                            backgroundColor: widgetConfig.appearance === 'dark' ? '#374151' : '#f9fafb',
                            borderColor: widgetConfig.primaryColor + '30'
                          }}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area - Clean minimal design with emoji picker */}
                <div className={`p-4 md:p-5 ${currentTheme.border} border-t bg-gray-50/50`}>
                  {/* Emoji Picker */}
                  {showEmojiPicker && (
                    <div className="emoji-picker mb-3 p-3 bg-white border-2 rounded-xl shadow-lg">
                      <div className="flex flex-wrap gap-2">
                        {commonEmojis.map((emoji, index) => (
                          <button
                            key={index}
                            onClick={() => handleEmojiSelect(emoji)}
                            className="text-2xl hover:scale-125 transition-transform p-1"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2.5 items-end">
                    {/* Emoji Button */}
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="emoji-button p-3 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0"
                      title="Add emoji"
                    >
                      <Smile className="w-5 h-5 text-gray-500" />
                    </button>

                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={widgetConfig.placeholder}
                      className={`flex-1 px-4 py-3 ${currentTheme.input} ${currentTheme.text} border-2 ${currentTheme.border} rounded-xl text-sm focus:outline-none focus:border-blue-400 transition-all duration-200`}
                      disabled={isLoading || isSending}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!inputValue.trim() || isLoading || isSending}
                      className="px-4 py-3 text-white rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95 shadow-md flex-shrink-0"
                      style={{ backgroundColor: widgetConfig.primaryColor }}
                    >
                      <Send className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                  </div>

                  {/* Footer Message - Clean minimal design */}
                  {widgetConfig.footerMessage && (
                    <div className="flex items-center justify-center mt-3">
                      <span className="text-xs text-gray-500 font-medium">
                        {widgetConfig.footerMessage}
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Chat Button - Clean minimal design */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 md:w-16 md:h-16 rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all duration-300 ring-4 ring-white"
        style={{ backgroundColor: widgetConfig.primaryColor }}
      >
        {isOpen ? (
          <X className="w-6 h-6 md:w-7 md:h-7" />
        ) : widgetConfig.chatIconUrl ? (
          <Image
            src={widgetConfig.chatIconUrl}
            alt="Chat"
            width={32}
            height={32}
            className="w-7 h-7 md:w-8 md:h-8 object-cover"
          />
        ) : (
          <MessageCircle className="w-6 h-6 md:w-7 md:h-7" />
        )}
      </button>
    </div>
  );
}
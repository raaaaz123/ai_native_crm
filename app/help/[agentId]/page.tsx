"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Send,
  Smile,
  Loader2,
  Image as ImageIcon,
  MessageSquare,
  Trash2,
  PanelLeftClose,
  PanelLeft,
  ArrowUp
} from "lucide-react";
import { db } from "@/app/lib/firebase";
import { doc, getDoc, collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot, deleteDoc, updateDoc, getDocs, limit } from "firebase/firestore";
import { getAgent, Agent } from "@/app/lib/agent-utils";
import EmojiPicker from "@/app/components/ui/emoji-picker";

interface HelpPageSettings {
  logo?: string;
  heroImage?: string;
  theme: 'light' | 'dark';
  primaryColor: string;
  backgroundColor: string;
  headerText: string;
  inputPlaceholder: string;
  newChatButtonText: string;
  primaryButtons: Array<{ id: string; text: string; action: string }>;
  secondaryButtons: Array<{ id: string; text: string; action: string }>;
  suggestions: Array<{ id: string; text: string }>;
  linkCards: Array<{ id: string; heading: string; description: string; url: string }>;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  lastMessageTime: Date;
  messageCount: number;
  firstMessage?: string;
}

export default function HelpPage() {
  const params = useParams();
  const agentId = params.agentId as string;

  const [settings, setSettings] = useState<HelpPageSettings | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [deviceId, setDeviceId] = useState<string>('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Mobile responsive state
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setIsSidebarCollapsed(true);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const id = getDeviceId();
    setDeviceId(id);
    loadHelpPageData();
  }, [agentId]);

  useEffect(() => {
    if (!deviceId) return;
    loadConversations();
  }, [agentId, deviceId]);

  useEffect(() => {
    if (!conversationId) return;

    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('conversationId', '==', conversationId),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedMessages: Message[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        loadedMessages.push({
          id: doc.id,
          role: data.role,
          content: data.content,
          timestamp: data.timestamp?.toDate() || new Date()
        });
      });

      // Merge with existing messages, but filter out temp messages and avoid duplicates
      setMessages(prev => {
        // Filter out temp messages (they start with 'temp_')
        const existingNonTemp = prev.filter(msg => !msg.id.startsWith('temp_'));
        
        // Create a map of existing message IDs for quick lookup
        const existingIds = new Set(existingNonTemp.map(msg => msg.id));
        
        // Add new messages that aren't already in state
        const newMessages = loadedMessages.filter(msg => !existingIds.has(msg.id));
        
        // Combine and sort by timestamp
        const allMessages = [...existingNonTemp, ...newMessages].sort((a, b) => 
          a.timestamp.getTime() - b.timestamp.getTime()
        );
        
        return allMessages;
      });
    }, (error) => {
      console.error('Error listening to messages:', error);
    });

    return () => unsubscribe();
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const getDeviceId = () => {
    // Create a unique device ID per agent to prevent cross-agent conversation leakage
    const agentSpecificKey = `rexa_device_id_${agentId}`;
    let id = localStorage.getItem(agentSpecificKey);
    if (!id) {
      id = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(agentSpecificKey, id);
    }
    return id;
  };

  const loadConversations = async () => {
    if (!agentId) return;
    
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('agentId', '==', agentId),
      where('deviceId', '==', deviceId),
      orderBy('lastMessageTime', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const loadedConversations: Conversation[] = [];

      for (const convDoc of snapshot.docs) {
        const data = convDoc.data();

        // Get first message for preview
        let firstMessage = 'New Chat';
        try {
          const messagesQuery = query(
            collection(db, 'messages'),
            where('conversationId', '==', convDoc.id),
            orderBy('timestamp', 'asc'),
            limit(1)
          );
          const messagesSnapshot = await getDocs(messagesQuery);
          if (!messagesSnapshot.empty) {
            const firstMsg = messagesSnapshot.docs[0].data();
            firstMessage = firstMsg.content.slice(0, 50) + (firstMsg.content.length > 50 ? '...' : '');
          }
        } catch (error) {
          console.error('Error fetching first message:', error);
        }

        loadedConversations.push({
          id: convDoc.id,
          title: data.title || 'New Chat',
          lastMessageTime: data.lastMessageTime?.toDate() || new Date(),
          messageCount: data.messageCount || 0,
          firstMessage: firstMessage
        });
      }

      setConversations(loadedConversations);

      // Auto-select the most recent conversation if none selected
      if (!conversationId && loadedConversations.length > 0) {
        setConversationId(loadedConversations[0].id);
      }
    }, (error) => {
      console.error('Error loading conversations:', error);
    });

    return unsubscribe;
  };

  const createNewConversation = async () => {
    try {
      const conversationRef = await addDoc(collection(db, 'conversations'), {
        agentId: agentId,
        deviceId: deviceId,
        channelType: 'help-page',
        status: 'active',
        createdAt: serverTimestamp(),
        lastMessageTime: serverTimestamp(),
        messageCount: 0,
        title: 'New Chat'
      });

      setConversationId(conversationRef.id);
      setMessages([]);
      return conversationRef.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      const localId = `local_${Date.now()}`;
      setConversationId(localId);
      setMessages([]);
      return localId;
    }
  };

  const selectConversation = (id: string) => {
    setConversationId(id);
  };

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      // Delete all messages in this conversation
      const messagesRef = collection(db, 'messages');
      const q = query(messagesRef, where('conversationId', '==', id));
      const snapshot = await getDocs(q);

      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // Delete the conversation
      await deleteDoc(doc(db, 'conversations', id));

      // If this was the active conversation, create a new one
      if (conversationId === id) {
        await createNewConversation();
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const loadHelpPageData = async () => {
    setLoading(true);
    try {
      const agentResponse = await getAgent(agentId);
      if (agentResponse.success && agentResponse.data) {
        setAgent(agentResponse.data);
        
        // Try loading settings with workspaceId_agentId format first, then fallback to agentId
        const workspaceId = agentResponse.data.workspaceId;
        let settingsSnapshot = null;
        
        if (workspaceId) {
          try {
            settingsSnapshot = await getDoc(doc(db, 'helpPageSettings', `${workspaceId}_${agentId}`));
          } catch (error) {
            console.warn('Failed to load settings with workspaceId format:', error);
          }
        }
        
        // Fallback to agentId format if workspaceId format didn't work
        if (!settingsSnapshot?.exists()) {
          try {
            settingsSnapshot = await getDoc(doc(db, 'helpPageSettings', agentId));
          } catch (error) {
            console.warn('Failed to load settings with agentId format:', error);
          }
        }
        
        if (settingsSnapshot?.exists()) {
          setSettings(settingsSnapshot.data() as HelpPageSettings);
        }
      } else {
        // Try loading settings with just agentId if agent load failed
        try {
          const settingsSnapshot = await getDoc(doc(db, 'helpPageSettings', agentId));
          if (settingsSnapshot.exists()) {
            setSettings(settingsSnapshot.data() as HelpPageSettings);
          }
        } catch (error) {
          console.warn('Failed to load settings:', error);
        }
      }
    } catch (error) {
      console.error('Error loading help page data:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSuggestionClick = (text: string) => {
    setInputValue(text);
  };

  const handleEmojiSelect = (emoji: string) => {
    setInputValue(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;

    let currentConvId = conversationId;

    // Create new conversation if none exists
    if (!currentConvId) {
      currentConvId = await createNewConversation();
    }

    const messageContent = inputValue;
    setInputValue('');
    setIsTyping(true);

    try {
      // Save user message to Firestore
      if (!currentConvId.startsWith('local_')) {
        try {
          await addDoc(collection(db, 'messages'), {
            conversationId: currentConvId,
            content: messageContent,
            role: 'user',
            timestamp: serverTimestamp(),
            agentId: agentId
          });

          // Update conversation title if it's the first message
          if (messages.length === 0) {
            const title = messageContent.slice(0, 40) + (messageContent.length > 40 ? '...' : '');
            await updateDoc(doc(db, 'conversations', currentConvId), {
              title: title,
              lastMessageTime: serverTimestamp(),
              messageCount: 1
            });
          } else {
            await updateDoc(doc(db, 'conversations', currentConvId), {
              lastMessageTime: serverTimestamp(),
              messageCount: messages.length + 1
            });
          }
        } catch (error) {
          console.warn('Failed to save message to Firestore:', error);
        }
      }

      // Get AI response
      const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';

      // List of valid new models
      const validNewModels = [
        'gpt-5-mini',
        'gpt-5-nano',
        'gpt-4.1-mini',
        'gpt-4.1-nano',
        'gemini-2.5-flash-lite',
        'gemini-2.5-flash',
        'gemini-2.5-pro'
      ];

      // Map old model names to new ones if needed
      const modelMapping: Record<string, string> = {
        'gpt-4o': 'gpt-5-mini',
        'gpt-4o-mini': 'gpt-4.1-mini',
        'gpt-4-turbo': 'gpt-5-mini',
        'openai/gpt-4o': 'gpt-5-mini',
        'openai/gpt-4o-mini': 'gpt-4.1-mini',
        'x-ai/grok-4-fast:free': 'gpt-4.1-mini',
        'gemini-2.0-flash-exp': 'gemini-2.5-flash',
        'gemini-1.5-flash': 'gemini-2.5-flash',
        'gemini-1.5-pro': 'gemini-2.5-pro',
      };

      // Get the model from aiConfig or settings, with mapping for old models
      const savedModel = agent?.aiConfig?.model || agent?.settings?.model || 'gpt-5-mini';
      const mappedModel = validNewModels.includes(savedModel) 
        ? savedModel 
        : (modelMapping[savedModel] || 'gpt-5-mini');

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

      const response = await fetch(`${apiUrl}/api/ai/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageContent,
          conversationHistory: conversationHistory,
          agentId: agentId,
          conversationId: currentConvId,
          aiConfig: {
            enabled: true,
            model: mappedModel,
            temperature: agent?.aiConfig?.temperature ?? agent?.settings?.temperature ?? 0.7,
            systemPrompt: 'custom',
            customSystemPrompt: agent?.aiConfig?.customSystemPrompt || agent?.settings?.systemPrompt || 'You are a helpful AI assistant.',
            ragEnabled: agent?.aiConfig?.ragEnabled ?? true,
            embeddingProvider: ((agent?.aiConfig as Record<string, unknown>)?.embeddingProvider as string) ?? 'voyage',
            embeddingModel: ((agent?.aiConfig as Record<string, unknown>)?.embeddingModel as string) ?? 'voyage-3-large',
            rerankerEnabled: ((agent?.aiConfig as Record<string, unknown>)?.rerankerEnabled as boolean) ?? true,
            rerankerModel: ((agent?.aiConfig as Record<string, unknown>)?.rerankerModel as string) ?? 'rerank-2.5-lite',
            maxRetrievalDocs: agent?.aiConfig?.maxRetrievalDocs ?? 5,
            maxTokens: agent?.aiConfig?.maxTokens ?? agent?.settings?.maxTokens ?? 500,
            confidenceThreshold: agent?.aiConfig?.confidenceThreshold ?? 0.6,
            fallbackToHuman: agent?.aiConfig?.fallbackToHuman ?? false
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to get response: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      const tempMessageId = `temp_${Date.now()}`;

      // Set typing state first
      setIsTyping(true);

      if (reader) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const jsonData = line.slice(6).trim();
                  if (!jsonData || jsonData === '[DONE]') continue;

                  const data = JSON.parse(jsonData);
                  if (data.type === 'content' && data.content) {
                    assistantContent += data.content;
                    // Add or update the temporary message in real-time
                    setMessages(prev => {
                      const existingIndex = prev.findIndex(msg => msg.id === tempMessageId);
                      if (existingIndex >= 0) {
                        // Update existing temp message
                        return prev.map(msg => 
                          msg.id === tempMessageId 
                            ? { ...msg, content: assistantContent }
                            : msg
                        );
                      } else {
                        // Add new temp message
                        return [...prev, {
                          id: tempMessageId,
                          role: 'assistant',
                          content: assistantContent,
                          timestamp: new Date()
                        }];
                      }
                    });
                  }
                } catch (e) {
                  console.error('Error parsing SSE data:', e);
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      }

      // Stop typing indicator
      setIsTyping(false);

      // Replace temporary message with final message and save to Firestore
      if (!currentConvId.startsWith('local_') && assistantContent) {
        try {
          const messageRef = await addDoc(collection(db, 'messages'), {
            conversationId: currentConvId,
            content: assistantContent,
            role: 'assistant',
            timestamp: serverTimestamp(),
            agentId: agentId
          });

          // Remove temp message - Firestore listener will add the real one
          setMessages(prev => prev.filter(msg => msg.id !== tempMessageId));

          await updateDoc(doc(db, 'conversations', currentConvId), {
            lastMessageTime: serverTimestamp(),
            messageCount: messages.length + 2
          });
        } catch (error) {
          console.warn('Failed to save assistant message:', error);
          // Keep the temp message even if save fails - update it with final content
          setMessages(prev => prev.map(msg => 
            msg.id === tempMessageId 
              ? { ...msg, content: assistantContent }
              : msg
          ));
        }
      } else if (assistantContent) {
        // For local conversations, update the temp message with final content
        setMessages(prev => prev.map(msg => 
          msg.id === tempMessageId 
            ? { ...msg, content: assistantContent }
            : msg
        ));
      } else {
        // Remove temp message if no content received
        setMessages(prev => prev.filter(msg => msg.id !== tempMessageId));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const primaryColor = settings?.primaryColor || '#000000';
  const backgroundColor = settings?.backgroundColor || '#ffffff';
  const isDark = settings?.theme === 'dark';
  const hasMessages = messages.length > 0;

  return (
    <div
      className="h-screen flex overflow-hidden relative"
      style={{
        background: isDark
          ? `linear-gradient(to bottom right, ${backgroundColor}, #1a1a2e)`
          : `linear-gradient(to bottom right, ${backgroundColor}, #f8fafc)`,
        color: isDark ? '#ffffff' : '#000000'
      }}
    >
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: primaryColor }}
        ></div>
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: primaryColor }}
        ></div>
      </div>

      {/* Expand Button - Shows when collapsed */}
      {isSidebarCollapsed && (
        <button
          onClick={() => setIsSidebarCollapsed(false)}
          className="fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg shadow-lg border transition-colors"
          style={{ borderColor: primaryColor + '20' }}
        >
          <PanelLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      )}

      {/* Mobile overlay when sidebar is open */}
      {!isSidebarCollapsed && isMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsSidebarCollapsed(true)}
        />
      )}

      {/* Sidebar - Chat History */}
      <div
        className={`border-r flex flex-col overflow-y-auto bg-white dark:bg-gray-900 relative z-10 transition-all duration-300 ${
          isSidebarCollapsed 
            ? 'w-0 lg:w-0' 
            : isMobile 
              ? 'fixed inset-y-0 left-0 w-64 z-50 shadow-2xl' 
              : 'w-64'
        }`}
        style={{ borderColor: primaryColor + '20' }}
      >
        {!isSidebarCollapsed && (
          <>
            {/* Sidebar Header */}
            <div className="p-4 border-b flex-shrink-0" style={{ borderColor: primaryColor + '20' }}>
              {/* Collapse Button - Top Right */}
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setIsSidebarCollapsed(true)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  aria-label="Close sidebar"
                >
                  <PanelLeftClose className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              {/* New Chat Button */}
              <Button
                onClick={createNewConversation}
                variant="ghost"
                className="w-full justify-start mb-3 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <div className="w-6 h-6 rounded-full border-2 border-gray-600 dark:border-gray-400 flex items-center justify-center mr-2">
                  <Plus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </div>
                <span className="font-medium">New chat</span>
              </Button>

              {/* Dashboard Button */}
              <Button
                onClick={() => {
                  if (agent?.workspaceId) {
                    window.location.href = `/dashboard/${agent.workspaceId}/agents/${agentId}`;
                  }
                }}
                variant="outline"
                className="w-full"
              >
                Dashboard
              </Button>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              <div className="mb-3">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Recent chats
                </h3>
              </div>

              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => selectConversation(conversation.id)}
                  className={`
                    w-full text-left px-3 py-2.5 rounded-lg mb-1 transition-all group relative cursor-pointer
                    ${conversationId === conversation.id
                      ? 'bg-gray-100 dark:bg-gray-800'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate text-gray-900 dark:text-gray-100">
                        {conversation.firstMessage || conversation.title}
                      </p>
                    </div>
                    <button
                      onClick={(e) => deleteConversation(conversation.id, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                </div>
              ))}

              {conversations.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No conversations yet
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Collapse/Expand Button - Only show on desktop when sidebar is visible */}
      {!isMobile && (
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="fixed top-4 left-4 z-50 p-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-lg hover:shadow-xl transition-all border"
          style={{ borderColor: primaryColor + '30' }}
        >
          {isSidebarCollapsed ? (
            <PanelLeft className="w-5 h-5" style={{ color: primaryColor }} />
          ) : (
            <PanelLeftClose className="w-5 h-5" style={{ color: primaryColor }} />
          )}
        </button>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10 min-w-0">
        {!hasMessages ? (
          /* Centered Initial State */
          <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 md:px-8">
            <div className="w-full max-w-2xl space-y-6 md:space-y-8">
              {/* Hero Image - Only show if exists */}
              {settings?.heroImage && (
                <div className="relative inline-block mx-auto mb-6">
                  <div
                    className="absolute inset-0 blur-2xl opacity-30 rounded-full"
                    style={{ backgroundColor: primaryColor }}
                  ></div>
                  <img
                    src={settings.heroImage}
                    alt="Hero"
                    className="w-20 h-20 mx-auto object-cover rounded-2xl shadow-xl relative z-10 ring-4 ring-white/50"
                  />
                </div>
              )}

              {/* Header Text */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white bg-clip-text text-transparent mb-6 md:mb-8 px-4">
                {settings?.headerText || 'How can I help you today?'}
              </h1>

              {/* Centered Input */}
              <div className="relative w-full">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={settings?.inputPlaceholder || 'Ask me anything...'}
                    className="w-full h-20 pl-6 pr-16 text-lg rounded-xl border-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl shadow-xl focus:shadow-2xl transition-all border-border focus-visible:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    disabled={isTyping}
                    autoFocus
                  />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <div className="relative">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-10 w-10 rounded-lg"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    >
                      <Smile className="w-5 h-5 text-gray-400" />
                    </Button>

                    {showEmojiPicker && (
                      <div className="absolute top-full right-0 mt-2 z-50">
                        <EmojiPicker
                          onEmojiSelect={handleEmojiSelect}
                          onClose={() => setShowEmojiPicker(false)}
                        />
                      </div>
                    )}
                  </div>

                  <button
                    onClick={sendMessage}
                    disabled={isTyping || !inputValue.trim()}
                    className="cursor-pointer hover:scale-110 transition-transform disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isTyping ? (
                      <Loader2 className="w-6 h-6 animate-spin" style={{ color: primaryColor }} />
                    ) : (
                      <ArrowUp
                        className="w-6 h-6"
                        style={{
                          color: inputValue.trim() ? primaryColor : '#9ca3af'
                        }}
                      />
                    )}
                  </button>
                </div>
              </div>

              {/* Suggestions */}
              {settings?.suggestions && settings.suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center mt-4">
                  {settings.suggestions.map((suggestion) => (
                    <Button
                      key={suggestion.id}
                      variant="outline"
                      size="sm"
                      className="rounded-full bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm hover:bg-white/90 dark:hover:bg-gray-800/90 border-2 shadow-sm hover:shadow-md transition-all"
                      style={{ borderColor: primaryColor + '30' }}
                      onClick={() => handleSuggestionClick(suggestion.text)}
                    >
                      {suggestion.text}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Chat View - Messages at top, Input at bottom */
          <>
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 pb-4">
              <div className="max-w-3xl mx-auto space-y-4 md:space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} group`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex-shrink-0 mr-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold shadow-lg"
                          style={{ backgroundColor: primaryColor }}
                        >
                          AI
                        </div>
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] sm:max-w-[75%] rounded-xl px-4 py-3 sm:px-5 sm:py-3 shadow-md transition-all ${
                        message.role === 'user'
                          ? 'text-white backdrop-blur-xl'
                          : 'bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-gray-100 backdrop-blur-xl'
                      }`}
                      style={
                        message.role === 'user'
                          ? {
                              background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
                              boxShadow: `0 4px 12px ${primaryColor}40`
                            }
                          : {}
                      }
                    >
                      {message.content ? (
                        <p className="whitespace-pre-wrap leading-relaxed text-sm sm:text-base break-words">{message.content}</p>
                      ) : null}
                    </div>

                    {message.role === 'user' && (
                      <div className="flex-shrink-0 ml-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold shadow-lg">
                          U
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Typing Indicator - Only show when typing and no streaming message exists */}
                {isTyping && !messages.some(msg => msg.id.startsWith('temp_')) && (
                  <div className="flex justify-start">
                    <div className="flex items-start gap-3">
                      {/* AI Avatar */}
                      <div className="flex-shrink-0">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold shadow-lg"
                          style={{ backgroundColor: primaryColor }}
                        >
                          AI
                        </div>
                      </div>
                      {/* Typing Animation - Match ChatWidget style */}
                      <div className="max-w-[85%] sm:max-w-[75%] rounded-xl px-4 py-3 shadow-md bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl">
                        <div className="flex items-center gap-1">
                          <span className="text-2xl animate-bounce" style={{ animationDuration: '1s' }}>•</span>
                          <span className="text-2xl animate-bounce" style={{ animationDuration: '1s', animationDelay: '0.2s' }}>•</span>
                          <span className="text-2xl animate-bounce" style={{ animationDuration: '1s', animationDelay: '0.4s' }}>•</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area - Fixed at bottom */}
            <div
              className="border-t p-3 sm:p-4 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80"
              style={{ borderColor: primaryColor + '20' }}
            >
              <div className="max-w-3xl mx-auto">
                <div className="relative">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={settings?.inputPlaceholder || 'Ask me anything...'}
                    className="w-full h-16 sm:h-20 pl-4 pr-20 sm:pr-24 text-sm sm:text-base rounded-xl border-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl shadow-lg focus:shadow-xl transition-all border-border focus-visible:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    disabled={isTyping}
                  />
                  <div className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 sm:gap-2">
                    <div className="relative">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 rounded-lg"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      >
                        <Smile className="w-5 h-5 text-gray-400" />
                      </Button>

                      {showEmojiPicker && (
                        <div className="absolute bottom-full right-0 mb-2 z-50">
                          <EmojiPicker
                            onEmojiSelect={handleEmojiSelect}
                            onClose={() => setShowEmojiPicker(false)}
                          />
                        </div>
                      )}
                    </div>

                    <button
                      onClick={sendMessage}
                      disabled={isTyping || !inputValue.trim()}
                      className="cursor-pointer hover:scale-110 transition-transform disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isTyping ? (
                        <Loader2 className="w-5 h-5 animate-spin" style={{ color: primaryColor }} />
                      ) : (
                        <ArrowUp
                          className="w-5 h-5"
                          style={{
                            color: inputValue.trim() ? primaryColor : '#9ca3af'
                          }}
                        />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

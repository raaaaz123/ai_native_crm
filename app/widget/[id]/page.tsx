"use client";

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { 
  getChatWidget, 
  createChatConversation, 
  sendMessage, 
  subscribeToMessages
} from '../../lib/chat-utils';
import type { 
  ChatWidget,
  ChatMessage,
  ChatConversation
} from '../../lib/chat-utils';
import { apiClient } from '../../lib/api-client';
import type { AIChatRequest, AIConfig } from '../../lib/api-client';
import { 
  MessageCircle, 
  Send,
  Bot,
  Loader2,
  AlertCircle,
  History,
  ChevronLeft,
  Plus
} from 'lucide-react';

export default function ChatWidget() {
  const params = useParams();
  const widgetId = params.id as string;
  
  const [widget, setWidget] = useState<ChatWidget | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Chat state
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  
  // User info state
  const [showUserForm, setShowUserForm] = useState(true);
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: ''
  });
  const [submittingUserInfo, setSubmittingUserInfo] = useState(false);

  // Chat history state
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{
    id: string;
    lastMessage: string;
    timestamp: string;
    messageCount: number;
    customerName: string;
    status: string;
  }>>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Extended widget type
  type ExtendedWidget = ChatWidget & {
    requireContactForm?: boolean;
    collectName?: boolean;
    textColor?: string;
    headerSubtitle?: string;
    showBranding?: boolean;
    aiConfig?: {
    enabled: boolean;
      provider?: string;
      model?: string;
      temperature?: number;
      maxTokens?: number;
      confidenceThreshold?: number;
      maxRetrievalDocs?: number;
      ragEnabled?: boolean;
      fallbackToHuman?: boolean;
      embeddingProvider?: string;
      embeddingModel?: string;
      rerankerEnabled?: boolean;
      rerankerModel?: string;
      systemPrompt?: string;
    customSystemPrompt?: string;
    };
    customerHandover?: {
      enabled?: boolean;
      showHandoverButton?: boolean;
      handoverButtonText?: string;
      handoverButtonPosition?: string;
      includeInQuickReplies?: boolean;
      autoDetectKeywords?: boolean;
      detectionKeywords?: string[];
      handoverMessage?: string;
      notificationToAgent?: boolean;
      allowCustomerToSwitch?: boolean;
      smartFallbackEnabled?: boolean;
    };
  };

  // Get initials from name
  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const loadWidget = useCallback(async () => {
    try {
      const result = await getChatWidget(widgetId);
      if (result.success) {
        setWidget(result.data);
        
        const extendedData = result.data as ExtendedWidget;
        const requireContactForm = extendedData.requireContactForm !== undefined 
          ? extendedData.requireContactForm 
          : true;
        
        if (!requireContactForm) {
          setUserInfo({
            name: 'Anonymous User',
            email: `anonymous_${Date.now()}@chat.widget`
          });
          setShowUserForm(false);
          
          const convResult = await createChatConversation(result.data.businessId, widgetId, {
            customerName: 'Anonymous User',
            customerEmail: `anonymous_${Date.now()}@chat.widget`
          });
          
          if (convResult.success) {
            setConversation(convResult.data);
            subscribeToMessages(convResult.data.id, (messages) => {
              setMessages(messages);
            });
            
            // Send welcome message
            await sendMessage(convResult.data.id, {
              text: result.data.welcomeMessage || 'Welcome! How can we help you today?',
              sender: 'business',
              senderName: 'AI Assistant'
            });
          }
        }
      } else {
        setError('Widget not found');
      }
    } catch {
      setError('Failed to load widget');
    } finally {
      setLoading(false);
    }
  }, [widgetId]);

  useEffect(() => {
    if (widgetId) {
      loadWidget();
    }
  }, [widgetId, loadWidget]);

  const loadChatHistory = async () => {
    if (!userInfo.email || !widgetId) return;
    
    setLoadingHistory(true);
    try {
      const result = await apiClient.getUserChatHistory(widgetId, userInfo.email, 10);
      
      if (result.success && result.data) {
        const responseData = result.data as { data?: Array<{ id: string; lastMessage: string; timestamp: string; messageCount: number; customerName: string; status: string }> };
        setChatHistory(responseData.data || []);
      }
    } catch (err) {
      console.error('Error loading chat history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadPreviousConversation = async (conversationId: string) => {
    if (!userInfo.email) return;
    
    setLoadingHistory(true);
    try {
      const result = await apiClient.getConversationById(conversationId, userInfo.email);
      
      if (result.success && result.data) {
        const responseData = result.data as { 
          data: { 
            conversation: { status?: 'active' | 'closed' | 'pending' | 'resolved' | 'unsolved' | 'custom' }; 
            messages: Array<{ 
              id: string; 
              text: string; 
              sender: 'customer' | 'business'; 
              timestamp: string; 
              metadata?: Record<string, unknown> 
            }> 
          } 
        };
        const convData = responseData.data;
        
        setConversation({
          id: conversationId,
          businessId: widget?.businessId || '',
          widgetId: widgetId,
          customerName: userInfo.name,
          customerEmail: userInfo.email,
          status: convData.conversation.status || 'active',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          unreadCount: 0
        });
        
        const loadedMessages: ChatMessage[] = convData.messages.map((msg) => ({
          id: msg.id,
          conversationId: conversationId,
          text: msg.text,
          sender: msg.sender,
          senderName: msg.sender === 'customer' ? userInfo.name : 'Support',
          createdAt: new Date(msg.timestamp).getTime(),
          readAt: undefined,
          metadata: msg.metadata || {}
        }));
        
        setMessages(loadedMessages);
        setShowChatHistory(false);
        setShowUserForm(false);
      }
    } catch (err) {
      console.error('Error loading previous conversation:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleStartChat = async () => {
    if (!userInfo.name || !userInfo.email || !widget) return;

    setSubmittingUserInfo(true);
    try {
      await loadChatHistory();
      
      const result = await createChatConversation(widget.businessId, widgetId, {
        customerName: userInfo.name,
        customerEmail: userInfo.email
      });

      if (result.success) {
        setConversation(result.data);
        setShowUserForm(false);

        subscribeToMessages(result.data.id, (messages) => {
          setMessages(messages);
        });

        // Send welcome message
        await sendMessage(result.data.id, {
          text: widget.welcomeMessage || 'Welcome! How can we help you today?',
          sender: 'business',
          senderName: 'AI Assistant'
        });
      }
    } catch (err) {
      console.error('Error starting chat:', err);
    } finally {
      setSubmittingUserInfo(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversation || sending || !widget) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      await sendMessage(conversation.id, {
        text: messageText,
        sender: 'customer',
        senderName: userInfo.name
      });

      const extendedWidget = widget as ExtendedWidget;
      const aiConfig = extendedWidget.aiConfig;
      
      if (aiConfig && aiConfig.enabled) {
        setAiThinking(true);
        
        try {
          const aiConfigObj: AIConfig = {
            enabled: aiConfig.enabled,
            provider: (aiConfig as Record<string, unknown>).provider as string || 'openrouter',
            model: (aiConfig as Record<string, unknown>).model as string || 'openai/gpt-5-mini',
            temperature: (aiConfig as Record<string, unknown>).temperature as number || 0.7,
            maxTokens: (aiConfig as Record<string, unknown>).maxTokens as number || 500,
            confidenceThreshold: (aiConfig as Record<string, unknown>).confidenceThreshold as number || 0.6,
            maxRetrievalDocs: (aiConfig as Record<string, unknown>).maxRetrievalDocs as number || 5,
            ragEnabled: (aiConfig as Record<string, unknown>).ragEnabled as boolean || false,
            fallbackToHuman: (aiConfig as Record<string, unknown>).fallbackToHuman !== undefined ? (aiConfig as Record<string, unknown>).fallbackToHuman as boolean : true,
            embeddingProvider: (aiConfig as Record<string, unknown>).embeddingProvider as string || 'openai',
            embeddingModel: (aiConfig as Record<string, unknown>).embeddingModel as string || 'text-embedding-3-large',
            rerankerEnabled: (aiConfig as Record<string, unknown>).rerankerEnabled !== undefined ? (aiConfig as Record<string, unknown>).rerankerEnabled as boolean : true,
            rerankerModel: (aiConfig as Record<string, unknown>).rerankerModel as string || 'rerank-2.5',
            systemPrompt: (aiConfig as Record<string, unknown>).systemPrompt as string || 'support',
            customSystemPrompt: (aiConfig as Record<string, unknown>).customSystemPrompt as string || ''
          };

          const aiRequest: AIChatRequest = {
            message: messageText,
            widgetId: widgetId,
            conversationId: conversation.id,
            aiConfig: aiConfigObj,
            businessId: widget.businessId,
            customerName: userInfo.name,
            customerEmail: userInfo.email,
            customerHandover: extendedWidget.customerHandover ? {
              enabled: extendedWidget.customerHandover.enabled !== undefined ? !!extendedWidget.customerHandover.enabled : false,
              showHandoverButton: extendedWidget.customerHandover.showHandoverButton !== undefined ? !!extendedWidget.customerHandover.showHandoverButton : false,
              handoverButtonText: extendedWidget.customerHandover.handoverButtonText || 'Talk to Human Agent',
              handoverButtonPosition: extendedWidget.customerHandover.handoverButtonPosition || 'bottom',
              includeInQuickReplies: extendedWidget.customerHandover.includeInQuickReplies !== undefined ? !!extendedWidget.customerHandover.includeInQuickReplies : false,
              autoDetectKeywords: extendedWidget.customerHandover.autoDetectKeywords !== undefined ? !!extendedWidget.customerHandover.autoDetectKeywords : false,
              detectionKeywords: extendedWidget.customerHandover.detectionKeywords || [],
              handoverMessage: extendedWidget.customerHandover.handoverMessage || "I'll connect you with a human agent.",
              notificationToAgent: extendedWidget.customerHandover.notificationToAgent !== undefined ? !!extendedWidget.customerHandover.notificationToAgent : false,
              allowCustomerToSwitch: extendedWidget.customerHandover.allowCustomerToSwitch !== undefined ? !!extendedWidget.customerHandover.allowCustomerToSwitch : false,
              smartFallbackEnabled: extendedWidget.customerHandover.smartFallbackEnabled !== undefined ? !!extendedWidget.customerHandover.smartFallbackEnabled : true
            } : undefined
          };

          const aiResponse = await apiClient.sendAIMessage(aiRequest);
          
          if (aiResponse.success && aiResponse.data) {
            const responseData = aiResponse.data;
            
            const metadata: Record<string, unknown> = {
              ai_generated: true,
              confidence: responseData.confidence,
              sources: responseData.sources,
              shouldFallbackToHuman: responseData.shouldFallbackToHuman
            };
            
            if (responseData.metadata?.handover_confirmed === true) {
              metadata.handover_confirmed = true;
            }
            
              await sendMessage(conversation.id, {
                text: responseData.response,
                sender: 'business',
              senderName: 'AI Assistant',
              metadata
            });
            
            setAiThinking(false);
          } else {
            await sendMessage(conversation.id, {
              text: "I'm having trouble processing your request. Let me connect you with a human agent.",
              sender: 'business',
              senderName: 'AI Assistant',
              metadata: {
                ai_generated: true,
                fallback_message: true,
                error: aiResponse.error
              }
            });
            setAiThinking(false);
          }
        } catch (aiError) {
          console.error('AI response error:', aiError);
          
          await sendMessage(conversation.id, {
            text: "I'm having trouble processing your request. Let me connect you with a human agent.",
            sender: 'business',
            senderName: 'AI Assistant',
            metadata: {
              ai_generated: true,
              fallback_message: true,
              error: 'AI service unavailable'
            }
          });
          setAiThinking(false);
        } finally {
          setAiThinking(false);
          setSending(false);
        }
      } else {
        setSending(false);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (showUserForm) {
        handleStartChat();
      } else {
        handleSendMessage();
      }
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Loading chat widget...</p>
        </div>
      </div>
    );
  }

  if (error || !widget) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Widget Not Available</h2>
          <p className="text-gray-600">{error || 'This chat widget could not be found.'}</p>
        </div>
      </div>
    );
  }

  const extendedWidget = widget as ExtendedWidget;
  const primaryColor = widget.primaryColor || '#3B82F6';
  const textColor = extendedWidget.textColor || '#FFFFFF';
  const headerSubtitle = extendedWidget.headerSubtitle || "We're here to help!";
  const showBranding = extendedWidget.showBranding !== undefined ? extendedWidget.showBranding : true;

  return (
    <>
      {/* Modern Premium Styles */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        @keyframes pulse-soft {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        .glass-morphism {
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .premium-shadow {
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04);
        }
        .premium-shadow-lg {
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12), 0 8px 24px rgba(0, 0, 0, 0.08);
        }
      `}</style>

      <div className="fixed inset-0 bg-gradient-to-br from-gray-50 via-white to-blue-50">
        {/* Mobile-first responsive chat */}
        <div className="h-full w-full max-w-2xl mx-auto flex flex-col glass-morphism premium-shadow-lg">
          {/* Modern Header */}
          <div
            className="px-4 sm:px-6 py-4 flex items-center justify-between flex-shrink-0 relative overflow-hidden"
            style={{ 
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
              color: textColor
            }}
          >
            {/* Subtle pattern overlay */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.3) 1px, transparent 1px)`,
              backgroundSize: '20px 20px'
            }} />
            
            <div className="flex items-center gap-3 min-w-0 relative z-10">
            {showChatHistory && (
              <button
                onClick={() => setShowChatHistory(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-all duration-200 flex-shrink-0 group"
                  title="Back to Chat"
              >
                  <ChevronLeft className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>
            )}
              
              <div className="flex-shrink-0 p-2 bg-white/20 rounded-full backdrop-blur-sm">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-base sm:text-lg truncate tracking-tight">
                  {showChatHistory ? 'Your Conversations' : widget.name}
                </h3>
                <p className="text-xs sm:text-sm opacity-90 truncate font-medium">
                {showChatHistory 
                  ? `${chatHistory.length} conversation${chatHistory.length !== 1 ? 's' : ''}`
                    : headerSubtitle
                }
              </p>
            </div>
          </div>
            
            <div className="flex items-center gap-2 flex-shrink-0 relative z-10">
            {!showUserForm && !showChatHistory && userInfo.email && (
              <button
                onClick={() => {
                  setShowChatHistory(true);
                  loadChatHistory();
                }}
                  className="p-2 hover:bg-white/20 rounded-full transition-all duration-200 group"
                title="Chat History"
              >
                  <History className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>
            )}
              {extendedWidget.aiConfig?.enabled && !showChatHistory && (
                <div className="flex items-center space-x-1.5 text-xs opacity-90 px-2 py-1 bg-white/20 rounded-full backdrop-blur-sm">
                  <Bot className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline font-medium">AI Powered</span>
              </div>
            )}
          </div>
        </div>

        {/* Chat Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
          {showChatHistory ? (
              /* Chat History View */
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
                </div>
              ) : chatHistory.length === 0 ? (
                <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <History className="w-10 h-10 text-gray-300" />
                    </div>
                    <p className="text-gray-700 font-semibold mb-2">No chat history yet</p>
                    <p className="text-gray-500 text-sm mb-6">Start a new conversation to see it here</p>
                    <button
                    onClick={() => {
                      setShowChatHistory(false);
                        if (!conversation) {
                          handleStartChat();
                      }
                    }}
                      className="px-6 py-3 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                      style={{ backgroundColor: primaryColor }}
                  >
                      <Plus className="w-4 h-4 mr-2 inline" />
                    Start New Conversation
                    </button>
                </div>
              ) : (
                  <>
                  <button
                    onClick={() => {
                      setShowChatHistory(false);
                      setMessages([]);
                      setConversation(null);
                      handleStartChat();
                    }}
                      className="w-full p-4 border-2 border-dashed rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all text-left"
                      style={{ borderColor: primaryColor }}
                  >
                    <div className="flex items-center gap-3">
                        <Plus className="w-5 h-5" style={{ color: primaryColor }} />
                        <span className="font-semibold text-base" style={{ color: primaryColor }}>
                        Start New Conversation
                      </span>
                    </div>
                  </button>
                  
                  {chatHistory.map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => loadPreviousConversation(chat.id)}
                        className="w-full p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div 
                            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform"
                            style={{ backgroundColor: primaryColor }}
                        >
                          <MessageCircle className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                            {chat.lastMessage || 'Conversation'}
                          </p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                            <span>{chat.messageCount} messages</span>
                            <span>•</span>
                            <span>{new Date(chat.timestamp).toLocaleDateString()}</span>
                          </div>
                        </div>
                        {chat.status === 'active' && (
                            <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0 animate-pulse"></div>
                        )}
                      </div>
                    </button>
                  ))}
                  </>
              )}
            </div>
          ) : showUserForm ? (
            /* User Info Form */
              <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 sm:p-8">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                      <MessageCircle className="w-8 h-8 text-blue-600" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                      Start a Conversation
                    </h2>
                    <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                      {widget.welcomeMessage}
                    </p>
                    {extendedWidget.aiConfig?.enabled && (
                      <div className="mt-3 flex items-center justify-center space-x-2 text-sm text-blue-600 bg-blue-50 py-2 px-4 rounded-lg">
                        <Bot className="w-4 h-4" />
                        <span className="font-medium">AI-powered assistance available</span>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                    {(extendedWidget.collectName !== false) && (
                  <div>
                        <label htmlFor="name" className="block text-sm font-semibold text-gray-800 mb-2">
                          Full Name *
                        </label>
                    <input
                      id="name"
                      type="text"
                          placeholder="Enter your full name"
                      value={userInfo.name}
                      onChange={(e) => setUserInfo(prev => ({ ...prev, name: e.target.value }))}
                      onKeyPress={handleKeyPress}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-gray-50/50 backdrop-blur-sm"
                    />
                  </div>
                    )}
                  <div>
                      <label htmlFor="email" className="block text-sm font-semibold text-gray-800 mb-2">
                        Email Address *
                      </label>
                    <input
                      id="email"
                      type="email"
                        placeholder="Enter your email address"
                      value={userInfo.email}
                      onChange={(e) => setUserInfo(prev => ({ ...prev, email: e.target.value }))}
                      onKeyPress={handleKeyPress}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-gray-50/50 backdrop-blur-sm"
                    />
                  </div>
                    <button
                    onClick={handleStartChat}
                    disabled={!userInfo.name || !userInfo.email || submittingUserInfo}
                      className="w-full py-3.5 px-4 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      style={{ 
                        background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
                        boxShadow: `0 4px 16px ${primaryColor}40`
                      }}
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                    {submittingUserInfo ? (
                      <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                        Starting Chat...
                      </>
                    ) : (
                          <>
                            <MessageCircle className="w-5 h-5" />
                            Start Conversation
                          </>
                    )}
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    </button>
                  </div>
                </div>
            </div>
          ) : (
              /* Modern Chat Interface */
            <>
                {/* Messages Area */}
                <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-gradient-to-b from-gray-50/30 to-white/50">
                {messages.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageCircle className="w-8 h-8 text-gray-300" />
                      </div>
                      <p className="text-gray-600 font-medium">No messages yet</p>
                      <p className="text-gray-500 text-sm mt-1">Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                        className={`flex items-end gap-2 ${
                          message.sender === 'customer'
                            ? 'justify-end' 
                            : 'justify-start'
                        }`}
                      >
                        {message.sender === 'customer' ? (
                          <>
                            <div
                              className="max-w-[85%] sm:max-w-[75%] px-4 py-3 rounded-2xl shadow-md relative overflow-hidden group"
                              style={{ 
                                backgroundColor: primaryColor,
                                borderRadius: '18px 18px 4px 18px'
                              }}
                            >
                              <p className="text-sm sm:text-base whitespace-pre-wrap break-words leading-relaxed text-white">
                                {message.text}
                              </p>
                              <p className="text-xs mt-1 text-right text-white/70">
                                {message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                              </p>
                            </div>
                            
                            <div 
                              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold shadow-sm"
                              style={{ backgroundColor: primaryColor }}
                            >
                              {getInitials(userInfo.name || 'User')}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-300 shadow-sm">
                              <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                        </div>
                            
                            <div className="max-w-[85%] sm:max-w-[75%] px-4 py-3 rounded-2xl shadow-sm border bg-gray-100 border-gray-200 relative overflow-hidden group" style={{ 
                              borderRadius: '18px 18px 18px 4px'
                            }}>
                              <p className="text-sm sm:text-base whitespace-pre-wrap break-words leading-relaxed text-gray-700">
                                {message.text}
                              </p>
                              
                        {message.metadata?.ai_generated === true && (
                                <div className="mt-2 pt-2 border-t border-gray-300">
                                  <div className="flex items-center gap-2 text-xs text-gray-600">
                                    <Bot className="w-3 h-3" />
                                    <span>AI</span>
                                {typeof message.metadata.confidence === 'number' && (
                                      <span className="text-gray-500">
                                        • {Math.round(message.metadata.confidence * 100)}%
                                      </span>
                                )}
                              </div>
                                </div>
                              )}
                              
                              <p className="text-xs mt-1 text-gray-500">
                                {message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                              </p>
                            </div>
                          </>
                        )}
                    </div>
                  ))
                )}
                
                {aiThinking && (
                    <div className="flex items-end gap-2 justify-start">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-300 shadow-sm">
                        <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                      </div>
                      <div className="max-w-[85%] sm:max-w-[75%] px-4 py-3 rounded-2xl shadow-sm border bg-gray-100 border-gray-200" style={{ 
                        borderRadius: '18px 18px 18px 4px' 
                      }}>
                        <div className="flex items-center space-x-2">
                          <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                          <span className="text-sm text-gray-700">AI is thinking...</span>
                        </div>
                    </div>
                  </div>
                )}
              </div>

                {/* Modern Input */}
                <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="p-4 sm:p-6 border-t border-gray-200/60 bg-white/80 backdrop-blur-sm">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex-1 relative">
                  <textarea
                        placeholder={widget.placeholderText || 'Type your message...'}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    rows={1}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm sm:text-base bg-white/90 backdrop-blur-sm transition-all duration-200 placeholder-gray-500 font-medium resize-none"
                        style={{ minHeight: '48px', maxHeight: '120px' }}
                    disabled={sending || aiThinking}
                  />
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 focus-within:opacity-100 transition-opacity duration-200 pointer-events-none" />
                    </div>
                    <button
                      type="submit"
                      disabled={sending || aiThinking || !newMessage.trim()}
                      className="p-3 sm:p-3.5 text-white rounded-2xl hover:shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:transform-none relative overflow-hidden group flex-shrink-0"
                      style={{ 
                        background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
                        boxShadow: `0 4px 16px ${primaryColor}40`
                      }}
                  >
                    {sending || aiThinking ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Send className="w-5 h-5 group-hover:translate-x-0.5 transition-transform duration-200" />
                    )}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    </button>
                </div>
                
                  {extendedWidget.aiConfig?.enabled && (
                    <div className="mt-2 flex items-center justify-center space-x-1.5 text-xs text-gray-500">
                      <Bot className="w-3.5 h-3.5" />
                      <span className="font-medium">AI-powered responses enabled</span>
                    </div>
                  )}
                </form>

                {/* Modern Branding */}
                {showBranding && (
                  <div className="px-4 sm:px-6 py-3 border-t border-gray-200/60 bg-gradient-to-r from-gray-50/50 to-white/50 backdrop-blur-sm">
                    <p className="text-xs text-center text-gray-500 font-medium">
                      Powered by <span className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Rexa AI</span>
                    </p>
                  </div>
                )}
            </>
          )}
        </div>
      </div>
    </div>
    </>
  );
}

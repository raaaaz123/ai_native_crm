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
import { apiClient, ChatRequest, ChatResponse, AIChatRequest, AIChatResponse } from '../../lib/api-client';
import { 
  MessageCircle, 
  Send,
  Bot,
  User,
  Loader2,
  AlertCircle,
  CheckCircle,
  History,
  ChevronLeft,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Avatar from '../../components/ui/avatar';
import { getMessageAvatar } from '../../lib/avatar-utils';

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

  // AI Configuration
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiConfig, setAiConfig] = useState<ChatWidget['aiConfig'] | null>(null);

  const loadWidget = useCallback(async () => {
    try {
      const result = await getChatWidget(widgetId);
      if (result.success) {
        setWidget(result.data);
        
        // Check if contact form is required
        const requireContactForm = result.data.requireContactForm !== undefined 
          ? result.data.requireContactForm 
          : true;
        
        if (!requireContactForm) {
          // Skip contact form, use anonymous user
          setUserInfo({
            name: 'Anonymous User',
            email: `anonymous_${Date.now()}@chat.widget`
          });
          setShowUserForm(false);
          
          // Create conversation immediately
          const convResult = await createChatConversation(result.data.businessId, widgetId, {
            customerName: 'Anonymous User',
            customerEmail: `anonymous_${Date.now()}@chat.widget`
          });
          
          if (convResult.success) {
            setConversation(convResult.data);
            const unsubscribe = subscribeToMessages(convResult.data.id, (messages) => {
              setMessages(messages);
            });
          }
        }
        
        // Check if AI is enabled for this widget
        const aiConfig = result.data.aiConfig;
        if (aiConfig && aiConfig.enabled) {
          setAiEnabled(true);
          setAiConfig(aiConfig);
        } else {
          // Fallback: Enable AI with OpenRouter config if no AI config exists
          const defaultAiConfig = {
            enabled: true,
            provider: 'openrouter',
            model: 'deepseek/deepseek-chat-v3.1:free',
            temperature: 0.7,
            maxTokens: 500,
            confidenceThreshold: 0.6,
            maxRetrievalDocs: 5,
            ragEnabled: true,
            fallbackToHuman: true
          };
          setAiEnabled(true);
          setAiConfig(defaultAiConfig);
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
        setChatHistory(result.data.data || []);
        console.log(`✅ Loaded ${result.data.data?.length || 0} previous conversations for user`);
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
        const convData = result.data.data;
        
        // Set conversation data
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
        
        // Load messages
        const loadedMessages: ChatMessage[] = convData.messages.map((msg: ChatMessage) => ({
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
        
        console.log(`✅ Loaded previous conversation with ${loadedMessages.length} messages`);
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
      // Load chat history first
      await loadChatHistory();
      
      const result = await createChatConversation(widget.businessId, widgetId, {
        customerName: userInfo.name,
        customerEmail: userInfo.email
      });

      if (result.success) {
        setConversation(result.data);
        setShowUserForm(false);

        // Subscribe to messages
        const unsubscribe = subscribeToMessages(result.data.id, (messages) => {
          setMessages(messages);
        });

        // Store unsubscribe function for cleanup
        return () => unsubscribe();
      }
    } catch (err) {
      console.error('Error starting chat:', err);
    } finally {
      setSubmittingUserInfo(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversation || sending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      // Add user message to local state immediately
      const userMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        conversationId: conversation.id,
        text: messageText,
        sender: 'customer',
        senderName: userInfo.name,
        createdAt: Date.now(),
        readAt: undefined
      };
      setMessages(prev => [...prev, userMessage]);

      // Send message to backend
      await sendMessage(conversation.id, {
        text: messageText,
        sender: 'customer',
        senderName: userInfo.name
      });

      // If AI is enabled, get AI response
      if (aiEnabled && aiConfig) {
        setAiThinking(true);
        
        try {
          const aiRequest = {
            message: messageText,
            widgetId: widgetId,
            conversationId: conversation.id,
            aiConfig: aiConfig,
            businessId: widget?.businessId || '',
            customerName: userInfo.name,
            customerEmail: userInfo.email
          };

          // Debug logging - print all data being sent to API
          console.log('=== AI CHAT API DEBUG ===');
          console.log('API Route: POST /api/ai/chat');
          console.log('API Base URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001');
          console.log('Full API Endpoint:', `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/ai/chat`);
          console.log('Request Data:', JSON.stringify(aiRequest, null, 2));
          console.log('AI Config:', JSON.stringify(aiConfig, null, 2));
          console.log('========================');

          const aiResponse = await apiClient.sendAIMessage(aiRequest);
          
          // Debug logging - print API response
          console.log('=== AI CHAT API RESPONSE ===');
          console.log('Response Success:', aiResponse.success);
          console.log('Response Data:', JSON.stringify(aiResponse.data, null, 2));
          console.log('Response Error:', aiResponse.error);
          console.log('============================');
          
          if (aiResponse.success && aiResponse.data) {
            const responseData = aiResponse.data;
            
            // Use the configured threshold or default to 0.6
            const currentThreshold = aiConfig?.confidenceThreshold || 0.6;
            
            console.log('=== CONFIDENCE CHECK ===');
            console.log('Response Confidence:', responseData.confidence);
            console.log('Current Threshold:', currentThreshold);
            console.log('AI Config Threshold:', aiConfig?.confidenceThreshold);
            console.log('AI Response:', responseData.response);
            console.log('Backend shouldFallbackToHuman:', responseData.shouldFallbackToHuman);
            console.log('========================');
            
            // Debug confidence check
            console.log('=== CONFIDENCE DEBUG (LIVE WIDGET) ===');
            console.log('Response Confidence:', responseData.confidence);
            console.log('Backend shouldFallbackToHuman:', responseData.shouldFallbackToHuman);
            console.log('Backend decided to fallback?', responseData.shouldFallbackToHuman);
            console.log('=====================================');
            
            // Use the backend's decision on whether to fallback
            if (!responseData.shouldFallbackToHuman) {
              // Confidence is high enough, show AI response
              await sendMessage(conversation.id, {
                text: responseData.response,
                sender: 'business',
                senderName: 'AI Assistant'
              });
            } else {
              // Confidence is too low, show fallback message
              await sendMessage(conversation.id, {
                text: "I'm not confident enough to answer that question accurately. Let me connect you with a human agent who can provide you with the right information.",
                sender: 'business',
                senderName: 'AI Assistant'
              });
            }
          } else {
            // AI failed, show fallback message
            const fallbackMessage: ChatMessage = {
              id: `fallback-${Date.now()}`,
              conversationId: conversation.id,
              text: "I'm having trouble processing your request. Let me connect you with a human agent.",
              sender: 'business',
              senderName: 'AI Assistant',
              createdAt: Date.now(),
              readAt: undefined,
              metadata: {
                ai_generated: true,
                fallback_message: true,
                error: aiResponse.error
              }
            };
            setMessages(prev => [...prev, fallbackMessage]);
          }
        } catch (aiError) {
          console.error('AI response error:', aiError);
          
          // Show fallback message
          const fallbackMessage: ChatMessage = {
            id: `fallback-${Date.now()}`,
            conversationId: conversation.id,
            text: "I'm having trouble processing your request. Let me connect you with a human agent.",
            sender: 'business',
            senderName: 'AI Assistant',
            createdAt: Date.now(),
            readAt: undefined,
            metadata: {
              ai_generated: true,
              fallback_message: true,
              error: 'AI service unavailable'
            }
          };
          setMessages(prev => [...prev, fallbackMessage]);
        } finally {
          setAiThinking(false);
        }
      }
    } catch (err) {
      console.error('Error sending message:', err);
      // Remove the temporary message on error
      setMessages(prev => prev.filter(msg => msg.id !== `temp-${Date.now()}`));
    } finally {
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
      <div className="fixed inset-0 bg-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-neutral-600">Loading chat widget...</p>
        </div>
      </div>
    );
  }

  if (error || !widget) {
    return (
      <div className="fixed inset-0 bg-neutral-100 flex items-center justify-center">
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">Widget Not Available</h2>
          <p className="text-neutral-600">{error || 'This chat widget could not be found.'}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-neutral-100">
      {/* Mobile-first full screen chat */}
      <div className="h-full flex flex-col">
        {/* Header */}
        <div
          className="p-4 text-white flex items-center justify-between"
          style={{ backgroundColor: widget.primaryColor }}
        >
          <div className="flex items-center space-x-3">
            {showChatHistory && (
              <button
                onClick={() => setShowChatHistory(false)}
                className="p-1.5 hover:bg-white/20 rounded transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <MessageCircle className="w-6 h-6" />
            <div>
              <h1 className="font-semibold">{showChatHistory ? 'Your Conversations' : widget.name}</h1>
              <p className="text-sm opacity-90">
                {showChatHistory 
                  ? `${chatHistory.length} conversation${chatHistory.length !== 1 ? 's' : ''}`
                  : aiEnabled ? 'AI-powered support' : 'We typically reply instantly'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!showUserForm && !showChatHistory && userInfo.email && (
              <button
                onClick={() => {
                  setShowChatHistory(true);
                  loadChatHistory();
                }}
                className="p-2 hover:bg-white/20 rounded transition-colors"
                title="Chat History"
              >
                <History className="w-5 h-5" />
              </button>
            )}
            {aiEnabled && !showChatHistory && (
              <div className="flex items-center space-x-1 text-xs opacity-90">
                <Bot className="w-4 h-4" />
                <span className="hidden sm:inline">AI Enabled</span>
              </div>
            )}
          </div>
        </div>

        {/* Chat Content */}
        <div className="flex-1 flex flex-col">
          {showChatHistory ? (
            /* Chat History List */
            <div className="flex-1 overflow-y-auto p-4">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : chatHistory.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-16 h-16 mx-auto text-neutral-300 mb-4" />
                  <p className="text-neutral-600 font-medium mb-2">No previous conversations</p>
                  <p className="text-neutral-500 text-sm mb-6">Start a new conversation to see it here</p>
                  <Button
                    onClick={() => {
                      setShowChatHistory(false);
                      if (conversation) {
                        // Already have an active conversation
                        return;
                      }
                      // Start new conversation
                      handleStartChat();
                    }}
                    style={{ backgroundColor: widget.primaryColor }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Start New Conversation
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setShowChatHistory(false);
                      setMessages([]);
                      setConversation(null);
                      handleStartChat();
                    }}
                    className="w-full p-4 border-2 border-dashed rounded-lg hover:bg-blue-50 transition-all text-left"
                    style={{ borderColor: widget.primaryColor }}
                  >
                    <div className="flex items-center gap-3">
                      <Plus className="w-5 h-5" style={{ color: widget.primaryColor }} />
                      <span className="font-semibold" style={{ color: widget.primaryColor }}>
                        Start New Conversation
                      </span>
                    </div>
                  </button>
                  
                  {chatHistory.map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => loadPreviousConversation(chat.id)}
                      className="w-full p-4 bg-white border border-neutral-200 rounded-lg hover:shadow-md transition-all text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: widget.primaryColor }}
                        >
                          <MessageCircle className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-900 truncate">
                            {chat.lastMessage || 'Conversation'}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500">
                            <span>{chat.messageCount} messages</span>
                            <span>•</span>
                            <span>{new Date(chat.timestamp).toLocaleDateString()}</span>
                          </div>
                        </div>
                        {chat.status === 'active' && (
                          <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : showUserForm ? (
            /* User Info Form */
            <div className="flex-1 flex items-center justify-center p-6">
              <Card className="w-full max-w-md p-6">
                <div className="text-center mb-6">
                  <MessageCircle
                    className="w-12 h-12 mx-auto mb-4"
                    style={{ color: widget.primaryColor }}
                  />
                  <h2 className="text-xl font-semibold text-neutral-900 mb-2">Start a conversation</h2>
                  <p className="text-neutral-600">{widget.welcomeMessage}</p>
                  {aiEnabled && (
                    <div className="mt-2 flex items-center justify-center space-x-1 text-sm text-blue-600">
                      <Bot className="w-4 h-4" />
                      <span>AI-powered assistance available</span>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1">Your Name</label>
                    <input
                      id="name"
                      type="text"
                      placeholder="Enter your name"
                      value={userInfo.name}
                      onChange={(e) => setUserInfo(prev => ({ ...prev, name: e.target.value }))}
                      onKeyPress={handleKeyPress}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">Your Email</label>
                    <input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={userInfo.email}
                      onChange={(e) => setUserInfo(prev => ({ ...prev, email: e.target.value }))}
                      onKeyPress={handleKeyPress}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <Button
                    onClick={handleStartChat}
                    disabled={!userInfo.name || !userInfo.email || submittingUserInfo}
                    className="w-full"
                    style={{ backgroundColor: widget.primaryColor }}
                  >
                    {submittingUserInfo ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Starting Chat...
                      </>
                    ) : (
                      'Start Chat'
                    )}
                  </Button>
                </div>
              </Card>
            </div>
          ) : (
            /* Chat Interface */
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                    <p className="text-neutral-600">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex items-end space-x-2 ${message.sender === 'customer' ? 'justify-end flex-row-reverse space-x-reverse' : 'justify-start'}`}
                    >
                      {/* Avatar */}
                      <Avatar
                        src={getMessageAvatar(message.sender, message.senderName, message.metadata)}
                        alt={message.senderName}
                        size="sm"
                        className="flex-shrink-0"
                      />
                      
                      {/* Message bubble */}
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender === 'customer'
                            ? 'text-white'
                            : 'bg-neutral-200 text-neutral-900'
                        }`}
                        style={{
                          backgroundColor: message.sender === 'customer' ? widget.primaryColor : undefined
                        }}
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          {message.sender === 'business' && message.metadata?.ai_generated ? (
                            <Bot className="w-3 h-3" />
                          ) : message.sender === 'customer' ? (
                            <User className="w-3 h-3" />
                          ) : null}
                          <span className="text-xs opacity-75">
                            {message.senderName}
                          </span>
                        </div>
                        <p className="text-sm">{message.text}</p>
                        
                        {/* AI Response Metadata */}
                        {message.metadata?.ai_generated && (
                          <div className="mt-2 pt-2 border-t border-opacity-20 border-current">
                            <div className="flex items-center justify-between text-xs opacity-75">
                              <span>AI Response</span>
                              <div className="flex items-center space-x-2">
                                {message.metadata.confidence && (
                                  <span>Confidence: {Math.round(message.metadata.confidence * 100)}%</span>
                                )}
                                {message.metadata.sources && message.metadata.sources.length > 0 && (
                                  <span>{message.metadata.sources.length} sources</span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <p className="text-xs opacity-75 mt-1">
                          {new Date(message.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                
                {/* AI Thinking Indicator */}
                {aiThinking && (
                  <div className="flex items-end space-x-2 justify-start">
                    <Avatar
                      src={getMessageAvatar('business', 'AI Assistant', { ai_generated: true })}
                      alt="AI Assistant"
                      size="sm"
                      className="flex-shrink-0"
                    />
                    <div className="bg-neutral-200 text-neutral-900 px-4 py-2 rounded-lg max-w-xs">
                      <div className="flex items-center space-x-2">
                        <Bot className="w-3 h-3" />
                        <span className="text-xs">AI Assistant</span>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span className="text-sm">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-neutral-200">
                <div className="flex space-x-2">
                  <textarea
                    placeholder={widget.placeholderText}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1 min-h-[40px] max-h-[120px] resize-none px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={1}
                    disabled={sending || aiThinking}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sending || aiThinking}
                    size="sm"
                    style={{ backgroundColor: widget.primaryColor }}
                  >
                    {sending || aiThinking ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                
                {/* AI Status */}
                {aiEnabled && (
                  <div className="mt-2 flex items-center justify-center space-x-1 text-xs text-neutral-500">
                    <Bot className="w-3 h-3" />
                    <span>AI-powered responses enabled</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
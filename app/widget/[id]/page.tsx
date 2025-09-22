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
import { 
  MessageCircle, 
  Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

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
  
  // User info state
  const [showUserForm, setShowUserForm] = useState(true);
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: ''
  });
  const [submittingUserInfo, setSubmittingUserInfo] = useState(false);

  const loadWidget = useCallback(async () => {
    try {
      const result = await getChatWidget(widgetId);
      if (result.success) {
        setWidget(result.data);
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

  const handleStartChat = async () => {
    if (!userInfo.name || !userInfo.email || !widget) return;
    
    setSubmittingUserInfo(true);
    try {
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
    
    setSending(true);
    try {
      await sendMessage(conversation.id, {
        text: newMessage,
        sender: 'customer',
        senderName: userInfo.name
      });
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !widget) {
    return (
      <div className="fixed inset-0 bg-neutral-100 flex items-center justify-center">
        <Card className="p-8 text-center">
          <MessageCircle className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
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
            <MessageCircle className="w-6 h-6" />
            <div>
              <h1 className="font-semibold">{widget.name}</h1>
              <p className="text-sm opacity-90">We typically reply instantly</p>
            </div>
          </div>
        </div>

        {/* Chat Content */}
        <div className="flex-1 flex flex-col">
          {showUserForm ? (
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
                    {submittingUserInfo ? 'Starting Chat...' : 'Start Chat'}
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
                      className={`flex ${message.sender === 'customer' ? 'justify-end' : 'justify-start'}`}
                    >
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
                        <p className="text-sm">{message.text}</p>
                        <p className="text-xs opacity-75 mt-1">
                          {new Date(message.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
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
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sending}
                    size="sm"
                    style={{ backgroundColor: widget.primaryColor }}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
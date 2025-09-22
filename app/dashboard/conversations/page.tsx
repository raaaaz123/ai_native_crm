'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../lib/auth-context';
import {
  subscribeToConversations,
  subscribeToMessages,
  sendMessage,
  markConversationAsRead,
  ChatConversation,
  ChatMessage
} from '../../lib/chat-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  MessageCircle,
  Search,
  Clock,
  User,
  Mail,
  Phone,
  Send,
  CheckCircle,
  Circle,
  ArrowLeft,
  ChevronDown,
  Tag
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

export default function ConversationsPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<ChatConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'closed' | 'pending' | 'resolved' | 'unsolved' | 'custom'>('all');
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [customStatusText, setCustomStatusText] = useState('');
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user?.uid) return;

    // Subscribe to real-time conversations
    const unsubscribe = subscribeToConversations(user.uid, (updatedConversations) => {
      setConversations(updatedConversations);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    // Filter conversations based on search and status
    let filtered = conversations;

    if (searchTerm) {
      filtered = filtered.filter(conv =>
        conv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(conv => conv.status === statusFilter);
    }

    setFilteredConversations(filtered);
  }, [conversations, searchTerm, statusFilter]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Load messages when conversation is selected
  useEffect(() => {
    if (!selectedConversation) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);
    console.log('Loading messages for conversation:', selectedConversation.id);

    // Subscribe to real-time messages
    const unsubscribe = subscribeToMessages(selectedConversation.id, (updatedMessages) => {
      console.log('Messages updated:', updatedMessages);
      setMessages(updatedMessages);
      setLoadingMessages(false);

      // Mark conversation as read
      markConversationAsRead(selectedConversation.id);
    });

    return () => unsubscribe();
  }, [selectedConversation]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getStatusColor = (status: ChatConversation['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-blue-100 text-blue-800';
      case 'unsolved': return 'bg-red-100 text-red-800';
      case 'custom': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusDisplayText = (conversation: ChatConversation) => {
    if (conversation.status === 'custom' && conversation.customStatus) {
      return conversation.customStatus;
    }
    return conversation.status.charAt(0).toUpperCase() + conversation.status.slice(1);
  };

  const formatTime = (timestamp: Date | { toDate: () => Date } | null | undefined) => {
    if (!timestamp) return '';
    const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
    return formatDistanceToNow(date, { addSuffix: true });
  };

  const formatMessageTime = (timestamp: Date | { toDate: () => Date } | null | undefined) => {
    if (!timestamp) return '';
    const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
    return format(date, 'HH:mm');
  };

  const formatMessageDate = (timestamp: Date | { toDate: () => Date } | null | undefined) => {
    if (!timestamp) return '';
    const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
    return format(date, 'MMM dd, yyyy');
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatMessageDate(new Date(message.createdAt));
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, ChatMessage[]>);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !user?.uid || !selectedConversation) return;

    setSending(true);
    try {
      console.log('Sending message:', newMessage.trim());
      await sendMessage(selectedConversation.id, {
        text: newMessage.trim(),
        sender: 'business',
        senderName: user.displayName || 'Business'
      });
      setNewMessage('');
      console.log('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (status: ChatConversation['status'], customStatus?: string) => {
    if (!selectedConversation) return;

    try {
      const { updateConversationStatus } = await import('../../lib/chat-utils');
      await updateConversationStatus(selectedConversation.id, status, customStatus);
      
      // Update local state
      setSelectedConversation(prev => prev ? { 
        ...prev, 
        status, 
        customStatus: status === 'custom' ? customStatus : undefined 
      } : null);
      
      setShowStatusDropdown(false);
      setCustomStatusText('');
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Left Panel - Conversation List */}
      <div className="w-1/3 border-r border-gray-200 bg-white flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900 mb-4">Conversations</h1>
          
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Filters */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('all')}
              size="sm"
            >
              All ({conversations.length})
            </Button>
            <Button
              variant={statusFilter === 'active' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('active')}
              size="sm"
            >
              Active ({conversations.filter(c => c.status === 'active').length})
            </Button>
            <Button
              variant={statusFilter === 'pending' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('pending')}
              size="sm"
            >
              Pending ({conversations.filter(c => c.status === 'pending').length})
            </Button>
            <Button
              variant={statusFilter === 'resolved' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('resolved')}
              size="sm"
            >
              Resolved ({conversations.filter(c => c.status === 'resolved').length})
            </Button>
            <Button
              variant={statusFilter === 'unsolved' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('unsolved')}
              size="sm"
            >
              Unsolved ({conversations.filter(c => c.status === 'unsolved').length})
            </Button>
            <Button
              variant={statusFilter === 'closed' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('closed')}
              size="sm"
            >
              Closed ({conversations.filter(c => c.status === 'closed').length})
            </Button>
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversations found</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Your customer conversations will appear here once they start chatting'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 border-l-4 transition-colors ${
                    selectedConversation?.id === conversation.id
                      ? 'bg-blue-50 border-blue-500'
                      : 'border-transparent'
                  }`}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-semibold text-gray-900">
                        {conversation.customerName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(conversation.status)}>
                        {getStatusDisplayText(conversation)}
                      </Badge>
                      {conversation.unreadCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{conversation.customerEmail}</span>
                  </div>

                  {conversation.lastMessage && (
                    <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                      {conversation.lastMessage}
                    </p>
                  )}

                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>
                      {conversation.lastMessageAt
                        ? `Last message ${formatTime(new Date(conversation.lastMessageAt))}`
                        : `Started ${formatTime(new Date(conversation.createdAt))}`
                      }
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Middle Panel - Chat Messages */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">
                      {selectedConversation.customerName}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {selectedConversation.customerEmail}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(selectedConversation.status)}>
                    {getStatusDisplayText(selectedConversation)}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedConversation(null)}
                    className="lg:hidden"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4">
              {loadingMessages ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <p className="text-gray-600">Loading messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">No messages yet</p>
                  <p className="text-sm text-gray-500">Start the conversation!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupedMessages).map(([date, dateMessages]) => (
                    <div key={date}>
                      <div className="flex justify-center my-4">
                        <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                          {date}
                        </span>
                      </div>

                      {dateMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex mb-4 ${
                            message.sender === 'business' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.sender === 'business'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-900 border border-gray-200'
                            }`}
                          >
                            <p className="text-sm">{message.text}</p>
                            <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${
                              message.sender === 'business' ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              <span>{formatMessageTime(new Date(message.createdAt))}</span>
                              {message.sender === 'business' && (
                                message.readAt ? (
                                  <CheckCircle className="h-3 w-3" />
                                ) : (
                                  <Circle className="h-3 w-3" />
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <form onSubmit={handleSendMessage} className="flex gap-4">
                <div className="flex-1">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="min-h-[60px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="self-end"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Select a conversation</h2>
              <p className="text-gray-600">Choose a conversation from the list to start chatting</p>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - User Details */}
      <div className="w-80 border-l border-gray-200 bg-white">
        {selectedConversation ? (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Customer Details</h3>
            
            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Basic Information</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Name</p>
                      <p className="text-sm text-gray-600">{selectedConversation.customerName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Email</p>
                      <p className="text-sm text-gray-600">{selectedConversation.customerEmail}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Conversation Info */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Conversation</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-4 h-4 text-gray-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 mb-2">Status</p>
                      <div className="relative" ref={statusDropdownRef}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                          className="w-full justify-between"
                        >
                          <span>{getStatusDisplayText(selectedConversation)}</span>
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                        
                        {showStatusDropdown && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                            <div className="p-2 space-y-1">
                              <button
                                onClick={() => handleStatusChange('active')}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
                              >
                                Active
                              </button>
                              <button
                                onClick={() => handleStatusChange('pending')}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
                              >
                                Pending
                              </button>
                              <button
                                onClick={() => handleStatusChange('resolved')}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
                              >
                                Resolved
                              </button>
                              <button
                                onClick={() => handleStatusChange('unsolved')}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
                              >
                                Unsolved
                              </button>
                              <button
                                onClick={() => handleStatusChange('closed')}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
                              >
                                Closed
                              </button>
                              <div className="border-t border-gray-200 pt-2">
                                <div className="px-3 py-2">
                                  <input
                                    type="text"
                                    placeholder="Custom status..."
                                    value={customStatusText}
                                    onChange={(e) => setCustomStatusText(e.target.value)}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && customStatusText.trim()) {
                                        handleStatusChange('custom', customStatusText.trim());
                                      }
                                    }}
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      if (customStatusText.trim()) {
                                        handleStatusChange('custom', customStatusText.trim());
                                      }
                                    }}
                                    className="w-full mt-2"
                                    disabled={!customStatusText.trim()}
                                  >
                                    Set Custom
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Started</p>
                      <p className="text-sm text-gray-600">
                        {formatTime(new Date(selectedConversation.createdAt))}
                      </p>
                    </div>
                  </div>
                  {selectedConversation.lastMessageAt && (
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Last Message</p>
                        <p className="text-sm text-gray-600">
                          {formatTime(new Date(selectedConversation.lastMessageAt))}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Actions</h4>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      // Implement export conversation
                      console.log('Export conversation');
                    }}
                  >
                    Export Conversation
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="text-center">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Customer Details</h3>
              <p className="text-gray-600">Select a conversation to view customer details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth-context';
import { 
  sendMessage,
  markConversationAsRead,
  subscribeToMessages,
  updateConversationStatus,
  ChatMessage,
  ChatConversation
} from '../../../lib/chat-utils';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  Send, 
  User, 
  Mail, 
  CheckCircle,
  Circle
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const conversationId = params.id as string;

  // Get initials from name
  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Get color from name (consistent color for each user)
  const getColorFromName = (name: string) => {
    if (!name) return '#6B7280';
    const colors = [
      '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', 
      '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#84CC16'
    ];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };
  
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user?.uid || !conversationId) return;

    // Load conversation details
    const loadConversation = async () => {
      try {
        const docRef = doc(db, 'chatConversations', conversationId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const convData = docSnap.data() as ChatConversation;
          if (convData.businessId !== user.uid) {
            router.push('/dashboard/conversations');
            return;
          }
          setConversation({ ...convData, id: docSnap.id });
        } else {
          router.push('/dashboard/conversations');
          return;
        }
      } catch (error) {
        console.error('Error loading conversation:', error);
        router.push('/dashboard/conversations');
      }
    };

    loadConversation();

    // Subscribe to real-time messages
    const unsubscribe = subscribeToMessages(conversationId, (updatedMessages) => {
      setMessages(updatedMessages);
      setLoading(false);
      
      // Mark messages as read
      markConversationAsRead(conversationId);
    });

    return () => unsubscribe();
  }, [user?.uid, conversationId, router]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !user?.uid) return;

    setSending(true);
    try {
      await sendMessage(conversationId, {
        text: newMessage.trim(),
        sender: 'business',
        senderName: user.displayName || 'Business'
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (status: 'active' | 'closed') => {
    if (!conversationId) return;
    
    try {
      await updateConversationStatus(conversationId, status);
      setConversation(prev => prev ? { ...prev, status } : null);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const formatMessageTime = (timestamp: Date | { toDate: () => Date } | number | null | undefined) => {
    if (!timestamp) return '';
    try {
      let date: Date;
      if (timestamp instanceof Date) {
        date = timestamp;
      } else if (typeof timestamp === 'number') {
        date = new Date(timestamp);
      } else if (typeof timestamp === 'object' && 'toDate' in timestamp) {
        date = timestamp.toDate();
      } else {
        return '';
      }
      
      if (isNaN(date.getTime())) return '';
      return format(date, 'HH:mm');
    } catch (error) {
      console.error('Error formatting message time:', error, timestamp);
      return '';
    }
  };

  const formatMessageDate = (timestamp: Date | { toDate: () => Date } | number | null | undefined) => {
    if (!timestamp) return '';
    try {
      let date: Date;
      if (timestamp instanceof Date) {
        date = timestamp;
      } else if (typeof timestamp === 'number') {
        date = new Date(timestamp);
      } else if (typeof timestamp === 'object' && 'toDate' in timestamp) {
        date = timestamp.toDate();
      } else {
        return '';
      }
      
      if (isNaN(date.getTime())) return '';
      return format(date, 'MMM dd, yyyy');
    } catch (error) {
      console.error('Error formatting message date:', error, timestamp);
      return '';
    }
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Conversation not found</h2>
          <Link href="/dashboard/conversations">
            <Button>Back to Conversations</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatMessageDate(message.createdAt);
    if (date && !groups[date]) {
      groups[date] = [];
    }
    if (date) {
      groups[date].push(message);
    }
    return groups;
  }, {} as Record<string, ChatMessage[]>);

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Clean Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Link href="/dashboard/conversations">
                <Button variant="ghost" size="sm" className="flex-shrink-0 hover:bg-gray-50 h-8 px-2">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  <span className="text-xs">Back</span>
                </Button>
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ring-1 ring-gray-200" style={{
                    background: `${getColorFromName(conversation.customerName)}`
                  }}>
                    <span className="text-white text-xs font-semibold">
                      {getInitials(conversation.customerName)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-sm font-semibold text-gray-900 truncate">
                      {conversation.customerName}
                    </h1>
                    <div className="flex items-center gap-1.5 text-xs text-gray-600 truncate">
                      <Mail className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{conversation.customerEmail}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Badge className={`text-xs px-2 py-0.5 ${getStatusColor(conversation.status)}`}>
                {conversation.status}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange(conversation.status === 'active' ? 'closed' : 'active')}
                className="text-xs h-7 px-3 border-gray-200 rounded-lg hover:bg-gray-50"
              >
                {conversation.status === 'active' ? 'Close' : 'Reopen'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date}>
              <div className="flex justify-center my-4">
                <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-md">
                  {date}
                </span>
              </div>
              
              {dateMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-end gap-2 mb-3 ${
                    message.sender === 'business' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.sender === 'business' ? (
                    // Business message - right aligned
                    <>
                      <div
                        className="max-w-[75%] sm:max-w-md lg:max-w-lg px-3 py-2 rounded-lg shadow-sm bg-blue-600 text-white" style={{
                          borderRadius: '12px 12px 2px 12px'
                        }}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.text}</p>
                        <div className="flex items-center justify-end gap-1 mt-1 text-xs text-white/60">
                          <span>{formatMessageTime(message.createdAt)}</span>
                          {message.readAt ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <Circle className="h-3 w-3" />
                          )}
                        </div>
                      </div>
                      
                      {/* Business Avatar - Rightmost position */}
                      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ring-1 ring-gray-200 bg-gray-700">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    </>
                  ) : (
                    // Customer message - left aligned
                    <>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ring-1 ring-gray-200" style={{
                        background: `${getColorFromName(conversation.customerName)}`
                      }}>
                        <span className="text-white text-xs font-semibold">
                          {getInitials(conversation.customerName)}
                        </span>
                      </div>
                      
                      <div
                        className="max-w-[75%] sm:max-w-md lg:max-w-lg px-3 py-2 rounded-lg shadow-sm bg-white text-gray-900 border border-gray-200" style={{
                          borderRadius: '12px 12px 12px 2px'
                        }}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.text}</p>
                        <div className="flex items-center justify-end gap-1 mt-1 text-xs text-gray-500">
                          <span>{formatMessageTime(message.createdAt)}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Clean Message Input */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <div className="flex-1">
              <Textarea
                value={newMessage}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="min-h-[48px] resize-none bg-white border border-gray-200 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 rounded-lg text-sm"
                onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
              className="self-end bg-gray-900 hover:bg-gray-800 text-white transition-all rounded-lg px-4 h-9"
            >
              {sending ? (
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-b border-white"></div>
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

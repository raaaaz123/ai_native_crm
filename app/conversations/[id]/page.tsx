'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../lib/workspace-auth-context';
import { 
  sendMessage,
  markConversationAsRead,
  subscribeToMessages,
  updateConversationStatus,
  ChatMessage,
  ChatConversation
} from '../../lib/chat-utils';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
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
            router.push('/conversations');
            return;
          }
          setConversation({ ...convData, id: docSnap.id });
        } else {
          router.push('/conversations');
          return;
        }
      } catch (error) {
        console.error('Error loading conversation:', error);
        router.push('/conversations');
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

  const getStatusColor = (status: 'active' | 'closed') => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
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
          <Link href="/conversations">
            <Button>Back to Conversations</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatMessageDate(new Date(message.createdAt));
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, ChatMessage[]>);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/conversations">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-gray-500" />
                  <h1 className="text-xl font-semibold text-gray-900">
                    {conversation.customerName}
                  </h1>
                </div>
                <Badge className={getStatusColor(conversation.status as 'active' | 'closed')}>
                  {conversation.status}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                <Mail className="h-4 w-4" />
                <span>{conversation.customerEmail}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={conversation.status === 'active' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusChange('active')}
            >
              Active
            </Button>
            <Button
              variant={conversation.status === 'closed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusChange('closed')}
            >
              Close
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
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

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <form onSubmit={handleSendMessage} className="flex gap-4">
          <div className="flex-1">
            <Textarea
              value={newMessage}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="min-h-[60px] resize-none"
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
            className="self-end"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  MessageCircle, 
  Send, 
  Search, 
  Clock, 
  User,
  Bot,
  RefreshCw,
  Filter
} from "lucide-react";
import { useAuth } from "@/app/lib/workspace-auth-context";
import { getAgent, Agent } from "@/app/lib/agent-utils";
import { toast } from "sonner";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/app/lib/firebase';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date | Timestamp;
  conversationId: string;
}

interface Conversation {
  id: string;
  agentId: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  lastMessage: string;
  lastMessageTime: Date | Timestamp;
  messageCount: number;
  status: 'active' | 'resolved' | 'pending';
  createdAt: Date | Timestamp;
}

export default function AgentConversationsPage() {
  const params = useParams();
  const { workspaceContext } = useAuth();
  const agentId = params.agentId as string;
  const workspaceSlug = params.workspace as string;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'resolved'>('all');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load agent data
  useEffect(() => {
    const loadAgent = async () => {
      try {
        const response = await getAgent(agentId);
        if (response.success && response.data) {
          setAgent(response.data);
        }
      } catch (error) {
        console.error('Error loading agent:', error);
        toast.error('Failed to load agent data');
      }
    };

    if (agentId) {
      loadAgent();
    }
  }, [agentId]);

  // Load conversations
  useEffect(() => {
    if (!agentId) return;

    const conversationsQuery = query(
      collection(db, 'conversations'),
      where('agentId', '==', agentId),
      orderBy('lastMessageTime', 'desc')
    );

    const unsubscribe = onSnapshot(
      conversationsQuery, 
      (snapshot) => {
        const conversationsList: Conversation[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          conversationsList.push({
            id: doc.id,
            ...data,
            lastMessageTime: data.lastMessageTime?.toDate() || new Date(),
            createdAt: data.createdAt?.toDate() || new Date(),
          } as Conversation);
        });
        setConversations(conversationsList);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading conversations:', error);
        if (error.code === 'failed-precondition') {
          // Index is still building, show a message to the user
          toast.info('Loading conversations... Database index is building, please wait a moment.');
          setLoading(false);
        } else {
          toast.error('Failed to load conversations');
          setLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, [agentId]);

  // Load messages for selected conversation
  useEffect(() => {
    if (!selectedConversation) return;

    const messagesQuery = query(
      collection(db, 'messages'),
      where('conversationId', '==', selectedConversation.id),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(
      messagesQuery, 
      (snapshot) => {
        const messagesList: Message[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          messagesList.push({
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate() || new Date(),
          } as Message);
        });
        setMessages(messagesList);
      },
      (error) => {
        console.error('Error loading messages:', error);
        if (error.code === 'failed-precondition') {
          toast.info('Loading messages... Database index is building, please wait a moment.');
        } else {
          toast.error('Failed to load messages');
        }
      }
    );

    return () => unsubscribe();
  }, [selectedConversation]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return;

    setSending(true);
    try {
      // Add message to Firestore
      await addDoc(collection(db, 'messages'), {
        conversationId: selectedConversation.id,
        content: newMessage,
        role: 'assistant',
        timestamp: serverTimestamp(),
        agentId: agentId,
        senderType: 'agent_owner'
      });

      // Send to backend for AI processing if needed
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
      try {
        await fetch(`${backendUrl}/api/conversations/${selectedConversation.id}/reply`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: newMessage,
            agentId: agentId,
            senderType: 'agent_owner'
          })
        });
      } catch (backendError) {
        console.warn('Backend notification failed:', backendError);
        // Continue anyway as the message was saved to Firestore
      }

      setNewMessage("");
      toast.success('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = !searchQuery || 
      conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.userEmail?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || conv.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Format timestamp
  const formatTime = (timestamp: Date | Timestamp) => {
    const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      {/* Conversations List */}
      <div className="w-1/3 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Conversations</h2>
            <Badge variant="secondary">{filteredConversations.length}</Badge>
          </div>
          
          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            {['all', 'active', 'pending', 'resolved'].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status as 'all' | 'active' | 'pending' | 'resolved')}
                className="capitalize"
              >
                {status}
              </Button>
            ))}
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No conversations found</p>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => setSelectedConversation(conversation)}
                className={`p-4 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors ${
                  selectedConversation?.id === conversation.id ? 'bg-muted' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-sm">
                      {conversation.userName || conversation.userEmail || 'Anonymous User'}
                    </span>
                  </div>
                  <Badge className={`text-xs ${getStatusColor(conversation.status)}`}>
                    {conversation.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                  {conversation.lastMessage}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(conversation.lastMessageTime)}
                  </span>
                  <span>{conversation.messageCount} messages</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">
                    {selectedConversation.userName || selectedConversation.userEmail || 'Anonymous User'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedConversation.userEmail && `${selectedConversation.userEmail} • `}
                    Started {formatTime(selectedConversation.createdAt)}
                  </p>
                </div>
                <Badge className={getStatusColor(selectedConversation.status)}>
                  {selectedConversation.status}
                </Badge>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start gap-2 max-w-[70%] ${
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      message.role === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {message.role === 'user' ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <Bot className="w-4 h-4" />
                      )}
                    </div>
                    <div className={`rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.role === 'user' 
                          ? 'text-primary-foreground/70' 
                          : 'text-muted-foreground'
                      }`}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  placeholder="Type your reply..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={sending}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sending}
                  size="icon"
                >
                  {sending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center">
            <div>
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
              <p className="text-muted-foreground">
                Choose a conversation from the list to view and reply to messages
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
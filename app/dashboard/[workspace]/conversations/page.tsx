"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  MessageCircle,
  Send,
  Search,
  Clock,
  User,
  Bot,
  RefreshCw,
  Filter,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Download,
  Trash2,
  Menu,
  X,
  Info,
  Mail,
  Calendar,
  Hash,
  ArrowLeft,
  Sparkles,
  ChevronDown
} from "lucide-react";
import { useAuth } from "@/app/lib/workspace-auth-context";
import { getAgent, Agent, getWorkspaceAgents } from "@/app/lib/agent-utils";
import { toast } from "sonner";
import { LoadingDialog } from "@/app/components/ui/loading-dialog";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  Timestamp,
  updateDoc,
  doc,
  deleteDoc
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

const QUICK_REPLIES = [
  "Thank you for reaching out! How can I help you today?",
  "I'll look into this and get back to you shortly.",
  "Is there anything else I can help you with?",
  "Your issue has been resolved. Please let me know if you need further assistance."
];

export default function ConversationsPage() {
  const { workspaceContext } = useAuth();
  const router = useRouter();

  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'resolved'>('all');
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [mobileConversationsOpen, setMobileConversationsOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const agentDropdownRef = useRef<HTMLDivElement>(null);

  // Load agents for the workspace
  useEffect(() => {
    const loadAgents = async () => {
      if (!workspaceContext?.currentWorkspace?.id) return;

      try {
        const response = await getWorkspaceAgents(workspaceContext.currentWorkspace.id);
        if (response.success && response.data) {
          setAgents(response.data);
          // Set first agent as default selected
          if (response.data.length > 0 && !selectedAgentId) {
            setSelectedAgentId(response.data[0].id);
          }
        }
      } catch (error) {
        console.error('Error loading agents:', error);
        toast.error('Failed to load agents');
      }
    };

    loadAgents();
  }, [workspaceContext?.currentWorkspace?.id, selectedAgentId]);

  // Load selected agent data
  useEffect(() => {
    const loadAgent = async () => {
      if (!selectedAgentId) return;

      try {
        const response = await getAgent(selectedAgentId);
        if (response.success && response.data) {
          setAgent(response.data);
        }
      } catch (error) {
        console.error('Error loading agent:', error);
        toast.error('Failed to load agent data');
      }
    };

    loadAgent();
  }, [selectedAgentId]);

  // Load conversations for selected agent
  useEffect(() => {
    if (!selectedAgentId) {
      setConversations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const conversationsQuery = query(
      collection(db, 'conversations'),
      where('agentId', '==', selectedAgentId),
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
          toast.info('Loading conversations... Database index is building, please wait a moment.');
          setLoading(false);
        } else {
          toast.error('Failed to load conversations');
          setLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, [selectedAgentId]);

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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (agentDropdownRef.current && !agentDropdownRef.current.contains(event.target as Node)) {
        setShowAgentDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('conversation-search')?.focus();
      }
      // Escape to close mobile conversations
      if (e.key === 'Escape' && mobileConversationsOpen) {
        setMobileConversationsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [mobileConversationsOpen]);

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending || !selectedAgentId) return;

    setSending(true);
    try {
      await addDoc(collection(db, 'messages'), {
        conversationId: selectedConversation.id,
        content: newMessage,
        role: 'assistant',
        timestamp: serverTimestamp(),
        agentId: selectedAgentId,
        senderType: 'agent_owner'
      });

      // Update conversation last message
      await updateDoc(doc(db, 'conversations', selectedConversation.id), {
        lastMessage: newMessage.substring(0, 100),
        lastMessageTime: serverTimestamp(),
        messageCount: selectedConversation.messageCount + 1
      });

      setNewMessage("");
      messageInputRef.current?.focus();
      toast.success('Message sent');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Update conversation status
  const updateConversationStatus = async (conversationId: string, status: 'active' | 'resolved' | 'pending') => {
    try {
      await updateDoc(doc(db, 'conversations', conversationId), { status });
      toast.success(`Conversation marked as ${status}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  // Delete conversation
  const handleDeleteConversation = async () => {
    if (!conversationToDelete) return;

    try {
      // Delete all messages
      const messagesQuery = query(
        collection(db, 'messages'),
        where('conversationId', '==', conversationToDelete)
      );
      const messagesSnapshot = await onSnapshot(messagesQuery, async (snapshot) => {
        const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
      });

      // Delete conversation
      await deleteDoc(doc(db, 'conversations', conversationToDelete));

      if (selectedConversation?.id === conversationToDelete) {
        setSelectedConversation(null);
      }

      setDeleteDialogOpen(false);
      setConversationToDelete(null);
      toast.success('Conversation deleted');
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error('Failed to delete conversation');
    }
  };

  // Export conversation
  const exportConversation = (conversation: Conversation) => {
    const conversationMessages = messages.filter(m => m.conversationId === conversation.id);
    const exportData = {
      conversation: {
        id: conversation.id,
        user: conversation.userName || conversation.userEmail || 'Anonymous',
        startedAt: conversation.createdAt,
        status: conversation.status,
        messageCount: conversation.messageCount
      },
      messages: conversationMessages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-${conversation.id}-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Conversation exported');
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

  // Get full formatted date
  const formatFullDate = (timestamp: Date | Timestamp) => {
    const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Check if message is from different day
  const isNewDay = (currentMsg: Message, previousMsg: Message | null) => {
    if (!previousMsg) return true;
    const currentDate = currentMsg.timestamp instanceof Date ? currentMsg.timestamp : currentMsg.timestamp.toDate();
    const previousDate = previousMsg.timestamp instanceof Date ? previousMsg.timestamp : previousMsg.timestamp.toDate();
    return currentDate.toDateString() !== previousDate.toDateString();
  };

  // Get date separator text
  const getDateSeparator = (timestamp: Date | Timestamp) => {
    const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'pending': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'resolved': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  // Get user initials
  const getUserInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return 'AN';
  };

  // Agent Selection UI
  const AgentSelector = () => {
    const selectedAgent = agents.find(a => a.id === selectedAgentId);

    if (agents.length === 0) {
      return (
        <div className="px-4 py-3 border-b border-border/50 bg-background">
          <p className="text-sm text-muted-foreground">No agents available</p>
        </div>
      );
    }

    return (
      <div className="px-4 py-3 border-b border-border/50 bg-background sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">Agent:</label>
          <div className="relative flex-1 max-w-[200px]" ref={agentDropdownRef}>
            <button
              onClick={() => setShowAgentDropdown(!showAgentDropdown)}
              className="w-full inline-flex items-center justify-between gap-2 px-3 py-1.5 bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-md text-sm font-medium text-foreground transition-colors"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <Bot className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="truncate">
                  {selectedAgent ? selectedAgent.name : 'Select Agent'}
                </span>
              </div>
              <svg
                className="w-4 h-4 text-primary shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="7 10 12 15 17 10" />
                <polyline points="7 14 12 9 17 14" />
              </svg>
            </button>

            {showAgentDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-30 max-h-60 overflow-y-auto">
                {agents.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => {
                      setSelectedAgentId(agent.id);
                      setShowAgentDropdown(false);
                      setSelectedConversation(null);
                    }}
                    className={`w-full text-left px-3 py-2 hover:bg-muted transition-colors text-sm ${
                      selectedAgentId === agent.id ? 'bg-primary/10' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Bot className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-medium truncate">{agent.name}</span>
                      {selectedAgentId === agent.id && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary ml-auto shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Conversations List Component
  const ConversationsList = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border bg-background sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            Conversations
          </h2>
          <Badge variant="secondary" className="font-medium">
            {filteredConversations.length}
          </Badge>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            id="conversation-search"
            placeholder="Search conversations... (Ctrl+K)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-9"
          />
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 flex-wrap">
          {['all', 'active', 'pending', 'resolved'].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status as 'all' | 'active' | 'pending' | 'resolved')}
              className="capitalize text-xs h-7"
            >
              {status}
              {status !== 'all' && (
                <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">
                  {conversations.filter(c => c.status === status).length}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : !selectedAgentId ? (
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Bot className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-1">Select an Agent</h3>
            <p className="text-sm text-muted-foreground">
              Choose an agent to view conversations
            </p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <MessageCircle className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-1">No conversations</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Conversations will appear here when users start chatting'}
            </p>
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => {
                setSelectedConversation(conversation);
                setMobileConversationsOpen(false);
              }}
              className={`group relative p-4 border-b border-border cursor-pointer hover:bg-muted/50 transition-all duration-200 ${
                selectedConversation?.id === conversation.id ? 'bg-muted border-l-2 border-l-primary' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <Avatar className="w-10 h-10 border-2 border-background">
                  <AvatarFallback className="text-sm font-medium bg-gradient-to-br from-primary/20 to-primary/5">
                    {getUserInitials(conversation.userName, conversation.userEmail)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium text-sm truncate">
                        {conversation.userName || conversation.userEmail || 'Anonymous User'}
                      </span>
                      <Badge className={`text-[10px] px-1.5 py-0 h-4 ${getStatusColor(conversation.status)}`}>
                        {conversation.status}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2 leading-relaxed">
                    {conversation.lastMessage}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(conversation.lastMessageTime)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Hash className="w-3 h-3" />
                      {conversation.messageCount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon-sm" className="h-6 w-6">
                      <MoreVertical className="w-3.5 h-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      updateConversationStatus(conversation.id, 'active');
                    }}>
                      <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                      Mark Active
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      updateConversationStatus(conversation.id, 'resolved');
                    }}>
                      <CheckCircle2 className="w-4 h-4 mr-2 text-blue-600" />
                      Mark Resolved
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      exportConversation(conversation);
                    }}>
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConversationToDelete(conversation.id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  // User Info Panel
  const UserInfoPanel = () => (
    <div className="w-80 border-l border-border bg-muted/30 overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-sm">User Information</h3>
          <Button variant="ghost" size="icon-sm" onClick={() => setShowUserInfo(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {selectedConversation && (
          <div className="space-y-6">
            {/* User Avatar & Name */}
            <div className="text-center">
              <Avatar className="w-20 h-20 mx-auto mb-3 border-4 border-background shadow-lg">
                <AvatarFallback className="text-2xl font-semibold bg-gradient-to-br from-primary/30 to-primary/10">
                  {getUserInitials(selectedConversation.userName, selectedConversation.userEmail)}
                </AvatarFallback>
              </Avatar>
              <h4 className="font-semibold text-lg mb-1">
                {selectedConversation.userName || 'Anonymous User'}
              </h4>
              {selectedConversation.userEmail && (
                <p className="text-sm text-muted-foreground">{selectedConversation.userEmail}</p>
              )}
            </div>

            <Separator />

            {/* Details */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-0.5">Email</p>
                  <p className="text-sm font-medium truncate">
                    {selectedConversation.userEmail || 'Not provided'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-0.5">Started</p>
                  <p className="text-sm font-medium">{formatFullDate(selectedConversation.createdAt)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Hash className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-0.5">Messages</p>
                  <p className="text-sm font-medium">{selectedConversation.messageCount}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Info className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-0.5">Status</p>
                  <Badge className={`${getStatusColor(selectedConversation.status)}`}>
                    {selectedConversation.status}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* Quick Actions */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground mb-3">Quick Actions</p>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => updateConversationStatus(selectedConversation.id, 'resolved')}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Mark as Resolved
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => exportConversation(selectedConversation)}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Conversation
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (loading && conversations.length === 0 && selectedAgentId) {
    return (
      <>
        <LoadingDialog
          open={true}
          message="Loading Conversations"
          submessage="Please wait while we fetch your conversations..."
        />
        <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Loading conversations...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
        {/* Agent Selector */}
        <AgentSelector />

        <div className="flex flex-1 min-h-0">
          {/* Desktop: Conversations Sidebar */}
          <div className="hidden lg:block w-80 xl:w-96 border-r border-border">
            <ConversationsList />
          </div>

          {/* Mobile: Conversations Sheet */}
          <Sheet open={mobileConversationsOpen} onOpenChange={setMobileConversationsOpen}>
            <SheetContent side="left" className="p-0 w-[85vw] sm:w-96">
              <ConversationsList />
            </SheetContent>
          </Sheet>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Mobile: Back & Menu Button */}
                      <div className="flex items-center gap-2 lg:hidden">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setSelectedConversation(null)}
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setMobileConversationsOpen(true)}
                        >
                          <Menu className="w-4 h-4" />
                        </Button>
                      </div>

                      <Avatar className="w-10 h-10 border-2 border-background">
                        <AvatarFallback className="text-sm font-medium bg-gradient-to-br from-primary/20 to-primary/5">
                          {getUserInitials(selectedConversation.userName, selectedConversation.userEmail)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-sm truncate">
                          {selectedConversation.userName || selectedConversation.userEmail || 'Anonymous User'}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate">
                          {selectedConversation.userEmail && `${selectedConversation.userEmail} • `}
                          Started {formatTime(selectedConversation.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge className={`${getStatusColor(selectedConversation.status)} hidden sm:inline-flex`}>
                        {selectedConversation.status}
                      </Badge>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setShowUserInfo(!showUserInfo)}
                            className="hidden md:inline-flex"
                          >
                            <Info className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>User Information</TooltipContent>
                      </Tooltip>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel className="text-xs">Conversation</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => updateConversationStatus(selectedConversation.id, 'active')}>
                            <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                            Mark Active
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateConversationStatus(selectedConversation.id, 'resolved')}>
                            <CheckCircle2 className="w-4 h-4 mr-2 text-blue-600" />
                            Mark Resolved
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => exportConversation(selectedConversation)}>
                            <Download className="w-4 h-4 mr-2" />
                            Export
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="md:hidden"
                            onClick={() => setShowUserInfo(true)}
                          >
                            <Info className="w-4 h-4 mr-2" />
                            User Info
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              setConversationToDelete(selectedConversation.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-1">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                          <Sparkles className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="font-medium mb-1">No messages yet</h3>
                        <p className="text-sm text-muted-foreground">
                          Start the conversation by sending a message
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {messages.map((message, index) => (
                        <div key={message.id}>
                          {/* Date Separator */}
                          {isNewDay(message, messages[index - 1] || null) && (
                            <div className="flex items-center justify-center my-6">
                              <div className="px-3 py-1 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                                {getDateSeparator(message.timestamp)}
                              </div>
                            </div>
                          )}

                          {/* Message */}
                          <div
                            className={`flex mb-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`flex items-end gap-2 max-w-[85%] sm:max-w-[75%] ${
                              message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                            }`}>
                              <Avatar className="w-8 h-8 border-2 border-background shrink-0">
                                <AvatarFallback className={`text-xs ${
                                  message.role === 'user'
                                    ? 'bg-gradient-to-br from-primary/30 to-primary/10'
                                    : 'bg-gradient-to-br from-muted to-muted/50'
                                }`}>
                                  {message.role === 'user' ? (
                                    <User className="w-4 h-4" />
                                  ) : (
                                    <Bot className="w-4 h-4" />
                                  )}
                                </AvatarFallback>
                              </Avatar>

                              <div className={`group rounded-2xl px-4 py-2.5 ${
                                message.role === 'user'
                                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                                  : 'bg-muted text-foreground rounded-bl-sm'
                              }`}>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                  {message.content}
                                </p>
                                <p className={`text-[10px] mt-1.5 ${
                                  message.role === 'user'
                                    ? 'text-primary-foreground/60'
                                    : 'text-muted-foreground/60'
                                }`}>
                                  {formatTime(message.timestamp)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-border bg-background">
                  {/* Quick Replies */}
                  <div className="mb-3 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {QUICK_REPLIES.map((reply, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="shrink-0 text-xs h-7"
                        onClick={() => setNewMessage(reply)}
                      >
                        {reply.substring(0, 30)}...
                      </Button>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Textarea
                      ref={messageInputRef}
                      placeholder="Type your reply... (Enter to send, Shift+Enter for new line)"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      disabled={sending}
                      className="min-h-[44px] max-h-32 resize-none"
                      rows={1}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sending}
                      size="icon"
                      className="h-[44px] w-[44px] shrink-0"
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
              // Empty State
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center max-w-md">
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-16 h-16 rounded-full mb-6 mx-auto lg:hidden"
                    onClick={() => setMobileConversationsOpen(true)}
                  >
                    <Menu className="w-6 h-6" />
                  </Button>

                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 mb-6">
                    <MessageCircle className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
                  <p className="text-muted-foreground mb-6">
                    Choose a conversation from the list to view and reply to messages
                  </p>
                  <Button
                    variant="outline"
                    className="lg:hidden"
                    onClick={() => setMobileConversationsOpen(true)}
                  >
                    <Menu className="w-4 h-4 mr-2" />
                    View Conversations
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Desktop: User Info Sidebar */}
          {showUserInfo && selectedConversation && (
            <div className="hidden md:block">
              <UserInfoPanel />
            </div>
          )}

          {/* Mobile: User Info Sheet */}
          <Sheet open={showUserInfo && !!selectedConversation} onOpenChange={setShowUserInfo}>
            <SheetContent side="right" className="p-0 w-[85vw] sm:w-96 md:hidden">
              <UserInfoPanel />
            </SheetContent>
          </Sheet>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Conversation?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this conversation and all its messages.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConversation}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}

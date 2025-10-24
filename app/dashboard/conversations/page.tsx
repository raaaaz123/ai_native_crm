'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import {
  subscribeToConversations,
  subscribeToMessages,
  sendMessage,
  markConversationAsRead,
  ChatConversation,
  ChatMessage,
  getBusinessWidgets,
  ChatWidget
} from '../../lib/chat-utils';
import { apiClient, ChatRequest } from '../../lib/api-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MessageCircle,
  Search,
  Clock,
  User,
  Mail,
  Send,
  CheckCircle,
  Circle,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Bot,
  Filter,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

export default function ConversationsPage() {
  const { user, companyContext } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

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
  const [isCustomerDetailsPanelVisible, setIsCustomerDetailsPanelVisible] = useState(true);
  const [conversationPanelWidth, setConversationPanelWidth] = useState(33.33); // percentage
  const [customerDetailsPanelWidth, setCustomerDetailsPanelWidth] = useState(25); // percentage
  const [isResizing, setIsResizing] = useState(false);
  const [indexBuilding, setIndexBuilding] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  // Widget filtering state
  const [widgets, setWidgets] = useState<ChatWidget[]>([]);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string>('all');
  const [showWidgetDropdown, setShowWidgetDropdown] = useState(false);
  const widgetDropdownRef = useRef<HTMLDivElement>(null);

  // Load widgets on component mount
  useEffect(() => {
    const loadWidgets = async () => {
      const userId = user?.uid;
      const companyId = companyContext?.company?.id;
      
      if (!userId || !companyId) {
        console.log('Missing required data for widget loading:', { userId: !!userId, companyId: !!companyId });
        return;
      }
      
      try {
        console.log('Loading widgets for company:', companyId);
        const result = await getBusinessWidgets(companyId);
        console.log('Widget loading result:', result);
        
        if (result.success) {
          console.log('Widgets loaded successfully:', result.data);
          console.log('Number of widgets:', result.data?.length || 0);
          
          // Log each widget's details
          result.data?.forEach((widget, index) => {
            console.log(`Widget ${index + 1}:`, {
              id: widget.id,
              name: widget.name,
              businessId: widget.businessId
            });
          });
          
          setWidgets(result.data || []);
        } else {
          console.error('Error loading widgets:', result.error);
          setWidgets([]);
        }
      } catch (error) {
        console.error('Error loading widgets:', error);
        setWidgets([]);
      }
    };

    loadWidgets();
  }, [user?.uid, companyContext?.company?.id]);

  useEffect(() => {
    if (!user?.uid || !companyContext?.company?.id) {
      console.log('⏳ Waiting for user or company context...');
      console.log('  User ID:', user?.uid);
      console.log('  Company ID:', companyContext?.company?.id);
      return;
    }

    console.log('🔄 Setting up conversation subscription...');
    console.log('  User ID:', user.uid);
    console.log('  Company ID:', companyContext.company.id);
    console.log('  Company Name:', companyContext.company.name);

    // Subscribe to real-time conversations using the company's businessId
    let unsubscribe: (() => void) | undefined;
    
    try {
      unsubscribe = subscribeToConversations(companyContext.company.id, (updatedConversations) => {
        console.log(`✅ Received ${updatedConversations.length} conversations from subscription`);
        setConversations(updatedConversations);
        setLoading(false);
        setIndexBuilding(false); // Index is ready if we got here
        
        // Auto-select the first conversation if none is selected
        if (updatedConversations.length > 0 && !selectedConversation) {
          console.log('  Auto-selecting first conversation:', updatedConversations[0].customerName);
          setSelectedConversation(updatedConversations[0]);
        }
      });
    } catch (error) {
      const err = error as { code?: string; message?: string };
      if (err.code === 'failed-precondition' || err.message?.includes('index')) {
        setIndexBuilding(true);
        setLoading(false);
      }
    }

    return () => {
      console.log('🔌 Unsubscribing from conversations');
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user?.uid, companyContext?.company?.id, companyContext?.company?.name, selectedConversation]);

  useEffect(() => {
    // Filter conversations based on search, status, and widget
    let filtered = conversations;

    // Filter by widget if a specific widget is selected
    if (selectedWidgetId !== 'all') {
      filtered = filtered.filter(conv => conv.widgetId === selectedWidgetId);
    }

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
  }, [conversations, searchTerm, statusFilter, selectedWidgetId]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(false);
      }
      if (widgetDropdownRef.current && !widgetDropdownRef.current.contains(event.target as Node)) {
        setShowWidgetDropdown(false);
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

  // Handle resize functionality
  const handleMouseDown = (e: React.MouseEvent, type: 'conversation' | 'customer') => {
    e.preventDefault();
    setIsResizing(true);
    
    // Add visual feedback during resize
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    
    const startX = e.clientX;
    const startConversationWidth = conversationPanelWidth;
    const startCustomerWidth = customerDetailsPanelWidth;
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const containerWidth = window.innerWidth;
      const deltaPercentage = (deltaX / containerWidth) * 100;
      
      if (type === 'conversation') {
        const newWidth = Math.max(20, Math.min(60, startConversationWidth + deltaPercentage));
        setConversationPanelWidth(newWidth);
      } else if (type === 'customer') {
        const newWidth = Math.max(15, Math.min(40, startCustomerWidth - deltaPercentage));
        setCustomerDetailsPanelWidth(newWidth);
      }
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
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

  const getStatusDisplayText = (conversation: ChatConversation) => {
    if (conversation.status === 'custom' && conversation.customStatus) {
      return conversation.customStatus;
    }
    return conversation.status.charAt(0).toUpperCase() + conversation.status.slice(1);
  };

  const formatTime = (timestamp: Date | { toDate: () => Date } | number | null | undefined) => {
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
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error('Error formatting time:', error, timestamp);
      return '';
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

  const [aiThinking, setAiThinking] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);

  // Update status filter when URL parameter changes
  useEffect(() => {
    const status = searchParams?.get('status');
    const validStatuses = ['all', 'active', 'pending', 'resolved', 'unsolved', 'closed', 'custom'];
    
    if (status && validStatuses.includes(status)) {
      setStatusFilter(status as typeof statusFilter);
    } else if (!status) {
      setStatusFilter('all');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Mobile: Switch to chat view when conversation is selected
  useEffect(() => {
    if (selectedConversation && typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobileView('chat');
    }
  }, [selectedConversation]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !user?.uid || !selectedConversation) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      console.log('Sending message:', messageText);
      
      // Send the business message
      await sendMessage(selectedConversation.id, {
        text: messageText,
        sender: 'business',
        senderName: user.displayName || 'Business'
      });
      console.log('Message sent successfully');

      // If AI is enabled, try to get AI response
      if (aiEnabled && selectedConversation.widgetId) {
        setAiThinking(true);
        
        try {
          const aiRequest: ChatRequest = {
            message: messageText,
            conversation_id: selectedConversation.id,
            widget_id: selectedConversation.widgetId,
            user_id: selectedConversation.customerEmail,
            context: {
              customerName: selectedConversation.customerName,
              customerEmail: selectedConversation.customerEmail,
              businessName: user.displayName || 'Business'
            }
          };

          const aiResponse = await apiClient.sendMessage(aiRequest);
          
          if (aiResponse.success && aiResponse.data) {
            const responseData = aiResponse.data;
            
            // Send AI response as a business message
            await sendMessage(selectedConversation.id, {
              text: responseData.message,
              sender: 'business',
              senderName: 'AI Assistant',
              metadata: {
                ai_generated: true,
                confidence: responseData.confidence,
                sources: responseData.sources,
                response_time: responseData.response_time,
                fallback_to_human: responseData.fallback_to_human
              }
            });
            
            // If confidence is low, show fallback message
            if (responseData.fallback_to_human) {
              await sendMessage(selectedConversation.id, {
                text: "I'm not sure about this. Let me connect you with a human agent who can help you better.",
                sender: 'business',
                senderName: 'AI Assistant',
                metadata: {
                  ai_generated: true,
                  fallback_message: true
                }
              });
            }
          } else {
            console.warn('AI response failed:', aiResponse.error);
          }
        } catch (aiError) {
          console.error('AI response error:', aiError);
        } finally {
          setAiThinking(false);
        }
      }
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

  const handleTakeOverConversation = async () => {
    if (!selectedConversation) return;

    try {
      const { clearHandover } = await import('../../lib/chat-utils');
      await clearHandover(selectedConversation.id);
      
      // Update local state
      setSelectedConversation(prev => prev ? { 
        ...prev, 
        handoverRequested: false,
        handoverMode: 'ai',
        handoverTakenAt: Date.now()
      } : null);
      
      // Send a message indicating agent has taken over
      await sendMessage(selectedConversation.id, {
        text: "👋 A human agent has joined the conversation and will assist you from here.",
        sender: 'business',
        senderName: user?.displayName || 'Support Agent',
        metadata: {
          handover_taken: true,
          agent_name: user?.displayName || 'Support Agent'
        }
      });
    } catch (error) {
      console.error('Error taking over conversation:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Loading conversations...</p>
          <p className="text-gray-500 text-sm mt-2">
            If this takes longer than expected, the Firestore index might be building.
          </p>
          <p className="text-gray-500 text-sm">This usually takes 2-5 minutes after deployment.</p>
        </div>
      </div>
    );
  }

  const handleMobileBackToList = () => {
    setMobileView('list');
    setSelectedConversation(null);
  };

  return (
    <>
      {/* Modern Premium Styles */}
      <style jsx global>{`
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
        .gradient-border {
          background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
          border: 1px solid rgba(255,255,255,0.2);
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-2px); }
        }
        .float-animation {
          animation: float 3s ease-in-out infinite;
        }
        /* Mobile width override */
        @media (max-width: 1023px) {
          .mobile-full-width {
            width: 100% !important;
            max-width: 100%;
          }
        }
        /* Prevent horizontal overflow */
        @media (max-width: 1023px) {
          body {
            overflow-x: hidden;
          }
        }
      `}</style>
      
      <div className={`h-[calc(100vh-4rem)] flex flex-col bg-gradient-to-br from-gray-50/50 to-blue-50/30 overflow-hidden ${isResizing ? 'select-none' : ''}`}>
      {/* Index Building Banner */}
      {indexBuilding && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-yellow-600 border-t-transparent"></div>
              <div>
                <p className="text-sm font-medium text-yellow-900">
                  Firestore index is building...
                </p>
                <p className="text-xs text-yellow-700">
                  This usually takes 2-5 minutes. The page will automatically refresh once ready.
                </p>
              </div>
            </div>
            <a 
              href="https://console.firebase.google.com/project/rexa-engage/firestore/indexes"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-yellow-800 hover:text-yellow-900 underline"
            >
              Check Status
            </a>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden max-w-full">
        {/* Modern Left Panel - Conversation List */}
        <div 
        className={`glass-morphism flex flex-col transition-all duration-300 mobile-full-width ${isResizing ? 'premium-shadow-lg' : ''} ${
          mobileView === 'chat' ? 'hidden lg:flex' : 'flex'
        } w-full lg:border-r lg:border-gray-200/60 lg:flex-shrink-0`}
        style={{ width: `${conversationPanelWidth}%` }}
      >
        {/* Clean Header */}
        <div className="p-3 sm:p-4 border-b border-gray-200/60 bg-white">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-semibold text-gray-900">Conversations</h1>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                {conversations.length}
              </span>
            </div>
          </div>
          
          {/* Clean Search */}
          <div className="relative mb-2 sm:mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-sm border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500 bg-white transition-all duration-200"
            />
          </div>

          {/* Clean Widget Filter */}
          <div className="mb-2 sm:mb-3">
            <div className="relative" ref={widgetDropdownRef}>
              <Button
                variant="outline"
                onClick={() => setShowWidgetDropdown(!showWidgetDropdown)}
                className="w-full justify-between h-8 text-[10px] sm:text-xs border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200"
              >
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Filter className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                  <span className="font-medium text-gray-700 truncate">
                    {selectedWidgetId === 'all' 
                      ? 'All Widgets' 
                      : widgets.find(w => w.id === selectedWidgetId)?.name || 'Select Widget'
                    }
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              </Button>
              
              {showWidgetDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                  <div className="p-2 space-y-1">
                    <button
                      onClick={() => {
                        setSelectedWidgetId('all');
                        setShowWidgetDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs sm:text-sm hover:bg-gray-100 rounded ${
                        selectedWidgetId === 'all' ? 'bg-blue-50 text-blue-600' : ''
                      }`}
                    >
                      All Widgets ({conversations.length})
                    </button>
                    {widgets.map((widget) => {
                      const widgetConversationCount = conversations.filter(c => c.widgetId === widget.id).length;
                      return (
                        <button
                          key={widget.id}
                          onClick={() => {
                            setSelectedWidgetId(widget.id);
                            setShowWidgetDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs sm:text-sm hover:bg-gray-100 rounded truncate ${
                            selectedWidgetId === widget.id ? 'bg-blue-50 text-blue-600' : ''
                          }`}
                        >
                          {widget.name} ({widgetConversationCount})
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Modern Tabs for Status Filtering */}
        <Tabs 
          key={statusFilter}
          value={statusFilter} 
          onValueChange={(value) => {
            const newStatus = value as typeof statusFilter;
            setStatusFilter(newStatus);
            // Update URL without adding to history
            if (newStatus === 'all') {
              router.replace('/dashboard/conversations');
            } else {
              router.replace(`/dashboard/conversations?status=${newStatus}`);
            }
          }}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="w-full grid grid-cols-3 sm:grid-cols-6 gap-0.5 sm:gap-1 p-0.5 sm:p-1 bg-gray-100 border-b border-gray-200">
            <TabsTrigger 
              value="all" 
              className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs py-1.5 sm:py-2.5 px-1 sm:px-2 rounded-md transition-all ${
                statusFilter === 'all' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="font-medium">All</span>
              <span className={`text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded-full font-semibold ${
                statusFilter === 'all' ? 'bg-gray-100' : 'bg-gray-200'
              }`}>
                {conversations.length}
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="active" 
              className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs py-1.5 sm:py-2.5 px-1 sm:px-2 rounded-md transition-all ${
                statusFilter === 'active' 
                  ? 'bg-white text-green-700 shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="font-medium">Active</span>
              <span className={`text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded-full font-semibold ${
                statusFilter === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-200'
              }`}>
                {conversations.filter(c => c.status === 'active').length}
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="pending" 
              className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs py-1.5 sm:py-2.5 px-1 sm:px-2 rounded-md transition-all ${
                statusFilter === 'pending' 
                  ? 'bg-white text-yellow-700 shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="font-medium">Pending</span>
              <span className={`text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded-full font-semibold ${
                statusFilter === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200'
              }`}>
                {conversations.filter(c => c.status === 'pending').length}
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="resolved" 
              className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs py-1.5 sm:py-2.5 px-1 sm:px-2 rounded-md transition-all ${
                statusFilter === 'resolved' 
                  ? 'bg-white text-blue-700 shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="font-medium">Resolved</span>
              <span className={`text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded-full font-semibold ${
                statusFilter === 'resolved' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200'
              }`}>
                {conversations.filter(c => c.status === 'resolved').length}
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="unsolved" 
              className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs py-1.5 sm:py-2.5 px-1 sm:px-2 rounded-md transition-all ${
                statusFilter === 'unsolved' 
                  ? 'bg-white text-red-700 shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="font-medium">Unsolved</span>
              <span className={`text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded-full font-semibold ${
                statusFilter === 'unsolved' ? 'bg-red-100 text-red-700' : 'bg-gray-200'
              }`}>
                {conversations.filter(c => c.status === 'unsolved').length}
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="closed" 
              className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs py-1.5 sm:py-2.5 px-1 sm:px-2 rounded-md transition-all ${
                statusFilter === 'closed' 
                  ? 'bg-white text-gray-700 shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="font-medium">Closed</span>
              <span className={`text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded-full font-semibold ${
                statusFilter === 'closed' ? 'bg-gray-100' : 'bg-gray-200'
              }`}>
                {conversations.filter(c => c.status === 'closed').length}
              </span>
            </TabsTrigger>
          </TabsList>

          {/* Conversation Lists for Each Tab */}
          <TabsContent value="all" className="flex-1 overflow-y-auto m-0 mt-0">
            {filteredConversations.length === 0 ? (
              <div className="p-6 sm:p-8 text-center">
                <MessageCircle className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No conversations found</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  {searchTerm ? 'Try adjusting your search' : 'Your customer conversations will appear here once they start chatting'}
                </p>
          </div>
            ) : (
              <div className="space-y-0.5 px-1.5 sm:px-2 py-1.5 sm:py-2">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-2.5 sm:p-3 cursor-pointer hover:bg-gray-50 active:bg-gray-100 border-l-2 transition-all duration-200 rounded-lg touch-manipulation ${
                      selectedConversation?.id === conversation.id
                        ? 'bg-gray-50 border-gray-900'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedConversation(conversation)}
                  >
                    <div className="flex items-start gap-2 sm:gap-2.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ring-1 ring-gray-200" style={{
                        background: `${getColorFromName(conversation.customerName)}`
                      }}>
                        <span className="text-white text-xs font-semibold">
                          {getInitials(conversation.customerName)}
                        </span>
        </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-medium text-sm text-gray-900 truncate">
                              {conversation.customerName}
                            </span>
                            {conversation.handoverRequested && (
                              <UserCheck className="w-3 h-3 text-orange-500 flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {conversation.unreadCount > 0 && (
                              <div className="w-4 h-4 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-medium">
                                {conversation.unreadCount}
                              </div>
                            )}
                            <span className="text-xs text-gray-500">
                              {conversation.lastMessageAt
                                ? formatTime(conversation.lastMessageAt)
                                : formatTime(conversation.createdAt)
                              }
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 truncate mb-1">
                          {conversation.lastMessage || 'No messages yet'}
                        </p>
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            conversation.handoverRequested ? 'bg-orange-400' : 'bg-green-400'
                          }`}></div>
                          <Badge className={`text-xs px-1.5 py-0 ${getStatusColor(conversation.status)}`}>
                            {getStatusDisplayText(conversation)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="active" className="flex-1 overflow-y-auto m-0 mt-0">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No active conversations</h3>
                <p className="text-gray-600">Active conversations will appear here</p>
              </div>
            ) : (
              <div className="space-y-0.5 px-2 py-2">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-3 cursor-pointer hover:bg-gray-50 border-l-2 transition-all duration-200 rounded-lg ${
                      selectedConversation?.id === conversation.id
                        ? 'bg-gray-50 border-gray-900'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedConversation(conversation)}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ring-1 ring-gray-200" style={{
                        background: `${getColorFromName(conversation.customerName)}`
                      }}>
                        <span className="text-white text-xs font-semibold">
                          {getInitials(conversation.customerName)}
                        </span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-medium text-sm text-gray-900 truncate">
                              {conversation.customerName}
                            </span>
                            {conversation.handoverRequested && (
                              <UserCheck className="w-3 h-3 text-orange-500 flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {conversation.unreadCount > 0 && (
                              <div className="w-4 h-4 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-medium">
                                {conversation.unreadCount}
                              </div>
                            )}
                            <span className="text-xs text-gray-500">
                              {conversation.lastMessageAt
                                ? formatTime(conversation.lastMessageAt)
                                : formatTime(conversation.createdAt)
                              }
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 truncate mb-1">
                          {conversation.lastMessage || 'No messages yet'}
                        </p>
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            conversation.handoverRequested ? 'bg-orange-400' : 'bg-green-400'
                          }`}></div>
                          <Badge className={`text-xs px-1.5 py-0 ${getStatusColor(conversation.status)}`}>
                            {getStatusDisplayText(conversation)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pending" className="flex-1 overflow-y-auto m-0 mt-0">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No pending conversations</h3>
                <p className="text-gray-600">Pending conversations will appear here</p>
            </div>
          ) : (
              <div className="space-y-0.5 px-2 py-2">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-3 cursor-pointer hover:bg-gray-50 border-l-2 transition-all duration-200 rounded-lg ${
                    selectedConversation?.id === conversation.id
                      ? 'bg-gray-50 border-gray-900'
                      : 'border-transparent hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ring-1 ring-gray-200" style={{
                      background: `${getColorFromName(conversation.customerName)}`
                    }}>
                      <span className="text-white text-xs font-semibold">
                        {getInitials(conversation.customerName)}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-medium text-sm text-gray-900 truncate">
                            {conversation.customerName}
                          </span>
                          {conversation.handoverRequested && (
                            <UserCheck className="w-3 h-3 text-orange-500 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {conversation.unreadCount > 0 && (
                            <div className="w-4 h-4 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-medium">
                              {conversation.unreadCount}
                            </div>
                          )}
                          <span className="text-xs text-gray-500">
                            {conversation.lastMessageAt
                              ? formatTime(conversation.lastMessageAt)
                              : formatTime(conversation.createdAt)
                            }
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 truncate mb-1">
                        {conversation.lastMessage || 'No messages yet'}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          conversation.handoverRequested ? 'bg-orange-400' : 'bg-green-400'
                        }`}></div>
                        <Badge className={`text-xs px-1.5 py-0 ${getStatusColor(conversation.status)}`}>
                          {getStatusDisplayText(conversation)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          </TabsContent>

          <TabsContent value="resolved" className="flex-1 overflow-y-auto m-0 mt-0">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No resolved conversations</h3>
                <p className="text-gray-600">Resolved conversations will appear here</p>
        </div>
            ) : (
              <div className="space-y-0.5 px-2 py-2">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-3 cursor-pointer hover:bg-gray-50 border-l-2 transition-all duration-200 rounded-lg ${
                      selectedConversation?.id === conversation.id
                        ? 'bg-gray-50 border-gray-900'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedConversation(conversation)}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ring-1 ring-gray-200" style={{
                        background: `${getColorFromName(conversation.customerName)}`
                      }}>
                        <span className="text-white text-xs font-semibold">
                          {getInitials(conversation.customerName)}
                        </span>
      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-medium text-sm text-gray-900 truncate">
                              {conversation.customerName}
                            </span>
                            {conversation.handoverRequested && (
                              <UserCheck className="w-3 h-3 text-orange-500 flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {conversation.unreadCount > 0 && (
                              <div className="w-4 h-4 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-medium">
                                {conversation.unreadCount}
                              </div>
                            )}
                            <span className="text-xs text-gray-500">
                              {conversation.lastMessageAt
                                ? formatTime(conversation.lastMessageAt)
                                : formatTime(conversation.createdAt)
                              }
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 truncate mb-1">
                          {conversation.lastMessage || 'No messages yet'}
                        </p>
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            conversation.handoverRequested ? 'bg-orange-400' : 'bg-green-400'
                          }`}></div>
                          <Badge className={`text-xs px-1.5 py-0 ${getStatusColor(conversation.status)}`}>
                            {getStatusDisplayText(conversation)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="unsolved" className="flex-1 overflow-y-auto m-0 mt-0">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No unsolved conversations</h3>
                <p className="text-gray-600">Unsolved conversations will appear here</p>
              </div>
            ) : (
              <div className="space-y-0.5 px-2 py-2">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-3 cursor-pointer hover:bg-gray-50 border-l-2 transition-all duration-200 rounded-lg ${
                      selectedConversation?.id === conversation.id
                        ? 'bg-gray-50 border-gray-900'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedConversation(conversation)}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ring-1 ring-gray-200" style={{
                        background: `${getColorFromName(conversation.customerName)}`
                      }}>
                        <span className="text-white text-xs font-semibold">
                          {getInitials(conversation.customerName)}
                        </span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-medium text-sm text-gray-900 truncate">
                              {conversation.customerName}
                            </span>
                            {conversation.handoverRequested && (
                              <UserCheck className="w-3 h-3 text-orange-500 flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {conversation.unreadCount > 0 && (
                              <div className="w-4 h-4 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-medium">
                                {conversation.unreadCount}
                              </div>
                            )}
                            <span className="text-xs text-gray-500">
                              {conversation.lastMessageAt
                                ? formatTime(conversation.lastMessageAt)
                                : formatTime(conversation.createdAt)
                              }
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 truncate mb-1">
                          {conversation.lastMessage || 'No messages yet'}
                        </p>
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            conversation.handoverRequested ? 'bg-orange-400' : 'bg-green-400'
                          }`}></div>
                          <Badge className={`text-xs px-1.5 py-0 ${getStatusColor(conversation.status)}`}>
                            {getStatusDisplayText(conversation)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="closed" className="flex-1 overflow-y-auto m-0 mt-0">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No closed conversations</h3>
                <p className="text-gray-600">Closed conversations will appear here</p>
              </div>
            ) : (
              <div className="space-y-0.5 px-2 py-2">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-3 cursor-pointer hover:bg-gray-50 border-l-2 transition-all duration-200 rounded-lg ${
                      selectedConversation?.id === conversation.id
                        ? 'bg-gray-50 border-gray-900'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedConversation(conversation)}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ring-1 ring-gray-200" style={{
                        background: `${getColorFromName(conversation.customerName)}`
                      }}>
                        <span className="text-white text-xs font-semibold">
                          {getInitials(conversation.customerName)}
                        </span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-medium text-sm text-gray-900 truncate">
                              {conversation.customerName}
                            </span>
                            {conversation.handoverRequested && (
                              <UserCheck className="w-3 h-3 text-orange-500 flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {conversation.unreadCount > 0 && (
                              <div className="w-4 h-4 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-medium">
                                {conversation.unreadCount}
                              </div>
                            )}
                            <span className="text-xs text-gray-500">
                              {conversation.lastMessageAt
                                ? formatTime(conversation.lastMessageAt)
                                : formatTime(conversation.createdAt)
                              }
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 truncate mb-1">
                          {conversation.lastMessage || 'No messages yet'}
                        </p>
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            conversation.handoverRequested ? 'bg-orange-400' : 'bg-green-400'
                          }`}></div>
                          <Badge className={`text-xs px-1.5 py-0 ${getStatusColor(conversation.status)}`}>
                            {getStatusDisplayText(conversation)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Resize Handle for Conversation Panel - Desktop Only */}
      <div 
        className="hidden lg:block w-1 bg-gray-200 hover:bg-blue-400 cursor-col-resize transition-all duration-200 hover:w-2 group relative"
        onMouseDown={(e) => handleMouseDown(e, 'conversation')}
      >
        {/* Drag indicator dots */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="flex flex-col space-y-0.5">
            <div className="w-0.5 h-0.5 bg-blue-500 rounded-full"></div>
            <div className="w-0.5 h-0.5 bg-blue-500 rounded-full"></div>
            <div className="w-0.5 h-0.5 bg-blue-500 rounded-full"></div>
          </div>
        </div>
        {/* Hover tooltip */}
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
          Drag to resize
        </div>
      </div>

      {/* Modern Middle Panel - Chat Messages */}
      <div 
        className={`flex flex-col transition-all duration-300 glass-morphism mobile-full-width ${isResizing ? 'premium-shadow-lg' : ''} ${
          mobileView === 'list' ? 'hidden lg:flex' : 'flex'
        } w-full lg:flex-1`}
      >
        {selectedConversation ? (
          <>
            {/* Clean Chat Header */}
            <div className="p-3 sm:p-4 border-b border-gray-200/60 bg-white">
              <div className="flex items-center justify-between gap-2">
                {/* Mobile Back Button */}
                <button
                  onClick={handleMobileBackToList}
                  className="lg:hidden p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center flex-shrink-0 ring-1 ring-gray-200" style={{
                    background: `${getColorFromName(selectedConversation.customerName)}`
                  }}>
                    <span className="text-white text-xs sm:text-sm font-semibold">
                      {getInitials(selectedConversation.customerName)}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold text-gray-900 truncate text-xs sm:text-sm">
                      {selectedConversation.customerName}
                    </h2>
                    <div className="flex items-center gap-1 sm:gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        selectedConversation.handoverRequested ? 'bg-orange-400' : 'bg-green-400'
                      }`}></div>
                      <p className="text-[10px] sm:text-xs text-gray-600 truncate">
                        {selectedConversation.customerEmail}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                  {selectedConversation.handoverRequested && (
                    <Badge className="bg-orange-100 text-orange-800 border-orange-200 flex items-center gap-1 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
                      <UserCheck className="w-3 h-3" />
                      <span className="hidden sm:inline">Handover</span>
                    </Badge>
                  )}
                  <Badge className={`${getStatusColor(selectedConversation.status)} text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5`}>
                    {getStatusDisplayText(selectedConversation)}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCustomerDetailsPanelVisible(!isCustomerDetailsPanelVisible)}
                    className="hidden lg:flex items-center gap-1"
                  >
                    {isCustomerDetailsPanelVisible ? (
                      <>
                        <ChevronRight className="w-4 h-4" />
                        <span className="hidden xl:inline">Hide Details</span>
                      </>
                    ) : (
                      <>
                        <ChevronLeft className="w-4 h-4" />
                        <span className="hidden xl:inline">Show Details</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Handover Alert Banner */}
              {selectedConversation.handoverRequested && (
                <div className="mt-2 sm:mt-3 p-2.5 sm:p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-orange-900">
                          Customer requested human assistance
                        </p>
                        <p className="text-[10px] sm:text-xs text-orange-700">
                          via {selectedConversation.handoverMethod || 'unknown'} • {
                            selectedConversation.handoverRequestedAt 
                              ? formatTime(selectedConversation.handoverRequestedAt)
                              : 'just now'
                          }
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={handleTakeOverConversation}
                      size="sm"
                      className="bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-1 w-full sm:w-auto text-xs h-8"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Take Over
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Clean Messages Area */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-white">
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
                <div className="space-y-3 max-w-4xl mx-auto">
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
                          className={`flex items-end gap-1.5 sm:gap-2 mb-2 sm:mb-3 ${
                            message.sender === 'business' 
                              ? 'justify-end' 
                              : 'justify-start'
                          }`}
                        >
                          {message.sender === 'business' ? (
                            // Business message - right aligned
                            <>
                              <div
                                className={`max-w-[85%] sm:max-w-[75%] px-3 py-2 rounded-lg shadow-sm ${
                                  message.senderName === 'AI Assistant' || message.metadata?.ai_generated
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-600 text-white'
                                }`} style={{
                                  borderRadius: '12px 12px 2px 12px'
                                }}>
                                <p className="text-xs sm:text-sm leading-relaxed break-words">{message.text}</p>
                                
                                {/* AI Response Metadata */}
                                {message.metadata?.ai_generated === true && (
                                  <div className="mt-1.5 pt-1.5 border-t border-white/20">
                                    <div className="flex items-center gap-2 text-xs text-white/70">
                                      <Bot className="w-3 h-3" />
                                      <span>AI</span>
                                      {typeof message.metadata.confidence === 'number' && (
                                        <span className="text-white/60">
                                          • {Math.round(message.metadata.confidence * 100)}%
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}
                                
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
                              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center flex-shrink-0 ring-1 ring-gray-200 bg-gray-700">
                                {message.senderName === 'AI Assistant' || message.metadata?.ai_generated ? (
                                  <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                                ) : (
                                  <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                                )}
                              </div>
                            </>
                          ) : (
                            // Customer message - left aligned
                            <>
                              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center flex-shrink-0 ring-1 ring-gray-200" style={{
                                background: `${getColorFromName(selectedConversation.customerName)}`
                              }}>
                                <span className="text-white text-[10px] sm:text-xs font-semibold">
                                  {getInitials(selectedConversation.customerName)}
                                </span>
                              </div>
                              
                              <div
                                className="max-w-[85%] sm:max-w-[75%] px-3 py-2 rounded-lg shadow-sm bg-white border border-gray-200 text-gray-900" style={{
                                  borderRadius: '12px 12px 12px 2px'
                                }}>
                                <p className="text-xs sm:text-sm leading-relaxed break-words">{message.text}</p>
                                
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
              )}
            </div>

            {/* Clean Message Input */}
            <div className="p-3 sm:p-4 border-t border-gray-200/60 bg-white">
              <div className="max-w-4xl mx-auto">
                {/* AI Toggle */}
                <div className="mb-2 sm:mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <label className="flex items-center space-x-2 text-xs cursor-pointer">
                      <input
                        suppressHydrationWarning
                        type="checkbox"
                        checked={aiEnabled}
                        onChange={(e) => setAiEnabled(e.target.checked)}
                        className="w-3.5 h-3.5 text-gray-900 bg-gray-100 border-gray-300 rounded focus:ring-gray-900 focus:ring-1"
                      />
                      <span className="font-medium text-gray-700">Enable AI</span>
                    </label>
                    {aiEnabled && (
                      <div className="flex items-center space-x-1 text-[10px] sm:text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded-md">
                        <Bot className="w-3 h-3" />
                        <span className="hidden sm:inline">AI Active</span>
                      </div>
                    )}
                  </div>
                  {aiThinking && (
                    <div className="flex items-center space-x-1.5 text-[10px] sm:text-xs text-gray-600">
                      <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-600"></div>
                      <span>AI thinking...</span>
                    </div>
                  )}
                </div>
                
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <div className="flex-1">
                    <div className="relative">
                      <input
                        suppressHydrationWarning
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={aiEnabled ? "Message (AI enabled)..." : "Type message..."}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 pr-10 sm:pr-12 text-xs sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 bg-white transition-all duration-200"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(e);
                          }
                        }}
                        disabled={sending || aiThinking}
                      />
                      <Button
                        suppressHydrationWarning
                        type="submit"
                        disabled={!newMessage.trim() || sending || aiThinking}
                        className="absolute right-1 sm:right-1.5 top-1/2 transform -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-lg p-0 bg-gray-900 hover:bg-gray-800 transition-all duration-200"
                      >
                        {sending || aiThinking ? (
                          <div className="animate-spin rounded-full h-3 w-3 sm:h-3.5 sm:w-3.5 border-b border-white"></div>
                        ) : (
                          <Send className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No conversations yet</h2>
              <p className="text-sm sm:text-base text-gray-600 px-4">Customer conversations will appear here once they start chatting</p>
            </div>
          </div>
        )}
      </div>

      {/* Resize Handle for Customer Details Panel - Desktop Only */}
      {isCustomerDetailsPanelVisible && (
        <div 
          className="hidden lg:block w-1 bg-gray-200 hover:bg-blue-400 cursor-col-resize transition-all duration-200 hover:w-2 group relative"
          onMouseDown={(e) => handleMouseDown(e, 'customer')}
        >
          {/* Drag indicator dots */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="flex flex-col space-y-0.5">
              <div className="w-0.5 h-0.5 bg-blue-500 rounded-full"></div>
              <div className="w-0.5 h-0.5 bg-blue-500 rounded-full"></div>
              <div className="w-0.5 h-0.5 bg-blue-500 rounded-full"></div>
            </div>
          </div>
          {/* Hover tooltip */}
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            Drag to resize
          </div>
        </div>
      )}

      {/* Modern Right Panel - User Details - Desktop Only */}
      {isCustomerDetailsPanelVisible && (
        <div 
          className={`hidden lg:block border-l border-gray-200/60 glass-morphism transition-all duration-300 ${isResizing ? 'premium-shadow-lg' : ''}`}
          style={{ width: `${customerDetailsPanelWidth}%` }}
        >
          {selectedConversation ? (
            <div className="h-full flex flex-col">
              {/* Clean Header */}
              <div className="p-4 border-b border-gray-200/60 bg-white">
                <h3 className="text-sm font-semibold text-gray-900">Customer Details</h3>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4">
            
            <div className="space-y-4">
              {/* Basic Info */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Basic Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Name</p>
                      <p className="text-sm font-medium text-gray-900">{selectedConversation.customerName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm font-medium text-gray-900 truncate">{selectedConversation.customerEmail}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Conversation Info */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Conversation</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-3.5 h-3.5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">Status</p>
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
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Started</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatTime(selectedConversation.createdAt)}
                      </p>
                    </div>
                  </div>
                  {selectedConversation.lastMessageAt && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Last Message</p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatTime(selectedConversation.lastMessageAt)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Actions</h4>
                <div className="space-y-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs h-8 border-gray-200 rounded-lg hover:bg-gray-50"
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
      )}
      </div>
    </div>
    </>
  );
}
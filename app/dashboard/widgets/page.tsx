'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../lib/workspace-auth-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { LoadingDialog } from '../../components/ui/loading-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Bot, 
  Copy, 
  Trash2, 
  Play,

  Settings,
  AlertCircle,
  Share2,
  MoreVertical
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { toast } from 'sonner';
import { 
  getBusinessWidgets, 
  createChatWidget, 
  deleteChatWidget, 
  type ChatWidget 
} from '@/app/lib/chat-utils';

interface Widget extends ChatWidget {
  totalConversations: number;
  activeConversations: number;
  averageResponseTime: string;
  satisfactionScore: number;
}

export default function WidgetsPage() {
  const { workspaceContext } = useAuth();
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateWidget, setShowCreateWidget] = useState(false);
  const [deletingWidget, setDeletingWidget] = useState<Widget | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    welcomeMessage: 'Welcome! How can we help you today?',
    primaryColor: '#3B82F6',
    position: 'bottom-right' as 'bottom-right' | 'bottom-left',
    buttonText: 'Chat with us',
    placeholderText: 'Type your message...',
    offlineMessage: 'We are currently offline. Please leave a message and we will get back to you.',
    requireContactForm: true,
    collectName: true,
    collectEmail: true,
    collectPhone: false,
    customFields: [] as Array<{id: string, label: string, type: 'text' | 'email' | 'phone' | 'number', required: boolean, placeholder?: string}>,
    autoReply: 'Thank you for your message! We will get back to you shortly.',
    businessHours: {
      enabled: false,
      timezone: 'UTC',
      monday: { start: '09:00', end: '17:00', enabled: true },
      tuesday: { start: '09:00', end: '17:00', enabled: true },
      wednesday: { start: '09:00', end: '17:00', enabled: true },
      thursday: { start: '09:00', end: '17:00', enabled: true },
      friday: { start: '09:00', end: '17:00', enabled: true },
      saturday: { start: '09:00', end: '17:00', enabled: false },
      sunday: { start: '09:00', end: '17:00', enabled: false }
    },
    aiConfig: {
      enabled: true,
      provider: 'openrouter',
      model: 'openai/gpt-5-mini',
      temperature: 0.7,
      maxTokens: 500,
      confidenceThreshold: 0.5,
      maxRetrievalDocs: 5,
      ragEnabled: true,
      fallbackToHuman: true,
      embeddingProvider: 'openai',
      embeddingModel: 'text-embedding-3-large',
      rerankerEnabled: true,
      rerankerModel: 'rerank-2.5'
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (workspaceContext?.currentWorkspace?.id) {
      loadWidgets();
    } else {
      setLoading(false);
      setInitialLoadComplete(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceContext]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadWidgets = async () => {
    if (!workspaceContext?.currentWorkspace?.id) return;

    try {
      setLoading(true);
      setError(null);
      
      const result = await getBusinessWidgets(workspaceContext?.currentWorkspace?.id);
      
      if (result.success) {
        // Transform ChatWidget to Widget with mock analytics data
        const widgetsWithAnalytics: Widget[] = result.data.map(widget => ({
          ...widget,
          totalConversations: Math.floor(Math.random() * 100),
          activeConversations: Math.floor(Math.random() * 10),
          averageResponseTime: `${Math.floor(Math.random() * 5) + 1} min`,
          satisfactionScore: Math.floor(Math.random() * 5) + 1
        }));
        
        setWidgets(widgetsWithAnalytics);
      } else {
        setError(result.error || 'Failed to load widgets');
      }
    } catch (err) {
      console.error('Error loading widgets:', err);
      setError('Failed to load widgets. Please try again.');
    } finally {
      setLoading(false);
      setInitialLoadComplete(true);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600';
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getStatusIcon = (isActive: boolean) => {
    return isActive ? <Play className="w-3 h-3" /> : <Settings className="w-3 h-3" />;
  };

  const handleCreateWidget = () => {
    setShowCreateWidget(true);
  };

  const handleDeleteWidget = async () => {
    if (!deletingWidget) return;
    
    try {
      const result = await deleteChatWidget(deletingWidget.id);
      if (result.success) {
        setWidgets(prev => prev.filter(widget => widget.id !== deletingWidget.id));
        setDeletingWidget(null);
      } else {
        alert('Failed to delete widget: ' + result.error);
      }
    } catch (err) {
      console.error('Error deleting widget:', err);
      alert('Failed to delete widget. Please try again.');
    }
  };

  const handleDuplicateWidget = async (widget: Widget) => {
    try {
      setIsSubmitting(true);
      
      const duplicatedWidget = {
        ...widget,
        name: `${widget.name} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totalConversations: 0,
        activeConversations: 0,
        averageResponseTime: '0s',
        satisfactionScore: 0
      };

      const workspaceId = workspaceContext?.currentWorkspace?.id;
      if (!workspaceId) {
        toast.error('No active workspace selected');
        return;
      }
      const result = await createChatWidget(workspaceId, duplicatedWidget);
      
      if (result.success) {
        toast.success('Widget duplicated successfully');
        await loadWidgets();
      } else {
        toast.error(result.error || 'Failed to duplicate widget');
      }
    } catch (error) {
      console.error('Error duplicating widget:', error);
      toast.error('Failed to duplicate widget');
    } finally {
      setIsSubmitting(false);
      setOpenDropdown(null);
    }
  };

  const handleSaveWidget = async (widgetData: Partial<ChatWidget>) => {
    try {
      // Create new widget - ensure required fields are present
      const { isActive, ...createData } = widgetData;
      // Suppress unused variable warning
      void isActive;
      
      // Validate required fields
      if (!createData.name) {
        alert('Widget name is required');
        return;
      }
      
      const result = await createChatWidget(workspaceContext?.currentWorkspace?.id || '', createData as Omit<ChatWidget, 'id' | 'businessId' | 'isActive' | 'createdAt' | 'updatedAt'>);
      if (result.success) {
        const newWidget: Widget = {
          ...result.data,
          totalConversations: 0,
          activeConversations: 0,
          averageResponseTime: '0 min',
          satisfactionScore: 0
        };
        setWidgets(prev => [newWidget, ...prev]);
        setShowCreateWidget(false);
      } else {
        alert('Failed to create widget: ' + result.error);
      }
    } catch (err) {
      console.error('Error saving widget:', err);
      alert('Failed to save widget. Please try again.');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Widget name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await handleSaveWidget(formData);
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      welcomeMessage: 'Welcome! How can we help you today?',
      primaryColor: '#3B82F6',
      position: 'bottom-right',
      buttonText: 'Chat with us',
      placeholderText: 'Type your message...',
      offlineMessage: 'We are currently offline. Please leave a message and we will get back to you.',
      requireContactForm: true,
      collectName: true,
      collectEmail: true,
      collectPhone: false,
      customFields: [],
      autoReply: 'Thank you for your message! We will get back to you shortly.',
      businessHours: {
        enabled: false,
        timezone: 'UTC',
        monday: { start: '09:00', end: '17:00', enabled: true },
        tuesday: { start: '09:00', end: '17:00', enabled: true },
        wednesday: { start: '09:00', end: '17:00', enabled: true },
        thursday: { start: '09:00', end: '17:00', enabled: true },
        friday: { start: '09:00', end: '17:00', enabled: true },
        saturday: { start: '09:00', end: '17:00', enabled: false },
        sunday: { start: '09:00', end: '17:00', enabled: false }
      },
      aiConfig: {
        enabled: true,
        provider: 'openrouter',
        model: 'openai/gpt-5-mini',
        temperature: 0.7,
        maxTokens: 500,
        confidenceThreshold: 0.5,
        maxRetrievalDocs: 5,
        ragEnabled: true,
        fallbackToHuman: true,
        embeddingProvider: 'openai',
        embeddingModel: 'text-embedding-3-large',
        rerankerEnabled: true,
        rerankerModel: 'rerank-2.5'
      }
    });
  };

  const handleCloseCreateDialog = () => {
    setShowCreateWidget(false);
    resetForm();
  };

  if (!workspaceContext?.currentWorkspace) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-50 to-blue-50/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mx-auto mb-6">
              <Bot className="w-12 h-12 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Widgets</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto font-light">
              To start creating and managing chat widgets, you need to set up your company first.
            </p>
            <Button 
              onClick={() => window.location.href = '/dashboard/settings/team'}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all rounded-xl px-8 py-6 text-base"
            >
              Set Up Company
            </Button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 max-w-2xl mx-auto">
              <Card className="bg-white/95 backdrop-blur-md border-0 shadow-md hover:shadow-lg transition-all p-6">
                <h3 className="font-bold text-gray-900 mb-2">Create Company</h3>
                <p className="text-sm text-gray-600 font-light">
                  Set up your company profile and start building your customer engagement platform.
                </p>
              </Card>
              <Card className="bg-white/95 backdrop-blur-md border-0 shadow-md hover:shadow-lg transition-all p-6">
                <h3 className="font-bold text-gray-900 mb-2">Join Company</h3>
                <p className="text-sm text-gray-600 font-light">
                  Join an existing company team and collaborate on customer conversations.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !initialLoadComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <LoadingDialog 
          open={true}
          message="Loading Widgets" 
          submessage="Fetching your chat widgets and settings..."
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-50 to-blue-50/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Error Loading Widgets</h3>
            <p className="text-red-600 mb-6 font-medium">{error}</p>
            <Button onClick={loadWidgets} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all rounded-xl">
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-[calc(100vh-4rem)] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-2">
              Agents
            </h1>
            <p className="text-neutral-600">Manage your AI agents and chat widgets</p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={handleCreateWidget}
              className="bg-neutral-900 hover:bg-neutral-800 text-white flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              New AI agent
            </Button>
          </div>
        </div>

        {/* Agent Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">

          {widgets.length === 0 ? (
            <div className="col-span-full">
              <Card className="bg-white border border-neutral-200 shadow-sm">
                <CardContent className="p-12 text-center">
                  <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                    <Bot className="w-10 h-10 text-neutral-600" />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900 mb-2">No agents yet</h3>
                  <p className="text-neutral-600 mb-6 max-w-md mx-auto">Create your first AI agent to start engaging with customers.</p>
                  <Button 
                    onClick={handleCreateWidget} 
                    className="bg-neutral-900 hover:bg-neutral-800 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                    suppressHydrationWarning
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Agent
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            widgets.map((widget) => (
              <Card 
                key={widget.id} 
                className="bg-white border border-neutral-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:border-neutral-300"
                onClick={() => window.location.href = `/dashboard/widgets/${widget.id}`}
              >
                <CardContent className="p-0">
                  {/* Chat Preview Section */}
                  <div className="relative h-48 bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-blue-600/20"></div>
                    <div className="absolute top-0 left-4 right-4 bottom-4 bg-white rounded-lg shadow-lg">
                      <div className="p-3 border-b border-neutral-100">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs text-neutral-600 font-medium" suppressHydrationWarning>Agent {new Date(widget.createdAt).toLocaleDateString()}, {new Date(widget.createdAt).toLocaleTimeString()}</span>
                        </div>
                      </div>
                      <div className="p-3 space-y-2">
                        <div className="flex justify-start">
                          <div className="bg-neutral-100 rounded-lg px-3 py-2 max-w-[80%]">
                            <p className="text-sm text-neutral-700">Hello! How can I help you today?</p>
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <div className="bg-blue-500 rounded-lg px-3 py-2 max-w-[80%]">
                            <p className="text-sm text-white">I need help with my order</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Agent Details Section */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-neutral-900 mb-1">{widget.name}</h3>
                        <p className="text-sm text-neutral-500" suppressHydrationWarning>Last trained {formatDistanceToNow(new Date(widget.updatedAt))} ago</p>
                      </div>
                      <div className="relative" ref={dropdownRef}>
                        <button 
                          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdown(openDropdown === widget.id ? null : widget.id);
                          }}
                        >
                          <MoreVertical className="w-4 h-4 text-neutral-600" />
                        </button>
                        
                        {openDropdown === widget.id && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-neutral-200 rounded-lg shadow-lg z-10">
                            <button
                              className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDuplicateWidget(widget);
                              }}
                            >
                              <Copy className="w-4 h-4" />
                              Duplicate
                            </button>
                            <button
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingWidget(widget);
                                setOpenDropdown(null);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Agent Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center p-3 bg-neutral-50 rounded-lg">
                        <p className="text-xl font-bold text-neutral-900">{widget.totalConversations}</p>
                        <p className="text-xs text-neutral-600">Conversations</p>
                      </div>
                      <div className="text-center p-3 bg-neutral-50 rounded-lg">
                        <p className="text-xl font-bold text-neutral-900">{widget.activeConversations}</p>
                        <p className="text-xs text-neutral-600">Active Now</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <Link href={`/dashboard/widgets/${widget.id}`} className="flex-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full bg-neutral-900 text-white border-0 hover:bg-neutral-800 hover:text-white transition-all font-medium cursor-pointer"
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Customize
                        </Button>
                      </Link>
                      <Link href="/dashboard/widgets/share" className="flex-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-all font-medium cursor-pointer"
                        >
                          <Share2 className="w-4 h-4 mr-2" />
                          Share
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>

      {/* Delete Widget Alert Dialog */}
      <AlertDialog open={!!deletingWidget} onOpenChange={(open) => !open && setDeletingWidget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Widget</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deletingWidget?.name}</strong>? This action cannot be undone. All conversations and data associated with this widget will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteWidget}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Widget
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Widget Dialog */}
      <Dialog open={showCreateWidget} onOpenChange={handleCloseCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-neutral-200">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-neutral-900">
              <div className="w-10 h-10 rounded-lg bg-neutral-900 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              Create New Agent
            </DialogTitle>
            <p className="text-sm text-neutral-600 mt-1">Configure your AI agent settings</p>
          </DialogHeader>
          
          <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-6">
              {/* Basic Settings */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide flex items-center gap-2">
                  <div className="w-1 h-4 bg-neutral-900 rounded-full"></div>
                  Basic Settings
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label htmlFor="name" className="text-sm font-semibold text-neutral-700">Agent Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Support Agent"
                      className="mt-1.5 h-10 border-2 border-neutral-200 focus:border-neutral-900 focus:ring-neutral-900/20"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="buttonText" className="text-sm font-semibold text-neutral-700">Button Text</Label>
                    <Input
                      id="buttonText"
                      value={formData.buttonText}
                      onChange={(e) => setFormData(prev => ({ ...prev, buttonText: e.target.value }))}
                      placeholder="Chat with us"
                      className="mt-1.5 h-10 border-2 border-neutral-200 focus:border-neutral-900 focus:ring-neutral-900/20"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="position" className="text-sm font-semibold text-neutral-700">Position</Label>
                    <Select
                      value={formData.position}
                      onValueChange={(value: 'bottom-right' | 'bottom-left') => 
                        setFormData(prev => ({ ...prev, position: value }))
                      }
                    >
                      <SelectTrigger className="mt-1.5 h-10 border-2 border-neutral-200 focus:border-neutral-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bottom-right">Bottom Right</SelectItem>
                        <SelectItem value="bottom-left">Bottom Left</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="sm:col-span-2">
                    <Label htmlFor="primaryColor" className="text-sm font-semibold text-neutral-700">Primary Color</Label>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={formData.primaryColor}
                        onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                        className="w-12 h-10 p-1 border-2 border-neutral-200 rounded-lg cursor-pointer"
                      />
                      <Input
                        value={formData.primaryColor}
                        onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                        placeholder="#3B82F6"
                        className="flex-1 h-10 border-2 border-neutral-200 focus:border-neutral-900 focus:ring-neutral-900/20"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide flex items-center gap-2">
                  <div className="w-1 h-4 bg-neutral-900 rounded-full"></div>
                  Messages
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="welcomeMessage" className="text-sm font-semibold text-neutral-700">Welcome Message</Label>
                    <Textarea
                      id="welcomeMessage"
                      value={formData.welcomeMessage}
                      onChange={(e) => setFormData(prev => ({ ...prev, welcomeMessage: e.target.value }))}
                      placeholder="Welcome! How can we help you today?"
                      rows={2}
                      className="mt-1.5 border-2 border-neutral-200 focus:border-neutral-900 focus:ring-neutral-900/20 resize-none"
                    />
                  </div>

                  <div>
                    <Label htmlFor="placeholderText" className="text-sm font-semibold text-neutral-700">Input Placeholder</Label>
                    <Input
                      id="placeholderText"
                      value={formData.placeholderText}
                      onChange={(e) => setFormData(prev => ({ ...prev, placeholderText: e.target.value }))}
                      placeholder="Type your message..."
                      className="mt-1.5 h-10 border-2 border-neutral-200 focus:border-neutral-900 focus:ring-neutral-900/20"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="autoReply" className="text-sm font-semibold text-neutral-700">Auto Reply</Label>
                    <Textarea
                      id="autoReply"
                      value={formData.autoReply}
                      onChange={(e) => setFormData(prev => ({ ...prev, autoReply: e.target.value }))}
                      placeholder="Thank you for your message!"
                      rows={2}
                      className="mt-1.5 border-2 border-neutral-200 focus:border-neutral-900 focus:ring-neutral-900/20 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Collection */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide flex items-center gap-2">
                  <div className="w-1 h-4 bg-neutral-900 rounded-full"></div>
                  Contact Collection
                </h3>
                
                <div className="space-y-3 bg-neutral-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="collectEmail" className="text-sm font-medium text-neutral-900">Email Address</Label>
                      <p className="text-xs text-neutral-500 mt-0.5">Collect customer email</p>
                    </div>
                    <Switch
                      id="collectEmail"
                      checked={formData.collectEmail}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, collectEmail: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="collectPhone" className="text-sm font-medium text-neutral-900">Phone Number</Label>
                      <p className="text-xs text-neutral-500 mt-0.5">Collect customer phone</p>
                    </div>
                    <Switch
                      id="collectPhone"
                      checked={formData.collectPhone}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, collectPhone: checked }))}
                    />
                  </div>
                </div>
              </div>

              {/* AI Configuration */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide flex items-center gap-2">
                  <div className="w-1 h-4 bg-neutral-900 rounded-full"></div>
                  AI Configuration
                </h3>
                
                <div className="bg-neutral-50 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="aiEnabled" className="text-sm font-medium text-neutral-900">AI Assistant</Label>
                      <p className="text-xs text-neutral-600 mt-0.5">Auto-respond with AI</p>
                    </div>
                    <Switch
                      id="aiEnabled"
                      checked={formData.aiConfig.enabled}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ 
                          ...prev, 
                          aiConfig: { ...prev.aiConfig, enabled: checked }
                        }))
                      }
                    />
                  </div>
                  
                  {formData.aiConfig.enabled && (
                    <div className="space-y-3 pt-3 border-t border-neutral-200">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="aiProvider" className="text-xs font-semibold text-neutral-700">Provider</Label>
                          <Select
                            value={formData.aiConfig.provider}
                            onValueChange={(value) => 
                              setFormData(prev => ({ 
                                ...prev, 
                                aiConfig: { ...prev.aiConfig, provider: value }
                              }))
                            }
                          >
                            <SelectTrigger className="mt-1 h-9 text-sm bg-white border-2 border-neutral-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="openrouter">OpenRouter</SelectItem>
                              <SelectItem value="openai">OpenAI</SelectItem>
                              <SelectItem value="anthropic">Anthropic</SelectItem>
                              <SelectItem value="google">Google</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="aiModel" className="text-xs font-semibold text-neutral-700 mb-2 block">AI Model</Label>
                          <Select
                            value={formData.aiConfig.model}
                            onValueChange={(value) => 
                              setFormData(prev => ({ 
                                ...prev, 
                                aiConfig: { ...prev.aiConfig, model: value }
                              }))
                            }
                          >
                            <SelectTrigger className="h-9 text-sm bg-white border-2 border-neutral-300">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="openai/gpt-5-mini">🤖 GPT-5 Mini (OpenAI)</SelectItem>
                              <SelectItem value="google/gemini-2.5-flash">⚡ Gemini 2.5 Flash (Google)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between py-2">
                        <div>
                          <Label htmlFor="ragEnabled" className="text-sm font-medium text-neutral-900">Knowledge Base (RAG)</Label>
                          <p className="text-xs text-neutral-600 mt-0.5">Use your knowledge base</p>
                        </div>
                        <Switch
                          id="ragEnabled"
                          checked={formData.aiConfig.ragEnabled}
                          onCheckedChange={(checked) => 
                            setFormData(prev => ({ 
                              ...prev, 
                              aiConfig: { ...prev.aiConfig, ragEnabled: checked }
                            }))
                          }
                        />
                      </div>
                      
                      <div className="flex items-center justify-between py-2">
                        <div>
                          <Label htmlFor="fallbackToHuman" className="text-sm font-medium text-neutral-900">Human Fallback</Label>
                          <p className="text-xs text-neutral-600 mt-0.5">Transfer when uncertain</p>
                        </div>
                        <Switch
                          id="fallbackToHuman"
                          checked={formData.aiConfig.fallbackToHuman}
                          onCheckedChange={(checked) => 
                            setFormData(prev => ({ 
                              ...prev, 
                              aiConfig: { ...prev.aiConfig, fallbackToHuman: checked }
                            }))
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </form>
          
          <DialogFooter className="px-6 py-4 border-t border-neutral-200 bg-neutral-50">
            <div className="flex gap-3 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseCreateDialog}
                disabled={isSubmitting}
                className="flex-1 sm:flex-none border-2 border-neutral-300 hover:bg-neutral-100 text-neutral-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                onClick={handleFormSubmit}
                disabled={isSubmitting || !formData.name.trim()}
                className="flex-1 sm:flex-none bg-neutral-900 hover:bg-neutral-800 text-white shadow-sm hover:shadow-md"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Agent
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
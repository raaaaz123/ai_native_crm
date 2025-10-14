'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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
  ExternalLink,
  Settings,
  AlertCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
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
  const { companyContext } = useAuth();
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [loading, setLoading] = useState(true);
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
      model: 'deepseek/deepseek-chat-v3.1:free',
      temperature: 0.7,
      maxTokens: 500,
      confidenceThreshold: 0.5,
      maxRetrievalDocs: 5,
      ragEnabled: true,
      fallbackToHuman: true
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (companyContext?.company?.id) {
      loadWidgets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyContext]);

  const loadWidgets = async () => {
    if (!companyContext?.company?.id) return;

    try {
      setLoading(true);
      setError(null);
      
      const result = await getBusinessWidgets(companyContext.company.id);
      
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
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600';
  };

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
      const { id, businessId, createdAt, updatedAt, isActive, totalConversations, activeConversations, averageResponseTime, satisfactionScore, ...widgetData } = widget;
      // Suppress unused variable warnings for destructured properties
      void id; void businessId; void createdAt; void updatedAt; void isActive; void totalConversations; void activeConversations; void averageResponseTime; void satisfactionScore;
      
      const result = await createChatWidget(companyContext?.company?.id || '', {
        ...widgetData,
        name: `${widget.name} (Copy)`
      });

      if (result.success) {
        const duplicatedWidget: Widget = {
          ...result.data,
          totalConversations: 0,
          activeConversations: 0,
          averageResponseTime: '0 min',
          satisfactionScore: 0
        };
        setWidgets(prev => [duplicatedWidget, ...prev]);
      } else {
        alert('Failed to duplicate widget: ' + result.error);
      }
    } catch (err) {
      console.error('Error duplicating widget:', err);
      alert('Failed to duplicate widget. Please try again.');
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
      
      const result = await createChatWidget(companyContext?.company?.id || '', createData as Omit<ChatWidget, 'id' | 'businessId' | 'isActive' | 'createdAt' | 'updatedAt'>);
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
        model: 'deepseek/deepseek-chat-v3.1:free',
        temperature: 0.7,
        maxTokens: 500,
        confidenceThreshold: 0.5,
        maxRetrievalDocs: 5,
        ragEnabled: true,
        fallbackToHuman: true
      }
    });
  };

  const handleCloseCreateDialog = () => {
    setShowCreateWidget(false);
    resetForm();
  };

  if (!companyContext?.company) {
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

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-50 to-blue-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading widgets...</p>
        </div>
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
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-50 to-blue-50/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
                <Bot className="w-6 h-6 text-white" />
              </div>
              Chat Widgets
            </h1>
            <p className="text-gray-600 font-light">Manage your chat widgets and customer engagement tools</p>
          </div>
          <Button 
            onClick={handleCreateWidget}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white flex items-center gap-2 shadow-md hover:shadow-lg transition-all rounded-xl px-6 py-6"
          >
            <Plus className="w-5 h-5" />
            Create Widget
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <Card className="bg-white/95 backdrop-blur-md border-0 shadow-md hover:shadow-lg transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Widgets</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{widgets.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/95 backdrop-blur-md border-0 shadow-md hover:shadow-lg transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Active Widgets</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    {widgets.filter(widget => widget.isActive).length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                  <Play className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/95 backdrop-blur-md border-0 shadow-md hover:shadow-lg transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Conversations</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {widgets.reduce((sum, widget) => sum + widget.totalConversations, 0)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                  <ExternalLink className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/95 backdrop-blur-md border-0 shadow-md hover:shadow-lg transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Active Conversations</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    {widgets.reduce((sum, widget) => sum + widget.activeConversations, 0)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                  <Settings className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Widgets List */}
        <div className="space-y-6">
          {widgets.length === 0 ? (
            <Card className="bg-white/95 backdrop-blur-md border-0 shadow-md">
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mx-auto mb-4">
                  <Bot className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No widgets yet</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto font-light">Create your first chat widget to start engaging with customers.</p>
                <Button onClick={handleCreateWidget} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all rounded-xl">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Widget
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {widgets.map((widget) => (
                <Card key={widget.id} className="bg-white/95 backdrop-blur-md border-0 shadow-md hover:shadow-lg transition-all duration-200 group">
                  <CardContent className="p-5 sm:p-6">
                    {/* Landscape Layout */}
                    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
                      {/* Left Section - Widget Info */}
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div 
                          className="w-14 h-14 rounded-xl flex items-center justify-center shadow-md flex-shrink-0 group-hover:scale-105 transition-transform"
                          style={{ backgroundColor: widget.primaryColor }}
                        >
                          <Bot className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-bold text-gray-900 truncate">{widget.name}</h3>
                            <Badge className={`${getStatusColor(widget.isActive)} flex items-center gap-1 px-2.5 py-1 rounded-full shadow-sm flex-shrink-0`}>
                              {getStatusIcon(widget.isActive)}
                              <span className="text-xs font-medium">{widget.isActive ? 'Active' : 'Inactive'}</span>
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 mb-3">
                            Updated {formatDistanceToNow(new Date(widget.updatedAt))} ago
                          </p>
                          
                          {/* Widget Details - Inline */}
                          <div className="flex flex-wrap gap-3 text-xs">
                            <div className="flex items-center gap-1.5">
                              <span className="text-gray-500">Position:</span>
                              <span className="font-semibold text-gray-900">{widget.position}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-gray-500">Response:</span>
                              <span className="font-semibold text-gray-900">{widget.averageResponseTime}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-gray-500">AI:</span>
                              <Badge className={widget.aiConfig?.enabled ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-gray-100 text-gray-600"}>
                                {widget.aiConfig?.enabled ? 'Enabled' : 'Disabled'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Middle Section - Stats */}
                      <div className="flex gap-3 lg:flex-col lg:justify-center lg:min-w-[140px]">
                        <div className="flex-1 lg:flex-none text-center p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                          <p className="text-xl sm:text-2xl font-bold text-gray-900">{widget.totalConversations}</p>
                          <p className="text-xs text-gray-600 font-medium">Total Chats</p>
                        </div>
                        <div className="flex-1 lg:flex-none text-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-100">
                          <p className="text-xl sm:text-2xl font-bold text-gray-900">{widget.activeConversations}</p>
                          <p className="text-xs text-gray-600 font-medium">Active Now</p>
                        </div>
                      </div>

                      {/* Right Section - Action Buttons */}
                      <div className="flex flex-wrap lg:flex-col gap-2 lg:justify-center lg:min-w-[140px]">
                        <Link href={`/dashboard/widgets/${widget.id}`} className="flex-1 lg:w-full">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full flex items-center justify-center gap-2 h-10 bg-blue-600 text-white border-0 hover:bg-blue-700 transition-all font-semibold shadow-sm hover:shadow-md"
                          >
                            <Settings className="w-4 h-4" />
                            <span>Customise</span>
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDuplicateWidget(widget)}
                          className="flex-1 lg:w-full flex items-center justify-center gap-2 h-10 bg-white hover:bg-gray-50 border-2 border-gray-300 hover:border-gray-400 transition-all font-semibold"
                        >
                          <Copy className="w-4 h-4" />
                          <span>Duplicate</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeletingWidget(widget)}
                          className="flex-1 lg:w-full flex items-center justify-center gap-2 h-10 bg-white text-red-600 border-2 border-red-300 hover:bg-red-50 hover:border-red-400 transition-all font-semibold"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
              </Card>
            ))}
          </div>
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
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              Create New Widget
            </DialogTitle>
            <p className="text-sm text-gray-600 mt-1">Configure your chat widget settings</p>
          </DialogHeader>
          
          <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-6">
              {/* Basic Settings */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                  <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
                  Basic Settings
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label htmlFor="name" className="text-sm font-semibold text-gray-700">Widget Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Support Widget"
                      className="mt-1.5 h-10 border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="buttonText" className="text-sm font-semibold text-gray-700">Button Text</Label>
                    <Input
                      id="buttonText"
                      value={formData.buttonText}
                      onChange={(e) => setFormData(prev => ({ ...prev, buttonText: e.target.value }))}
                      placeholder="Chat with us"
                      className="mt-1.5 h-10 border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="position" className="text-sm font-semibold text-gray-700">Position</Label>
                    <Select
                      value={formData.position}
                      onValueChange={(value: 'bottom-right' | 'bottom-left') => 
                        setFormData(prev => ({ ...prev, position: value }))
                      }
                    >
                      <SelectTrigger className="mt-1.5 h-10 border-2 border-gray-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bottom-right">Bottom Right</SelectItem>
                        <SelectItem value="bottom-left">Bottom Left</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="sm:col-span-2">
                    <Label htmlFor="primaryColor" className="text-sm font-semibold text-gray-700">Primary Color</Label>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={formData.primaryColor}
                        onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                        className="w-12 h-10 p-1 border-2 border-gray-200 rounded-lg cursor-pointer"
                      />
                      <Input
                        value={formData.primaryColor}
                        onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                        placeholder="#3B82F6"
                        className="flex-1 h-10 border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                  <div className="w-1 h-4 bg-green-600 rounded-full"></div>
                  Messages
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="welcomeMessage" className="text-sm font-semibold text-gray-700">Welcome Message</Label>
                    <Textarea
                      id="welcomeMessage"
                      value={formData.welcomeMessage}
                      onChange={(e) => setFormData(prev => ({ ...prev, welcomeMessage: e.target.value }))}
                      placeholder="Welcome! How can we help you today?"
                      rows={2}
                      className="mt-1.5 border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 resize-none"
                    />
                  </div>

                  <div>
                    <Label htmlFor="placeholderText" className="text-sm font-semibold text-gray-700">Input Placeholder</Label>
                    <Input
                      id="placeholderText"
                      value={formData.placeholderText}
                      onChange={(e) => setFormData(prev => ({ ...prev, placeholderText: e.target.value }))}
                      placeholder="Type your message..."
                      className="mt-1.5 h-10 border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="autoReply" className="text-sm font-semibold text-gray-700">Auto Reply</Label>
                    <Textarea
                      id="autoReply"
                      value={formData.autoReply}
                      onChange={(e) => setFormData(prev => ({ ...prev, autoReply: e.target.value }))}
                      placeholder="Thank you for your message!"
                      rows={2}
                      className="mt-1.5 border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Collection */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                  <div className="w-1 h-4 bg-purple-600 rounded-full"></div>
                  Contact Collection
                </h3>
                
                <div className="space-y-3 bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="collectEmail" className="text-sm font-medium text-gray-900">Email Address</Label>
                      <p className="text-xs text-gray-500 mt-0.5">Collect customer email</p>
                    </div>
                    <Switch
                      id="collectEmail"
                      checked={formData.collectEmail}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, collectEmail: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="collectPhone" className="text-sm font-medium text-gray-900">Phone Number</Label>
                      <p className="text-xs text-gray-500 mt-0.5">Collect customer phone</p>
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
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                  <div className="w-1 h-4 bg-indigo-600 rounded-full"></div>
                  AI Configuration
                </h3>
                
                <div className="bg-blue-50 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="aiEnabled" className="text-sm font-medium text-gray-900">AI Assistant</Label>
                      <p className="text-xs text-gray-600 mt-0.5">Auto-respond with AI</p>
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
                    <div className="space-y-3 pt-3 border-t border-blue-200">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="aiProvider" className="text-xs font-semibold text-gray-700">Provider</Label>
                          <Select
                            value={formData.aiConfig.provider}
                            onValueChange={(value) => 
                              setFormData(prev => ({ 
                                ...prev, 
                                aiConfig: { ...prev.aiConfig, provider: value }
                              }))
                            }
                          >
                            <SelectTrigger className="mt-1 h-9 text-sm bg-white border-2 border-gray-200">
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
                          <Label htmlFor="aiModel" className="text-xs font-semibold text-gray-700">Model</Label>
                          <Select
                            value={formData.aiConfig.model}
                            onValueChange={(value) => 
                              setFormData(prev => ({ 
                                ...prev, 
                                aiConfig: { ...prev.aiConfig, model: value }
                              }))
                            }
                          >
                            <SelectTrigger className="mt-1 h-9 text-sm bg-white border-2 border-gray-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="google/gemini-2.0-flash-exp:free">Gemini 2.0 (Free)</SelectItem>
                              <SelectItem value="deepseek/deepseek-chat-v3.1:free">DeepSeek v3.1 (Free)</SelectItem>
                              <SelectItem value="meta-llama/llama-3.2-3b-instruct:free">Llama 3.2 (Free)</SelectItem>
                              <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                              <SelectItem value="gpt-4">GPT-4</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between py-2">
                        <div>
                          <Label htmlFor="ragEnabled" className="text-sm font-medium text-gray-900">Knowledge Base (RAG)</Label>
                          <p className="text-xs text-gray-600 mt-0.5">Use your knowledge base</p>
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
                          <Label htmlFor="fallbackToHuman" className="text-sm font-medium text-gray-900">Human Fallback</Label>
                          <p className="text-xs text-gray-600 mt-0.5">Transfer when uncertain</p>
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
          
          <DialogFooter className="px-6 py-4 border-t border-gray-100 bg-gray-50">
            <div className="flex gap-3 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseCreateDialog}
                disabled={isSubmitting}
                className="flex-1 sm:flex-none border-2 border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                onClick={handleFormSubmit}
                disabled={isSubmitting || !formData.name.trim()}
                className="flex-1 sm:flex-none bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm hover:shadow-md"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Widget
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
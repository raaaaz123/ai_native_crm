"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/layout';
import { 
  createChatWidget, 
  getBusinessWidgets, 
  ChatWidget 
} from '../lib/chat-utils';
import { 
  MessageCircle, 
  Copy, 
  ExternalLink, 
  Plus,
  Share2
} from 'lucide-react';

export default function DashboardPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [widgets, setWidgets] = useState<ChatWidget[]>([]);
  const [loadingWidgets, setLoadingWidgets] = useState(true);
  const [showCreateWidget, setShowCreateWidget] = useState(false);
  const [newWidget, setNewWidget] = useState({
    name: '',
    welcomeMessage: 'Hello! How can we help you today?',
    primaryColor: '#3b82f6',
    position: 'bottom-right' as 'bottom-right' | 'bottom-left',
    buttonText: 'Chat with us',
    placeholderText: 'Type your message...',
    offlineMessage: 'We are currently offline. Please leave a message and we will get back to you.',
    collectEmail: true,
    collectPhone: false,
    autoReply: 'Thanks for your message! We will get back to you soon.',
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
    }
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.uid) {
      loadWidgets();
    }
  }, [user?.uid]);

  const loadWidgets = async () => {
    if (!user?.uid) return;
    
    try {
      console.log('Loading widgets for user:', user.uid);
      const result = await getBusinessWidgets(user.uid);
      console.log('Widgets result:', result);
      
      if (result.success) {
        setWidgets(result.data);
        console.log('Widgets loaded:', result.data);
      } else {
        console.error('Failed to load widgets:', result.error);
        setWidgets([]);
      }
    } catch (error) {
      console.error('Error loading widgets:', error);
      setWidgets([]);
    } finally {
      setLoadingWidgets(false);
    }
  };

  const handleCreateWidget = async () => {
    if (!user?.uid || creating) return;
    
    setCreating(true);
    try {
      console.log('Creating widget with data:', newWidget);
      const result = await createChatWidget(user.uid, newWidget);
      console.log('Widget creation result:', result);
      
      if (result.success) {
        setWidgets(prev => [result.data, ...prev]);
        setShowCreateWidget(false);
        console.log('Widget created successfully:', result.data);
      } else {
        console.error('Failed to create widget:', result.error);
        alert('Failed to create widget: ' + result.error);
      }
      setNewWidget({
        name: '',
        welcomeMessage: 'Hello! How can we help you today?',
        primaryColor: '#3B82F6',
        position: 'bottom-right' as 'bottom-right' | 'bottom-left',
        buttonText: 'Chat with us',
        placeholderText: 'Type your message...',
        offlineMessage: 'We are currently offline. Please leave a message and we will get back to you.',
        collectEmail: true,
        collectPhone: false,
        autoReply: 'Thanks for your message! We will get back to you soon.',
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
        }
      });
    } catch (error) {
      console.error('Error creating widget:', error);
    } finally {
      setCreating(false);
    }
  };

  const copyWidgetUrl = (widgetId: string) => {
    const widgetUrl = `${window.location.origin}/widget/${widgetId}`;
    navigator.clipboard.writeText(widgetUrl);
    // You could add a toast notification here
  };

  const getEmbedCode = (widgetId: string): string => {
    return `<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${window.location.origin}/widget-embed.js';
    script.setAttribute('data-widget-id', '${widgetId}');
    document.head.appendChild(script);
  })();
</script>`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Container>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">Dashboard</h1>
        <p className="text-neutral-600">Manage your chat widgets and customer conversations</p>
        <div className="mt-4 p-4 bg-gray-100 rounded-lg text-sm">
          <p><strong>Debug Info:</strong></p>
          <p>User ID: {user?.uid || 'Not logged in'}</p>
          <p>Loading: {loadingWidgets ? 'Yes' : 'No'}</p>
          <p>Widgets Count: {widgets.length}</p>
          <p>Widgets Data: {JSON.stringify(widgets, null, 2)}</p>
        </div>
      </div>

      {/* Chat Widgets Section */}
      <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MessageCircle className="w-6 h-6 text-primary-500" />
              <CardTitle>Chat Widgets</CardTitle>
              <span className="text-sm text-neutral-500">({widgets.length} widgets)</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline"
                size="sm"
                onClick={loadWidgets}
                className="flex items-center space-x-1"
              >
                <span>Refresh</span>
              </Button>
              <Button 
                className="flex items-center space-x-2"
                onClick={() => setShowCreateWidget(true)}
              >
                <Plus className="w-4 h-4" />
                <span>Create Widget</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {showCreateWidget && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Create Chat Widget</h3>
                  <button
                    onClick={() => setShowCreateWidget(false)}
                    className="text-neutral-500 hover:text-neutral-700"
                  >
                    ×
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1">Widget Name</label>
                    <input
                      id="name"
                      type="text"
                      value={newWidget.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewWidget({ ...newWidget, name: e.target.value })}
                      placeholder="Customer Support Chat"
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="welcomeMessage" className="block text-sm font-medium text-neutral-700 mb-1">Welcome Message</label>
                    <textarea
                      id="welcomeMessage"
                      value={newWidget.welcomeMessage}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewWidget({ ...newWidget, welcomeMessage: e.target.value })}
                      placeholder="Hello! How can we help you today?"
                      rows={3}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="primaryColor" className="block text-sm font-medium text-neutral-700 mb-1">Primary Color</label>
                    <input
                      id="primaryColor"
                      type="color"
                      value={newWidget.primaryColor}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewWidget({ ...newWidget, primaryColor: e.target.value })}
                      className="w-full h-10 border border-neutral-300 rounded-md"
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleCreateWidget} 
                  disabled={!newWidget.name || creating}
                  className="w-full mt-4"
                >
                  {creating ? 'Creating...' : 'Create Widget'}
                </Button>
              </div>
            </div>
          )}

          {loadingWidgets ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
              <p className="text-neutral-600 mt-2">Loading widgets...</p>
            </div>
          ) : widgets.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
              <p className="text-neutral-600 mb-4">No chat widgets created yet</p>
              <p className="text-sm text-neutral-500">Create your first widget to start receiving customer messages</p>
            </div>
          ) : (
            <div className="space-y-4">
              {widgets.map((widget, index) => (
                <div key={widget.id || `widget-${index}`} className="border border-neutral-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-neutral-900">{widget.name}</h4>
                      <p className="text-sm text-neutral-600">{widget.welcomeMessage}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-4 h-4 rounded-full border border-neutral-300"
                        style={{ backgroundColor: widget.primaryColor }}
                      />
                      <span className="text-xs text-neutral-500 capitalize">
                        {widget.position?.replace('-', ' ') || 'bottom right'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (widget.id) {
                          copyWidgetUrl(widget.id);
                        } else {
                          console.error('Widget ID is undefined');
                          alert('Widget ID is not available');
                        }
                      }}
                      className="flex items-center space-x-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy URL</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (widget.id) {
                          const embedCode = getEmbedCode(widget.id);
                          navigator.clipboard.writeText(embedCode);
                        } else {
                          console.error('Widget ID is undefined');
                          alert('Widget ID is not available');
                        }
                      }}
                      className="flex items-center space-x-1"
                    >
                      <Share2 className="w-3 h-3" />
                      <span>Copy Embed</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (widget.id) {
                          window.open(`/widget/${widget.id}`, '_blank');
                        } else {
                          console.error('Widget ID is undefined');
                          alert('Widget ID is not available');
                        }
                      }}
                      className="flex items-center space-x-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Preview</span>
                    </Button>
                  </div>
                  
                  <div className="mt-3 text-xs text-neutral-500">
                    Created: {new Date(widget.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
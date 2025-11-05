'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Loader2,
  Plug,
  ExternalLink,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useAuth } from '@/app/lib/workspace-auth-context';
import { getAgent, type Agent } from '@/app/lib/agent-utils';
import { apiClient } from '@/app/lib/api-client';
import { toast } from 'sonner';
import Link from 'next/link';

// Integration types
interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: 'connected' | 'disconnected';
  category: 'communication' | 'payment' | 'calendar' | 'support' | 'productivity';
}

interface CalendlyUserInfo {
  uri: string;
  name: string;
  email: string;
  scheduling_url: string;
  timezone: string;
  avatar_url?: string;
}

interface CalendlyEventType {
  uri: string;
  name: string;
  slug: string;
  scheduling_url: string;
  duration: number;
  active: boolean;
}

export default function IntegrationsPage() {
  const params = useParams();
  const workspaceSlug = params.workspace as string;
  const agentId = params.agentId as string;
  const { workspaceContext } = useAuth();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [integrationStatuses, setIntegrationStatuses] = useState<Record<string, 'connected' | 'disconnected'>>({});
  const [calendlyStatus, setCalendlyStatus] = useState<{
    connected: boolean;
    userInfo?: CalendlyUserInfo;
    eventTypes?: CalendlyEventType[];
  }>({ connected: false });

  // Available integrations
  const integrations: Integration[] = [
    {
      id: 'slack',
      name: 'Slack',
      description: 'Manage your Slack conversations.',
      icon: '🔗',
      status: integrationStatuses.slack || 'disconnected',
      category: 'communication'
    },
    {
      id: 'stripe',
      name: 'Stripe',
      description: 'Manage payments, billing, and automate financial operations.',
      icon: 'S',
      status: integrationStatuses.stripe || 'disconnected',
      category: 'payment'
    },
    {
      id: 'calendly',
      name: 'Calendly',
      description: 'Schedule meetings and manage your calendar events. Connect to enable AI-powered booking.',
      icon: '📅',
      status: integrationStatuses.calendly || 'disconnected',
      category: 'calendar'
    },
    {
      id: 'zendesk',
      name: 'Zendesk',
      description: 'Create Zendesk tickets.',
      icon: '🎫',
      status: integrationStatuses.zendesk || 'disconnected',
      category: 'support'
    },
    {
      id: 'sunshine',
      name: 'Sunshine',
      description: 'Integrate with Sunshine conversations.',
      icon: '☀️',
      status: integrationStatuses.sunshine || 'disconnected',
      category: 'productivity'
    }
  ];

  useEffect(() => {
    loadAgent();
    checkCalendlyStatus();
  }, [agentId, workspaceContext]);

  const loadAgent = async () => {
    if (!agentId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await getAgent(agentId);
      
      if (response.success) {
        setAgent(response.data);
      } else {
        console.error('Failed to load agent:', response.error);
        setAgent(null);
      }
    } catch (error) {
      console.error('Error loading agent:', error);
      setAgent(null);
    } finally {
      setLoading(false);
    }
  };

  const checkCalendlyStatus = async () => {
    if (!workspaceContext?.currentWorkspace?.id || !agentId) return;

    try {
      // Use Next.js API route instead of direct backend call
      const fetchResponse = await fetch(
        `/api/calendly/status?workspace_id=${workspaceContext?.currentWorkspace?.id}&agent_id=${agentId}`
      );
      const responseData = await fetchResponse.json();
      const response = {
        success: responseData.success,
        data: responseData.data || responseData,
        error: responseData.error
      };
      if (response.success && response.data && response.data.connected) {
        setCalendlyStatus({
          connected: true,
          userInfo: response.data.user_info,
          eventTypes: response.data.event_types
        });

        // Update integration status
        setIntegrationStatuses(prev => ({
          ...prev,
          calendly: 'connected'
        }));
      } else {
        setCalendlyStatus({ connected: false });
        setIntegrationStatuses(prev => ({
          ...prev,
          calendly: 'disconnected'
        }));
      }
    } catch (error) {
      console.error('Error checking Calendly status:', error);
      setCalendlyStatus({ connected: false });
      setIntegrationStatuses(prev => ({
        ...prev,
        calendly: 'disconnected'
      }));
    }
  };

  const handleCalendlyConnect = async () => {
    if (!workspaceContext?.currentWorkspace?.id || !agentId) {
      toast.error('Missing workspace or agent information');
      return;
    }

    setConnecting('calendly');

    try {
      console.log('🔗 Initiating Calendly connection...', {
        workspaceId: workspaceContext?.currentWorkspace?.id,
        agentId: agentId
      });

      // Use Next.js API route instead of direct backend call
      const fetchResponse = await fetch('/api/calendly/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceId: workspaceContext?.currentWorkspace?.id,
          agentId: agentId
        }),
      });

      const responseData = await fetchResponse.json();
      const response = {
        success: responseData.success,
        data: responseData.data || responseData,
        error: responseData.error
      };

      console.log('📥 Calendly connection response:', response);

      // Handle nested response structure
      const backendData = response.data?.data || response.data;
      const authorizationUrl = backendData?.authorization_url || backendData?.oauth_url;

      if (response.success && authorizationUrl) {
        console.log('✅ Got authorization URL:', authorizationUrl);
        
        // Open Calendly OAuth in a new window
        const authWindow = window.open(
          authorizationUrl,
          'calendly-auth',
          'width=600,height=700,scrollbars=yes,resizable=yes'
        );

        if (!authWindow) {
          toast.error('Please allow popups to connect with Calendly');
          setConnecting(null);
          return;
        }

        // Listen for the OAuth callback message
        const handleMessage = (event: MessageEvent) => {
          if (event.data?.type === 'CALENDLY_CONNECTED') {
            console.log('✅ Received Calendly connected message');
            window.removeEventListener('message', handleMessage);
            setConnecting(null);
            // Check status after OAuth flow
            setTimeout(() => {
              checkCalendlyStatus();
            }, 1000);
          }
        };
        
        window.addEventListener('message', handleMessage);

        // Also listen for window close (fallback)
        const checkClosed = setInterval(() => {
          if (authWindow?.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', handleMessage);
            setConnecting(null);
            // Check status after OAuth flow
            setTimeout(() => {
              checkCalendlyStatus();
            }, 1000);
          }
        }, 1000);

        // Set a timeout to stop checking after 5 minutes
        setTimeout(() => {
          clearInterval(checkClosed);
          if (authWindow && !authWindow.closed) {
            authWindow.close();
          }
          setConnecting(null);
        }, 300000);

      } else {
        const backendData = response.data?.data || response.data;
        const errorMsg = response.error || backendData?.error || backendData?.detail || 'Failed to initiate Calendly connection';
        console.error('❌ Calendly connection failed:', {
          success: response.success,
          data: response.data,
          backendData: backendData,
          error: response.error,
          hasAuthUrl: !!authorizationUrl
        });
        toast.error(errorMsg || 'Failed to initiate Calendly connection');
        setConnecting(null);
      }
    } catch (error: unknown) {
      console.error('❌ Error connecting to Calendly:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`Connection error: ${errorMessage}`);
      setConnecting(null);
    }
  };


  const handleCalendlyDisconnect = async () => {
    if (!workspaceContext?.currentWorkspace?.id || !agentId) return;

    setConnecting('calendly');
    
    try {
      // Use Next.js API route instead of direct backend call
      const fetchResponse = await fetch('/api/calendly/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceId: workspaceContext?.currentWorkspace?.id,
          agentId: agentId
        }),
      });

      const responseData = await fetchResponse.json();
      const response = {
        success: responseData.success,
        data: responseData.data || responseData,
        error: responseData.error
      };
      
      if (response.success) {
        toast.success('Calendly disconnected successfully');
        setCalendlyStatus({ connected: false });
        setIntegrationStatuses(prev => ({
          ...prev,
          calendly: 'disconnected'
        }));
      } else {
        toast.error('Failed to disconnect Calendly');
      }
    } catch (error) {
      console.error('Error disconnecting Calendly:', error);
      toast.error('Failed to disconnect Calendly');
    } finally {
      setConnecting(null);
    }
  };

  const handleConnect = async (integrationId: string) => {
    if (integrationId === 'calendly') {
      if (integrationStatuses.calendly === 'connected') {
        handleCalendlyDisconnect();
      } else {
        handleCalendlyConnect();
      }
      return;
    }

    setConnecting(integrationId);
    
    // Simulate connection process for other integrations
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast.success(`${integrations.find(i => i.id === integrationId)?.name} integration coming soon!`);
    setConnecting(null);
  };

  const getIconComponent = (integration: Integration) => {
    const iconStyle = "w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg";
    
    switch (integration.id) {
      case 'slack':
        return (
          <div className={`${iconStyle} bg-gradient-to-br from-purple-500 to-pink-500`}>
            {integration.icon}
          </div>
        );
      case 'stripe':
        return (
          <div className={`${iconStyle} bg-gradient-to-br from-blue-500 to-purple-600`}>
            {integration.icon}
          </div>
        );
      case 'calendly':
        return (
          <div className={`${iconStyle} bg-gradient-to-br from-blue-400 to-blue-600`}>
            {integration.icon}
          </div>
        );
      case 'zendesk':
        return (
          <div className={`${iconStyle} bg-gradient-to-br from-teal-500 to-green-600`}>
            {integration.icon}
          </div>
        );
      case 'sunshine':
        return (
          <div className={`${iconStyle} bg-gradient-to-br from-yellow-400 to-orange-500`}>
            {integration.icon}
          </div>
        );
      default:
        return (
          <div className={`${iconStyle} bg-gradient-to-br from-gray-400 to-gray-600`}>
            <Plug className="w-6 h-6" />
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading integrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Link href={`/dashboard/${workspaceSlug}/agents/${agentId}/settings`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Integrations</h1>
          <p className="text-muted-foreground">Connect your Agent to external services to use integration-specific actions.</p>
        </div>

        {/* Integrations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((integration) => (
            <Card key={integration.id} className="border border-border bg-card rounded-md hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {getIconComponent(integration)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-foreground">{integration.name}</h3>
                      {integration.status === 'connected' && (
                        <Badge variant="default" className="text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Connected
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                      {integration.description}
                    </p>
                    
                    {/* Calendly-specific connected info */}
                    {integration.id === 'calendly' && calendlyStatus.connected && calendlyStatus.userInfo && (
                      <div className="mb-4 p-3 bg-muted rounded-md">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium">Connected as {calendlyStatus.userInfo.name}</span>
                        </div>
                        {calendlyStatus.eventTypes && calendlyStatus.eventTypes.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {calendlyStatus.eventTypes.length} event type{calendlyStatus.eventTypes.length !== 1 ? 's' : ''} available
                          </div>
                        )}
                      </div>
                    )}

                    {/* Calendly buttons */}
                    {integration.id === 'calendly' && integration.status !== 'connected' ? (
                      <Button
                        onClick={() => handleConnect(integration.id)}
                        disabled={connecting === integration.id}
                        variant="default"
                        className="w-full rounded-md"
                      >
                        {connecting === integration.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Connect with OAuth
                          </>
                        )}
                      </Button>
                    ) : integration.id === 'calendly' && integration.status === 'connected' ? (
                      <Button
                        onClick={() => handleConnect(integration.id)}
                        disabled={connecting === integration.id}
                        variant="secondary"
                        className="w-full rounded-md"
                      >
                        {connecting === integration.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Disconnecting...
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 mr-2" />
                            Disconnect
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleConnect(integration.id)}
                        disabled={connecting === integration.id}
                        variant={integration.status === 'connected' ? 'secondary' : 'default'}
                        className="w-full rounded-md"
                      >
                        {connecting === integration.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {integration.status === 'connected' ? 'Disconnecting...' : 'Connecting...'}
                          </>
                        ) : integration.status === 'connected' ? (
                          'Connected'
                        ) : (
                          <>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Connect
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Coming Soon Notice */}
        <div className="mt-8 p-4 bg-muted rounded-md">
          <p className="text-sm text-muted-foreground text-center">
            More integrations coming soon! Have a specific integration request? Let us know.
          </p>
        </div>
      </div>
    </div>
  );
}
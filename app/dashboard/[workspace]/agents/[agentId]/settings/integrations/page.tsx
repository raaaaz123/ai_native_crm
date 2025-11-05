'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Loader2,
  ExternalLink,
  CheckCircle,
  XCircle,
  Calendar,
  Clock
} from 'lucide-react';
import { useAuth } from '@/app/lib/workspace-auth-context';
import { getAgent, type Agent } from '@/app/lib/agent-utils';
import { toast } from 'sonner';
import Link from 'next/link';

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

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  available: boolean;
  comingSoon?: boolean;
}

export default function IntegrationsPage() {
  const params = useParams();
  const workspaceSlug = params.workspace as string;
  const agentId = params.agentId as string;
  const { workspaceContext } = useAuth();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [calendlyStatus, setCalendlyStatus] = useState<{
    connected: boolean;
    userInfo?: CalendlyUserInfo;
    eventTypes?: CalendlyEventType[];
  }>({ connected: false });

  // Available integrations
  const integrations: Integration[] = [
    {
      id: 'calendly',
      name: 'Calendly',
      description: 'Enable AI-powered meeting scheduling with your Calendly account',
      icon: <Calendar className="w-6 h-6" />,
      available: true,
      comingSoon: false
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Send notifications and messages to Slack channels',
      icon: <div className="w-6 h-6 flex items-center justify-center text-lg">#</div>,
      available: false,
      comingSoon: true
    },
    {
      id: 'stripe',
      name: 'Stripe',
      description: 'Process payments and manage billing',
      icon: <div className="w-6 h-6 flex items-center justify-center text-lg font-bold">S</div>,
      available: false,
      comingSoon: true
    },
    {
      id: 'zendesk',
      name: 'Zendesk',
      description: 'Create and manage support tickets',
      icon: <div className="w-6 h-6 flex items-center justify-center text-lg">📋</div>,
      available: false,
      comingSoon: true
    },
    {
      id: 'hubspot',
      name: 'HubSpot',
      description: 'Sync contacts and deals with HubSpot CRM',
      icon: <div className="w-6 h-6 flex items-center justify-center text-lg">H</div>,
      available: false,
      comingSoon: true
    },
    {
      id: 'salesforce',
      name: 'Salesforce',
      description: 'Connect with Salesforce CRM',
      icon: <div className="w-6 h-6 flex items-center justify-center text-lg">☁</div>,
      available: false,
      comingSoon: true
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
      } else {
        setCalendlyStatus({ connected: false });
      }
    } catch (error) {
      console.error('Error checking Calendly status:', error);
      setCalendlyStatus({ connected: false });
    }
  };

  const handleCalendlyConnect = async () => {
    if (!workspaceContext?.currentWorkspace?.id || !agentId) {
      toast.error('Missing workspace or agent information');
      return;
    }

    setConnecting(true);

    try {
      console.log('🔗 Initiating Calendly connection...', {
        workspaceId: workspaceContext?.currentWorkspace?.id,
        agentId: agentId
      });

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

      const backendData = response.data?.data || response.data;
      const authorizationUrl = backendData?.authorization_url || backendData?.oauth_url;

      if (response.success && authorizationUrl) {
        console.log('✅ Got authorization URL:', authorizationUrl);

        const authWindow = window.open(
          authorizationUrl,
          'calendly-auth',
          'width=600,height=700,scrollbars=yes,resizable=yes'
        );

        if (!authWindow) {
          toast.error('Please allow popups to connect with Calendly');
          setConnecting(false);
          return;
        }

        const handleMessage = (event: MessageEvent) => {
          if (event.data?.type === 'CALENDLY_CONNECTED') {
            console.log('✅ Received Calendly connected message');
            window.removeEventListener('message', handleMessage);
            setConnecting(false);
            setTimeout(() => {
              checkCalendlyStatus();
            }, 1000);
          }
        };

        window.addEventListener('message', handleMessage);

        const checkClosed = setInterval(() => {
          if (authWindow?.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', handleMessage);
            setConnecting(false);
            setTimeout(() => {
              checkCalendlyStatus();
            }, 1000);
          }
        }, 1000);

        setTimeout(() => {
          clearInterval(checkClosed);
          if (authWindow && !authWindow.closed) {
            authWindow.close();
          }
          setConnecting(false);
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
        setConnecting(false);
      }
    } catch (error: unknown) {
      console.error('❌ Error connecting to Calendly:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`Connection error: ${errorMessage}`);
      setConnecting(false);
    }
  };

  const handleCalendlyDisconnect = async () => {
    if (!workspaceContext?.currentWorkspace?.id || !agentId) return;

    setConnecting(true);

    try {
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
      } else {
        toast.error('Failed to disconnect Calendly');
      }
    } catch (error) {
      console.error('Error disconnecting Calendly:', error);
      toast.error('Failed to disconnect Calendly');
    } finally {
      setConnecting(false);
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
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Link href={`/dashboard/${workspaceSlug}/agents/${agentId}/settings`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Integrations</h1>
          <p className="text-muted-foreground">Connect your agent to external services and tools</p>
        </div>

        {/* Active Integrations */}
        <div className="mb-10">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Available Now</h2>

          {/* Calendly Card - Featured */}
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center text-white shadow-md">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-xl">Calendly</CardTitle>
                      {calendlyStatus.connected && (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Connected
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-base">
                      Enable AI-powered meeting scheduling with your Calendly account
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {calendlyStatus.connected && calendlyStatus.userInfo ? (
                <div className="space-y-4">
                  {/* Connected Status */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-green-900">Connected as {calendlyStatus.userInfo.name}</p>
                        <p className="text-sm text-green-700 mt-1">{calendlyStatus.userInfo.email}</p>
                        {calendlyStatus.eventTypes && calendlyStatus.eventTypes.length > 0 && (
                          <div className="flex items-center gap-2 mt-2 text-sm text-green-700">
                            <Clock className="w-4 h-4" />
                            <span>{calendlyStatus.eventTypes.length} event type{calendlyStatus.eventTypes.length !== 1 ? 's' : ''} available</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Disconnect Button */}
                  <Button
                    onClick={handleCalendlyDisconnect}
                    disabled={connecting}
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    {connecting ? (
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
                </div>
              ) : (
                <Button
                  onClick={handleCalendlyConnect}
                  disabled={connecting}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
                >
                  {connecting ? (
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
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coming Soon Integrations */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Coming Soon</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {integrations.filter(i => i.comingSoon).map((integration) => (
              <Card key={integration.id} className="opacity-60 hover:opacity-80 transition-opacity">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center text-gray-600">
                      {integration.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-base">{integration.name}</CardTitle>
                        <Badge variant="secondary" className="text-xs">
                          Coming Soon
                        </Badge>
                      </div>
                      <CardDescription className="text-sm">
                        {integration.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 p-4 bg-muted/50 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground text-center">
            More integrations are on the way. Have a specific integration request? <Link href="#" className="text-primary hover:underline">Let us know</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

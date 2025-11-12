'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  ArrowLeft,
  Save,
  RotateCcw,
  FileText,
  Settings,
  Globe,
  AlertTriangle,
  Loader2,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '@/app/lib/workspace-auth-context';
import { getAgent, Agent } from '@/app/lib/agent-utils';
import {
  getAgentActions,
  createAgentAction,
  updateAgentAction,
  AgentAction
} from '@/app/lib/action-utils';
import { ZendeskConfig } from '@/app/lib/action-types';
import { toast } from 'sonner';

export default function ZendeskCreateTicketPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceSlug = params.workspace as string;
  const agentId = params.agentId as string;
  const { workspaceContext } = useAuth();
  
  // Check if we're editing a specific action
  const editActionId = searchParams.get('edit');

  const [agent, setAgent] = useState<Agent | null>(null);
  const [action, setAction] = useState<AgentAction | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<'general' | 'zendesk' | 'channels'>('general');
  const [zendeskConnected, setZendeskConnected] = useState(false);
  const [zendeskSubdomain, setZendeskSubdomain] = useState('');

  const [config, setConfig] = useState<ZendeskConfig>({
    general: {
      actionName: '',
      description: '',
      whenToUse: `Create a Zendesk ticket when:

1. User explicitly requests a ticket

2. You fail to resolve their issue after multiple attempts`
    },
    zendesk: {},
    channels: {
      chatWidget: true,
      helpPage: true
    }
  });

  useEffect(() => {
    loadAgentAndAction();
  }, [agentId, workspaceContext]);

  useEffect(() => {
    if (agentId && workspaceContext?.currentWorkspace?.id) {
      checkZendeskConnection();
    }
  }, [agentId, workspaceContext?.currentWorkspace?.id]);

  const checkZendeskConnection = async () => {
    if (!workspaceContext?.currentWorkspace?.id || !agentId) return;

    try {
      const response = await fetch(
        `/api/zendesk/status?workspace_id=${workspaceContext?.currentWorkspace?.id}&agent_id=${agentId}`
      );

      if (response.ok) {
        const responseData = await response.json();
        const data = responseData.data || responseData;
        
        const isConnected = data.connected || false;
        setZendeskConnected(isConnected);

        if (isConnected && data.connection_info?.subdomain) {
          setZendeskSubdomain(data.connection_info.subdomain);
        }
      } else {
        console.error('Failed to check Zendesk connection:', response.status);
        setZendeskConnected(false);
      }
    } catch (error) {
      console.error('Error checking Zendesk connection:', error);
      setZendeskConnected(false);
    }
  };

  const loadAgentAndAction = async () => {
    if (!agentId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Load agent
      const agentResponse = await getAgent(agentId);
      if (agentResponse.success) {
        setAgent(agentResponse.data);
      } else {
        console.error('Failed to load agent:', agentResponse.error);
        setAgent(null);
      }

      // Check if we're editing a specific action or any existing Zendesk action
      const actionsResponse = await getAgentActions(agentId);
      if (actionsResponse.success) {
        let existingAction: AgentAction | undefined;
        
        if (editActionId) {
          // Editing a specific action by ID
          existingAction = actionsResponse.data.find(a => a.id === editActionId);
        } else {
          // Editing any existing Zendesk action of this type
          existingAction = actionsResponse.data.find(a => a.type === 'zendesk-create-ticket');
        }
        
        if (existingAction) {
          setAction(existingAction);
          setConfig(existingAction.configuration as ZendeskConfig);
        }
      }
    } catch (error) {
      console.error('Error loading agent and action:', error);
      setAgent(null);
      setAction(null);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push(`/dashboard/${workspaceSlug}/agents/${agentId}/actions`);
  };

  const handleConnectZendesk = () => {
    // Navigate to integration settings
    router.push(`/dashboard/${workspaceSlug}/agents/${agentId}/settings/integrations`);
  };

  const handleSave = async (enableAction: boolean = false) => {
    // Validate required fields
    if (!config.general.actionName.trim()) {
      toast.error('Please enter an action name');
      return;
    }
    if (!config.general.whenToUse.trim()) {
      toast.error('Please describe when to use this action');
      return;
    }
    if (!zendeskConnected) {
      toast.error('Please connect your Zendesk account first');
      return;
    }

    setSaving(true);
    try {
      if (action) {
        // Update existing action
        const response = await updateAgentAction(action.id, {
          name: config.general.actionName,
          description: config.general.description,
          configuration: config,
          status: enableAction ? 'active' : 'draft'
        });

        if (response.success) {
          setAction(response.data);
          toast.success(`Zendesk action ${enableAction ? 'saved and enabled' : 'saved'} successfully!`);
          if (enableAction) {
            setTimeout(() => {
              handleBack();
            }, 1000);
          }
        } else {
          throw new Error(response.error || 'Failed to save configuration');
        }
      } else {
        // Create new action
        const response = await createAgentAction(agentId, workspaceContext?.currentWorkspace?.id || '', {
          type: 'zendesk-create-ticket',
          name: config.general.actionName,
          description: config.general.description || config.general.whenToUse,
          configuration: config
        });

        if (response.success) {
          setAction(response.data);

          // If enabling, update the status
          if (enableAction) {
            const updateResponse = await updateAgentAction(response.data.id, {
              status: 'active'
            });

            if (updateResponse.success) {
              toast.success('Zendesk action saved and enabled successfully!');
              setTimeout(() => {
                handleBack();
              }, 1000);
            }
          } else {
            toast.success('Zendesk action saved successfully!');
          }
        } else {
          throw new Error(response.error || 'Failed to create action');
        }
      }
    } catch (error) {
      console.error('Error saving Zendesk action:', error);
      toast.error('Failed to save Zendesk action');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setConfig({
      general: {
        actionName: '',
        description: '',
        whenToUse: `Create a Zendesk ticket when:

1. User explicitly requests a ticket

2. You fail to resolve their issue after multiple attempts`
      },
      zendesk: {},
      channels: {
        chatWidget: true,
        helpPage: true
      }
    });
    toast.success('Configuration reset to defaults');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground font-medium">Loading Zendesk configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-4 p-0 h-auto text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Actions
          </Button>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Zendesk create ticket</h1>
              <p className="text-muted-foreground">Configure Zendesk ticket creation action for your AI agent</p>
            </div>
          </div>

          {/* Connection Status */}
          {!zendeskConnected && (
            <Card className="border-warning/20 bg-warning/10">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground mb-1">Zendesk Not Connected</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      You need to connect your Zendesk account before configuring this action.
                    </p>
                    <Button
                      onClick={handleConnectZendesk}
                      size="sm"
                      className="bg-primary hover:bg-primary/90"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Connect Zendesk
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {zendeskConnected && (
            <Card className="border-success/20 bg-success/10">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground mb-1">Zendesk Connected</h4>
                    <p className="text-sm text-muted-foreground">
                      Connected to {zendeskSubdomain}.zendesk.com
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                <nav className="space-y-2">
                  {[
                    { id: 'general', label: 'General', icon: Settings },
                    { id: 'zendesk', label: 'Zendesk', icon: FileText },
                    { id: 'channels', label: 'Channels', icon: Globe }
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setActiveSection(id as 'general' | 'zendesk' | 'channels')}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeSection === id
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* General Section */}
            {activeSection === 'general' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    General
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="text-sm font-medium text-foreground mb-2 block">
                      Action Name
                    </Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      A descriptive name for this action. This will help the AI Agent know when to use it.
                    </p>
                    <Input
                      value={config.general.actionName}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        general: { ...prev.general, actionName: e.target.value }
                      }))}
                      placeholder="Zendesk_Create_Ticket"
                      className="font-mono border-border"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-foreground mb-2 block">
                      Description (Optional)
                    </Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      A brief description of what this action does.
                    </p>
                    <Input
                      value={config.general.description}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        general: { ...prev.general, description: e.target.value }
                      }))}
                      placeholder="Create tickets in your Zendesk account, such as support requests or feedback"
                      className="border-border"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-foreground mb-2 block">
                      Explain when the AI Agent should use this action
                    </Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Include a description of what this action does, the data it provides, and any updates it makes. Include example queries that should trigger this action.
                    </p>
                    <Textarea
                      value={config.general.whenToUse}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        general: { ...prev.general, whenToUse: e.target.value }
                      }))}
                      placeholder="Create a Zendesk ticket when..."
                      rows={8}
                      className="font-mono text-sm border-border"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Zendesk Section */}
            {activeSection === 'zendesk' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Zendesk
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {zendeskConnected ? (
                    <div className="space-y-4">
                      <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-success mt-0.5" />
                          <div className="flex-1">
                            <h4 className="font-medium text-foreground mb-1">Zendesk Account Connected</h4>
                            <p className="text-sm text-muted-foreground">
                              Your agent can now create tickets in {zendeskSubdomain}.zendesk.com
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground">
                          When this action is triggered, the AI agent will create a ticket in your Zendesk account with:
                        </p>
                        <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                          <li>Subject: Extracted from the user&apos;s request</li>
                          <li>Description: The conversation context and user&apos;s issue</li>
                          <li>Requester: User&apos;s email if available</li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <AlertTriangle className="w-12 h-12 text-warning mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">Zendesk Not Connected</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Please connect your Zendesk account to enable ticket creation.
                      </p>
                      <Button
                        onClick={handleConnectZendesk}
                        className="bg-primary hover:bg-primary/90"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Connect Zendesk Account
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Channels Section */}
            {activeSection === 'channels' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Channels
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Select which channels this action should be available on.
                    </p>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground mb-1">Chat Widget</h4>
                          <p className="text-sm text-muted-foreground">
                            Enable this action in the chat widget on your website
                          </p>
                        </div>
                        <Switch
                          checked={config.channels.chatWidget}
                          onCheckedChange={(checked) => setConfig(prev => ({
                            ...prev,
                            channels: { ...prev.channels, chatWidget: checked }
                          }))}
                          className="data-[state=checked]:bg-primary"
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground mb-1">Help Page</h4>
                          <p className="text-sm text-muted-foreground">
                            Enable this action on the help page
                          </p>
                        </div>
                        <Switch
                          checked={config.channels.helpPage}
                          onCheckedChange={(checked) => setConfig(prev => ({
                            ...prev,
                            channels: { ...prev.channels, helpPage: checked }
                          }))}
                          className="data-[state=checked]:bg-primary"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex gap-4">
              <Button
                onClick={() => handleSave(false)}
                disabled={saving || !zendeskConnected}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
              <Button
                onClick={() => handleSave(true)}
                disabled={saving || !zendeskConnected}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Save & Enable
                  </>
                )}
              </Button>
              <Button
                onClick={handleReset}
                variant="outline"
                disabled={saving}
                className="border-border"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


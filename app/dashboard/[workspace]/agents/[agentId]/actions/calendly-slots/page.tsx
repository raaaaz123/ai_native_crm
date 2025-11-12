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
  Calendar,
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
import { CalendlyConfig } from '@/app/lib/action-types';
import { toast } from 'sonner';

interface CalendlyEventType {
  uri: string;
  name: string;
  duration: number;
  active: boolean;
  scheduling_url: string;
}

export default function CalendlySlotsPage() {
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
  const [activeSection, setActiveSection] = useState<'general' | 'calendly' | 'channels'>('general');
  const [calendlyConnected, setCalendlyConnected] = useState(false);
  const [calendlyEventTypes, setCalendlyEventTypes] = useState<CalendlyEventType[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const [config, setConfig] = useState<CalendlyConfig>({
    general: {
      actionName: '',
      description: '',
      whenToUse: `Use when the user mentions booking an appointment.

If no date is specified, automatically set the window from today to 1 week from today and display these dates to the user without asking for confirmation.

If a date window is specified, set the search window to that specific date window and display it to the user.

After performing the search, respond with either "I have found available slots" or "I have not found available slots"

Display the search window but do not provide a list of slots or links.

After using the tool, check whether the user attempted to book an appointment. If asked, confirm only whether the user attempted or did not attempt to book, without guaranteeing completion.`
    },
    calendly: {
      eventTypeUri: '',
      eventTypeName: '',
      duration: 30
    },
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
      checkCalendlyConnection();
    }
  }, [agentId, workspaceContext?.currentWorkspace?.id]);

  const checkCalendlyConnection = async () => {
    if (!workspaceContext?.currentWorkspace?.id || !agentId) return;

    try {
      // Use Next.js API route to check Calendly connection status
      const response = await fetch(
        `/api/calendly/status?workspace_id=${workspaceContext?.currentWorkspace?.id}&agent_id=${agentId}`
      );

      if (response.ok) {
        const responseData = await response.json();
        const data = responseData.data || responseData;
        
        const isConnected = data.connected || false;
        setCalendlyConnected(isConnected);

        if (isConnected && data.event_types) {
          setCalendlyEventTypes(data.event_types);
        } else if (isConnected) {
          loadCalendlyEventTypes();
        }
      } else {
        console.error('Failed to check Calendly connection:', response.status);
        setCalendlyConnected(false);
      }
    } catch (error) {
      console.error('Error checking Calendly connection:', error);
      setCalendlyConnected(false);
    }
  };

  const loadCalendlyEventTypes = async () => {
    if (!workspaceContext?.currentWorkspace?.id || !agentId) return;

    try {
      setLoadingEvents(true);
      
      // Use Next.js API route to get Calendly event types
      const response = await fetch(
        `/api/calendly/event-types?workspace_id=${workspaceContext?.currentWorkspace?.id}&agent_id=${agentId}`
      );

      if (response.ok) {
        const responseData = await response.json();
        const data = responseData.data || responseData;
        setCalendlyEventTypes(data.event_types || responseData.event_types || []);
      } else {
        console.error('Failed to load Calendly event types:', response.status);
        toast.error('Failed to load Calendly events');
      }
    } catch (error) {
      console.error('Error loading Calendly event types:', error);
      toast.error('Failed to load Calendly events');
    } finally {
      setLoadingEvents(false);
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

      // Check if we're editing a specific action or any existing Calendly action
      const actionsResponse = await getAgentActions(agentId);
      if (actionsResponse.success) {
        let existingAction: AgentAction | undefined;
        
        if (editActionId) {
          // Editing a specific action by ID
          existingAction = actionsResponse.data.find(a => a.id === editActionId);
        } else {
          // Editing any existing Calendly action of this type
          existingAction = actionsResponse.data.find(a => a.type === 'calendly-slots');
        }
        
        if (existingAction) {
          setAction(existingAction);
          setConfig(existingAction.configuration as CalendlyConfig);
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

  const handleConnectCalendly = () => {
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
    if (!calendlyConnected) {
      toast.error('Please connect your Calendly account first');
      return;
    }
    if (!config.calendly.eventTypeUri) {
      toast.error('Please select a Calendly event');
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
          toast.success(`Calendly action ${enableAction ? 'saved and enabled' : 'saved'} successfully!`);
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
          type: 'calendly-slots',
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
              toast.success('Calendly action saved and enabled successfully!');
              setTimeout(() => {
                handleBack();
              }, 1000);
            }
          } else {
            toast.success('Calendly action saved successfully!');
          }
        } else {
          throw new Error(response.error || 'Failed to create action');
        }
      }
    } catch (error) {
      console.error('Error saving Calendly action:', error);
      toast.error('Failed to save Calendly action');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setConfig({
      general: {
        actionName: '',
        description: '',
        whenToUse: `Use when the user mentions booking an appointment.

If no date is specified, automatically set the window from today to 1 week from today and display these dates to the user without asking for confirmation.

If a date window is specified, set the search window to that specific date window and display it to the user.

After performing the search, respond with either "I have found available slots" or "I have not found available slots"

Display the search window but do not provide a list of slots or links.

After using the tool, check whether the user attempted to book an appointment. If asked, confirm only whether the user attempted or did not attempt to book, without guaranteeing completion.`
      },
      calendly: {
        eventTypeUri: '',
        eventTypeName: '',
        duration: 30
      },
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
          <p className="text-muted-foreground font-medium">Loading Calendly configuration...</p>
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
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Calendly get available slots</h1>
              <p className="text-muted-foreground">Configure Calendly booking action for your AI agent</p>
            </div>
          </div>

          {/* Connection Status */}
          {!calendlyConnected && (
            <Card className="border-warning/20 bg-warning/10">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground mb-1">Calendly Not Connected</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      You need to connect your Calendly account before configuring this action.
                    </p>
                    <Button
                      onClick={handleConnectCalendly}
                      size="sm"
                      className="bg-primary hover:bg-primary/90"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Connect Calendly
                    </Button>
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
                    { id: 'calendly', label: 'Calendly Event', icon: Calendar },
                    { id: 'channels', label: 'Channels', icon: Globe }
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setActiveSection(id as 'general' | 'calendly' | 'channels')}
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
                      placeholder="Calendly_Booking_Action"
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
                      placeholder="Allows users to book appointments via Calendly"
                      className="border-border"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-foreground mb-2 block">
                      When to use
                    </Label>
                    <p className="text-sm text-muted-foreground mb-4">
                      Explain when the AI Agent should use this action. Include a description of what this action does,
                      the data it provides, and any updates it makes. Include example queries that should trigger this action.
                    </p>
                    <Textarea
                      value={config.general.whenToUse}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        general: { ...prev.general, whenToUse: e.target.value }
                      }))}
                      className="min-h-[200px] border-border"
                      placeholder="Use when the user mentions booking an appointment..."
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleReset}
                      variant="outline"
                      className="flex items-center gap-2 border-border"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset
                    </Button>
                    <Button
                      onClick={() => handleSave(false)}
                      disabled={saving || !calendlyConnected}
                      variant="outline"
                      className="flex items-center gap-2 border-border"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Calendly Event Section */}
            {activeSection === 'calendly' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Calendly Event Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {!calendlyConnected ? (
                    <div className="text-center py-12">
                      <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        Connect Calendly First
                      </h3>
                      <p className="text-muted-foreground mb-6">
                        You need to connect your Calendly account to select events.
                      </p>
                      <Button onClick={handleConnectCalendly} className="bg-primary hover:bg-primary/90">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Connect Calendly Account
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <Label className="text-sm font-medium text-foreground mb-2 block">
                          Select Event
                        </Label>
                        <p className="text-sm text-muted-foreground mb-3">
                          Choose which Calendly event type users can book.
                        </p>
                        {loadingEvents ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            <span className="ml-2 text-sm text-muted-foreground">Loading events...</span>
                          </div>
                        ) : calendlyEventTypes.length > 0 ? (
                          <Select
                            value={config.calendly.eventTypeUri}
                            onValueChange={(value) => {
                              const selectedEvent = calendlyEventTypes.find(e => e.uri === value);
                              if (selectedEvent) {
                                setConfig(prev => ({
                                  ...prev,
                                  calendly: {
                                    eventTypeUri: selectedEvent.uri,
                                    eventTypeName: selectedEvent.name,
                                    duration: selectedEvent.duration
                                  }
                                }));
                              }
                            }}
                          >
                            <SelectTrigger className="border-border">
                              <SelectValue placeholder="Select a Calendly event" />
                            </SelectTrigger>
                            <SelectContent>
                              {calendlyEventTypes.filter(e => e.active).map((event) => (
                                <SelectItem key={event.uri} value={event.uri}>
                                  {event.name} ({event.duration} min)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                            <p className="text-sm text-muted-foreground">No active events found in your Calendly account.</p>
                          </div>
                        )}
                      </div>

                      {config.calendly.eventTypeUri && (
                        <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-medium text-foreground mb-1">Event Selected</h4>
                              <p className="text-sm text-muted-foreground">
                                <strong>{config.calendly.eventTypeName}</strong> - {config.calendly.duration} minutes
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-foreground mb-1">How it works</h4>
                            <p className="text-sm text-muted-foreground">
                              When users request to book an appointment, the AI will search for available time slots
                              in the selected Calendly event and provide booking options to the user.
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleSave(false)}
                      disabled={saving || !calendlyConnected || !config.calendly.eventTypeUri}
                      variant="outline"
                      className="flex items-center gap-2 border-border"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
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
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <h4 className="font-medium text-foreground">Chat widget</h4>
                          <p className="text-sm text-muted-foreground">Enable Calendly booking in the chat widget</p>
                        </div>
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
                      <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <h4 className="font-medium text-foreground">Help page</h4>
                          <p className="text-sm text-muted-foreground">Enable Calendly booking on help pages</p>
                        </div>
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

                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleSave(false)}
                      disabled={saving || !calendlyConnected}
                      variant="outline"
                      className="flex items-center gap-2 border-border"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                      onClick={() => handleSave(true)}
                      disabled={saving || !calendlyConnected || !config.calendly.eventTypeUri}
                      className="flex items-center gap-2 bg-primary hover:bg-primary/90"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Saving...' : 'Save & enable'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

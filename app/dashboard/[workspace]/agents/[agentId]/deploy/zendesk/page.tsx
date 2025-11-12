'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { useAuth } from '@/app/lib/workspace-auth-context';
import { getAgent, Agent } from '@/app/lib/agent-utils';
import {
  getZendeskIntegration,
  saveZendeskIntegration,
  ZendeskConnection
} from '@/app/lib/zendesk-utils';
import { toast } from 'sonner';

export default function ZendeskDeployPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = params.workspace as string;
  const agentId = params.agentId as string;
  const { workspaceContext } = useAuth();
  
  const workspaceId = workspaceContext?.currentWorkspace?.id || '';

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingIntegration, setExistingIntegration] = useState<ZendeskConnection | null>(null);

  // Form state
  const [zendeskAgentId, setZendeskAgentId] = useState('');
  const [zendeskAgentName, setZendeskAgentName] = useState('');
  const [autoAssignEnabled, setAutoAssignEnabled] = useState(false);
  const [baseInstructions, setBaseInstructions] = useState('');

  // Zendesk agents from API
  const [zendeskAgents, setZendeskAgents] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);

  useEffect(() => {
    if (!workspaceId || !agentId) return;
    loadData();
  }, [workspaceId, agentId]);

  const loadData = async () => {
    if (!workspaceId || !agentId) return;

    setLoading(true);
    try {
      // Load agent
      const agentResponse = await getAgent(agentId);
      if (agentResponse.success) {
        setAgent(agentResponse.data);
        
        // Load base instructions from agent settings
        const agent = agentResponse.data;
        let instructions = '';
        
        // Try to get from aiConfig first, then settings
        if (agent.aiConfig?.customSystemPrompt) {
          instructions = agent.aiConfig.customSystemPrompt;
        } else if (agent.aiConfig?.systemPrompt && agent.aiConfig.systemPrompt !== 'support' && agent.aiConfig.systemPrompt !== 'sales' && agent.aiConfig.systemPrompt !== 'booking' && agent.aiConfig.systemPrompt !== 'technical' && agent.aiConfig.systemPrompt !== 'general') {
          instructions = agent.aiConfig.systemPrompt;
        } else if (agent.settings?.systemPrompt) {
          instructions = agent.settings.systemPrompt;
        }
        
        setBaseInstructions(instructions);
      }

      // Load existing Zendesk integration
      const integration = await getZendeskIntegration(workspaceId, agentId);
      if (integration) {
        setExistingIntegration(integration);
        if (integration.zendeskAgentId) {
          setZendeskAgentId(integration.zendeskAgentId);
        }
        if (integration.zendeskAgentName) {
          setZendeskAgentName(integration.zendeskAgentName);
        }
        if (integration.autoAssignEnabled !== undefined) {
          setAutoAssignEnabled(integration.autoAssignEnabled);
        }
        if (integration.baseInstructions) {
          setBaseInstructions(integration.baseInstructions);
        }
      }

      // Load Zendesk agents
      await loadZendeskAgents();
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadZendeskAgents = async () => {
    if (!workspaceId || !agentId) return;

    setLoadingAgents(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://git-branch-m-main.onrender.com';
      const response = await fetch(
        `${backendUrl}/api/zendesk/agents?workspace_id=${workspaceId}&agent_id=${agentId}`
      );

      const data = await response.json();

      if (response.ok && data.success) {
        const agents = data.data.agents || [];
        setZendeskAgents(agents);
        
        // If no agent is selected yet and we have agents, select the first one
        if (!zendeskAgentId && agents.length > 0) {
          setZendeskAgentId(agents[0].id);
          setZendeskAgentName(`${agents[0].name} (${agents[0].email})`);
        }
      } else {
        // Silently handle 404 (Zendesk not connected) - UI will show appropriate message
        if (response.status !== 404) {
          console.error('Failed to load Zendesk agents:', data.detail || data.error);
          toast.error('Failed to load Zendesk agents');
        }
        // For 404, set empty agents array (UI will show "connect first" message)
        setZendeskAgents([]);
      }
    } catch (error) {
      console.error('Error loading Zendesk agents:', error);
      // Don't show error toast for network errors - Zendesk might not be connected
      setZendeskAgents([]);
    } finally {
      setLoadingAgents(false);
    }
  };

  const handleSave = async () => {
    if (!workspaceId || !agentId) {
      toast.error('Workspace or agent not found');
      return;
    }

    if (!baseInstructions.trim()) {
      toast.error('Base instructions are required');
      return;
    }

    setSaving(true);
    try {
      const success = await saveZendeskIntegration(workspaceId, agentId, {
        zendeskAgentId,
        zendeskAgentName,
        autoAssignEnabled,
        baseInstructions: baseInstructions.trim()
      });

      if (success) {
        toast.success('Zendesk integration saved successfully!');
        // Reload integration data
        await loadData();
      } else {
        toast.error('Failed to save Zendesk integration');
      }
    } catch (error) {
      console.error('Error saving Zendesk integration:', error);
      toast.error('Failed to save Zendesk integration');
    } finally {
      setSaving(false);
    }
  };

  const handleUnassign = async () => {
    if (!confirm('Are you sure you want to unassign the agent? This will disable the Zendesk integration.')) {
      return;
    }

    // For now, just disable auto-assign
    // Full deletion can be added later if needed
    setAutoAssignEnabled(false);
    setZendeskAgentId('');
    setZendeskAgentName('');
    toast.info('Agent unassigned. Use Save to update.');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6 sm:p-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push(`/dashboard/${workspaceSlug}/agents/${agentId}/deploy`)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Deploy
          </Button>
          <h1 className="text-3xl font-bold text-foreground mb-2">Zendesk</h1>
          <p className="text-muted-foreground">
            Deploy your agent to Zendesk tickets. Agent will auto-reply to tickets.
          </p>
        </div>

        {/* Zendesk Agent Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Zendesk Agent</CardTitle>
            <p className="text-sm text-muted-foreground font-normal mt-1">
              Assign the Chatbase AI Agent as a Zendesk agent to automatically respond to and resolve user tickets.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="zendesk-agent">Assign a Zendesk agent</Label>
              <p className="text-sm text-muted-foreground">
                Choose the Zendesk agent your agent will use to reply to tickets.
              </p>
              {loadingAgents ? (
                <div className="flex items-center gap-2 h-10 px-3 py-2 border rounded-md bg-muted">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading agents...</span>
                </div>
              ) : zendeskAgents.length === 0 ? (
                <div className="p-4 border rounded-md bg-blue-50 border-blue-200">
                  <p className="text-sm text-blue-900 font-medium mb-2">Connect Zendesk First</p>
                  <p className="text-sm text-blue-700 mb-3">
                    To deploy your agent to Zendesk, you need to connect your Zendesk account first. This will allow you to select agents and configure auto-reply settings.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/dashboard/${workspaceSlug}/agents/${agentId}/settings/integrations`)}
                    className="text-blue-700 border-blue-300 hover:bg-blue-100"
                  >
                    Go to Integrations
                  </Button>
                </div>
              ) : (
                <Select
                  value={zendeskAgentId}
                  onValueChange={(value) => {
                    const selected = zendeskAgents.find(a => a.id === value);
                    if (selected) {
                      setZendeskAgentId(selected.id);
                      setZendeskAgentName(`${selected.name} (${selected.email})`);
                    }
                  }}
                >
                  <SelectTrigger id="zendesk-agent">
                    <SelectValue placeholder="Select a Zendesk agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {zendeskAgents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name} ({agent.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <p className="text-xs text-muted-foreground">
                Make sure the agent has a role that allows them to be assigned tickets.
              </p>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-assign">Auto-assign to new tickets</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable this to automatically assign your agent to the selected Zendesk agent for all new Zendesk tickets.
                  </p>
                </div>
                <Switch
                  id="auto-assign"
                  checked={autoAssignEnabled}
                  onCheckedChange={setAutoAssignEnabled}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={handleUnassign}
                disabled={!existingIntegration || !zendeskAgentId}
              >
                Unassign agent
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !baseInstructions.trim() || !zendeskAgentId}
                className="ml-auto"
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
            </div>
          </CardContent>
        </Card>

        {/* Zendesk AI Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Zendesk AI Settings</CardTitle>
            <p className="text-sm text-muted-foreground font-normal mt-1">
              Configure how your AI agent behaves when accessed through Zendesk.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="base-instructions">Base Instructions</Label>
              <Textarea
                id="base-instructions"
                value={baseInstructions}
                onChange={(e) => setBaseInstructions(e.target.value)}
                placeholder="Enter base instructions for your AI agent..."
                className="min-h-[200px]"
              />
              <p className="text-xs text-muted-foreground">
                These instructions define how your agent responds to Zendesk tickets. Instructions are loaded from your agent setup.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={handleSave}
                disabled={saving || !baseInstructions.trim() || !zendeskAgentId}
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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


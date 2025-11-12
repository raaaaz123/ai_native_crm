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
  getZapierIntegration,
  saveZapierIntegration,
  ZapierIntegration
} from '@/app/lib/zapier-utils';
import { toast } from 'sonner';

export default function ZapierDeployPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = params.workspace as string;
  const agentId = params.agentId as string;
  const { workspaceContext } = useAuth();
  
  const workspaceId = workspaceContext?.currentWorkspace?.id || '';

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingIntegration, setExistingIntegration] = useState<ZapierIntegration | null>(null);

  // Form state
  const [zapierAgentId, setZapierAgentId] = useState('rasheed-m');
  const [zapierAgentName, setZapierAgentName] = useState('Rasheed M (rasheedmm1000@gmail.com)');
  const [autoAssignEnabled, setAutoAssignEnabled] = useState(false);
  const [baseInstructions, setBaseInstructions] = useState('');

  // Hardcoded Zapier agents for MVP
  const zapierAgents = [
    { id: 'rasheed-m', name: 'Rasheed M (rasheedmm1000@gmail.com)' }
  ];

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

      // Load existing Zapier integration
      const integration = await getZapierIntegration(workspaceId, agentId);
      if (integration) {
        setExistingIntegration(integration);
        setZapierAgentId(integration.zapierAgentId);
        setZapierAgentName(integration.zapierAgentName);
        setAutoAssignEnabled(integration.autoAssignEnabled);
        if (integration.baseInstructions) {
          setBaseInstructions(integration.baseInstructions);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
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
      const success = await saveZapierIntegration(workspaceId, agentId, {
        zapierAgentId,
        zapierAgentName,
        autoAssignEnabled,
        baseInstructions: baseInstructions.trim()
      });

      if (success) {
        toast.success('Zapier integration saved successfully!');
        // Reload integration data
        await loadData();
      } else {
        toast.error('Failed to save Zapier integration');
      }
    } catch (error) {
      console.error('Error saving Zapier integration:', error);
      toast.error('Failed to save Zapier integration');
    } finally {
      setSaving(false);
    }
  };

  const handleUnassign = async () => {
    if (!confirm('Are you sure you want to unassign the agent? This will disable the Zapier integration.')) {
      return;
    }

    // For now, just disable auto-assign
    // Full deletion can be added later if needed
    setAutoAssignEnabled(false);
    toast.info('Auto-assign disabled. Use Save to update.');
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Zapier</h1>
          <p className="text-muted-foreground">
            Deploy your agent to Zapier tickets. Agent will auto-reply to tickets.
          </p>
        </div>

        {/* Zapier Agent Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Zapier Agent</CardTitle>
            <p className="text-sm text-muted-foreground font-normal mt-1">
              Assign the Chatbase AI Agent as a Zapier agent to automatically respond to and resolve user tickets.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="zapier-agent">Assign a Zapier agent</Label>
              <p className="text-sm text-muted-foreground">
                Choose the Zapier agent your agent will use to reply to tickets.
              </p>
              <Select
                value={zapierAgentId}
                onValueChange={(value) => {
                  const selected = zapierAgents.find(a => a.id === value);
                  if (selected) {
                    setZapierAgentId(selected.id);
                    setZapierAgentName(selected.name);
                  }
                }}
              >
                <SelectTrigger id="zapier-agent">
                  <SelectValue placeholder="Select a Zapier agent" />
                </SelectTrigger>
                <SelectContent>
                  {zapierAgents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Make sure the agent has a role that allows them to be assigned tickets.
              </p>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-assign">Auto-assign to new tickets</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable this to automatically assign your agent to the selected Zapier agent for all new Zapier tickets.
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
                disabled={!existingIntegration}
              >
                Unassign agent
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !baseInstructions.trim()}
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

        {/* Zapier AI Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Zapier AI Settings</CardTitle>
            <p className="text-sm text-muted-foreground font-normal mt-1">
              Configure how your AI agent behaves when accessed through Zapier.
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
                These instructions define how your agent responds to Zapier tickets. Instructions are loaded from your agent setup.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={handleSave}
                disabled={saving || !baseInstructions.trim()}
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


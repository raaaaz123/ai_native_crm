'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  ArrowLeft,
  Save,
  RotateCcw,
  MousePointerClick,
  MessageSquare,
  Settings,
  Globe,
  AlertTriangle,
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
import { CustomButtonConfig } from '@/app/lib/action-types';
import { toast } from 'sonner';

export default function CustomButtonPage() {
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
  const [activeSection, setActiveSection] = useState<'general' | 'button' | 'channels'>('general');

  const [config, setConfig] = useState<CustomButtonConfig>({
    general: {
      actionName: '',
      description: '',
      whenToUse: 'Use this action when the user asks about a product or service.'
    },
    button: {
      buttonText: 'Go to Link',
      buttonUrl: 'https://www.example.com',
      openInNewTab: true
    },
    channels: {
      chatWidget: true,
      helpPage: true
    }
  });

  useEffect(() => {
    loadAgentAndAction();
  }, [agentId, workspaceContext]);

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

      // Check if we're editing a specific action or any existing custom button action
      const actionsResponse = await getAgentActions(agentId);
      if (actionsResponse.success) {
        let existingAction: AgentAction | undefined;
        
        if (editActionId) {
          // Editing a specific action by ID
          existingAction = actionsResponse.data.find(a => a.id === editActionId);
        } else {
          // Editing any existing custom button action of this type
          existingAction = actionsResponse.data.find(a => a.type === 'custom-button');
        }
        
        if (existingAction) {
          setAction(existingAction);
          setConfig(existingAction.configuration as CustomButtonConfig);
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
    if (!config.button.buttonText.trim()) {
      toast.error('Please enter button text');
      return;
    }
    if (!config.button.buttonUrl.trim()) {
      toast.error('Please enter button URL');
      return;
    }

    // Validate URL format
    try {
      new URL(config.button.buttonUrl);
    } catch (e) {
      toast.error('Please enter a valid URL');
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
          toast.success(`Custom button ${enableAction ? 'saved and enabled' : 'saved'} successfully!`);
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
          type: 'custom-button',
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
              toast.success('Custom button saved and enabled successfully!');
              setTimeout(() => {
                handleBack();
              }, 1000);
            }
          } else {
            toast.success('Custom button saved successfully!');
          }
        } else {
          throw new Error(response.error || 'Failed to create action');
        }
      }
    } catch (error) {
      console.error('Error saving custom button:', error);
      toast.error('Failed to save custom button');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setConfig({
      general: {
        actionName: '',
        description: '',
        whenToUse: 'Use this action when the user asks about a product or service.'
      },
      button: {
        buttonText: 'Go to Link',
        buttonUrl: 'https://www.example.com',
        openInNewTab: true
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground font-medium">Loading custom button configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-4 p-0 h-auto text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Actions
          </Button>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <MousePointerClick className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Custom button</h1>
              <p className="text-gray-600">Configure custom button action for your AI agent</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                <nav className="space-y-2">
                  {[
                    { id: 'general', label: 'General', icon: Settings },
                    { id: 'button', label: 'Button', icon: MousePointerClick },
                    { id: 'channels', label: 'Channels', icon: Globe }
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setActiveSection(id as 'general' | 'button' | 'channels')}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeSection === id
                          ? 'bg-blue-100 text-blue-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-100'
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
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Action Name
                    </Label>
                    <p className="text-sm text-gray-600 mb-3">
                      A descriptive name for this action. This will help the AI Agent know when to use it.
                    </p>
                    <Input
                      value={config.general.actionName}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        general: { ...prev.general, actionName: e.target.value }
                      }))}
                      placeholder="Example_Button_Action"
                      className="font-mono"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Description (Optional)
                    </Label>
                    <p className="text-sm text-gray-600 mb-3">
                      A brief description of what this action does.
                    </p>
                    <Input
                      value={config.general.description}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        general: { ...prev.general, description: e.target.value }
                      }))}
                      placeholder="Directs users to our product page"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      When to use
                    </Label>
                    <p className="text-sm text-gray-600 mb-4">
                      Explain when the AI Agent should use this action. Include a description of what this action does,
                      the data it provides, and any updates it makes. Include example queries that should trigger this action.
                    </p>
                    <Textarea
                      value={config.general.whenToUse}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        general: { ...prev.general, whenToUse: e.target.value }
                      }))}
                      className="min-h-[120px]"
                      placeholder="Example: Use this action when the user asks about a product or service."
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleReset}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset
                    </Button>
                    <Button
                      onClick={() => handleSave(false)}
                      disabled={saving}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Button Section */}
            {activeSection === 'button' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MousePointerClick className="w-5 h-5" />
                    Button Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Button Text
                    </Label>
                    <p className="text-sm text-gray-600 mb-3">
                      The text displayed on the button.
                    </p>
                    <Input
                      value={config.button.buttonText}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        button: { ...prev.button, buttonText: e.target.value }
                      }))}
                      placeholder="Go to Link"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Button URL
                    </Label>
                    <p className="text-sm text-gray-600 mb-3">
                      The URL to open when the button is clicked.
                    </p>
                    <Input
                      value={config.button.buttonUrl}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        button: { ...prev.button, buttonUrl: e.target.value }
                      }))}
                      placeholder="https://www.example.com"
                      type="url"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={config.button.openInNewTab}
                      onCheckedChange={(checked) => setConfig(prev => ({
                        ...prev,
                        button: { ...prev.button, openInNewTab: checked }
                      }))}
                    />
                    <Label className="text-sm text-gray-700">Open in new tab</Label>
                  </div>

                  {/* Button Preview */}
                  <div className="border-t pt-6">
                    <Label className="text-sm font-medium text-gray-700 mb-3 block">
                      Button Preview
                    </Label>
                    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                      <Button
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                        onClick={() => toast.info('This is a preview - button not functional')}
                      >
                        {config.button.buttonText || 'Button Text'}
                        {config.button.openInNewTab && <ExternalLink className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleSave(false)}
                      disabled={saving}
                      variant="outline"
                      className="flex items-center gap-2"
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
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-5 h-5 text-gray-600" />
                        <div>
                          <h4 className="font-medium text-gray-900">Chat widget</h4>
                          <p className="text-sm text-gray-600">Enable custom button in the chat widget</p>
                        </div>
                      </div>
                      <Switch
                        checked={config.channels.chatWidget}
                        onCheckedChange={(checked) => setConfig(prev => ({
                          ...prev,
                          channels: { ...prev.channels, chatWidget: checked }
                        }))}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-gray-600" />
                        <div>
                          <h4 className="font-medium text-gray-900">Help page</h4>
                          <p className="text-sm text-gray-600">Enable custom button on help pages</p>
                        </div>
                      </div>
                      <Switch
                        checked={config.channels.helpPage}
                        onCheckedChange={(checked) => setConfig(prev => ({
                          ...prev,
                          channels: { ...prev.channels, helpPage: checked }
                        }))}
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-800 mb-1">How it works</h4>
                        <p className="text-sm text-blue-700">
                          The AI agent will intelligently decide when to show this button based on your &quot;When to use&quot;
                          instructions. The button will appear dynamically in the conversation when the context matches
                          your specified conditions.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleSave(false)}
                      disabled={saving}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                      onClick={() => handleSave(true)}
                      disabled={saving}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
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

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Save, 
  RotateCcw,
  Users,
  MessageSquare,
  Settings,
  Smartphone,
  Globe,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/app/lib/workspace-auth-context';
import { getAgent, Agent } from '@/app/lib/agent-utils';
import { 
  getAgentActions, 
  createAgentAction, 
  saveCollectLeadsConfig,
  AgentAction 
} from '@/app/lib/action-utils';
import { CollectLeadsConfig } from '@/app/lib/action-types';
import { toast } from 'sonner';

export default function CollectLeadsPage() {
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
  const [activeSection, setActiveSection] = useState<'general' | 'fields' | 'messages' | 'channels'>('general');
  
  const [config, setConfig] = useState<CollectLeadsConfig>({
    general: {
      description: 'Always execute this action at the beginning of the conversation immediately after the user\'s first message to show the form to collect user information. After receiving the user\'s first message, execute the action then respond normally by answering their question then telling them: Let us know how to contact you',
      triggerCondition: 'user_first_message'
    },
    fields: [
      {
        id: 'name',
        name: 'name',
        label: 'Name',
        placeholder: 'Please enter your name',
        required: true,
        type: 'text'
      },
      {
        id: 'email',
        name: 'email',
        label: 'Email',
        placeholder: 'Please enter your email',
        required: true,
        type: 'email'
      },
      {
        id: 'phone',
        name: 'phone',
        label: 'Phone number',
        placeholder: 'Please enter your phone number',
        required: false,
        type: 'phone'
      }
    ],
    messages: {
      successMessage: 'Thank you for your submission! We will get back to you soon.',
      dismissMessage: 'You dismissed the form.'
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

      // Load or create collect leads action
      const actionsResponse = await getAgentActions(agentId);
      if (actionsResponse.success) {
        let collectLeadsAction: AgentAction | undefined;
        
        if (editActionId) {
          // Editing a specific action by ID
          collectLeadsAction = actionsResponse.data.find(a => a.id === editActionId);
        } else {
          // Editing any existing collect leads action of this type
          collectLeadsAction = actionsResponse.data.find(a => a.type === 'collect-leads');
        }

        if (collectLeadsAction) {
          setAction(collectLeadsAction);
          setConfig(collectLeadsAction.configuration as CollectLeadsConfig);
        } else if (!editActionId) {
          // Only auto-create if we're not editing a specific action
          // Create a new collect leads action
          const createResponse = await createAgentAction(agentId, workspaceSlug, {
            type: 'collect-leads',
            name: 'Collect leads',
            description: 'Collect leads from your website visitors',
            configuration: config
          });

          if (createResponse.success) {
            setAction(createResponse.data);
          } else {
            console.error('Failed to create action:', createResponse.error);
            toast.error('Failed to create collect leads action');
          }
        } else {
          // Editing a specific action that doesn't exist
          toast.error('Action not found');
          router.push(`/dashboard/${workspaceSlug}/agents/${agentId}/actions`);
        }
      } else {
        console.error('Failed to load actions:', actionsResponse.error);
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

  const handleSaveSection = async (section: keyof CollectLeadsConfig) => {
    if (!action) {
      toast.error('No action found to save');
      return;
    }

    setSaving(true);
    try {
      const sectionConfig = { [section]: config[section] };
      const response = await saveCollectLeadsConfig(action.id, sectionConfig);
      
      if (response.success) {
        setAction(response.data);
        toast.success(`${section.charAt(0).toUpperCase() + section.slice(1)} settings saved successfully!`);
      } else {
        throw new Error(response.error || 'Failed to save configuration');
      }
    } catch (error) {
      console.error(`Error saving ${section}:`, error);
      toast.error(`Failed to save ${section} settings`);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setConfig({
      general: {
        description: 'Always execute this action at the beginning of the conversation immediately after the user\'s first message to show the form to collect user information. After receiving the user\'s first message, execute the action then respond normally by answering their question then telling them: Let us know how to contact you',
        triggerCondition: 'user_first_message'
      },
      fields: [
        {
          id: 'name',
          name: 'name',
          label: 'Name',
          placeholder: 'Please enter your name',
          required: true,
          type: 'text'
        },
        {
          id: 'email',
          name: 'email',
          label: 'Email',
          placeholder: 'Please enter your email',
          required: true,
          type: 'email'
        },
        {
          id: 'phone',
          name: 'phone',
          label: 'Phone number',
          placeholder: 'Please enter your phone number',
          required: false,
          type: 'phone'
        }
      ],
      messages: {
        successMessage: 'Thank you for your submission! We will get back to you soon.',
        dismissMessage: 'You dismissed the form.'
      },
      channels: {
        chatWidget: true,
        helpPage: true
      }
    });
    toast.success('Configuration reset to defaults');
  };

  const addField = () => {
    const newField = {
      id: `field_${Date.now()}`,
      name: '',
      label: '',
      placeholder: '',
      required: false,
      type: 'text' as const
    };
    setConfig(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }));
  };

  const removeField = (fieldId: string) => {
    setConfig(prev => ({
      ...prev,
      fields: prev.fields.filter(field => field.id !== fieldId)
    }));
  };

  const updateField = (fieldId: string, updates: Partial<CollectLeadsConfig['fields'][0]>) => {
    setConfig(prev => ({
      ...prev,
      fields: prev.fields.map(field => 
        field.id === fieldId ? { ...field, ...updates } : field
      )
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground font-medium">Loading collect leads configuration...</p>
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
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Collect leads</h1>
              <p className="text-muted-foreground">Configure lead collection settings for your AI agent</p>
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
                    { id: 'fields', label: 'Fields', icon: MessageSquare },
                    { id: 'messages', label: 'Messages', icon: MessageSquare },
                    { id: 'channels', label: 'Channels', icon: Globe }
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setActiveSection(id as 'general' | 'fields' | 'messages' | 'channels')}
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
                      When to use
                    </Label>
                    <p className="text-sm text-muted-foreground mb-4">
                      Explain when the AI Agent should use this action. Include a description of what this action does, 
                      the data it provides, and any updates it makes. Include example queries that should trigger this action.
                    </p>
                    <Textarea
                      value={config.general.description}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        general: { ...prev.general, description: e.target.value }
                      }))}
                      className="min-h-[120px] border-border"
                      placeholder="Describe when and how this action should be used..."
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
                      onClick={() => handleSaveSection('general')}
                      disabled={saving}
                      className="flex items-center gap-2 bg-primary hover:bg-primary/90"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Saving...' : 'Save and continue'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Fields Section */}
            {activeSection === 'fields' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Fields
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {config.fields.map((field, index) => (
                    <div key={field.id} className="border border-border rounded-lg p-4 space-y-4 bg-card">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-foreground">Field {index + 1}</h4>
                        {config.fields.length > 1 && (
                          <Button
                            onClick={() => removeField(field.id)}
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive border-border"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-foreground">Field Name</Label>
                          <Input
                            value={field.name}
                            onChange={(e) => updateField(field.id, { name: e.target.value })}
                            placeholder="e.g., name, email"
                            className="border-border"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-foreground">Label</Label>
                          <Input
                            value={field.label}
                            onChange={(e) => updateField(field.id, { label: e.target.value })}
                            placeholder="e.g., Name, Email"
                            className="border-border"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label className="text-sm font-medium text-foreground">Placeholder</Label>
                          <Input
                            value={field.placeholder}
                            onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                            placeholder="e.g., Please enter your name"
                            className="border-border"
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={field.required}
                          onCheckedChange={(checked) => updateField(field.id, { required: checked })}
                          className="data-[state=checked]:bg-primary"
                        />
                        <Label className="text-sm text-foreground">Required field</Label>
                      </div>
                    </div>
                  ))}
                  
                  <Button
                    onClick={addField}
                    variant="outline"
                    className="w-full border-dashed border-border"
                  >
                    Add Field
                  </Button>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleSaveSection('fields')}
                      disabled={saving}
                      className="flex items-center gap-2 bg-primary hover:bg-primary/90"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Saving...' : 'Save and continue'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Messages Section */}
            {activeSection === 'messages' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Messages
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="text-sm font-medium text-foreground mb-2 block">
                      Success Message
                    </Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      This message will be displayed when the user successfully submits the form.
                    </p>
                    <Textarea
                      value={config.messages.successMessage}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        messages: { ...prev.messages, successMessage: e.target.value }
                      }))}
                      placeholder="Example: Thank you for your submission! We will get back to you soon."
                      className="min-h-[80px] border-border"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-foreground mb-2 block">
                      Dismiss Message
                    </Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      This message will be displayed when the user dismisses the form.
                    </p>
                    <Textarea
                      value={config.messages.dismissMessage}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        messages: { ...prev.messages, dismissMessage: e.target.value }
                      }))}
                      placeholder="Example: You dismissed the form."
                      className="min-h-[80px] border-border"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleSaveSection('messages')}
                      disabled={saving}
                      className="flex items-center gap-2 bg-primary hover:bg-primary/90"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Saving...' : 'Save and continue'}
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
                        <MessageSquare className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <h4 className="font-medium text-foreground">Chat widget</h4>
                          <p className="text-sm text-muted-foreground">Enable lead collection in the chat widget</p>
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
                          <p className="text-sm text-muted-foreground">Enable lead collection on help pages</p>
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

                  <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-warning mb-1">Channel Compatibility</h4>
                        <p className="text-sm text-muted-foreground">
                          Some channels are incompatible with this action. Make sure to test the lead collection 
                          form in your selected channels before going live.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleSaveSection('channels')}
                      disabled={saving}
                      className="flex items-center gap-2 bg-primary hover:bg-primary/90"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Saving...' : 'Save and continue'}
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
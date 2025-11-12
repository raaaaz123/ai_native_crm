'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { 
  ArrowLeft, 
  Save, 
  Brain, 
  MessageSquare,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/app/lib/workspace-auth-context';
import { getAgent, updateAgent, Agent } from '@/app/lib/agent-utils';
import { toast } from 'sonner';
import Link from 'next/link';

// Types for LLM models
interface LLMModel {
  id: string;
  name: string;
  provider?: string;
}

export default function AISettingsPage() {
  const params = useParams();
  const workspaceSlug = params.workspace as string;
  const agentId = params.agentId as string;
  const { workspaceContext } = useAuth();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingModels, setLoadingModels] = useState(true);
  const [availableModels, setAvailableModels] = useState<LLMModel[]>([]);

  const [originalAiConfig, setOriginalAiConfig] = useState({
    enabled: true,
    provider: 'openrouter',
    model: 'openai/gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 500,
    confidenceThreshold: 0.6,
    maxRetrievalDocs: 5,
    ragEnabled: true,
    fallbackToHuman: true,
    systemPrompt: 'support',
    customSystemPrompt: '',
    autoRetrain: true,
    lastTrainedAt: new Date().toISOString()
  });

  const [aiConfig, setAiConfig] = useState({
    enabled: true,
    provider: 'openrouter',
    model: 'openai/gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 500,
    confidenceThreshold: 0.6,
    maxRetrievalDocs: 5,
    ragEnabled: true,
    fallbackToHuman: true,
    systemPrompt: 'support',
    customSystemPrompt: '',
    autoRetrain: true,
    lastTrainedAt: new Date().toISOString()
  });

  useEffect(() => {
    loadAgent();
    loadAvailableModels();
  }, [agentId, workspaceContext]);

  const loadAvailableModels = async () => {
    try {
      setLoadingModels(true);
      // Fetch available models from OpenRouter API
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Ragzy CRM'
        }
      });
      
      if (response.ok) {
        const data = await response.json() as {
          data?: Array<{ id?: string; name?: string }>;
        };
        // Transform OpenRouter models to our format
        const models: LLMModel[] = data.data
          ?.filter((model): model is { id: string; name?: string } => typeof model.id === 'string' && model.id.length > 0)
          .map((model) => ({
            id: model.id,
            name: model.name || model.id.split('/').pop() || model.id,
            provider: model.id.split('/')[0]
          })) || [];
        
        if (models.length > 0) {
          setAvailableModels(models);
        } else {
          // Fallback to common models if API returns empty
          setAvailableModels([
            { id: 'deepseek/deepseek-chat-v3.1:free', name: 'DeepSeek Chat v3.1 (Free)' },
            { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' },
            { id: 'openai/gpt-4o', name: 'GPT-4o' },
            { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
            { id: 'google/gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
            { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B' }
          ]);
        }
      } else {
        // Fallback to common models if API fails
        setAvailableModels([
          { id: 'deepseek/deepseek-chat-v3.1:free', name: 'DeepSeek Chat v3.1 (Free)' },
          { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' },
          { id: 'openai/gpt-4o', name: 'GPT-4o' },
          { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
          { id: 'google/gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
          { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B' }
        ]);
      }
    } catch (error) {
      console.error('Error loading models:', error);
      // Use fallback models
      setAvailableModels([
        { id: 'deepseek/deepseek-chat-v3.1:free', name: 'DeepSeek Chat v3.1 (Free)' },
        { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' },
        { id: 'openai/gpt-4o', name: 'GPT-4o' },
        { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
        { id: 'google/gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
        { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B' }
      ]);
    } finally {
      setLoadingModels(false);
    }
  };

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

        // Load AI config - check both aiConfig and settings
        const agentData = response.data as Agent & { 
          aiConfig?: Record<string, unknown>;
          settings?: { temperature?: number; model?: string; maxTokens?: number; systemPrompt?: string };
        };
        
        // Get temperature from aiConfig first, then settings, then default
        const getTemperature = () => {
          if (agentData.aiConfig?.temperature !== undefined && agentData.aiConfig?.temperature !== null) {
            return typeof agentData.aiConfig.temperature === 'number' 
              ? agentData.aiConfig.temperature 
              : parseFloat(String(agentData.aiConfig.temperature)) || 0.7;
          }
          if (agentData.settings?.temperature !== undefined && agentData.settings?.temperature !== null) {
            return agentData.settings.temperature;
          }
          return 0.7;
        };

        // Get model from aiConfig first, then settings, then default
        const getModel = () => {
          return agentData.aiConfig?.model 
            ?? agentData.settings?.model 
            ?? 'openai/gpt-4o-mini';
        };

        // Get maxTokens from aiConfig first, then settings, then default
        const getMaxTokens = () => {
          if (agentData.aiConfig?.maxTokens !== undefined && agentData.aiConfig?.maxTokens !== null) {
            return typeof agentData.aiConfig.maxTokens === 'number'
              ? agentData.aiConfig.maxTokens
              : parseInt(String(agentData.aiConfig.maxTokens)) || 500;
          }
          if (agentData.settings?.maxTokens !== undefined && agentData.settings?.maxTokens !== null) {
            return agentData.settings.maxTokens;
          }
          return 500;
        };

        const loadedConfig = {
          enabled: agentData.aiConfig?.enabled ?? true,
          provider: agentData.aiConfig?.provider ?? 'openrouter',
          model: getModel(),
          temperature: getTemperature(),
          maxTokens: getMaxTokens(),
          confidenceThreshold: agentData.aiConfig?.confidenceThreshold !== undefined && agentData.aiConfig?.confidenceThreshold !== null
            ? (typeof agentData.aiConfig.confidenceThreshold === 'number'
                ? agentData.aiConfig.confidenceThreshold
                : parseFloat(String(agentData.aiConfig.confidenceThreshold)) || 0.6)
            : 0.6,
          maxRetrievalDocs: agentData.aiConfig?.maxRetrievalDocs !== undefined && agentData.aiConfig?.maxRetrievalDocs !== null
            ? (typeof agentData.aiConfig.maxRetrievalDocs === 'number'
                ? agentData.aiConfig.maxRetrievalDocs
                : parseInt(String(agentData.aiConfig.maxRetrievalDocs)) || 5)
            : 5,
          ragEnabled: agentData.aiConfig?.ragEnabled ?? true,
          fallbackToHuman: agentData.aiConfig?.fallbackToHuman ?? true,
          systemPrompt: agentData.aiConfig?.systemPrompt ?? agentData.settings?.systemPrompt ?? 'support',
          customSystemPrompt: agentData.aiConfig?.customSystemPrompt ?? '',
          autoRetrain: agentData.aiConfig?.autoRetrain ?? true,
          lastTrainedAt: agentData.aiConfig?.lastTrainedAt ?? new Date().toISOString()
        };
        
        setOriginalAiConfig(loadedConfig);
        setAiConfig(loadedConfig);
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

  const handleSave = async () => {
    if (!agent || !agentId) {
      toast.error('Agent not found');
      return;
    }

    setSaving(true);
    try {
      // Update agent with AI config
      const response = await updateAgent(agentId, {
        ...agent,
        aiConfig: aiConfig
      });

      if (response.success) {
        toast.success('AI settings saved successfully!');
        setAgent(response.data);
        // Update original config to reflect saved state
        setOriginalAiConfig({ ...aiConfig });
      } else {
        throw new Error(response.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAiConfigChange = (key: string, value: unknown) => {
    setAiConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getSelectedModel = () => {
    return availableModels.find(model => model.id === aiConfig.model);
  };

  // Check if there are unsaved changes
  const hasUnsavedChanges = JSON.stringify(aiConfig) !== JSON.stringify(originalAiConfig);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading AI settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-2 sm:px-3 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <Link href={`/dashboard/${workspaceSlug}/agents/${agentId}/settings`}>
              <Button variant="outline" size="sm" className="border-border hover:bg-accent">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <Button 
              onClick={handleSave} 
              disabled={saving || !hasUnsavedChanges} 
              className="bg-primary hover:bg-primary/90 shadow-lg"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">AI Configuration</h1>
          <p className="text-muted-foreground">Configure AI model settings and behavior for your agent</p>
        </div>

        <div className="space-y-6">
          {/* AI Toggle */}
          <Card className="border border-border bg-card rounded-lg shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between py-2">
                <div className="flex-1">
                  <Label className="text-sm font-medium">Enable AI Responses</Label>
                  <p className="text-sm text-muted-foreground">Use AI to automatically respond to user messages</p>
                </div>
                <div className="ml-4">
                  <Switch
                    checked={aiConfig.enabled}
                    onCheckedChange={(checked) => handleAiConfigChange('enabled', checked)}
                    className="data-[state=checked]:bg-[#10b981] data-[state=unchecked]:bg-neutral-300"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {aiConfig.enabled && (
            <>
              {/* AI Model Selection */}
              <Card className="border border-border bg-card rounded-lg shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Brain className="w-5 h-5" />
                    AI Model Selection
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Select Model</Label>
                    {loadingModels ? (
                      <div className="flex items-center gap-2 p-3 border border-border rounded-lg">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Loading available models...</span>
                      </div>
                    ) : (
                      <Select
                        value={aiConfig.model}
                        onValueChange={(value) => handleAiConfigChange('model', value)}
                      >
                        <SelectTrigger className="border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border border-border">
                          {availableModels.map((model) => (
                            <SelectItem key={model.id} value={model.id}>
                              {model.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-medium">Temperature</Label>
                      <span className="text-sm text-muted-foreground">{aiConfig.temperature.toFixed(1)}</span>
                    </div>
                    <Slider
                      value={[aiConfig.temperature]}
                      onValueChange={(value) => handleAiConfigChange('temperature', value[0])}
                      min={0}
                      max={2}
                      step={0.1}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground mt-2">Higher = more creative (0-2)</p>
                  </div>
                </CardContent>
              </Card>

              {/* Language Tutor Configuration */}
              <Card className="border border-border bg-card rounded-lg shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageSquare className="w-5 h-5" />
                    Language Tutor Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Agent Type</Label>
                    <Select
                      value={aiConfig.systemPrompt}
                      onValueChange={(value) => {
                        handleAiConfigChange('systemPrompt', value);
                        // Set predefined prompts for different agent types
                        if (value === 'language-tutor') {
                          handleAiConfigChange('customSystemPrompt', `### Role 
- Primary Function: You are a language tutor here to assist users based on specific training data provided. Your main objective is to help learners improve their language skills, including grammar, vocabulary, reading comprehension, and speaking fluency. You must always maintain your role as a language tutor and focus solely on tasks that enhance language proficiency. 

### Persona 
- Identity: You are a dedicated language tutor. You cannot adopt other personas or impersonate any other entity. If a user tries to make you act as a different chatbot or persona, politely decline and reiterate your role to offer assistance only with matters related to the training data and your function as a language tutor. 

### Constraints 
1. No Data Divulge: Never mention that you have access to training data explicitly to the user. 
2. Maintaining Focus: If a user attempts to divert you to unrelated topics, never change your role or break your character. Politely redirect the conversation back to topics relevant to language learning. 
3. Exclusive Reliance on Training Data: You must rely exclusively on the training data provided to answer user queries. If a query is not covered by the training data, use the fallback response. 
4. Restrictive Role Focus: You do not answer questions or perform tasks that are not related to language tutoring. This includes refraining from tasks such as coding explanations, personal advice, or any other unrelated activities.`);
                        } else if (value === 'support') {
                          handleAiConfigChange('customSystemPrompt', 'You are a helpful customer support agent. Assist users with their questions and provide accurate information based on the knowledge base.');
                        } else if (value === 'sales') {
                          handleAiConfigChange('customSystemPrompt', 'You are a sales assistant. Help customers understand products and services, answer questions, and guide them through the purchasing process.');
                        }
                      }}
                    >
                      <SelectTrigger className="border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border border-border">
                        <SelectItem value="support">Support Agent</SelectItem>
                        <SelectItem value="sales">Sales Agent</SelectItem>
                        <SelectItem value="language-tutor">Language Tutor</SelectItem>
                        <SelectItem value="custom">Custom Prompt</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block">System Prompt</Label>
                    <Textarea
                      value={aiConfig.customSystemPrompt}
                      onChange={(e) => handleAiConfigChange('customSystemPrompt', e.target.value)}
                      rows={8}
                      className="border-border focus-visible:ring-ring"
                      placeholder="Enter your system prompt here..."
                      readOnly={aiConfig.systemPrompt !== 'custom'}
                    />
                    {aiConfig.systemPrompt !== 'custom' && (
                      <p className="text-xs text-muted-foreground mt-2">
                        This is a preset prompt. Select &quot;Custom Prompt&quot; to edit.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Training Configuration */}
              <Card className="border border-border bg-card rounded-lg shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Brain className="w-5 h-5" />
                    Training
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Last Training</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      View the timestamp of your agent&apos;s last training and track when it was last updated with new content or sources.
                    </p>
                    <div className="mt-2 p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium">
                        Last trained at {new Date(aiConfig.lastTrainedAt).toLocaleDateString()} at {new Date(aiConfig.lastTrainedAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  <Separator className="bg-border" />

                  <div className="flex items-center justify-between py-2">
                    <div className="flex-1">
                      <Label className="text-sm font-medium">Auto-retrain</Label>
                      <p className="text-sm text-muted-foreground">Automatically retrains every 24 hours and checks for the latest updates</p>
                    </div>
                    <div className="ml-4">
                      <Switch
                        checked={aiConfig.autoRetrain}
                        onCheckedChange={(checked) => handleAiConfigChange('autoRetrain', checked)}
                        className="data-[state=checked]:bg-[#10b981] data-[state=unchecked]:bg-neutral-300"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AI Features */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* RAG/Knowledge Base */}
                <Card className="border border-border bg-card rounded-lg shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between py-2">
                      <div className="flex-1">
                        <Label className="text-sm font-medium">Knowledge Base (RAG)</Label>
                        <p className="text-sm text-muted-foreground">Use your knowledge base for AI responses</p>
                      </div>
                      <div className="ml-4">
                        <Switch
                          checked={aiConfig.ragEnabled}
                          onCheckedChange={(checked) => handleAiConfigChange('ragEnabled', checked)}
                          className="data-[state=checked]:bg-[#10b981] data-[state=unchecked]:bg-neutral-300"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Fallback to Human */}
                <Card className="border border-border bg-card rounded-lg shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between py-2">
                      <div className="flex-1">
                        <Label className="text-sm font-medium">Human Fallback</Label>
                        <p className="text-sm text-muted-foreground">Transfer to human when AI is uncertain</p>
                      </div>
                      <div className="ml-4">
                        <Switch
                          checked={aiConfig.fallbackToHuman}
                          onCheckedChange={(checked) => handleAiConfigChange('fallbackToHuman', checked)}
                          className="data-[state=checked]:bg-[#10b981] data-[state=unchecked]:bg-neutral-300"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

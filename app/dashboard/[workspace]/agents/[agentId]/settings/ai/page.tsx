'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Save, 
  Zap, 
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
  provider: string;
  description: string;
  maxTokens: number;
  costPer1kTokens: number;
}

export default function AISettingsPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = params.workspace as string;
  const agentId = params.agentId as string;
  const { workspaceContext } = useAuth();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingModels, setLoadingModels] = useState(true);
  const [availableModels, setAvailableModels] = useState<LLMModel[]>([]);

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
      // Fetch available models from backend
      const response = await fetch('/api/ai/models');
      if (response.ok) {
        const models = await response.json();
        setAvailableModels(models);
      } else {
        // Fallback to default models if API fails
        setAvailableModels([
          {
            id: 'openai/gpt-4o-mini',
            name: 'GPT-4o Mini',
            provider: 'OpenAI',
            description: 'Fast and efficient model for most tasks',
            maxTokens: 16384,
            costPer1kTokens: 0.15
          },
          {
            id: 'openai/gpt-4o',
            name: 'GPT-4o',
            provider: 'OpenAI',
            description: 'Most capable model with multimodal abilities',
            maxTokens: 128000,
            costPer1kTokens: 2.50
          },
          {
            id: 'anthropic/claude-3.5-sonnet',
            name: 'Claude 3.5 Sonnet',
            provider: 'Anthropic',
            description: 'Excellent reasoning and analysis capabilities',
            maxTokens: 200000,
            costPer1kTokens: 3.00
          },
          {
            id: 'google/gemini-1.5-pro',
            name: 'Gemini 1.5 Pro',
            provider: 'Google',
            description: 'Large context window and multimodal support',
            maxTokens: 2000000,
            costPer1kTokens: 1.25
          },
          {
            id: 'meta-llama/llama-3.1-70b-instruct',
            name: 'Llama 3.1 70B',
            provider: 'Meta',
            description: 'Open source model with strong performance',
            maxTokens: 131072,
            costPer1kTokens: 0.88
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading models:', error);
      // Use fallback models
      setAvailableModels([
        {
          id: 'openai/gpt-4o-mini',
          name: 'GPT-4o Mini',
          provider: 'OpenAI',
          description: 'Fast and efficient model for most tasks',
          maxTokens: 16384,
          costPer1kTokens: 0.15
        }
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

        // Load AI config if it exists in agent settings
        const agentData = response.data as Agent & { aiConfig?: Record<string, unknown> };
        if (agentData.aiConfig) {
          setAiConfig({
            enabled: agentData.aiConfig.enabled ?? true,
            provider: agentData.aiConfig.provider ?? 'openrouter',
            model: agentData.aiConfig.model ?? 'openai/gpt-4o-mini',
            temperature: agentData.aiConfig.temperature ?? 0.7,
            maxTokens: agentData.aiConfig.maxTokens ?? 500,
            confidenceThreshold: agentData.aiConfig.confidenceThreshold ?? 0.6,
            maxRetrievalDocs: agentData.aiConfig.maxRetrievalDocs ?? 5,
            ragEnabled: agentData.aiConfig.ragEnabled ?? true,
            fallbackToHuman: agentData.aiConfig.fallbackToHuman ?? true,
            systemPrompt: agentData.aiConfig.systemPrompt ?? 'support',
            customSystemPrompt: agentData.aiConfig.customSystemPrompt ?? '',
            autoRetrain: agentData.aiConfig.autoRetrain ?? true,
            lastTrainedAt: agentData.aiConfig.lastTrainedAt ?? new Date().toISOString()
          });
        }
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
      <div className="max-w-4xl mx-auto px-4 py-6">
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
          <h1 className="text-2xl font-semibold text-foreground mb-2">AI Configuration</h1>
          <p className="text-muted-foreground">Configure AI model settings and behavior for your agent</p>
        </div>

        <div className="space-y-6">
          {/* AI Toggle */}
          <Card className="border border-border bg-card rounded-md">
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
                    className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-gray-300 border-2 border-gray-200 data-[state=unchecked]:border-gray-300"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {aiConfig.enabled && (
            <>
              {/* AI Model Selection */}
              <Card className="border border-border bg-card rounded-md">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Brain className="w-5 h-5" />
                    AI Model Selection
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Select Model</Label>
                    {loadingModels ? (
                      <div className="flex items-center gap-2 mt-2 p-3 border rounded-md">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Loading available models...</span>
                      </div>
                    ) : (
                      <Select
                        value={aiConfig.model}
                        onValueChange={(value) => handleAiConfigChange('model', value)}
                      >
                        <SelectTrigger className="mt-2 rounded-md">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border border-border">
                          {availableModels.map((model) => (
                            <SelectItem key={model.id} value={model.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{model.name}</span>
                                <span className="text-xs text-muted-foreground">{model.provider} • ${model.costPer1kTokens}/1K tokens</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {getSelectedModel() && (
                      <div className="mt-3 p-3 bg-muted rounded-md">
                        <p className="text-sm font-medium text-foreground mb-1">{getSelectedModel()?.name}</p>
                        <p className="text-xs text-muted-foreground">{getSelectedModel()?.description}</p>
                        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Max tokens: {getSelectedModel()?.maxTokens.toLocaleString()}</span>
                          <span>Cost: ${getSelectedModel()?.costPer1kTokens}/1K tokens</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Temperature</Label>
                      <Input
                        type="number"
                        min="0"
                        max="2"
                        step="0.1"
                        value={aiConfig.temperature}
                        onChange={(e) => handleAiConfigChange('temperature', parseFloat(e.target.value))}
                        className="mt-1 rounded-md"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Higher = more creative (0-2)</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Max Tokens</Label>
                      <Input
                        type="number"
                        min="1"
                        max="4000"
                        value={aiConfig.maxTokens}
                        onChange={(e) => handleAiConfigChange('maxTokens', parseInt(e.target.value))}
                        className="mt-1 rounded-md"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Max response length</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Language Tutor Configuration */}
              <Card className="border border-border bg-card rounded-md">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageSquare className="w-5 h-5" />
                    Language Tutor Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Agent Type</Label>
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
                      <SelectTrigger className="mt-1 rounded-md">
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
                    <Label className="text-sm font-medium">System Prompt</Label>
                    <Textarea
                      value={aiConfig.customSystemPrompt}
                      onChange={(e) => handleAiConfigChange('customSystemPrompt', e.target.value)}
                      rows={8}
                      className="mt-1 rounded-md"
                      placeholder="Enter your system prompt here..."
                      readOnly={aiConfig.systemPrompt !== 'custom'}
                    />
                    {aiConfig.systemPrompt !== 'custom' && (
                      <p className="text-xs text-muted-foreground mt-1">
                        This is a preset prompt. Select &quot;Custom Prompt&quot; to edit.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Training Configuration */}
              <Card className="border border-border bg-card rounded-md">
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
                    <div className="mt-2 p-3 bg-muted rounded-md">
                      <p className="text-sm font-medium">
                        Last trained at {new Date(aiConfig.lastTrainedAt).toLocaleDateString()} at {new Date(aiConfig.lastTrainedAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between py-2">
                    <div className="flex-1">
                      <Label className="text-sm font-medium">Auto-retrain</Label>
                      <p className="text-sm text-muted-foreground">Automatically retrains every 24 hours and checks for the latest updates</p>
                    </div>
                    <div className="ml-4">
                      <Switch
                        checked={aiConfig.autoRetrain}
                        onCheckedChange={(checked) => handleAiConfigChange('autoRetrain', checked)}
                        className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-gray-300 border-2 border-gray-200 data-[state=unchecked]:border-gray-300"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AI Features */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* RAG/Knowledge Base */}
                <Card className="border border-border bg-card rounded-md">
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
                          className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-gray-300 border-2 border-gray-200 data-[state=unchecked]:border-gray-300"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Fallback to Human */}
                <Card className="border border-border bg-card rounded-md">
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
                          className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-gray-300 border-2 border-gray-200 data-[state=unchecked]:border-gray-300"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 rounded-md">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save AI Settings
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Settings as SettingsIcon,
  Shield,
  Globe,
  Zap,
  Key,
  Bell,
  Palette,
  Database,
  ExternalLink,
  Save,
  AlertCircle,
  CheckCircle,
  Info,
  Lock,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Edit,
  Copy,
  Download
} from 'lucide-react';
import { useAuth } from '@/app/lib/workspace-auth-context';
import { getAgent, updateAgent, Agent } from '@/app/lib/agent-utils';
import { toast } from 'sonner';

interface SettingsSection {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  href: string;
}

const settingsSections: SettingsSection[] = [
  {
    id: 'general',
    name: 'General',
    icon: <SettingsIcon className="w-5 h-5" />,
    description: 'Basic agent settings',
    href: 'general'
  },
  {
    id: 'ai',
    name: 'AI Configuration',
    icon: <Zap className="w-5 h-5" />,
    description: 'AI model and behavior',
    href: 'ai'
  }
];

export default function AgentSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = params.workspace as string;
  const agentId = params.agentId as string;
  const { workspaceContext } = useAuth();
  
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('general');
  const [saving, setSaving] = useState(false);

  const [aiConfig, setAiConfig] = useState({
    enabled: true,
    provider: 'openrouter',
    model: 'openai/gpt-5-mini',
    temperature: 0.7,
    maxTokens: 500,
    confidenceThreshold: 0.6,
    maxRetrievalDocs: 5,
    ragEnabled: true,
    fallbackToHuman: true,
    embeddingProvider: 'openai',
    embeddingModel: 'text-embedding-3-large',
    rerankerEnabled: true,
    rerankerModel: 'rerank-2.5',
    systemPrompt: 'support',
    customSystemPrompt: ''
  });

  useEffect(() => {
    loadAgent();
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

        // Load AI config if it exists in agent settings
        const agentData = response.data as Agent & { aiConfig?: Record<string, unknown> };
        if (agentData.aiConfig) {
          const config = agentData.aiConfig;
          setAiConfig({
            enabled: (config.enabled as boolean) ?? true,
            provider: (config.provider as string) ?? 'openrouter',
            model: (config.model as string) ?? 'openai/gpt-5-mini',
            temperature: (config.temperature as number) ?? 0.7,
            maxTokens: (config.maxTokens as number) ?? 500,
            confidenceThreshold: (config.confidenceThreshold as number) ?? 0.6,
            maxRetrievalDocs: (config.maxRetrievalDocs as number) ?? 5,
            ragEnabled: (config.ragEnabled as boolean) ?? true,
            fallbackToHuman: (config.fallbackToHuman as boolean) ?? true,
            embeddingProvider: (config.embeddingProvider as string) ?? 'openai',
            embeddingModel: (config.embeddingModel as string) ?? 'text-embedding-3-large',
            rerankerEnabled: (config.rerankerEnabled as boolean) ?? true,
            rerankerModel: (config.rerankerModel as string) ?? 'rerank-2.5',
            systemPrompt: (config.systemPrompt as string) ?? 'support',
            customSystemPrompt: (config.customSystemPrompt as string) ?? ''
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
        toast.success('Settings saved successfully!');
        // Reload agent to get updated data
        await loadAgent();
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

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="agentName">Agent Name</Label>
            <Input
              id="agentName"
              defaultValue={agent?.name || ''}
              placeholder="Enter agent name"
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              defaultValue={agent?.description || ''}
              rows={3}
              placeholder="Describe what this agent does..."
              className="mt-2"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Agent Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Enable Agent</Label>
              <p className="text-sm text-muted-foreground mt-1">Control whether this agent is active and can respond to queries</p>
            </div>
            <Switch defaultChecked={agent?.status === 'active'} />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAISettings = () => (
    <div className="space-y-6">
      {/* AI Toggle */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="aiEnabled" className="text-base font-semibold">Enable AI Responses</Label>
              <p className="text-sm text-gray-500">Use AI to automatically respond to user messages</p>
            </div>
            <Switch
              id="aiEnabled"
              checked={aiConfig.enabled}
              onCheckedChange={(checked) => handleAiConfigChange('enabled', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {aiConfig.enabled && (
        <>
          {/* AI Model Selection */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base">AI Model Selection</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Choose the AI model for your agent</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="aiModel">Model</Label>
                <Select
                  value={aiConfig.model}
                  onValueChange={(value) => handleAiConfigChange('model', value)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai/gpt-5-mini">
                      GPT-5 Mini (OpenAI)
                    </SelectItem>
                    <SelectItem value="google/gemini-2.5-flash">
                      Gemini 2.5 Flash (Google)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-2">
                  {aiConfig.model === 'openai/gpt-5-mini'
                    ? 'Latest OpenAI model with excellent accuracy and reasoning capabilities'
                    : 'Google\'s fast model with multimodal capabilities and real-time performance'
                  }
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="temperature">Temperature</Label>
                  <Input
                    id="temperature"
                    type="number"
                    min="0"
                    max="2"
                    step="0.1"
                    value={aiConfig.temperature}
                    onChange={(e) => handleAiConfigChange('temperature', parseFloat(e.target.value))}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Controls randomness (0 = focused, 2 = creative)</p>
                </div>
                <div>
                  <Label htmlFor="maxTokens">Max Tokens</Label>
                  <Input
                    id="maxTokens"
                    type="number"
                    min="1"
                    max="4000"
                    value={aiConfig.maxTokens}
                    onChange={(e) => handleAiConfigChange('maxTokens', parseInt(e.target.value))}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Maximum response length</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Embeddings Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Embeddings Configuration</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Configure how your agent processes and searches knowledge</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="embeddingProvider">Embedding Provider</Label>
                <Select
                  value={aiConfig.embeddingProvider}
                  onValueChange={(value) => {
                    handleAiConfigChange('embeddingProvider', value);
                    if (value === 'voyage') {
                      handleAiConfigChange('embeddingModel', 'voyage-3');
                    } else {
                      handleAiConfigChange('embeddingModel', 'text-embedding-3-large');
                    }
                  }}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI (Industry standard)</SelectItem>
                    <SelectItem value="voyage">Voyage AI (Optimized for retrieval)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="embeddingModel">Embedding Model</Label>
                <Select
                  value={aiConfig.embeddingModel}
                  onValueChange={(value) => handleAiConfigChange('embeddingModel', value)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {aiConfig.embeddingProvider === 'voyage' ? (
                      <>
                        <SelectItem value="voyage-3">Voyage-3 (1024d) - Best quality</SelectItem>
                        <SelectItem value="voyage-3-lite">Voyage-3-Lite (512d) - Fast & efficient</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="text-embedding-3-large">Text Embedding 3 Large (3072d)</SelectItem>
                        <SelectItem value="text-embedding-3-small">Text Embedding 3 Small (1536d)</SelectItem>
                        <SelectItem value="text-embedding-ada-002">Ada 002 (1536d) - Legacy</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-2">
                  {aiConfig.embeddingProvider === 'voyage'
                    ? 'Voyage AI models are optimized for search and retrieval tasks'
                    : 'Higher dimensions provide better accuracy but increase costs'
                  }
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Reranker Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Reranker</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Improve search accuracy by reranking results</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="rerankerEnabled" className="text-base">Enable Reranker</Label>
                  <p className="text-sm text-muted-foreground mt-1">Significantly improves search relevance</p>
                </div>
                <Switch
                  id="rerankerEnabled"
                  checked={aiConfig.rerankerEnabled}
                  onCheckedChange={(checked) => handleAiConfigChange('rerankerEnabled', checked)}
                />
              </div>

              {aiConfig.rerankerEnabled && (
                <div className="pt-2 space-y-3">
                  <div>
                    <Label htmlFor="rerankerModel">Reranker Model</Label>
                    <Select
                      value={aiConfig.rerankerModel}
                      onValueChange={(value) => handleAiConfigChange('rerankerModel', value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rerank-2.5">rerank-2.5 (Latest)</SelectItem>
                        <SelectItem value="rerank-2">rerank-2 (Fast & accurate)</SelectItem>
                        <SelectItem value="rerank-lite-1">rerank-lite-1 (Fastest)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-2">
                      Reranker improves search accuracy by scoring and ordering results by relevance
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Features */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Additional Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="ragEnabled" className="text-base">Knowledge Base (RAG)</Label>
                  <p className="text-sm text-muted-foreground mt-1">Use your knowledge base to answer queries</p>
                </div>
                <Switch
                  id="ragEnabled"
                  checked={aiConfig.ragEnabled}
                  onCheckedChange={(checked) => handleAiConfigChange('ragEnabled', checked)}
                />
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <div>
                  <Label htmlFor="fallbackToHuman" className="text-base">Human Fallback</Label>
                  <p className="text-sm text-muted-foreground mt-1">Transfer to human when AI is uncertain</p>
                </div>
                <Switch
                  id="fallbackToHuman"
                  checked={aiConfig.fallbackToHuman}
                  onCheckedChange={(checked) => handleAiConfigChange('fallbackToHuman', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* System Prompt */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">System Prompt</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Define how your agent should behave</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="systemPromptType">Prompt Type</Label>
                <Select
                  value={aiConfig.systemPrompt}
                  onValueChange={(value) => handleAiConfigChange('systemPrompt', value)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="support">Support Agent</SelectItem>
                    <SelectItem value="sales">Sales Agent</SelectItem>
                    <SelectItem value="custom">Custom Prompt</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {aiConfig.systemPrompt === 'custom' && (
                <div>
                  <Label htmlFor="customSystemPrompt">Custom System Prompt</Label>
                  <Textarea
                    id="customSystemPrompt"
                    value={aiConfig.customSystemPrompt}
                    onChange={(e) => handleAiConfigChange('customSystemPrompt', e.target.value)}
                    rows={8}
                    className="mt-2"
                    placeholder="Enter your custom system prompt here..."
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'general': return renderGeneralSettings();
      case 'ai': return renderAISettings();
      default: return renderGeneralSettings();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground font-medium">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
            <p className="text-gray-600">Configure your AI agent settings and preferences</p>
          </div>

          <div className="flex gap-8">
          {/* Settings Navigation */}
          <div className="w-64 flex-shrink-0">
            <Card>
              <CardContent className="p-0">
                <nav className="space-y-1">
                  {settingsSections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                        activeSection === section.id ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' : 'text-gray-700'
                      }`}
                    >
                      {section.icon}
                      <div>
                        <div className="font-medium">{section.name}</div>
                        <div className="text-xs text-gray-500">{section.description}</div>
                      </div>
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Settings Content */}
          <div className="flex-1">
            {renderActiveSection()}
            
            {/* Save Button */}
            <div className="mt-8 flex justify-end">
              <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
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
          </div>
        </div>
      </div>
    </div>
  );
}
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
    description: 'Basic agent settings and configuration',
    href: 'general'
  },
  {
    id: 'ai',
    name: 'AI Configuration',
    icon: <Zap className="w-5 h-5" />,
    description: 'AI model settings and behavior',
    href: 'ai'
  },
  {
    id: 'security',
    name: 'Security',
    icon: <Shield className="w-5 h-5" />,
    description: 'Security settings and access control',
    href: 'security'
  },
  {
    id: 'integrations',
    name: 'Integrations',
    icon: <ExternalLink className="w-5 h-5" />,
    description: 'Third-party integrations and APIs',
    href: 'integrations'
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="agentName">Agent Name</Label>
              <Input id="agentName" defaultValue={agent?.name || ''} />
            </div>
            <div>
              <Label htmlFor="agentSlug">Agent Slug</Label>
              <Input id="agentSlug" defaultValue={agent?.id || ''} />
            </div>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" defaultValue={agent?.description || ''} rows={3} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status & Visibility</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Agent Status</Label>
              <p className="text-sm text-gray-500">Enable or disable the agent</p>
            </div>
            <Switch defaultChecked={agent?.status === 'active'} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Public Access</Label>
              <p className="text-sm text-gray-500">Allow public access to this agent</p>
            </div>
            <Switch />
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
          <Card className="border-2 border-indigo-300 bg-gradient-to-br from-indigo-50 to-purple-50">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">🚀 AI Model Selection</CardTitle>
                  <p className="text-sm text-gray-700 mt-1">Powered by OpenRouter</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="aiModel" className="text-sm font-semibold">Select Model</Label>
                <Select
                  value={aiConfig.model}
                  onValueChange={(value) => handleAiConfigChange('model', value)}
                >
                  <SelectTrigger className="h-10 mt-2 bg-white border-2 border-indigo-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai/gpt-5-mini">
                      🤖 GPT-5 Mini (OpenAI - Latest)
                    </SelectItem>
                    <SelectItem value="google/gemini-2.5-flash">
                      ⚡ Gemini 2.5 Flash (Google - Fast)
                    </SelectItem>
                  </SelectContent>
                </Select>

                <div className="mt-3 p-3 bg-white rounded-lg border border-indigo-200">
                  {aiConfig.model === 'openai/gpt-5-mini' ? (
                    <>
                      <p className="text-xs text-indigo-900 font-medium mb-1.5">✨ GPT-5 Mini Benefits:</p>
                      <ul className="text-xs text-indigo-800 space-y-1 ml-4 list-disc">
                        <li>Latest technology from OpenAI</li>
                        <li>Better accuracy & understanding</li>
                        <li>Excellent for complex reasoning</li>
                        <li>Best-in-class performance</li>
                      </ul>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-green-900 font-medium mb-1.5">⚡ Gemini 2.5 Flash Benefits:</p>
                      <ul className="text-xs text-green-800 space-y-1 ml-4 list-disc">
                        <li>Google&apos;s latest model</li>
                        <li>Ultra-fast response times</li>
                        <li>Multimodal capabilities (text + images)</li>
                        <li>Great for real-time chat</li>
                      </ul>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="temperature" className="text-sm font-semibold">Temperature</Label>
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
                  <p className="text-xs text-gray-600 mt-1">Higher = more creative (0-2)</p>
                </div>
                <div>
                  <Label htmlFor="maxTokens" className="text-sm font-semibold">Max Tokens</Label>
                  <Input
                    id="maxTokens"
                    type="number"
                    min="1"
                    max="4000"
                    value={aiConfig.maxTokens}
                    onChange={(e) => handleAiConfigChange('maxTokens', parseInt(e.target.value))}
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-600 mt-1">Max response length</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Embeddings Configuration */}
          <Card className="border border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-base">🔍 Embeddings Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="embeddingProvider" className="text-sm font-semibold">Embedding Provider</Label>
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
                  <SelectTrigger className="h-10 mt-2 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">🤖 OpenAI - Industry standard</SelectItem>
                    <SelectItem value="voyage">🚢 Voyage AI - Optimized for retrieval</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="embeddingModel" className="text-sm font-semibold">Select Model</Label>
                <Select
                  value={aiConfig.embeddingModel}
                  onValueChange={(value) => handleAiConfigChange('embeddingModel', value)}
                >
                  <SelectTrigger className="h-10 mt-2 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {aiConfig.embeddingProvider === 'voyage' ? (
                      <>
                        <SelectItem value="voyage-3">🚢 Voyage-3 (1024d) - Best for retrieval</SelectItem>
                        <SelectItem value="voyage-3-lite">💨 Voyage-3-Lite (512d) - Faster & cheaper</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="text-embedding-3-large">⚡ Text Embedding 3 Large (3072d) - Best quality</SelectItem>
                        <SelectItem value="text-embedding-3-small">💨 Text Embedding 3 Small (1536d) - Faster & cheaper</SelectItem>
                        <SelectItem value="text-embedding-ada-002">📦 Ada 002 (1536d) - Legacy model</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-600 mt-2">
                  {aiConfig.embeddingProvider === 'voyage'
                    ? 'Voyage AI is optimized for search and retrieval tasks'
                    : 'Higher dimensions = better accuracy but higher cost'
                  }
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  <strong>💡 Tip:</strong> {aiConfig.embeddingProvider === 'voyage'
                    ? 'Voyage-3 is specifically trained for retrieval tasks and may provide better semantic matching.'
                    : 'Use text-embedding-3-large for best quality or text-embedding-3-small for cost savings.'
                  }
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Reranker Configuration */}
          <Card className="border border-cyan-200 bg-gradient-to-br from-cyan-50 to-blue-50">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="rerankerEnabled" className="text-base font-semibold flex items-center gap-2">
                    🎯 Reranker (Recommended)
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">Boost accuracy from 65% to 95%+ with intelligent reranking</p>
                </div>
                <Switch
                  id="rerankerEnabled"
                  checked={aiConfig.rerankerEnabled}
                  onCheckedChange={(checked) => handleAiConfigChange('rerankerEnabled', checked)}
                />
              </div>

              {aiConfig.rerankerEnabled && (
                <div className="space-y-3 pt-3 border-t border-cyan-200">
                  <div className="bg-white rounded-lg p-3 border border-cyan-200">
                    <Label htmlFor="rerankerModel" className="text-sm font-semibold">Reranker Model</Label>
                    <select
                      id="rerankerModel"
                      value={aiConfig.rerankerModel}
                      onChange={(e) => handleAiConfigChange('rerankerModel', e.target.value)}
                      className="w-full h-9 px-3 text-sm bg-white border-2 border-gray-200 rounded-lg focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 mt-2"
                    >
                      <option value="rerank-2.5">🚢 rerank-2.5 (Latest, Best Quality)</option>
                      <option value="rerank-2">🚢 rerank-2 (Fast & Accurate)</option>
                      <option value="rerank-lite-1">💨 rerank-lite-1 (Fastest)</option>
                    </select>
                  </div>

                  <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-3">
                    <p className="text-xs text-cyan-900 font-semibold mb-2">🎯 How Reranking Works:</p>
                    <ul className="text-xs text-cyan-800 space-y-1.5 ml-4 list-disc">
                      <li><strong>Step 1:</strong> Vector search finds 15 candidates</li>
                      <li><strong>Step 2:</strong> Reranker scores each by relevance</li>
                      <li><strong>Step 3:</strong> Returns top 5 most relevant</li>
                      <li><strong>Result:</strong> Much better context for AI!</li>
                    </ul>
                    <p className="text-xs text-cyan-700 mt-3 font-semibold">
                      ⚡ Cost: ~$0.03 per 1000 queries | Worth it for 30% better accuracy!
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* RAG/Knowledge Base */}
            <Card className="border border-purple-200 bg-purple-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="ragEnabled" className="text-base font-semibold">Knowledge Base (RAG)</Label>
                  <Switch
                    id="ragEnabled"
                    checked={aiConfig.ragEnabled}
                    onCheckedChange={(checked) => handleAiConfigChange('ragEnabled', checked)}
                  />
                </div>
                <p className="text-xs text-gray-600">Use your knowledge base for AI responses</p>
              </CardContent>
            </Card>

            {/* Fallback to Human */}
            <Card className="border border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="fallbackToHuman" className="text-base font-semibold">Human Fallback</Label>
                  <Switch
                    id="fallbackToHuman"
                    checked={aiConfig.fallbackToHuman}
                    onCheckedChange={(checked) => handleAiConfigChange('fallbackToHuman', checked)}
                  />
                </div>
                <p className="text-xs text-gray-600">Transfer to human when AI is uncertain</p>
              </CardContent>
            </Card>
          </div>

          {/* System Prompt */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">System Prompt Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="systemPromptType" className="text-sm font-semibold">Prompt Type</Label>
                <Select
                  value={aiConfig.systemPrompt}
                  onValueChange={(value) => handleAiConfigChange('systemPrompt', value)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="support">💬 Support Agent</SelectItem>
                    <SelectItem value="sales">💰 Sales Agent</SelectItem>
                    <SelectItem value="custom">✏️ Custom Prompt</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {aiConfig.systemPrompt === 'custom' && (
                <div>
                  <Label htmlFor="customSystemPrompt" className="text-sm font-semibold">Custom System Prompt</Label>
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

          {/* Info Banner */}
          <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-200">
            <p className="text-sm text-indigo-900 font-medium mb-2">🎯 Pro Tip</p>
            <p className="text-sm text-indigo-700">
              Enable RAG to use your knowledge base for more accurate AI responses. Choose the right embedding model based on your quality vs. cost needs. Human fallback ensures customers always get help when AI can&apos;t assist.
            </p>
          </div>
        </>
      )}
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Access Control</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Require Authentication</Label>
              <p className="text-sm text-gray-500">Users must be authenticated to interact</p>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Rate Limiting</Label>
              <p className="text-sm text-gray-500">Limit requests per user per minute</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div>
            <Label htmlFor="rateLimit">Rate Limit (requests/minute)</Label>
            <Input id="rateLimit" type="number" defaultValue="60" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>API Key</Label>
              <p className="text-sm text-gray-500">Your agent&apos;s API key</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
              <Button variant="outline" size="sm">
                <Key className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <code className="text-sm font-mono">ak-1234567890abcdef...</code>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderDomainsSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Custom Domains</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="customDomain">Custom Domain</Label>
            <div className="flex gap-2">
              <Input id="customDomain" placeholder="chat.yourdomain.com" />
              <Button>Add Domain</Button>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">chat.example.com</p>
                <p className="text-sm text-gray-500">Active</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderIntegrationsSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Available Integrations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: 'Slack', description: 'Send messages to Slack channels', icon: '💬' },
              { name: 'Discord', description: 'Integrate with Discord servers', icon: '🎮' },
              { name: 'WhatsApp', description: 'Connect to WhatsApp Business', icon: '📱' },
              { name: 'Zapier', description: 'Automate workflows with Zapier', icon: '⚡' },
              { name: 'Webhook', description: 'Send data to custom webhooks', icon: '🔗' },
              { name: 'Email', description: 'Send email notifications', icon: '📧' }
            ].map((integration) => (
              <div key={integration.name} className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{integration.icon}</span>
                  <div>
                    <h3 className="font-medium">{integration.name}</h3>
                    <p className="text-sm text-gray-500">{integration.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'general': return renderGeneralSettings();
      case 'ai': return renderAISettings();
      case 'security': return renderSecuritySettings();
      case 'integrations': return renderIntegrationsSettings();
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
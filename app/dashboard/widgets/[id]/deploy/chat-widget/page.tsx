"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, MessageCircle, Send, Plus, X, Info, RefreshCw, Smile } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/app/lib/workspace-auth-context";
import { getBusinessWidgets, type ChatWidget } from "@/app/lib/chat-utils";

type ExtendedWidget = ChatWidget & {
  quickReplies?: string[];
  suggestedMessages?: string[];
  suggestedReplies?: string[];
  collectFeedback?: boolean;
  keepSuggestions?: boolean;
  aiConfig?: {
    enabled?: boolean;
    provider?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    confidenceThreshold?: number;
    maxRetrievalDocs?: number;
    ragEnabled?: boolean;
    fallbackToHuman?: boolean;
    embeddingProvider?: string;
    embeddingModel?: string;
    rerankerEnabled?: boolean;
    rerankerModel?: string;
    systemPrompt?: string;
    customSystemPrompt?: string;
  };
};

export default function ChatWidgetPage() {
  const params = useParams();
  const widgetId = params.id as string;
  const { workspaceContext } = useAuth();
  
  const [widget, setWidget] = useState<ExtendedWidget | null>(null);
  const [loading, setLoading] = useState(true);
  const [widgetEnabled, setWidgetEnabled] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [initialMessage, setInitialMessage] = useState("");
  const [suggestedMessages, setSuggestedMessages] = useState<string[]>([]);
  const [keepSuggestions, setKeepSuggestions] = useState(false);
  const [messagePlaceholder, setMessagePlaceholder] = useState("");
  const [collectFeedback, setCollectFeedback] = useState(false);
  const [chatInput, setChatInput] = useState("");

  useEffect(() => {
    loadWidget();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widgetId, workspaceContext]);

  // Update form fields when widget data changes
  useEffect(() => {
    if (widget) {
      setDisplayName(widget.name || '');
      setInitialMessage(widget.welcomeMessage || 'Hi! What can I help you with?');
      setMessagePlaceholder(widget.placeholderText || 'Message...');
      setWidgetEnabled(true);
      
      // Set suggested messages
      const quickReplies = widget.quickReplies || 
                          widget.suggestedMessages || 
                          widget.suggestedReplies || 
                          ['Get Support', 'Pricing', 'Contact Sales'];
      setSuggestedMessages(quickReplies);
      
      // Set other settings
      setCollectFeedback(widget.collectFeedback !== false);
      setKeepSuggestions(widget.keepSuggestions || false);
    }
  }, [widget]);

  const loadWidget = async () => {
    if (!workspaceContext?.currentWorkspace?.id) return;

    try {
      setLoading(true);
      const result = await getBusinessWidgets(workspaceContext?.currentWorkspace?.id);
      
      if (result.success) {
        const foundWidget = result.data.find((w: ChatWidget) => w.id === widgetId);
        if (foundWidget) {
          setWidget(foundWidget as ExtendedWidget);
          console.log('Found widget:', foundWidget);
        } else {
          // Widget not found, redirect back
          window.location.href = `/dashboard/widgets/${widgetId}/deploy`;
        }
      }
    } catch (error) {
      console.error('Error loading widget:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSuggestion = () => {
    setSuggestedMessages([...suggestedMessages, ""]);
  };

  const handleRemoveSuggestion = (index: number) => {
    setSuggestedMessages(suggestedMessages.filter((_, i) => i !== index));
  };

  const handleUpdateSuggestion = (index: number, value: string) => {
    const updated = [...suggestedMessages];
    updated[index] = value;
    setSuggestedMessages(updated);
  };

  if (loading) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading widget...</p>
        </div>
      </div>
    );
  }

  if (!widget) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Widget not found</p>
          <Link href={`/dashboard/widgets/${widgetId}/deploy`}>
            <Button>Back to Deploy</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Debug current state
  console.log('Current form state:', {
    displayName,
    initialMessage,
    messagePlaceholder,
    suggestedMessages,
    keepSuggestions,
    collectFeedback
  });

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* Scrollable Content Area */}
      <div className="flex-1 grid grid-cols-[500px_1fr] overflow-hidden">
        {/* Left Panel - Configuration */}
        <div className="border-r border-gray-200 overflow-y-auto">
          <div className="p-6 space-y-6 pb-12">
            {/* Back Navigation */}
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 -ml-2" asChild>
              <Link href={`/dashboard/widgets/${widgetId}/deploy`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Deploy
              </Link>
            </Button>

            {/* Widget Title and Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Chat widget</h1>
                <p className="text-sm text-gray-600 mt-1">{widget?.name || 'Loading...'}</p>
              </div>
              <Switch
                checked={widgetEnabled}
                onCheckedChange={setWidgetEnabled}
                className="data-[state=checked]:bg-green-500"
              />
            </div>

            {/* Tabs */}
            <Tabs defaultValue="content" className="w-full">
              <TabsList className="bg-transparent border-b border-gray-200 w-full justify-start rounded-none p-0 h-auto">
                <TabsTrigger 
                  value="content" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:bg-transparent px-0 mr-6"
                >
                  Content
                </TabsTrigger>
                <TabsTrigger 
                  value="style" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:bg-transparent px-0 mr-6"
                >
                  Style
                </TabsTrigger>
                <TabsTrigger 
                  value="ai" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:bg-transparent px-0 mr-6"
                >
                  AI
                </TabsTrigger>
                <TabsTrigger 
                  value="embed" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:bg-transparent px-0 mr-6"
                >
                  Embed
                </TabsTrigger>
                <TabsTrigger 
                  value="support" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:bg-transparent px-0"
                >
                  Support
                </TabsTrigger>
              </TabsList>

              {/* Content Tab */}
              <TabsContent value="content" className="mt-6 space-y-6">
                {/* Display Name */}
                <div>
                  <Label className="text-sm font-medium text-gray-900 mb-2 block">
                    Display name
                  </Label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full"
                    placeholder="Widget name will appear here..."
                  />
                  {displayName && (
                    <p className="text-xs text-green-600 mt-1">✓ Loaded: {displayName}</p>
                  )}
                </div>

                {/* Initial Messages */}
                <div>
                  <Label className="text-sm font-medium text-gray-900 mb-2 block">
                    Initial messages
                  </Label>
                  <Textarea
                    value={initialMessage}
                    onChange={(e) => setInitialMessage(e.target.value)}
                    className="min-h-[100px] resize-none"
                    placeholder="Welcome message will appear here..."
                  />
                  {initialMessage && (
                    <p className="text-xs text-green-600 mt-1">✓ Loaded: {initialMessage.substring(0, 50)}...</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    <Info className="w-3.5 h-3.5" />
                    <span>Enter each message in a new line.</span>
                    <Button variant="ghost" size="sm" className="ml-auto text-xs h-auto p-0 hover:bg-transparent">
                      Reset
                    </Button>
                  </div>
                </div>

                {/* Suggested Messages */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label className="text-sm font-medium text-gray-900">
                      Suggested messages
                    </Label>
                    <Info className="w-3.5 h-3.5 text-gray-400" />
                    {suggestedMessages.length > 0 && (
                      <span className="text-xs text-green-600">✓ {suggestedMessages.length} loaded</span>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm text-gray-700 mb-1">
                          Keep showing the suggested messages after the user&apos;s first message
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Info className="w-3.5 h-3.5 text-gray-400" />
                        <Switch
                          checked={keepSuggestions}
                          onCheckedChange={setKeepSuggestions}
                          className="data-[state=checked]:bg-green-500"
                        />
                      </div>
                    </div>

                    {suggestedMessages.map((msg, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={msg}
                          onChange={(e) => handleUpdateSuggestion(index, e.target.value)}
                          placeholder="Enter suggestion..."
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveSuggestion(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddSuggestion}
                      className="w-full border-dashed"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add suggested message
                    </Button>
                  </div>
                </div>

                {/* Message Placeholder */}
                <div>
                  <Label className="text-sm font-medium text-gray-900 mb-2 block">
                    Message placeholder
                  </Label>
                  <Input
                    value={messagePlaceholder}
                    onChange={(e) => setMessagePlaceholder(e.target.value)}
                    className="w-full"
                    placeholder="Placeholder text will appear here..."
                  />
                  {messagePlaceholder && (
                    <p className="text-xs text-green-600 mt-1">✓ Loaded: {messagePlaceholder}</p>
                  )}
                </div>

                {/* Collect User Feedback */}
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium text-gray-900">
                      Collect user feedback
                    </Label>
                    <Info className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                  <Switch
                    checked={collectFeedback}
                    onCheckedChange={setCollectFeedback}
                    className="data-[state=checked]:bg-green-500"
                  />
                </div>
              </TabsContent>

              {/* Style Tab */}
              <TabsContent value="style" className="mt-6 space-y-6">
                {/* Colors */}
                <div>
                  <Label className="text-sm font-medium text-gray-900 mb-3 block">🎨 Colors</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-medium text-gray-700 mb-1.5 block">Primary Color</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={widget?.primaryColor || '#3B82F6'}
                          disabled
                          className="w-10 h-10 rounded-lg border-2 border-gray-300 cursor-not-allowed bg-white"
                        />
                        <Input
                          value={widget?.primaryColor || '#3B82F6'}
                          disabled
                          className="flex-1 h-9 text-xs bg-gray-50"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-700 mb-1.5 block">Text Color</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={widget?.secondaryColor || '#FFFFFF'}
                          disabled
                          className="w-10 h-10 rounded-lg border-2 border-gray-300 cursor-not-allowed bg-white"
                        />
                        <Input
                          value={widget?.secondaryColor || '#FFFFFF'}
                          disabled
                          className="flex-1 h-9 text-xs bg-gray-50"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Widget Dimensions */}
                <div>
                  <Label className="text-sm font-medium text-gray-900 mb-3 block">📏 Widget Dimensions</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-medium text-gray-700 mb-1.5 block">Widget Size</Label>
                      <Input
                        value={widget?.widgetSize === 'compact' ? '📱 Compact (360x480)' : 
                               widget?.widgetSize === 'standard' ? '💻 Standard (400x550)' : 
                               widget?.widgetSize === 'large' ? '🖥️ Large (450x650)' : '💻 Standard (400x550)'}
                        disabled
                        className="h-9 text-sm bg-gray-50"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-700 mb-1.5 block">Border Radius</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value="16"
                          disabled
                          className="h-9 text-sm bg-gray-50"
                        />
                        <span className="text-xs text-gray-500 font-medium">px</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Button Style & Effects */}
                <div>
                  <Label className="text-sm font-medium text-gray-900 mb-3 block">✨ Button Style & Effects</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-medium text-gray-700 mb-1.5 block">Button Size</Label>
                      <Input
                        value={widget?.buttonSize === 'small' ? 'Small (48px)' :
                               widget?.buttonSize === 'medium' ? 'Medium (56px)' :
                               widget?.buttonSize === 'large' ? 'Large (64px)' :
                               widget?.buttonSize === 'xl' ? 'XL (72px)' : 'Medium (56px)'}
                        disabled
                        className="h-9 text-sm bg-gray-50"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-700 mb-1.5 block">Button Style</Label>
                      <Input
                        value={widget?.buttonStyle === 'circular' ? '⭕ Circular' :
                               widget?.buttonStyle === 'rounded' ? '◻️ Rounded' :
                               widget?.buttonStyle === 'square' ? '⬜ Square' :
                               widget?.buttonStyle === 'pill' ? '💊 Pill' :
                               widget?.buttonStyle === 'modern' ? '✨ Modern' :
                               widget?.buttonStyle === 'gradient' ? '🌈 Gradient' : '◻️ Rounded'}
                        disabled
                        className="h-9 text-sm bg-gray-50"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-700 mb-1.5 block">Shadow</Label>
                      <Input
                        value="Medium"
                        disabled
                        className="h-9 text-sm bg-gray-50"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-700 mb-1.5 block">Hover Effect</Label>
                      <Input
                        value="↔️ Scale"
                        disabled
                        className="h-9 text-sm bg-gray-50"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label className="text-xs font-medium text-gray-700 mb-1.5 block">Idle Animation</Label>
                      <Input
                        value={widget?.buttonAnimation === 'none' ? '⭕ None' :
                               widget?.buttonAnimation === 'pulse' ? '💓 Pulse' :
                               widget?.buttonAnimation === 'bounce' ? '⚡ Bounce' :
                               widget?.buttonAnimation === 'shake' ? '📳 Shake' :
                               widget?.buttonAnimation === 'glow' ? '✨ Glow' : '💓 Pulse'}
                        disabled
                        className="h-9 text-sm bg-gray-50"
                      />
                      <p className="text-xs text-gray-600 mt-1.5">Animation when button is idle</p>
                    </div>
                  </div>
                </div>

                {/* Mobile UI Settings */}
                <div>
                  <Label className="text-sm font-medium text-gray-900 mb-3 block">📱 Mobile UI Settings</Label>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs font-medium text-gray-700 mb-2 block">Mobile Layout</Label>
                      <Input
                        value="📲 Expanded"
                        disabled
                        className="h-10 text-sm bg-gray-50"
                      />
                      <p className="text-xs text-gray-600 mt-2">
                        Choose how your widget appears on mobile devices
                      </p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs text-blue-800 font-medium mb-1">📱 Mobile Layout Preview:</p>
                      <div className="text-xs text-blue-700 space-y-1">
                        <p>• <strong>Expanded:</strong> Larger mobile widget with better content visibility</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Badge & Notifications */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <Label className="text-sm font-semibold text-gray-900">🔔 Notification Badge</Label>
                      <p className="text-xs text-gray-600 mt-0.5">Display unread count on button</p>
                    </div>
                    <Switch
                      checked={false}
                      disabled
                      className="data-[state=checked]:bg-green-500"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <div>
                      <Label className="text-xs font-semibold">🟢 Online Status</Label>
                      <p className="text-xs text-gray-600 mt-0.5">Show online/offline dot</p>
                    </div>
                    <Switch
                      checked={true}
                      disabled
                      className="data-[state=checked]:bg-green-500"
                    />
                  </div>
                </div>

                {/* Tooltip Settings */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <Label className="text-sm font-semibold text-gray-900">💬 Button Tooltip</Label>
                      <p className="text-xs text-gray-600 mt-0.5">Show text on hover</p>
                    </div>
                    <Switch
                      checked={true}
                      disabled
                      className="data-[state=checked]:bg-green-500"
                    />
                  </div>
                  <div className="pt-3 border-t border-gray-200 bg-gray-50 rounded-lg p-3">
                    <Label className="text-xs font-medium text-gray-700 mb-1.5 block">Tooltip Text</Label>
                    <Input
                      value={widget?.buttonText || 'Chat with us'}
                      disabled
                      className="h-9 text-sm bg-white"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* AI Tab */}
              <TabsContent value="ai" className="mt-6 space-y-6">
                {/* AI Configuration */}
                <div>
                  <Label className="text-sm font-medium text-gray-900 mb-3 block">AI Configuration</Label>
                  <p className="text-xs text-gray-600 mb-4">Configure AI assistant settings and behavior</p>
                  
                  {/* Main Enable Toggle */}
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-gray-200 mb-4">
                    <div>
                      <Label className="text-sm font-semibold text-gray-900">Automatically respond to customer messages</Label>
                    </div>
                    <Switch
                      checked={widget?.aiConfig?.enabled || false}
                      disabled
                      className="data-[state=checked]:bg-green-500"
                    />
                  </div>

                  {widget?.aiConfig?.enabled && (
                    <div className="space-y-4">
                      {/* AI Model Selection */}
                      <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border-2 border-indigo-300">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                            <span className="text-white text-lg">🤖</span>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-bold text-gray-900 mb-1">🚀 AI Model Selection</h4>
                            <p className="text-xs text-gray-700">Powered by OpenRouter</p>
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-xs font-semibold text-gray-700 mb-2 block">Select Model</Label>
                          <Input
                            value={widget?.aiConfig?.model === 'openai/gpt-5-mini' ? '🤖 GPT-5 Mini (OpenAI - Latest)' :
                                   widget?.aiConfig?.model === 'google/gemini-2.5-flash' ? '⚡ Gemini 2.5 Flash (Google - Fast)' :
                                   widget?.aiConfig?.model || '🤖 GPT-5 Mini (OpenAI - Latest)'}
                            disabled
                            className="h-10 text-sm bg-white border-2 border-indigo-300"
                          />
                          
                          <div className="mt-3 p-3 bg-white rounded-lg border border-indigo-200">
                            {widget?.aiConfig?.model === 'openai/gpt-5-mini' ? (
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
                      </div>

                      {/* Embeddings Configuration */}
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">🔍 Embeddings Configuration</h4>
                        <div className="space-y-3">
                          <div>
                            <Label className="text-xs font-medium text-gray-700 mb-2 block">Embedding Provider</Label>
                            <Input
                              value={widget?.aiConfig?.embeddingProvider === 'voyage' ? '🚢 Voyage AI - Optimized for retrieval' :
                                     widget?.aiConfig?.embeddingProvider === 'openai' ? '🤖 OpenAI - Industry standard' :
                                     '🤖 OpenAI - Industry standard'}
                              disabled
                              className="h-10 text-sm bg-white"
                            />
                          </div>

                          <div>
                            <Label className="text-xs font-medium text-gray-700 mb-2 block">Select Model</Label>
                            <Input
                              value={widget?.aiConfig?.embeddingModel === 'voyage-3' ? '🚢 Voyage-3 (1024d) - Best for retrieval' :
                                     widget?.aiConfig?.embeddingModel === 'voyage-3-lite' ? '💨 Voyage-3-Lite (512d) - Faster & cheaper' :
                                     widget?.aiConfig?.embeddingModel === 'text-embedding-3-large' ? '⚡ Text Embedding 3 Large (3072d) - Best quality' :
                                     widget?.aiConfig?.embeddingModel === 'text-embedding-3-small' ? '💨 Text Embedding 3 Small (1536d) - Faster & cheaper' :
                                     '⚡ Text Embedding 3 Large (3072d) - Best quality'}
                              disabled
                              className="h-10 text-sm bg-white"
                            />
                            <p className="text-xs text-gray-500 mt-2">
                              {widget?.aiConfig?.embeddingProvider === 'voyage' 
                                ? 'Voyage AI is optimized for search and retrieval tasks'
                                : 'Higher dimensions = better accuracy but higher cost'
                              }
                            </p>
                          </div>
                          
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-xs text-blue-800">
                              <strong>💡 Tip:</strong> {widget?.aiConfig?.embeddingProvider === 'voyage' 
                                ? 'Voyage-3 is specifically trained for retrieval tasks and may provide better semantic matching.'
                                : 'Use text-embedding-3-large for best quality or text-embedding-3-small for cost savings.'
                              }
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Reranker Configuration */}
                      <div className="p-4 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg border border-cyan-200">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <Label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                              🎯 Reranker (Recommended)
                            </Label>
                            <p className="text-xs text-gray-600 mt-1">Boost accuracy from 65% to 95%+ with intelligent reranking</p>
                          </div>
                          <Switch
                            checked={widget?.aiConfig?.rerankerEnabled || false}
                            disabled
                            className="data-[state=checked]:bg-green-500"
                          />
                        </div>
                        
                        {widget?.aiConfig?.rerankerEnabled && (
                          <div className="space-y-3 pt-3 border-t border-cyan-200">
                            <div className="bg-white rounded-lg p-3 border border-cyan-200">
                              <Label className="text-xs font-medium text-gray-700 mb-2 block">Reranker Model</Label>
                              <Input
                                value={widget?.aiConfig?.rerankerModel === 'rerank-2.5' ? '🚢 rerank-2.5 (Latest, Best Quality)' :
                                       widget?.aiConfig?.rerankerModel === 'rerank-2' ? '🚢 rerank-2 (Fast & Accurate)' :
                                       widget?.aiConfig?.rerankerModel === 'rerank-lite-1' ? '💨 rerank-lite-1 (Fastest)' :
                                       '🚢 rerank-2.5 (Latest, Best Quality)'}
                                disabled
                                className="w-full h-9 px-3 text-sm bg-white border-2 border-gray-200 rounded-lg"
                              />
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
                      </div>

                      {/* AI Features Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* RAG/Knowledge Base */}
                        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-sm font-semibold">Knowledge Base (RAG)</Label>
                            <Switch
                              checked={widget?.aiConfig?.ragEnabled || false}
                              disabled
                              className="data-[state=checked]:bg-green-500"
                            />
                          </div>
                          <p className="text-xs text-gray-600">Use your knowledge base for AI responses</p>
                        </div>

                        {/* Fallback to Human */}
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-sm font-semibold">Human Fallback</Label>
                            <Switch
                              checked={widget?.aiConfig?.fallbackToHuman || false}
                              disabled
                              className="data-[state=checked]:bg-green-500"
                            />
                          </div>
                          <p className="text-xs text-gray-600">Transfer to human when AI is uncertain</p>
                        </div>
                      </div>

                      {/* Info Banner */}
                      <div className="p-3 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-200">
                        <p className="text-xs text-indigo-900 font-medium mb-1">🎯 Pro Tip</p>
                        <p className="text-xs text-indigo-700">
                          Enable RAG to use your knowledge base for more accurate AI responses. Choose the right embedding model based on your quality vs. cost needs. Human fallback ensures customers always get help when AI can&apos;t assist.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Embed Tab */}
              <TabsContent value="embed" className="mt-6">
                <p className="text-sm text-gray-500">Embed code coming soon...</p>
              </TabsContent>

              {/* Support Tab */}
              <TabsContent value="support" className="mt-6 space-y-6">
                <div>
                  <Label className="text-sm font-medium text-gray-900 mb-3 block">Support Configuration</Label>
                  <p className="text-xs text-gray-600 mb-4">Configure customer handover and support settings</p>
                  
                  {/* Customer Handover Settings */}
                  <div className="space-y-4">
                    {/* Handover Enable */}
                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-gray-200">
                      <div>
                        <Label className="text-sm font-semibold text-gray-900">Enable Handover</Label>
                        <p className="text-xs text-gray-500 mt-0.5">Allow customers to request human help</p>
                      </div>
                      <Switch
                        checked={true}
                        disabled
                        className="data-[state=checked]:bg-green-500"
                      />
                    </div>

                    {/* Handover Methods */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="flex items-center justify-between mb-3">
                          <Label className="text-sm font-semibold">Handover Button</Label>
                          <Switch
                            checked={true}
                            disabled
                            className="data-[state=checked]:bg-green-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Input
                            value="Talk to Human Agent"
                            disabled
                            className="h-8 text-xs bg-white"
                          />
                          <Input
                            value="Bottom"
                            disabled
                            className="h-8 text-xs bg-white"
                          />
                        </div>
                      </div>

                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-semibold">Quick Reply</Label>
                          <Switch
                            checked={true}
                            disabled
                            className="data-[state=checked]:bg-green-500"
                          />
                        </div>
                        <p className="text-xs text-gray-600 mt-2">Add to quick replies</p>
                      </div>
                    </div>

                    {/* Smart AI Fallback */}
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <Label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            🤖 Smart AI Fallback
                          </Label>
                          <p className="text-xs text-gray-600 mt-1">Auto-detect when AI doesn&apos;t have relevant information and offer human handover</p>
                        </div>
                        <Switch
                          checked={true}
                          disabled
                          className="data-[state=checked]:bg-green-500"
                        />
                      </div>
                      <div className="mt-3 p-3 bg-white rounded-lg border border-blue-200">
                        <p className="text-xs text-blue-800 font-medium mb-1">✨ How it works:</p>
                        <ul className="text-xs text-blue-700 space-y-1 ml-4 list-disc">
                          <li>AI detects when it doesn&apos;t have relevant information</li>
                          <li>Responds: &quot;I&apos;m not sure about that from my knowledge base.&quot;</li>
                          <li>Offers: &quot;Would you like me to connect you with a human agent?&quot;</li>
                          <li>Works automatically - no keywords needed</li>
                        </ul>
                      </div>
                    </div>

                    {/* Handover Message */}
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <Label className="text-sm font-semibold mb-2 block">Handover Message</Label>
                      <Textarea
                        value="I'll connect you with a human agent right away. Please wait a moment."
                        disabled
                        rows={2}
                        className="text-xs resize-none bg-white"
                      />
                    </div>

                    {/* Additional Settings */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                        <div>
                          <Label className="text-xs font-medium">Notify Agents</Label>
                        </div>
                        <Switch
                          checked={true}
                          disabled
                          className="data-[state=checked]:bg-green-500"
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                        <div>
                          <Label className="text-xs font-medium">Allow Re-switch</Label>
                        </div>
                        <Switch
                          checked={true}
                          disabled
                          className="data-[state=checked]:bg-green-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Right Panel - Chat Preview */}
        <div className="bg-gray-50 flex items-center justify-center p-8 overflow-hidden">
          <div className="w-full max-w-md h-full flex flex-col justify-center relative">
            {/* Chat Widget Preview */}
            <Card className="bg-white shadow-xl rounded-2xl overflow-hidden border-0 h-[600px] flex flex-col">
              {/* Chat Header */}
              <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-sm text-gray-500">
                    Agent {new Date().toLocaleDateString()}, {new Date().toLocaleTimeString()}
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <RefreshCw className="w-4 h-4 text-gray-500" />
                </Button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-6 space-y-4 bg-white overflow-y-auto">
                {/* Agent Message */}
                <div className="flex items-start gap-3">
                  <div className="text-xs text-gray-500 whitespace-nowrap mt-1">
                    Agent {new Date().toLocaleDateString()}, {new Date().toLocaleTimeString()}
                  </div>
                </div>
                <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 inline-block max-w-[80%]">
                  <p className="text-sm text-gray-900">{initialMessage}</p>
                </div>

                {/* User Message Example */}
                <div className="flex justify-end">
                  <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 inline-block max-w-[80%]">
                    <p className="text-sm">Hello</p>
                  </div>
                </div>
              </div>

              {/* Chat Footer */}
              <div className="border-t border-gray-200 bg-white p-4 flex-shrink-0">
                <div className="text-xs text-center text-gray-500 mb-3 flex items-center justify-center gap-1">
                  <MessageCircle className="w-3 h-3" />
                  Powered by Chatbase
                </div>
                <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-full px-4 py-2.5">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={messagePlaceholder}
                    className="flex-1 border-0 bg-transparent p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Smile className="w-4 h-4 text-gray-400" />
                  </Button>
                  <Button size="sm" className="h-8 w-8 p-0 rounded-full bg-gray-900 hover:bg-gray-800">
                    <Send className="w-4 h-4 text-white" />
                  </Button>
                </div>
              </div>
            </Card>

            {/* Chat Bubble (Minimized State) */}
            <div className="fixed bottom-8 right-8">
              <button className="w-14 h-14 bg-gray-900 rounded-full shadow-2xl flex items-center justify-center hover:bg-gray-800 transition-colors">
                <MessageCircle className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../lib/workspace-auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Save, 
  Play, 
  Settings, 
  Bot,
  MessageCircle,
  Copy,
  Download,
  Terminal,
  Code,
  FileText,
  ChevronDown,
  ChevronUp,
  Send,
  User,
  Bot as BotIcon,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { getBusinessWidgets, updateChatWidget, type ChatWidget } from '@/app/lib/chat-utils';
import { toast } from 'sonner';

export default function PlaygroundPage() {
  const params = useParams();
  const router = useRouter();
  const { workspaceContext } = useAuth();
  const widgetId = params.id as string;

  const [widget, setWidget] = useState<ChatWidget | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{id: string, type: 'user' | 'bot', content: string, timestamp: Date}>>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [showInstallation, setShowInstallation] = useState(false);
  const [installationMethod, setInstallationMethod] = useState<'cli' | 'manual'>('cli');

  const [formData, setFormData] = useState({
    systemPrompt: 'You are a helpful AI assistant.',
    temperature: 0.7,
    model: 'gpt-4o',
    maxTokens: 500,
    // Add more configuration fields as needed
  });

  useEffect(() => {
    loadWidget();
  }, [widgetId, workspaceContext]);

  const loadWidget = async () => {
    if (!workspaceContext?.currentWorkspace?.id) return;

    try {
      setLoading(true);
      const result = await getBusinessWidgets(workspaceContext?.currentWorkspace?.id);
      
      if (result.success) {
        const foundWidget = result.data.find(w => w.id === widgetId);
        if (foundWidget) {
          setWidget(foundWidget);
          setFormData({
            systemPrompt: foundWidget.aiConfig?.customSystemPrompt || foundWidget.aiConfig?.systemPrompt || 'You are a helpful AI assistant.',
            temperature: foundWidget.aiConfig?.temperature || 0.7,
            model: foundWidget.aiConfig?.model || 'gpt-4o',
            maxTokens: foundWidget.aiConfig?.maxTokens || 500,
          });
        } else {
          router.push('/dashboard/widgets');
        }
      }
    } catch (error) {
      console.error('Error loading widget:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!widget) return;

    try {
      setSaving(true);
      
      const updatedWidget = {
        ...widget,
        aiConfig: {
          ...widget.aiConfig,
          systemPrompt: formData.systemPrompt,
          temperature: formData.temperature,
          model: formData.model,
          maxTokens: formData.maxTokens,
          enabled: widget.aiConfig?.enabled ?? true, // Ensure enabled is always boolean, not undefined
        }
      };

      const result = await updateChatWidget(widget.id, updatedWidget);
      
      if (result.success) {
        toast.success('Configuration saved successfully!');
      } else {
        toast.error('Failed to save configuration: ' + result.error);
      }
    } catch (error) {
      console.error('Error saving widget:', error);
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleTestMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      content: currentMessage,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setTesting(true);

    // Simulate AI response
    setTimeout(() => {
      const botMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot' as const,
        content: `This is a test response for: "${userMessage.content}". The AI is configured with temperature ${formData.temperature} and model ${formData.model}.`,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, botMessage]);
      setTesting(false);
    }, 1500);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground font-medium">Loading playground...</p>
        </div>
      </div>
    );
  }

  if (!widget) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Widget not found</p>
          <Link href="/dashboard/widgets">
            <Button>Back to Agents</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="flex h-screen">
        {/* Left Sidebar - Configuration */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto h-screen custom-scrollbar">
          <div className="p-4 space-y-4">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-xl font-bold text-black">Playground</h1>
            </div>

            {/* Agent Status */}
            <div className="space-y-2 mb-6">
              <div className="text-sm text-gray-600">Agent status:</div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-600">Trained</span>
              </div>
            </div>

            {/* Save Button */}
            <div className="mb-6">
              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="w-full bg-gray-800 hover:bg-gray-900 text-white font-medium py-2.5 px-4 rounded-md cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save to agent'
                )}
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mb-6">
              <Button 
                variant="outline"
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300 cursor-pointer py-2.5"
              >
                <Settings className="w-4 h-4 mr-2" />
                Configure & test agents
              </Button>
              <Button 
                variant="outline"
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300 cursor-pointer py-2.5"
              >
                Compare
              </Button>
            </div>

            {/* Model Selection */}
            <div className="space-y-2 mb-6">
              <div className="text-sm text-gray-600">Model</div>
              <Select value={formData.model} onValueChange={(value) => setFormData(prev => ({ ...prev, model: value }))}>
                <SelectTrigger className="w-full bg-white border-gray-300 cursor-pointer py-2.5">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                  <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                  <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Temperature */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">Temperature</div>
                <div className="text-sm font-medium text-black">{formData.temperature}</div>
              </div>
              <div className="px-2">
                <Slider
                  value={[formData.temperature]}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, temperature: value[0] }))}
                  max={2}
                  min={0}
                  step={0.1}
                  className="w-full"
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Reserved</span>
                <span>Creative</span>
              </div>
            </div>

            {/* AI Actions */}
            <div className="space-y-2 mb-6">
              <div className="text-sm text-gray-600">AI Actions</div>
              <Button 
                variant="outline"
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-500 border-gray-300 cursor-pointer justify-start py-2.5"
              >
                No actions found
              </Button>
            </div>

            {/* Instructions */}
            <div className="space-y-3">
              <div className="text-sm text-gray-600">Instructions (System prompt)</div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Select>
                    <SelectTrigger className="w-full bg-white border-gray-300 cursor-pointer py-2.5">
                      <SelectValue placeholder="Base Instructions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="base">Base Instructions</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="sm" className="cursor-pointer">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
                <Textarea
                  value={formData.systemPrompt}
                  onChange={(e) => setFormData(prev => ({ ...prev, systemPrompt: e.target.value }))}
                  placeholder="### Role - Primary Function: You are an AI chatbot who helps users with their inquiries..."
                  rows={8}
                  className="w-full bg-white border-gray-300 cursor-pointer resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Chat Preview */}
        <div className="flex-1 bg-gray-100 overflow-hidden" style={{
          backgroundImage: `radial-gradient(circle, #d1d5db 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }}>
          {/* Chat Container - Phone-like proportions with fixed height */}
          <div className="flex justify-center py-4 px-4" style={{ height: '100vh' }}>
            {/* Chat Window - Mobile phone width */}
            <div className="w-80 max-w-sm bg-white rounded-2xl shadow-lg flex flex-col overflow-hidden" style={{ height: '500px' }}>
              {/* Chat Header */}
              <div className="flex justify-between items-center p-4 border-b border-gray-100">
                <div className="text-sm font-semibold text-black">
                  Agent {new Date().toLocaleDateString()}, {new Date().toLocaleTimeString()}
                </div>
                <Button variant="ghost" size="sm" className="cursor-pointer h-6 w-6 p-0">
                  <Settings className="w-4 h-4 text-gray-600" />
                </Button>
              </div>

              {/* Chat Messages Area */}
              <div className="flex-1 p-3 overflow-y-auto">
                {chatMessages.length === 0 ? (
                  <div className="flex flex-col justify-center h-full">
                    <div className="bg-gray-100 rounded-2xl p-4 max-w-[85%]">
                      <div className="text-xs text-gray-500 mb-2">
                        Agent {new Date().toLocaleDateString()}, {new Date().toLocaleTimeString()}
                      </div>
                      <div className="text-black">Hi! What can I help you with?</div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[85%] ${
                          message.type === 'user'
                            ? 'bg-gray-800 text-white'
                            : 'bg-gray-100 text-black'
                        } rounded-2xl p-3`}>
                          {message.type === 'bot' && (
                            <div className="text-xs text-gray-500 mb-1">
                              Agent {message.timestamp.toLocaleDateString()}, {message.timestamp.toLocaleTimeString()}
                            </div>
                          )}
                          <div className="text-sm">{message.content}</div>
                        </div>
                      </div>
                    ))}
                    
                    {testing && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 rounded-2xl p-3 max-w-[85%]">
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                            <span className="text-sm text-gray-500">Thinking...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Chat Input Area */}
              <div className="p-3 border-t border-gray-100">
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-2">
                  <Button variant="ghost" size="sm" className="cursor-pointer h-8 w-8 p-0">
                    <span className="text-lg">😊</span>
                  </Button>
                  <Input
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    placeholder="Message..."
                    className="flex-1 border-0 bg-transparent focus:ring-0 cursor-pointer text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && handleTestMessage()}
                  />
                  <Button
                    onClick={handleTestMessage}
                    disabled={!currentMessage.trim() || testing}
                    size="sm"
                    className="cursor-pointer h-8 w-8 p-0"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Footer Branding */}
              <div className="flex justify-center items-center pb-2">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-4 h-4 bg-gray-600 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">C</span>
                  </div>
                  <span>Powered by Chatbase</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}

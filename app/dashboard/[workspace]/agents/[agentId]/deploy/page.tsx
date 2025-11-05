"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Copy, Globe, Check, Settings, MessageCircle, Loader2, HelpCircle, ArrowRight, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/app/lib/workspace-auth-context";
import { getAgent, Agent } from "@/app/lib/agent-utils";
import { 
  createAgentChannel, 
  getAgentChannels, 
  updateChannelStatus,
  AgentChannel 
} from "@/app/lib/agent-channel-utils";
import { toast } from "sonner";

export default function AgentDeployPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = params.workspace as string;
  const agentId = params.agentId as string;
  const { workspaceContext } = useAuth();
  
  const [agent, setAgent] = useState<Agent | null>(null);
  const [channels, setChannels] = useState<AgentChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedChannelType, setSelectedChannelType] = useState<'chat-widget' | 'help-page' | null>(null);
  const [creating, setCreating] = useState(false);
  const [channelName, setChannelName] = useState('');
  const [copiedChannelId, setCopiedChannelId] = useState<string | null>(null);

  useEffect(() => {
    loadAgent();
    loadChannels();
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

  const loadChannels = async () => {
    if (!agentId) return;

    try {
      const response = await getAgentChannels(agentId);
      if (response.success && response.data) {
        setChannels(response.data);
      }
    } catch (error) {
      console.error('Error loading channels:', error);
    }
  };

  const handleCreateChannel = async () => {
    if (!selectedChannelType || !channelName.trim() || !agent) return;

    try {
      setCreating(true);
      const response = await createAgentChannel({
        agentId,
        workspaceSlug,
        type: selectedChannelType,
        name: channelName.trim(),
        settings: {
          widgetTitle: agent.name,
          welcomeMessage: `Hello! I'm ${agent.name}. How can I help you today?`,
          placeholder: 'Type your message...',
          primaryColor: '#000000',
          position: 'bottom-right',
          theme: 'light'
        }
      });

      if (response.success) {
        toast.success('Channel created successfully!');
        setShowCreateDialog(false);
        setSelectedChannelType(null);
        setChannelName('');
        await loadChannels();
      } else {
        toast.error(response.error || 'Failed to create channel');
      }
    } catch (error) {
      console.error('Error creating channel:', error);
      toast.error('Failed to create channel');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleChannel = async (channelId: string, currentStatus: boolean) => {
    const response = await updateChannelStatus(channelId, !currentStatus);
    if (response.success) {
      await loadChannels();
      toast.success(`Channel ${!currentStatus ? 'enabled' : 'disabled'}`);
    } else {
      toast.error(response.error || 'Failed to update channel');
    }
  };

  const handleCopyCode = (channelId: string) => {
    const embedCode = `<script src="https://your-domain.com/agent.js" data-agent-id="${agentId}" data-channel-id="${channelId}"></script>`;
    navigator.clipboard.writeText(embedCode);
    setCopiedChannelId(channelId);
    setTimeout(() => setCopiedChannelId(null), 2000);
    toast.success('Embed code copied!');
  };

  const handleSetupChannel = (type: 'chat-widget' | 'help-page') => {
    setSelectedChannelType(type);
    setChannelName(type === 'chat-widget' ? 'Chat widget' : 'Help page');
    setShowCreateDialog(true);
  };

  // Check if user already has a widget or help page
  const hasWidget = channels.some(channel => channel.type === 'chat-widget');
  const hasHelpPage = channels.some(channel => channel.type === 'help-page');
  const widgetChannel = channels.find(channel => channel.type === 'chat-widget');
  const helpPageChannel = channels.find(channel => channel.type === 'help-page');

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading channels...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Deploy your agent</h1>
          <p className="text-gray-600 text-lg">Connect your AI agent across multiple channels and platforms</p>
        </div>

        {/* Top Section - Chat Widget and Help Page */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Primary Channels</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chat Widget */}
            <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow rounded-lg overflow-hidden">
              <div className="aspect-video bg-blue-600 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center p-6">
                  <div className="bg-white rounded-lg p-5 shadow-lg max-w-sm w-full">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <MessageCircle className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm font-semibold text-gray-800">{agent?.name || 'My Agent'}</span>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <p className="text-xs text-gray-700">Hi! What can I help you with today?</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full"></div>
                      <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                        <ArrowRight className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <CardContent className="p-6 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-gray-900">Chat Widget</h3>
                    {hasWidget && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Active
                      </Badge>
                    )}
                  </div>
                  {hasWidget && (
                    <Switch
                      checked={widgetChannel?.isActive || false}
                      onCheckedChange={() => widgetChannel && handleToggleChannel(widgetChannel.id, widgetChannel.isActive)}
                      className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-200"
                    />
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                  Add a floating chat window to your website. Perfect for real-time customer support.
                </p>
                <div className="flex gap-3">
                  {hasWidget && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => widgetChannel && handleCopyCode(widgetChannel.id)}
                      className="flex-1"
                    >
                      {copiedChannelId === widgetChannel?.id ? (
                        <>
                          <Check className="w-4 h-4 mr-2 text-green-600" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Code
                        </>
                      )}
                    </Button>
                  )}
                  <Button
                    onClick={() => hasWidget ? router.push(`/dashboard/${workspaceSlug}/agents/${agentId}/deploy/chat-widget`) : handleSetupChannel('chat-widget')}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {hasWidget ? (
                      <>
                        <Settings className="w-4 h-4 mr-2" />
                        Manage
                      </>
                    ) : (
                      <>
                        <Globe className="w-4 h-4 mr-2" />
                        Setup
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Help Page */}
            <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow rounded-lg overflow-hidden">
              <div className="aspect-video bg-orange-600 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center p-6">
                  <div className="bg-white rounded-lg p-5 shadow-lg max-w-sm w-full">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    </div>
                    <div className="text-center">
                      <h4 className="font-bold text-gray-900 mb-3 text-base">How can we help you?</h4>
                      <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-2">
                        <Search className="w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search for help..."
                          className="w-full text-xs bg-transparent border-none outline-none text-gray-600"
                          readOnly
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <CardContent className="p-6 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-gray-900">Help Center</h3>
                    {hasHelpPage && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Active
                      </Badge>
                    )}
                  </div>
                  {hasHelpPage && (
                    <Switch
                      checked={helpPageChannel?.isActive || false}
                      onCheckedChange={() => helpPageChannel && handleToggleChannel(helpPageChannel.id, helpPageChannel.isActive)}
                      className="data-[state=checked]:bg-orange-600 data-[state=unchecked]:bg-gray-200"
                    />
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                  ChatGPT-style help center. Deploy standalone or under a custom path like /help.
                </p>
                <Button
                  onClick={() => hasHelpPage ? router.push(`/dashboard/${workspaceSlug}/agents/${agentId}/deploy/help-page`) : handleSetupChannel('help-page')}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  {hasHelpPage ? (
                    <>
                      <Settings className="w-4 h-4 mr-2" />
                      Manage
                    </>
                  ) : (
                    <>
                      <HelpCircle className="w-4 h-4 mr-2" />
                      Setup
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Section - Other Integrations */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Integrations</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden bg-white cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">Z</span>
                  </div>
                  <Badge variant="outline" className="text-xs bg-gray-50">Coming Soon</Badge>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Zapier</h3>
                <p className="text-xs text-gray-600 mb-4 leading-relaxed">Connect with 5000+ apps through automation workflows</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => toast.info('Zapier integration coming soon!')}
                >
                  Learn More
                </Button>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden bg-white cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">#</span>
                  </div>
                  <Badge variant="outline" className="text-xs bg-gray-50">Coming Soon</Badge>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Slack</h3>
                <p className="text-xs text-gray-600 mb-4 leading-relaxed">Let your agent respond to mentions in Slack channels</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => toast.info('Slack integration coming soon!')}
                >
                  Learn More
                </Button>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden bg-white cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">W</span>
                  </div>
                  <Badge variant="outline" className="text-xs bg-gray-50">Coming Soon</Badge>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">WordPress</h3>
                <p className="text-xs text-gray-600 mb-4 leading-relaxed">Official plugin for seamless WordPress integration</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => toast.info('WordPress integration coming soon!')}
                >
                  Learn More
                </Button>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden bg-white cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <Badge variant="outline" className="text-xs bg-gray-50">Coming Soon</Badge>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">WhatsApp</h3>
                <p className="text-xs text-gray-600 mb-4 leading-relaxed">Respond to customer messages on WhatsApp Business</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => toast.info('WhatsApp integration coming soon!')}
                >
                  Learn More
                </Button>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden bg-white cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <Badge variant="outline" className="text-xs bg-gray-50">Coming Soon</Badge>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Messenger</h3>
                <p className="text-xs text-gray-600 mb-4 leading-relaxed">Connect to Facebook Messenger for social support</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => toast.info('Messenger integration coming soon!')}
                >
                  Learn More
                </Button>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden bg-white cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-pink-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">IG</span>
                  </div>
                  <Badge variant="outline" className="text-xs bg-gray-50">Coming Soon</Badge>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Instagram</h3>
                <p className="text-xs text-gray-600 mb-4 leading-relaxed">Handle Instagram Direct Messages automatically</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => toast.info('Instagram integration coming soon!')}
                >
                  Learn More
                </Button>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden bg-white cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-teal-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">Z</span>
                  </div>
                  <Badge variant="outline" className="text-xs bg-gray-50">Coming Soon</Badge>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Zendesk</h3>
                <p className="text-xs text-gray-600 mb-4 leading-relaxed">Integrate with Zendesk for unified support</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => toast.info('Zendesk integration coming soon!')}
                >
                  Learn More
                </Button>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden bg-white cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-pink-600 rounded-lg flex items-center justify-center">
                    <Globe className="w-6 h-6 text-white" />
                  </div>
                  <Badge variant="outline" className="text-xs bg-gray-50">Coming Soon</Badge>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">REST API</h3>
                <p className="text-xs text-gray-600 mb-4 leading-relaxed">Build custom integrations with our REST API</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => toast.info('API documentation coming soon!')}
                >
                  View Docs
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Create Channel Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl font-bold">
              Setup {selectedChannelType === 'chat-widget' ? 'Chat Widget' : 'Help Center'}
            </DialogTitle>
            <DialogDescription className="text-base">
              {selectedChannelType === 'chat-widget'
                ? 'Create a floating chat widget that provides instant support to your website visitors.'
                : 'Create a dedicated help center page where customers can find answers and get help.'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 mt-6">
            <div className="space-y-2">
              <Label htmlFor="channelName" className="text-sm font-medium text-gray-900">
                Channel Name
              </Label>
              <Input
                id="channelName"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                placeholder={`e.g., ${selectedChannelType === 'chat-widget' ? 'Main Website Chat' : 'Support Center'}`}
                className="h-11"
                autoFocus
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false);
                  setSelectedChannelType(null);
                  setChannelName('');
                }}
                className="flex-1 h-11"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateChannel}
                disabled={!channelName.trim() || creating}
                className="flex-1 h-11 bg-blue-600 hover:bg-blue-700"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Channel
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

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
import { Copy, Globe, Check, Settings, MessageCircle, Loader2, HelpCircle } from "lucide-react";
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
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground mb-2">All channels</h1>
        </div>

        {/* Top Section - Chat Widget and Help Page (Full Width) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Chat Widget */}
          <Card className="border border-border bg-card rounded-md overflow-hidden">
            <div className="aspect-video bg-gradient-to-br from-blue-400 to-blue-600 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white rounded-lg p-4 shadow-lg max-w-xs w-full mx-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700">my agent</span>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-2 mb-2">
                    <p className="text-xs text-gray-600">Hi! What can I help you with?</p>
                  </div>
                </div>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-foreground">Chat widget</h3>
                {hasWidget && (
                  <Switch
                    checked={widgetChannel?.isActive || false}
                    onCheckedChange={() => widgetChannel && handleToggleChannel(widgetChannel.id, widgetChannel.isActive)}
                    className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-gray-300"
                  />
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Add a floating chat window to your site
              </p>
              <div className="flex gap-2">
                {hasWidget && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => widgetChannel && handleCopyCode(widgetChannel.id)}
                    className="flex-1 rounded-md"
                  >
                    {copiedChannelId === widgetChannel?.id ? (
                      <>
                        <Check className="w-4 h-4 mr-2 text-green-600" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                )}
                <Button
                  onClick={() => hasWidget ? router.push(`/dashboard/${workspaceSlug}/agents/${agentId}/deploy/chat-widget`) : handleSetupChannel('chat-widget')}
                  className="flex-1 bg-primary hover:bg-primary/90 rounded-md"
                >
                  {hasWidget ? 'Manage' : 'Setup'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Help Page */}
          <Card className="border border-border bg-card rounded-md overflow-hidden">
            <div className="aspect-video bg-gradient-to-br from-orange-400 to-orange-600 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white rounded-lg p-4 shadow-lg max-w-xs w-full mx-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  </div>
                  <div className="text-center">
                    <h4 className="font-semibold text-gray-800 mb-2">How can we help you today?</h4>
                    <div className="bg-gray-100 rounded-md p-2">
                      <input 
                        type="text" 
                        placeholder="Ask a question..." 
                        className="w-full text-xs bg-transparent border-none outline-none text-gray-600"
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-foreground">Help page</h3>
                {hasHelpPage && (
                  <Switch
                    checked={helpPageChannel?.isActive || false}
                    onCheckedChange={() => helpPageChannel && handleToggleChannel(helpPageChannel.id, helpPageChannel.isActive)}
                    className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-gray-300"
                  />
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                ChatGPT-style help page, deployed standalone or under a path on your site (/help).
              </p>
              <Button
                onClick={() => hasHelpPage ? router.push(`/dashboard/${workspaceSlug}/agents/${agentId}/deploy/help-page`) : handleSetupChannel('help-page')}
                className="w-full bg-primary hover:bg-primary/90 rounded-md"
              >
                {hasHelpPage ? 'Setup' : 'Setup'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section - Other Integrations */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="border border-border bg-card rounded-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">Z</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Zapier</h3>
                  <p className="text-xs text-muted-foreground">Connect your agent with thousands of apps using Zapier.</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full rounded-md"
                onClick={() => toast.info('Zapier integration coming soon!')}
              >
                Setup
              </Button>
            </CardContent>
          </Card>

          <Card className="border border-border bg-card rounded-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">#</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Slack</h3>
                  <p className="text-xs text-muted-foreground">Connect your agent to Slack, mention it, and have it reply to any message.</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full rounded-md"
                onClick={() => toast.info('Slack integration coming soon!')}
              >
                Setup
              </Button>
            </CardContent>
          </Card>

          <Card className="border border-border bg-card rounded-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">W</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">WordPress</h3>
                  <p className="text-xs text-muted-foreground">Use the official Chatbase plugin for WordPress to add the chat widget to your website.</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full rounded-md"
                onClick={() => toast.info('WordPress integration coming soon!')}
              >
                Setup
              </Button>
            </CardContent>
          </Card>

          <Card className="border border-border bg-card rounded-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">WhatsApp</h3>
                  <p className="text-xs text-muted-foreground">Connect your agent to a WhatsApp number and let it respond to messages from your customers.</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full rounded-md"
                onClick={() => toast.info('WhatsApp integration coming soon!')}
              >
                Setup
              </Button>
            </CardContent>
          </Card>

          <Card className="border border-border bg-card rounded-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Messenger</h3>
                  <p className="text-xs text-muted-foreground">Connect your agent to Facebook Messenger.</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full rounded-md"
                onClick={() => toast.info('Messenger integration coming soon!')}
              >
                Setup
              </Button>
            </CardContent>
          </Card>

          <Card className="border border-border bg-card rounded-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-red-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">IG</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Instagram</h3>
                  <p className="text-xs text-muted-foreground">Connect your agent to Instagram Direct Messages.</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full rounded-md"
                onClick={() => toast.info('Instagram integration coming soon!')}
              >
                Setup
              </Button>
            </CardContent>
          </Card>

          <Card className="border border-border bg-card rounded-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">Z</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Zendesk</h3>
                  <p className="text-xs text-muted-foreground">Connect your agent to Zendesk for customer support.</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full rounded-md"
                onClick={() => toast.info('Zendesk integration coming soon!')}
              >
                Setup
              </Button>
            </CardContent>
          </Card>

          <Card className="border border-border bg-card rounded-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-pink-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">API</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">API</h3>
                  <p className="text-xs text-muted-foreground">Use our API to integrate your agent with any platform.</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full rounded-md"
                onClick={() => toast.info('API documentation coming soon!')}
              >
                Setup
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Channel Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Setup {selectedChannelType === 'chat-widget' ? 'Chat Widget' : 'Help Page'}</DialogTitle>
            <DialogDescription>
              {selectedChannelType === 'chat-widget' 
                ? 'Create a floating chat widget for your website.'
                : 'Create a standalone help page for your customers.'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="channelName">Channel Name</Label>
              <Input
                id="channelName"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                placeholder={`Enter ${selectedChannelType === 'chat-widget' ? 'chat widget' : 'help page'} name`}
                className="mt-2 rounded-md"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false);
                  setSelectedChannelType(null);
                  setChannelName('');
                }}
                className="flex-1 rounded-md"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateChannel}
                disabled={!channelName.trim() || creating}
                className="flex-1 bg-primary hover:bg-primary/90 rounded-md"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Channel'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

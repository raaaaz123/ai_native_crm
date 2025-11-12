"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Copy, Globe, Check, Settings, MessageCircle, Loader2, HelpCircle, ArrowRight, Plus, Search, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/app/lib/workspace-auth-context";
import { getAgent, Agent } from "@/app/lib/agent-utils";
import {
  createAgentChannel,
  getAgentChannels,
  updateChannelStatus,
  AgentChannel
} from "@/app/lib/agent-channel-utils";
import { checkZapierIntegrationStatus } from "@/app/lib/zapier-utils";
import { checkZendeskIntegrationStatus } from "@/app/lib/zendesk-utils";
import { checkWhatsAppIntegrationStatus } from "@/app/lib/whatsapp-utils";
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
  const [zapierConfigured, setZapierConfigured] = useState(false);
  const [zendeskConfigured, setZendeskConfigured] = useState(false);
  const [whatsappConfigured, setWhatsappConfigured] = useState(false);

  useEffect(() => {
    loadAgent();
    loadChannels();
    checkZapierStatus();
    checkZendeskStatus();
    checkWhatsAppStatus();
  }, [agentId, workspaceContext]);

  const checkZapierStatus = async () => {
    if (!workspaceContext?.currentWorkspace?.id || !agentId) return;
    try {
      const isConfigured = await checkZapierIntegrationStatus(
        workspaceContext.currentWorkspace.id,
        agentId
      );
      setZapierConfigured(isConfigured);
    } catch (error) {
      console.error('Error checking Zapier status:', error);
    }
  };

  const checkZendeskStatus = async () => {
    if (!workspaceContext?.currentWorkspace?.id || !agentId) return;
    try {
      const isConfigured = await checkZendeskIntegrationStatus(
        workspaceContext.currentWorkspace.id,
        agentId
      );
      setZendeskConfigured(isConfigured);
    } catch (error) {
      console.error('Error checking Zendesk status:', error);
    }
  };

  const checkWhatsAppStatus = async () => {
    if (!workspaceContext?.currentWorkspace?.id || !agentId) return;
    try {
      const isConfigured = await checkWhatsAppIntegrationStatus(
        workspaceContext.currentWorkspace.id,
        agentId
      );
      setWhatsappConfigured(isConfigured);
    } catch (error) {
      console.error('Error checking WhatsApp status:', error);
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
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground font-medium">Loading deployment options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">Deployment Center</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-foreground">
            Deploy {agent?.name || 'your agent'}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Connect your AI agent across multiple channels and start engaging with customers instantly
          </p>
        </div>

        {/* Primary Channels - Featured Section */}
        <div className="mb-16">
          <div className="flex items-center gap-2 mb-6">
            <div className="h-8 w-1 bg-primary rounded-full"></div>
            <h2 className="text-2xl font-bold text-foreground">Primary Channels</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chat Widget Card */}
            <Card className="group relative border border-border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
              {/* Preview Section */}
              <div className="relative h-48 bg-primary/5 overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <div className="bg-card rounded-lg p-4 shadow-lg max-w-xs w-full transform group-hover:scale-105 transition-transform duration-300 border border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <MessageCircle className="w-4 h-4 text-primary-foreground" />
                      </div>
                      <span className="font-bold text-foreground text-sm">{agent?.name || 'AI Assistant'}</span>
                      <div className="ml-auto flex gap-1">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                    <div className="bg-muted rounded-lg p-2.5 mb-3 border border-border">
                      <p className="text-xs text-foreground leading-relaxed">Hi! How can I help you today? 👋</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-8 bg-background rounded-lg border border-border"></div>
                      <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                        <ArrowRight className="w-4 h-4 text-primary-foreground" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Section */}
              <CardContent className="relative p-6 bg-card">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <MessageCircle className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">Chat Widget</h3>
                      {hasWidget && (
                        <Badge className="mt-1 bg-green-100 text-green-700 border-0 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400">
                          <div className="w-1.5 h-1.5 bg-green-600 rounded-full mr-1.5"></div>
                          Active
                        </Badge>
                      )}
                    </div>
                  </div>
                  {hasWidget && (
                    <Switch
                      checked={widgetChannel?.isActive || false}
                      onCheckedChange={() => widgetChannel && handleToggleChannel(widgetChannel.id, widgetChannel.isActive)}
                      className="data-[state=checked]:bg-primary"
                    />
                  )}
                </div>

                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Embed a beautiful floating chat window on your website for instant customer support
                </p>

                <div className="flex gap-3">
                  {hasWidget && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => widgetChannel && handleCopyCode(widgetChannel.id)}
                      className="flex-1 border-border hover:border-primary hover:text-primary"
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
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    {hasWidget ? (
                      <>
                        <Settings className="w-4 h-4 mr-2" />
                        Manage
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Setup Now
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Help Center Card */}
            <Card className="group relative border border-border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
              {/* Preview Section */}
              <div className="relative h-48 bg-primary/5 overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <div className="bg-card rounded-lg p-4 shadow-lg max-w-xs w-full transform group-hover:scale-105 transition-transform duration-300 border border-border">
                    <div className="flex items-center gap-1.5 mb-3">
                      <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                      <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    </div>
                    <div className="text-center">
                      <div className="inline-flex items-center gap-2 mb-3">
                        <HelpCircle className="w-4 h-4 text-primary" />
                        <h4 className="font-bold text-foreground text-sm">How can we help?</h4>
                      </div>
                      <div className="bg-muted rounded-lg p-2.5 flex items-center gap-2 border border-border">
                        <Search className="w-4 h-4 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="Search for answers..."
                          className="w-full bg-transparent border-none outline-none text-xs text-foreground placeholder-muted-foreground"
                          readOnly
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Section */}
              <CardContent className="relative p-6 bg-card">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <HelpCircle className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">Help Center</h3>
                      {hasHelpPage && (
                        <Badge className="mt-1 bg-green-100 text-green-700 border-0 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400">
                          <div className="w-1.5 h-1.5 bg-green-600 rounded-full mr-1.5"></div>
                          Active
                        </Badge>
                      )}
                    </div>
                  </div>
                  {hasHelpPage && (
                    <Switch
                      checked={helpPageChannel?.isActive || false}
                      onCheckedChange={() => helpPageChannel && handleToggleChannel(helpPageChannel.id, helpPageChannel.isActive)}
                      className="data-[state=checked]:bg-primary"
                    />
                  )}
                </div>

                <p className="text-muted-foreground mb-6 leading-relaxed">
                  ChatGPT-style help center page, perfect for comprehensive self-service support
                </p>

                <Button
                  onClick={() => hasHelpPage ? router.push(`/dashboard/${workspaceSlug}/agents/${agentId}/deploy/help-page`) : handleSetupChannel('help-page')}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {hasHelpPage ? (
                    <>
                      <Settings className="w-4 h-4 mr-2" />
                      Manage
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Setup Now
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Integrations Section */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <div className="h-8 w-1 bg-primary rounded-full"></div>
            <h2 className="text-2xl font-bold text-foreground">Integrations</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {/* Zapier */}
            <Card
              className="group relative border border-border hover:border-primary/50 hover:shadow-md transition-all duration-300 overflow-hidden bg-card cursor-pointer"
              onClick={() => router.push(`/dashboard/${workspaceSlug}/agents/${agentId}/deploy/zapier`)}
            >
              <CardContent className="relative p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <span className="text-white font-bold text-xl">Z</span>
                  </div>
                  {zapierConfigured ? (
                    <Badge className="bg-green-100 text-green-700 border-0 dark:bg-green-900/30 dark:text-green-400">
                      <Check className="w-3 h-3 mr-1" />
                      Setup
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-border text-muted-foreground">
                      Available
                    </Badge>
                  )}
                </div>
                <h3 className="font-bold text-foreground mb-2 text-lg">Zapier</h3>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed min-h-[40px]">
                  Connect your agent to 5,000+ apps and automate workflows
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-border hover:border-primary hover:text-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/dashboard/${workspaceSlug}/agents/${agentId}/deploy/zapier`);
                  }}
                >
                  {zapierConfigured ? 'Manage' : 'Setup'}
                </Button>
              </CardContent>
            </Card>

            {/* WhatsApp */}
            <Card
              className="group relative border border-border hover:border-primary/50 hover:shadow-md transition-all duration-300 overflow-hidden bg-card cursor-pointer"
              onClick={() => router.push(`/dashboard/${workspaceSlug}/agents/${agentId}/deploy/whatsapp`)}
            >
              <CardContent className="relative p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  {whatsappConfigured ? (
                    <Badge className="bg-green-100 text-green-700 border-0 dark:bg-green-900/30 dark:text-green-400">
                      <Check className="w-3 h-3 mr-1" />
                      Setup
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-border text-muted-foreground">
                      Available
                    </Badge>
                  )}
                </div>
                <h3 className="font-bold text-foreground mb-2 text-lg">WhatsApp</h3>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed min-h-[40px]">
                  Connect WhatsApp Business for automated customer messaging
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-border hover:border-primary hover:text-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/dashboard/${workspaceSlug}/agents/${agentId}/deploy/whatsapp`);
                  }}
                >
                  {whatsappConfigured ? 'Manage' : 'Setup'}
                </Button>
              </CardContent>
            </Card>

            {/* Zendesk */}
            <Card
              className="group relative border border-border hover:border-primary/50 hover:shadow-md transition-all duration-300 overflow-hidden bg-card cursor-pointer"
              onClick={() => router.push(`/dashboard/${workspaceSlug}/agents/${agentId}/deploy/zendesk`)}
            >
              <CardContent className="relative p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-teal-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <span className="text-white font-bold text-xl">Z</span>
                  </div>
                  {zendeskConfigured ? (
                    <Badge className="bg-green-100 text-green-700 border-0 dark:bg-green-900/30 dark:text-green-400">
                      <Check className="w-3 h-3 mr-1" />
                      Setup
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-border text-muted-foreground">
                      Available
                    </Badge>
                  )}
                </div>
                <h3 className="font-bold text-foreground mb-2 text-lg">Zendesk</h3>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed min-h-[40px]">
                  Auto-reply to Zendesk tickets with AI-powered responses
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-border hover:border-primary hover:text-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/dashboard/${workspaceSlug}/agents/${agentId}/deploy/zendesk`);
                  }}
                >
                  {zendeskConfigured ? 'Manage' : 'Setup'}
                </Button>
              </CardContent>
            </Card>

            {/* Slack - Coming Soon */}
            <Card className="group relative border border-border hover:border-primary/50 hover:shadow-md transition-all duration-300 overflow-hidden bg-card opacity-75">
              <CardContent className="relative p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xl">#</span>
                  </div>
                  <Badge variant="outline" className="border-border text-muted-foreground">
                    Coming Soon
                  </Badge>
                </div>
                <h3 className="font-bold text-foreground mb-2 text-lg">Slack</h3>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed min-h-[40px]">
                  Let your agent respond to mentions in Slack channels
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-border"
                  onClick={() => toast.info('Slack integration coming soon!')}
                >
                  Learn More
                </Button>
              </CardContent>
            </Card>

            {/* Messenger - Coming Soon */}
            <Card className="group relative border border-border hover:border-primary/50 hover:shadow-md transition-all duration-300 overflow-hidden bg-card opacity-75">
              <CardContent className="relative p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <Badge variant="outline" className="border-border text-muted-foreground">
                    Coming Soon
                  </Badge>
                </div>
                <h3 className="font-bold text-foreground mb-2 text-lg">Messenger</h3>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed min-h-[40px]">
                  Connect Facebook Messenger for social customer support
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-border"
                  onClick={() => toast.info('Messenger integration coming soon!')}
                >
                  Learn More
                </Button>
              </CardContent>
            </Card>

            {/* Instagram - Coming Soon */}
            <Card className="group relative border border-border hover:border-primary/50 hover:shadow-md transition-all duration-300 overflow-hidden bg-card opacity-75">
              <CardContent className="relative p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-pink-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">IG</span>
                  </div>
                  <Badge variant="outline" className="border-border text-muted-foreground">
                    Coming Soon
                  </Badge>
                </div>
                <h3 className="font-bold text-foreground mb-2 text-lg">Instagram</h3>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed min-h-[40px]">
                  Handle Instagram Direct Messages automatically with AI
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-border"
                  onClick={() => toast.info('Instagram integration coming soon!')}
                >
                  Learn More
                </Button>
              </CardContent>
            </Card>

            {/* WordPress - Coming Soon */}
            <Card className="group relative border border-border hover:border-primary/50 hover:shadow-md transition-all duration-300 overflow-hidden bg-card opacity-75">
              <CardContent className="relative p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-lg">W</span>
                  </div>
                  <Badge variant="outline" className="border-border text-muted-foreground">
                    Coming Soon
                  </Badge>
                </div>
                <h3 className="font-bold text-foreground mb-2 text-lg">WordPress</h3>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed min-h-[40px]">
                  Official WordPress plugin for seamless integration
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-border"
                  onClick={() => toast.info('WordPress plugin coming soon!')}
                >
                  Learn More
                </Button>
              </CardContent>
            </Card>

            {/* REST API - Coming Soon */}
            <Card className="group relative border border-border hover:border-primary/50 hover:shadow-md transition-all duration-300 overflow-hidden bg-card opacity-75">
              <CardContent className="relative p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-muted-foreground rounded-lg flex items-center justify-center">
                    <Globe className="w-6 h-6 text-background" />
                  </div>
                  <Badge variant="outline" className="border-border text-muted-foreground">
                    Coming Soon
                  </Badge>
                </div>
                <h3 className="font-bold text-foreground mb-2 text-lg">REST API</h3>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed min-h-[40px]">
                  Build custom integrations with our powerful REST API
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-border"
                  onClick={() => toast.info('API documentation coming soon!')}
                >
                  View Docs
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Create Channel Dialog - Enhanced */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-foreground">
              <Sparkles className="w-6 h-6 text-primary" />
              Setup {selectedChannelType === 'chat-widget' ? 'Chat Widget' : 'Help Center'}
            </DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">
              {selectedChannelType === 'chat-widget'
                ? 'Create a floating chat widget that provides instant support to your website visitors.'
                : 'Create a dedicated help center page where customers can find answers and get help.'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 mt-6">
            <div className="space-y-2">
              <Label htmlFor="channelName" className="text-sm font-semibold text-foreground">
                Channel Name
              </Label>
              <Input
                id="channelName"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                placeholder={`e.g., ${selectedChannelType === 'chat-widget' ? 'Main Website Chat' : 'Support Center'}`}
                className="h-11 border-border focus:border-primary focus:ring-primary"
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
                className="flex-1 h-11 border-border"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateChannel}
                disabled={!channelName.trim() || creating}
                className="flex-1 h-11 bg-primary hover:bg-primary/90"
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

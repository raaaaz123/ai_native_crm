"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/app/lib/workspace-auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Container } from '@/components/layout';
import { LoadingDialog } from '@/app/components/ui/loading-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  subscribeToConversations,
  ChatConversation
} from '@/app/lib/chat-utils';
import {
  getWorkspaceAgents,
  Agent
} from '@/app/lib/agent-utils';
import {
  getBusinessKnowledgeBaseItems,
  KnowledgeBaseItem
} from '@/app/lib/knowledge-base-utils';
import {
  MessageCircle,
  Plus,
  Bot,
  BookOpen,
  TrendingUp,
  Activity,
  Users,
  ChevronRight,
  Zap
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface DashboardMetrics {
  totalAgents: number;
  activeAgents: number;
  inactiveAgents: number;
  trainingAgents: number;
  totalConversations: number;
  activeConversations: number;
  totalMessages: number;
  knowledgeBaseItems: number;
  avgResponseTime: string;
}

interface ConversationTrendData {
  date: string;
  conversations: number;
  messages: number;
}

interface AgentPerformanceData {
  name: string;
  messages: number;
  conversations: number;
}

export default function DashboardPage() {
  const { user, loading, workspaceContext } = useAuth();
  const router = useRouter();
  const params = useParams();
  const workspaceSlug = params?.workspace as string;

  // Track if initial data loading is complete
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Data state
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [agents, setAgents] = useState<Agent[]>([]);

  // Metrics state
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalAgents: 0,
    activeAgents: 0,
    inactiveAgents: 0,
    trainingAgents: 0,
    totalConversations: 0,
    activeConversations: 0,
    totalMessages: 0,
    knowledgeBaseItems: 0,
    avgResponseTime: '0s'
  });

  // Chart data
  const [conversationTrends, setConversationTrends] = useState<ConversationTrendData[]>([]);
  const [agentPerformance, setAgentPerformance] = useState<AgentPerformanceData[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin');
    }

    // Mark initial load as complete when auth loading is done
    if (!loading) {
      setInitialLoadComplete(true);
    }
  }, [user, loading, router]);

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    if (!user?.uid || !workspaceContext?.currentWorkspace?.id) {
      console.log('Missing required data for dashboard loading');
      setLoadingData(false);
      return;
    }

    setLoadingData(true);
    try {
      const workspaceId = workspaceContext.currentWorkspace.id;

      // Load agents
      const agentsResult = await getWorkspaceAgents(workspaceId);
      if (agentsResult.success && agentsResult.data) {
        // Store agents array
        setAgents(agentsResult.data);
        
        // Calculate agent metrics
        const totalAgents = agentsResult.data.length;
        const activeAgents = agentsResult.data.filter(a => a.status === 'active').length;
        const inactiveAgents = agentsResult.data.filter(a => a.status === 'inactive').length;
        const trainingAgents = agentsResult.data.filter(a => a.status === 'training').length;

        // Calculate total messages from all agents
        const totalMessages = agentsResult.data.reduce((sum, agent) =>
          sum + (agent.stats?.totalMessages || 0), 0
        );

        // Prepare agent performance data
        const performanceData = agentsResult.data
          .filter(agent => agent.stats && (agent.stats.totalMessages > 0 || agent.stats.totalConversations > 0))
          .map(agent => ({
            name: agent.name.length > 15 ? agent.name.substring(0, 15) + '...' : agent.name,
            messages: agent.stats?.totalMessages || 0,
            conversations: agent.stats?.totalConversations || 0
          }))
          .sort((a, b) => b.messages - a.messages)
          .slice(0, 5); // Top 5 agents

        setAgentPerformance(performanceData);

        setMetrics(prev => ({
          ...prev,
          totalAgents,
          activeAgents,
          inactiveAgents,
          trainingAgents,
          totalMessages
        }));
      } else {
        // No agents found
        setAgents([]);
      }

      // Load knowledge base
      const kbResult = await getBusinessKnowledgeBaseItems(workspaceId);
      if (kbResult.success && kbResult.data) {
        setMetrics(prev => ({
          ...prev,
          knowledgeBaseItems: kbResult.data.length
        }));
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoadingData(false);
    }
  }, [user?.uid, workspaceContext?.currentWorkspace?.id]);

  // Subscribe to real-time conversations
  useEffect(() => {
    if (user?.uid && workspaceContext?.currentWorkspace?.id) {
      loadDashboardData();

      const unsubscribe = subscribeToConversations(
        workspaceContext.currentWorkspace.id,
        (convos) => {
          setConversations(convos);

          // Update conversation metrics
          const totalConversations = convos.length;
          const activeConversations = convos.filter(c => c.status === 'active').length;

          setMetrics(prev => ({
            ...prev,
            totalConversations,
            activeConversations
          }));

          // Generate conversation trends (last 7 days)
          const trends = generateConversationTrends(convos);
          setConversationTrends(trends);
        }
      );

      return () => unsubscribe();
    }
  }, [user?.uid, workspaceContext?.currentWorkspace?.id, loadDashboardData]);

  // Generate conversation trends from conversations data
  const generateConversationTrends = (convos: ChatConversation[]): ConversationTrendData[] => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    return last7Days.map(date => {
      const dayConvos = convos.filter(c => {
        const convoDate = new Date(c.createdAt).toISOString().split('T')[0];
        return convoDate === date;
      });

      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        conversations: dayConvos.length,
        messages: 0 // Message count not available on ChatConversation type
      };
    });
  };

  // Show loading state
  if (loading || !initialLoadComplete || !workspaceContext?.currentWorkspace) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <LoadingDialog
          open={true}
          message="Loading Dashboard"
          submessage="Preparing your workspace and loading data..."
          variant="gradient"
        />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Show empty state dialog if no agents
  if (!loadingData && agents.length === 0) {
    return (
      <div className="pt-2 sm:pt-3">
        <Container>
          <Dialog open={true} onOpenChange={() => {}}>
            <DialogContent className="sm:max-w-lg bg-card border-border">
              <DialogHeader>
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <Bot className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <DialogTitle className="text-2xl font-bold text-center text-foreground">
                  Create Your First Agent
                </DialogTitle>
                <DialogDescription className="text-center text-muted-foreground mt-2">
                  Get started by creating your first AI agent. It will help you automate customer interactions and provide intelligent responses.
                </DialogDescription>
              </DialogHeader>
              
              <div className="mt-6 space-y-4">
                <div className="bg-muted/50 border border-border rounded-lg p-4">
                  <h3 className="font-semibold text-sm text-foreground mb-2">What you&apos;ll get:</h3>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                      <span>AI-powered customer conversations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                      <span>Multi-channel deployment (web, WhatsApp, etc.)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                      <span>Real-time analytics and insights</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                      <span>Knowledge base integration</span>
                    </li>
                  </ul>
                </div>

                <Button
                  onClick={() => {
                    router.push(`/dashboard/${workspaceSlug}/create-new-agent/knowledgebase?type=files`);
                  }}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  size="lg"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Agent
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </Container>
      </div>
    );
  }

  // Colors for charts using theme colors
  const CHART_COLORS = {
    primary: 'hsl(var(--chart-1))',
    secondary: 'hsl(var(--chart-2))',
    accent: 'hsl(var(--chart-3))',
    muted: 'hsl(var(--chart-4))',
    light: 'hsl(var(--chart-5))'
  };

  const STATUS_COLORS = {
    active: '#10b981',
    inactive: '#94a3b8',
    training: '#f59e0b'
  };

  const agentStatusData = [
    { name: 'Active', value: metrics.activeAgents, color: STATUS_COLORS.active },
    { name: 'Inactive', value: metrics.inactiveAgents, color: STATUS_COLORS.inactive },
    { name: 'Training', value: metrics.trainingAgents, color: STATUS_COLORS.training }
  ].filter(item => item.value > 0);

  return (
    <div className="pt-2 sm:pt-3">
      <Container>
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-[--color-foreground] mb-1.5">
                Dashboard
              </h1>
              <p className="text-sm text-[--color-muted-foreground]">
                Welcome back! Here&apos;s what&apos;s happening with your AI agents.
                {workspaceContext?.currentWorkspace && (
                  <span className="ml-2 font-medium text-[--color-foreground]">
                    {workspaceContext.currentWorkspace.name}
                  </span>
                )}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => router.push('/dashboard/agents')}
                className="bg-[--color-primary] hover:bg-[--color-primary-700] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Agent
              </Button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {/* Total Agents */}
          <Card className="bg-[--color-card] border border-[--color-border] shadow-sm hover:shadow-md transition-all cursor-pointer"
                onClick={() => router.push('/dashboard/agents')}>
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-wide font-medium text-[--color-muted-foreground] mb-2">
                    AI Agents
                  </p>
                  <p className="text-3xl font-bold text-[--color-foreground] mb-1">
                    {metrics.totalAgents}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-[--color-muted-foreground]">
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-[#10b981]"></div>
                      {metrics.activeAgents} active
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/10 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Conversations */}
          <Card className="bg-[--color-card] border border-[--color-border] shadow-sm hover:shadow-md transition-all cursor-pointer"
                onClick={() => router.push('/dashboard/conversations')}>
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-wide font-medium text-[--color-muted-foreground] mb-2">
                    Conversations
                  </p>
                  <p className="text-3xl font-bold text-[--color-foreground] mb-1">
                    {metrics.totalConversations}
                  </p>
                  <div className="flex items-center gap-1 text-xs">
                    <TrendingUp className="w-3 h-3 text-green-600" />
                    <span className="text-green-600 font-medium">
                      {metrics.activeConversations} active
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/10 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Messages */}
          <Card className="bg-[--color-card] border border-[--color-border] shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-wide font-medium text-[--color-muted-foreground] mb-2">
                    Total Messages
                  </p>
                  <p className="text-3xl font-bold text-[--color-foreground] mb-1">
                    {metrics.totalMessages.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-[--color-muted-foreground]">
                    <Activity className="w-3 h-3" />
                    <span>Across all agents</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/10 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Knowledge Base */}
          <Card className="bg-[--color-card] border border-[--color-border] shadow-sm hover:shadow-md transition-all cursor-pointer"
                onClick={() => router.push('/dashboard/knowledge-base')}>
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-wide font-medium text-[--color-muted-foreground] mb-2">
                    Knowledge Base
                  </p>
                  <p className="text-3xl font-bold text-[--color-foreground] mb-1">
                    {metrics.knowledgeBaseItems}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-[--color-muted-foreground]">
                    <BookOpen className="w-3 h-3" />
                    <span>Items stored</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-600/10 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Conversation Trends */}
          <Card className="lg:col-span-2 bg-[--color-card] border border-[--color-border] shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Conversation Trends</CardTitle>
              <CardDescription>Last 7 days activity</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[--color-primary]"></div>
                </div>
              ) : conversationTrends.length > 0 && conversationTrends.some(d => d.conversations > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={conversationTrends}>
                    <defs>
                      <linearGradient id="colorConversations" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.secondary} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={CHART_COLORS.secondary} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <YAxis
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        padding: '8px 12px'
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="conversations"
                      stroke={CHART_COLORS.primary}
                      fillOpacity={1}
                      fill="url(#colorConversations)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="messages"
                      stroke={CHART_COLORS.secondary}
                      fillOpacity={1}
                      fill="url(#colorMessages)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex flex-col items-center justify-center text-[--color-muted-foreground]">
                  <TrendingUp className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-sm">No conversation data yet</p>
                  <p className="text-xs mt-1">Data will appear as users interact with your agents</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Agent Status Distribution */}
          <Card className="bg-[--color-card] border border-[--color-border] shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Agent Status</CardTitle>
              <CardDescription>Current distribution</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[--color-primary]"></div>
                </div>
              ) : agentStatusData.length > 0 ? (
                <div className="h-[300px] flex flex-col items-center justify-center">
                  <ResponsiveContainer width="100%" height="70%">
                    <PieChart>
                      <Pie
                        data={agentStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {agentStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          padding: '8px 12px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-col gap-2 mt-4 w-full">
                    {agentStatusData.map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                          <span className="text-[--color-foreground]">{item.name}</span>
                        </div>
                        <span className="font-medium text-[--color-foreground]">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-[300px] flex flex-col items-center justify-center text-[--color-muted-foreground]">
                  <Bot className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-sm">No agents yet</p>
                  <Button
                    onClick={() => router.push('/dashboard/agents')}
                    size="sm"
                    className="mt-3"
                  >
                    Create your first agent
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Agent Performance & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Agent Performance */}
          <Card className="bg-[--color-card] border border-[--color-border] shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">Top Performing Agents</CardTitle>
                  <CardDescription>By messages handled</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/dashboard/agents')}
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <div className="h-[280px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[--color-primary]"></div>
                </div>
              ) : agentPerformance.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={agentPerformance} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      type="number"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={{ stroke: 'hsl(var(--border))' }}
                      width={120}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        padding: '8px 12px'
                      }}
                    />
                    <Bar dataKey="messages" fill={CHART_COLORS.primary} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex flex-col items-center justify-center text-[--color-muted-foreground]">
                  <Bot className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-sm">No agent activity yet</p>
                  <p className="text-xs mt-1">Performance data will show once agents start handling conversations</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Conversations */}
          <Card className="bg-[--color-card] border border-[--color-border] shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">Recent Conversations</CardTitle>
                  <CardDescription>Latest customer interactions</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/dashboard/conversations')}
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <div className="h-[280px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[--color-primary]"></div>
                </div>
              ) : conversations.length > 0 ? (
                <div className="space-y-3 max-h-[280px] overflow-y-auto">
                  {conversations.slice(0, 5).map((conversation) => (
                    <div
                      key={conversation.id}
                      className="flex items-center gap-3 p-3 bg-[--color-surface] hover:bg-[--color-muted] border border-[--color-border] rounded-lg cursor-pointer transition-colors"
                      onClick={() => router.push('/dashboard/conversations')}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[--color-foreground] truncate">
                          {conversation.customerName || 'Anonymous'}
                        </p>
                        <p className="text-xs text-[--color-muted-foreground] truncate">
                          {conversation.lastMessage || 'No messages yet'}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          conversation.status === 'active' ? 'bg-green-100 text-green-700' :
                          conversation.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          conversation.status === 'resolved' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {conversation.status}
                        </span>
                        <span className="text-xs text-[--color-muted-foreground]">
                          {new Date(conversation.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[280px] flex flex-col items-center justify-center text-[--color-muted-foreground]">
                  <MessageCircle className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-sm">No conversations yet</p>
                  <p className="text-xs mt-1">Conversations will appear as users interact with your agents</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-gradient-to-br from-[--color-card] to-[--color-surface] border border-[--color-border] shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
            <CardDescription>Get started with common tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => router.push('/dashboard/agents')}
                className="flex items-center gap-3 p-4 bg-[--color-card] hover:bg-white border border-[--color-border] rounded-lg transition-all hover:shadow-md group"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                  <Bot className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-[--color-foreground]">Create Agent</p>
                  <p className="text-xs text-[--color-muted-foreground]">New AI assistant</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[--color-muted-foreground] opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <button
                onClick={() => router.push('/dashboard/knowledge-base')}
                className="flex items-center gap-3 p-4 bg-[--color-card] hover:bg-white border border-[--color-border] rounded-lg transition-all hover:shadow-md group"
              >
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                  <BookOpen className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-[--color-foreground]">Add Knowledge</p>
                  <p className="text-xs text-[--color-muted-foreground]">Upload content</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[--color-muted-foreground] opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <button
                onClick={() => router.push('/dashboard/conversations')}
                className="flex items-center gap-3 p-4 bg-[--color-card] hover:bg-white border border-[--color-border] rounded-lg transition-all hover:shadow-md group"
              >
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                  <MessageCircle className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-[--color-foreground]">View Chats</p>
                  <p className="text-xs text-[--color-muted-foreground]">All conversations</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[--color-muted-foreground] opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <button
                onClick={() => router.push('/dashboard/settings')}
                className="flex items-center gap-3 p-4 bg-[--color-card] hover:bg-white border border-[--color-border] rounded-lg transition-all hover:shadow-md group"
              >
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                  <Activity className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-[--color-foreground]">Settings</p>
                  <p className="text-xs text-[--color-muted-foreground]">Configure workspace</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[--color-muted-foreground] opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          </CardContent>
        </Card>
      </Container>
    </div>
  );
}

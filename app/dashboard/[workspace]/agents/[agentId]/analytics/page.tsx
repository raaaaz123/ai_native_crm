'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingDialog } from '@/app/components/ui/loading-dialog';
import { useAuth } from '@/app/lib/workspace-auth-context';
import { getAgent, Agent } from '@/app/lib/agent-utils';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import {
  ArrowLeft,
  BarChart3,
  MessageCircle,
  Users,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  Zap
} from 'lucide-react';

interface AnalyticsData {
  totalConversations: number;
  totalMessages: number;
  averageMessagesPerConversation: number;
  conversationsToday: number;
  conversationsThisWeek: number;
  conversationsThisMonth: number;
  messagesThisWeek: number;
  recentConversations: Array<{
    id: string;
    userName: string;
    lastMessage: string;
    messageCount: number;
    lastMessageTime: Date;
  }>;
  hourlyDistribution: Array<{ hour: string; count: number }>;
  dailyTrend: Array<{ date: string; conversations: number; messages: number }>;
  topUserQuestions: Array<{ question: string; count: number }>;
}

export default function AgentAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = params.workspace as string;
  const agentId = params.agentId as string;
  const { workspaceContext } = useAuth();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!agentId) {
        setLoading(false);
        setInitialLoadComplete(true);
        return;
      }

      try {
        setLoading(true);

        // Load agent info
        const agentResponse = await getAgent(agentId);
        if (agentResponse.success) {
          setAgent(agentResponse.data);
        }

        // Load analytics data
        await loadAnalytics();

      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
        setInitialLoadComplete(true);
      }
    };

    loadData();
  }, [agentId]);

  const loadAnalytics = async () => {
    try {
      // Fetch conversations for this agent
      const conversationsQuery = query(
        collection(db, 'conversations'),
        where('agentId', '==', agentId),
        orderBy('lastMessageTime', 'desc')
      );

      type ConversationDoc = {
        lastMessageTime?: unknown;
        userName?: string;
        lastMessage?: string;
        messageCount?: number;
        [key: string]: unknown;
      };

      const conversationsSnapshot = await getDocs(conversationsQuery);
      const conversations = conversationsSnapshot.docs.map(doc => {
        const data = doc.data() as ConversationDoc;
        return {
          id: doc.id,
          ...data,
        };
      });

      // Fetch messages for this agent
      const messagesQuery = query(
        collection(db, 'messages'),
        where('agentId', '==', agentId),
        orderBy('timestamp', 'desc')
      );

      type MessageDoc = {
        timestamp?: unknown;
        conversationId?: string;
        role?: string;
        content?: string;
        [key: string]: unknown;
      };

      const messagesSnapshot = await getDocs(messagesQuery);
      const messages = messagesSnapshot.docs.map(doc => {
        const data = doc.data() as MessageDoc;
        return {
          id: doc.id,
          ...data,
        };
      });

      // Calculate time boundaries
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Calculate metrics
      const totalConversations = conversations.length;
      const totalMessages = messages.length;

      const parseTimestamp = (value: unknown): Date | null => {
        if (!value) return null;
        if (value instanceof Date) return value;
        if (
          typeof value === 'object' &&
          value !== null &&
          'toDate' in value &&
          typeof (value as { toDate?: () => Date }).toDate === 'function'
        ) {
          return (value as { toDate: () => Date }).toDate();
        }
        if (typeof value === 'string' || typeof value === 'number') {
          const parsed = new Date(value);
          return Number.isNaN(parsed.getTime()) ? null : parsed;
        }
        return null;
      };

      const conversationsToday = conversations.filter(conv => {
        const lastTime = parseTimestamp(conv.lastMessageTime);
        return lastTime ? lastTime >= todayStart : false;
      }).length;

      const conversationsThisWeek = conversations.filter(conv => {
        const lastTime = parseTimestamp(conv.lastMessageTime);
        return lastTime ? lastTime >= weekStart : false;
      }).length;

      const conversationsThisMonth = conversations.filter(conv => {
        const lastTime = parseTimestamp(conv.lastMessageTime);
        return lastTime ? lastTime >= monthStart : false;
      }).length;

      const messagesThisWeek = messages.filter(msg => {
        const timestamp = parseTimestamp(msg.timestamp);
        return timestamp ? timestamp >= weekStart : false;
      }).length;

      // Recent conversations
      const recentConversations = conversations.slice(0, 10).map(conv => ({
        id: conv.id,
        userName: conv.userName || 'Anonymous User',
        lastMessage: conv.lastMessage || '',
        messageCount: conv.messageCount || 0,
        lastMessageTime: parseTimestamp(conv.lastMessageTime) || new Date()
      }));

      // Hourly distribution
      const hourlyData = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));
      messages.forEach(msg => {
        const timestamp = parseTimestamp(msg.timestamp);
        if (!timestamp) return;
        const hour = timestamp.getHours();
        hourlyData[hour].count++;
      });

      const hourlyDistribution = hourlyData.map(({ hour, count }) => ({
        hour: `${hour.toString().padStart(2, '0')}:00`,
        count
      }));

      // Daily trend (last 7 days)
      const dailyData = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        return {
          date: date.toISOString().split('T')[0],
          conversations: 0,
          messages: 0
        };
      }).reverse();

      conversations.forEach(conv => {
        const lastTime = parseTimestamp(conv.lastMessageTime);
        if (!lastTime) return;
        const dateStr = lastTime.toISOString().split('T')[0];
        const dayData = dailyData.find(d => d.date === dateStr);
        if (dayData) dayData.conversations++;
      });

      messages.forEach(msg => {
        const timestamp = parseTimestamp(msg.timestamp);
        if (!timestamp) return;
        const dateStr = timestamp.toISOString().split('T')[0];
        const dayData = dailyData.find(d => d.date === dateStr);
        if (dayData) dayData.messages++;
      });

      // Top user questions (first user message in each conversation)
      const userQuestions: { [key: string]: number } = {};
      for (const conv of conversations.slice(0, 50)) {
        const convMessagesQuery = query(
          collection(db, 'messages'),
          where('conversationId', '==', conv.id),
          where('role', '==', 'user'),
          orderBy('timestamp', 'asc')
        );
        const convMessagesSnapshot = await getDocs(convMessagesQuery);
        if (!convMessagesSnapshot.empty) {
          const firstUserMessage = convMessagesSnapshot.docs[0].data().content;
          if (firstUserMessage && firstUserMessage.length < 200) {
            userQuestions[firstUserMessage] = (userQuestions[firstUserMessage] || 0) + 1;
          }
        }
      }

      const topUserQuestions = Object.entries(userQuestions)
        .map(([question, count]) => ({ question, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const dailyTrend = dailyData;

      setAnalytics({
        totalConversations,
        totalMessages,
        averageMessagesPerConversation: totalConversations > 0 ? Math.round(totalMessages / totalConversations) : 0,
        conversationsToday,
        conversationsThisWeek,
        conversationsThisMonth,
        messagesThisWeek,
        recentConversations,
        hourlyDistribution,
        dailyTrend,
        topUserQuestions
      });

    } catch (error) {
      console.error('Error loading analytics:', error);
      // Set empty analytics if there's an error
      setAnalytics({
        totalConversations: 0,
        totalMessages: 0,
        averageMessagesPerConversation: 0,
        conversationsToday: 0,
        conversationsThisWeek: 0,
        conversationsThisMonth: 0,
        messagesThisWeek: 0,
        recentConversations: [],
        hourlyDistribution: [],
        dailyTrend: [],
        topUserQuestions: []
      });
    }
  };

  const handleBack = () => {
    router.push(`/dashboard/${workspaceSlug}/agents/${agentId}`);
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  // Show loading dialog while loading
  if (loading || !initialLoadComplete || !analytics) {
    return (
      <LoadingDialog
        open={true}
        message="Loading Analytics"
        submessage="Fetching agent performance data..."
      />
    );
  }

  if (!agent) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-background">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Agent Not Found</h1>
            <p className="text-muted-foreground mb-6">The agent you&apos;re looking for doesn&apos;t exist or has been deleted.</p>
            <Button onClick={handleBack} variant="outline" className="rounded-lg border-border">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Agent
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const maxHourlyCount = Math.max(...analytics.hourlyDistribution.map(h => h.count), 1);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-4 p-0 h-auto text-muted-foreground hover:text-foreground rounded-lg"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Agent
          </Button>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Agent Analytics</h1>
              <p className="text-muted-foreground">Performance metrics and insights for {agent.name}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Key Metrics */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border border-border">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-8 h-8 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Conversations</p>
                      <p className="text-2xl font-bold text-foreground">{analytics.totalConversations.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-border">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <Activity className="w-8 h-8 text-success" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Messages</p>
                      <p className="text-2xl font-bold text-foreground">{analytics.totalMessages.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-border">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <Zap className="w-8 h-8 text-warning" />
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Msgs/Conv</p>
                      <p className="text-2xl font-bold text-foreground">{analytics.averageMessagesPerConversation}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-border">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <Users className="w-8 h-8 text-info" />
                    <div>
                      <p className="text-sm text-muted-foreground">This Week</p>
                      <p className="text-2xl font-bold text-foreground">{analytics.conversationsThisWeek}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Conversation Trends */}
            <Card className="border border-border">
              <CardHeader>
                <CardTitle>Conversation Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-2xl font-bold text-foreground">{analytics.conversationsToday}</p>
                    <p className="text-sm text-muted-foreground">Today</p>
                    <div className="flex items-center justify-center mt-2">
                      {analytics.conversationsToday > 0 ? (
                        <TrendingUp className="w-4 h-4 text-success" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-2xl font-bold text-foreground">{analytics.conversationsThisWeek}</p>
                    <p className="text-sm text-muted-foreground">This Week</p>
                    <p className="text-xs text-muted-foreground mt-1">{analytics.messagesThisWeek} messages</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-2xl font-bold text-foreground">{analytics.conversationsThisMonth}</p>
                    <p className="text-sm text-muted-foreground">This Month</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 7-Day Trend Chart */}
            <Card className="border border-border">
              <CardHeader>
                <CardTitle>7-Day Activity Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.dailyTrend.map((day, index) => {
                    const maxDaily = Math.max(...analytics.dailyTrend.map(d => d.conversations), 1);
                    const date = new Date(day.date);
                    return (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-24 text-xs text-muted-foreground">
                          {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-muted rounded-full h-3">
                              <div
                                className="bg-primary h-3 rounded-full transition-all"
                                style={{ width: `${(day.conversations / maxDaily) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground w-16 text-right">
                              {day.conversations} conv
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Top Questions */}
            {analytics.topUserQuestions.length > 0 && (
              <Card className="border border-border">
                <CardHeader>
                  <CardTitle>Most Common User Questions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.topUserQuestions.map((item, index) => (
                      <div key={index} className="flex items-start justify-between p-3 bg-muted rounded-lg border border-border">
                        <p className="text-sm text-foreground flex-1 line-clamp-2">{item.question}</p>
                        <span className="text-sm font-semibold text-muted-foreground ml-3">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Hourly Activity */}
            <Card className="border border-border">
              <CardHeader>
                <CardTitle>Hourly Activity (24h)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {analytics.hourlyDistribution.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground w-12">{item.hour}</span>
                      <div className="flex items-center gap-2 flex-1">
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${(item.count / maxHourlyCount) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-8 text-right">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Conversations */}
            <Card className="border border-border">
              <CardHeader>
                <CardTitle>Recent Conversations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {analytics.recentConversations.length > 0 ? (
                    analytics.recentConversations.map((conv) => (
                      <div key={conv.id} className="p-3 bg-muted rounded-lg border border-border">
                        <div className="flex items-start justify-between mb-1">
                          <p className="text-sm font-medium text-foreground truncate">{conv.userName}</p>
                          <span className="text-xs text-muted-foreground ml-2">{formatTime(conv.lastMessageTime)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{conv.lastMessage}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <MessageCircle className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{conv.messageCount} messages</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No conversations yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

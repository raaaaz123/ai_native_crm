'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingDialog } from '@/app/components/ui/loading-dialog';
import { useAuth } from '@/app/lib/workspace-auth-context';
import { getAgent, Agent } from '@/app/lib/agent-utils';
import {
  ArrowLeft,
  BarChart3,
  MessageCircle,
  Users,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity
} from 'lucide-react';

export default function AgentAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = params.workspace as string;
  const agentId = params.agentId as string;
  const { workspaceContext } = useAuth();
  
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Mock analytics data
  const [analytics] = useState({
    totalConversations: 1247,
    totalMessages: 3849,
    averageResponseTime: 1.2,
    userSatisfaction: 4.6,
    conversationsToday: 23,
    conversationsThisWeek: 156,
    conversationsThisMonth: 647,
    topQuestions: [
      { question: "What are your business hours?", count: 45 },
      { question: "How can I contact support?", count: 38 },
      { question: "What services do you offer?", count: 32 },
      { question: "How much does it cost?", count: 28 },
      { question: "Do you have a mobile app?", count: 25 }
    ],
    hourlyData: [
      { hour: "00:00", conversations: 2 },
      { hour: "01:00", conversations: 1 },
      { hour: "02:00", conversations: 0 },
      { hour: "03:00", conversations: 1 },
      { hour: "04:00", conversations: 0 },
      { hour: "05:00", conversations: 1 },
      { hour: "06:00", conversations: 3 },
      { hour: "07:00", conversations: 8 },
      { hour: "08:00", conversations: 15 },
      { hour: "09:00", conversations: 22 },
      { hour: "10:00", conversations: 28 },
      { hour: "11:00", conversations: 31 },
      { hour: "12:00", conversations: 25 },
      { hour: "13:00", conversations: 29 },
      { hour: "14:00", conversations: 33 },
      { hour: "15:00", conversations: 35 },
      { hour: "16:00", conversations: 38 },
      { hour: "17:00", conversations: 42 },
      { hour: "18:00", conversations: 28 },
      { hour: "19:00", conversations: 18 },
      { hour: "20:00", conversations: 12 },
      { hour: "21:00", conversations: 8 },
      { hour: "22:00", conversations: 5 },
      { hour: "23:00", conversations: 3 }
    ]
  });

  useEffect(() => {
    const loadAgent = async () => {
      if (!agentId) {
        setLoading(false);
        setInitialLoadComplete(true);
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
        setInitialLoadComplete(true);
      }
    };

    loadAgent();
  }, [agentId]);

  const handleBack = () => {
    router.push(`/dashboard/${workspaceSlug}/agents/${agentId}`);
  };

  // Show loading dialog while loading
  if (loading || !initialLoadComplete) {
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
      <div className="min-h-[calc(100vh-4rem)] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-neutral-900 mb-4">Agent Not Found</h1>
            <p className="text-neutral-600 mb-6">The agent you&apos;re looking for doesn&apos;t exist or has been deleted.</p>
            <Button onClick={handleBack} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Agent
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-4 p-0 h-auto text-neutral-600 hover:text-neutral-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Agent
          </Button>
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-neutral-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">Agent Analytics</h1>
              <p className="text-neutral-600">Performance metrics and insights for {agent.name}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Key Metrics */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="text-sm text-neutral-600">Total Conversations</p>
                      <p className="text-2xl font-bold text-neutral-900">{analytics.totalConversations.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <Activity className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="text-sm text-neutral-600">Total Messages</p>
                      <p className="text-2xl font-bold text-neutral-900">{analytics.totalMessages.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <Clock className="w-8 h-8 text-orange-600" />
                    <div>
                      <p className="text-sm text-neutral-600">Avg Response Time</p>
                      <p className="text-2xl font-bold text-neutral-900">{analytics.averageResponseTime}s</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <Users className="w-8 h-8 text-purple-600" />
                    <div>
                      <p className="text-sm text-neutral-600">Satisfaction</p>
                      <p className="text-2xl font-bold text-neutral-900">{analytics.userSatisfaction}/5</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Conversation Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Conversation Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-neutral-50 rounded-lg">
                    <p className="text-2xl font-bold text-neutral-900">{analytics.conversationsToday}</p>
                    <p className="text-sm text-neutral-600">Today</p>
                  </div>
                  <div className="text-center p-4 bg-neutral-50 rounded-lg">
                    <p className="text-2xl font-bold text-neutral-900">{analytics.conversationsThisWeek}</p>
                    <p className="text-sm text-neutral-600">This Week</p>
                  </div>
                  <div className="text-center p-4 bg-neutral-50 rounded-lg">
                    <p className="text-2xl font-bold text-neutral-900">{analytics.conversationsThisMonth}</p>
                    <p className="text-sm text-neutral-600">This Month</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Questions */}
            <Card>
              <CardHeader>
                <CardTitle>Most Asked Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.topQuestions.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                      <p className="text-sm text-neutral-900 flex-1">{item.question}</p>
                      <span className="text-sm font-semibold text-neutral-600">{item.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Hourly Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Hourly Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.hourlyData.slice(8, 20).map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-xs text-neutral-600">{item.hour}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-neutral-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(item.conversations / 50) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-neutral-600 w-6 text-right">{item.conversations}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance Indicators */}
            <Card>
              <CardHeader>
                <CardTitle>Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Response Quality</span>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-semibold text-green-600">Excellent</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Uptime</span>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-semibold text-green-600">99.9%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">User Engagement</span>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-semibold text-green-600">High</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

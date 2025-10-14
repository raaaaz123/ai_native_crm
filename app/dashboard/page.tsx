"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/layout';
import { 
  createChatWidget, 
  getBusinessWidgets, 
  subscribeToConversations,
  ChatWidget,
  ChatConversation
} from '../lib/chat-utils';
import { 
  getBusinessReviewForms,
  getReviewFormSubmissions
} from '../lib/review-utils';
import { 
  ReviewForm,
  ReviewSubmission
} from '../lib/review-types';
import { 
  MessageCircle, 
  Plus,
  Users,
  Star,
  TrendingUp,
  Clock,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Shield
} from 'lucide-react';

export default function DashboardPage() {
  const { user, loading, companyContext } = useAuth();
  const router = useRouter();
  const [widgets, setWidgets] = useState<ChatWidget[]>([]);
  const [, setLoadingWidgets] = useState(true);
  const [showCreateWidget, setShowCreateWidget] = useState(false);
  
  // New state for analytics and data
  const [reviewForms, setReviewForms] = useState<ReviewForm[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<ReviewSubmission[]>([]);
  const [recentConversations, setRecentConversations] = useState<ChatConversation[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  
  // Dashboard metrics
  const [metrics, setMetrics] = useState({
    totalConversations: 0,
    totalReviews: 0,
    averageRating: 0,
    responseTime: '0 min',
    satisfactionScore: 0
  });
  const [newWidget, setNewWidget] = useState({
    name: '',
    welcomeMessage: 'Hello! How can we help you today?',
    primaryColor: '#3b82f6',
    position: 'bottom-right' as 'bottom-right' | 'bottom-left',
    buttonText: 'Chat with us',
    placeholderText: 'Type your message...',
    offlineMessage: 'We are currently offline. Please leave a message and we will get back to you.',
    collectEmail: true,
    collectPhone: false,
    autoReply: 'Thanks for your message! We will get back to you soon.',
    businessHours: {
      enabled: false,
      timezone: 'UTC',
      monday: { start: '09:00', end: '17:00', enabled: true },
      tuesday: { start: '09:00', end: '17:00', enabled: true },
      wednesday: { start: '09:00', end: '17:00', enabled: true },
      thursday: { start: '09:00', end: '17:00', enabled: true },
      friday: { start: '09:00', end: '17:00', enabled: true },
      saturday: { start: '09:00', end: '17:00', enabled: false },
      sunday: { start: '09:00', end: '17:00', enabled: false }
    },
    aiConfig: {
      enabled: true,
      provider: 'openrouter',
      model: 'x-ai/grok-4-fast:free',
      temperature: 0.7,
      maxTokens: 500,
      confidenceThreshold: 0.6,
      maxRetrievalDocs: 5,
      ragEnabled: true,
      fallbackToHuman: true
    }
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin');
    }
  }, [user, loading, router]);

  // Define functions before they are used
  const loadWidgets = async () => {
    if (!user?.uid || !companyContext?.company?.id) {
      console.log('Missing required data for widget loading:', { 
        userId: !!user?.uid, 
        companyId: !!companyContext?.company?.id 
      });
      setLoadingWidgets(false);
      return;
    }
    
    try {
      console.log('Loading widgets for company:', companyContext.company.id);
      const result = await getBusinessWidgets(companyContext.company.id);
      console.log('Widget loading result:', result);
      
      if (result.success) {
        console.log('Widgets loaded successfully:', result.data);
        setWidgets(result.data);
        
        // Update metrics with widget count
        setMetrics(prev => ({
          ...prev,
          totalWidgets: result.data.length
        }));
      } else {
        console.error('Failed to load widgets:', result.error);
        setWidgets([]);
      }
    } catch (error) {
      console.error('Error loading widgets:', error);
      setWidgets([]);
    } finally {
      setLoadingWidgets(false);
    }
  };

  const loadDashboardData = async () => {
    if (!user?.uid || !companyContext?.company?.id) {
      console.log('Missing required data for dashboard loading:', { 
        userId: !!user?.uid, 
        companyId: !!companyContext?.company?.id 
      });
      setLoadingData(false);
      return;
    }
    
    setLoadingData(true);
    try {
      // Load widgets
      await loadWidgets();
      
      // Load review forms and calculate review metrics
      console.log('Loading review forms for company:', companyContext.company.id);
      const reviewResult = await getBusinessReviewForms(companyContext.company.id);
      console.log('Review forms result:', reviewResult);
      
      if (reviewResult.success && reviewResult.data) {
        setReviewForms(reviewResult.data);
        
        // Load recent submissions for all forms
        const allSubmissions: ReviewSubmission[] = [];
        for (const form of reviewResult.data) {
          const submissionsResult = await getReviewFormSubmissions(form.id);
          if (submissionsResult.success && submissionsResult.data) {
            allSubmissions.push(...submissionsResult.data);
          }
        }
        
        // Sort by submission date and get recent ones
        const recentSubs = allSubmissions
          .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
          .slice(0, 5);
        setRecentSubmissions(recentSubs);
        
        // Calculate review metrics
        const totalReviews = allSubmissions.length;
        const ratingSubmissions = allSubmissions.filter(sub => 
          sub.responses.some((r: { fieldType: string; value: string | number | boolean | string[] }) => r.fieldType === 'rating')
        );
        const averageRating = ratingSubmissions.length > 0 
          ? ratingSubmissions.reduce((sum, sub) => {
              const ratingField = sub.responses.find((r: { fieldType: string; value: string | number | boolean | string[] }) => r.fieldType === 'rating');
              return sum + (ratingField ? parseFloat(String(ratingField.value)) : 0);
            }, 0) / ratingSubmissions.length
          : 0;
        
        // Calculate response time (mock calculation - you can implement real logic)
        const responseTime = '2.5 min';
        
        console.log('Calculated metrics:', { totalReviews, averageRating, responseTime });
        
        setMetrics(prev => ({
          ...prev,
          totalReviews,
          averageRating: Math.round(averageRating * 10) / 10,
          responseTime,
          satisfactionScore: averageRating
        }));
      } else {
        console.log('No review forms found, using default metrics');
        // If no review forms, still update metrics
        setMetrics(prev => ({
          ...prev,
          responseTime: '2.5 min'
        }));
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (user?.uid && companyContext?.company?.id) {
      loadDashboardData();
      
      // Subscribe to real-time conversations for the company
      const unsubscribeConversations = subscribeToConversations(companyContext.company.id, (conversations) => {
        setRecentConversations(conversations.slice(0, 5));
        
        // Update conversation metrics
        const totalConversations = conversations.length;
        const activeConversations = conversations.filter(c => c.status === 'active').length;
        
        setMetrics(prev => ({
          ...prev,
          totalConversations,
          activeConversations
        }));
      });
      
      return () => {
        unsubscribeConversations();
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, companyContext?.company?.id]);

  // Show company setup if no company context
  if (!loading && user && !companyContext) {
    return (
      <Container>
        <div className="text-center py-12">
          <Shield className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Welcome to Your Dashboard</h1>
          <p className="text-neutral-600 mb-8">
            You need to create or join a company to start using the dashboard.
          </p>
          <div className="flex space-x-4 justify-center">
            <Button 
              onClick={() => router.push('/dashboard/settings/company')}
              className="bg-primary-500 hover:bg-primary-600"
            >
              Create Company
            </Button>
            <Button 
              variant="outline"
              onClick={() => router.push('/dashboard/settings/team')}
            >
              Join Company
            </Button>
          </div>
        </div>
      </Container>
    );
  }


  const handleCreateWidget = async () => {
    if (!user?.uid || creating) return;
    
    setCreating(true);
    try {
      const result = await createChatWidget(user.uid, newWidget);
      
      if (result.success) {
        setWidgets(prev => [result.data, ...prev]);
        setShowCreateWidget(false);
      } else {
        console.error('Failed to create widget:', result.error);
        alert('Failed to create widget: ' + result.error);
      }
      setNewWidget({
        name: '',
        welcomeMessage: 'Hello! How can we help you today?',
        primaryColor: '#3B82F6',
        position: 'bottom-right' as 'bottom-right' | 'bottom-left',
        buttonText: 'Chat with us',
        placeholderText: 'Type your message...',
        offlineMessage: 'We are currently offline. Please leave a message and we will get back to you.',
        collectEmail: true,
        collectPhone: false,
        autoReply: 'Thanks for your message! We will get back to you soon.',
        businessHours: {
          enabled: false,
          timezone: 'UTC',
          monday: { start: '09:00', end: '17:00', enabled: true },
          tuesday: { start: '09:00', end: '17:00', enabled: true },
          wednesday: { start: '09:00', end: '17:00', enabled: true },
          thursday: { start: '09:00', end: '17:00', enabled: true },
          friday: { start: '09:00', end: '17:00', enabled: true },
          saturday: { start: '09:00', end: '17:00', enabled: false },
          sunday: { start: '09:00', end: '17:00', enabled: false }
        },
        aiConfig: {
          enabled: true,
          provider: 'openrouter',
          model: 'x-ai/grok-4-fast:free',
          temperature: 0.7,
          maxTokens: 500,
          confidenceThreshold: 0.6,
          maxRetrievalDocs: 5,
          ragEnabled: true,
          fallbackToHuman: true
        }
      });
    } catch (error) {
      console.error('Error creating widget:', error);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Show company setup guidance for users without a company
  if (!companyContext) {
    return (
      <Container>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Welcome to Your Dashboard</h1>
          <p className="text-neutral-600">Get started by setting up your company or joining an existing team</p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 mb-6">
            <CardContent className="p-8">
              <div className="flex items-start space-x-4">
                <Shield className="w-12 h-12 text-blue-600 mt-1" />
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-blue-900 mb-2">Complete Your Setup</h2>
                  <p className="text-blue-700 mb-4">
                    To access all dashboard features, you need to either create your own company or join an existing one.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      onClick={() => router.push('/dashboard/settings/team')}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Set Up Company
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-primary-500" />
                  <span>Create Company</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-600 mb-4">
                  Start your own company and invite team members to collaborate on customer support and reviews.
                </p>
                <ul className="text-sm text-neutral-600 space-y-1 mb-4">
                  <li>• Create chat widgets for your website</li>
                  <li>• Manage customer conversations</li>
                  <li>• Collect and analyze reviews</li>
                  <li>• Invite team members</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-primary-500" />
                  <span>Join Company</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-600 mb-4">
                  Join an existing company team using an invitation token or link from your team leader.
                </p>
                <ul className="text-sm text-neutral-600 space-y-1 mb-4">
                  <li>• Access company chat widgets</li>
                  <li>• Respond to customer messages</li>
                  <li>• View team analytics</li>
                  <li>• Collaborate with teammates</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">Dashboard</h1>
            <p className="text-neutral-600">
              Overview of your business performance and recent activities
              {companyContext?.company && (
                <span className="ml-2 text-sm text-neutral-500">
                  • {companyContext.company.name}
                </span>
              )}
            </p>
          </div>
          <div className="flex space-x-3">
            <Button 
              onClick={() => setShowCreateWidget(true)}
              className="bg-primary-500 hover:bg-primary-600 text-white flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Widget</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Conversations</p>
                <p className="text-2xl font-bold text-blue-900">{metrics.totalConversations}</p>
                <p className="text-xs text-blue-600 flex items-center mt-1">
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  {metrics.totalConversations > 0 ? '+12% from last month' : 'No conversations yet'}
                </p>
              </div>
              <MessageCircle className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Total Reviews</p>
                <p className="text-2xl font-bold text-green-900">{metrics.totalReviews}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  {metrics.totalReviews > 0 ? '+8% from last month' : 'No reviews yet'}
                </p>
              </div>
              <Star className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Average Rating</p>
                <p className="text-2xl font-bold text-purple-900">{metrics.averageRating.toFixed(1)}</p>
                <p className="text-xs text-purple-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {metrics.averageRating > 0 ? '+0.3 from last month' : 'No ratings yet'}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Response Time</p>
                <p className="text-2xl font-bold text-orange-900">{metrics.responseTime}</p>
                <p className="text-xs text-orange-600 flex items-center mt-1">
                  <ArrowDownRight className="w-3 h-3 mr-1" />
                  {metrics.totalConversations > 0 ? '-15% faster' : 'No data yet'}
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activities */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Reviews */}
          <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Star className="w-6 h-6 text-primary-500" />
                  <CardTitle>Recent Reviews</CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={loadDashboardData}>
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                  <p className="text-neutral-600 mt-2">Loading reviews...</p>
                </div>
              ) : recentSubmissions.length === 0 ? (
                <div className="text-center py-8">
                  <Star className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                  <p className="text-neutral-600 mb-4">No recent reviews</p>
                  <p className="text-sm text-neutral-500">Reviews will appear here as customers submit feedback</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentSubmissions.map((submission, index) => (
                    <div key={submission.id || `submission-${index}`} className="flex items-center space-x-4 p-4 bg-neutral-50 rounded-lg">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <Star className="w-5 h-5 text-primary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900">
                          New review submission
                        </p>
                        <p className="text-xs text-neutral-500">
                          {new Date(submission.submittedAt).toLocaleString()}
                        </p>
                        {submission.userInfo && (
                          <p className="text-xs text-neutral-600 mt-1">
                            From: {typeof submission.userInfo.location === 'string' ? submission.userInfo.location : 'Unknown location'}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="text-sm font-medium">
                            {submission.responses.find((r: { fieldType: string; value: string | number | boolean | string[] }) => r.fieldType === 'rating')?.value || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Conversations */}
          <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <MessageCircle className="w-6 h-6 text-primary-500" />
                  <CardTitle>Recent Conversations</CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={loadDashboardData}>
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                  <p className="text-neutral-600 mt-2">Loading conversations...</p>
                </div>
              ) : recentConversations.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                  <p className="text-neutral-600 mb-4">No recent conversations</p>
                  <p className="text-sm text-neutral-500">Conversations will appear here as customers start chatting</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentConversations.map((conversation, index) => (
                    <div 
                      key={conversation.id || `conversation-${index}`} 
                      className="flex items-center space-x-4 p-4 bg-neutral-50 rounded-lg cursor-pointer hover:bg-neutral-100 transition-colors"
                      onClick={() => router.push('/dashboard/conversations')}
                    >
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900">
                          {conversation.customerName}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {conversation.customerEmail}
                        </p>
                        {conversation.lastMessage && (
                          <p className="text-xs text-neutral-600 mt-1 line-clamp-1">
                            {conversation.lastMessage}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-1">
                          <span className="text-xs text-neutral-500">
                            {new Date(conversation.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="mt-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            conversation.status === 'active' ? 'bg-green-100 text-green-800' :
                            conversation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            conversation.status === 'resolved' ? 'bg-blue-100 text-blue-800' :
                            conversation.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {conversation.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="space-y-6">
          {/* Review Forms Summary */}
          <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <BarChart3 className="w-6 h-6 text-primary-500" />
                <CardTitle>Review Forms</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Active Forms</span>
                  <span className="font-semibold text-neutral-900">{reviewForms.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Total Submissions</span>
                  <span className="font-semibold text-neutral-900">{metrics.totalReviews}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Avg Rating</span>
                  <span className="font-semibold text-neutral-900">{metrics.averageRating.toFixed(1)} ⭐</span>
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => router.push('/dashboard/review-forms')}
                >
                  Manage Forms
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Chat Widgets Summary */}
          <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <MessageCircle className="w-6 h-6 text-primary-500" />
                <CardTitle>Chat Widgets</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Active Widgets</span>
                  <span className="font-semibold text-neutral-900">{widgets.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Total Conversations</span>
                  <span className="font-semibold text-neutral-900">{metrics.totalConversations}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Response Time</span>
                  <span className="font-semibold text-neutral-900">{metrics.responseTime}</span>
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => setShowCreateWidget(true)}
                >
                  Create Widget
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Widget Modal */}
      {showCreateWidget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Create Chat Widget</h3>
              <button
                onClick={() => setShowCreateWidget(false)}
                className="text-neutral-500 hover:text-neutral-700"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1">Widget Name</label>
                <input
                  id="name"
                  type="text"
                  value={newWidget.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewWidget({ ...newWidget, name: e.target.value })}
                  placeholder="Customer Support Chat"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="welcomeMessage" className="block text-sm font-medium text-neutral-700 mb-1">Welcome Message</label>
                <textarea
                  id="welcomeMessage"
                  value={newWidget.welcomeMessage}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewWidget({ ...newWidget, welcomeMessage: e.target.value })}
                  placeholder="Hello! How can we help you today?"
                  rows={3}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="primaryColor" className="block text-sm font-medium text-neutral-700 mb-1">Primary Color</label>
                <input
                  id="primaryColor"
                  type="color"
                  value={newWidget.primaryColor}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewWidget({ ...newWidget, primaryColor: e.target.value })}
                  className="w-full h-10 border border-neutral-300 rounded-md"
                />
              </div>
            </div>
            <Button 
              onClick={handleCreateWidget} 
              disabled={!newWidget.name || creating}
              className="w-full mt-4"
            >
              {creating ? 'Creating...' : 'Create Widget'}
            </Button>
          </div>
        </div>
      )}
    </Container>
  );
}
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingDialog } from '@/app/components/ui/loading-dialog';
import { useAuth } from '@/app/lib/workspace-auth-context';
import { getAgent, Agent } from '@/app/lib/agent-utils';
import { 
  ArrowLeft, 
  Bot, 
  MessageCircle, 
  Settings, 
  Play, 
  Share2,
  Users,
  FileText,
  Globe,
  MessageSquare,
  Upload
} from 'lucide-react';

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = params.workspace as string;
  const agentId = params.agentId as string;
  const { workspaceContext } = useAuth();
  
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

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
    router.push(`/dashboard/${workspaceSlug}/agents`);
  };

  const handlePlayground = () => {
    router.push(`/dashboard/${workspaceSlug}/agents/${agentId}/playground`);
  };

  const handleDeploy = () => {
    router.push(`/dashboard/${workspaceSlug}/agents/${agentId}/deploy`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'training':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return '🟢';
      case 'inactive':
        return '⚪';
      case 'training':
        return '🔄';
      default:
        return '⚪';
    }
  };

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'files':
        return <Upload className="w-4 h-4" />;
      case 'text':
        return <FileText className="w-4 h-4" />;
      case 'website':
        return <Globe className="w-4 h-4" />;
      case 'faq':
        return <MessageSquare className="w-4 h-4" />;
      case 'notion':
        return <FileText className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  // Show loading dialog while loading
  if (loading || !initialLoadComplete) {
    return (
      <LoadingDialog
        open={true}
        message="Loading Agent"
        submessage="Fetching agent details..."
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
              Back to Agents
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
            Back to Agents
          </Button>
          
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-neutral-100 flex items-center justify-center">
                <Bot className="w-8 h-8 text-neutral-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-neutral-900 mb-2">{agent.name}</h1>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(agent.status)}`}>
                    {getStatusIcon(agent.status)} {agent.status}
                  </span>
                  <span className="text-sm text-neutral-500">
                    Created {new Date(agent.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button onClick={handlePlayground} variant="outline" className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                Playground
              </Button>
              <Button onClick={handleDeploy} className="bg-neutral-900 hover:bg-neutral-800 text-white flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                Deploy
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {agent.description && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-neutral-900 mb-3">Description</h3>
                  <p className="text-neutral-600">{agent.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Knowledge Sources */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-neutral-900">Knowledge Sources</h3>
                  <span className="text-sm text-neutral-500">{agent.knowledgeSources.length} sources</span>
                </div>
                
                {agent.knowledgeSources.length > 0 ? (
                  <div className="space-y-3">
                    {agent.knowledgeSources.map((source) => (
                      <div key={source.id} className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                        <div className="text-neutral-600">
                          {getSourceIcon(source.type)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-neutral-900">{source.title}</h4>
                          <p className="text-sm text-neutral-500 capitalize">{source.type}</p>
                        </div>
                        <div className="text-xs text-neutral-400">
                          {new Date(source.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-neutral-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
                    <p>No knowledge sources added yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">Statistics</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-neutral-500" />
                      <span className="text-sm text-neutral-600">Conversations</span>
                    </div>
                    <span className="font-semibold text-neutral-900">{agent.stats.totalConversations}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-neutral-500" />
                      <span className="text-sm text-neutral-600">Knowledge Sources</span>
                    </div>
                    <span className="font-semibold text-neutral-900">{agent.knowledgeSources.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-neutral-500" />
                      <span className="text-sm text-neutral-600">Model</span>
                    </div>
                    <span className="font-semibold text-neutral-900">{agent.settings.model}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Settings */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">Settings</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-600">Temperature</span>
                    <span className="text-sm font-medium">{agent.settings.temperature}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-600">Max Tokens</span>
                    <span className="text-sm font-medium">{agent.settings.maxTokens}</span>
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

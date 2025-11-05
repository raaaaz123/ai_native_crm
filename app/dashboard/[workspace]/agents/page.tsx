'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingDialog } from '@/app/components/ui/loading-dialog';
import { useAuth } from '@/app/lib/workspace-auth-context';
import { getWorkspaceAgents, Agent } from '@/app/lib/agent-utils';
import { Plus, Bot, MessageCircle, Users, Play, Share2 } from 'lucide-react';

export default function AgentsPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = params.workspace as string;
  const { workspaceContext } = useAuth();
  
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  useEffect(() => {
    const loadAgents = async () => {
      if (!workspaceContext?.currentWorkspace?.id) {
      setLoading(false);
      setInitialLoadComplete(true);
        return;
      }

    try {
      setLoading(true);
        const response = await getWorkspaceAgents(workspaceContext?.currentWorkspace?.id);
        
        if (response.success) {
          setAgents(response.data);
      } else {
          console.error('Failed to load agents:', response.error);
          setAgents([]);
        }
      } catch (error) {
        console.error('Error loading agents:', error);
        setAgents([]);
    } finally {
      setLoading(false);
      setInitialLoadComplete(true);
    }
  };

    loadAgents();
  }, [workspaceContext?.currentWorkspace?.id]);

  const handleCreateAgent = () => {
    // Navigate to knowledge base page
    window.location.href = `/dashboard/${workspaceSlug}/create-new-agent/knowledgebase`;
  };

  const handleAgentClick = (agentId: string) => {
    console.log('Agent clicked:', agentId);
    const url = `/dashboard/${workspaceSlug}/agents/${agentId}/playground`;
    console.log('Navigating to:', url);
    router.push(url);
  };

  const handlePlaygroundClick = (agentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Playground clicked for agent:', agentId);
    const url = `/dashboard/${workspaceSlug}/agents/${agentId}/playground`;
    console.log('Navigating to:', url);
    router.push(url);
  };

  const handleDeployClick = (agentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Deploy clicked for agent:', agentId);
    const url = `/dashboard/${workspaceSlug}/agents/${agentId}/deploy`;
    console.log('Navigating to:', url);
    router.push(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-50 text-green-700 border border-green-200';
      case 'inactive':
        return 'bg-muted text-muted-foreground border border-border';
      case 'training':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      default:
        return 'bg-muted text-muted-foreground border border-border';
    }
  };

  // Show loading dialog while loading
  if (loading || !initialLoadComplete) {
    return (
        <LoadingDialog 
          open={true}
          message="Loading Agents" 
        submessage="Fetching your AI agents..."
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-foreground mb-2">
              AI Agents
            </h1>
            <p className="text-muted-foreground">
              Create and manage your AI agents
            </p>
          </div>
          <Button 
            onClick={handleCreateAgent} 
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 h-10"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Agent
          </Button>
        </div>

        {/* Agents Grid or Empty State */}
        {agents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <Card 
                key={agent.id} 
                className="bg-card border hover:shadow-md transition-all duration-200 cursor-pointer group"
                onClick={() => handleAgentClick(agent.id)}
              >
                <CardContent className="p-4">
                  {/* Agent Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-medium text-foreground truncate">{agent.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(agent.status)}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              agent.status === 'active' ? 'bg-green-500' : 
                              agent.status === 'training' ? 'bg-blue-500' : 'bg-gray-400'
                            }`} />
                            {agent.status}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Description */}
                  {agent.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {agent.description}
                    </p>
                  )}
                  
                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        <span>{agent.stats.totalConversations}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{agent.knowledgeSources.length}</span>
                      </div>
                    </div>
                    <div className="text-xs">
                      {new Date(agent.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 h-8 text-xs"
                      onClick={(e) => handlePlaygroundClick(agent.id, e)}
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Test
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 h-8 text-xs"
                      onClick={(e) => handleDeployClick(agent.id, e)}
                    >
                      <Share2 className="w-3 h-3 mr-1" />
                      Deploy
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                <Bot className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No agents yet</h3>
              <p className="text-muted-foreground mb-6 text-sm">
                Create your first AI agent to start automating customer support and generating leads.
              </p>
              <Button 
                onClick={handleCreateAgent} 
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Agent
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

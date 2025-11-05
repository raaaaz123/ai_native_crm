'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingDialog } from '@/app/components/ui/loading-dialog';
import { useAuth } from '@/app/lib/workspace-auth-context';
import { getWorkspaceAgents, Agent, deleteAgent, duplicateAgent } from '@/app/lib/agent-utils';
import { Plus, Bot, MessageCircle, Users, MoreVertical, Trash2, Copy, Settings, BarChart3, MessageSquare } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function AgentsPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = params.workspace as string;
  const { workspaceContext } = useAuth();

  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
    router.push(`/dashboard/${workspaceSlug}/agents/${agentId}/playground`);
  };

  const handleDuplicateAgent = async (agent: Agent, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    try {
      const response = await duplicateAgent(agent.id);
      if (response.success) {
        // Reload agents to show the new duplicate
        const agentsResponse = await getWorkspaceAgents(workspaceContext?.currentWorkspace?.id || '');
        if (agentsResponse.success) {
          setAgents(agentsResponse.data);
        }
      } else {
        console.error('Failed to duplicate agent:', response.error);
      }
    } catch (error) {
      console.error('Error duplicating agent:', error);
    }
  };

  const handleDeleteClick = (agent: Agent, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setAgentToDelete(agent);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!agentToDelete) return;

    setIsDeleting(true);
    try {
      const response = await deleteAgent(agentToDelete.id);
      if (response.success) {
        // Remove agent from list
        setAgents(agents.filter(a => a.id !== agentToDelete.id));
        setDeleteDialogOpen(false);
        setAgentToDelete(null);
      } else {
        console.error('Failed to delete agent:', response.error);
      }
    } catch (error) {
      console.error('Error deleting agent:', error);
    } finally {
      setIsDeleting(false);
    }
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
    <>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                AI Agents
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Create and manage your AI agents
              </p>
            </div>
            <Button
              onClick={handleCreateAgent}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 h-9"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Agent
            </Button>
          </div>

          {/* Agents Grid or Empty State */}
          {agents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agents.map((agent) => (
                <Card
                  key={agent.id}
                  className="bg-card border border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300 cursor-pointer group overflow-hidden"
                  onClick={() => handleAgentClick(agent.id)}
                >
                  <CardContent className="p-0">
                    {/* Agent Header with Gradient */}
                    <div className="p-6 pb-4 bg-gradient-to-br from-primary/5 to-transparent">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center flex-shrink-0 shadow-lg">
                            <Bot className="w-6 h-6 text-primary-foreground" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-lg font-semibold text-foreground truncate mb-1">
                              {agent.name}
                            </h3>
                            <div className="flex items-center gap-2">
                              <div className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1.5 ${
                                agent.status === 'active'
                                  ? 'bg-green-100 text-green-700'
                                  : agent.status === 'training'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${
                                  agent.status === 'active' ? 'bg-green-500' :
                                  agent.status === 'training' ? 'bg-blue-500' : 'bg-gray-400'
                                }`} />
                                <span className="capitalize">{agent.status}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/80"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onSelect={() => router.push(`/dashboard/${workspaceSlug}/agents/${agent.id}/settings`)}
                            >
                              <Settings className="w-4 h-4 mr-2" />
                              Settings
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => router.push(`/dashboard/${workspaceSlug}/agents/${agent.id}/analytics`)}
                            >
                              <BarChart3 className="w-4 h-4 mr-2" />
                              Analytics
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => router.push(`/dashboard/${workspaceSlug}/agents/${agent.id}/conversations`)}
                            >
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Conversations
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => handleDuplicateAgent(agent)}>
                              <Copy className="w-4 h-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onSelect={() => handleDeleteClick(agent)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                        {agent.description || 'No description provided'}
                      </p>
                    </div>

                    {/* Stats Section */}
                    <div className="px-6 py-4 bg-muted/30 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MessageCircle className="w-4 h-4" />
                          <span className="font-medium">{agent.stats.totalConversations}</span>
                          <span className="text-xs">conversations</span>
                        </div>
                        <div className="w-px h-4 bg-border" />
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span className="font-medium">{agent.knowledgeSources.length}</span>
                          <span className="text-xs">sources</span>
                        </div>
                      </div>
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
                <p className="text-sm text-muted-foreground mb-6">
                  Create your first AI agent to start automating customer support and generating leads.
                </p>
                <Button
                  onClick={handleCreateAgent}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 h-9"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Agent
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Agent</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{agentToDelete?.name}&quot;? This action cannot be undone and will
              remove all associated conversations and data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

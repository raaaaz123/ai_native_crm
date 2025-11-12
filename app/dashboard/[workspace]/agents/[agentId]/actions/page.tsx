'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap,
  Globe,
  Mail,
  MessageSquare,
  Calendar,
  FileText,
  Database,
  ExternalLink,
  Users,
  ArrowRight,
  Copy,
  Settings,
  Eye,
  EyeOff,
  MousePointerClick,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '@/app/lib/workspace-auth-context';
import { getAgent, Agent } from '@/app/lib/agent-utils';
import { getAgentActions, AgentAction, deleteAgentAction, updateAgentAction, createAgentAction } from '@/app/lib/action-utils';
import { toast } from 'sonner';

export default function AgentActionsPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = params.workspace as string;
  const agentId = params.agentId as string;
  const { workspaceContext } = useAuth();
  
  const [agent, setAgent] = useState<Agent | null>(null);
  const [actions, setActions] = useState<AgentAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [actionToDelete, setActionToDelete] = useState<AgentAction | null>(null);
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const loadAgent = useCallback(async () => {
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
  }, [agentId]);

  const loadActions = useCallback(async () => {
    if (!agentId) return;

    try {
      const response = await getAgentActions(agentId);
      if (response.success) {
        setActions(response.data);
      } else {
        console.error('Failed to load actions:', response.error);
        setActions([]);
      }
    } catch (error) {
      console.error('Error loading actions:', error);
      setActions([]);
    }
  }, [agentId]);

  useEffect(() => {
    loadAgent();
    loadActions();
  }, [agentId, workspaceContext, loadAgent, loadActions]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId && menuRefs.current[openMenuId] && !menuRefs.current[openMenuId]?.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuId]);

  const handleEditAction = (action: AgentAction) => {
    setOpenMenuId(null);
    
    // Navigate to the appropriate edit route based on action type
    const actionTypeRoute = action.type === 'calendly-slots' ? 'calendly-slots' :
                           action.type === 'custom-button' ? 'custom-button' :
                           action.type === 'collect-leads' ? 'collect-leads' :
                           action.type === 'zendesk-create-ticket' ? 'zendesk-create-ticket' :
                           action.type;
    
    router.push(`/dashboard/${workspaceSlug}/agents/${agentId}/actions/${actionTypeRoute}?edit=${action.id}`);
  };

  const handleDeleteAction = (action: AgentAction) => {
    setActionToDelete(action);
    setShowDeleteDialog(true);
    setOpenMenuId(null);
  };

  const handleDuplicateAction = async (action: AgentAction) => {
    try {
      const duplicateData = {
        type: action.type,
        name: `${action.name} (Copy)`,
        description: action.description,
        configuration: action.configuration
      };

      const response = await createAgentAction(agentId, workspaceContext?.currentWorkspace?.id || '', duplicateData);
      
      if (response.success) {
        toast.success('Action duplicated successfully');
        loadActions();
      } else {
        toast.error('Failed to duplicate action: ' + response.error);
      }
    } catch (error) {
      console.error('Error duplicating action:', error);
      toast.error('Failed to duplicate action');
    }
    setOpenMenuId(null);
  };

  const handleToggleStatus = async (action: AgentAction) => {
    try {
      const newStatus = action.status === 'active' ? 'inactive' : 'active';
      const response = await updateAgentAction(action.id, { status: newStatus });
      
      if (response.success) {
        toast.success(`Action ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
        loadActions();
      } else {
        toast.error('Failed to update action status: ' + response.error);
      }
    } catch (error) {
      console.error('Error updating action status:', error);
      toast.error('Failed to update action status');
    }
    setOpenMenuId(null);
  };

  const confirmDeleteAction = async () => {
    if (!actionToDelete) return;

    try {
      const response = await deleteAgentAction(actionToDelete.id);
      
      if (response.success) {
        toast.success('Action deleted successfully');
        loadActions();
      } else {
        toast.error('Failed to delete action: ' + response.error);
      }
    } catch (error) {
      console.error('Error deleting action:', error);
      toast.error('Failed to delete action');
    }
    
    setShowDeleteDialog(false);
    setActionToDelete(null);
  };


  const getActionIcon = (type: string) => {
    switch (type) {
      case 'collect-leads': return <Users className="w-5 h-5" />;
      case 'custom-button': return <MousePointerClick className="w-5 h-5" />;
      case 'calendly-slots': return <Calendar className="w-5 h-5" />;
      case 'zendesk-create-ticket': return <FileText className="w-5 h-5" />;
      case 'custom-action': return <Zap className="w-5 h-5" />;
      default: return <Zap className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success/10 text-success border border-success/20';
      case 'inactive': return 'bg-muted text-muted-foreground border border-border';
      case 'draft': return 'bg-warning/10 text-warning border border-warning/20';
      default: return 'bg-muted text-muted-foreground border border-border';
    }
  };

  const handleActionSelect = (actionType: string) => {
    if (actionType === 'collect-leads') {
      router.push(`/dashboard/${workspaceSlug}/agents/${agentId}/actions/collect-leads`);
    } else if (actionType === 'custom-button') {
      router.push(`/dashboard/${workspaceSlug}/agents/${agentId}/actions/custom-button`);
    } else if (actionType === 'calendly-slots') {
      router.push(`/dashboard/${workspaceSlug}/agents/${agentId}/actions/calendly-slots`);
    } else if (actionType === 'zendesk-create-ticket') {
      router.push(`/dashboard/${workspaceSlug}/agents/${agentId}/actions/zendesk-create-ticket`);
    }
    setShowCreateDialog(false);
  };

  const filteredActions = actions.filter(action => {
    const matchesSearch = action.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         action.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || action.type === filterType;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground font-medium">Loading actions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">Agent Actions</h1>
          <p className="text-muted-foreground text-lg">Create and manage automated workflows for your AI agent</p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Search actions by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 rounded-lg border-border bg-card shadow-sm focus:border-primary focus:ring-primary"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48 h-12 rounded-lg border-border bg-card shadow-sm">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent className="rounded-lg">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="collect-leads">Collect Leads</SelectItem>
                <SelectItem value="custom-button">Custom Button</SelectItem>
                <SelectItem value="calendly-slots">Calendly Slots</SelectItem>
                <SelectItem value="zendesk-create-ticket">Zendesk Create Ticket</SelectItem>
                <SelectItem value="custom-action">Custom Action</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-primary hover:bg-primary/90 h-12 px-6 rounded-lg shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Action
            </Button>
          </div>
        </div>

        {/* Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredActions.map((action) => (
            <Card key={action.id} className="border border-border shadow-md hover:shadow-xl transition-all duration-300 rounded-lg overflow-hidden bg-card h-[420px] flex flex-col">
              <CardHeader className="pb-3 flex-shrink-0">
                  <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground shadow-md">
                      {getActionIcon(action.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-bold text-foreground truncate">{action.name}</CardTitle>
                      <p className="text-sm text-muted-foreground capitalize mt-0.5">{action.type.replace(/-/g, ' ')}</p>
                    </div>
                  </div>
                  <div className="relative flex-shrink-0" ref={(el) => { menuRefs.current[action.id] = el; }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0 rounded-lg hover:bg-muted"
                      onClick={() => setOpenMenuId(openMenuId === action.id ? null : action.id)}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>

                    {/* Dropdown Menu */}
                    {openMenuId === action.id && (
                      <div className="absolute right-0 top-10 w-48 bg-card rounded-lg shadow-xl border border-border py-1.5 z-50">
                        <button
                          onClick={() => handleEditAction(action)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted w-full text-left transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                          Edit Action
                        </button>
                        <button
                          onClick={() => handleDuplicateAction(action)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted w-full text-left transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                          Duplicate
                        </button>
                        <button
                          onClick={() => handleToggleStatus(action)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted w-full text-left transition-colors"
                        >
                          {action.status === 'active' ? (
                            <>
                              <EyeOff className="w-4 h-4" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4" />
                              Activate
                            </>
                          )}
                        </button>
                        <div className="border-t border-border my-1.5"></div>
                        <button
                          onClick={() => handleDeleteAction(action)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 w-full text-left transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <Badge className={`${getStatusColor(action.status)} w-fit`}>
                  {action.status}
                </Badge>
              </CardHeader>
              <CardContent className="pt-0 flex-1 flex flex-col">
                {/* Fixed height description with line clamping */}
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2 h-10 leading-5">{action.description}</p>

                {/* Metadata section */}
                <div className="space-y-2.5 mb-5 py-4 px-4 bg-muted rounded-lg flex-shrink-0 border border-border">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Status</span>
                    <span className="font-semibold capitalize text-foreground">{action.status}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Created</span>
                    <span className="font-semibold text-foreground">{new Date(action.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Last Updated</span>
                    <span className="font-semibold text-foreground">{new Date(action.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 mt-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-10 rounded-lg border-border hover:border-primary hover:bg-primary/10 hover:text-primary transition-all"
                    onClick={() => handleEditAction(action)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`h-10 px-4 rounded-lg transition-all border-border ${
                      action.status === 'active'
                        ? 'text-warning hover:bg-warning/10 hover:border-warning'
                        : 'text-success hover:bg-success/10 hover:border-success'
                    }`}
                    onClick={() => handleToggleStatus(action)}
                  >
                    {action.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredActions.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Zap className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-3">No actions found</h3>
            <p className="text-muted-foreground mb-8 text-lg">Create your first action to automate workflows and enhance your AI agent</p>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-primary hover:bg-primary/90 h-12 px-8 rounded-lg shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Action
            </Button>
          </div>
        )}
      </div>

      {/* Create Action Dialog - Minimal Design */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-5xl w-full max-h-[90vh] overflow-y-auto bg-background">
          <DialogHeader className="pb-4 border-b border-border">
            <DialogTitle className="text-xl font-semibold text-foreground">Create Action</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              Choose an action type to automate workflows and enhance your AI agent&apos;s capabilities
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-3">
            {/* Collect Leads */}
            <div
              className="flex items-center gap-4 p-4 border border-border rounded-lg cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors group"
              onClick={() => handleActionSelect('collect-leads')}
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground">Collect Leads</h3>
                  <Badge variant="outline" className="text-xs border-green-200 text-green-700 dark:border-green-800 dark:text-green-400">
                    Ready
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  Automatically collect contact information from website visitors
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
            </div>

            {/* Custom Button */}
            <div
              className="flex items-center gap-4 p-4 border border-border rounded-lg cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors group"
              onClick={() => handleActionSelect('custom-button')}
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MousePointerClick className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground">Custom Button</h3>
                  <Badge variant="outline" className="text-xs border-green-200 text-green-700 dark:border-green-800 dark:text-green-400">
                    Ready
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  Display contextual action buttons during conversations
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
            </div>

            {/* Calendly Slots */}
            <div
              className="flex items-center gap-4 p-4 border border-border rounded-lg cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors group"
              onClick={() => handleActionSelect('calendly-slots')}
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground">Calendly Slots</h3>
                  <Badge variant="outline" className="text-xs border-green-200 text-green-700 dark:border-green-800 dark:text-green-400">
                    Ready
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  Show available meeting times from your Calendly calendar
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
            </div>

            {/* Zendesk Create Ticket */}
            <div
              className="flex items-center gap-4 p-4 border border-border rounded-lg cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors group"
              onClick={() => handleActionSelect('zendesk-create-ticket')}
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground">Zendesk Create Ticket</h3>
                  <Badge variant="outline" className="text-xs border-green-200 text-green-700 dark:border-green-800 dark:text-green-400">
                    Ready
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  Create and manage support tickets in Zendesk
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-lg rounded-lg border-border">
          <DialogHeader className="space-y-3">
            <div className="w-14 h-14 rounded-lg bg-destructive/10 flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7 text-destructive" />
            </div>
            <DialogTitle className="text-2xl font-bold text-center text-foreground">Delete Action</DialogTitle>
            <DialogDescription className="text-center text-base text-muted-foreground">
              Are you sure you want to delete <span className="font-semibold text-foreground">&quot;{actionToDelete?.name}&quot;</span>?
              <br />
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className="flex-1 h-11 rounded-lg border-border hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteAction}
              className="flex-1 h-11 rounded-lg"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Action
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}

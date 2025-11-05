'use client';

import { useState, useEffect, useRef } from 'react';
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
  MousePointerClick
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

  useEffect(() => {
    loadAgent();
    loadActions();
  }, [agentId, workspaceContext]);

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

  const loadActions = async () => {
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
  };

  const handleEditAction = (action: AgentAction) => {
    setOpenMenuId(null);
    
    // Navigate to the appropriate edit route based on action type
    const actionTypeRoute = action.type === 'calendly-slots' ? 'calendly-slots' :
                           action.type === 'custom-button' ? 'custom-button' :
                           action.type === 'collect-leads' ? 'collect-leads' :
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
      case 'custom-action': return <Zap className="w-5 h-5" />;
      default: return <Zap className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleActionSelect = (actionType: string) => {
    if (actionType === 'collect-leads') {
      router.push(`/dashboard/${workspaceSlug}/agents/${agentId}/actions/collect-leads`);
    } else if (actionType === 'custom-button') {
      router.push(`/dashboard/${workspaceSlug}/agents/${agentId}/actions/custom-button`);
    } else if (actionType === 'calendly-slots') {
      router.push(`/dashboard/${workspaceSlug}/agents/${agentId}/actions/calendly-slots`);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground font-medium">Loading actions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Actions</h1>
          <p className="text-gray-600">Manage automated actions for your AI agent</p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search actions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="collect-leads">Collect Leads</SelectItem>
                <SelectItem value="custom-button">Custom Button</SelectItem>
                <SelectItem value="calendly-slots">Calendly Slots</SelectItem>
                <SelectItem value="custom-action">Custom Action</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setShowCreateDialog(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Action
            </Button>
          </div>
        </div>

        {/* Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredActions.map((action) => (
            <Card key={action.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                      {getActionIcon(action.type)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{action.name}</CardTitle>
                      <p className="text-sm text-gray-500 capitalize">{action.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(action.status)}>
                      {action.status}
                    </Badge>
                    <div className="relative" ref={(el) => { menuRefs.current[action.id] = el; }}>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => setOpenMenuId(openMenuId === action.id ? null : action.id)}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                      
                      {/* Dropdown Menu */}
                      {openMenuId === action.id && (
                        <div className="absolute right-0 top-10 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                          <button
                            onClick={() => handleEditAction(action)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                          >
                            <Edit className="w-4 h-4" />
                            Edit Action
                          </button>
                          <button
                            onClick={() => handleDuplicateAction(action)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                          >
                            <Copy className="w-4 h-4" />
                            Duplicate
                          </button>
                          <button
                            onClick={() => handleToggleStatus(action)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
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
                          <div className="border-t border-gray-100 my-1"></div>
                          <button
                            onClick={() => handleDeleteAction(action)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-600 mb-4">{action.description}</p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Status:</span>
                    <span className="font-medium capitalize">{action.status}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Created:</span>
                    <span className="font-medium">{new Date(action.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Updated:</span>
                    <span className="font-medium">{new Date(action.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleEditAction(action)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className={action.status === 'active' ? 'text-orange-600 hover:text-orange-700' : 'text-green-600 hover:text-green-700'}
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
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No actions found</h3>
            <p className="text-gray-600 mb-6">Create your first action to automate workflows</p>
            <Button onClick={() => setShowCreateDialog(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Action
            </Button>
          </div>
        )}
      </div>

      {/* Create Action Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900 mb-2">Create Action</DialogTitle>
            <DialogDescription className="text-gray-600">
              Choose an action type to automate workflows for your AI agent
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-6">
            {/* Collect Leads Action */}
            <Card
              className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200"
              onClick={() => handleActionSelect('collect-leads')}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">Collect leads</h3>
                      <p className="text-gray-600 text-sm">Collect leads from your website visitors</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>

            {/* Custom Button Action */}
            <Card
              className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-purple-200"
              onClick={() => handleActionSelect('custom-button')}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                      <MousePointerClick className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">Custom button</h3>
                      <p className="text-gray-600 text-sm">Show dynamic buttons based on context</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>

            {/* Calendly Get Available Slots Action */}
            <Card
              className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-green-200"
              onClick={() => handleActionSelect('calendly-slots')}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">Calendly get available slots</h3>
                      <p className="text-gray-600 text-sm">Manage your Calendly events and bookings</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>

            {/* More actions can be added here */}
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">More action types coming soon...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Action</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{actionToDelete?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteAction}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}

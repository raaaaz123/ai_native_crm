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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading actions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Agent Actions</h1>
          <p className="text-gray-600 text-lg">Create and manage automated workflows for your AI agent</p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search actions by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48 h-12 rounded-xl border-gray-200 bg-white shadow-sm">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="collect-leads">Collect Leads</SelectItem>
                <SelectItem value="custom-button">Custom Button</SelectItem>
                <SelectItem value="calendly-slots">Calendly Slots</SelectItem>
                <SelectItem value="custom-action">Custom Action</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-blue-600 hover:bg-blue-700 h-12 px-6 rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Action
            </Button>
          </div>
        </div>

        {/* Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredActions.map((action) => (
            <Card key={action.id} className="border-0 shadow-md hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden bg-white h-[420px] flex flex-col">
              <CardHeader className="pb-3 flex-shrink-0">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
                      {getActionIcon(action.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-bold text-gray-900 truncate">{action.name}</CardTitle>
                      <p className="text-sm text-gray-500 capitalize mt-0.5">{action.type.replace(/-/g, ' ')}</p>
                    </div>
                  </div>
                  <div className="relative flex-shrink-0" ref={(el) => { menuRefs.current[action.id] = el; }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0 rounded-lg hover:bg-gray-100"
                      onClick={() => setOpenMenuId(openMenuId === action.id ? null : action.id)}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>

                    {/* Dropdown Menu */}
                    {openMenuId === action.id && (
                      <div className="absolute right-0 top-10 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 z-50">
                        <button
                          onClick={() => handleEditAction(action)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 w-full text-left transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                          Edit Action
                        </button>
                        <button
                          onClick={() => handleDuplicateAction(action)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 w-full text-left transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                          Duplicate
                        </button>
                        <button
                          onClick={() => handleToggleStatus(action)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 w-full text-left transition-colors"
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
                        <div className="border-t border-gray-100 my-1.5"></div>
                        <button
                          onClick={() => handleDeleteAction(action)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full text-left transition-colors"
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
                <p className="text-sm text-gray-600 mb-4 line-clamp-2 h-10 leading-5">{action.description}</p>

                {/* Metadata section */}
                <div className="space-y-2.5 mb-5 py-4 px-4 bg-gray-50 rounded-xl flex-shrink-0">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 font-medium">Status</span>
                    <span className="font-semibold capitalize text-gray-900">{action.status}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 font-medium">Created</span>
                    <span className="font-semibold text-gray-900">{new Date(action.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 font-medium">Last Updated</span>
                    <span className="font-semibold text-gray-900">{new Date(action.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 mt-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-10 rounded-xl border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all"
                    onClick={() => handleEditAction(action)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`h-10 px-4 rounded-xl transition-all ${
                      action.status === 'active'
                        ? 'border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300'
                        : 'border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300'
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
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Zap className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No actions found</h3>
            <p className="text-gray-600 mb-8 text-lg">Create your first action to automate workflows and enhance your AI agent</p>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-blue-600 hover:bg-blue-700 h-12 px-8 rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Action
            </Button>
          </div>
        )}
      </div>

      {/* Create Action Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader className="space-y-3 pb-6 border-b border-gray-100">
            <DialogTitle className="text-3xl font-bold text-gray-900">Create Action</DialogTitle>
            <DialogDescription className="text-base text-gray-600 leading-relaxed">
              Choose an action type to automate workflows and enhance your AI agent&apos;s capabilities.
              Each action can be configured to trigger specific behaviors based on user interactions.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-8">
            {/* Collect Leads Action */}
            <Card
              className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 border-gray-100 hover:border-blue-300 hover:scale-[1.02] rounded-2xl overflow-hidden group"
              onClick={() => handleActionSelect('collect-leads')}
            >
              <CardContent className="p-6">
                <div className="flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Users className="w-7 h-7 text-white" />
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Collect Leads</h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">
                    Automatically collect contact information from website visitors. Perfect for building your email list and capturing sales leads.
                  </p>
                  <div className="mt-auto pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                      <span>Ready to use</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Custom Button Action */}
            <Card
              className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 border-gray-100 hover:border-purple-300 hover:scale-[1.02] rounded-2xl overflow-hidden group"
              onClick={() => handleActionSelect('custom-button')}
            >
              <CardContent className="p-6">
                <div className="flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <MousePointerClick className="w-7 h-7 text-white" />
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Custom Button</h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">
                    Display contextual action buttons during conversations. Guide users to specific actions based on their needs and conversation context.
                  </p>
                  <div className="mt-auto pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                      <span>Ready to use</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Calendly Get Available Slots Action */}
            <Card
              className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 border-gray-100 hover:border-green-300 hover:scale-[1.02] rounded-2xl overflow-hidden group"
              onClick={() => handleActionSelect('calendly-slots')}
            >
              <CardContent className="p-6">
                <div className="flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Calendar className="w-7 h-7 text-white" />
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Calendly Slots</h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">
                    Show available meeting times from your Calendly calendar. Let customers book appointments directly through the chat interface.
                  </p>
                  <div className="mt-auto pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                      <span>Ready to use</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Coming Soon Card */}
            <Card className="border-2 border-dashed border-gray-200 rounded-2xl overflow-hidden bg-gray-50/50">
              <CardContent className="p-6">
                <div className="flex flex-col h-full items-center justify-center text-center py-8">
                  <div className="w-14 h-14 rounded-xl bg-gray-200 flex items-center justify-center mb-4">
                    <Zap className="w-7 h-7 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">More Actions</h3>
                  <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
                    Additional action types are being developed. Stay tuned for more automation capabilities!
                  </p>
                  <div className="mt-4">
                    <Badge variant="outline" className="bg-white">Coming Soon</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Help Section */}
          <div className="mt-8 p-5 bg-blue-50 border border-blue-100 rounded-xl">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">Need help choosing?</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Actions allow your agent to perform specific tasks during conversations. Start with &quot;Collect Leads&quot; if you want to gather customer information,
                  or try &quot;Custom Button&quot; to guide users through specific workflows.
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader className="space-y-3">
            <div className="w-14 h-14 rounded-xl bg-red-100 flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7 text-red-600" />
            </div>
            <DialogTitle className="text-2xl font-bold text-center">Delete Action</DialogTitle>
            <DialogDescription className="text-center text-base">
              Are you sure you want to delete <span className="font-semibold text-gray-900">&quot;{actionToDelete?.name}&quot;</span>?
              <br />
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className="flex-1 h-11 rounded-xl border-gray-200 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteAction}
              className="flex-1 h-11 rounded-xl bg-red-600 hover:bg-red-700"
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

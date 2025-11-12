'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Settings as SettingsIcon,
  Save,
  ArrowLeft,
  CreditCard,
  Trash2,
  AlertTriangle,
  Loader2,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '@/app/lib/workspace-auth-context';
import { getAgent, updateAgent, deleteAgent, Agent } from '@/app/lib/agent-utils';
import { toast } from 'sonner';
import Link from 'next/link';

export default function GeneralSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = params.workspace as string;
  const agentId = params.agentId as string;
  const { workspaceContext } = useAuth();
  
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletingConversations, setDeletingConversations] = useState(false);
  const [originalData, setOriginalData] = useState({
    name: '',
    description: '',
    status: 'active',
    publicAccess: false,
    allowAnonymous: false,
    maxConversations: 100,
    sessionTimeout: 30,
    creditLimit: 1000
  });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active',
    publicAccess: false,
    allowAnonymous: false,
    maxConversations: 100,
    sessionTimeout: 30,
    creditLimit: 1000
  });

  useEffect(() => {
    loadAgent();
  }, [agentId, workspaceContext]);

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
        const initialData = {
          name: response.data.name || '',
          description: response.data.description || '',
          status: response.data.status || 'active',
          publicAccess: false,
          allowAnonymous: false,
          maxConversations: 100,
          sessionTimeout: 30,
          creditLimit: 1000
        };
        setOriginalData(initialData);
        setFormData(initialData);
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

  const handleSave = async () => {
    if (!agentId) return;
    
    try {
      setSaving(true);
      const response = await updateAgent(agentId, {
        name: formData.name,
        description: formData.description,
        status: formData.status as 'active' | 'inactive'
      });
      
      if (response.success) {
        toast.success('Settings saved successfully!');
        setAgent(response.data);
        // Update original data to reflect saved state
        setOriginalData({
          name: formData.name,
          description: formData.description,
          status: formData.status,
          publicAccess: formData.publicAccess,
          allowAnonymous: formData.allowAnonymous,
          maxConversations: formData.maxConversations,
          sessionTimeout: formData.sessionTimeout,
          creditLimit: formData.creditLimit
        });
      } else {
        toast.error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConversations = async () => {
    if (!confirm('Are you sure you want to delete all conversations? This action cannot be undone.')) {
      return;
    }
    
    try {
      setDeletingConversations(true);
      // TODO: Implement delete conversations API
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      toast.success('All conversations deleted successfully!');
    } catch (error) {
      console.error('Error deleting conversations:', error);
      toast.error('Failed to delete conversations');
    } finally {
      setDeletingConversations(false);
    }
  };

  const handleDeleteAgent = async () => {
    if (!confirm('Are you sure you want to delete this agent? This action cannot be undone and will delete all associated data.')) {
      return;
    }
    
    try {
      setDeleting(true);
      const response = await deleteAgent(agentId);
      
      if (response.success) {
        toast.success('Agent deleted successfully!');
        router.push(`/dashboard/${workspaceSlug}/agents`);
      } else {
        toast.error('Failed to delete agent');
      }
    } catch (error) {
      console.error('Error deleting agent:', error);
      toast.error('Failed to delete agent');
    } finally {
      setDeleting(false);
    }
  };

  // Check if there are unsaved changes
  const hasUnsavedChanges = 
    formData.name !== originalData.name ||
    formData.description !== originalData.description ||
    formData.status !== originalData.status ||
    formData.publicAccess !== originalData.publicAccess ||
    formData.allowAnonymous !== originalData.allowAnonymous ||
    formData.maxConversations !== originalData.maxConversations ||
    formData.sessionTimeout !== originalData.sessionTimeout ||
    formData.creditLimit !== originalData.creditLimit;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-2 sm:px-3 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <Link href={`/dashboard/${workspaceSlug}/agents/${agentId}/settings`}>
              <Button variant="outline" size="sm" className="border-border hover:bg-accent">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <Button 
              onClick={handleSave} 
              disabled={saving || !hasUnsavedChanges} 
              className="bg-primary hover:bg-primary/90 shadow-lg"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">General Settings</h1>
          <p className="text-muted-foreground">Configure basic agent information and behavior</p>
        </div>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card className="border border-border bg-card rounded-lg shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <SettingsIcon className="w-5 h-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="agentName" className="text-sm font-medium mb-2 block">Agent Name</Label>
                  <Input 
                    id="agentName" 
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter agent name"
                    className="border-border focus-visible:ring-ring"
                  />
                </div>
                <div>
                  <Label htmlFor="agentSlug" className="text-sm font-medium mb-2 block">Agent ID</Label>
                  <Input 
                    id="agentSlug" 
                    value={agentId}
                    disabled
                    className="bg-muted border-border"
                  />
                  <p className="text-xs text-muted-foreground mt-2">Agent ID cannot be changed</p>
                </div>
              </div>
              <div>
                <Label htmlFor="description" className="text-sm font-medium mb-2 block">Description</Label>
                <Textarea 
                  id="description" 
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this agent does..."
                  rows={3}
                  className="border-border focus-visible:ring-ring"
                />
              </div>
            </CardContent>
          </Card>

          {/* Credits Limit */}
          <Card className="border border-border bg-card rounded-lg shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="w-5 h-5" />
                Credits Limit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Maximum credits to be used by this agent from the credits available on the workspace.
              </p>
              <div className="flex items-center justify-between py-2">
                <div className="flex-1">
                  <Label className="text-sm font-medium">Set credits limit on agent</Label>
                </div>
                <div className="ml-4">
                   <Switch 
                     checked={true}
                     onCheckedChange={() => {}}
                     className="data-[state=checked]:bg-[#10b981] data-[state=unchecked]:bg-neutral-300"
                   />
                 </div>
              </div>
              <div className="max-w-xs">
                <Label htmlFor="creditLimit" className="text-sm font-medium mb-2 block">Enter credit limit</Label>
                <Input 
                  id="creditLimit" 
                  type="number" 
                  min="1" 
                  value={formData.creditLimit}
                  onChange={(e) => setFormData(prev => ({ ...prev, creditLimit: parseInt(e.target.value) || 1000 }))}
                  placeholder="1000"
                  className="border-border focus-visible:ring-ring"
                />
              </div>
            </CardContent>
          </Card>

          {/* Limits & Timeouts */}
          <Card className="border border-border bg-card rounded-lg shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Limits & Timeouts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxConversations" className="text-sm font-medium mb-2 block">Max Conversations per User</Label>
                  <Input 
                    id="maxConversations" 
                    type="number" 
                    min="1" 
                    max="1000"
                    value={formData.maxConversations}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxConversations: parseInt(e.target.value) || 100 }))}
                    className="border-border focus-visible:ring-ring"
                  />
                  <p className="text-xs text-muted-foreground mt-2">Maximum number of conversations per user per day</p>
                </div>
                <div>
                  <Label htmlFor="sessionTimeout" className="text-sm font-medium mb-2 block">Session Timeout (minutes)</Label>
                  <Input 
                    id="sessionTimeout" 
                    type="number" 
                    min="5" 
                    max="1440"
                    value={formData.sessionTimeout}
                    onChange={(e) => setFormData(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) || 30 }))}
                    className="border-border focus-visible:ring-ring"
                  />
                  <p className="text-xs text-muted-foreground mt-2">How long before a session expires</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border border-red-200 bg-card rounded-lg shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg text-red-600">
                <AlertTriangle className="w-5 h-5" />
                Danger Zone
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                These actions are irreversible. Please proceed with caution.
              </p>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {/* Delete Conversations */}
              <div className="flex items-start justify-between p-4 border border-border rounded-lg bg-card">
                <div className="flex-1">
                  <h4 className="font-medium text-foreground mb-1">Delete all conversations</h4>
                  <p className="text-sm text-muted-foreground">
                    Once you delete all your conversations, there is no going back. Please be certain. All the conversations on this agent will be deleted.
                  </p>
                </div>
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteConversations}
                  disabled={deletingConversations}
                  className="ml-4 bg-red-500 hover:bg-red-600 border-red-500 rounded-lg"
                >
                  {deletingConversations ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Conversations
                    </>
                  )}
                </Button>
              </div>

              {/* Reset Agent Settings */}
              <div className="flex items-start justify-between p-4 border border-border rounded-lg bg-card">
                <div className="flex-1">
                  <h4 className="font-medium text-foreground mb-1">Reset agent settings</h4>
                  <p className="text-sm text-muted-foreground">
                    Reset all agent settings to default values. This will not delete conversations or knowledge sources.
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    if (confirm('Are you sure you want to reset all settings to default?')) {
                      const resetData = {
                        name: agent?.name || '',
                        description: '',
                        status: 'active',
                        publicAccess: false,
                        allowAnonymous: false,
                        maxConversations: 100,
                        sessionTimeout: 30,
                        creditLimit: 1000
                      };
                      setFormData(resetData);
                      setOriginalData(resetData);
                      toast.success('Settings reset to default values');
                    }
                  }}
                  className="ml-4 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 rounded-lg"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset Settings
                </Button>
              </div>

              {/* Delete Agent */}
              <div className="flex items-start justify-between p-4 border border-border rounded-lg bg-card">
                <div className="flex-1">
                  <h4 className="font-medium text-foreground mb-1">Delete agent permanently</h4>
                  <p className="text-sm text-muted-foreground">
                    Once you delete your agent, there is no going back. Please be certain. All data associated with this agent will be permanently deleted including conversations, settings, and knowledge sources.
                  </p>
                </div>
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteAgent}
                  disabled={deleting}
                  className="ml-4 bg-red-600 hover:bg-red-700 border-red-600 rounded-lg"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Agent
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

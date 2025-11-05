"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../../lib/workspace-auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Container } from '@/components/layout';
import { 
  Building2, 
  Globe, 
  Save, 
  Users, 
  Settings,
  Crown,
  AlertCircle
} from 'lucide-react';
import { updateWorkspace } from '../../../lib/workspace-firestore-utils';

export default function WorkspaceSettingsPage() {
  const { workspaceContext, refreshWorkspaceContext } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: ''
  });

  const currentWorkspace = workspaceContext?.currentWorkspace;

  useEffect(() => {
    if (currentWorkspace) {
      setFormData({
        name: currentWorkspace.name,
        url: currentWorkspace.url,
        description: currentWorkspace.description || ''
      });
    }
  }, [currentWorkspace]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentWorkspace) {
      setError('No workspace selected');
      return;
    }

    if (!formData.name.trim()) {
      setError('Workspace name is required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await updateWorkspace(currentWorkspace.id, {
        name: formData.name.trim(),
        url: formData.url.trim(),
        description: formData.description.trim() || undefined
      });

      if (result.success) {
        setSuccess('Workspace updated successfully');
        await refreshWorkspaceContext();
      } else {
        setError(result.error || 'Failed to update workspace');
      }
    } catch (error) {
      console.error('Error updating workspace:', error);
      setError((error as Error).message || 'Failed to update workspace');
    } finally {
      setLoading(false);
    }
  };

  if (!currentWorkspace) {
    return (
      <Container>
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Workspace Selected</h2>
          <p className="text-gray-600">Please select a workspace to manage its settings.</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">Workspace Settings</h1>
        <p className="text-neutral-600">
          Manage your workspace settings and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card className="border border-gray-200 rounded-lg shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-black flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700">{success}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Workspace Name *
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="My Awesome Workspace"
                    className="w-full"
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500">
                    This is your workspace&apos;s visible name within Rexa.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="url" className="text-sm font-medium">
                    Workspace URL *
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Globe className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input
                      id="url"
                      type="text"
                      value={formData.url}
                      onChange={(e) => handleInputChange('url', e.target.value)}
                      placeholder="my-awesome-workspace"
                      className="pl-10"
                      disabled={loading}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    URL: rexa.com/workspace/{formData.url || 'your-workspace'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Brief description of your workspace..."
                    rows={3}
                    className="w-full"
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500">
                    Optional: Describe what this workspace is for
                  </p>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    type="submit"
                    disabled={loading || !formData.name.trim() || !formData.url.trim()}
                    className="bg-black hover:bg-gray-800 text-white"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Workspace Info */}
          <Card className="border border-gray-200 rounded-lg shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-black flex items-center gap-2">
                <Crown className="w-5 h-5" />
                Workspace Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Plan</p>
                <p className="text-lg font-semibold text-gray-900 capitalize">
                  {currentWorkspace.subscription.plan}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="text-lg font-semibold text-gray-900 capitalize">
                  {currentWorkspace.subscription.status}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Created</p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(currentWorkspace.createdAt).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border border-gray-200 rounded-lg shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-black flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.location.href = '/dashboard/settings/team'}
              >
                <Users className="w-4 h-4 mr-2" />
                Manage Team
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.location.href = '/dashboard/settings'}
              >
                <Settings className="w-4 h-4 mr-2" />
                Account Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Container>
  );
}

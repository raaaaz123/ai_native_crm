"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/lib/workspace-auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Container } from '@/components/layout';
import {
  Building2,
  Globe,
  Save,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { updateWorkspace } from '@/app/lib/workspace-firestore-utils';

export default function WorkspaceGeneralSettingsPage() {
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
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">No Workspace Selected</h2>
          <p className="text-muted-foreground">Please select a workspace to manage its settings.</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">General Settings</h1>
        <p className="text-muted-foreground">
          Manage your workspace basic information and preferences
        </p>
      </div>

      <div className="max-w-3xl">
        <Card className="border-0 shadow-sm bg-card rounded-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Workspace Information
            </CardTitle>
            <CardDescription>
              Update your workspace name, URL, and description
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {success && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-foreground">
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
                <p className="text-xs text-muted-foreground">
                  This is your workspace&apos;s visible name
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="url" className="text-sm font-medium text-foreground">
                  Workspace URL *
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input
                    id="url"
                    type="text"
                    value={formData.url}
                    onChange={(e) => handleInputChange('url', e.target.value)}
                    placeholder="my-workspace"
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  URL: {window.location.origin}/dashboard/{formData.url || 'your-workspace'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-foreground">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Brief description of your workspace..."
                  rows={4}
                  className="w-full resize-none"
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Optional: Describe what this workspace is for
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (currentWorkspace) {
                      setFormData({
                        name: currentWorkspace.name,
                        url: currentWorkspace.url,
                        description: currentWorkspace.description || ''
                      });
                      setError('');
                      setSuccess('');
                    }
                  }}
                  disabled={loading}
                >
                  Reset
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !formData.name.trim() || !formData.url.trim()}
                  className="bg-foreground hover:bg-foreground/90 text-background"
                >
                  {loading ? (
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
            </form>
          </CardContent>
        </Card>

        {/* Workspace Info Card */}
        <Card className="border-0 shadow-sm bg-card rounded-xl mt-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-foreground">Workspace Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Workspace ID</span>
              <code className="text-sm font-mono text-foreground bg-muted px-2 py-1 rounded">
                {currentWorkspace.id}
              </code>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Created</span>
              <span className="text-sm text-foreground font-medium">
                {new Date(currentWorkspace.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground">Last Updated</span>
              <span className="text-sm text-foreground font-medium">
                {new Date(currentWorkspace.updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}

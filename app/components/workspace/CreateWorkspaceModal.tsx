"use client";

import { useState } from 'react';
import { useAuth } from '../../lib/workspace-auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, Building2, Globe, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateWorkspaceModal({ isOpen, onClose }: CreateWorkspaceModalProps) {
  const { createWorkspace } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [urlError, setUrlError] = useState('');

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-generate URL from name
    if (field === 'name') {
      const urlSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .trim();
      
      setFormData(prev => ({ ...prev, url: urlSlug }));
    }
    
    // Clear errors when user starts typing
    if (error) setError('');
    if (urlError) setUrlError('');
  };

  const validateUrl = (url: string) => {
    if (!url) return 'URL is required';
    if (url.length < 3) return 'URL must be at least 3 characters';
    if (!/^[a-z0-9-]+$/.test(url)) return 'URL can only contain lowercase letters, numbers, and hyphens';
    if (url.startsWith('-') || url.endsWith('-')) return 'URL cannot start or end with a hyphen';
    return '';
  };

  const generateAlternativeUrls = (baseUrl: string): string[] => {
    const alternatives = [];
    const timestamp = Date.now().toString().slice(-4);
    
    alternatives.push(`${baseUrl}-${timestamp}`);
    alternatives.push(`${baseUrl}-workspace`);
    alternatives.push(`${baseUrl}-team`);
    alternatives.push(`${baseUrl}-${Math.floor(Math.random() * 1000)}`);
    
    return alternatives.slice(0, 3); // Return 3 alternatives
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Workspace name is required');
      toast.error('Workspace name is required');
      return;
    }
    
    const urlValidation = validateUrl(formData.url);
    if (urlValidation) {
      setUrlError(urlValidation);
      toast.error(urlValidation);
      return;
    }

    setLoading(true);
    setError('');
    setUrlError('');

    try {
      const result = await createWorkspace(
        formData.name.trim(),
        formData.url.trim(),
        formData.description.trim() || undefined
      ) as { success: boolean; error?: string };
      
      if (result.success) {
        // Success notification
        toast.success('Workspace created!', {
          description: `${formData.name} is ready to use.`
        });
        
        // Reset form
        setFormData({
          name: '',
          url: '',
          description: ''
        });
        
        onClose();
      } else {
        // Handle error from result
        const errorMessage = result.error || 'Failed to create workspace';
        
        // Show specific error messages
        if (errorMessage.includes('already taken')) {
          const alternatives = generateAlternativeUrls(formData.url);
        toast.error('URL already taken', {
          description: `Try: ${alternatives.slice(0, 2).join(', ')}`,
          action: {
            label: 'Use Alternative',
            onClick: () => {
              // Set the first alternative URL
              setFormData(prev => ({ ...prev, url: alternatives[0] }));
              setUrlError('');
            }
          }
        });
          setUrlError(`This URL is already taken. Try: ${alternatives.join(', ')}`);
        } else {
          toast.error('Failed to create workspace', {
            description: errorMessage
          });
          setError(errorMessage);
        }
      }
    } catch (error) {
      console.error('Error creating workspace:', error);
      const errorMessage = (error as Error).message || 'Failed to create workspace';
      
      toast.error('Failed to create workspace', {
        description: errorMessage
      });
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl bg-card border border-border shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">Create Workspace</CardTitle>
              <p className="text-sm text-muted-foreground">Set up your new workspace</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  This is your workspace&apos;s visible name within Rexa.
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
                    placeholder="my-awesome-workspace"
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
                {urlError ? (
                  <p className="text-xs text-destructive">{urlError}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    URL: rexa.com/workspace/{formData.url || 'your-workspace'}
                  </p>
                )}
              </div>
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
                rows={3}
                className="w-full"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Optional: Describe what this workspace is for
              </p>
            </div>

            <div className="flex items-start space-x-2 pt-2 p-3 bg-accent rounded-lg border border-border">
              <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-xs text-accent-foreground">
                You&apos;ll be the owner of this workspace and can invite team members later.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                disabled={loading || !formData.name.trim() || !formData.url.trim()}
              >
                {loading ? 'Creating...' : 'Create Workspace'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

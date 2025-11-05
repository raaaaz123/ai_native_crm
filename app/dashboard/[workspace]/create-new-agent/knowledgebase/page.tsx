'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { LoadingDialog } from '@/app/components/ui/loading-dialog';
import { useAuth } from '@/app/lib/workspace-auth-context';
import { createAgent, addAgentKnowledgeSource } from '@/app/lib/agent-utils';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  Link, 
  Plus,
  Trash2,
  Check,
  X,
  Globe,
  MessageCircle,
  FileIcon,
  AlignLeft,
  Loader2,
  Bot
} from 'lucide-react';

export default function KnowledgeBasePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const workspaceSlug = params.workspace as string;
  const { workspaceContext } = useAuth();
  
  const [selectedType, setSelectedType] = useState('files');
  const [knowledgeSources, setKnowledgeSources] = useState<Array<{
    id: string;
    type: 'files' | 'text' | 'website' | 'faq' | 'notion';
    content: string;
    title: string;
    file?: File;
  }>>([]);
  const [newSource, setNewSource] = useState({
    type: 'files' as 'files' | 'text' | 'website' | 'faq' | 'notion',
    content: '',
    title: '',
    file: null as File | null
  });
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const [showAgentDialog, setShowAgentDialog] = useState(false);
  const [agentName, setAgentName] = useState('');
  const [agentDescription, setAgentDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

  const sourceTypes = [
    { id: 'files', label: 'Files', icon: FileIcon },
    { id: 'text', label: 'Text', icon: AlignLeft },
    { id: 'website', label: 'Website', icon: Globe },
    { id: 'faq', label: 'FAQ', icon: MessageCircle },
    { id: 'notion', label: 'Notion', icon: FileText }
  ];

  useEffect(() => {
    const type = searchParams.get('type');
    if (type && sourceTypes.some(t => t.id === type)) {
      setSelectedType(type);
      setNewSource(prev => ({ ...prev, type: type as 'files' | 'text' | 'website' | 'faq' | 'notion' }));
    } else if (!type) {
      // Set default URL parameter to 'files' when no type is specified
      const url = new URL(window.location.href);
      url.searchParams.set('type', 'files');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams]);

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    setNewSource(prev => ({ ...prev, type: type as 'files' | 'text' | 'website' | 'faq' | 'notion' }));
    // Update URL without page reload
    const url = new URL(window.location.href);
    url.searchParams.set('type', type);
    window.history.replaceState({}, '', url.toString());
  };

  const handleAddSource = () => {
    if (!newSource.content.trim() || !newSource.title.trim()) return;
    
    const source = {
      id: Date.now().toString(),
      type: newSource.type,
      content: newSource.content,
      title: newSource.title,
      file: newSource.file || undefined
    };
    
    setKnowledgeSources(prev => [...prev, source]);
    setNewSource({ type: selectedType as 'files' | 'text' | 'website' | 'faq' | 'notion', content: '', title: '', file: null });
    setIsAddingSource(false);
    toast.success('Knowledge source added!');
  };

  const handleRemoveSource = (id: string) => {
    setKnowledgeSources(prev => prev.filter(source => source.id !== id));
  };

  const handleContinue = () => {
    if (knowledgeSources.length === 0) {
      toast.error('Please add at least one knowledge source before continuing.');
      return;
    }
    setShowAgentDialog(true);
  };

  const handleCreateAgent = async () => {
    if (!agentName.trim()) {
      toast.error('Agent name is required.');
      return;
    }

    if (!workspaceContext?.currentWorkspace?.id) {
      console.error('No workspace found:', workspaceContext);
      toast.error('No workspace found. Please try again.');
      return;
    }

    console.log('Creating agent for workspace:', workspaceContext?.currentWorkspace?.id);

    setIsCreatingAgent(true);
    setIsUploading(true);
    setUploadProgress({ current: 0, total: knowledgeSources.length });

    try {
      // Create the agent
      const agentResponse = await createAgent(workspaceContext?.currentWorkspace?.id, {
        name: agentName.trim(),
        description: agentDescription.trim() || undefined
      });

      if (!agentResponse.success) {
        console.error('Agent creation failed:', agentResponse.error);
        throw new Error(agentResponse.error || 'Failed to create agent');
      }

      const agent = agentResponse.data;
      toast.success('Agent created successfully!');

      // Upload knowledge sources
      for (let i = 0; i < knowledgeSources.length; i++) {
        const source = knowledgeSources[i];
        setUploadProgress({ current: i + 1, total: knowledgeSources.length });

        try {
          const sourceResponse = await addAgentKnowledgeSource(agent.id, {
            type: source.type,
            title: source.title,
            content: source.content,
            file: source.file,
            websiteUrl: source.type === 'website' ? source.content : undefined,
            embeddingModel: 'text-embedding-3-large'
          });

          if (!sourceResponse.success) {
            console.error(`Failed to add source "${source.title}":`, sourceResponse.error);
            toast.error(`Failed to add source "${source.title}"`);
          } else {
            console.log(`Successfully added source "${source.title}"`);
          }
        } catch (sourceError) {
          console.error(`Error adding source "${source.title}":`, sourceError);
          toast.error(`Error adding source "${source.title}"`);
        }
      }

      toast.success(`Agent "${agent.name}" created with ${knowledgeSources.length} knowledge sources!`);
      
      // Navigate to agents page
      router.push(`/dashboard/${workspaceSlug}/agents`);
      
    } catch (error) {
      console.error('Error creating agent:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create agent');
    } finally {
      setIsCreatingAgent(false);
      setIsUploading(false);
      setUploadProgress({ current: 0, total: 0 });
    }
  };

  const handleBack = () => {
    window.history.back();
  };

  const renderSourceUI = () => {
    switch (selectedType) {
      case 'files':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-sm font-medium text-foreground mb-2 block">
                File Name *
              </Label>
              <Input
                id="title"
                value={newSource.title}
                onChange={(e) => setNewSource(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter file name"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-foreground mb-2 block">
                Upload File *
              </Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors">
                <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-foreground mb-1">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  PDF, DOC, TXT, MD files up to 10MB
                </p>
                <Input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setNewSource(prev => ({ 
                        ...prev, 
                        content: file.name,
                        file: file
                      }));
                    }
                  }}
                />
              </div>
            </div>
          </div>
        );
      
      case 'text':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-sm font-medium text-foreground mb-2 block">
                Title *
              </Label>
              <Input
                id="title"
                value={newSource.title}
                onChange={(e) => setNewSource(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter a title for this text"
              />
            </div>
            <div>
              <Label htmlFor="content" className="text-sm font-medium text-foreground mb-2 block">
                Text Content *
              </Label>
              <Textarea
                id="content"
                value={newSource.content}
                onChange={(e) => setNewSource(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Enter the text content..."
                rows={6}
                className="resize-none"
              />
            </div>
          </div>
        );
      
      case 'website':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-sm font-medium text-foreground mb-2 block">
                Website Title *
              </Label>
              <Input
                id="title"
                value={newSource.title}
                onChange={(e) => setNewSource(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter website title"
              />
            </div>
            <div>
              <Label htmlFor="content" className="text-sm font-medium text-foreground mb-2 block">
                Website URL *
              </Label>
              <Input
                id="content"
                type="url"
                value={newSource.content}
                onChange={(e) => setNewSource(prev => ({ ...prev, content: e.target.value }))}
                placeholder="https://example.com"
              />
            </div>
          </div>
        );
      
      case 'faq':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-sm font-medium text-foreground mb-2 block">
                FAQ Set Title *
              </Label>
              <Input
                id="title"
                value={newSource.title}
                onChange={(e) => setNewSource(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter FAQ set title"
              />
            </div>
            <div>
              <Label htmlFor="content" className="text-sm font-medium text-foreground mb-2 block">
                Frequently Asked Questions *
              </Label>
              <Textarea
                id="content"
                value={newSource.content}
                onChange={(e) => setNewSource(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Q: What is your return policy?&#10;A: We offer a 30-day return policy...&#10;&#10;Q: How do I track my order?&#10;A: You can track your order using the tracking number..."
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Format: Q: Question&#10;A: Answer (separate each FAQ with a blank line)
              </p>
            </div>
          </div>
        );
      
      case 'notion':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-sm font-medium text-foreground mb-2 block">
                Notion Page Title *
              </Label>
              <Input
                id="title"
                value={newSource.title}
                onChange={(e) => setNewSource(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter Notion page title"
              />
            </div>
            <div>
              <Label htmlFor="content" className="text-sm font-medium text-foreground mb-2 block">
                Notion Page URL *
              </Label>
              <Input
                id="content"
                type="url"
                value={newSource.content}
                onChange={(e) => setNewSource(prev => ({ ...prev, content: e.target.value }))}
                placeholder="https://notion.so/your-page-url"
              />
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Loading Dialog */}
      {isUploading && (
        <LoadingDialog
          open={isUploading}
          message="Creating Agent"
          submessage={`Uploading knowledge sources... ${uploadProgress.current}/${uploadProgress.total}`}
        />
      )}

      {/* Agent Creation Dialog */}
      <Dialog open={showAgentDialog} onOpenChange={setShowAgentDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-foreground flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary-foreground" />
              </div>
              Create AI Agent
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="agentName" className="text-sm font-medium text-foreground mb-2 block">
                Agent Name *
              </Label>
              <Input
                id="agentName"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="e.g., Customer Support Assistant"
                className="h-10"
                disabled={isCreatingAgent}
              />
            </div>
            <div>
              <Label htmlFor="agentDescription" className="text-sm font-medium text-foreground mb-2 block">
                Description (Optional)
              </Label>
              <Textarea
                id="agentDescription"
                value={agentDescription}
                onChange={(e) => setAgentDescription(e.target.value)}
                placeholder="Describe what this agent will do..."
                rows={3}
                className="resize-none"
                disabled={isCreatingAgent}
              />
            </div>
            <div className="bg-muted p-3 rounded-lg border">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Knowledge Sources</span>
              </div>
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">{knowledgeSources.length}</strong> source{knowledgeSources.length !== 1 ? 's' : ''} will be added to this agent.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAgentDialog(false)}
              disabled={isCreatingAgent}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateAgent}
              disabled={isCreatingAgent || !agentName.trim()}
              className="bg-primary hover:bg-primary/90"
            >
              {isCreatingAgent ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Bot className="w-4 h-4 mr-2" />
                  Create Agent
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-4 p-2 h-auto text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-foreground mb-2">
              Knowledge Base
            </h1>
            <p className="text-muted-foreground">
              Add knowledge sources to train your AI agent
            </p>
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Source Types */}
          <div className="col-span-12 lg:col-span-3">
            <div className="bg-card rounded-lg border p-4 sticky top-6">
              <h3 className="text-sm font-medium text-foreground mb-3">Choose Knowledge Source Type</h3>
              <div className="space-y-2">
                {sourceTypes.map((type) => {
                  const Icon = type.icon;
                  const isSelected = selectedType === type.id;
                  return (
                    <button
                      key={type.id}
                      onClick={() => handleTypeChange(type.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-md border transition-colors text-left ${
                        isSelected
                          ? 'border-primary bg-primary/5 text-foreground'
                          : 'border-border hover:border-muted-foreground/50 text-muted-foreground hover:text-foreground'
                      }`}
                      suppressHydrationWarning
                    >
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className="text-sm font-medium">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-12 lg:col-span-6">
            <div className="space-y-4">
              {/* Add New Source */}
              {!isAddingSource ? (
                <div className="bg-card rounded-lg border p-6 text-center">
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Plus className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Add {sourceTypes.find(t => t.id === selectedType)?.label} Source
                  </h3>
                  <p className="text-muted-foreground mb-4 text-sm">
                    Add {sourceTypes.find(t => t.id === selectedType)?.label.toLowerCase()} content to train your AI agent
                  </p>
                  <Button
                    onClick={() => setIsAddingSource(true)}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add {sourceTypes.find(t => t.id === selectedType)?.label}
                  </Button>
                </div>
              ) : (
                <div className="bg-card rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
                      {React.createElement(sourceTypes.find(t => t.id === selectedType)?.icon || FileText, {
                        className: "w-4 h-4 text-primary"
                      })}
                      Add {sourceTypes.find(t => t.id === selectedType)?.label}
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsAddingSource(false)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {renderSourceUI()}

                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        onClick={handleAddSource}
                        disabled={!newSource.content.trim() || !newSource.title.trim()}
                        className="bg-primary hover:bg-primary/90"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Add Source
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsAddingSource(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar - Added Sources */}
          <div className="col-span-12 lg:col-span-3">
            <div className="bg-card rounded-lg border p-4 sticky top-6">
              <div className="flex items-center gap-2 mb-3">
                <Check className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-medium text-foreground">
                  Added Sources ({knowledgeSources.length})
                </h3>
              </div>
              
              {knowledgeSources.length === 0 ? (
                <div className="text-center py-6">
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center mx-auto mb-2">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    No sources added yet
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {knowledgeSources.map((source) => {
                    const sourceType = sourceTypes.find(t => t.id === source.type);
                    const Icon = sourceType?.icon || FileText;
                    return (
                      <div key={source.id} className="p-2 bg-muted rounded-md">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Icon className="w-3 h-3 text-primary flex-shrink-0" />
                              <span className="text-xs font-medium text-foreground truncate">
                                {source.title}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground bg-background px-1.5 py-0.5 rounded">
                              {sourceType?.label}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveSource(source.id)}
                            className="text-muted-foreground hover:text-destructive ml-1 h-6 w-6 p-0"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Continue Button */}
              <div className="mt-4 pt-3 border-t">
                <Button
                  onClick={handleContinue}
                  disabled={knowledgeSources.length === 0 || isCreatingAgent || isUploading}
                  className="w-full bg-primary hover:bg-primary/90"
                  size="sm"
                >
                  {isCreatingAgent || isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Bot className="w-4 h-4 mr-2" />
                      Create Agent ({knowledgeSources.length})
                    </>
                  )}
                </Button>
                {knowledgeSources.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Add at least one source to continue
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  Smile,
  Plus,
  Trash2,
  Link as LinkIcon,
  Loader2,
  Save,
  Eye,
  Sparkles,
  Sun,
  Moon,
  Copy,
  Globe,
  PanelLeftClose,
  PanelLeft,
  ArrowUp
} from "lucide-react";
import { toast } from "sonner";
import { db } from "@/app/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/app/lib/workspace-auth-context";

interface HelpPageSettings {
  // Branding
  logo?: string;
  heroImage?: string;

  // Theme
  theme: 'light' | 'dark';
  primaryColor: string;
  backgroundColor: string;

  // Content
  headerText: string;
  inputPlaceholder: string;

  // Buttons
  newChatButtonText: string;
  primaryButtons: Array<{
    id: string;
    text: string;
    action: string;
  }>;
  secondaryButtons: Array<{
    id: string;
    text: string;
    action: string;
  }>;

  // Suggestions
  suggestions: Array<{
    id: string;
    text: string;
  }>;

  // Link Cards
  linkCards: Array<{
    id: string;
    heading: string;
    description: string;
    url: string;
  }>;
}

const defaultSettings: HelpPageSettings = {
  theme: 'light',
  primaryColor: '#000000',
  backgroundColor: '#ffffff',
  headerText: 'How can I help you today?',
  inputPlaceholder: 'Ask me anything...',
  newChatButtonText: 'New chat',
  primaryButtons: [],
  secondaryButtons: [],
  suggestions: [],
  linkCards: []
};

export default function HelpPageCustomization() {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = params.workspace as string;
  const agentId = params.agentId as string;
  const { workspaceContext } = useAuth();
  const workspaceId = workspaceContext?.currentWorkspace?.id || '';

  const [activeTab, setActiveTab] = useState('settings');
  const [settings, setSettings] = useState<HelpPageSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [editMode, setEditMode] = useState(true);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [helpPageUrl, setHelpPageUrl] = useState('');

  // Refs for scrolling to settings sections
  const logoRef = useRef<HTMLDivElement>(null);
  const headerTextRef = useRef<HTMLDivElement>(null);
  const inputPlaceholderRef = useRef<HTMLDivElement>(null);
  const primaryButtonsRef = useRef<HTMLDivElement>(null);
  const secondaryButtonsRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const linkCardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSettings();
    // Set help page URL dynamically
    if (typeof window !== 'undefined' && agentId) {
      setHelpPageUrl(`${window.location.origin}/help/${agentId}`);
    }
  }, [agentId, workspaceId]);

  const loadSettings = async () => {
    if (!agentId || !workspaceId) return;

    setLoading(true);
    try {
      const docRef = doc(db, 'helpPageSettings', `${workspaceId}_${agentId}`);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        // Filter out undefined values and merge with defaults
        const cleanData = Object.fromEntries(
          Object.entries(data).filter(([_, value]) => value !== undefined)
        );
        setSettings({ ...defaultSettings, ...cleanData });
      }
    } catch (error) {
      console.error('Error loading help page settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!agentId || !workspaceId) {
      toast.error('Missing workspace or agent ID');
      return;
    }

    // Validation
    if (!settings.headerText.trim()) {
      toast.error('Header text is required');
      return;
    }

    if (!settings.inputPlaceholder.trim()) {
      toast.error('Input placeholder is required');
      return;
    }

    setSaving(true);
    try {
      // Images are uploaded immediately on selection, so we just save settings
      // Filter out undefined values to avoid Firestore errors
      const settingsToSave: Record<string, unknown> = {
        ...settings,
        workspaceId,
        agentId,
        updatedAt: serverTimestamp()
      };

      // Only include logo and heroImage if they have values
      if (settings.logo) {
        settingsToSave.logo = settings.logo;
      }
      if (settings.heroImage) {
        settingsToSave.heroImage = settings.heroImage;
      }

      // Remove any undefined values
      Object.keys(settingsToSave).forEach(key => {
        if (settingsToSave[key] === undefined) {
          delete settingsToSave[key];
        }
      });

      const docRef = doc(db, 'helpPageSettings', `${workspaceId}_${agentId}`);
      await setDoc(docRef, settingsToSave, { merge: true });

      toast.success('Settings saved successfully!');
      setLogoFile(null);
      setHeroFile(null);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('workspace_id', workspaceId);
      formData.append('agent_id', agentId);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
      const response = await fetch(`${apiUrl}/api/upload/image`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Upload failed');
      }

      const data = await response.json();
      return data.file_url;
    } catch (error: unknown) {
      const uploadError = error as { message?: string };
      console.error('Upload error:', error);
      throw new Error(uploadError?.message || 'Failed to upload image');
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      toast.error('Logo must be less than 1MB');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/svg+xml'].includes(file.type)) {
      toast.error('Logo must be JPG, PNG, or SVG');
      return;
    }

    setLogoFile(file);
    toast.loading('Uploading logo...', { id: 'logo-upload' });

    try {
      const fileUrl = await uploadImage(file);
      setSettings({ ...settings, logo: fileUrl });
      toast.success('Logo uploaded successfully', { id: 'logo-upload' });
    } catch (error: unknown) {
      const uploadError = error as { message?: string };
      toast.error(uploadError?.message || 'Failed to upload logo', { id: 'logo-upload' });
      setLogoFile(null);
    }
  };

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      toast.error('Hero image must be less than 1MB');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/svg+xml'].includes(file.type)) {
      toast.error('Hero image must be JPG, PNG, or SVG');
      return;
    }

    setHeroFile(file);
    toast.loading('Uploading hero image...', { id: 'hero-upload' });

    try {
      const fileUrl = await uploadImage(file);
      setSettings({ ...settings, heroImage: fileUrl });
      toast.success('Hero image uploaded successfully', { id: 'hero-upload' });
    } catch (error: unknown) {
      const uploadError = error as { message?: string };
      toast.error(uploadError?.message || 'Failed to upload hero image', { id: 'hero-upload' });
      setHeroFile(null);
    }
  };

  const addPrimaryButton = () => {
    setSettings({
      ...settings,
      primaryButtons: [
        ...settings.primaryButtons,
        { id: Date.now().toString(), text: '', action: '' }
      ]
    });
  };

  const removePrimaryButton = (id: string) => {
    setSettings({
      ...settings,
      primaryButtons: settings.primaryButtons.filter(b => b.id !== id)
    });
  };

  const updatePrimaryButton = (id: string, field: 'text' | 'action', value: string) => {
    setSettings({
      ...settings,
      primaryButtons: settings.primaryButtons.map(b =>
        b.id === id ? { ...b, [field]: value } : b
      )
    });
  };

  const addSecondaryButton = () => {
    setSettings({
      ...settings,
      secondaryButtons: [
        ...settings.secondaryButtons,
        { id: Date.now().toString(), text: '', action: '' }
      ]
    });
  };

  const removeSecondaryButton = (id: string) => {
    setSettings({
      ...settings,
      secondaryButtons: settings.secondaryButtons.filter(b => b.id !== id)
    });
  };

  const updateSecondaryButton = (id: string, field: 'text' | 'action', value: string) => {
    setSettings({
      ...settings,
      secondaryButtons: settings.secondaryButtons.map(b =>
        b.id === id ? { ...b, [field]: value } : b
      )
    });
  };

  const addSuggestion = () => {
    setSettings({
      ...settings,
      suggestions: [
        ...settings.suggestions,
        { id: Date.now().toString(), text: '' }
      ]
    });
  };

  const removeSuggestion = (id: string) => {
    setSettings({
      ...settings,
      suggestions: settings.suggestions.filter(s => s.id !== id)
    });
  };

  const updateSuggestion = (id: string, text: string) => {
    setSettings({
      ...settings,
      suggestions: settings.suggestions.map(s =>
        s.id === id ? { ...s, text } : s
      )
    });
  };

  const addLinkCard = () => {
    setSettings({
      ...settings,
      linkCards: [
        ...settings.linkCards,
        { id: Date.now().toString(), heading: '', description: '', url: '' }
      ]
    });
  };

  const removeLinkCard = (id: string) => {
    setSettings({
      ...settings,
      linkCards: settings.linkCards.filter(l => l.id !== id)
    });
  };

  const updateLinkCard = (id: string, field: 'heading' | 'description' | 'url', value: string) => {
    setSettings({
      ...settings,
      linkCards: settings.linkCards.map(l =>
        l.id === id ? { ...l, [field]: value } : l
      )
    });
  };

  const handleElementClick = (elementType: string) => {
    if (!editMode) return;

    setSelectedElement(elementType);
    setActiveTab('settings');

    // Scroll to the corresponding settings section
    const refMap: Record<string, React.RefObject<HTMLDivElement | null>> = {
      'logo': logoRef,
      'headerText': headerTextRef,
      'inputPlaceholder': inputPlaceholderRef,
      'primaryButtons': primaryButtonsRef,
      'secondaryButtons': secondaryButtonsRef,
      'suggestions': suggestionsRef,
      'linkCards': linkCardsRef,
    };

    const ref = refMap[elementType];
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Highlight the section briefly
      ref.current.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
      setTimeout(() => {
        ref.current?.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2');
      }, 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background overflow-hidden flex flex-col">
      <div className="max-w-[2000px] mx-auto p-6 flex-1 overflow-hidden flex flex-col w-full">
        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 flex-1 overflow-hidden">
          {/* Left Panel - Settings */}
          <div className="flex flex-col h-full overflow-hidden">
            {/* Header moved to sidebar top */}
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/dashboard/${workspaceSlug}/agents/${agentId}/deploy`)}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Deploy
                </Button>
                <div className="h-6 w-px bg-border"></div>
                <h1 className="text-xl font-bold text-foreground">Help Page</h1>
              </div>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-primary hover:bg-primary/90"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Deploy
                  </>
                )}
              </Button>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 overflow-hidden">
              <TabsList className="grid w-full grid-cols-3 flex-shrink-0 mb-4">
                <TabsTrigger value="settings">Settings</TabsTrigger>
                <TabsTrigger value="ai">AI</TabsTrigger>
                <TabsTrigger value="domain">Domain setup</TabsTrigger>
              </TabsList>

              {/* Settings Tab - All customization options */}
              <TabsContent value="settings" className="mt-4 flex-1 overflow-hidden">
                <div className="space-y-4 h-full overflow-y-auto pr-2">
                {/* Logo Upload */}
                <Card ref={logoRef} className="transition-all">
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <Label className="text-sm font-semibold text-foreground">Logo</Label>
                      <p className="text-xs text-muted-foreground mt-0.5 mb-2">
                        Supports JPG, PNG, and SVG up to 1MB
                      </p>
                      <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/svg+xml"
                          onChange={handleLogoUpload}
                          className="hidden"
                          id="logo-upload"
                        />
                        <label htmlFor="logo-upload" className="cursor-pointer">
                          {logoFile || settings.logo ? (
                            <div className="space-y-1.5">
                              <ImageIcon className="w-10 h-10 mx-auto text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">
                                {logoFile?.name || 'Logo uploaded'}
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              <Upload className="w-10 h-10 mx-auto text-muted-foreground" />
                              <p className="text-sm font-medium text-foreground">Upload</p>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Theme Selection */}
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <Label className="text-sm font-semibold text-foreground">Theme</Label>
                    <div className="flex gap-3">
                      <Button
                        variant={settings.theme === 'light' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSettings({ ...settings, theme: 'light' })}
                        className="flex-1"
                      >
                        <Sun className="w-4 h-4 mr-2" />
                        Light
                      </Button>
                      <Button
                        variant={settings.theme === 'dark' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSettings({ ...settings, theme: 'dark' })}
                        className="flex-1"
                      >
                        <Moon className="w-4 h-4 mr-2" />
                        Dark
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Colors */}
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <Label className="text-sm font-semibold text-foreground">Primary Color</Label>
                      <div className="flex gap-2 mt-1.5">
                        <Input
                          type="color"
                          value={settings.primaryColor}
                          onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                          className="w-16 h-10 p-1 cursor-pointer border-border"
                        />
                        <Input
                          type="text"
                          value={settings.primaryColor}
                          onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                          className="flex-1 border-border"
                          placeholder="#000000"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-semibold text-foreground">Background Color</Label>
                      <div className="flex gap-2 mt-1.5">
                        <Input
                          type="color"
                          value={settings.backgroundColor}
                          onChange={(e) => setSettings({ ...settings, backgroundColor: e.target.value })}
                          className="w-16 h-10 p-1 cursor-pointer border-border"
                        />
                        <Input
                          type="text"
                          value={settings.backgroundColor}
                          onChange={(e) => setSettings({ ...settings, backgroundColor: e.target.value })}
                          className="flex-1 border-border"
                          placeholder="#ffffff"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Text Customization */}
                <Card className="transition-all">
                  <CardContent className="p-4 space-y-3">
                    <div ref={headerTextRef}>
                      <Label className="text-sm font-semibold text-foreground">Header Text</Label>
                      <Input
                        value={settings.headerText}
                        onChange={(e) => setSettings({ ...settings, headerText: e.target.value })}
                        placeholder="How can I help you today?"
                        className="mt-1.5 border-border"
                      />
                    </div>

                    <div ref={inputPlaceholderRef}>
                      <Label className="text-sm font-semibold text-foreground">Input Placeholder</Label>
                      <Input
                        value={settings.inputPlaceholder}
                        onChange={(e) => setSettings({ ...settings, inputPlaceholder: e.target.value })}
                        placeholder="Ask me anything..."
                        className="mt-1.5 border-border"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-semibold text-foreground">New Chat Button Text</Label>
                      <Input
                        value={settings.newChatButtonText}
                        onChange={(e) => setSettings({ ...settings, newChatButtonText: e.target.value })}
                        placeholder="New chat"
                        className="mt-1.5 border-border"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Primary Buttons */}
                <Card ref={primaryButtonsRef} className="transition-all">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold text-foreground">Primary Buttons</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={addPrimaryButton}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add primary button
                      </Button>
                    </div>

                    {settings.primaryButtons.map((button) => (
                      <div key={button.id} className="flex gap-2">
                        <Input
                          value={button.text}
                          onChange={(e) => updatePrimaryButton(button.id, 'text', e.target.value)}
                          placeholder="Button text"
                          className="flex-1 border-border"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removePrimaryButton(button.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Secondary Buttons */}
                <Card ref={secondaryButtonsRef} className="transition-all">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold text-foreground">Secondary Buttons</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={addSecondaryButton}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add button
                      </Button>
                    </div>

                    {settings.secondaryButtons.map((button) => (
                      <div key={button.id} className="flex gap-2">
                        <Input
                          value={button.text}
                          onChange={(e) => updateSecondaryButton(button.id, 'text', e.target.value)}
                          placeholder="Button text"
                          className="flex-1 border-border"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeSecondaryButton(button.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Suggestions */}
                <Card ref={suggestionsRef} className="transition-all">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold text-foreground">Suggested Messages</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={addSuggestion}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add suggestion
                      </Button>
                    </div>

                    {settings.suggestions.map((suggestion) => (
                      <div key={suggestion.id} className="flex gap-2">
                        <Input
                          value={suggestion.text}
                          onChange={(e) => updateSuggestion(suggestion.id, e.target.value)}
                          placeholder="Suggestion text"
                          className="flex-1 border-border"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeSuggestion(suggestion.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Link Cards */}
                <Card ref={linkCardsRef} className="transition-all">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold text-foreground">Link Cards</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={addLinkCard}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add link card
                      </Button>
                    </div>

                    {settings.linkCards.map((card) => (
                      <div key={card.id} className="space-y-1.5 p-4 border border-border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-xs font-medium text-muted-foreground">Link Card</Label>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeLinkCard(card.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                        <Input
                          value={card.heading}
                          onChange={(e) => updateLinkCard(card.id, 'heading', e.target.value)}
                          placeholder="Link heading"
                          className="border-border"
                        />
                        <Textarea
                          value={card.description}
                          onChange={(e) => updateLinkCard(card.id, 'description', e.target.value)}
                          placeholder="This is a short description to the link"
                          rows={2}
                          className="border-border"
                        />
                        <div className="flex gap-2">
                          <LinkIcon className="w-4 h-4 text-muted-foreground mt-3" />
                          <Input
                            value={card.url}
                            onChange={(e) => updateLinkCard(card.id, 'url', e.target.value)}
                            placeholder="https://"
                            className="border-border"
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                </div>
              </TabsContent>

              {/* AI Tab */}
              <TabsContent value="ai" className="mt-6 flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto pr-2">
                <Card>
                  <CardContent className="p-6">
                    <p className="text-muted-foreground">AI configuration coming soon...</p>
                  </CardContent>
                </Card>
                </div>
              </TabsContent>

              {/* Domain Setup Tab */}
              <TabsContent value="domain" className="mt-6 flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto pr-2">
                <Card>
                  <CardContent className="p-6 space-y-6">
                    {/* Visit Page Section */}
                    <div>
                      <Label className="text-sm font-semibold text-foreground mb-3 block">Visit Page</Label>
                      <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-foreground mb-1">Your Help Page is Live!</h3>
                            <p className="text-sm text-muted-foreground">
                              Share this link with your customers to access the help page
                            </p>
                          </div>
                          <Eye className="w-8 h-8 text-primary" />
                        </div>

                        <div className="flex gap-3">
                          <Input
                            value={helpPageUrl || (agentId ? `/help/${agentId}` : '')}
                            readOnly
                            className="flex-1 bg-background border-border"
                          />
                          <Button
                            variant="outline"
                            onClick={() => {
                              const urlToCopy = helpPageUrl || (agentId ? `${window.location.origin}/help/${agentId}` : '');
                              if (urlToCopy) {
                                navigator.clipboard.writeText(urlToCopy);
                                toast.success('Link copied to clipboard!');
                              }
                            }}
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Copy
                          </Button>
                          <Button
                            onClick={() => {
                              if (agentId) {
                                window.open(`/help/${agentId}`, '_blank');
                              }
                            }}
                            className="bg-primary hover:bg-primary/90"
                            disabled={!agentId}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Visit Page
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Domain Setup Section */}
                    <div>
                      <Label className="text-sm font-semibold text-foreground mb-3 block">Custom Domain</Label>
                      <div className="bg-muted/50 border border-border rounded-lg p-4">
                        <p className="text-sm text-muted-foreground mb-4">
                          Deploy your help page on a custom domain like help.yourdomain.com
                        </p>
                        <Button variant="outline" disabled className="w-full">
                          <Globe className="w-4 h-4 mr-2" />
                          Set up custom domain (Coming Soon)
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Panel - Preview */}
          <div className="flex flex-col h-full overflow-hidden">
            <Card className="overflow-hidden shadow-xl flex flex-col h-full">
              <CardContent className="p-0 flex flex-col flex-1 overflow-hidden">
                {/* Browser Chrome */}
                <div className="bg-muted px-4 py-3 flex items-center gap-2 border-b border-border flex-shrink-0">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                </div>

                {/* Preview Content */}
                <div
                  className="flex-1 flex overflow-hidden relative"
                  style={{
                    backgroundColor: settings.backgroundColor,
                    color: settings.theme === 'dark' ? '#ffffff' : '#000000'
                  }}
                >
                  {/* Sidebar */}
                  <div
                    className="w-64 border-r flex flex-col overflow-y-auto bg-card"
                    style={{ borderColor: settings.primaryColor + '20' }}
                  >
                    {/* Sidebar Header */}
                    <div className="p-4 border-b border-border flex-shrink-0">
                      {/* Collapse Button - Top Right */}
                      <div className="flex justify-end mb-4">
                        <button className="p-2 hover:bg-muted rounded-lg pointer-events-none">
                          <PanelLeftClose className="w-5 h-5 text-muted-foreground" />
                        </button>
                      </div>

                      {/* New Chat Button */}
                      <Button
                        variant="ghost"
                        className="w-full justify-start mb-3 hover:bg-muted pointer-events-none"
                      >
                        <div className="w-6 h-6 rounded-full border-2 border-border flex items-center justify-center mr-2">
                          <Plus className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <span className="font-medium text-foreground">New chat</span>
                      </Button>

                      {/* Dashboard Button */}
                      <Button
                        variant="outline"
                        className="w-full pointer-events-none border-border"
                      >
                        Dashboard
                      </Button>
                    </div>

                    {/* Conversations List */}
                    <div className="flex-1 overflow-y-auto px-4 py-3">
                      <div className="mb-3">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Recent chats
                        </h3>
                      </div>

                      {/* Sample Conversations */}
                      <div className="space-y-1">
                        <div className="px-3 py-2.5 rounded-lg hover:bg-muted cursor-pointer">
                          <p className="text-sm truncate text-foreground">Initial Greeting and Assist...</p>
                        </div>
                        <div className="px-3 py-2.5 rounded-lg hover:bg-muted cursor-pointer">
                          <p className="text-sm truncate text-foreground">How can I help you?</p>
                        </div>
                        <div className="px-3 py-2.5 rounded-lg hover:bg-muted cursor-pointer">
                          <p className="text-sm truncate text-foreground">Getting started</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Main Content Area */}
                  <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Main Chat Area - Centered Initial State */}
                    <div className="flex-1 flex items-center justify-center p-8">
                      <div className="max-w-3xl w-full text-center">
                        {/* Header Text */}
                        <h1
                          className={`text-4xl font-bold mb-8 text-foreground ${editMode ? 'cursor-pointer hover:ring-2 hover:ring-primary hover:ring-offset-2 rounded-lg p-2 inline-block transition-all' : ''}`}
                          onClick={() => handleElementClick('headerText')}
                        >
                          {settings.headerText}
                        </h1>

                        {/* Input Field */}
                        <div
                          className={`relative mb-6 ${editMode ? 'cursor-pointer hover:ring-2 hover:ring-primary hover:ring-offset-2 rounded-lg transition-all' : ''}`}
                          onClick={() => handleElementClick('inputPlaceholder')}
                        >
                          <Input
                            placeholder={settings.inputPlaceholder}
                            className="h-20 pl-6 pr-16 text-lg rounded-xl border-2 bg-card/90 backdrop-blur-xl shadow-xl pointer-events-none border-border"
                            style={{ borderColor: settings.primaryColor + '40' }}
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                            <Smile className="w-5 h-5 text-muted-foreground" />
                            <ArrowUp
                              className="w-6 h-6"
                              style={{ color: settings.primaryColor }}
                            />
                          </div>
                        </div>

                        {/* Suggestions */}
                        {settings.suggestions.length > 0 && (
                          <div
                            className={`flex flex-wrap gap-2 justify-center mb-6 ${editMode ? 'cursor-pointer hover:ring-2 hover:ring-primary hover:ring-offset-2 rounded-lg p-2 transition-all' : ''}`}
                            onClick={() => handleElementClick('suggestions')}
                          >
                            {settings.suggestions.map((suggestion) => (
                              <Button
                                key={suggestion.id}
                                variant="outline"
                                size="sm"
                                className="rounded-full pointer-events-none border-border"
                              >
                                {suggestion.text || 'Suggestion'}
                              </Button>
                            ))}
                          </div>
                        )}

                        {/* Link Cards */}
                        {settings.linkCards.length > 0 && (
                          <div
                            className={`space-y-3 ${editMode ? 'cursor-pointer hover:ring-2 hover:ring-primary hover:ring-offset-2 rounded-lg p-2 transition-all' : ''}`}
                            onClick={() => handleElementClick('linkCards')}
                          >
                            {settings.linkCards.map((card) => (
                              <div
                                key={card.id}
                                className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow pointer-events-none text-left bg-card"
                                style={{ borderColor: settings.primaryColor + '20' }}
                              >
                                <h3 className="font-semibold mb-1 text-foreground">
                                  {card.heading || 'Link heading'}
                                </h3>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {card.description || 'Description'}
                                </p>
                                <div className="flex items-center gap-2 text-sm" style={{ color: settings.primaryColor }}>
                                  <LinkIcon className="w-4 h-4" />
                                  <span>{card.url || 'https://'}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Edit Mode Toggle */}
                <div className="bg-muted/50 px-6 py-4 border-t border-border flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-foreground" />
                    <span className="text-sm font-medium text-foreground">Edit mode</span>
                    <span className="text-xs text-muted-foreground">Click elements to edit</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={editMode}
                      onCheckedChange={setEditMode}
                    />
                    <span className={`text-sm font-medium ${editMode ? 'text-primary' : 'text-muted-foreground'}`}>
                      {editMode ? 'On' : 'Off'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
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
  Moon
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

  const [activeTab, setActiveTab] = useState('help-page');
  const [settings, setSettings] = useState<HelpPageSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [heroFile, setHeroFile] = useState<File | null>(null);

  useEffect(() => {
    loadSettings();
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
      // Handle image uploads
      let logoUrl = settings.logo;
      let heroUrl = settings.heroImage;

      if (logoFile) {
        logoUrl = await uploadImage(logoFile);
      }

      if (heroFile) {
        heroUrl = await uploadImage(heroFile);
      }

      // Filter out undefined values to avoid Firestore errors
      const settingsToSave: Record<string, unknown> = {
        ...settings,
        workspaceId,
        agentId,
        updatedAt: serverTimestamp()
      };

      // Only include logo and heroImage if they have values
      if (logoUrl) {
        settingsToSave.logo = logoUrl;
      }
      if (heroUrl) {
        settingsToSave.heroImage = heroUrl;
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
    // For now, convert to base64. In production, upload to cloud storage
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  const handleHeroUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/dashboard/${workspaceSlug}/agents/${agentId}/deploy`)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Deploy
              </Button>
              <div className="h-6 w-px bg-gray-200"></div>
              <h1 className="text-xl font-bold">Help Page</h1>
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
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
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Settings */}
          <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="help-page">Help page</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
                <TabsTrigger value="ai">AI</TabsTrigger>
                <TabsTrigger value="domain">Domain setup</TabsTrigger>
              </TabsList>

              {/* Help Page Tab */}
              <TabsContent value="help-page" className="space-y-6 mt-6">
                {/* Logo Upload */}
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <Label className="text-sm font-semibold">Logo</Label>
                      <p className="text-xs text-gray-500 mt-1 mb-3">
                        Supports JPG, PNG, and SVG up to 1MB
                      </p>
                      <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/svg+xml"
                          onChange={handleLogoUpload}
                          className="hidden"
                          id="logo-upload"
                        />
                        <label htmlFor="logo-upload" className="cursor-pointer">
                          {logoFile || settings.logo ? (
                            <div className="space-y-2">
                              <ImageIcon className="w-12 h-12 mx-auto text-gray-400" />
                              <p className="text-sm text-gray-600">
                                {logoFile?.name || 'Logo uploaded'}
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Upload className="w-12 h-12 mx-auto text-gray-400" />
                              <p className="text-sm font-medium">Upload</p>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Theme Selection */}
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <Label className="text-sm font-semibold">Theme</Label>
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
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <Label className="text-sm font-semibold">Primary Color</Label>
                      <div className="flex gap-3 mt-2">
                        <Input
                          type="color"
                          value={settings.primaryColor}
                          onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                          className="w-16 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={settings.primaryColor}
                          onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                          className="flex-1"
                          placeholder="#000000"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-semibold">Background Color</Label>
                      <div className="flex gap-3 mt-2">
                        <Input
                          type="color"
                          value={settings.backgroundColor}
                          onChange={(e) => setSettings({ ...settings, backgroundColor: e.target.value })}
                          className="w-16 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={settings.backgroundColor}
                          onChange={(e) => setSettings({ ...settings, backgroundColor: e.target.value })}
                          className="flex-1"
                          placeholder="#ffffff"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Hero Image */}
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <Label className="text-sm font-semibold">Hero Image</Label>
                      <p className="text-xs text-gray-500 mt-1 mb-3">
                        Supports JPG, PNG, and SVG up to 1MB
                      </p>
                      <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/svg+xml"
                          onChange={handleHeroUpload}
                          className="hidden"
                          id="hero-upload"
                        />
                        <label htmlFor="hero-upload" className="cursor-pointer">
                          {heroFile || settings.heroImage ? (
                            <div className="space-y-2">
                              <ImageIcon className="w-12 h-12 mx-auto text-gray-400" />
                              <p className="text-sm text-gray-600">
                                {heroFile?.name || 'Hero image uploaded'}
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Upload className="w-12 h-12 mx-auto text-gray-400" />
                              <p className="text-sm font-medium">Upload</p>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Text Customization */}
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <Label className="text-sm font-semibold">Header Text</Label>
                      <Input
                        value={settings.headerText}
                        onChange={(e) => setSettings({ ...settings, headerText: e.target.value })}
                        placeholder="How can I help you today?"
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-semibold">Input Placeholder</Label>
                      <Input
                        value={settings.inputPlaceholder}
                        onChange={(e) => setSettings({ ...settings, inputPlaceholder: e.target.value })}
                        placeholder="Ask me anything..."
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-semibold">New Chat Button Text</Label>
                      <Input
                        value={settings.newChatButtonText}
                        onChange={(e) => setSettings({ ...settings, newChatButtonText: e.target.value })}
                        placeholder="New chat"
                        className="mt-2"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Primary Buttons */}
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold">Primary Buttons</Label>
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
                          className="flex-1"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removePrimaryButton(button.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Secondary Buttons */}
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold">Secondary Buttons</Label>
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
                          className="flex-1"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeSecondaryButton(button.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Suggestions */}
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold">Suggested Messages</Label>
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
                          className="flex-1"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeSuggestion(suggestion.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Link Cards */}
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold">Link Cards</Label>
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
                      <div key={card.id} className="space-y-2 p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-xs font-medium text-gray-600">Link Card</Label>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeLinkCard(card.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                        <Input
                          value={card.heading}
                          onChange={(e) => updateLinkCard(card.id, 'heading', e.target.value)}
                          placeholder="Link heading"
                        />
                        <Textarea
                          value={card.description}
                          onChange={(e) => updateLinkCard(card.id, 'description', e.target.value)}
                          placeholder="This is a short description to the link"
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <LinkIcon className="w-4 h-4 text-gray-400 mt-3" />
                          <Input
                            value={card.url}
                            onChange={(e) => updateLinkCard(card.id, 'url', e.target.value)}
                            placeholder="https://"
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    <p className="text-gray-600">Additional settings coming soon...</p>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* AI Tab */}
              <TabsContent value="ai" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    <p className="text-gray-600">AI configuration coming soon...</p>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Domain Setup Tab */}
              <TabsContent value="domain" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800">
                        You can only set up the domain setup after the help page is deployed.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Panel - Preview */}
          <div className="lg:sticky lg:top-24 h-fit">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {/* Browser Chrome */}
                <div className="bg-gray-100 px-4 py-3 flex items-center gap-2 border-b">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                </div>

                {/* Preview Content */}
                <div
                  className="min-h-[600px] p-8"
                  style={{
                    backgroundColor: settings.backgroundColor,
                    color: settings.theme === 'dark' ? '#ffffff' : '#000000'
                  }}
                >
                  {/* Logo */}
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      {(logoFile || settings.logo) ? (
                        <img
                          src={logoFile ? URL.createObjectURL(logoFile) : settings.logo}
                          alt="Logo"
                          className="h-8 w-auto object-contain"
                        />
                      ) : (
                        <div className="flex items-center gap-2 text-gray-400">
                          <ImageIcon className="w-6 h-6" />
                          <span className="text-sm">Logo</span>
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      style={{ color: settings.primaryColor }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {settings.newChatButtonText}
                    </Button>
                  </div>

                  {/* Primary Buttons */}
                  {settings.primaryButtons.length > 0 && (
                    <div className="space-y-2 mb-6">
                      {settings.primaryButtons.map((button) => (
                        <Button
                          key={button.id}
                          variant="outline"
                          className="w-full justify-start"
                          style={{ borderColor: settings.primaryColor + '40' }}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          {button.text || 'Add primary button'}
                        </Button>
                      ))}
                    </div>
                  )}

                  {/* Secondary Buttons */}
                  {settings.secondaryButtons.length > 0 && (
                    <div className="space-y-2 mb-8">
                      {settings.secondaryButtons.map((button) => (
                        <Button
                          key={button.id}
                          variant="ghost"
                          className="w-full justify-start"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          {button.text || 'Add button'}
                        </Button>
                      ))}
                    </div>
                  )}

                  {/* Hero Image */}
                  <div className="text-center mb-8">
                    {(heroFile || settings.heroImage) ? (
                      <img
                        src={heroFile ? URL.createObjectURL(heroFile) : settings.heroImage}
                        alt="Hero"
                        className="w-24 h-24 mx-auto object-cover rounded-lg mb-6"
                      />
                    ) : (
                      <div className="w-24 h-24 mx-auto bg-gray-200 rounded-lg flex items-center justify-center mb-6">
                        <ImageIcon className="w-12 h-12 text-gray-400" />
                      </div>
                    )}

                    <h1 className="text-3xl font-bold mb-6">{settings.headerText}</h1>

                    {/* Input Field */}
                    <div className="max-w-2xl mx-auto">
                      <div className="relative">
                        <Input
                          placeholder={settings.inputPlaceholder}
                          className="pr-20 h-12 text-base"
                          style={{ borderColor: settings.primaryColor + '40' }}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                          <Button size="icon" variant="ghost" className="h-8 w-8">
                            <Smile className="w-4 h-4 text-gray-400" />
                          </Button>
                          <Button
                            size="icon"
                            className="h-8 w-8"
                            style={{ backgroundColor: settings.primaryColor }}
                          >
                            <svg
                              className="w-4 h-4 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                            </svg>
                          </Button>
                        </div>
                      </div>

                      {/* Gradient Bar */}
                      <div
                        className="h-1 mt-4 rounded-full"
                        style={{
                          background: 'linear-gradient(to right, #ec4899, #8b5cf6, #3b82f6, #10b981, #f59e0b)'
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Suggestions */}
                  {settings.suggestions.length > 0 && (
                    <div className="max-w-2xl mx-auto mb-8">
                      <div className="flex flex-wrap gap-2 justify-center">
                        {settings.suggestions.map((suggestion) => (
                          <Button
                            key={suggestion.id}
                            variant="outline"
                            size="sm"
                            className="rounded-full"
                          >
                            {suggestion.text || 'Suggestion'}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Link Cards */}
                  {settings.linkCards.length > 0 && (
                    <div className="max-w-2xl mx-auto space-y-4">
                      {settings.linkCards.map((card) => (
                        <div
                          key={card.id}
                          className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                          style={{ borderColor: settings.primaryColor + '20' }}
                        >
                          <h3 className="font-semibold mb-1">
                            {card.heading || 'Link heading'}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {card.description || 'This is a short description to the link'}
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

                {/* Edit Mode Toggle */}
                <div className="bg-gray-50 px-6 py-4 border-t flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm font-medium">Edit mode</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-600 font-medium">On</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <ImageIcon className="w-4 h-4" />
                      </Button>
                    </div>
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

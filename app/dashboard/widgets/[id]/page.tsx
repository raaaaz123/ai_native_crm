'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '../../../lib/workspace-auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Save, 
  RotateCcw, 
  Monitor, 
  Smartphone,
  Settings,
  Palette,
  MessageCircle,
  Clock,
  Bot,
  Upload,
  Eye,
  X,
  Plus,
  User
} from 'lucide-react';
import Link from 'next/link';
import { getBusinessWidgets, updateChatWidget, type ChatWidget } from '@/app/lib/chat-utils';
import WidgetPreview from './WidgetPreview';
import { storage } from '@/app/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function CustomizeWidgetPage() {
  const params = useParams();
  const router = useRouter();
  const { workspaceContext } = useAuth();
  const widgetId = params.id as string;

  const [widget, setWidget] = useState<ChatWidget | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [hasChanges, setHasChanges] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    welcomeMessage: 'Welcome! How can we help you today?',
    primaryColor: '#3B82F6',
    secondaryColor: '#EFF6FF',
    textColor: '#FFFFFF',
    position: 'bottom-right' as 'bottom-right' | 'bottom-left',
    buttonText: 'Chat with us',
    placeholderText: 'Type your message...',
    offlineMessage: 'We are currently offline. Please leave a message and we will get back to you.',
    requireContactForm: true,
    collectName: true,
    collectEmail: true,
    collectPhone: false,
    customFields: [] as Array<{id: string, label: string, type: 'text' | 'email' | 'phone' | 'number', required: boolean, placeholder?: string}>,
    autoReply: 'Thank you for your message! We will get back to you shortly.',
    iconType: 'default' as 'default' | 'custom',
    customIcon: '',
    widgetSize: 'standard' as 'compact' | 'standard' | 'large',
    borderRadius: '16',
    // Mobile UI Settings
    mobileLayout: 'expanded' as 'shrinked' | 'expanded' | 'fullscreen',
    mobileFullScreen: false,
    showBranding: true,
    soundEnabled: true,
    messageSound: 'default',
    headerSubtitle: "We're here to help!",
    greetingDelay: 3,
    quickReplies: ['Get Support', 'Pricing', 'Contact Sales'],
    // Chat Button Appearance
    buttonStyle: 'rounded' as 'circular' | 'rounded' | 'square' | 'pill' | 'modern' | 'gradient',
    buttonAnimation: 'pulse' as 'none' | 'pulse' | 'bounce' | 'shake' | 'glow',
    buttonSize: 'medium' as 'small' | 'medium' | 'large' | 'xl',
    buttonShadow: 'medium' as 'none' | 'small' | 'medium' | 'large' | 'xlarge',
    buttonHoverEffect: 'scale' as 'none' | 'scale' | 'lift' | 'glow' | 'rotate',
    buttonTooltip: 'Chat with us',
    showButtonTooltip: true,
    // Badge/Notification
    showBadge: false,
    badgeCount: 0,
    badgeColor: '#EF4444',
    badgePosition: 'top-right' as 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left',
    badgeAnimation: 'pulse' as 'none' | 'pulse' | 'bounce' | 'ping',
    showOnlineDot: true,
    onlineDotColor: '#10B981',
    businessHours: {
      enabled: false,
      timezone: 'UTC',
      monday: { start: '09:00', end: '17:00', enabled: true },
      tuesday: { start: '09:00', end: '17:00', enabled: true },
      wednesday: { start: '09:00', end: '17:00', enabled: true },
      thursday: { start: '09:00', end: '17:00', enabled: true },
      friday: { start: '09:00', end: '17:00', enabled: true },
      saturday: { start: '09:00', end: '17:00', enabled: false },
      sunday: { start: '09:00', end: '17:00', enabled: false }
    },
    aiConfig: {
      enabled: true,
      provider: 'openrouter',
      model: 'openai/gpt-5-mini',
      temperature: 0.7,
      maxTokens: 500,
      confidenceThreshold: 0.5,
      maxRetrievalDocs: 5,
      ragEnabled: true,
      fallbackToHuman: true,
      embeddingProvider: 'openai',
      embeddingModel: 'text-embedding-3-large',
      rerankerEnabled: true,
      rerankerModel: 'rerank-2.5',
      systemPrompt: 'support',
      customSystemPrompt: ''
    },
    // Customer Handover Settings
    customerHandover: {
      enabled: true,
      showHandoverButton: true,
      handoverButtonText: 'Talk to Human Agent',
      handoverButtonPosition: 'bottom' as 'bottom' | 'top' | 'floating',
      includeInQuickReplies: true,
      autoDetectKeywords: false,
      detectionKeywords: ['talk to human', 'speak to agent', 'human representative', 'real person', 'support agent', 'customer service', 'live agent'],
      handoverMessage: "I'll connect you with a human agent right away. Please wait a moment.",
      notificationToAgent: true,
      allowCustomerToSwitch: true,
      smartFallbackEnabled: true
    }
  });

  const [uploadingImage, setUploadingImage] = useState(false);

  const [originalData, setOriginalData] = useState(formData);

  useEffect(() => {
    loadWidget();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widgetId, workspaceContext]);

  const loadWidget = async () => {
    if (!workspaceContext?.currentWorkspace?.id) return;

    try {
      setLoading(true);
      const result = await getBusinessWidgets(workspaceContext.currentWorkspace.id);
      
      if (result.success) {
        const foundWidget = result.data.find(w => w.id === widgetId);
        if (foundWidget) {
          setWidget(foundWidget);
          // Type for extended widget properties
          type ExtendedWidget = ChatWidget & Record<string, unknown>;
          const extendedWidget = foundWidget as ExtendedWidget;
          
          const data = {
            name: foundWidget.name,
            welcomeMessage: foundWidget.welcomeMessage,
            primaryColor: foundWidget.primaryColor,
            secondaryColor: (extendedWidget.secondaryColor as string | undefined) || '#EFF6FF',
            textColor: (extendedWidget.textColor as string | undefined) || '#FFFFFF',
            position: foundWidget.position as 'bottom-right' | 'bottom-left',
            buttonText: foundWidget.buttonText,
            placeholderText: foundWidget.placeholderText,
            offlineMessage: foundWidget.offlineMessage,
            requireContactForm: extendedWidget.requireContactForm !== undefined ? (extendedWidget.requireContactForm as boolean) : true,
            collectName: extendedWidget.collectName !== undefined ? (extendedWidget.collectName as boolean) : true,
            collectEmail: foundWidget.collectEmail,
            collectPhone: foundWidget.collectPhone,
            customFields: (extendedWidget.customFields as Array<{id: string, label: string, type: 'text' | 'email' | 'phone' | 'number', required: boolean, placeholder?: string}> | undefined) || [],
            autoReply: foundWidget.autoReply,
            iconType: (extendedWidget.iconType as 'default' | 'custom' | undefined) || 'default' as 'default' | 'custom',
            customIcon: (extendedWidget.customIcon as string | undefined) || '',
            widgetSize: (extendedWidget.widgetSize as 'compact' | 'standard' | 'large' | undefined) || 'standard' as 'compact' | 'standard' | 'large',
            borderRadius: (extendedWidget.borderRadius as string | undefined) || '16',
            showBranding: extendedWidget.showBranding !== undefined ? (extendedWidget.showBranding as boolean) : true,
            soundEnabled: extendedWidget.soundEnabled !== undefined ? (extendedWidget.soundEnabled as boolean) : true,
            messageSound: (extendedWidget.messageSound as string | undefined) || 'default',
            headerSubtitle: (extendedWidget.headerSubtitle as string | undefined) || "We're here to help!",
            greetingDelay: (extendedWidget.greetingDelay as number | undefined) || 3,
            quickReplies: (extendedWidget.quickReplies as string[] | undefined) || ['Get Support', 'Pricing', 'Contact Sales'],
            // Chat Button Appearance
            buttonStyle: (extendedWidget.buttonStyle as 'circular' | 'rounded' | 'square' | 'pill' | 'modern' | 'gradient' | undefined) || 'rounded' as 'circular' | 'rounded' | 'square' | 'pill' | 'modern' | 'gradient',
            buttonAnimation: (extendedWidget.buttonAnimation as 'none' | 'pulse' | 'bounce' | 'shake' | 'glow' | undefined) || 'pulse' as 'none' | 'pulse' | 'bounce' | 'shake' | 'glow',
            buttonSize: (extendedWidget.buttonSize as 'small' | 'medium' | 'large' | 'xl' | undefined) || 'medium' as 'small' | 'medium' | 'large' | 'xl',
            buttonShadow: (extendedWidget.buttonShadow as 'none' | 'small' | 'medium' | 'large' | 'xlarge' | undefined) || 'medium' as 'none' | 'small' | 'medium' | 'large' | 'xlarge',
            buttonHoverEffect: (extendedWidget.buttonHoverEffect as 'none' | 'scale' | 'lift' | 'glow' | 'rotate' | undefined) || 'scale' as 'none' | 'scale' | 'lift' | 'glow' | 'rotate',
            buttonTooltip: (extendedWidget.buttonTooltip as string | undefined) || 'Chat with us',
            showButtonTooltip: extendedWidget.showButtonTooltip !== undefined ? (extendedWidget.showButtonTooltip as boolean) : true,
            showBadge: (extendedWidget.showBadge as boolean | undefined) || false,
            badgeCount: (extendedWidget.badgeCount as number | undefined) || 0,
            badgeColor: (extendedWidget.badgeColor as string | undefined) || '#EF4444',
            badgePosition: (extendedWidget.badgePosition as 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | undefined) || 'top-right' as 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left',
            badgeAnimation: (extendedWidget.badgeAnimation as 'none' | 'pulse' | 'bounce' | 'ping' | undefined) || 'pulse' as 'none' | 'pulse' | 'bounce' | 'ping',
            showOnlineDot: extendedWidget.showOnlineDot !== undefined ? (extendedWidget.showOnlineDot as boolean) : true,
            onlineDotColor: (extendedWidget.onlineDotColor as string | undefined) || '#10B981',
            businessHours: foundWidget.businessHours,
            aiConfig: {
              enabled: foundWidget.aiConfig?.enabled || false,
              provider: foundWidget.aiConfig?.provider || 'openrouter',
              model: foundWidget.aiConfig?.model || 'openai/gpt-5-mini',
              temperature: foundWidget.aiConfig?.temperature || 0.7,
              maxTokens: foundWidget.aiConfig?.maxTokens || 500,
              confidenceThreshold: foundWidget.aiConfig?.confidenceThreshold || 0.6,
              maxRetrievalDocs: foundWidget.aiConfig?.maxRetrievalDocs || 5,
              ragEnabled: foundWidget.aiConfig?.ragEnabled || false,
              fallbackToHuman: foundWidget.aiConfig?.fallbackToHuman !== undefined ? foundWidget.aiConfig.fallbackToHuman : true,
              embeddingProvider: (foundWidget.aiConfig as {embeddingProvider?: string})?.embeddingProvider || 'openai',
              embeddingModel: (foundWidget.aiConfig as {embeddingModel?: string})?.embeddingModel || 'text-embedding-3-large',
              rerankerEnabled: (foundWidget.aiConfig as {rerankerEnabled?: boolean})?.rerankerEnabled !== undefined ? !!(foundWidget.aiConfig as {rerankerEnabled?: boolean}).rerankerEnabled : true,
              rerankerModel: (foundWidget.aiConfig as {rerankerModel?: string})?.rerankerModel || 'rerank-2.5',
              systemPrompt: foundWidget.aiConfig?.systemPrompt || 'support',
              customSystemPrompt: foundWidget.aiConfig?.customSystemPrompt || ''
            },
            customerHandover: {
              enabled: (extendedWidget.customerHandover as Record<string, unknown> | undefined)?.enabled !== undefined ? ((extendedWidget.customerHandover as Record<string, unknown>).enabled as boolean) : true,
              showHandoverButton: (extendedWidget.customerHandover as Record<string, unknown> | undefined)?.showHandoverButton !== undefined ? ((extendedWidget.customerHandover as Record<string, unknown>).showHandoverButton as boolean) : true,
              handoverButtonText: ((extendedWidget.customerHandover as Record<string, unknown> | undefined)?.handoverButtonText as string | undefined) || 'Talk to Human Agent',
              handoverButtonPosition: ((extendedWidget.customerHandover as Record<string, unknown> | undefined)?.handoverButtonPosition as 'bottom' | 'top' | 'floating' | undefined) || 'bottom' as 'bottom' | 'top' | 'floating',
              includeInQuickReplies: (extendedWidget.customerHandover as Record<string, unknown> | undefined)?.includeInQuickReplies !== undefined ? ((extendedWidget.customerHandover as Record<string, unknown>).includeInQuickReplies as boolean) : true,
              autoDetectKeywords: (extendedWidget.customerHandover as Record<string, unknown> | undefined)?.autoDetectKeywords !== undefined ? ((extendedWidget.customerHandover as Record<string, unknown>).autoDetectKeywords as boolean) : false,
              detectionKeywords: ((extendedWidget.customerHandover as Record<string, unknown> | undefined)?.detectionKeywords as string[] | undefined) || ['talk to human', 'speak to agent', 'human representative', 'real person', 'support agent', 'customer service', 'live agent'],
              handoverMessage: ((extendedWidget.customerHandover as Record<string, unknown> | undefined)?.handoverMessage as string | undefined) || "I'll connect you with a human agent right away. Please wait a moment.",
              notificationToAgent: (extendedWidget.customerHandover as Record<string, unknown> | undefined)?.notificationToAgent !== undefined ? ((extendedWidget.customerHandover as Record<string, unknown>).notificationToAgent as boolean) : true,
              allowCustomerToSwitch: (extendedWidget.customerHandover as Record<string, unknown> | undefined)?.allowCustomerToSwitch !== undefined ? ((extendedWidget.customerHandover as Record<string, unknown>).allowCustomerToSwitch as boolean) : true,
              smartFallbackEnabled: (extendedWidget.customerHandover as Record<string, unknown> | undefined)?.smartFallbackEnabled !== undefined ? ((extendedWidget.customerHandover as Record<string, unknown>).smartFallbackEnabled as boolean) : true
            },
            // Mobile UI Settings
            mobileLayout: (extendedWidget.mobileLayout as 'shrinked' | 'expanded' | 'fullscreen' | undefined) || 'expanded' as 'shrinked' | 'expanded' | 'fullscreen',
            mobileFullScreen: (extendedWidget.mobileFullScreen as boolean | undefined) || false
          };
          setFormData(data);
          setOriginalData(data);
        } else {
          router.push('/dashboard/widgets');
        }
      }
    } catch (error) {
      console.error('Error loading widget:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!widget) return;

    try {
      setSaving(true);
      
      // Log what we're saving for debugging
      console.log('Saving widget data:', {
        ...formData,
        buttonStyle: formData.buttonStyle,
        buttonAnimation: formData.buttonAnimation,
        buttonSize: formData.buttonSize,
        showBadge: formData.showBadge,
        badgeCount: formData.badgeCount,
        showOnlineDot: formData.showOnlineDot
      });
      
      const result = await updateChatWidget(widget.id, formData);
      
      if (result.success) {
        setOriginalData(formData);
        setHasChanges(false);
        alert('Widget updated successfully!');
      } else {
        alert('Failed to update widget: ' + result.error);
      }
    } catch (error) {
      console.error('Error saving widget:', error);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setFormData(originalData);
    setHasChanges(false);
  };

  const handleInputChange = (field: string, value: string | boolean | number | string[] | Array<{id: string, label: string, type: 'text' | 'email' | 'phone' | 'number', required: boolean, placeholder?: string}>) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleNestedChange = (parent: string, field: string, value: string | boolean | number | string[]) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent as keyof typeof prev] as Record<string, unknown>),
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image size should be less than 2MB');
      return;
    }

    try {
      setUploadingImage(true);
      
      // Create a unique filename
      const timestamp = Date.now();
      const filename = `widget-icons/${widgetId}/${timestamp}_${file.name}`;
      const storageRef = ref(storage, filename);
      
      // Upload file
      await uploadBytes(storageRef, file);
      
      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      // Update form data
      handleInputChange('customIcon', downloadURL);
      handleInputChange('iconType', 'custom');
      
      alert('Image uploaded successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-blue-50/20 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading widget...</p>
        </div>
      </div>
    );
  }

  if (!widget) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-blue-50/20 flex items-center justify-center z-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Widget not found</p>
          <Link href="/dashboard/widgets">
            <Button>Back to Widgets</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--border));
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--muted-foreground));
        }
      `}</style>
      <div className="w-full h-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/widgets">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 hover:bg-accent cursor-pointer">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2 truncate">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Settings className="w-4 h-4 text-primary" />
                </div>
                <span className="truncate">Customize Widget</span>
              </h1>
              <p className="text-sm text-muted-foreground truncate mt-1">{widget.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Preview Mode Toggle */}
            <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1 shadow-sm">
              <button
                onClick={() => setViewMode('desktop')}
                className={`p-2 rounded transition-colors cursor-pointer ${
                  viewMode === 'desktop' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:bg-accent'
                }`}
                title="Desktop View"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('mobile')}
                className={`p-2 rounded transition-colors cursor-pointer ${
                  viewMode === 'mobile' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:bg-accent'
                }`}
                title="Mobile View"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>

            {hasChanges && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleReset} 
                className="h-8 px-3 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            )}
            
            <Button 
              onClick={handleSave} 
              disabled={saving || !hasChanges}
              size="sm"
              className="h-8 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 px-4 cursor-pointer"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent mr-2"></div>
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
        </div>

        {/* Mobile Preview Info - Shows at Top on Small Screens */}
        <div className="xl:hidden mb-6">
          <Card className="bg-accent border border-border rounded-lg shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Eye className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-2">Live Preview</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Click the chat button at the {formData.position === 'bottom-right' ? 'bottom-right' : 'bottom-left'} corner to test.
              </p>
              <div className="bg-card border border-border rounded-lg p-3 space-y-2 text-left text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mode:</span>
                  <span className="font-semibold text-foreground">{viewMode === 'mobile' ? '📱 Mobile' : '💻 Desktop'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Size:</span>
                  <span className="font-semibold text-foreground">{formData.widgetSize === 'compact' ? 'Compact' : formData.widgetSize === 'standard' ? 'Standard' : 'Large'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mobile:</span>
                  <span className="font-semibold text-foreground">
                    {formData.mobileLayout === 'shrinked' ? '📱 Shrinked' : 
                     formData.mobileLayout === 'expanded' ? '📲 Expanded' : 
                     formData.mobileFullScreen ? '🖥️ Full Screen' : '📲 Full Screen'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Render Widget Preview Component */}
        <WidgetPreview 
          widget={{
            ...formData,
            id: widgetId,
            businessId: workspaceContext?.currentWorkspace?.id || ''
          }} 
          viewMode={viewMode} 
        />

        {/* Main Content - Tabbed Interface with Preview */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr,450px] gap-6 items-start">
          {/* Left Side - Tabbed Settings */}
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 mb-6 h-auto p-1 bg-muted overflow-x-auto">
              <TabsTrigger value="basic" className="text-sm py-3 px-3 data-[state=active]:bg-background flex items-center gap-2 min-w-0 cursor-pointer">
                <Settings className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Basic</span>
              </TabsTrigger>
              <TabsTrigger value="button" className="text-sm py-3 px-3 data-[state=active]:bg-background flex items-center gap-2 min-w-0 cursor-pointer">
                <MessageCircle className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Button</span>
              </TabsTrigger>
              <TabsTrigger value="appearance" className="text-sm py-3 px-3 data-[state=active]:bg-background flex items-center gap-2 min-w-0 cursor-pointer">
                <Palette className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Style</span>
              </TabsTrigger>
              <TabsTrigger value="ai" className="text-sm py-3 px-3 data-[state=active]:bg-background flex items-center gap-2 min-w-0 cursor-pointer">
                <Bot className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">AI</span>
              </TabsTrigger>
              <TabsTrigger value="contact" className="text-sm py-3 px-3 data-[state=active]:bg-background flex items-center gap-2 min-w-0 cursor-pointer">
                <User className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Contact</span>
              </TabsTrigger>
              <TabsTrigger value="hours" className="text-sm py-3 px-3 data-[state=active]:bg-background flex items-center gap-2 min-w-0 cursor-pointer">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Hours</span>
              </TabsTrigger>
            </TabsList>

            {/* Basic Settings Tab */}
            <TabsContent value="basic" className="space-y-4 mt-0">
              <Card className="bg-card border border-border rounded-lg shadow-sm">
                <CardHeader className="pb-4 bg-accent rounded-t-lg border-b border-border">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                      <Settings className="w-4 h-4 text-primary-foreground" />
                    </div>
                    Basic Settings
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Essential widget configuration and messages</p>
                </CardHeader>
                <CardContent className="p-5 space-y-5">
                  {/* Widget Name */}
                  <div className="p-4 bg-accent rounded-lg border border-border">
                    <Label htmlFor="name" className="text-sm font-semibold text-foreground mb-2 block">
                      Widget Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="e.g., Support Chat Widget"
                      className="h-9 text-sm bg-background border-border focus:border-primary cursor-pointer"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-2">Internal name for identifying this widget</p>
                  </div>

                  {/* Welcome Message */}
                  <div className="p-4 bg-accent rounded-lg border border-border">
                    <Label htmlFor="welcomeMessage" className="text-sm font-semibold text-foreground mb-2 block">
                      Welcome Message
                    </Label>
                    <Textarea
                      id="welcomeMessage"
                      value={formData.welcomeMessage}
                      onChange={(e) => handleInputChange('welcomeMessage', e.target.value)}
                      placeholder="Welcome! How can we help you today?"
                      rows={2}
                      className="text-sm bg-background border-border resize-none focus:border-primary cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground mt-2">First message customers see when opening chat</p>
                  </div>

                  {/* AI Agent Type / System Prompt */}
                  <div className="p-3 sm:p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                    <Label htmlFor="systemPrompt" className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3 block">
                      🤖 AI Agent Type
                    </Label>
                    <Select
                      value={formData.aiConfig.systemPrompt}
                      onValueChange={(value) => handleNestedChange('aiConfig', 'systemPrompt', value)}
                    >
                      <SelectTrigger className="h-9 sm:h-10 bg-white border-2 border-gray-200 focus:border-indigo-500 text-xs sm:text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 overflow-y-auto">
                        <SelectItem value="support" className="text-xs sm:text-sm">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                            <span>💬 Support Assistant</span>
                            <span className="text-gray-500 text-xs">Help customers with questions & issues</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="sales" className="text-xs sm:text-sm">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                            <span>💰 Sales Assistant</span>
                            <span className="text-gray-500 text-xs">Help with product info & purchasing</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="booking" className="text-xs sm:text-sm">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                            <span>📅 Booking Assistant</span>
                            <span className="text-gray-500 text-xs">Schedule appointments & reservations</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="technical" className="text-xs sm:text-sm">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                            <span>🔧 Technical Support</span>
                            <span className="text-gray-500 text-xs">Handle technical troubleshooting</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="general" className="text-xs sm:text-sm">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                            <span>🌟 General Assistant</span>
                            <span className="text-gray-500 text-xs">Versatile helper for all queries</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="custom" className="text-xs sm:text-sm">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                            <span>✏️ Custom</span>
                            <span className="text-gray-500 text-xs">Write your own system prompt</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {formData.aiConfig.systemPrompt === 'custom' && (
                      <div className="mt-2 sm:mt-3">
                        <Label htmlFor="customSystemPrompt" className="text-xs font-medium text-gray-700 mb-1.5 sm:mb-2 block">
                          Custom System Prompt
                        </Label>
                        <Textarea
                          id="customSystemPrompt"
                          value={formData.aiConfig.customSystemPrompt}
                          onChange={(e) => handleNestedChange('aiConfig', 'customSystemPrompt', e.target.value)}
                          placeholder="You are a helpful assistant that..."
                          rows={3}
                          className="text-xs sm:text-sm bg-white border-2 border-gray-200 resize-none focus:border-indigo-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Define how your AI agent should behave</p>
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                      This defines your AI agent&apos;s personality and behavior. The agent will act according to this role.
                    </p>
                  </div>

                  {/* Button & Placeholder Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Button Text */}
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <Label htmlFor="buttonText" className="text-sm font-semibold text-gray-900 mb-2 block">
                        Button Text
                      </Label>
                      <Input
                        id="buttonText"
                        value={formData.buttonText}
                        onChange={(e) => handleInputChange('buttonText', e.target.value)}
                        placeholder="Chat with us"
                        className="h-9 text-sm bg-white border-2 border-gray-200 focus:border-purple-500"
                      />
                      <p className="text-xs text-gray-600 mt-2">Text on floating chat button</p>
                    </div>

                    {/* Placeholder Text */}
                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <Label htmlFor="placeholderText" className="text-sm font-semibold text-gray-900 mb-2 block">
                        Input Placeholder
                      </Label>
                      <Input
                        id="placeholderText"
                        value={formData.placeholderText}
                        onChange={(e) => handleInputChange('placeholderText', e.target.value)}
                        placeholder="Type your message..."
                        className="h-9 text-sm bg-white border-2 border-gray-200 focus:border-orange-500"
                      />
                      <p className="text-xs text-gray-600 mt-2">Hint text in message input</p>
                    </div>
                  </div>

                  {/* Contact Form / Data Collection */}
                  <div className="p-4 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-lg border border-teal-200">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <Label htmlFor="requireContactForm" className="text-sm font-semibold text-gray-900">📋 Contact Form</Label>
                        <p className="text-xs text-gray-600 mt-0.5">Collect visitor info before chat starts</p>
                      </div>
                      <Switch
                        id="requireContactForm"
                        checked={formData.requireContactForm}
                        onCheckedChange={(checked) => handleInputChange('requireContactForm', checked)}
                      />
                    </div>

                    {formData.requireContactForm ? (
                      <div className="space-y-3 pt-3 border-t border-teal-200 bg-white rounded-lg p-3">
                        {/* Standard Fields */}
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-gray-700">Standard Fields</Label>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                              <Label htmlFor="collectName" className="text-xs font-medium">Name</Label>
                              <Switch
                                id="collectName"
                                checked={formData.collectName}
                                onCheckedChange={(checked) => handleInputChange('collectName', checked)}
                                className="scale-75"
                              />
                            </div>
                            <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                              <Label htmlFor="collectEmail" className="text-xs font-medium">Email</Label>
                              <Switch
                                id="collectEmail"
                                checked={formData.collectEmail}
                                onCheckedChange={(checked) => handleInputChange('collectEmail', checked)}
                                className="scale-75"
                              />
                            </div>
                            <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                              <Label htmlFor="collectPhone" className="text-xs font-medium">Phone</Label>
                              <Switch
                                id="collectPhone"
                                checked={formData.collectPhone}
                                onCheckedChange={(checked) => handleInputChange('collectPhone', checked)}
                                className="scale-75"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Custom Fields */}
                        <div className="space-y-2 pt-2 border-t border-gray-200">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-semibold text-gray-700">Custom Fields</Label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newField = {
                                  id: `custom_${Date.now()}`,
                                  label: '',
                                  type: 'text' as const,
                                  required: false,
                                  placeholder: ''
                                };
                                handleInputChange('customFields', [...formData.customFields, newField]);
                              }}
                              className="h-7 text-xs"
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Add Field
                            </Button>
                          </div>

                          {formData.customFields.length > 0 ? (
                            <div className="space-y-2">
                              {formData.customFields.map((field, index) => (
                                <div key={field.id} className="p-2 border border-gray-200 rounded bg-gray-50 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <Label className="text-xs font-semibold">Field {index + 1}</Label>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const newFields = formData.customFields.filter((_, i) => i !== index);
                                        handleInputChange('customFields', newFields);
                                      }}
                                      className="h-6 w-6 p-0 text-red-600 hover:bg-red-50"
                                    >
                                      <X className="w-3 h-3" />
                                    </Button>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-2">
                                    <Input
                                      value={field.label}
                                      onChange={(e) => {
                                        const newFields = [...formData.customFields];
                                        newFields[index].label = e.target.value;
                                        handleInputChange('customFields', newFields);
                                      }}
                                      placeholder="Label"
                                      className="h-7 text-xs"
                                    />
                                    <Select
                                      value={field.type}
                                      onValueChange={(value: 'text' | 'email' | 'phone' | 'number') => {
                                        const newFields = [...formData.customFields];
                                        newFields[index].type = value;
                                        handleInputChange('customFields', newFields);
                                      }}
                                    >
                                      <SelectTrigger className="h-7 text-xs">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="text">Text</SelectItem>
                                        <SelectItem value="email">Email</SelectItem>
                                        <SelectItem value="phone">Phone</SelectItem>
                                        <SelectItem value="number">Number</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <Input
                                      value={field.placeholder || ''}
                                      onChange={(e) => {
                                        const newFields = [...formData.customFields];
                                        newFields[index].placeholder = e.target.value;
                                        handleInputChange('customFields', newFields);
                                      }}
                                      placeholder="Placeholder (optional)"
                                      className="h-7 text-xs flex-1"
                                    />
                                    <div className="flex items-center gap-1">
                                      <Switch
                                        checked={field.required}
                                        onCheckedChange={(checked) => {
                                          const newFields = [...formData.customFields];
                                          newFields[index].required = checked;
                                          handleInputChange('customFields', newFields);
                                        }}
                                        className="scale-75"
                                      />
                                      <Label className="text-xs">Required</Label>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-500 text-center py-2">No custom fields added</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="pt-3 border-t border-teal-200 bg-white rounded-lg p-3">
                        <p className="text-xs text-gray-700">
                          ⚡ <strong>Instant Chat:</strong> Visitors can start chatting immediately without filling a form.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Info Banner */}
                  <div className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-900 font-medium mb-1">✏️ Quick Tip</p>
                    <p className="text-xs text-blue-700">
                      Keep your welcome message friendly and clear. It&apos;s the first impression customers get when they open your chat widget.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Button Tab */}
            <TabsContent value="button" className="space-y-3 mt-0">
              <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                <CardHeader className="pb-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-xl border-b border-purple-100">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
                      <MessageCircle className="w-4 h-4 text-white" />
                    </div>
                    Chat Button
                  </CardTitle>
                  <p className="text-xs text-gray-600 mt-1">Customize your chat button appearance and position</p>
                </CardHeader>
                <CardContent className="p-5 space-y-5">
                  {/* Button Icon Selection */}
                  <div>
                    <Label className="text-sm font-semibold text-gray-900 mb-3 block">Button Icon</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => handleInputChange('iconType', 'default')}
                        className={`p-4 border-2 rounded-xl transition-all ${
                          formData.iconType === 'default'
                            ? 'border-purple-500 bg-purple-50 shadow-sm'
                            : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                        }`}
                      >
                        <MessageCircle className={`w-7 h-7 mx-auto mb-2 ${
                          formData.iconType === 'default' ? 'text-purple-600' : 'text-gray-400'
                        }`} />
                        <p className="text-sm font-medium text-gray-900">Default</p>
                        <p className="text-xs text-gray-500 mt-0.5">Chat icon</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInputChange('iconType', 'custom')}
                        className={`p-4 border-2 rounded-xl transition-all ${
                          formData.iconType === 'custom'
                            ? 'border-purple-500 bg-purple-50 shadow-sm'
                            : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                        }`}
                      >
                        <Upload className={`w-7 h-7 mx-auto mb-2 ${
                          formData.iconType === 'custom' ? 'text-purple-600' : 'text-gray-400'
                        }`} />
                        <p className="text-sm font-medium text-gray-900">Custom</p>
                        <p className="text-xs text-gray-500 mt-0.5">Your image</p>
                      </button>
                    </div>
                  </div>

                  {/* Custom Icon Upload */}
                  {formData.iconType === 'custom' && (
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200 space-y-3">
                      <Label className="text-sm font-semibold text-gray-900">Upload Icon</Label>
                      <div className="border-2 border-dashed border-purple-300 rounded-lg p-6 text-center hover:border-purple-400 hover:bg-white transition-all bg-white">
                        <input
                          type="file"
                          id="iconUpload"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={uploadingImage}
                        />
                        <label
                          htmlFor="iconUpload"
                          className={`cursor-pointer ${uploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {formData.customIcon ? (
                            <div className="space-y-2">
                              <Image 
                                src={formData.customIcon} 
                                alt="Custom Icon" 
                                width={64}
                                height={64}
                                className="w-16 h-16 object-cover rounded-lg mx-auto border-2 border-purple-300"
                              />
                              <p className="text-xs font-medium text-gray-700">Click to change</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Upload className="w-8 h-8 mx-auto text-purple-400" />
                              {uploadingImage ? (
                                <div className="flex items-center justify-center gap-2">
                                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent"></div>
                                  <p className="text-xs font-medium text-purple-600">Uploading...</p>
                                </div>
                              ) : (
                                <>
                                  <p className="text-sm font-medium text-gray-700">Upload Image</p>
                                  <p className="text-xs text-gray-500">PNG, JPG, GIF (max 2MB)</p>
                                </>
                              )}
                            </div>
                          )}
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Position & Border Radius */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Button Position */}
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <Label htmlFor="buttonPosition" className="text-sm font-semibold text-gray-900 mb-2 block">Position</Label>
                      <Select
                        value={formData.position}
                        onValueChange={(value: 'bottom-right' | 'bottom-left') => 
                          handleInputChange('position', value)
                        }
                      >
                        <SelectTrigger className="h-9 bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bottom-right">↘️ Bottom Right</SelectItem>
                          <SelectItem value="bottom-left">↙️ Bottom Left</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-600 mt-2">Button screen position</p>
                    </div>

                    {/* Border Radius */}
                    <div className="p-4 bg-pink-50 rounded-lg border border-pink-200">
                      <Label htmlFor="buttonBorderRadius" className="text-sm font-semibold text-gray-900 mb-2 block">Border Radius</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="buttonBorderRadius"
                          type="number"
                          value={formData.borderRadius}
                          onChange={(e) => handleInputChange('borderRadius', e.target.value)}
                          placeholder="16"
                          min="0"
                          max="50"
                          className="h-9 bg-white"
                        />
                        <span className="text-xs text-gray-500 font-medium">px</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-2">Button roundness (0-50)</p>
                    </div>
                  </div>

                  {/* Info Banner */}
                  <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                    <p className="text-xs text-purple-900 font-medium mb-1">💫 Preview Changes</p>
                    <p className="text-xs text-purple-700">
                      See your button changes live in the preview panel. Click the button to test the widget.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Appearance Tab */}
            <TabsContent value="appearance" className="space-y-3 mt-0">
              <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                <CardHeader className="pb-3 bg-gradient-to-r from-pink-50 to-rose-50 rounded-t-xl border-b border-pink-100">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <div className="w-8 h-8 rounded-lg bg-pink-600 flex items-center justify-center">
                      <Palette className="w-4 h-4 text-white" />
                    </div>
                    Appearance &amp; Styling
                  </CardTitle>
                  <p className="text-xs text-gray-600 mt-1">Customize your widget&apos;s visual appearance</p>
                </CardHeader>
                <CardContent className="p-5 space-y-5">
                  {/* Color Settings */}
                  <div className="p-4 bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg border border-pink-200">
                    <Label className="text-sm font-semibold text-gray-900 mb-3 block">🎨 Colors</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="primaryColor" className="text-xs font-medium text-gray-700 mb-1.5 block">Primary Color</Label>
                        <div className="flex items-center gap-2">
                          <input
                            id="primaryColor"
                            type="color"
                            value={formData.primaryColor}
                            onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                            className="w-10 h-10 rounded-lg border-2 border-gray-300 cursor-pointer bg-white"
                          />
                          <Input
                            value={formData.primaryColor}
                            onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                            placeholder="#3B82F6"
                            className="flex-1 h-9 text-xs bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="textColor" className="text-xs font-medium text-gray-700 mb-1.5 block">Text Color</Label>
                        <div className="flex items-center gap-2">
                          <input
                            id="textColor"
                            type="color"
                            value={formData.textColor}
                            onChange={(e) => handleInputChange('textColor', e.target.value)}
                            className="w-10 h-10 rounded-lg border-2 border-gray-300 cursor-pointer bg-white"
                          />
                          <Input
                            value={formData.textColor}
                            onChange={(e) => handleInputChange('textColor', e.target.value)}
                            placeholder="#FFFFFF"
                            className="flex-1 h-9 text-xs bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Widget Size & Border */}
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                    <Label className="text-sm font-semibold text-gray-900 mb-3 block">📏 Widget Dimensions</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="widgetSize" className="text-xs font-medium text-gray-700 mb-1.5 block">Widget Size</Label>
                        <Select
                          value={formData.widgetSize}
                          onValueChange={(value: 'compact' | 'standard' | 'large') => 
                            handleInputChange('widgetSize', value)
                          }
                        >
                          <SelectTrigger className="h-9 text-sm bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="compact">📱 Compact (360x480)</SelectItem>
                            <SelectItem value="standard">💻 Standard (400x550)</SelectItem>
                            <SelectItem value="large">🖥️ Large (450x650)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="widgetBorderRadius" className="text-xs font-medium text-gray-700 mb-1.5 block">Border Radius</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="widgetBorderRadius"
                            type="number"
                            value={formData.borderRadius}
                            onChange={(e) => handleInputChange('borderRadius', e.target.value)}
                            placeholder="16"
                            min="0"
                            max="50"
                            className="h-9 text-sm bg-white"
                          />
                          <span className="text-xs text-gray-500 font-medium">px</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Chat Button Style Settings */}
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg border border-purple-200">
                    <Label className="text-sm font-semibold text-gray-900 mb-3 block">✨ Button Style & Effects</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="buttonSize" className="text-xs font-medium text-gray-700 mb-1.5 block">Button Size</Label>
                        <Select
                          value={formData.buttonSize}
                          onValueChange={(value: 'small' | 'medium' | 'large' | 'xl') => 
                            handleInputChange('buttonSize', value)
                          }
                        >
                          <SelectTrigger className="h-9 text-sm bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="small">Small (48px)</SelectItem>
                            <SelectItem value="medium">Medium (56px)</SelectItem>
                            <SelectItem value="large">Large (64px)</SelectItem>
                            <SelectItem value="xl">XL (72px)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="buttonStyle" className="text-xs font-medium text-gray-700 mb-1.5 block">Button Style</Label>
                        <Select
                          value={formData.buttonStyle}
                          onValueChange={(value: 'circular' | 'rounded' | 'square' | 'pill' | 'modern' | 'gradient') => 
                            handleInputChange('buttonStyle', value)
                          }
                        >
                          <SelectTrigger className="h-9 text-sm bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="circular">⭕ Circular</SelectItem>
                            <SelectItem value="rounded">◻️ Rounded</SelectItem>
                            <SelectItem value="square">⬜ Square</SelectItem>
                            <SelectItem value="pill">💊 Pill</SelectItem>
                            <SelectItem value="modern">✨ Modern</SelectItem>
                            <SelectItem value="gradient">🌈 Gradient</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="buttonShadow" className="text-xs font-medium text-gray-700 mb-1.5 block">Shadow</Label>
                        <Select
                          value={formData.buttonShadow}
                          onValueChange={(value: 'none' | 'small' | 'medium' | 'large' | 'xlarge') => 
                            handleInputChange('buttonShadow', value)
                          }
                        >
                          <SelectTrigger className="h-9 text-sm bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">⭕ None</SelectItem>
                            <SelectItem value="small">Small</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="large">Large</SelectItem>
                            <SelectItem value="xlarge">XL</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="buttonHoverEffect" className="text-xs font-medium text-gray-700 mb-1.5 block">Hover Effect</Label>
                        <Select
                          value={formData.buttonHoverEffect}
                          onValueChange={(value: 'none' | 'scale' | 'lift' | 'glow' | 'rotate') => 
                            handleInputChange('buttonHoverEffect', value)
                          }
                        >
                          <SelectTrigger className="h-9 text-sm bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">⭕ None</SelectItem>
                            <SelectItem value="scale">↔️ Scale</SelectItem>
                            <SelectItem value="lift">⬆️ Lift</SelectItem>
                            <SelectItem value="glow">✨ Glow</SelectItem>
                            <SelectItem value="rotate">🔄 Rotate</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="sm:col-span-2">
                        <Label htmlFor="buttonAnimation" className="text-xs font-medium text-gray-700 mb-1.5 block">Idle Animation</Label>
                        <Select
                          value={formData.buttonAnimation}
                          onValueChange={(value: 'none' | 'pulse' | 'bounce' | 'shake' | 'glow') => 
                            handleInputChange('buttonAnimation', value)
                          }
                        >
                          <SelectTrigger className="h-9 text-sm bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">⭕ None</SelectItem>
                            <SelectItem value="pulse">💓 Pulse</SelectItem>
                            <SelectItem value="bounce">⚡ Bounce</SelectItem>
                            <SelectItem value="shake">📳 Shake</SelectItem>
                            <SelectItem value="glow">✨ Glow</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-600 mt-1.5">Animation when button is idle</p>
                      </div>
                    </div>
                  </div>

                  {/* Mobile UI Settings */}
                  <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <Label className="text-sm font-semibold text-gray-900 mb-3 block">📱 Mobile UI Settings</Label>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="mobileLayout" className="text-xs font-medium text-gray-700 mb-2 block">Mobile Layout</Label>
                        <Select
                          value={formData.mobileLayout}
                          onValueChange={(value: 'shrinked' | 'expanded' | 'fullscreen') => 
                            handleInputChange('mobileLayout', value)
                          }
                        >
                          <SelectTrigger className="h-10 text-sm bg-white border-2 border-green-300">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="shrinked">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                                <span>📱 Shrinked</span>
                                <span className="text-gray-500 text-xs">Compact mobile view</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="expanded">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                                <span>📲 Expanded</span>
                                <span className="text-gray-500 text-xs">Full mobile experience</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="fullscreen">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                                <span>🖥️ Full Screen</span>
                                <span className="text-gray-500 text-xs">App-like full screen</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-600 mt-2">
                          Choose how your widget appears on mobile devices
                        </p>
                      </div>

                      {formData.mobileLayout === 'fullscreen' && (
                        <div className="bg-white rounded-lg p-3 border border-green-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label htmlFor="mobileFullScreen" className="text-sm font-semibold text-gray-900">Enable Full Screen</Label>
                              <p className="text-xs text-gray-600 mt-0.5">Make mobile widget take full viewport</p>
                            </div>
                            <Switch
                              id="mobileFullScreen"
                              checked={formData.mobileFullScreen}
                              onCheckedChange={(checked) => handleInputChange('mobileFullScreen', checked)}
                            />
                          </div>
                          {formData.mobileFullScreen && (
                            <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                              <p className="text-xs text-green-800 font-medium mb-1">✨ Full Screen Benefits:</p>
                              <ul className="text-xs text-green-700 space-y-1 ml-4 list-disc">
                                <li>Native app-like experience</li>
                                <li>Maximum screen utilization</li>
                                <li>Better mobile engagement</li>
                                <li>Professional mobile presence</li>
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-xs text-blue-800 font-medium mb-1">📱 Mobile Layout Preview:</p>
                        <div className="text-xs text-blue-700 space-y-1">
                          {formData.mobileLayout === 'shrinked' && (
                            <p>• <strong>Shrinked:</strong> Compact widget with standard mobile sizing</p>
                          )}
                          {formData.mobileLayout === 'expanded' && (
                            <p>• <strong>Expanded:</strong> Larger mobile widget with better content visibility</p>
                          )}
                          {formData.mobileLayout === 'fullscreen' && (
                            <p>• <strong>Full Screen:</strong> {formData.mobileFullScreen ? 'Full viewport coverage for app-like experience' : 'Standard full screen with some margins'}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Badge & Notifications */}
                  <div className="p-4 bg-gradient-to-br from-red-50 to-orange-50 rounded-lg border border-red-200">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <Label htmlFor="showBadge" className="text-sm font-semibold text-gray-900">🔔 Notification Badge</Label>
                        <p className="text-xs text-gray-600 mt-0.5">Display unread count on button</p>
                      </div>
                      <Switch
                        id="showBadge"
                        checked={formData.showBadge}
                        onCheckedChange={(checked) => handleInputChange('showBadge', checked)}
                      />
                    </div>

                    {formData.showBadge && (
                      <div className="space-y-3 pt-3 border-t border-red-200 bg-white rounded-lg p-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="badgeCount" className="text-xs font-medium text-gray-700 mb-1.5 block">Count</Label>
                            <Input
                              id="badgeCount"
                              type="number"
                              value={formData.badgeCount}
                              onChange={(e) => handleInputChange('badgeCount', parseInt(e.target.value) || 0)}
                              placeholder="0"
                              min="0"
                              max="99"
                              className="h-9 text-sm"
                            />
                            <p className="text-xs text-gray-500 mt-1">0 = dot, 1-99 = number</p>
                          </div>

                          <div>
                            <Label htmlFor="badgeColor" className="text-xs font-medium text-gray-700 mb-1.5 block">Color</Label>
                            <div className="flex items-center gap-2">
                              <input
                                id="badgeColor"
                                type="color"
                                value={formData.badgeColor}
                                onChange={(e) => handleInputChange('badgeColor', e.target.value)}
                                className="w-10 h-9 rounded-lg border-2 border-gray-300 cursor-pointer"
                              />
                              <Input
                                value={formData.badgeColor}
                                onChange={(e) => handleInputChange('badgeColor', e.target.value)}
                                placeholder="#EF4444"
                                className="flex-1 h-9 text-xs"
                              />
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="badgePosition" className="text-xs font-medium text-gray-700 mb-1.5 block">Position</Label>
                            <Select
                              value={formData.badgePosition}
                              onValueChange={(value: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left') => 
                                handleInputChange('badgePosition', value)
                              }
                            >
                              <SelectTrigger className="h-9 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="top-right">↗️ Top Right</SelectItem>
                                <SelectItem value="top-left">↖️ Top Left</SelectItem>
                                <SelectItem value="bottom-right">↘️ Bottom Right</SelectItem>
                                <SelectItem value="bottom-left">↙️ Bottom Left</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="badgeAnimation" className="text-xs font-medium text-gray-700 mb-1.5 block">Animation</Label>
                            <Select
                              value={formData.badgeAnimation}
                              onValueChange={(value: 'none' | 'pulse' | 'bounce' | 'ping') => 
                                handleInputChange('badgeAnimation', value)
                              }
                            >
                              <SelectTrigger className="h-9 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">⭕ None</SelectItem>
                                <SelectItem value="pulse">💓 Pulse</SelectItem>
                                <SelectItem value="bounce">⚡ Bounce</SelectItem>
                                <SelectItem value="ping">📡 Ping</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-red-200">
                      <div>
                        <Label htmlFor="showOnlineDot" className="text-xs font-semibold">🟢 Online Status</Label>
                        <p className="text-xs text-gray-600 mt-0.5">Show online/offline dot</p>
                      </div>
                      <Switch
                        id="showOnlineDot"
                        checked={formData.showOnlineDot}
                        onCheckedChange={(checked) => handleInputChange('showOnlineDot', checked)}
                      />
                    </div>

                    {formData.showOnlineDot && (
                      <div className="bg-white rounded-lg p-3">
                        <Label htmlFor="onlineDotColor" className="text-xs font-medium text-gray-700 mb-1.5 block">Dot Color</Label>
                        <div className="flex items-center gap-2">
                          <input
                            id="onlineDotColor"
                            type="color"
                            value={formData.onlineDotColor}
                            onChange={(e) => handleInputChange('onlineDotColor', e.target.value)}
                            className="w-10 h-9 rounded-lg border-2 border-gray-300 cursor-pointer"
                          />
                          <Input
                            value={formData.onlineDotColor}
                            onChange={(e) => handleInputChange('onlineDotColor', e.target.value)}
                            placeholder="#10B981"
                            className="flex-1 h-9 text-xs"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tooltip Settings */}
                  <div className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg border border-indigo-200">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <Label htmlFor="showButtonTooltip" className="text-sm font-semibold text-gray-900">💬 Button Tooltip</Label>
                        <p className="text-xs text-gray-600 mt-0.5">Show text on hover</p>
                      </div>
                      <Switch
                        id="showButtonTooltip"
                        checked={formData.showButtonTooltip}
                        onCheckedChange={(checked) => handleInputChange('showButtonTooltip', checked)}
                      />
                    </div>

                    {formData.showButtonTooltip && (
                      <div className="pt-3 border-t border-indigo-200 bg-white rounded-lg p-3">
                        <Label htmlFor="buttonTooltip" className="text-xs font-medium text-gray-700 mb-1.5 block">Tooltip Text</Label>
                        <Input
                          id="buttonTooltip"
                          value={formData.buttonTooltip}
                          onChange={(e) => handleInputChange('buttonTooltip', e.target.value)}
                          placeholder="Chat with us"
                          className="h-9 text-sm"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* AI Configuration Tab */}
            <TabsContent value="ai" className="space-y-3 mt-0">
              <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                <CardHeader className="pb-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-t-xl border-b border-indigo-100">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    AI Configuration
                  </CardTitle>
                  <p className="text-xs text-gray-600 mt-1">Configure AI assistant settings and behavior</p>
                </CardHeader>
                <CardContent className="p-5 space-y-5">
                  {/* Main Enable Toggle */}
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-indigo-300 transition-all">
                    <div>
                      <Label htmlFor="aiEnabled" className="text-sm font-semibold text-gray-900">Enable AI Assistant</Label>
                      <p className="text-xs text-gray-500 mt-0.5">Automatically respond to customer messages</p>
                    </div>
                    <Switch
                      id="aiEnabled"
                      checked={formData.aiConfig.enabled}
                      onCheckedChange={(checked) => 
                        handleNestedChange('aiConfig', 'enabled', checked)
                      }
                    />
                  </div>

                  {formData.aiConfig.enabled && (
                    <div className="space-y-4">
                      {/* AI Model Selection */}
                      <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border-2 border-indigo-300">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                            <Bot className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-bold text-gray-900 mb-1">🚀 AI Model Selection</h4>
                            <p className="text-xs text-gray-700">Powered by OpenRouter</p>
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="aiModel" className="text-xs font-semibold text-gray-700 mb-2 block">Select Model</Label>
                          <Select
                            value={formData.aiConfig.model}
                            onValueChange={(value) => 
                              handleNestedChange('aiConfig', 'model', value)
                            }
                          >
                            <SelectTrigger className="h-10 text-sm bg-white border-2 border-indigo-300">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="openai/gpt-5-mini">
                                <div className="flex items-center gap-2">
                                  <span>🤖 GPT-5 Mini</span>
                                  <span className="text-xs text-blue-600">(OpenAI - Latest)</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="google/gemini-2.5-flash">
                                <div className="flex items-center gap-2">
                                  <span>⚡ Gemini 2.5 Flash</span>
                                  <span className="text-xs text-green-600">(Google - Fast)</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <div className="mt-3 p-3 bg-white rounded-lg border border-indigo-200">
                            {formData.aiConfig.model === 'openai/gpt-5-mini' ? (
                              <>
                                <p className="text-xs text-indigo-900 font-medium mb-1.5">✨ GPT-5 Mini Benefits:</p>
                                <ul className="text-xs text-indigo-800 space-y-1 ml-4 list-disc">
                                  <li>Latest technology from OpenAI</li>
                                  <li>Better accuracy & understanding</li>
                                  <li>Excellent for complex reasoning</li>
                                  <li>Best-in-class performance</li>
                                </ul>
                              </>
                            ) : (
                              <>
                                <p className="text-xs text-green-900 font-medium mb-1.5">⚡ Gemini 2.5 Flash Benefits:</p>
                                <ul className="text-xs text-green-800 space-y-1 ml-4 list-disc">
                                  <li>Google&apos;s latest model</li>
                                  <li>Ultra-fast response times</li>
                                  <li>Multimodal capabilities (text + images)</li>
                                  <li>Great for real-time chat</li>
                                </ul>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Embeddings Configuration */}
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">🔍 Embeddings Configuration</h4>
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="embeddingProvider" className="text-xs font-medium text-gray-700 mb-2 block">Embedding Provider</Label>
                            <Select
                              value={formData.aiConfig.embeddingProvider}
                              onValueChange={(value) => {
                                handleNestedChange('aiConfig', 'embeddingProvider', value);
                                // Set default model based on provider
                                if (value === 'voyage') {
                                  handleNestedChange('aiConfig', 'embeddingModel', 'voyage-3');
                                } else {
                                  handleNestedChange('aiConfig', 'embeddingModel', 'text-embedding-3-large');
                                }
                              }}
                            >
                              <SelectTrigger className="h-10 text-sm bg-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="openai">🤖 OpenAI - Industry standard</SelectItem>
                                <SelectItem value="voyage">🚢 Voyage AI - Optimized for retrieval</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="embeddingModel" className="text-xs font-medium text-gray-700 mb-2 block">Select Model</Label>
                            <Select
                              value={formData.aiConfig.embeddingModel}
                              onValueChange={(value) => 
                                handleNestedChange('aiConfig', 'embeddingModel', value)
                              }
                            >
                              <SelectTrigger className="h-10 text-sm bg-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {formData.aiConfig.embeddingProvider === 'voyage' ? (
                                  <>
                                    <SelectItem value="voyage-3">🚢 Voyage-3 (1024d) - Best for retrieval</SelectItem>
                                    <SelectItem value="voyage-3-lite">💨 Voyage-3-Lite (512d) - Faster & cheaper</SelectItem>
                                  </>
                                ) : (
                                  <>
                                    <SelectItem value="text-embedding-3-large">⚡ Text Embedding 3 Large (3072d) - Best quality</SelectItem>
                                    <SelectItem value="text-embedding-3-small">💨 Text Embedding 3 Small (1536d) - Faster & cheaper</SelectItem>
                                    <SelectItem value="text-embedding-ada-002">📦 Ada 002 (1536d) - Legacy model</SelectItem>
                                  </>
                                )}
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500 mt-2">
                              {formData.aiConfig.embeddingProvider === 'voyage' 
                                ? 'Voyage AI is optimized for search and retrieval tasks'
                                : 'Higher dimensions = better accuracy but higher cost'
                              }
                            </p>
                          </div>
                          
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-xs text-blue-800">
                              <strong>💡 Tip:</strong> {formData.aiConfig.embeddingProvider === 'voyage' 
                                ? 'Voyage-3 is specifically trained for retrieval tasks and may provide better semantic matching.'
                                : 'Use text-embedding-3-large for best quality or text-embedding-3-small for cost savings.'
                              }
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Reranker Configuration */}
                      <div className="p-4 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg border border-cyan-200">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <Label htmlFor="rerankerEnabled" className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                              🎯 Reranker (Recommended)
                            </Label>
                            <p className="text-xs text-gray-600 mt-1">Boost accuracy from 65% to 95%+ with intelligent reranking</p>
                          </div>
                          <Switch
                            id="rerankerEnabled"
                            checked={formData.aiConfig.rerankerEnabled}
                            onCheckedChange={(checked) => 
                              handleNestedChange('aiConfig', 'rerankerEnabled', checked)
                            }
                          />
                        </div>
                        
                        {formData.aiConfig.rerankerEnabled && (
                          <div className="space-y-3 pt-3 border-t border-cyan-200">
                            <div className="bg-white rounded-lg p-3 border border-cyan-200">
                              <Label htmlFor="rerankerModel" className="text-xs font-medium text-gray-700 mb-2 block">Reranker Model</Label>
                              <select
                                id="rerankerModel"
                                value={formData.aiConfig.rerankerModel}
                                onChange={(e) => handleNestedChange('aiConfig', 'rerankerModel', e.target.value)}
                                className="w-full h-9 px-3 text-sm bg-white border-2 border-gray-200 rounded-lg focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                              >
                                <option value="rerank-2.5">🚢 rerank-2.5 (Latest, Best Quality)</option>
                                <option value="rerank-2">🚢 rerank-2 (Fast & Accurate)</option>
                                <option value="rerank-lite-1">💨 rerank-lite-1 (Fastest)</option>
                              </select>
                            </div>
                            
                            <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-3">
                              <p className="text-xs text-cyan-900 font-semibold mb-2">🎯 How Reranking Works:</p>
                              <ul className="text-xs text-cyan-800 space-y-1.5 ml-4 list-disc">
                                <li><strong>Step 1:</strong> Vector search finds 15 candidates</li>
                                <li><strong>Step 2:</strong> Reranker scores each by relevance</li>
                                <li><strong>Step 3:</strong> Returns top 5 most relevant</li>
                                <li><strong>Result:</strong> Much better context for AI!</li>
                              </ul>
                              <p className="text-xs text-cyan-700 mt-3 font-semibold">
                                ⚡ Cost: ~$0.03 per 1000 queries | Worth it for 30% better accuracy!
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* AI Features Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* RAG/Knowledge Base */}
                        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                          <div className="flex items-center justify-between mb-2">
                            <Label htmlFor="ragEnabled" className="text-sm font-semibold">Knowledge Base (RAG)</Label>
                            <Switch
                              id="ragEnabled"
                              checked={formData.aiConfig.ragEnabled}
                              onCheckedChange={(checked) => 
                                handleNestedChange('aiConfig', 'ragEnabled', checked)
                              }
                            />
                          </div>
                          <p className="text-xs text-gray-600">Use your knowledge base for AI responses</p>
                        </div>

                        {/* Fallback to Human */}
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center justify-between mb-2">
                            <Label htmlFor="fallbackToHuman" className="text-sm font-semibold">Human Fallback</Label>
                            <Switch
                              id="fallbackToHuman"
                              checked={formData.aiConfig.fallbackToHuman}
                              onCheckedChange={(checked) => 
                                handleNestedChange('aiConfig', 'fallbackToHuman', checked)
                              }
                            />
                          </div>
                          <p className="text-xs text-gray-600">Transfer to human when AI is uncertain</p>
                        </div>
                      </div>

                      {/* Info Banner */}
                      <div className="p-3 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-200">
                        <p className="text-xs text-indigo-900 font-medium mb-1">🎯 Pro Tip</p>
                        <p className="text-xs text-indigo-700">
                          Enable RAG to use your knowledge base for more accurate AI responses. Choose the right embedding model based on your quality vs. cost needs. Human fallback ensures customers always get help when AI can&apos;t assist.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Contact Tab */}
            <TabsContent value="contact" className="space-y-3 mt-0">
              <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl border-b border-blue-100">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    Customer Handover
                  </CardTitle>
                  <p className="text-xs text-gray-600 mt-1">Configure how customers can reach human agents</p>
                </CardHeader>
                <CardContent className="p-5 space-y-5">
                  {/* Main Enable Toggle */}
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-all">
                    <div>
                      <Label htmlFor="handoverEnabled" className="text-sm font-semibold text-gray-900">Enable Handover</Label>
                      <p className="text-xs text-gray-500 mt-0.5">Allow customers to request human help</p>
                    </div>
                    <Switch
                      id="handoverEnabled"
                      checked={formData.customerHandover.enabled}
                      onCheckedChange={(checked) => 
                        handleNestedChange('customerHandover', 'enabled', checked)
                      }
                    />
                  </div>

                  {formData.customerHandover.enabled && (
                    <div className="space-y-4">
                      {/* Handover Methods Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Handover Button */}
                        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                          <div className="flex items-center justify-between mb-3">
                            <Label htmlFor="showHandoverButton" className="text-sm font-semibold">Handover Button</Label>
                            <Switch
                              id="showHandoverButton"
                              checked={formData.customerHandover.showHandoverButton}
                              onCheckedChange={(checked) => 
                                handleNestedChange('customerHandover', 'showHandoverButton', checked)
                              }
                            />
                          </div>
                          {formData.customerHandover.showHandoverButton && (
                            <div className="space-y-2">
                              <Input
                                value={formData.customerHandover.handoverButtonText}
                                onChange={(e) => 
                                  handleNestedChange('customerHandover', 'handoverButtonText', e.target.value)
                                }
                                placeholder="Talk to Human"
                                className="h-8 text-xs bg-white"
                              />
                              <Select
                                value={formData.customerHandover.handoverButtonPosition}
                                onValueChange={(value: 'bottom' | 'top' | 'floating') => 
                                  handleNestedChange('customerHandover', 'handoverButtonPosition', value)
                                }
                              >
                                <SelectTrigger className="h-8 text-xs bg-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="bottom">Bottom</SelectItem>
                                  <SelectItem value="top">Top</SelectItem>
                                  <SelectItem value="floating">Floating</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>

                        {/* Quick Reply */}
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="includeInQuickReplies" className="text-sm font-semibold">Quick Reply</Label>
                            <Switch
                              id="includeInQuickReplies"
                              checked={formData.customerHandover.includeInQuickReplies}
                              onCheckedChange={(checked) => 
                                handleNestedChange('customerHandover', 'includeInQuickReplies', checked)
                              }
                            />
                          </div>
                          <p className="text-xs text-gray-600 mt-2">Add to quick replies</p>
                        </div>

                        {/* Keyword Detection removed - only manual handover button and AI smart handover allowed */}

                        {/* Smart AI Fallback */}
                        <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 sm:col-span-2">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <Label htmlFor="smartFallbackEnabled" className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                🤖 Smart AI Fallback
                              </Label>
                              <p className="text-xs text-gray-600 mt-1">Auto-detect when AI doesn&apos;t have relevant information and offer human handover</p>
                            </div>
                            <Switch
                              id="smartFallbackEnabled"
                              checked={formData.customerHandover.smartFallbackEnabled}
                              onCheckedChange={(checked) => 
                                handleNestedChange('customerHandover', 'smartFallbackEnabled', checked)
                              }
                            />
                          </div>
                          {formData.customerHandover.smartFallbackEnabled && (
                            <div className="mt-3 p-3 bg-white rounded-lg border border-blue-200">
                              <p className="text-xs text-blue-800 font-medium mb-1">✨ How it works:</p>
                              <ul className="text-xs text-blue-700 space-y-1 ml-4 list-disc">
                                <li>AI detects when it doesn&apos;t have relevant information</li>
                                <li>Responds: &quot;I&apos;m not sure about that from my knowledge base.&quot;</li>
                                <li>Offers: &quot;Would you like me to connect you with a human agent?&quot;</li>
                                <li>Works automatically - no keywords needed</li>
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Handover Message */}
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <Label htmlFor="handoverMessage" className="text-sm font-semibold mb-2 block">Handover Message</Label>
                        <Textarea
                          id="handoverMessage"
                          value={formData.customerHandover.handoverMessage}
                          onChange={(e) => 
                            handleNestedChange('customerHandover', 'handoverMessage', e.target.value)
                          }
                          placeholder="Connecting you to an agent..."
                          rows={2}
                          className="text-xs resize-none bg-white"
                        />
                      </div>

                      {/* Additional Settings */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                          <div>
                            <Label htmlFor="notificationToAgent" className="text-xs font-medium">Notify Agents</Label>
                          </div>
                          <Switch
                            id="notificationToAgent"
                            checked={formData.customerHandover.notificationToAgent}
                            onCheckedChange={(checked) => 
                              handleNestedChange('customerHandover', 'notificationToAgent', checked)
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                          <div>
                            <Label htmlFor="allowCustomerToSwitch" className="text-xs font-medium">Allow Re-switch</Label>
                          </div>
                          <Switch
                            id="allowCustomerToSwitch"
                            checked={formData.customerHandover.allowCustomerToSwitch}
                            onCheckedChange={(checked) => 
                              handleNestedChange('customerHandover', 'allowCustomerToSwitch', checked)
                            }
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Hours Tab */}
            <TabsContent value="hours" className="space-y-3 mt-0">
              <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <Clock className="w-4 h-4 text-orange-600" />
                    Business Hours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Business hours configuration will be available soon.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Right Column - Preview (Sticky) */}
          <div className="hidden xl:block">
            <div className="sticky top-4 space-y-3 lg:max-w-md xl:max-w-none lg:mx-auto xl:mx-0">
            <Card className="bg-blue-50 border border-blue-200 rounded-lg shadow-sm">
              <CardContent className="p-3 sm:p-4 text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                </div>
                <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-1">Live Preview</h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                  Click the chat button at the {formData.position === 'bottom-right' ? 'bottom-right' : 'bottom-left'} corner of your screen to test the widget.
                </p>
                <div className="bg-white rounded-lg p-3 sm:p-4 space-y-1.5 sm:space-y-2 text-left">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Mode:</span>
                    <span className="font-semibold text-gray-900">{viewMode === 'mobile' ? '📱 Mobile' : '💻 Desktop'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Widget Size:</span>
                    <span className="font-semibold text-gray-900">{formData.widgetSize === 'compact' ? 'Compact' : formData.widgetSize === 'standard' ? 'Standard' : 'Large'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Position:</span>
                    <span className="font-semibold text-gray-900">{formData.position === 'bottom-right' ? 'Bottom Right' : 'Bottom Left'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Color:</span>
                    <span className="flex items-center gap-1 sm:gap-2">
                      <span className="inline-block w-3 h-3 sm:w-4 sm:h-4 rounded border" style={{ backgroundColor: formData.primaryColor }}></span>
                      <span className="font-mono text-gray-900 text-xs">{formData.primaryColor}</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs border-t border-gray-200 pt-1.5 sm:pt-2 mt-1.5 sm:mt-2">
                    <span className="text-gray-600">Button Style:</span>
                    <span className="font-semibold text-gray-900 capitalize text-xs">{formData.buttonStyle}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Button Size:</span>
                    <span className="font-semibold text-gray-900 capitalize text-xs">{formData.buttonSize}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Animation:</span>
                    <span className="font-semibold text-gray-900 capitalize text-xs">{formData.buttonAnimation}</span>
                  </div>
                  {formData.showBadge && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Badge:</span>
                      <span className="flex items-center gap-1">
                        <span className="inline-block w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full" style={{ backgroundColor: formData.badgeColor }}></span>
                        <span className="font-semibold text-gray-900 text-xs">{formData.badgeCount > 0 ? formData.badgeCount : 'Dot'}</span>
                      </span>
                    </div>
                  )}
                  {formData.showOnlineDot && !formData.showBadge && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Online Dot:</span>
                      <span className="inline-block w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full" style={{ backgroundColor: formData.onlineDotColor }}></span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-3 sm:mt-4">
                  ⚠ Changes update in real-time. Don&apos;t forget to save!
                </p>
              </CardContent>
            </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


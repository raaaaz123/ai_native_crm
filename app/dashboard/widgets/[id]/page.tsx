'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth-context';
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
  Image as ImageIcon,
  Sparkles,
  Volume2,
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
  const { user, companyContext } = useAuth();
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
    showBranding: true,
    soundEnabled: true,
    messageSound: 'default',
    headerSubtitle: "We&apos;re here to help!",
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
      model: 'deepseek/deepseek-chat-v3.1:free',
      temperature: 0.7,
      maxTokens: 500,
      confidenceThreshold: 0.5,
      maxRetrievalDocs: 5,
      ragEnabled: true,
      fallbackToHuman: true
    },
    // Customer Handover Settings
    customerHandover: {
      enabled: true,
      showHandoverButton: true,
      handoverButtonText: 'Talk to Human Agent',
      handoverButtonPosition: 'bottom' as 'bottom' | 'top' | 'floating',
      includeInQuickReplies: true,
      autoDetectKeywords: true,
      detectionKeywords: ['human', 'agent', 'representative', 'person', 'support agent', 'real person', 'talk to someone'],
      handoverMessage: "I'll connect you with a human agent right away. Please wait a moment.",
      notificationToAgent: true,
      allowCustomerToSwitch: true
    }
  });

  const [uploadingImage, setUploadingImage] = useState(false);

  const [originalData, setOriginalData] = useState(formData);

  useEffect(() => {
    loadWidget();
  }, [widgetId, companyContext]);

  const loadWidget = async () => {
    if (!companyContext?.company?.id) return;

    try {
      setLoading(true);
      const result = await getBusinessWidgets(companyContext.company.id);
      
      if (result.success) {
        const foundWidget = result.data.find(w => w.id === widgetId);
        if (foundWidget) {
          setWidget(foundWidget);
          const data = {
            name: foundWidget.name,
            welcomeMessage: foundWidget.welcomeMessage,
            primaryColor: foundWidget.primaryColor,
            secondaryColor: foundWidget.secondaryColor || '#EFF6FF',
            textColor: foundWidget.textColor || '#FFFFFF',
            position: foundWidget.position as 'bottom-right' | 'bottom-left',
            buttonText: foundWidget.buttonText,
            placeholderText: foundWidget.placeholderText,
            offlineMessage: foundWidget.offlineMessage,
            requireContactForm: foundWidget.requireContactForm !== undefined ? foundWidget.requireContactForm : true,
            collectName: foundWidget.collectName !== undefined ? foundWidget.collectName : true,
            collectEmail: foundWidget.collectEmail,
            collectPhone: foundWidget.collectPhone,
            customFields: foundWidget.customFields || [],
            autoReply: foundWidget.autoReply,
            iconType: foundWidget.iconType || 'default' as 'default' | 'custom',
            customIcon: foundWidget.customIcon || '',
            widgetSize: foundWidget.widgetSize || 'standard' as 'compact' | 'standard' | 'large',
            borderRadius: foundWidget.borderRadius || '16',
            showBranding: foundWidget.showBranding !== undefined ? foundWidget.showBranding : true,
            soundEnabled: foundWidget.soundEnabled !== undefined ? foundWidget.soundEnabled : true,
            messageSound: foundWidget.messageSound || 'default',
            headerSubtitle: foundWidget.headerSubtitle || "We&apos;re here to help!",
            greetingDelay: foundWidget.greetingDelay || 3,
            quickReplies: foundWidget.quickReplies || ['Get Support', 'Pricing', 'Contact Sales'],
            // Chat Button Appearance
            buttonStyle: foundWidget.buttonStyle || 'rounded' as 'circular' | 'rounded' | 'square' | 'pill' | 'modern' | 'gradient',
            buttonAnimation: foundWidget.buttonAnimation || 'pulse' as 'none' | 'pulse' | 'bounce' | 'shake' | 'glow',
            buttonSize: foundWidget.buttonSize || 'medium' as 'small' | 'medium' | 'large' | 'xl',
            buttonShadow: foundWidget.buttonShadow || 'medium' as 'none' | 'small' | 'medium' | 'large' | 'xlarge',
            buttonHoverEffect: foundWidget.buttonHoverEffect || 'scale' as 'none' | 'scale' | 'lift' | 'glow' | 'rotate',
            buttonTooltip: foundWidget.buttonTooltip || 'Chat with us',
            showButtonTooltip: foundWidget.showButtonTooltip !== undefined ? foundWidget.showButtonTooltip : true,
            showBadge: foundWidget.showBadge || false,
            badgeCount: foundWidget.badgeCount || 0,
            badgeColor: foundWidget.badgeColor || '#EF4444',
            badgePosition: foundWidget.badgePosition || 'top-right' as 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left',
            badgeAnimation: foundWidget.badgeAnimation || 'pulse' as 'none' | 'pulse' | 'bounce' | 'ping',
            showOnlineDot: foundWidget.showOnlineDot !== undefined ? foundWidget.showOnlineDot : true,
            onlineDotColor: foundWidget.onlineDotColor || '#10B981',
            businessHours: foundWidget.businessHours,
            aiConfig: {
              enabled: foundWidget.aiConfig?.enabled || false,
              provider: foundWidget.aiConfig?.provider || 'openrouter',
              model: foundWidget.aiConfig?.model || 'deepseek/deepseek-chat-v3.1:free',
              temperature: foundWidget.aiConfig?.temperature || 0.7,
              maxTokens: foundWidget.aiConfig?.maxTokens || 500,
              confidenceThreshold: foundWidget.aiConfig?.confidenceThreshold || 0.6,
              maxRetrievalDocs: foundWidget.aiConfig?.maxRetrievalDocs || 5,
              ragEnabled: foundWidget.aiConfig?.ragEnabled || false,
              fallbackToHuman: foundWidget.aiConfig?.fallbackToHuman !== undefined ? foundWidget.aiConfig.fallbackToHuman : true
            },
            customerHandover: {
              enabled: foundWidget.customerHandover?.enabled !== undefined ? foundWidget.customerHandover.enabled : true,
              showHandoverButton: foundWidget.customerHandover?.showHandoverButton !== undefined ? foundWidget.customerHandover.showHandoverButton : true,
              handoverButtonText: foundWidget.customerHandover?.handoverButtonText || 'Talk to Human Agent',
              handoverButtonPosition: foundWidget.customerHandover?.handoverButtonPosition || 'bottom' as 'bottom' | 'top' | 'floating',
              includeInQuickReplies: foundWidget.customerHandover?.includeInQuickReplies !== undefined ? foundWidget.customerHandover.includeInQuickReplies : true,
              autoDetectKeywords: foundWidget.customerHandover?.autoDetectKeywords !== undefined ? foundWidget.customerHandover.autoDetectKeywords : true,
              detectionKeywords: foundWidget.customerHandover?.detectionKeywords || ['human', 'agent', 'representative', 'person', 'support agent', 'real person', 'talk to someone'],
              handoverMessage: foundWidget.customerHandover?.handoverMessage || "I'll connect you with a human agent right away. Please wait a moment.",
              notificationToAgent: foundWidget.customerHandover?.notificationToAgent !== undefined ? foundWidget.customerHandover.notificationToAgent : true,
              allowCustomerToSwitch: foundWidget.customerHandover?.allowCustomerToSwitch !== undefined ? foundWidget.customerHandover.allowCustomerToSwitch : true
            }
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

  const handleInputChange = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleNestedChange = (parent: string, field: string, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...(prev as Record<string, Record<string, unknown>>)[parent],
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

  const handleQuickReplyChange = (index: number, value: string) => {
    const newQuickReplies = [...formData.quickReplies];
    newQuickReplies[index] = value;
    handleInputChange('quickReplies', newQuickReplies);
  };

  const addQuickReply = () => {
    if (formData.quickReplies.length < 5) {
      handleInputChange('quickReplies', [...formData.quickReplies, '']);
    }
  };

  const removeQuickReply = (index: number) => {
    const newQuickReplies = formData.quickReplies.filter((_, i) => i !== index);
    handleInputChange('quickReplies', newQuickReplies);
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-50 to-blue-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading widget...</p>
        </div>
      </div>
    );
  }

  if (!widget) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-50 to-blue-50/20 flex items-center justify-center">
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
    <div className="min-h-[calc(100vh-4rem)] bg-white">
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
      <div className="w-full h-full px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Link href="/dashboard/widgets">
              <Button variant="outline" size="sm" className="h-8">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2 truncate">
                <Settings className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span className="truncate">Customise Widget</span>
              </h1>
              <p className="text-sm text-gray-600 truncate">{widget.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Preview Mode Toggle */}
            <div className="flex items-center gap-1 bg-white rounded-lg p-1 shadow-sm">
              <button
                onClick={() => setViewMode('desktop')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'desktop' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="Desktop View"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('mobile')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'mobile' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="Mobile View"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>

            {hasChanges && (
              <Button variant="outline" size="sm" onClick={handleReset} className="h-8">
                <RotateCcw className="w-4 h-4 mr-1" />
                Reset
              </Button>
            )}
            
            <Button 
              onClick={handleSave} 
              disabled={saving || !hasChanges}
              size="sm"
              className="h-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-1"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Preview Info - Shows at Top on Small Screens */}
        <div className="xl:hidden mb-4">
          <Card className="bg-blue-50 border border-blue-200 rounded-lg shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">Live Preview</h3>
              <p className="text-sm text-gray-600 mb-3">
                Click the chat button at the {formData.position === 'bottom-right' ? 'bottom-right' : 'bottom-left'} corner to test.
              </p>
              <div className="bg-white rounded-lg p-3 space-y-2 text-left text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Mode:</span>
                  <span className="font-semibold">{viewMode === 'mobile' ? '📱 Mobile' : '💻 Desktop'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Size:</span>
                  <span className="font-semibold">{formData.widgetSize === 'compact' ? 'Compact' : formData.widgetSize === 'standard' ? 'Standard' : 'Large'}</span>
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
            businessId: companyContext?.company?.id || ''
          }} 
          viewMode={viewMode} 
        />

        {/* Main Content - Tabbed Interface with Preview */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr,450px] gap-4 items-start">
          {/* Left Side - Tabbed Settings */}
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 mb-4 h-auto p-1 bg-gray-100">
              <TabsTrigger value="basic" className="text-xs sm:text-sm py-2 data-[state=active]:bg-white">
                <Settings className="w-4 h-4 mr-1" />
                Basic
              </TabsTrigger>
              <TabsTrigger value="button" className="text-xs sm:text-sm py-2 data-[state=active]:bg-white">
                <MessageCircle className="w-4 h-4 mr-1" />
                Button
              </TabsTrigger>
              <TabsTrigger value="appearance" className="text-xs sm:text-sm py-2 data-[state=active]:bg-white">
                <Palette className="w-4 h-4 mr-1" />
                Style
              </TabsTrigger>
              <TabsTrigger value="ai" className="text-xs sm:text-sm py-2 data-[state=active]:bg-white">
                <Bot className="w-4 h-4 mr-1" />
                AI
              </TabsTrigger>
              <TabsTrigger value="contact" className="text-xs sm:text-sm py-2 data-[state=active]:bg-white">
                <User className="w-4 h-4 mr-1" />
                Contact
              </TabsTrigger>
              <TabsTrigger value="hours" className="text-xs sm:text-sm py-2 data-[state=active]:bg-white">
                <Clock className="w-4 h-4 mr-1" />
                Hours
              </TabsTrigger>
            </TabsList>

            {/* Basic Settings Tab */}
            <TabsContent value="basic" className="space-y-3 mt-0">
              <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-t-xl border-b border-blue-100">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                      <Settings className="w-4 h-4 text-white" />
                    </div>
                    Basic Settings
                  </CardTitle>
                  <p className="text-xs text-gray-600 mt-1">Essential widget configuration and messages</p>
                </CardHeader>
                <CardContent className="p-5 space-y-5">
                  {/* Widget Name */}
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <Label htmlFor="name" className="text-sm font-semibold text-gray-900 mb-2 block">
                      Widget Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="e.g., Support Chat Widget"
                      className="h-9 text-sm bg-white border-2 border-gray-200 focus:border-blue-500"
                      required
                    />
                    <p className="text-xs text-gray-600 mt-2">Internal name for identifying this widget</p>
                  </div>

                  {/* Welcome Message */}
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <Label htmlFor="welcomeMessage" className="text-sm font-semibold text-gray-900 mb-2 block">
                      Welcome Message
                    </Label>
                    <Textarea
                      id="welcomeMessage"
                      value={formData.welcomeMessage}
                      onChange={(e) => handleInputChange('welcomeMessage', e.target.value)}
                      placeholder="Welcome! How can we help you today?"
                      rows={2}
                      className="text-sm bg-white border-2 border-gray-200 resize-none focus:border-green-500"
                    />
                    <p className="text-xs text-gray-600 mt-2">First message customers see when opening chat</p>
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
                              <img 
                                src={formData.customIcon} 
                                alt="Custom Icon" 
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
                    Appearance & Styling
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
                            <SelectItem value="compact">📱 Compact (300x400)</SelectItem>
                            <SelectItem value="standard">💻 Standard (350x500)</SelectItem>
                            <SelectItem value="large">🖥️ Large (400x600)</SelectItem>
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
                            <SelectItem value="none">None</SelectItem>
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
                            <SelectItem value="none">None</SelectItem>
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
                            <SelectItem value="none">None</SelectItem>
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
                                <SelectItem value="none">None</SelectItem>
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
                      {/* AI Provider & Model Selection */}
                      <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">AI Provider & Model</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="aiProvider" className="text-xs font-medium text-gray-700">Provider</Label>
                            <Select
                              value={formData.aiConfig.provider}
                              onValueChange={(value) => 
                                handleNestedChange('aiConfig', 'provider', value)
                              }
                            >
                              <SelectTrigger className="h-9 text-sm bg-white mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="openrouter">🚀 OpenRouter</SelectItem>
                                <SelectItem value="openai">⚡ OpenAI</SelectItem>
                                <SelectItem value="anthropic">🤖 Anthropic</SelectItem>
                                <SelectItem value="google">🔍 Google</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="aiModel" className="text-xs font-medium text-gray-700">Model</Label>
                            <Select
                              value={formData.aiConfig.model}
                              onValueChange={(value) => 
                                handleNestedChange('aiConfig', 'model', value)
                              }
                            >
                              <SelectTrigger className="h-9 text-sm bg-white mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="google/gemini-2.0-flash-exp:free">Gemini 2.0 Flash (Free)</SelectItem>
                                <SelectItem value="deepseek/deepseek-chat-v3.1:free">DeepSeek v3.1 (Free)</SelectItem>
                                <SelectItem value="meta-llama/llama-3.2-3b-instruct:free">Llama 3.2 3B (Free)</SelectItem>
                                <SelectItem value="microsoft/phi-3-mini-128k-instruct:free">Phi-3 Mini (Free)</SelectItem>
                                <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                                <SelectItem value="gpt-4">GPT-4</SelectItem>
                                <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-indigo-600 mt-1.5 flex items-center gap-1">
                              💡 Free models recommended for testing
                            </p>
                          </div>
                        </div>
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
                          Enable RAG to use your knowledge base for more accurate responses. Human fallback ensures customers always get help when AI can&apos;t assist.
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

                        {/* Keyword Detection */}
                        <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 sm:col-span-2">
                          <div className="flex items-center justify-between mb-3">
                            <Label htmlFor="autoDetectKeywords" className="text-sm font-semibold">Keyword Detection</Label>
                            <Switch
                              id="autoDetectKeywords"
                              checked={formData.customerHandover.autoDetectKeywords}
                              onCheckedChange={(checked) => 
                                handleNestedChange('customerHandover', 'autoDetectKeywords', checked)
                              }
                            />
                          </div>
                          {formData.customerHandover.autoDetectKeywords && (
                            <Textarea
                              value={formData.customerHandover.detectionKeywords.join(', ')}
                              onChange={(e) => {
                                const keywords = e.target.value.split(',').map(k => k.trim()).filter(k => k);
                                handleNestedChange('customerHandover', 'detectionKeywords', keywords);
                              }}
                              placeholder="human, agent, representative"
                              rows={2}
                              className="text-xs bg-white resize-none"
                            />
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
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Eye className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Live Preview</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Click the chat button at the {formData.position === 'bottom-right' ? 'bottom-right' : 'bottom-left'} corner of your screen to test the widget.
                </p>
                <div className="bg-white rounded-lg p-4 space-y-2 text-left">
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
                    <span className="flex items-center gap-2">
                      <span className="inline-block w-4 h-4 rounded border" style={{ backgroundColor: formData.primaryColor }}></span>
                      <span className="font-mono text-gray-900">{formData.primaryColor}</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs border-t border-gray-200 pt-2 mt-2">
                    <span className="text-gray-600">Button Style:</span>
                    <span className="font-semibold text-gray-900 capitalize">{formData.buttonStyle}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Button Size:</span>
                    <span className="font-semibold text-gray-900 capitalize">{formData.buttonSize}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Animation:</span>
                    <span className="font-semibold text-gray-900 capitalize">{formData.buttonAnimation}</span>
                  </div>
                  {formData.showBadge && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Badge:</span>
                      <span className="flex items-center gap-1">
                        <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: formData.badgeColor }}></span>
                        <span className="font-semibold text-gray-900">{formData.badgeCount > 0 ? formData.badgeCount : 'Dot'}</span>
                      </span>
                    </div>
                  )}
                  {formData.showOnlineDot && !formData.showBadge && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Online Dot:</span>
                      <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: formData.onlineDotColor }}></span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-4">
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


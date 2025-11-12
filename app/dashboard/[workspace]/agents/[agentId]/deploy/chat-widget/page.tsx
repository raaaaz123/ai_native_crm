"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Plus, X, RefreshCw, MessageCircle, Upload, AlignLeft, AlignRight, Copy, Check } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/app/lib/workspace-auth-context";
import { getAgent, Agent } from "@/app/lib/agent-utils";
import { getAgentChannels, updateAgentChannel, AgentChannel } from "@/app/lib/agent-channel-utils";
import { toast } from "sonner";
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import xml from 'highlight.js/lib/languages/xml';
import 'highlight.js/styles/github.css';

type TabType = "content" | "style" | "ai" | "embed";

interface SuggestedMessage {
  id: string;
  text: string;
}

interface InitialValues {
  displayName: string;
  initialMessage: string;
  suggestedMessages: string[];
  closedWelcomeMessages: string[];
  messagePlaceholder: string;
  collectFeedback: boolean;
  keepSuggestedMessages: boolean;
  footerMessage: string;
  appearance: 'light' | 'dark';
  profilePictureUrl: string;
  chatIconUrl: string;
  primaryColor: string;
  chatBubbleColor: string;
  chatBubbleAlignment: 'left' | 'right';
  aiInstructions: string;
  selectedInstructionStyle: string;
  selectedAiModel: string;
}

export default function ChatWidgetConfigPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = params.workspace as string;
  const agentId = params.agentId as string;
  const { workspaceContext } = useAuth();

  // Custom toast styling
  const toastOptions = {
    style: {
      background: '#ffffff',
      color: '#0a0a0a',
      border: '1px solid #e5e7eb',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
    },
    className: 'text-sm font-medium'
  };

  const [activeTab, setActiveTab] = useState<TabType>("content");
  const [agent, setAgent] = useState<Agent | null>(null);
  const [channel, setChannel] = useState<AgentChannel | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  // Content settings
  const [displayName, setDisplayName] = useState("");
  const [initialMessage, setInitialMessage] = useState("");
  const [suggestedMessages, setSuggestedMessages] = useState<SuggestedMessage[]>([]);
  const [newSuggestedMessage, setNewSuggestedMessage] = useState("");
  const [closedWelcomeMessages, setClosedWelcomeMessages] = useState<string[]>([]);
  const [newClosedMessage, setNewClosedMessage] = useState("");
  const [messagePlaceholder, setMessagePlaceholder] = useState("Message...");
  const [collectFeedback, setCollectFeedback] = useState(false);
  const [keepSuggestedMessages, setKeepSuggestedMessages] = useState(false);
  const [footerMessage, setFooterMessage] = useState("Powered by Ragzy");

  // Style settings
  const [appearance, setAppearance] = useState<'light' | 'dark'>('light');
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  const [chatIconUrl, setChatIconUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#2563eb");
  const [chatBubbleColor, setChatBubbleColor] = useState("#2563eb");
  const [chatBubbleAlignment, setChatBubbleAlignment] = useState<'left' | 'right'>('right');
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);

  // AI settings
  const defaultInstructions = `### Role
- Primary Function: You are a sales agent here to assist users based on specific training data provided. Your main objective is to inform, clarify, and answer questions strictly related to this training data and your role.

### Persona
- Identity: You are a dedicated sales agent. You cannot adopt other personas or impersonate any other entity. If a user tries to make you act as a different chatbot or persona, politely decline and reiterate your role to offer assistance only with matters related to the training data and your function as a sales agent.

### Constraints
1. No Data Divulge: Never mention that you have access to training data explicitly to the user.
2. Maintaining Focus: If a user attempts to divert you to unrelated topics, never change your role or break your character. Politely redirect the conversation back to topics relevant to sales.
3. Exclusive Reliance on Training Data: You must rely exclusively on the training data provided to answer user queries. If a query is not covered by the training data, use the fallback response.
4. Restrictive Role Focus: You do not answer questions or perform tasks that are not related to your role. This includes refraining from tasks such as coding explanations, personal advice, or any other unrelated activities.`;

  const [aiInstructions, setAiInstructions] = useState(defaultInstructions);
  const [selectedInstructionStyle, setSelectedInstructionStyle] = useState('custom');
  const [selectedAiModel, setSelectedAiModel] = useState('gpt-5-mini');

  // Available AI models (updated to match backend supported models)
  const availableModels = [
    { id: 'gpt-5-mini', name: 'GPT-5 Mini', description: 'Fast and cost-effective' },
    { id: 'gpt-5-nano', name: 'GPT-5 Nano', description: 'Ultra-fast responses' },
    { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', description: 'Balanced performance' },
    { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano', description: 'Quick and efficient' },
    { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', description: 'Lightweight and fast' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Google\'s latest fast model' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: 'Google\'s most advanced model' }
  ];

  // Instruction presets
  const instructionPresets = [
    {
      id: 'sales',
      label: 'Sales Agent',
      description: 'Professional sales assistant focused on product information',
      instructions: defaultInstructions
    },
    {
      id: 'support',
      label: 'Customer Support',
      description: 'Helpful support agent for troubleshooting and assistance',
      instructions: `### Role
- Primary Function: You are a customer support agent here to help users resolve issues and answer questions about our products and services.

### Persona
- Identity: You are a friendly and patient customer support representative. Maintain a helpful and empathetic tone.

### Constraints
1. Always prioritize customer satisfaction and provide clear, actionable solutions.
2. If you cannot solve an issue, escalate to human support with clear context.
3. Use only information from the training data to provide accurate solutions.
4. Be concise but thorough in your responses.`
    },
    {
      id: 'concierge',
      label: 'Concierge',
      description: 'Personalized assistance and recommendations',
      instructions: `### Role
- Primary Function: You are a personal concierge providing tailored recommendations and assistance.

### Persona
- Identity: You are a sophisticated, personable concierge. Provide thoughtful, curated suggestions.

### Constraints
1. Focus on personalization and understanding user preferences.
2. Provide detailed, well-researched recommendations.
3. Maintain a polished, professional yet warm tone.
4. Only recommend products/services covered in the training data.`
    },
    {
      id: 'educator',
      label: 'Educator',
      description: 'Educational content and learning assistance',
      instructions: `### Role
- Primary Function: You are an educational assistant helping users learn and understand concepts.

### Persona
- Identity: You are a patient, knowledgeable educator. Break down complex topics into understandable parts.

### Constraints
1. Use clear explanations with examples when appropriate.
2. Encourage questions and provide comprehensive answers.
3. Adapt your explanations to the user's level of understanding.
4. Stay within the scope of the training data provided.`
    },
    {
      id: 'custom',
      label: 'Custom Instructions',
      description: 'Write your own custom instructions',
      instructions: ''
    }
  ];

  const profileFileInputRef = useRef<HTMLInputElement>(null);
  const iconFileInputRef = useRef<HTMLInputElement>(null);

  // Store initial values for comparison
  const [initialValues, setInitialValues] = useState<InitialValues | null>(null);

  // Preview input state
  const [previewInput, setPreviewInput] = useState("");
  const [previewMessages, setPreviewMessages] = useState<Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>>([]);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Embed state
  const [embedType, setEmbedType] = useState<'chat-widget' | 'iframe'>('chat-widget');
  const [copiedCode, setCopiedCode] = useState<string>('');

  // Initialize highlight.js
  useEffect(() => {
    hljs.registerLanguage('javascript', javascript);
    hljs.registerLanguage('xml', xml);
  }, []);

  // Helper component for displaying code
  const CodeDisplay = ({ code }: { code: string }) => {
    return (
      <pre className="text-xs font-mono whitespace-pre overflow-x-auto text-gray-900 leading-relaxed" style={{
        color: '#1f2937',
        backgroundColor: 'transparent',
        maxHeight: '400px',
        overflowY: 'auto'
      }}>
        {code}
      </pre>
    );
  };

  useEffect(() => {
    loadData();
  }, [agentId]);

  // Auto scroll to bottom when preview messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [previewMessages]);

  useEffect(() => {
    // Only check for changes after initial data is loaded and initialValues is set
    if (initialValues && !loading) {
      const currentValues = {
        displayName,
        initialMessage,
        suggestedMessages: JSON.stringify(suggestedMessages.map(m => m.text)),
        closedWelcomeMessages: JSON.stringify(closedWelcomeMessages),
        messagePlaceholder,
        collectFeedback,
        keepSuggestedMessages,
        footerMessage,
        appearance,
        profilePictureUrl,
        chatIconUrl,
        primaryColor,
        chatBubbleColor,
        chatBubbleAlignment,
        aiInstructions,
        selectedInstructionStyle,
        selectedAiModel
      };
      const initialValuesForCompare = {
        ...initialValues,
        suggestedMessages: JSON.stringify(initialValues.suggestedMessages),
        closedWelcomeMessages: JSON.stringify(initialValues.closedWelcomeMessages)
      };
      const hasChanges = JSON.stringify(currentValues) !== JSON.stringify(initialValuesForCompare);
      setHasUnsavedChanges(hasChanges);
    }
  }, [displayName, initialMessage, suggestedMessages, closedWelcomeMessages, messagePlaceholder, collectFeedback, keepSuggestedMessages, footerMessage, appearance, profilePictureUrl, chatIconUrl, primaryColor, chatBubbleColor, chatBubbleAlignment, aiInstructions, selectedInstructionStyle, selectedAiModel, initialValues, loading]);

  const loadData = async () => {
    if (!agentId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const agentResponse = await getAgent(agentId);
      if (agentResponse.success && agentResponse.data) {
        setAgent(agentResponse.data);
        setDisplayName(agentResponse.data.name);
      }

      const channelsResponse = await getAgentChannels(agentId);
      if (channelsResponse.success && channelsResponse.data) {
        const widgetChannel = channelsResponse.data.find(ch => ch.type === 'chat-widget');
        if (widgetChannel) {
          setChannel(widgetChannel);

          // Load Content settings
          const settings = widgetChannel.settings || {};
          if (settings.widgetTitle) setDisplayName(settings.widgetTitle);
          if (settings.welcomeMessage) setInitialMessage(settings.welcomeMessage);
          if (settings.placeholder) setMessagePlaceholder(settings.placeholder);
          if (settings.footerMessage) setFooterMessage(settings.footerMessage);
          if (settings.suggestedMessages) {
            setSuggestedMessages(settings.suggestedMessages.map((msg: string, idx: number) => ({
              id: `msg-${idx}`,
              text: msg
            })));
          }
          if (settings.closedWelcomeMessages) {
            setClosedWelcomeMessages(settings.closedWelcomeMessages);
          }
          if (settings.collectFeedback !== undefined) setCollectFeedback(settings.collectFeedback);
          if (settings.keepSuggestedMessages !== undefined) setKeepSuggestedMessages(settings.keepSuggestedMessages);

          // Load Style settings
          if (settings.appearance) setAppearance(settings.appearance);
          if (settings.profilePictureUrl) setProfilePictureUrl(settings.profilePictureUrl);
          if (settings.chatIconUrl) setChatIconUrl(settings.chatIconUrl);
          if (settings.primaryColor) setPrimaryColor(settings.primaryColor);
          if (settings.chatBubbleColor) setChatBubbleColor(settings.chatBubbleColor);
          if (settings.chatBubbleAlignment) setChatBubbleAlignment(settings.chatBubbleAlignment);

          // Load AI settings
          if (settings.aiInstructions) {
            setAiInstructions(settings.aiInstructions);
            // Detect which preset matches
            const matchingPreset = instructionPresets.find(p => p.instructions === settings.aiInstructions);
            if (matchingPreset) {
              setSelectedInstructionStyle(matchingPreset.id);
            } else {
              setSelectedInstructionStyle('custom');
            }
          }
          
          // Load AI model selection
          if (settings.aiModel) {
            setSelectedAiModel(settings.aiModel);
          }

          // Store initial values
          setInitialValues({
            displayName: settings.widgetTitle || agentResponse.data?.name || "",
            initialMessage: settings.welcomeMessage || "",
            suggestedMessages: settings.suggestedMessages || [],
            closedWelcomeMessages: settings.closedWelcomeMessages || [],
            messagePlaceholder: settings.placeholder || "Message...",
            collectFeedback: settings.collectFeedback || false,
            keepSuggestedMessages: settings.keepSuggestedMessages || false,
            footerMessage: settings.footerMessage || "Powered by Ragzy",
            appearance: settings.appearance || 'light',
            profilePictureUrl: settings.profilePictureUrl || "",
            chatIconUrl: settings.chatIconUrl || "",
            primaryColor: settings.primaryColor || "#2563eb",
            chatBubbleColor: settings.chatBubbleColor || "#2563eb",
            chatBubbleAlignment: settings.chatBubbleAlignment || 'right',
            aiInstructions: settings.aiInstructions || defaultInstructions,
            selectedInstructionStyle: 'custom',
            selectedAiModel: settings.aiModel || 'gpt-5-mini'
          });
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load widget settings', toastOptions);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSuggestedMessage = () => {
    if (newSuggestedMessage.trim() && suggestedMessages.length < 40) {
      setSuggestedMessages([
        ...suggestedMessages,
        { id: `msg-${Date.now()}`, text: newSuggestedMessage.trim() }
      ]);
      setNewSuggestedMessage("");
    }
  };

  const handleRemoveSuggestedMessage = (id: string) => {
    setSuggestedMessages(suggestedMessages.filter(msg => msg.id !== id));
  };

  // Closed welcome messages handlers
  const handleAddClosedMessage = () => {
    if (newClosedMessage.trim() && closedWelcomeMessages.length < 10) {
      setClosedWelcomeMessages([...closedWelcomeMessages, newClosedMessage.trim()]);
      setNewClosedMessage("");
    }
  };

  const handleRemoveClosedMessage = (index: number) => {
    setClosedWelcomeMessages(closedWelcomeMessages.filter((_, i) => i !== index));
  };

  const handleFileUpload = async (file: File, type: 'profile' | 'icon') => {
    if (type === 'profile') {
      setUploadingProfile(true);
    } else {
      setUploadingIcon(true);
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('workspace_id', workspaceSlug);
      formData.append('agent_id', agentId);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
      const response = await fetch(`${apiUrl}/api/upload/image`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();

      if (result.success) {
        if (type === 'profile') {
          setProfilePictureUrl(result.file_url);
        } else {
          setChatIconUrl(result.file_url);
        }
        toast.success('Image uploaded successfully!', toastOptions);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload image', toastOptions);
    } finally {
      if (type === 'profile') {
        setUploadingProfile(false);
      } else {
        setUploadingIcon(false);
      }
    }
  };

  const handleProfileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/svg+xml'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please upload a JPG, PNG, or SVG file', toastOptions);
        return;
      }
      // Validate file size (1MB)
      if (file.size > 1024 * 1024) {
        toast.error('File size must be less than 1MB', toastOptions);
        return;
      }
      handleFileUpload(file, 'profile');
    }
  };

  const handleIconFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/svg+xml'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please upload a JPG, PNG, or SVG file', toastOptions);
        return;
      }
      if (file.size > 1024 * 1024) {
        toast.error('File size must be less than 1MB', toastOptions);
        return;
      }
      handleFileUpload(file, 'icon');
    }
  };

  const handleSave = async () => {
    if (!channel) {
      toast.error('Channel not found', toastOptions);
      return;
    }

    try {
      setSaving(true);
      const updatedSettings = {
        ...channel.settings,
        widgetTitle: displayName,
        welcomeMessage: initialMessage,
        placeholder: messagePlaceholder,
        suggestedMessages: suggestedMessages.map(msg => msg.text),
        closedWelcomeMessages,
        collectFeedback,
        keepSuggestedMessages,
        footerMessage,
        appearance,
        profilePictureUrl,
        chatIconUrl,
        primaryColor,
        chatBubbleColor,
        chatBubbleAlignment,
        aiInstructions,
        aiModel: selectedAiModel
      };

      const response = await updateAgentChannel(channel.id, { settings: updatedSettings });
      if (response.success) {
        toast.success('Settings saved successfully!', toastOptions);
        setHasUnsavedChanges(false);
        // Update initial values
        setInitialValues({
          displayName,
          initialMessage,
          suggestedMessages: suggestedMessages.map(m => m.text),
          closedWelcomeMessages,
          messagePlaceholder,
          collectFeedback,
          keepSuggestedMessages,
          footerMessage,
          appearance,
          profilePictureUrl,
          chatIconUrl,
          primaryColor,
          chatBubbleColor,
          chatBubbleAlignment,
          aiInstructions,
          selectedInstructionStyle,
          selectedAiModel
        });
        await loadData();
      } else {
        toast.error(response.error || 'Failed to save settings', toastOptions);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings', toastOptions);
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (initialValues && channel) {
      setDisplayName(initialValues.displayName);
      setInitialMessage(initialValues.initialMessage);
      setSuggestedMessages(initialValues.suggestedMessages.map((msg: string, idx: number) => ({
        id: `msg-${idx}`,
        text: msg
      })));
      setClosedWelcomeMessages(initialValues.closedWelcomeMessages);
      setMessagePlaceholder(initialValues.messagePlaceholder);
      setCollectFeedback(initialValues.collectFeedback);
      setKeepSuggestedMessages(initialValues.keepSuggestedMessages);
      setFooterMessage(initialValues.footerMessage);
      setAppearance(initialValues.appearance);
      setProfilePictureUrl(initialValues.profilePictureUrl);
      setChatIconUrl(initialValues.chatIconUrl);
      setPrimaryColor(initialValues.primaryColor);
      setChatBubbleColor(initialValues.chatBubbleColor);
      setChatBubbleAlignment(initialValues.chatBubbleAlignment);
      setAiInstructions(initialValues.aiInstructions);
      setSelectedInstructionStyle(initialValues.selectedInstructionStyle);
      setSelectedAiModel(initialValues.selectedAiModel);
      setHasUnsavedChanges(false);
      toast.info('Changes discarded', toastOptions);
    }
  };

  const handlePreviewSendMessage = async () => {
    if (!previewInput.trim() || !agent) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: previewInput,
      timestamp: new Date(),
    };

    setPreviewMessages(prev => [...prev, userMessage]);
    const userInput = previewInput;
    setPreviewInput('');
    setIsPreviewLoading(true);

    const assistantMessageId = (Date.now() + 1).toString();
    let assistantContent = '';

    setPreviewMessages(prev => [...prev, {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    }]);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
      const streamUrl = `${backendUrl}/api/ai/chat/stream`;

      // Model mapping for backward compatibility
      const modelMapping: Record<string, string> = {
        'gpt-4o-mini': 'gpt-5-mini',
        'gpt-4o': 'gpt-5-mini',
        'gpt-4-turbo': 'gpt-4.1-mini',
        'gemini-2.0-flash-exp': 'gemini-2.5-flash',
        'gemini-1.5-flash': 'gemini-2.5-flash-lite',
        'gemini-1.5-pro': 'gemini-2.5-pro',
      };

      // Use the selected AI model from the widget configuration
      let modelToUse = selectedAiModel;
      
      // Map old model names to new ones
      if (modelMapping[modelToUse]) {
        console.log(`Mapping model ${modelToUse} to ${modelMapping[modelToUse]}`);
        modelToUse = modelMapping[modelToUse];
      }

      const validNewModels = ['gpt-5-mini', 'gpt-5-nano', 'gpt-4.1-mini', 'gpt-4.1-nano', 'gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.5-pro'];
      
      if (!validNewModels.includes(modelToUse)) {
        console.log(`Model ${modelToUse} not in valid models list, using gpt-5-mini instead`);
        modelToUse = 'gpt-5-mini';
      }

      const response = await fetch(streamUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userInput,
          agentId: agentId,
          aiConfig: {
            enabled: true,
            model: modelToUse,
            temperature: agent.settings?.temperature || agent.aiConfig?.temperature || 0.7,
            systemPrompt: 'custom',
            customSystemPrompt: aiInstructions || '',
            ragEnabled: true,
            embeddingProvider: 'voyage',
            embeddingModel: 'voyage-3',
            maxRetrievalDocs: 5,
            maxTokens: agent.settings?.maxTokens || agent.aiConfig?.maxTokens || 500,
            confidenceThreshold: 0.6,
            fallbackToHuman: false
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to get AI response: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response stream available');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonData = line.slice(6).trim();
              if (!jsonData) continue;

              const data = JSON.parse(jsonData);

              if (data.type === 'content') {
                assistantContent += data.content;
                setPreviewMessages(prev => prev.map(msg =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: assistantContent }
                    : msg
                ));
              } else if (data.type === 'complete') {
                setPreviewMessages(prev => prev.map(msg =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: assistantContent }
                    : msg
                ));
              } else if (data.type === 'error') {
                throw new Error(data.message);
              }
            } catch (parseError) {
              console.error('Error parsing SSE data:', parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setPreviewMessages(prev => prev.map(msg =>
        msg.id === assistantMessageId
          ? { ...msg, content: "I'm sorry, I encountered an error. Please try again." }
          : msg
      ));
      toast.error('Failed to get AI response', toastOptions);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleCopyCode = async (code: string, codeId: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(codeId);
      setTimeout(() => setCopiedCode(''), 2000);
      toast.success('Code copied to clipboard!', toastOptions);
    } catch (err) {
      toast.error('Failed to copy code', toastOptions);
    }
  };

  // Generate embed codes
  const generateChatWidgetCode = () => {
    const baseUrl = window.location.origin;
    const channelId = channel?.id || 'CHANNEL_ID';

    return `// For Next.js/React Applications (Recommended)
import { ChatWidget } from '@/app/components/chat-widget';

<ChatWidget
  agentId="${agentId}"
  workspaceSlug="${workspaceSlug}"
  channelId="${channelId}"
  baseUrl="${baseUrl}"
  position="bottom-right"
/>`;
  };

  const generateIframeCode = () => {
    // Get production URL if available, otherwise use localhost for development
    const productionUrl = 'https://ai-native-crm.vercel.app'; // Update this with your actual production URL
    const isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';
    const baseUrl = isDevelopment ? window.location.origin : productionUrl;
    const channelId = channel?.id || '';

    if (!channelId) {
      return '<!-- Save your widget settings first to generate the embed code -->';
    }

    return `<!-- Rexa Chat Widget - Iframe Embed -->
<iframe
  src="${baseUrl}/chat/${workspaceSlug}/${agentId}/${channelId}"
  width="100%"
  height="600"
  style="border: none; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); min-height: 400px;"
  title="Rexa Chat Widget"
  allow="clipboard-write"
  loading="lazy"
></iframe>`;
  };

  const generateUniversalScript = () => {
    const productionUrl = 'https://ai-native-crm.vercel.app';
    const isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';
    const baseUrl = isDevelopment ? window.location.origin : productionUrl;
    const channelId = channel?.id || '';

    if (!channelId) {
      return '<!-- Save your widget settings first to generate the embed code -->';
    }

    const buttonColor = chatBubbleColor || primaryColor || '#3B82F6';

    return `<script>
(function(){if(!window.rexaChat||window.rexaChat("getState")!=="initialized"){window.rexaChat=(...arguments)=>{if(!window.rexaChat.q){window.rexaChat.q=[]}window.rexaChat.q.push(arguments)};window.rexaChat=new Proxy(window.rexaChat,{get(target,prop){if(prop==="q"){return target.q}return(...args)=>target(prop,...args)}})}const onLoad=function(){const c={agentId:"${agentId}",workspaceSlug:"${workspaceSlug}",channelId:"${channelId}",baseUrl:"${baseUrl}",buttonColor:"${buttonColor}",pos:"bottom-right"};const i=document.createElement("iframe");i.src=c.baseUrl+"/chat/"+c.workspaceSlug+"/"+c.agentId+"/"+c.channelId;i.id="rexa-chat-iframe";i.title="Rexa Chat";i.style.cssText="position:fixed;bottom:20px;right:20px;width:400px;max-width:calc(100vw - 40px);height:600px;max-height:calc(100vh - 100px);border:none;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.12);z-index:999999;display:none;opacity:0;transition:all 0.3s";const b=document.createElement("button");b.id="rexa-chat-button";b.innerHTML='<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';b.style.cssText="position:fixed;bottom:20px;right:20px;width:60px;height:60px;border-radius:50%;border:none;background:"+c.buttonColor+";color:white;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.15);z-index:1000000;display:flex;align-items:center;justify-content:center;transition:all 0.3s";let o=false;b.onclick=()=>{o=!o;if(o){i.style.display="block";setTimeout(()=>i.style.opacity="1",10);b.innerHTML='<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'}else{i.style.opacity="0";setTimeout(()=>i.style.display="none",300);b.innerHTML='<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'}b.style.transform=o?"scale(0.9)":"scale(1)"};b.onmouseenter=()=>{if(!o)b.style.transform="scale(1.05)"};b.onmouseleave=()=>{if(!o)b.style.transform="scale(1)"};document.body.appendChild(i);document.body.appendChild(b);window.rexaChat.open=()=>b.click();window.rexaChat.close=()=>{if(o)b.click()};window.rexaChat.toggle=()=>b.click();window.rexaChat.isOpen=()=>o;window.rexaChat("initialized")};if(document.readyState==="complete"){onLoad()}else{window.addEventListener("load",onLoad)}})();
</script>`;
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: "content", label: "Content" },
    { id: "style", label: "Style" },
    { id: "ai", label: "AI" },
    { id: "embed", label: "Embed" }
  ];

  // Widget colors based on appearance (not the preview background!)
  const widgetBgColor = appearance === 'dark' ? '#1a1a1a' : '#ffffff';
  const widgetHeaderBg = appearance === 'dark' ? '#262626' : '#ffffff';
  const widgetTextColor = appearance === 'dark' ? '#f5f5f5' : '#0a0a0a';
  const widgetBorderColor = appearance === 'dark' ? '#404040' : '#e5e5e5';
  const widgetMessagesBg = appearance === 'dark' ? '#0a0a0a' : '#f9fafb';
  const widgetInputBg = appearance === 'dark' ? '#171717' : '#f3f4f6';
  const widgetMutedText = appearance === 'dark' ? '#a3a3a3' : '#737373';
  const widgetFooterText = appearance === 'dark' ? '#737373' : '#a3a3a3';

  // Theme-based message bubble colors (matching ChatWidget.tsx)
  const assistantBubbleBg = appearance === 'dark' ? '#262626' : '#f3f4f6';
  const assistantBubbleText = appearance === 'dark' ? '#f5f5f5' : '#0a0a0a';
  const userBubbleBg = appearance === 'dark' ? '#3b4252' : '#dbeafe';
  const userBubbleText = appearance === 'dark' ? '#e5e9f0' : '#1e40af';

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Main Content - Fixed Height */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Scrollable */}
        <div className="w-full md:w-[400px] lg:w-[480px] border-r border-border bg-background flex flex-col">
          {/* Sidebar Header - Fixed */}
          <div className="p-6 border-b border-border bg-background">
            <Link
              href={`/dashboard/${workspaceSlug}/agents/${agentId}/deploy`}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Deploy
            </Link>

            <div className="flex items-center justify-between mb-6">
              <h1 className="text-xl font-semibold text-foreground">Chat widget</h1>
              <Switch checked={channel?.isActive || false} disabled suppressHydrationWarning />
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-border">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                    activeTab === tab.id
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  suppressHydrationWarning
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Sidebar Content - Scrollable */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-6 space-y-6">
              {activeTab === "content" && (
                <>
                  {/* Display Name */}
                  <div>
                    <Label htmlFor="displayName" className="text-sm font-medium text-foreground">
                      Display name
                    </Label>
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter display name"
                      className="mt-2"
                      suppressHydrationWarning
                    />
                  </div>

                  {/* Initial Messages */}
                  <div>
                    <Label htmlFor="initialMessage" className="text-sm font-medium text-foreground">
                      Initial messages
                    </Label>
                    <Textarea
                      id="initialMessage"
                      value={initialMessage}
                      onChange={(e) => setInitialMessage(e.target.value)}
                      placeholder="Hi! What can I help you with?"
                      className="mt-2 min-h-[100px] resize-none"
                    />
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <span className="inline-block w-4 h-4 rounded-full bg-muted flex items-center justify-center text-[10px]">i</span>
                      Enter each message in a new line.
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setInitialMessage("")}
                      className="mt-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Reset
                    </Button>
                  </div>

                  {/* Suggested Messages */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                        Suggested messages
                        <span className="inline-block w-4 h-4 rounded-full bg-muted flex items-center justify-center text-[10px] text-muted-foreground">i</span>
                      </Label>
                    </div>

                    {/* Keep showing toggle */}
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-foreground">
                          Keep showing the suggested messages after the user&apos;s first message
                        </span>
                        <span className="inline-block w-4 h-4 rounded-full bg-muted flex items-center justify-center text-[10px] text-muted-foreground">i</span>
                      </div>
                      <Switch
                        checked={keepSuggestedMessages}
                        onCheckedChange={setKeepSuggestedMessages}
                        suppressHydrationWarning
                      />
                    </div>

                    {/* Suggested Messages List */}
                    <div className="space-y-2 mb-3">
                      {suggestedMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className="flex items-center gap-2 p-2 bg-muted/50 rounded-md group"
                        >
                          <span className="flex-1 text-sm text-foreground">{msg.text}</span>
                          <button
                            onClick={() => handleRemoveSuggestedMessage(msg.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add Suggested Message */}
                    <div className="flex items-center gap-2">
                      <Input
                        value={newSuggestedMessage}
                        onChange={(e) => setNewSuggestedMessage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleAddSuggestedMessage();
                          }
                        }}
                        placeholder="Add suggested message..."
                        className="flex-1"
                        disabled={suggestedMessages.length >= 40}
                        suppressHydrationWarning
                      />
                      <Button
                          onClick={handleAddSuggestedMessage}
                          disabled={!newSuggestedMessage.trim() || suggestedMessages.length >= 40}
                          size="icon"
                          variant="outline"
                          suppressHydrationWarning
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {suggestedMessages.length}/40
                    </p>
                  </div>

                  {/* Closed Welcome Messages (shown when widget is closed) */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                        Closed welcome messages
                        <span className="inline-block w-4 h-4 rounded-full bg-muted flex items-center justify-center text-[10px] text-muted-foreground">i</span>
                      </Label>
                    </div>

                    {/* Closed Welcome Messages List */}
                    <div className="space-y-2 mb-3">
                      {closedWelcomeMessages.map((msg, index) => (
                        <div
                          key={`closed-${index}`}
                          className="flex items-center gap-2 p-2 bg-muted/50 rounded-md group"
                        >
                          <span className="flex-1 text-sm text-foreground whitespace-pre-wrap">{msg}</span>
                          <button
                            onClick={() => handleRemoveClosedMessage(index)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                          </button>
                        </div>
                      ))}
                      {closedWelcomeMessages.length === 0 && (
                        <p className="text-xs text-muted-foreground">Add messages that will show above the chat bubble when closed.</p>
                      )}
                    </div>

                    {/* Add Closed Welcome Message */}
                    <div className="flex items-center gap-2">
                      <Input
                        value={newClosedMessage}
                        onChange={(e) => setNewClosedMessage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleAddClosedMessage();
                          }
                        }}
                        placeholder="Add closed welcome message..."
                        className="flex-1"
                        disabled={closedWelcomeMessages.length >= 10}
                        suppressHydrationWarning
                      />
                      <Button
                        onClick={handleAddClosedMessage}
                        disabled={!newClosedMessage.trim() || closedWelcomeMessages.length >= 10}
                        size="icon"
                        variant="outline"
                        suppressHydrationWarning
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {closedWelcomeMessages.length}/10
                    </p>
                  </div>

                  {/* Message Placeholder */}
                  <div>
                    <Label htmlFor="messagePlaceholder" className="text-sm font-medium text-foreground">
                      Message placeholder
                    </Label>
                    <Input
                      id="messagePlaceholder"
                      value={messagePlaceholder}
                      onChange={(e) => setMessagePlaceholder(e.target.value)}
                      placeholder="Message..."
                      className="mt-2"
                      suppressHydrationWarning
                    />
                  </div>

                  {/* Footer Message */}
                  <div>
                    <Label htmlFor="footerMessage" className="text-sm font-medium text-foreground">
                      Footer message
                    </Label>
                    <Input
                      id="footerMessage"
                      value={footerMessage}
                      onChange={(e) => setFooterMessage(e.target.value)}
                      placeholder="Powered by Ragzy"
                      className="mt-2"
                      suppressHydrationWarning
                    />
                  </div>

                  {/* Collect User Feedback */}
                  <div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm font-medium text-foreground cursor-pointer">
                          Collect user feedback
                        </Label>
                        <span className="inline-block w-4 h-4 rounded-full bg-muted flex items-center justify-center text-[10px] text-muted-foreground">i</span>
                      </div>
                      <Switch
                        checked={collectFeedback}
                        onCheckedChange={setCollectFeedback}
                        suppressHydrationWarning
                      />
                    </div>
                  </div>
                </>
              )}

              {activeTab === "style" && (
                <>
                  {/* Appearance */}
                  <div>
                    <Label className="text-sm font-medium text-foreground mb-3 block">
                      Appearance
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setAppearance('light')}
                        className={`p-4 border rounded-md transition-all ${
                          appearance === 'light'
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 hover:border-primary/50'
                        }`}
                      >
                        <div className="w-full h-16 bg-white border border-gray-200 rounded mb-2 flex items-center justify-center">
                          <div className="text-xs text-gray-600">Light</div>
                        </div>
                        <p className="text-sm font-medium text-center">Light</p>
                      </button>
                      <button
                        onClick={() => setAppearance('dark')}
                        className={`p-4 border rounded-md transition-all ${
                          appearance === 'dark'
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 hover:border-primary/50'
                        }`}
                      >
                        <div className="w-full h-16 bg-gray-800 border border-gray-700 rounded mb-2 flex items-center justify-center">
                          <div className="text-xs text-gray-300">Dark</div>
                        </div>
                        <p className="text-sm font-medium text-center">Dark</p>
                      </button>
                    </div>
                  </div>

                  {/* Profile Picture */}
                  <div>
                    <Label className="text-sm font-medium text-foreground mb-2 block">
                      Profile picture
                    </Label>
                    <p className="text-xs text-muted-foreground mb-3">
                      JPG, PNG, and SVG up to 1MB
                    </p>
                    {profilePictureUrl && (
                      <div className="mb-3">
                        <img
                          src={profilePictureUrl}
                          alt="Profile"
                          className="w-16 h-16 rounded-full object-cover border-2 border-border"
                        />
                      </div>
                    )}
                    <input
                      type="file"
                      ref={profileFileInputRef}
                      onChange={handleProfileFileChange}
                      accept="image/jpeg,image/png,image/svg+xml"
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => profileFileInputRef.current?.click()}
                      disabled={uploadingProfile}
                      className="w-full"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploadingProfile ? 'Uploading...' : 'Upload'}
                    </Button>
                  </div>

                  {/* Chat Icon */}
                  <div>
                    <Label className="text-sm font-medium text-foreground mb-2 block">
                      Chat icon
                    </Label>
                    <p className="text-xs text-muted-foreground mb-3">
                      JPG, PNG, and SVG up to 1MB
                    </p>
                    {chatIconUrl && (
                      <div className="mb-3">
                        <img
                          src={chatIconUrl}
                          alt="Chat Icon"
                          className="w-12 h-12 rounded-lg object-cover border-2 border-border"
                        />
                      </div>
                    )}
                    <input
                      type="file"
                      ref={iconFileInputRef}
                      onChange={handleIconFileChange}
                      accept="image/jpeg,image/png,image/svg+xml"
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => iconFileInputRef.current?.click()}
                      disabled={uploadingIcon}
                      className="w-full"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploadingIcon ? 'Uploading...' : 'Upload'}
                    </Button>
                  </div>

                  {/* Primary Color */}
                  <div>
                    <Label htmlFor="primaryColor" className="text-sm font-medium text-foreground mb-2 block">
                      Primary color
                    </Label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        id="primaryColor"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-12 h-10 rounded border border-border cursor-pointer"
                      />
                      <Input
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        placeholder="#2563eb"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  {/* Chat Bubble Color */}
                  <div>
                    <Label htmlFor="chatBubbleColor" className="text-sm font-medium text-foreground mb-2 block">
                      Chat bubble color
                    </Label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        id="chatBubbleColor"
                        value={chatBubbleColor}
                        onChange={(e) => setChatBubbleColor(e.target.value)}
                        className="w-12 h-10 rounded border border-border cursor-pointer"
                      />
                      <Input
                        value={chatBubbleColor}
                        onChange={(e) => setChatBubbleColor(e.target.value)}
                        placeholder="#2563eb"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  {/* Chat Bubble Alignment */}
                  <div>
                    <Label className="text-sm font-medium text-foreground mb-3 block">
                      Chat bubble
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setChatBubbleAlignment('left')}
                        className={`p-4 border rounded-md transition-all flex items-center gap-2 ${
                          chatBubbleAlignment === 'left'
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 hover:border-primary/50'
                        }`}
                      >
                        <AlignLeft className="w-5 h-5" />
                        <span className="text-sm font-medium">Left align</span>
                      </button>
                      <button
                        onClick={() => setChatBubbleAlignment('right')}
                        className={`p-4 border rounded-md transition-all flex items-center gap-2 ${
                          chatBubbleAlignment === 'right'
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 hover:border-primary/50'
                        }`}
                      >
                        <AlignRight className="w-5 h-5" />
                        <span className="text-sm font-medium">Right align</span>
                      </button>
                    </div>
                  </div>
                </>
              )}

              {activeTab === "ai" && (
                <>
                  {/* AI Model Selection */}
                  <div>
                    <Label className="text-sm font-medium text-foreground mb-3 block">
                      AI Model
                    </Label>
                    <p className="text-xs text-muted-foreground mb-4">
                      Choose the AI model that will power your chat widget responses.
                    </p>
                    <div className="grid grid-cols-1 gap-3 mb-6">
                      {availableModels.map((model) => (
                        <button
                          key={model.id}
                          onClick={() => setSelectedAiModel(model.id)}
                          className={`p-4 border rounded-md transition-all text-left ${
                            selectedAiModel === model.id
                              ? 'border-primary bg-primary/5'
                              : 'border-gray-200 hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="text-sm font-semibold text-foreground mb-1">
                                {model.name}
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                {model.description}
                              </p>
                            </div>
                            {selectedAiModel === model.id && (
                              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0 ml-3">
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Instruction Style Selection */}
                  <div>
                    <Label className="text-sm font-medium text-foreground mb-3 block">
                      Instruction Style
                    </Label>
                    <p className="text-xs text-muted-foreground mb-4">
                      Choose a pre-configured instruction style or create your own custom instructions.
                    </p>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {instructionPresets.map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => {
                            setSelectedInstructionStyle(preset.id);
                            if (preset.id !== 'custom') {
                              setAiInstructions(preset.instructions);
                            }
                          }}
                          className={`p-3 border rounded-md transition-all text-left ${
                            selectedInstructionStyle === preset.id
                              ? 'border-primary bg-primary/5'
                              : 'border-gray-200 hover:border-primary/50'
                          }`}
                        >
                          <h4 className="text-sm font-semibold text-foreground mb-1">
                            {preset.label}
                          </h4>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {preset.description}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Chat Widget Instructions */}
                  <div>
                    <Label htmlFor="aiInstructions" className="text-sm font-medium text-foreground mb-2 block">
                      Chat widget instructions
                    </Label>
                    <p className="text-xs text-muted-foreground mb-3">
                      {selectedInstructionStyle === 'custom'
                        ? 'Define how your AI agent should behave and respond to users.'
                        : 'View and customize the selected instruction style.'}
                    </p>
                    <Textarea
                      id="aiInstructions"
                      value={aiInstructions}
                      onChange={(e) => {
                        setAiInstructions(e.target.value);
                        setSelectedInstructionStyle('custom');
                      }}
                      placeholder="Enter AI instructions..."
                      className="min-h-[350px] resize-none font-mono text-xs"
                    />
                    <div className="flex items-center justify-between mt-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const preset = instructionPresets.find(p => p.id === selectedInstructionStyle);
                          if (preset && preset.id !== 'custom') {
                            setAiInstructions(preset.instructions);
                          } else {
                            setAiInstructions(defaultInstructions);
                            setSelectedInstructionStyle('sales');
                          }
                        }}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Reset
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        {aiInstructions.length} characters
                      </p>
                    </div>
                  </div>
                </>
              )}

              {activeTab === "embed" && (
                <>
                  {/* Embed Type Selection */}
                  <div>
                    <Label className="text-sm font-medium text-foreground mb-3 block">
                      Embed Type
                    </Label>
                    <div className="grid grid-cols-1 gap-3">
                      {/* Chat Widget Option */}
                      <button
                        onClick={() => setEmbedType('chat-widget')}
                        className={`p-4 border rounded-md transition-all text-left ${
                          embedType === 'chat-widget'
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            embedType === 'chat-widget' ? 'bg-primary' : 'bg-muted'
                          }`}>
                            <MessageCircle className={`w-5 h-5 ${
                              embedType === 'chat-widget' ? 'text-white' : 'text-muted-foreground'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-foreground mb-1">
                              Chat Widget
                            </h4>
                            <p className="text-xs text-muted-foreground mb-2">
                              Embed a chat bubble on your website. Allows you to use all the advanced features of the agent.
                            </p>
                            <a
                              href="#"
                              className="text-xs text-primary hover:underline"
                              onClick={(e) => e.preventDefault()}
                            >
                              Explore the docs →
                            </a>
                          </div>
                        </div>
                      </button>

                      {/* Iframe Option */}
                      <button
                        onClick={() => setEmbedType('iframe')}
                        className={`p-4 border rounded-md transition-all text-left ${
                          embedType === 'iframe'
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            embedType === 'iframe' ? 'bg-primary' : 'bg-muted'
                          }`}>
                            <svg
                              className={`w-5 h-5 ${embedType === 'iframe' ? 'text-white' : 'text-muted-foreground'}`}
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <rect x="2" y="3" width="20" height="14" rx="2" />
                              <line x1="8" y1="21" x2="16" y2="21" />
                              <line x1="12" y1="17" x2="12" y2="21" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-foreground mb-1">
                              Iframe
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              Embed the chat interface directly using an iframe. Note: Advanced features are not supported.
                            </p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Embed Setup */}
                  <div className="mt-6">
                    {embedType === 'chat-widget' ? (
                      <>
                        <div className="mb-4">
                          <Label className="text-sm font-medium text-foreground mb-2 block">
                            Chat Widget Setup
                          </Label>
                          <p className="text-sm text-muted-foreground mb-4">
                            Copy and paste this code snippet before the closing <code className="px-1 py-0.5 bg-gray-100 rounded text-xs">&lt;/body&gt;</code> tag of your website.
                          </p>
                        </div>

                        {/* Universal Script Code Block */}
                         <div className="mb-4">
                           <div className="relative group">
                             <div className="bg-gray-900 border-2 border-gray-700 rounded-lg overflow-hidden">
                               <div className="p-5 pb-3 overflow-x-auto overflow-y-auto max-h-96 custom-scrollbar" style={{
                                 scrollbarWidth: 'thin',
                                 scrollbarColor: '#4b5563 #1f2937'
                               }}>
                                 <pre className="text-xs font-mono text-gray-100 leading-relaxed" style={{
                                   color: '#f3f4f6',
                                   whiteSpace: 'pre',
                                   overflowWrap: 'normal',
                                   wordBreak: 'normal'
                                 }}>
                                   {generateUniversalScript()}
                                 </pre>
                               </div>
                             </div>
                             <button
                               onClick={() => handleCopyCode(generateUniversalScript(), 'universal')}
                               className="absolute top-4 right-4 px-3 py-2 bg-white hover:bg-gray-100 text-gray-900 rounded-lg transition-all shadow-lg border border-gray-300 font-medium text-xs flex items-center gap-2 opacity-0 group-hover:opacity-100"
                               suppressHydrationWarning
                             >
                               {copiedCode === 'universal' ? (
                                 <>
                                   <Check className="w-4 h-4 text-green-600" />
                                   <span className="text-green-600 font-semibold">Copied!</span>
                                 </>
                               ) : (
                                 <>
                                   <Copy className="w-4 h-4 text-gray-700" />
                                   <span className="text-gray-700 font-semibold">Copy Code</span>
                                 </>
                               )}
                             </button>
                           </div>
                           <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                             <p className="text-sm text-green-900 font-semibold mb-2">
                               ✅ Works Everywhere
                             </p>
                             <p className="text-sm text-green-800">
                               Compatible with WordPress, Shopify, Wix, Webflow, and any platform that supports JavaScript. Just paste before <code className="px-1.5 py-0.5 bg-green-100 rounded text-xs font-mono">&lt;/body&gt;</code>
                             </p>
                           </div>
                         </div>
                      </>) : (
                      <>
                        <div className="mb-4">
                          <Label className="text-sm font-medium text-foreground mb-2 block">
                            Direct Iframe Embed
                          </Label>
                          <p className="text-sm text-muted-foreground mb-4">
                            Embed the chat interface directly using an iframe. Add this code anywhere on your page.
                          </p>
                        </div>

                        {/* Code Block */}
                         <div className="relative group mb-4">
                           <div className="bg-gray-900 border-2 border-gray-700 rounded-lg overflow-hidden">
                             <div className="p-5 pb-3 overflow-x-auto overflow-y-auto max-h-96 custom-scrollbar" style={{
                               scrollbarWidth: 'thin',
                               scrollbarColor: '#4b5563 #1f2937'
                             }}>
                               <pre className="text-xs font-mono text-gray-100 leading-relaxed" style={{
                                 color: '#f3f4f6',
                                 whiteSpace: 'pre',
                                 overflowWrap: 'normal',
                                 wordBreak: 'normal'
                               }}>
                                 {generateIframeCode()}
                               </pre>
                             </div>
                           </div>
                           <button
                             onClick={() => handleCopyCode(generateIframeCode(), 'iframe')}
                             className="absolute top-4 right-4 px-3 py-2 bg-white hover:bg-gray-100 text-gray-900 rounded-lg transition-all shadow-lg border border-gray-300 font-medium text-xs flex items-center gap-2 opacity-0 group-hover:opacity-100"
                             suppressHydrationWarning
                           >
                             {copiedCode === 'iframe' ? (
                               <>
                                 <Check className="w-4 h-4 text-green-600" />
                                 <span className="text-green-600 font-semibold">Copied!</span>
                               </>
                             ) : (
                               <>
                                 <Copy className="w-4 h-4 text-gray-700" />
                                 <span className="text-gray-700 font-semibold">Copy Code</span>
                               </>
                             )}
                           </button>
                         </div>

                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-900 font-semibold mb-2">
                            📱 Inline Embed
                          </p>
                          <p className="text-sm text-blue-800">
                            Embeds chat interface directly on your page. For a floating button, use Chat Widget instead.
                          </p>
                        </div>
                      </>)}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Unsaved Changes Warning - Fixed at Bottom */}
          {hasUnsavedChanges && (
            <div className="p-4 border-t border-border bg-muted/30">
              <p className="text-sm font-medium text-foreground mb-3">
                You have unsaved changes. Do you wish to save them?
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleDiscard}
                  className="flex-1"
                  disabled={saving}
                >
                  Discard
                </Button>
                <Button
                  onClick={handleSave}
                  className="flex-1 bg-primary hover:bg-primary/90"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save changes'}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right Preview Panel - Always Light Background */}
        <div className="hidden lg:flex flex-1 items-center justify-center p-8 bg-gray-50">
          <div className="flex flex-col items-end gap-6">
            {/* Preview Header */}
            <div className="flex items-center justify-between mb-4 w-[380px]">
              <h3 className="text-sm font-medium text-gray-600">
                {displayName || "my agent"}
              </h3>
              <Button variant="ghost" size="icon" className="w-8 h-8">
                <RefreshCw className="w-4 h-4 text-gray-600" />
              </Button>
            </div>

            {/* Chat Widget Preview */}
            <div
              className="w-[380px] h-[600px] rounded-lg shadow-2xl overflow-hidden flex flex-col"
              style={{
                backgroundColor: widgetBgColor,
                border: `1px solid ${widgetBorderColor}`
              }}
            >
              {/* Chat Header */}
              <div className="p-4 border-b" style={{
                borderColor: widgetBorderColor,
                backgroundColor: widgetHeaderBg
              }}>
                <div className="flex items-center gap-3">
                  {profilePictureUrl ? (
                    <img
                      src={profilePictureUrl}
                      alt="Agent"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-semibold"
                      style={{ backgroundColor: primaryColor, color: 'white' }}
                    >
                      {(displayName || "my agent").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-sm" style={{ color: widgetTextColor }}>
                      {displayName || "my agent"}
                    </h3>
                    <p className="text-xs" style={{ color: widgetMutedText }}>Online</p>
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-4 space-y-3 overflow-y-auto custom-scrollbar" style={{ backgroundColor: widgetMessagesBg }}>
                {/* Bot Initial Message with Name Above */}
                {initialMessage && previewMessages.length === 0 && (
                  <div className="flex flex-col items-start gap-1">
                    <div className="flex items-center gap-2 ml-10">
                      <span className="text-xs font-medium" style={{ color: widgetMutedText }}>
                        {displayName || "my agent"}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      {profilePictureUrl ? (
                        <img
                          src={profilePictureUrl}
                          alt="Agent"
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                          style={{ backgroundColor: primaryColor, color: 'white' }}
                        >
                          {(displayName || "my agent").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div
                        className="rounded-2xl px-4 py-2 max-w-[260px]"
                        style={{
                          backgroundColor: assistantBubbleBg,
                          color: assistantBubbleText
                        }}
                      >
                        <p className="text-sm whitespace-pre-wrap">
                          {initialMessage}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Dynamic Messages */}
                {previewMessages.map((msg) => (
                  msg.role === 'user' ? (
                    <div key={msg.id} className={`flex ${chatBubbleAlignment === 'right' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className="rounded-2xl px-4 py-2 max-w-[260px]"
                        style={{
                          backgroundColor: userBubbleBg,
                          color: userBubbleText
                        }}
                      >
                        <p className="text-sm font-medium">{msg.content}</p>
                      </div>
                    </div>
                  ) : (
                    <div key={msg.id} className="flex flex-col items-start gap-1">
                      <div className="flex items-center gap-2 ml-10">
                        <span className="text-xs font-medium" style={{ color: widgetMutedText }}>
                          {displayName || "my agent"}
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        {profilePictureUrl ? (
                          <img
                            src={profilePictureUrl}
                            alt="Agent"
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                            style={{ backgroundColor: primaryColor, color: 'white' }}
                          >
                            {(displayName || "my agent").charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div
                          className="rounded-2xl px-4 py-2 max-w-[260px]"
                          style={{
                            backgroundColor: assistantBubbleBg,
                            color: assistantBubbleText
                          }}
                        >
                          <p className="text-sm whitespace-pre-wrap">
                            {msg.content || (isPreviewLoading && <span className="animate-pulse">...</span>)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                ))}

                {/* Suggested Messages - Show based on keepSuggestedMessages setting */}
                {suggestedMessages.length > 0 && (keepSuggestedMessages || previewMessages.length === 0) && (
                  <div className="flex flex-wrap gap-2 pt-2 justify-end">
                    {suggestedMessages.slice(0, 3).map((msg) => (
                      <button
                        key={msg.id}
                        onClick={() => {
                          setPreviewInput(msg.text);
                        }}
                        className="px-3 py-2 border-2 rounded-full text-xs font-medium transition-all hover:opacity-80"
                        style={{
                          backgroundColor: appearance === 'dark' ? '#374151' : '#f9fafb',
                          borderColor: appearance === 'dark' ? '#4b5563' : '#e5e7eb',
                          color: widgetTextColor
                        }}
                      >
                        {msg.text}
                      </button>
                    ))}
                  </div>
                )}

                {/* Scroll anchor */}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t" style={{
                borderColor: widgetBorderColor,
                backgroundColor: widgetHeaderBg
              }}>
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{ backgroundColor: widgetInputBg }}
                >
                  <input
                    type="text"
                    value={previewInput}
                    onChange={(e) => setPreviewInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && previewInput.trim() && !isPreviewLoading) {
                        handlePreviewSendMessage();
                      }
                    }}
                    placeholder={messagePlaceholder}
                    className="flex-1 bg-transparent border-none outline-none text-sm"
                    style={{ color: widgetTextColor }}
                    disabled={isPreviewLoading}
                    suppressHydrationWarning
                  />
                  <button
                    onClick={handlePreviewSendMessage}
                    disabled={!previewInput.trim() || isPreviewLoading}
                    className="transition-colors disabled:opacity-50"
                    style={{ color: previewInput.trim() && !isPreviewLoading ? primaryColor : '#9ca3af' }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                  </button>
                </div>

                {/* Footer */}
                {footerMessage && (
                  <div className="flex items-center justify-center gap-1 mt-3">
                    <span className="text-xs" style={{ color: widgetFooterText }}>
                      {footerMessage}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Floating Chat Button - Below Widget */}
            <button
              className="w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110"
              style={{ backgroundColor: chatBubbleColor }}
              suppressHydrationWarning
            >
              {chatIconUrl ? (
                <img
                  src={chatIconUrl}
                  alt="Chat"
                  className="w-8 h-8 object-cover"
                />
              ) : (
                <MessageCircle className="w-6 h-6 text-white" fill="white" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

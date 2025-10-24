'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  ChatWidget, 
  ChatConversation, 
  ChatMessage, 
  createChatConversation, 
  sendMessage, 
  subscribeToMessages 
} from '@/app/lib/chat-utils';
import { X, Send, MessageCircle, Minimize2, User, Bot, Loader2, History, ChevronLeft, Plus } from 'lucide-react';
import { apiClient, AIChatRequest } from '@/app/lib/api-client';

// Extended widget type with all custom properties
type ExtendedWidget = Partial<ChatWidget> & {
  id?: string;
  businessId?: string;
  textColor?: string;
  iconType?: string;
  customIcon?: string;
  widgetSize?: string;
  borderRadius?: string;
  headerSubtitle?: string;
  showBranding?: boolean;
  quickReplies?: string[];
  buttonStyle?: string;
  buttonAnimation?: string;
  buttonSize?: string;
  buttonShadow?: string;
  buttonHoverEffect?: string;
  showButtonTooltip?: boolean;
  buttonTooltip?: string;
  showBadge?: boolean;
  badgeCount?: number;
  badgeColor?: string;
  badgePosition?: string;
  badgeAnimation?: string;
  showOnlineDot?: boolean;
  onlineDotColor?: string;
  requireContactForm?: boolean;
  collectName?: boolean;
  customFields?: Array<{id: string, label: string, type: string, required: boolean, placeholder?: string}>;
  aiConfig?: {
    enabled: boolean;
    [key: string]: unknown;
  };
  customerHandover?: {
    enabled?: boolean;
    showHandoverButton?: boolean;
    handoverButtonPosition?: string;
    handoverButtonText?: string;
    includeInQuickReplies?: boolean;
    autoDetectKeywords?: boolean;
    detectionKeywords?: string[];
    handoverMessage?: string;
    allowCustomerToSwitch?: boolean;
    [key: string]: unknown;
  };
};

interface WidgetPreviewProps {
  widget: ExtendedWidget;
  viewMode: 'desktop' | 'mobile';
}

export default function WidgetPreview({ widget, viewMode }: WidgetPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [aiThinking, setAiThinking] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{id: string, lastMessage: string, timestamp: Date, messageCount: number}>>([]);
  const [userEmail, setUserEmail] = useState<string>('');
  const [handoverRequested, setHandoverRequested] = useState(false);
  const [handoverMode, setHandoverMode] = useState<'ai' | 'human'>('ai');
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [sending, setSending] = useState(false);

  // Get initials from name
  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };


  // Load user email from localStorage on mount
  useEffect(() => {
    const widgetId = widget.id || 'preview';
    const storageKey = `widget_user_email_${widgetId}`;
    const storedEmail = localStorage.getItem(storageKey);
    
    if (storedEmail) {
      setUserEmail(storedEmail);
      setFormData(prev => ({ ...prev, email: storedEmail }));
      
      // Load chat history if we have stored email
      loadChatHistoryFromStorage(storedEmail);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widget]);

  const primaryColor = widget.primaryColor || '#3B82F6';
  const textColor = widget.textColor || '#FFFFFF';
  const position = widget.position || 'bottom-right';
  const iconType = widget.iconType || 'default';
  const customIcon = widget.customIcon || '';
  const widgetSize = widget.widgetSize || 'standard';
  const borderRadius = widget.borderRadius || '16';
  const headerSubtitle = widget.headerSubtitle || "We're here to help!";
  const showBranding = widget.showBranding !== undefined ? widget.showBranding : true;
  const quickReplies = widget.quickReplies || ['Get Support', 'Pricing', 'Contact Sales'];
  
  
  
  // New styling options
  const buttonStyle = widget.buttonStyle || 'rounded';
  const buttonAnimation = widget.buttonAnimation || 'pulse';
  const buttonSize = widget.buttonSize || 'medium';
  const buttonHoverEffect = widget.buttonHoverEffect || 'scale';
  const showButtonTooltip = widget.showButtonTooltip !== undefined ? widget.showButtonTooltip : true;
  const buttonTooltip = widget.buttonTooltip || 'Chat with us';
  const showBadge = widget.showBadge || false;
  const badgeCount = widget.badgeCount || 0;
  const badgeColor = widget.badgeColor || '#EF4444';
  const badgePosition = widget.badgePosition || 'top-right';
  const badgeAnimation = widget.badgeAnimation || 'pulse';
  const showOnlineDot = widget.showOnlineDot !== undefined ? widget.showOnlineDot : true;
  const onlineDotColor = widget.onlineDotColor || '#10B981';
  
  // Widget size dimensions
  const sizeMap = {
    compact: { width: '360px', height: '480px', button: 'w-5 h-5' },
    standard: { width: '400px', height: '550px', button: 'w-6 h-6' },
    large: { width: '450px', height: '650px', button: 'w-7 h-7' }
  };
  
  const dimensions = sizeMap[widgetSize as keyof typeof sizeMap] || sizeMap.standard;

  // Button size mapping
  const buttonSizeMap = {
    small: '48px',
    medium: '56px',
    large: '64px',
    xl: '72px'
  };
  const buttonDimension = buttonSizeMap[buttonSize as keyof typeof buttonSizeMap] || buttonSizeMap.medium;

  // Button style mapping
  const getButtonStyle = () => {
    const baseStyle = {
      width: buttonDimension,
      height: buttonDimension
    };
    
    switch (buttonStyle) {
      case 'circular':
        return { ...baseStyle, backgroundColor: primaryColor, borderRadius: '50%' };
      case 'rounded':
        return { ...baseStyle, backgroundColor: primaryColor, borderRadius: '16px' };
      case 'square':
        return { ...baseStyle, backgroundColor: primaryColor, borderRadius: '4px' };
      case 'pill':
        return { ...baseStyle, backgroundColor: primaryColor, borderRadius: '999px' };
      case 'modern':
        return { ...baseStyle, backgroundColor: primaryColor, borderRadius: '24px' };
      case 'gradient':
        return { 
          ...baseStyle, 
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`, 
          borderRadius: '16px' 
        };
      default:
        return { ...baseStyle, backgroundColor: primaryColor, borderRadius: `${borderRadius}px` };
    }
  };

  // Animation classes
  const getAnimationClass = () => {
    if (isMinimized) return 'animate-bounce';
    switch (buttonAnimation) {
      case 'none': return '';
      case 'pulse': return 'animate-pulse';
      case 'bounce': return 'animate-bounce';
      case 'shake': return 'animate-[shake_1s_ease-in-out_infinite]';
      case 'glow': return 'animate-[glow_2s_ease-in-out_infinite]';
      default: return '';
    }
  };

  // Hover effect classes
  const getHoverClass = () => {
    switch (buttonHoverEffect) {
      case 'none': return '';
      case 'scale': return 'hover:scale-110';
      case 'lift': return 'hover:-translate-y-2';
      case 'glow': return 'hover:shadow-[0_0_30px_rgba(59,130,246,0.6)]';
      case 'rotate': return 'hover:rotate-12';
      default: return '';
    }
  };

  // Badge position classes
  const getBadgePositionClass = () => {
    switch (badgePosition) {
      case 'top-right': return '-top-1 -right-1';
      case 'top-left': return '-top-1 -left-1';
      case 'bottom-right': return '-bottom-1 -right-1';
      case 'bottom-left': return '-bottom-1 -left-1';
      default: return '-top-1 -right-1';
    }
  };

  // Badge animation classes
  const getBadgeAnimationClass = () => {
    switch (badgeAnimation) {
      case 'none': return '';
      case 'pulse': return 'animate-pulse';
      case 'bounce': return 'animate-bounce';
      case 'ping': return 'animate-ping';
      default: return '';
    }
  };

  // Load chat history from localStorage
  const loadChatHistoryFromStorage = (email: string) => {
    const widgetId = widget.id || 'preview';
    const historyKey = `widget_chat_history_${widgetId}_${email}`;
    const storedHistory = localStorage.getItem(historyKey);
    
    if (storedHistory) {
      try {
        const parsedHistory = JSON.parse(storedHistory);
        setChatHistory(parsedHistory.map((h: {id: string, lastMessage: string, timestamp: string | Date, messageCount: number}) => ({
          ...h,
          timestamp: new Date(h.timestamp)
        })));
        console.log(`✅ Loaded ${parsedHistory.length} conversations from localStorage`);
      } catch (err) {
        console.error('Error parsing chat history:', err);
      }
    } else {
      // No history in localStorage, load mock data for preview
      const mockHistory = [
        {
          id: 'conv_1',
          lastMessage: 'What are your business hours?',
          timestamp: new Date(Date.now() - 86400000),
          messageCount: 5
        },
        {
          id: 'conv_2',
          lastMessage: 'I have a question about pricing',
          timestamp: new Date(Date.now() - 172800000),
          messageCount: 8
        }
      ];
      setChatHistory(mockHistory);
      
      // Save mock history to localStorage
      localStorage.setItem(historyKey, JSON.stringify(mockHistory));
    }
  };

  // Save current conversation to history
  const saveConversationToHistory = () => {
    if (!userEmail || messages.length === 0) return;
    
    const widgetId = widget.id || 'preview';
    const historyKey = `widget_chat_history_${widgetId}_${userEmail}`;
    
    const newConversation = {
      id: `conv_${Date.now()}`,
      lastMessage: messages[messages.length - 1].text,
      timestamp: new Date(),
      messageCount: messages.length
    };
    
    // Get existing history
    const storedHistory = localStorage.getItem(historyKey);
    let history = [];
    
    if (storedHistory) {
      try {
        history = JSON.parse(storedHistory);
      } catch (err) {
        console.error('Error parsing history:', err);
      }
    }
    
    // Add new conversation at the beginning
    history.unshift(newConversation);
    
    // Keep only last 20 conversations
    history = history.slice(0, 20);
    
    // Save back to localStorage
    localStorage.setItem(historyKey, JSON.stringify(history));
    setChatHistory(history);
  };

  useEffect(() => {
    if (isOpen && !conversation) {
      // Check if contact form is required
      const requireContactForm = widget.requireContactForm !== undefined ? widget.requireContactForm : true;
      
      if (!requireContactForm && widget.id && widget.businessId) {
        // Skip contact form, create anonymous conversation
        const createAnonymousConversation = async () => {
          const anonymousEmail = `anonymous_${Date.now()}@preview.widget`;
          
          const result = await createChatConversation(
            widget.businessId!,
            widget.id!,
            {
              customerName: 'Preview User',
              customerEmail: anonymousEmail
            }
          );
          
          if (result.success) {
            setConversation(result.data);
        setShowForm(false);
            
            // Subscribe to messages
            subscribeToMessages(result.data.id, (updatedMessages) => {
              console.log('📨 Messages updated (anonymous):', updatedMessages.length);
              setMessages(updatedMessages);
            });
            
            // Send welcome message
            await sendMessage(result.data.id, {
              text: widget.welcomeMessage || 'Welcome! How can we help you today?',
              sender: 'business',
              senderName: 'AI Assistant'
            });
          }
        };
        
        createAnonymousConversation();
      }
    }
  }, [isOpen, widget, conversation]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!widget.id || !widget.businessId) {
      console.error('Widget ID or businessId missing');
      return;
    }
    
    // Save email to localStorage
    const widgetId = widget.id || 'preview';
    const storageKey = `widget_user_email_${widgetId}`;
    localStorage.setItem(storageKey, formData.email);
    setUserEmail(formData.email);
    
    // Load chat history
    loadChatHistoryFromStorage(formData.email);
    
    setSending(true);
    try {
      // Create real conversation in Firestore
      console.log('Creating conversation in preview...', {
        businessId: widget.businessId,
        widgetId: widget.id,
        customerName: formData.name,
        customerEmail: formData.email
      });
      
      const result = await createChatConversation(
        widget.businessId, 
        widget.id, 
        {
          customerName: formData.name,
          customerEmail: formData.email
        }
      );

      if (result.success) {
        console.log('✅ Preview conversation created:', result.data.id);
        setConversation(result.data);
        setShowForm(false);

        // Subscribe to real-time messages
        subscribeToMessages(result.data.id, (updatedMessages) => {
          console.log('📨 Preview messages updated:', updatedMessages.length, updatedMessages);
          setMessages(updatedMessages);
        });

        // Send welcome message
        await sendMessage(result.data.id, {
          text: widget.welcomeMessage || 'Welcome! How can we help you today?',
          sender: 'business',
          senderName: 'AI Assistant'
        });
      } else {
        console.error('Failed to create conversation:', result.error);
        // Fallback to old behavior
    setShowForm(false);
    setMessages([
          { 
            id: `temp-${Date.now()}`,
            conversationId: '',
            text: widget.welcomeMessage || 'Welcome! How can we help you today?', 
            sender: 'business',
            senderName: 'AI Assistant',
            createdAt: Date.now()
          }
        ]);
      }
    } catch (error) {
      console.error('Error creating preview conversation:', error);
      // Fallback to old behavior
      setShowForm(false);
      setMessages([
        { 
          id: `temp-${Date.now()}`,
          conversationId: '',
          text: widget.welcomeMessage || 'Welcome! How can we help you today?', 
          sender: 'business',
          senderName: 'AI Assistant',
          createdAt: Date.now()
        }
      ]);
    } finally {
      setSending(false);
    }
  };

  // Handle handover request
  const handleHandoverRequest = async (skipMessage = false) => {
    if (!conversation) return;
    
    const handoverConfig = widget.customerHandover;
    const handoverMessage = handoverConfig?.handoverMessage || "I'll connect you with a human agent right away. Please wait a moment.";
    
    // Save handover message to Firestore (only if not already sent by AI)
    if (!skipMessage) {
      await sendMessage(conversation.id, {
        text: handoverMessage,
        sender: 'business',
        senderName: 'AI Assistant',
        metadata: {
          handover_requested: true,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    setHandoverRequested(true);
    setHandoverMode('human');
    
    // Request handover in Firestore
    const { requestHandover } = await import('@/app/lib/chat-utils');
    await requestHandover(conversation.id, 'button');
    
    // Add a follow-up message
    setTimeout(async () => {
      await sendMessage(conversation.id, {
        text: "A human agent will be with you shortly. In the meantime, feel free to describe your issue.",
        sender: 'business',
        senderName: 'AI Assistant',
        metadata: {
          handover_info: true
        }
      });
    }, 1000);
  };

  // Check if message contains handover keywords
  const detectHandoverKeywords = (message: string): boolean => {
    const handoverConfig = widget.customerHandover;
    
    if (!handoverConfig?.enabled || !handoverConfig?.autoDetectKeywords) {
      return false;
    }
    
    const keywords = handoverConfig.detectionKeywords || [];
    const lowerMessage = message.toLowerCase();
    
    return keywords.some((keyword: string) => 
      lowerMessage.includes(keyword.toLowerCase())
    );
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !conversation || sending) return;

    const messageText = inputMessage.trim();
    setInputMessage('');
    setSending(true);

    try {
      // Save user message to Firestore
      await sendMessage(conversation.id, {
        text: messageText,
        sender: 'customer',
        senderName: formData.name || 'Preview User'
      });

      // Check for handover keywords
      if (!handoverRequested && detectHandoverKeywords(messageText)) {
        handleHandoverRequest();
        setSending(false);
        return;
      }

      // If handover is active, don't use AI
      if (handoverMode === 'human') {
        // Send human mode message to Firestore
        await sendMessage(conversation.id, {
          text: "Thank you for your message. A human agent has received it and will respond shortly.",
          sender: 'business',
          senderName: 'Support Team',
          metadata: {
            human_mode: true
          }
        });
        setSending(false);
        return;
      }

    // Check if AI is enabled
    const aiConfig = widget.aiConfig;
    if (aiConfig && aiConfig.enabled) {
      setAiThinking(true);
      
      try {
        const aiRequest: AIChatRequest = {
          message: messageText,
          widgetId: widget.id || '',
          conversationId: conversation.id,
          aiConfig: {
            enabled: aiConfig.enabled,
            provider: aiConfig.provider || 'openrouter',
            model: aiConfig.model || 'openai/gpt-5-mini',
            temperature: aiConfig.temperature || 0.7,
            maxTokens: aiConfig.maxTokens || 500,
            confidenceThreshold: aiConfig.confidenceThreshold || 0.6,
            maxRetrievalDocs: aiConfig.maxRetrievalDocs || 5,
            ragEnabled: aiConfig.ragEnabled || false,
            fallbackToHuman: aiConfig.fallbackToHuman !== undefined ? aiConfig.fallbackToHuman : true,
            embeddingProvider: (aiConfig.embeddingProvider as string) || 'openai',
            embeddingModel: (aiConfig.embeddingModel as string) || 'text-embedding-3-large',
            rerankerEnabled: (aiConfig.rerankerEnabled as boolean) !== undefined ? (aiConfig.rerankerEnabled as boolean) : true,
            rerankerModel: (aiConfig.rerankerModel as string) || 'rerank-2.5',
            systemPrompt: aiConfig.systemPrompt || 'support',
            customSystemPrompt: aiConfig.customSystemPrompt || ''
          },
          businessId: widget.businessId || '',
          customerName: formData.name || 'Preview User',
          customerEmail: formData.email || 'preview@example.com',
          customerHandover: widget.customerHandover ? {
            enabled: widget.customerHandover.enabled !== undefined ? !!widget.customerHandover.enabled : false,
            showHandoverButton: widget.customerHandover.showHandoverButton !== undefined ? !!widget.customerHandover.showHandoverButton : false,
            handoverButtonText: widget.customerHandover.handoverButtonText || 'Talk to Human Agent',
            handoverButtonPosition: widget.customerHandover.handoverButtonPosition || 'bottom',
            includeInQuickReplies: widget.customerHandover.includeInQuickReplies !== undefined ? !!widget.customerHandover.includeInQuickReplies : false,
            autoDetectKeywords: widget.customerHandover.autoDetectKeywords !== undefined ? !!widget.customerHandover.autoDetectKeywords : false,
            detectionKeywords: widget.customerHandover.detectionKeywords || [],
            handoverMessage: widget.customerHandover.handoverMessage || "I'll connect you with a human agent.",
            notificationToAgent: widget.customerHandover.notificationToAgent !== undefined ? !!widget.customerHandover.notificationToAgent : false,
            allowCustomerToSwitch: widget.customerHandover.allowCustomerToSwitch !== undefined ? !!widget.customerHandover.allowCustomerToSwitch : false,
            smartFallbackEnabled: widget.customerHandover.smartFallbackEnabled !== undefined ? !!widget.customerHandover.smartFallbackEnabled : true
          } : undefined
        };

        console.log('=== WIDGET PREVIEW AI CHAT DEBUG ===');
        console.log('Request Data:', JSON.stringify(aiRequest, null, 2));
        console.log('====================================');

        const aiResponse = await apiClient.sendAIMessage(aiRequest);
        
        console.log('=== WIDGET PREVIEW AI RESPONSE ===');
        console.log('Response Success:', aiResponse.success);
        console.log('Response Data:', JSON.stringify(aiResponse.data, null, 2));
        console.log('==================================');
        
        if (aiResponse.success && aiResponse.data) {
          const responseData = aiResponse.data;
          
          // Debug confidence check
          console.log('=== CONFIDENCE DEBUG ===');
          console.log('Response Confidence:', responseData.confidence);
          console.log('AI Config Threshold:', aiConfig.confidenceThreshold);
          console.log('Backend shouldFallbackToHuman:', responseData.shouldFallbackToHuman);
          console.log('Backend decided to fallback?', responseData.shouldFallbackToHuman);
          console.log('Handover Confirmed:', responseData.metadata?.handover_confirmed);
          console.log('=======================');
          
          // Always show the actual AI response (backend decides fallback logic)
          console.log('📤 Sending AI response to Firestore...');
          
          // Build metadata object, excluding undefined values
          const metadata: Record<string, unknown> = {
            ai_generated: true,
            confidence: responseData.confidence,
            sources: responseData.sources,
            shouldFallbackToHuman: responseData.shouldFallbackToHuman
          };
          
          // Only add handover_confirmed if it's true (avoid undefined)
          if (responseData.metadata?.handover_confirmed === true) {
            metadata.handover_confirmed = true;
          }
          
          const sendResult = await sendMessage(conversation.id, {
              text: responseData.response, 
            sender: 'business',
            senderName: 'AI Assistant',
            metadata
          });
          console.log('✅ Message sent to Firestore:', sendResult);
          
          if (!sendResult.success) {
            console.error('❌ Failed to send message to Firestore:', sendResult.error);
            // Clear states even on error
            setAiThinking(false);
            setSending(false);
            return;
          }
          
          // Clear AI thinking state after successful message send
          console.log('🔄 Clearing AI thinking state...');
          setAiThinking(false);
          
          // If handover was confirmed by affirmative response, trigger handover
          if (responseData.metadata?.handover_confirmed === true) {
            console.log('🔄 Auto-triggering handover after affirmative response');
            // Skip message since AI already sent confirmation
            // Don't await - let it run in background to avoid blocking UI
            handleHandoverRequest(true).catch(err => {
              console.error('Error triggering handover:', err);
            });
          }
        } else {
          // AI failed, save fallback message to Firestore
          console.log('❌ AI response failed, sending fallback message');
          await sendMessage(conversation.id, {
              text: "I'm having trouble processing your request. Let me connect you with a human agent.", 
            sender: 'business',
            senderName: 'AI Assistant',
              metadata: {
                ai_generated: true,
                fallback_message: true,
                error: aiResponse.error
              }
          });
          console.log('✅ Fallback message sent');
          setAiThinking(false);
        }
      } catch (aiError) {
        console.error('❌ AI response error:', aiError);
        
        // Save fallback message to Firestore
        await sendMessage(conversation.id, {
            text: "I'm having trouble processing your request. Let me connect you with a human agent.", 
          sender: 'business',
          senderName: 'AI Assistant',
            metadata: {
              ai_generated: true,
              fallback_message: true,
              error: 'AI service unavailable'
            }
        });
        console.log('✅ Error fallback message sent');
        setAiThinking(false);
      } finally {
        console.log('🏁 Finally block - ensuring states are cleared');
        setAiThinking(false);
        setSending(false);
      }
    } else {
      // No AI enabled, save default auto-reply to Firestore
      await sendMessage(conversation.id, {
        text: widget.autoReply || 'Thanks for your message! We will get back to you shortly.',
        sender: 'business',
        senderName: 'Support Team'
      });
      setSending(false);
    }
    } catch (error) {
      console.error('Error sending message in preview:', error);
      setSending(false);
    }
  };


  return (
    <>
      {/* Modern Premium Styles */}
      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
          50% { box-shadow: 0 0 30px rgba(59, 130, 246, 0.6); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        @keyframes pulse-soft {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        .glass-morphism {
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .premium-shadow {
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04);
        }
        .premium-shadow-lg {
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12), 0 8px 24px rgba(0, 0, 0, 0.08);
        }
        .gradient-border {
          background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
          border: 1px solid rgba(255,255,255,0.2);
        }
      `}</style>

      {/* Modern Chat Button */}
      <div className="relative group">
        <button
          onClick={() => {
            if (isMinimized) {
              setIsMinimized(false);
            } else {
              setIsOpen(!isOpen);
            }
          }}
          className={`fixed ${position === 'bottom-right' ? 'bottom-6 right-6' : 'bottom-6 left-6'} premium-shadow-lg ${getHoverClass()} ${getAnimationClass()} transition-all duration-500 ease-out z-[9998] flex items-center justify-center group-hover:scale-105 hover:premium-shadow-lg`}
          style={{
            ...getButtonStyle(),
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
            border: 'none',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          title={showButtonTooltip ? buttonTooltip : ''}
        >
          {iconType === 'custom' && customIcon ? (
            <Image src={customIcon} alt="Chat" width={24} height={24} className="w-6 h-6" unoptimized />
          ) : (
            <MessageCircle className="w-6 h-6 text-white" />
          )}
          
          {/* Notification Badge */}
          {showBadge && (
            <span 
              className={`absolute ${getBadgePositionClass()} ${getBadgeAnimationClass()} flex items-center justify-center text-white text-xs font-bold border-2 border-white`}
              style={{ 
                backgroundColor: badgeColor,
                minWidth: badgeCount > 0 ? '20px' : '12px',
                height: badgeCount > 0 ? '20px' : '12px',
                borderRadius: badgeCount > 0 ? '10px' : '50%',
                padding: badgeCount > 0 ? '0 6px' : '0'
              }}
            >
              {badgeCount > 0 ? (badgeCount > 99 ? '99+' : badgeCount) : ''}
            </span>
          )}
          
          {/* Online Status Dot */}
          {showOnlineDot && !showBadge && (
            <span 
              className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white animate-pulse"
              style={{ backgroundColor: onlineDotColor }}
            />
          )}
          
          {/* Minimized indicator (overrides other badges) */}
          {isMinimized && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
          )}
        </button>
        
        {/* Tooltip */}
        {showButtonTooltip && !isOpen && (
          <div className={`fixed ${position === 'bottom-right' ? 'bottom-20 right-6' : 'bottom-20 left-6'} opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg whitespace-nowrap z-[9997] pointer-events-none`}>
            {buttonTooltip}
            <div className={`absolute ${position === 'bottom-right' ? 'right-6' : 'left-6'} -bottom-1 w-2 h-2 bg-gray-900 transform rotate-45`}></div>
          </div>
        )}
      </div>

      {/* Chat Window - Positioned at corner like real widget */}
      {isOpen && !isMinimized && (
        <>
          {/* Clean Backdrop */}
          <div 
            className="fixed inset-0 bg-transparent z-[9999] animate-in fade-in duration-300"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modern Chat Widget */}
          <div
            className={`fixed ${position === 'bottom-right' ? 'bottom-6 right-6' : 'bottom-6 left-6'} glass-morphism premium-shadow-lg flex flex-col z-[10000] animate-in slide-in-from-bottom-5 duration-500 ease-out overflow-hidden`}
            style={{ 
              width: viewMode === 'mobile' ? Math.min(parseInt(dimensions.width), 380) : Math.min(parseInt(dimensions.width), 420),
              height: viewMode === 'mobile' ? Math.min(parseInt(dimensions.height), 600) : parseInt(dimensions.height),
              maxHeight: 'calc(100vh - 120px)',
              maxWidth: 'calc(100vw - 48px)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            {/* Modern Header */}
            <div
              className="px-4 py-3 flex items-center justify-between flex-shrink-0 relative overflow-hidden"
              style={{ 
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
                color: textColor,
                borderTopLeftRadius: '20px',
                borderTopRightRadius: '20px'
              }}
            >
              {/* Subtle pattern overlay */}
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.3) 1px, transparent 1px)`,
                backgroundSize: '20px 20px'
              }} />
              <div className="flex items-center gap-3 min-w-0 relative z-10">
                {/* Back Button - Shows in Chat History View */}
                {showChatHistory && (
                  <button
                    onClick={() => setShowChatHistory(false)}
                    className="p-2 hover:bg-white/20 rounded-full transition-all duration-200 flex-shrink-0 group"
                    title="Back to Chat"
                  >
                    <ChevronLeft className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  </button>
                )}
                
                {/* Back Button - Shows in Chat View */}
                {!showForm && !showChatHistory && (
                  <button
                    onClick={() => {
                      // Save conversation before going back
                      saveConversationToHistory();
                      // Reset to form
                      setShowForm(true);
                      setMessages([]);
                    }}
                    className="p-2 hover:bg-white/20 rounded-full transition-all duration-200 flex-shrink-0 group"
                    title="Back to Start"
                  >
                    <ChevronLeft className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  </button>
                )}
                
                {/* Modern Widget Icon */}
                <div className="flex-shrink-0 p-1.5 bg-white/20 rounded-full backdrop-blur-sm">
                  {iconType === 'custom' && customIcon ? (
                    <Image src={customIcon} alt="" width={16} height={16} className="w-4 h-4 rounded-full" unoptimized />
                  ) : (
                    <MessageCircle className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-base truncate tracking-tight">
                    {showChatHistory ? 'Your Conversations' : widget.name || 'Chat Support'}
                  </h3>
                  <p className="text-xs opacity-90 truncate font-medium">
                    {showChatHistory 
                      ? `${chatHistory.length} conversation${chatHistory.length !== 1 ? 's' : ''}`
                      : headerSubtitle
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0 relative z-10">
                {!showForm && !showChatHistory && userEmail && (
                  <button
                    onClick={() => {
                      setShowChatHistory(true);
                      // Refresh history when opening
                      loadChatHistoryFromStorage(userEmail);
                    }}
                    className="p-2 hover:bg-white/20 rounded-full transition-all duration-200 group"
                    title="Chat History"
                  >
                    <History className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  </button>
                )}
                <button
                  onClick={() => {
                    setIsMinimized(true);
                    // Save conversation before minimizing
                    saveConversationToHistory();
                  }}
                  className="p-2 hover:bg-white/20 rounded-full transition-all duration-200 group"
                  title="Minimize"
                >
                  <Minimize2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </button>
                <button
                  onClick={() => {
                    // Save conversation before closing
                    saveConversationToHistory();
                    setIsOpen(false);
                  }}
                  className="p-2 hover:bg-white/20 rounded-full transition-all duration-200 group"
                  title="Close"
                >
                  <X className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </div>

            {/* Content */}
            {showChatHistory ? (
              /* Chat History View */
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {/* User Info Badge */}
                  {userEmail && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-blue-600" />
                          <div>
                            <p className="text-xs text-blue-800 font-semibold">{formData.name || 'User'}</p>
                            <p className="text-xs text-blue-600">{userEmail}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const widgetId = widget.id || 'preview';
                            const storageKey = `widget_user_email_${widgetId}`;
                            localStorage.removeItem(storageKey);
                            setUserEmail('');
                            setFormData({ name: '', email: '', phone: '' });
                            setShowChatHistory(false);
                            setShowForm(true);
                            setMessages([]);
                            setChatHistory([]);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 underline"
                        >
                          Change User
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {chatHistory.length === 0 ? (
                    <div className="text-center py-12">
                      <History className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500 text-sm font-medium">No chat history yet</p>
                      <p className="text-gray-400 text-xs mt-1">Start a new conversation to see it here</p>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={async () => {
                          setShowChatHistory(false);
                          
                          // Create a new conversation in Firestore
                          if (widget.id && widget.businessId) {
                            const result = await createChatConversation(
                              widget.businessId,
                              widget.id,
                              {
                                customerName: formData.name,
                                customerEmail: formData.email
                              }
                            );
                            
                            if (result.success) {
                              setConversation(result.data);
                              setMessages([]);
                              
                              // Subscribe to messages
                              subscribeToMessages(result.data.id, (updatedMessages) => {
                                console.log('📨 Messages updated (new conv):', updatedMessages.length);
                                setMessages(updatedMessages);
                              });
                              
                              // Send welcome message
                              await sendMessage(result.data.id, {
                                text: widget.welcomeMessage || 'Welcome! How can we help you today?',
                                sender: 'business',
                                senderName: 'AI Assistant'
                              });
                            }
                          }
                        }}
                        className="w-full p-3 border-2 border-dashed rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all text-left"
                        style={{ borderColor: primaryColor }}
                      >
                        <div className="flex items-center gap-2">
                          <Plus className="w-4 h-4" style={{ color: primaryColor }} />
                          <span className="font-medium" style={{ color: primaryColor }}>Start New Conversation</span>
                        </div>
                      </button>
                      
                      {chatHistory.map((chat) => (
                        <button
                          key={chat.id}
                          onClick={async () => {
                            setShowChatHistory(false);
                            // In preview mode, chat history from localStorage doesn't have real conversation IDs
                            // So we just create a new conversation when clicking on history
                            if (widget.id && widget.businessId) {
                              const result = await createChatConversation(
                                widget.businessId,
                                widget.id,
                                {
                                  customerName: formData.name,
                                  customerEmail: formData.email
                                }
                              );
                              
                              if (result.success) {
                                setConversation(result.data);
                                subscribeToMessages(result.data.id, (updatedMessages) => {
                                  console.log('📨 Messages updated (history):', updatedMessages.length);
                                  setMessages(updatedMessages);
                                });
                              }
                            }
                          }}
                          className="w-full p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                              <MessageCircle className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{chat.lastMessage}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-500">
                                  {chat.messageCount} messages
                                </span>
                                <span className="text-xs text-gray-400">•</span>
                                <span className="text-xs text-gray-500">
                                  {new Date(chat.timestamp).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </div>
            ) : showForm ? (
            <form onSubmit={handleFormSubmit} className="flex-1 p-4 space-y-4 overflow-y-auto">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                  Start a Conversation
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed">
                  We&apos;re here to help! Please provide your information to get started.
                </p>
              </div>
              
              <div className="space-y-3">
              {(widget.collectName !== false) && (
                <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1">
                      Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-gray-50/50 backdrop-blur-sm"
                      placeholder="Enter your full name"
                    required
                  />
                </div>
              )}

              {widget.collectEmail && (
                <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1">
                      Email Address *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-gray-50/50 backdrop-blur-sm"
                      placeholder="Enter your email address"
                    required
                  />
                </div>
              )}

              {widget.collectPhone && (
                <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1">
                      Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-gray-50/50 backdrop-blur-sm"
                      placeholder="Enter your phone number"
                  />
                </div>
              )}
              </div>

              {/* Custom Fields */}
              {widget.customFields && widget.customFields.length > 0 && (
                <>
                  {widget.customFields.map((field, index: number) => (
                    <div key={field.id || index}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label || `Field ${index + 1}`} {field.required && '*'}
                      </label>
                      <input
                        type={field.type || 'text'}
                        placeholder={field.placeholder || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required={field.required}
                      />
                    </div>
                  ))}
                </>
              )}

              <button
                type="submit"
                className="w-full py-3 px-4 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
                style={{ 
                  background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
                  boxShadow: `0 4px 16px ${primaryColor}40`
                }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  {widget.buttonText || 'Start Conversation'}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </button>
            </form>
            ) : (
            <>
              {/* Handover Button - Top Position */}
              {!showForm && widget.customerHandover?.enabled && 
               widget.customerHandover?.showHandoverButton && 
               widget.customerHandover?.handoverButtonPosition === 'top' && 
               !handoverRequested && (
                <div className="px-3 py-1.5 border-b border-gray-100 bg-gray-50">
                  <button
                    onClick={() => handleHandoverRequest()}
                    className="w-full py-1.5 px-2.5 text-xs font-medium rounded-md border transition-all hover:shadow-sm flex items-center justify-center gap-1.5"
                    style={{ 
                      borderColor: primaryColor,
                      color: primaryColor 
                    }}
                  >
                    <User className="w-3 h-3" />
                    <span className="truncate">
                      {widget.customerHandover?.handoverButtonText || 'Talk to Human Agent'}
                    </span>
                  </button>
                </div>
              )}

              {/* Mode Indicator */}
              {!showForm && handoverMode === 'human' && (
                <div className="px-4 py-2 border-b border-emerald-100 bg-emerald-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-emerald-900">Human Agent Mode</span>
                    </div>
                    {widget.customerHandover?.allowCustomerToSwitch && (
                      <button
                        onClick={async () => {
                          if (!conversation) return;
                          
                          setHandoverMode('ai');
                          setHandoverRequested(false);
                          
                          // Clear handover in Firestore
                          const { clearHandover } = await import('@/app/lib/chat-utils');
                          await clearHandover(conversation.id);
                          
                          // Send message to Firestore
                          await sendMessage(conversation.id, {
                            text: "You're now back to AI mode. How can I help you?",
                            sender: 'business',
                            senderName: 'AI Assistant'
                          });
                        }}
                        className="text-xs text-emerald-700 hover:text-emerald-900 underline"
                      >
                        Back to AI
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Modern Messages Area */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 relative bg-gradient-to-b from-gray-50/30 to-white/50">
                {/* Handover Button - Floating Position */}
                {!showForm && widget.customerHandover?.enabled && 
                 widget.customerHandover?.showHandoverButton && 
                 widget.customerHandover?.handoverButtonPosition === 'floating' && 
                 !handoverRequested && (
                  <button
                    onClick={() => handleHandoverRequest()}
                    className="absolute top-3 right-3 z-10 py-1.5 px-2.5 text-xs font-medium rounded-full border shadow-md transition-all hover:shadow-lg flex items-center gap-1 bg-white/95 backdrop-blur-sm"
                    style={{ 
                      borderColor: primaryColor,
                      color: primaryColor 
                    }}
                  >
                    <User className="w-3 h-3" />
                    <span className="hidden sm:inline text-xs">
                      Human
                    </span>
                  </button>
                )}

                {messages.map((msg, idx) => (
                  <div
                    key={msg.id || idx}
                    className={`flex items-end gap-2 w-full ${
                      msg.sender === 'customer' 
                        ? 'justify-end' 
                        : 'justify-start'
                    }`}
                  >
                    {msg.sender === 'customer' ? (
                      // Customer message - right aligned with branded color background
                      <>
                        <div
                          className="max-w-[80%] px-4 py-2.5 rounded-2xl shadow-md relative overflow-hidden group"
                          style={{ 
                            backgroundColor: primaryColor,
                            borderRadius: '18px 18px 4px 18px'
                          }}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed text-white">
                            {msg.text}
                          </p>
                          
                          {/* Timestamp */}
                          <p className="text-xs mt-1 text-right text-white/70">
                            {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </p>
                        </div>
                        
                        {/* Customer Avatar - Rightmost position */}
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold shadow-sm"
                          style={{ backgroundColor: primaryColor }}
                        >
                          {getInitials(formData.name || 'User')}
                        </div>
                      </>
                    ) : (
                      // Business/Bot message - left aligned with gray background
                      <>
                        {/* Business Avatar - Leftmost position */}
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-300 shadow-sm">
                          <Bot className="w-4 h-4 text-gray-700" />
                        </div>
                        
                        <div className="max-w-[80%] px-4 py-2.5 rounded-2xl shadow-sm border bg-gray-100 border-gray-200 relative overflow-hidden group" style={{ 
                          borderRadius: '18px 18px 18px 4px'
                        }}>
                          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed text-gray-700">
                            {msg.text}
                          </p>
                      
                      {/* AI Response Metadata */}
                      {msg.metadata?.ai_generated === true && (
                            <div className="mt-1.5 pt-1.5 border-t border-gray-300">
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <Bot className="w-3 h-3" />
                                <span>AI</span>
                              {typeof msg.metadata.confidence === 'number' && (
                                  <span className="text-gray-500">
                                    • {Math.round(msg.metadata.confidence * 100)}%
                                  </span>
                                )}
                          </div>
                        </div>
                      )}
                          
                          {/* Timestamp */}
                          <p className="text-xs mt-1 text-gray-500">
                            {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </p>
                    </div>
                      </>
                    )}
                  </div>
                ))}

                {/* Quick Reply Buttons */}
                {messages.length === 1 && quickReplies.filter((r: string) => r.trim()).length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {/* Add handover option to quick replies if enabled */}
                    {widget.customerHandover?.enabled && 
                     widget.customerHandover?.includeInQuickReplies && 
                     !handoverRequested && (
                      <button
                        onClick={() => handleHandoverRequest()}
                        className="px-2.5 py-1 text-xs border rounded-md transition-all flex items-center gap-1"
                        style={{ 
                          borderColor: '#10B981',
                          color: '#10B981',
                          backgroundColor: 'rgba(16, 185, 129, 0.05)'
                        }}
                      >
                        <User className="w-3 h-3" />
                        Human
                      </button>
                    )}
                    
                    {quickReplies.filter((r: string) => r.trim()).map((reply: string, idx: number) => (
                      <button
                        key={idx}
                        onClick={async () => {
                          if (!conversation) return;
                          
                          // Save user message to Firestore
                          await sendMessage(conversation.id, {
                            text: reply,
                            sender: 'customer',
                            senderName: formData.name || 'Preview User'
                          });
                          
                          // Use AI if enabled, otherwise fallback to auto-reply
                          const aiConfig = widget.aiConfig;
                          if (aiConfig && aiConfig.enabled) {
                            setAiThinking(true);
                            
                            try {
                              const aiRequest: AIChatRequest = {
                                message: reply,
                                widgetId: widget.id || '',
                                conversationId: conversation.id,
                                aiConfig: {
                                  enabled: aiConfig.enabled,
                                  provider: aiConfig.provider || 'openrouter',
                                  model: aiConfig.model || 'deepseek/deepseek-chat-v3.1:free',
                                  temperature: aiConfig.temperature || 0.7,
                                  maxTokens: aiConfig.maxTokens || 500,
                                  confidenceThreshold: aiConfig.confidenceThreshold || 0.6,
                                  maxRetrievalDocs: aiConfig.maxRetrievalDocs || 5,
                                  ragEnabled: aiConfig.ragEnabled || false,
                                  fallbackToHuman: aiConfig.fallbackToHuman !== undefined ? aiConfig.fallbackToHuman : true,
                                  embeddingProvider: (aiConfig.embeddingProvider as string) || 'openai',
                                  embeddingModel: (aiConfig.embeddingModel as string) || 'text-embedding-3-large',
                                  rerankerEnabled: (aiConfig.rerankerEnabled as boolean) !== undefined ? (aiConfig.rerankerEnabled as boolean) : true,
                                  rerankerModel: (aiConfig.rerankerModel as string) || 'rerank-2.5',
                                  systemPrompt: aiConfig.systemPrompt || 'support',
                                  customSystemPrompt: aiConfig.customSystemPrompt || ''
                                },
                                businessId: widget.businessId || '',
                                customerName: formData.name || 'Preview User',
                                customerEmail: formData.email || 'preview@example.com',
                                customerHandover: widget.customerHandover ? {
                                  enabled: widget.customerHandover.enabled !== undefined ? !!widget.customerHandover.enabled : false,
                                  showHandoverButton: widget.customerHandover.showHandoverButton !== undefined ? !!widget.customerHandover.showHandoverButton : false,
                                  handoverButtonText: widget.customerHandover.handoverButtonText || 'Talk to Human Agent',
                                  handoverButtonPosition: widget.customerHandover.handoverButtonPosition || 'bottom',
                                  includeInQuickReplies: widget.customerHandover.includeInQuickReplies !== undefined ? !!widget.customerHandover.includeInQuickReplies : false,
                                  autoDetectKeywords: widget.customerHandover.autoDetectKeywords !== undefined ? !!widget.customerHandover.autoDetectKeywords : false,
                                  detectionKeywords: widget.customerHandover.detectionKeywords || [],
                                  handoverMessage: widget.customerHandover.handoverMessage || "I'll connect you with a human agent.",
                                  notificationToAgent: widget.customerHandover.notificationToAgent !== undefined ? !!widget.customerHandover.notificationToAgent : false,
                                  allowCustomerToSwitch: widget.customerHandover.allowCustomerToSwitch !== undefined ? !!widget.customerHandover.allowCustomerToSwitch : false,
                                  smartFallbackEnabled: widget.customerHandover.smartFallbackEnabled !== undefined ? !!widget.customerHandover.smartFallbackEnabled : true
                                } : undefined
                              };

                              const aiResponse = await apiClient.sendAIMessage(aiRequest);
                              
                              if (aiResponse.success && aiResponse.data) {
                                const responseData = aiResponse.data;
                                
                                // Always show the actual AI response
                                console.log('📤 Sending AI response (quick reply) to Firestore...');
                                
                                // Build metadata object, excluding undefined values
                                const quickReplyMetadata: Record<string, unknown> = {
                                  ai_generated: true,
                                  confidence: responseData.confidence,
                                  sources: responseData.sources,
                                  shouldFallbackToHuman: responseData.shouldFallbackToHuman
                                };
                                
                                // Only add handover_confirmed if it's true (avoid undefined)
                                if (responseData.metadata?.handover_confirmed === true) {
                                  quickReplyMetadata.handover_confirmed = true;
                                }
                                
                                const sendResult = await sendMessage(conversation.id, {
                                    text: responseData.response, 
                                  sender: 'business',
                                  senderName: 'AI Assistant',
                                  metadata: quickReplyMetadata
                                });
                                console.log('✅ Quick reply message sent:', sendResult);
                                
                                if (sendResult.success) {
                                  setAiThinking(false);
                                } else {
                                  console.error('❌ Failed to send quick reply message:', sendResult.error);
                                  setAiThinking(false);
                                }
                                
                                // If handover was confirmed by affirmative response, trigger handover
                                if (responseData.metadata?.handover_confirmed === true) {
                                  console.log('🔄 Auto-triggering handover after affirmative response (quick reply)');
                                  // Skip message since AI already sent confirmation
                                  // Don't await - let it run in background to avoid blocking UI
                                  handleHandoverRequest(true).catch(err => {
                                    console.error('Error triggering handover:', err);
                                  });
                                }
                              } else {
                                console.log('❌ Quick reply AI failed, sending auto-reply');
                                await sendMessage(conversation.id, {
                                    text: widget.autoReply || 'Thanks for your message!', 
                                  sender: 'business',
                                  senderName: 'AI Assistant',
                                    metadata: { ai_generated: true, fallback_message: true }
                                });
                                setAiThinking(false);
                              }
                            } catch (error) {
                              console.error('❌ Quick reply AI error:', error);
                              await sendMessage(conversation.id, {
                                  text: widget.autoReply || 'Thanks for your message!', 
                                sender: 'business',
                                senderName: 'AI Assistant',
                                  metadata: { ai_generated: true, fallback_message: true }
                              });
                              console.log('✅ Error auto-reply sent (quick reply)');
                              setAiThinking(false);
                            } finally {
                              console.log('🏁 Finally block (quick reply) - ensuring state cleared');
                              setAiThinking(false);
                            }
                          } else {
                            // No AI enabled, save default auto-reply to Firestore
                            await sendMessage(conversation.id, {
                              text: widget.autoReply || 'Thanks for your message!',
                              sender: 'business',
                              senderName: 'Support Team'
                            });
                          }
                        }}
                        className="px-3 py-1.5 text-sm border-2 rounded-lg hover:shadow-md transition-all"
                        style={{ 
                          borderColor: primaryColor, 
                          color: primaryColor 
                        }}
                        disabled={aiThinking}
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                )}
                
                {/* AI Thinking Indicator */}
                {aiThinking && (
                  <div className="flex items-end gap-2 justify-start">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-300 shadow-sm">
                      <Bot className="w-4 h-4 text-gray-700" />
                    </div>
                    <div className="max-w-[80%] px-4 py-2.5 rounded-2xl shadow-sm border bg-gray-100 border-gray-200" style={{ 
                      borderRadius: '18px 18px 18px 4px' 
                    }}>
                      <div className="flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                        <span className="text-sm text-gray-700">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Handover Button - Bottom Position */}
              {!showForm && widget.customerHandover?.enabled && 
               widget.customerHandover?.showHandoverButton && 
               widget.customerHandover?.handoverButtonPosition === 'bottom' && 
               !handoverRequested && (
                <div className="px-3 pt-1.5 pb-1.5 border-t border-gray-100 bg-gray-50">
                  <button
                    onClick={() => handleHandoverRequest()}
                    className="w-full py-1.5 px-2.5 text-xs font-medium rounded-md border transition-all hover:shadow-sm flex items-center justify-center gap-1.5"
                    style={{ 
                      borderColor: primaryColor,
                      color: primaryColor 
                    }}
                  >
                    <User className="w-3 h-3" />
                    <span className="truncate">
                      {widget.customerHandover?.handoverButtonText || 'Talk to Human Agent'}
                    </span>
                  </button>
                </div>
              )}

              {/* Modern Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200/60 bg-white/80 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={widget.placeholderText || 'Type your message...'}
                      className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm bg-white/90 backdrop-blur-sm transition-all duration-200 placeholder-gray-500 font-medium"
                      disabled={sending || aiThinking}
                  />
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 focus-within:opacity-100 transition-opacity duration-200 pointer-events-none" />
                  </div>
                  <button
                    type="submit"
                    disabled={sending || aiThinking || !inputMessage.trim()}
                    className="p-3 text-white rounded-2xl hover:shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:transform-none relative overflow-hidden group"
                    style={{ 
                      background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
                      boxShadow: `0 4px 16px ${primaryColor}40`
                    }}
                  >
                    {sending || aiThinking ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  </button>
                </div>
              </form>

              {/* Modern Branding */}
              {showBranding && (
                <div className="px-4 py-2 border-t border-gray-200/60 bg-gradient-to-r from-gray-50/50 to-white/50 backdrop-blur-sm">
                  <p className="text-xs text-center text-gray-500 font-medium">
                    Powered by <span className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Rexa AI</span>
                  </p>
                </div>
              )}
            </>
            )}
          </div>
        </>
      )}
    </>
  );
}


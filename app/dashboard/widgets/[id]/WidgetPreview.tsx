'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  ChatWidget,
  ChatConversation,
  ChatMessage,
  createChatConversation,
  sendMessage,
  subscribeToMessages,
  requestHandover,
  clearHandover
} from '@/app/lib/chat-utils';
import { X, Send, MessageCircle, Minimize2, User, Bot, Loader2, History, ChevronLeft, Plus } from 'lucide-react';
import { apiClient, AIChatRequest } from '@/app/lib/api-client';

// Types
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
  mobileLayout?: 'shrinked' | 'expanded' | 'fullscreen';
  mobileFullScreen?: boolean;
  collectName?: boolean;
  customFields?: Array<{ id: string, label: string, type: string, required: boolean, placeholder?: string }>;
  aiConfig?: {
    enabled: boolean;
    provider?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    confidenceThreshold?: number;
    maxRetrievalDocs?: number;
    ragEnabled?: boolean;
    fallbackToHuman?: boolean;
    embeddingProvider?: string;
    embeddingModel?: string;
    rerankerEnabled?: boolean;
    rerankerModel?: string;
    systemPrompt?: string;
    customSystemPrompt?: string;
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
    notificationToAgent?: boolean;
    smartFallbackEnabled?: boolean;
    [key: string]: unknown;
  };
};

interface WidgetPreviewProps {
  widget: ExtendedWidget;
  viewMode: 'desktop' | 'mobile';
}

interface ChatButtonProps {
  isOpen: boolean;
  isMinimized: boolean;
  onClick: () => void;
  style: React.CSSProperties;
  animation: string;
  hover: string;
  iconType: string;
  customIcon: string;
  showTooltip: boolean;
  tooltip: string;
  showBadge: boolean;
  badgeCount: number;
  badgeColor: string;
  badgePosition: string;
  badgeAnimation: string;
  showOnlineDot: boolean;
  onlineDotColor: string;
  position: string;
  viewMode: 'desktop' | 'mobile';
}

interface ChatHeaderProps {
  widget: ExtendedWidget;
  textColor: string;
  showChatHistory: boolean;
  showForm: boolean;
  userEmail: string;
  chatHistory: Array<{ id: string; lastMessage: string; timestamp: Date; messageCount: number }>;
  onBack: () => void;
  onHistory: () => void;
  onClose: () => void;
  onExpand: () => void;
  onCollapse: () => void;
  isExpanded: boolean;
  iconType: string;
  customIcon: string;
  headerSubtitle: string;
  viewMode: 'desktop' | 'mobile';
  primaryColor: string;
}

interface ContactFormProps {
  widget: ExtendedWidget;
  formData: { name: string; email: string; phone: string;[key: string]: unknown };
  setFormData: React.Dispatch<React.SetStateAction<{ name: string; email: string; phone: string;[key: string]: unknown }>>;
  onSubmit: (e: React.FormEvent) => void;
  sending: boolean;
  primaryColor: string;
  viewMode: 'desktop' | 'mobile';
}

interface MessageBubbleProps {
  msg: ChatMessage;
  isCustomer: boolean;
  primaryColor: string;
  formData: { name: string; email: string; phone: string;[key: string]: unknown };
}

// Constants
const SIZE_MAP = {
  compact: { width: '360px', height: '480px' },
  standard: { width: '400px', height: '550px' },
  large: { width: '450px', height: '650px' }
};

const BUTTON_SIZE_MAP = {
  small: '48px',
  medium: '56px',
  large: '64px',
  xl: '72px'
};

// Utility Functions
const getInitials = (name: string) => {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase();
};

const getStorageKey = (widgetId: string, suffix: string) =>
  `widget_${suffix}_${widgetId}`;

// Custom Hooks
const useWidgetStorage = (widgetId: string) => {
  const [userEmail, setUserEmail] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{
    id: string;
    lastMessage: string;
    timestamp: Date;
    messageCount: number;
  }>>([]);

  const loadHistory = useCallback((email: string) => {
    const historyKey = getStorageKey(widgetId, `chat_history_${email}`);
    const stored = localStorage.getItem(historyKey);

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setChatHistory(parsed.map((h: { timestamp: string;[key: string]: unknown }) => ({
          ...h,
          timestamp: new Date(h.timestamp)
        })));
      } catch (err) {
        console.error('Error parsing chat history:', err);
      }
    } else {
      // Mock data for preview
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
      localStorage.setItem(historyKey, JSON.stringify(mockHistory));
    }
  }, [widgetId]);

  useEffect(() => {
    const emailKey = getStorageKey(widgetId, 'user_email');
    const storedEmail = localStorage.getItem(emailKey);

    if (storedEmail) {
      setUserEmail(storedEmail);
      loadHistory(storedEmail);
    }
  }, [widgetId, loadHistory]);

  const saveConversation = (email: string, messages: ChatMessage[]) => {
    if (!email || messages.length === 0) return;

    const historyKey = getStorageKey(widgetId, `chat_history_${email}`);
    const newConv = {
      id: `conv_${Date.now()}`,
      lastMessage: messages[messages.length - 1].text,
      timestamp: new Date(),
      messageCount: messages.length
    };

    const stored = localStorage.getItem(historyKey);
    let history = stored ? JSON.parse(stored) : [];
    history.unshift(newConv);
    history = history.slice(0, 20);

    localStorage.setItem(historyKey, JSON.stringify(history));
    setChatHistory(history);
  };

  const saveEmail = (email: string) => {
    const emailKey = getStorageKey(widgetId, 'user_email');
    localStorage.setItem(emailKey, email);
    setUserEmail(email);
    loadHistory(email);
  };

  const clearEmail = () => {
    const emailKey = getStorageKey(widgetId, 'user_email');
    localStorage.removeItem(emailKey);
    setUserEmail('');
    setChatHistory([]);
  };

  return { userEmail, chatHistory, saveEmail, clearEmail, saveConversation };
};

// Sub-components
const ChatButton = ({
  isOpen,
  isMinimized,
  onClick,
  style,
  animation,
  hover,
  iconType,
  customIcon,
  showTooltip,
  tooltip,
  showBadge,
  badgeCount,
  badgeColor,
  badgePosition,
  badgeAnimation,
  showOnlineDot,
  onlineDotColor,
  position,
  viewMode
}: ChatButtonProps) => (
  <div className="relative group">
    <button
      onClick={onClick}
      className={`fixed ${position === 'bottom-right' ? 'bottom-4 right-4 sm:bottom-6 sm:right-6' : 'bottom-4 left-4 sm:bottom-6 sm:left-6'} premium-shadow-lg ${hover} ${animation} transition-all duration-500 z-[9998] flex items-center justify-center group-hover:scale-105`}
      style={style}
      title={showTooltip ? tooltip : ''}
    >
      {iconType === 'custom' && customIcon ? (
        <Image src={customIcon} alt="Chat" width={viewMode === 'mobile' ? 28 : 24} height={viewMode === 'mobile' ? 28 : 24} unoptimized />
      ) : (
        <MessageCircle className={viewMode === 'mobile' ? 'w-7 h-7 text-white' : 'w-6 h-6 text-white'} />
      )}

      {showBadge && (
        <span
          className={`absolute ${badgePosition} ${badgeAnimation} flex items-center justify-center text-white text-xs font-bold border-2 border-white`}
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

      {showOnlineDot && !showBadge && (
        <span
          className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white animate-pulse"
          style={{ backgroundColor: onlineDotColor }}
        />
      )}

      {isMinimized && (
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
      )}
    </button>

    {showTooltip && !isOpen && (
      <div className={`fixed ${position === 'bottom-right' ? 'bottom-16 right-4 sm:bottom-20 sm:right-6' : 'bottom-16 left-4 sm:bottom-20 sm:left-6'} opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg shadow-lg whitespace-nowrap z-[9997] pointer-events-none`}>
        {tooltip}
      </div>
    )}
  </div>
);

const ChatHeader = ({
  widget,
  textColor,
  showChatHistory,
  showForm,
  userEmail,
  chatHistory,
  onBack,
  onHistory,
  onClose,
  onExpand,
  onCollapse,
  isExpanded,
  iconType,
  customIcon,
  headerSubtitle,
  viewMode,
  primaryColor
}: ChatHeaderProps) => (
  <div
    className={`${viewMode === 'mobile' ? 'px-4 py-3' : 'px-4 py-3'} flex items-center justify-between flex-shrink-0 relative overflow-hidden`}
    style={{
      background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
      color: textColor,
      borderTopLeftRadius: (viewMode === 'mobile' || isExpanded) ? '0px' : '20px',
      borderTopRightRadius: (viewMode === 'mobile' || isExpanded) ? '0px' : '20px',
      ...(viewMode === 'mobile' && {
        width: '100%',
        margin: '0',
        padding: '12px 16px',
        // Mobile header styling based on layout
        ...(widget.mobileLayout === 'fullscreen' ? {
          borderRadius: '0px',
          borderTopLeftRadius: '0px',
          borderTopRightRadius: '0px',
          borderBottomLeftRadius: '0px',
          borderBottomRightRadius: '0px'
        } : widget.mobileLayout === 'expanded' ? {
          borderRadius: '16px',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
          borderBottomLeftRadius: '0px',
          borderBottomRightRadius: '0px'
        } : {
          borderRadius: '20px',
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
          borderBottomLeftRadius: '0px',
          borderBottomRightRadius: '0px'
        })
      }),
      ...(isExpanded && viewMode === 'desktop' && {
        borderRadius: '0px'
      })
    }}
  >
    <div className="absolute inset-0 opacity-10" style={{
      backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.3) 1px, transparent 1px)`,
      backgroundSize: '20px 20px'
    }} />

    <div className="flex items-center gap-3 min-w-0 relative z-10">
      {(showChatHistory || !showForm) && (
        <button onClick={onBack} className="p-2 hover:bg-white/20 rounded-full transition-all group" title="Back">
          <ChevronLeft className="w-4 h-4 group-hover:scale-110 transition-transform" />
        </button>
      )}

      <div className="flex-shrink-0 p-1.5 bg-white/20 rounded-full backdrop-blur-sm">
        {iconType === 'custom' && customIcon ? (
          <Image src={customIcon} alt="" width={16} height={16} className="w-4 h-4 rounded-full" unoptimized />
        ) : (
          <MessageCircle className="w-4 h-4" />
        )}
      </div>

      <div className="min-w-0">
        <h3 className={`font-semibold ${viewMode === 'mobile' ? 'text-sm' : 'text-base'} truncate tracking-tight`}>
          {showChatHistory ? 'Your Conversations' : widget.name || 'Chat Support'}
        </h3>
        <p className={`${viewMode === 'mobile' ? 'text-xs' : 'text-xs'} opacity-90 truncate font-medium`}>
          {showChatHistory
            ? `${chatHistory.length} conversation${chatHistory.length !== 1 ? 's' : ''}`
            : headerSubtitle
          }
        </p>
      </div>
    </div>

    <div className="flex items-center gap-1.5 flex-shrink-0 relative z-10">
      {/* Chat History Button - Desktop only */}
      {!showForm && !showChatHistory && userEmail && (
        <button
          onClick={onHistory}
          className="desktop-only p-2 hover:bg-white/20 rounded-full transition-all group"
          title="Chat History"
        >
          <History className="w-4 h-4 group-hover:scale-110 transition-transform" />
        </button>
      )}

      {/* Expand/Collapse Button - Desktop only */}
      <button
        onClick={isExpanded ? onCollapse : onExpand}
        className="desktop-only p-2 hover:bg-white/20 rounded-full transition-all group"
        title={isExpanded ? "Collapse" : "Expand"}
      >
        {isExpanded ? (
          <Minimize2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
        ) : (
          <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        )}
      </button>

      {/* Close Button - Always visible */}
      <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-all group" title="Close">
        <X className="w-4 h-4 group-hover:scale-110 transition-transform" />
      </button>
    </div>
  </div>
);

const ContactForm = ({ widget, formData, setFormData, onSubmit, sending, primaryColor }: ContactFormProps) => (
  <form onSubmit={onSubmit} className="flex-1 p-4 space-y-4 overflow-y-auto">
    <div className="text-center">
      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <MessageCircle className="w-6 h-6 text-blue-600" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Start a Conversation</h2>
      <p className="text-sm text-gray-600 leading-relaxed">We&apos;re here to help! Please provide your information to get started.</p>
    </div>

    <div className="space-y-3">
      {widget.collectName !== false && (
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">Full Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/50"
            placeholder="Enter your full name"
            required
          />
        </div>
      )}

      {widget.collectEmail && (
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">Email Address *</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/50"
            placeholder="Enter your email address"
            required
          />
        </div>
      )}

      {widget.collectPhone && (
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">Phone Number</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/50"
            placeholder="Enter your phone number"
          />
        </div>
      )}

      {widget.customFields?.map((field: { id: string; label: string; type: string; required: boolean; placeholder?: string }, index: number) => (
        <div key={field.id || index}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {field.label || `Field ${index + 1}`} {field.required && '*'}
          </label>
          <input
            type={field.type || 'text'}
            placeholder={field.placeholder || ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required={field.required}
          />
        </div>
      ))}
    </div>

    <button
      type="submit"
      disabled={sending}
      className="w-full py-3 px-4 text-white font-semibold rounded-xl hover:shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
      style={{
        background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
        boxShadow: `0 4px 16px ${primaryColor}40`
      }}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
        {widget.buttonText || 'Start Conversation'}
      </span>
    </button>
  </form>
);

const MessageBubble = ({ msg, isCustomer, primaryColor, formData }: MessageBubbleProps) => (
  <div className={`flex items-end gap-2 w-full ${isCustomer ? 'justify-end' : 'justify-start'}`}>
    {isCustomer ? (
      <>
        <div
          className="max-w-[80%] px-4 py-2.5 rounded-2xl shadow-md"
          style={{
            backgroundColor: primaryColor,
            borderRadius: '18px 18px 4px 18px'
          }}
        >
          <p className="text-sm whitespace-pre-wrap break-words text-white">{msg.text}</p>
          <p className="text-xs mt-1 text-right text-white/70">
            {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </p>
        </div>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold shadow-sm"
          style={{ backgroundColor: primaryColor }}
        >
          {getInitials(formData.name || 'User')}
        </div>
      </>
    ) : (
      <>
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-300 shadow-sm">
          <Bot className="w-4 h-4 text-gray-700" />
        </div>
        <div className="max-w-[80%] px-4 py-2.5 rounded-2xl shadow-sm border bg-gray-100 border-gray-200" style={{ borderRadius: '18px 18px 18px 4px' }}>
          <p className="text-sm whitespace-pre-wrap break-words text-gray-700">{msg.text}</p>
          {msg.metadata && typeof msg.metadata === 'object' && 'ai_generated' in msg.metadata && (msg.metadata as { ai_generated: boolean }).ai_generated && (
            <div className="mt-1.5 pt-1.5 border-t border-gray-300">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Bot className="w-3 h-3" />
                <span>AI</span>
                {typeof msg.metadata.confidence === 'number' && (
                  <span className="text-gray-500">• {Math.round(msg.metadata.confidence * 100)}%</span>
                )}
              </div>
            </div>
          )}
          <p className="text-xs mt-1 text-gray-500">
            {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </p>
        </div>
      </>
    )}
  </div>
);

// Main Component
export default function WidgetPreview({ widget, viewMode }: WidgetPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(viewMode === 'mobile'); // Mobile always expanded
  const [showForm, setShowForm] = useState(true);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [aiThinking, setAiThinking] = useState(false);
  const [handoverMode, setHandoverMode] = useState<'ai' | 'human'>('ai');
  const [handoverRequested, setHandoverRequested] = useState(false);
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [sending, setSending] = useState(false);

  const { userEmail, chatHistory, saveEmail, clearEmail, saveConversation } = useWidgetStorage(widget.id || 'preview');

  // Preload AI backend connection for faster response
  useEffect(() => {
    if (widget.id && widget.businessId && widget.aiConfig?.enabled) {
      // Preload the AI service by making a lightweight request
      const preloadAI = async () => {
        try {
          // Just ping the AI service to warm it up
          await fetch('/api/ai/health', { method: 'HEAD' }).catch(() => {
            // Ignore errors, this is just for preloading
          });
        } catch {
          // Ignore errors, this is just for preloading
        }
      };

      // Preload after a short delay to not block initial render
      const timeoutId = setTimeout(preloadAI, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [widget.id, widget.businessId, widget.aiConfig?.enabled]);

  // Handle mobile layout based on settings
  useEffect(() => {
    if (viewMode === 'mobile') {
      const mobileLayout = widget.mobileLayout || 'expanded';
      console.log('Mobile layout:', mobileLayout, 'Full screen:', widget.mobileFullScreen);

      if (mobileLayout === 'fullscreen') {
        setIsExpanded(true);
      } else if (mobileLayout === 'expanded') {
        setIsExpanded(true);
      } else if (mobileLayout === 'shrinked') {
        setIsExpanded(false);
      } else {
        setIsExpanded(true); // Default to expanded
      }
    }
  }, [viewMode, widget.mobileLayout, widget.mobileFullScreen]);

  // Widget styling
  const primaryColor = widget.primaryColor || '#3B82F6';
  const textColor = widget.textColor || '#FFFFFF';
  const position = widget.position || 'bottom-right';
  const dimensions = SIZE_MAP[widget.widgetSize as keyof typeof SIZE_MAP] || SIZE_MAP.standard;
  const buttonDimension = BUTTON_SIZE_MAP[widget.buttonSize as keyof typeof BUTTON_SIZE_MAP] || BUTTON_SIZE_MAP.medium;

  // Button styles
  const getButtonStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      width: buttonDimension,
      height: buttonDimension
    };
    const styles: Record<string, React.CSSProperties> = {
      circular: { borderRadius: '50%' },
      rounded: { borderRadius: '16px' },
      square: { borderRadius: '4px' },
      pill: { borderRadius: '999px' },
      modern: { borderRadius: '24px' },
      gradient: { background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`, borderRadius: '16px' }
    };

    const mobileStyle: React.CSSProperties = viewMode === 'mobile' ? {
      width: '56px',
      height: '56px',
      borderRadius: '50%',
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 9998
    } : {};

    return {
      ...baseStyle,
      backgroundColor: primaryColor,
      ...(styles[widget.buttonStyle || 'rounded'] || styles.rounded),
      ...mobileStyle
    };
  };

  const getAnimationClass = () => {
    if (isMinimized) return 'animate-bounce';
    const animations: Record<string, string> = {
      none: '',
      pulse: 'animate-pulse',
      bounce: 'animate-bounce',
      shake: 'animate-[shake_1s_ease-in-out_infinite]',
      glow: 'animate-[glow_2s_ease-in-out_infinite]'
    };
    return animations[widget.buttonAnimation || 'pulse'] || '';
  };

  const getHoverClass = () => {
    const hovers: Record<string, string> = {
      none: '',
      scale: 'hover:scale-110',
      lift: 'hover:-translate-y-2',
      glow: 'hover:shadow-[0_0_30px_rgba(59,130,246,0.6)]',
      rotate: 'hover:rotate-12'
    };
    return hovers[widget.buttonHoverEffect || 'scale'] || '';
  };

  const getBadgePositionClass = () => {
    if (viewMode === 'mobile') return '-top-1 -right-1';
    const positions: Record<string, string> = {
      'top-right': '-top-1 -right-1',
      'top-left': '-top-1 -left-1',
      'bottom-right': '-bottom-1 -right-1',
      'bottom-left': '-bottom-1 -left-1'
    };
    return positions[widget.badgePosition || 'top-right'] || '-top-1 -right-1';
  };

  const getBadgeAnimationClass = () => {
    const animations: Record<string, string> = {
      none: '',
      pulse: 'animate-pulse',
      bounce: 'animate-bounce',
      ping: 'animate-ping'
    };
    return animations[widget.badgeAnimation || 'pulse'] || '';
  };

  // Auto-create anonymous conversation with optimizations
  useEffect(() => {
    if (isOpen && !conversation && !widget.requireContactForm && widget.id && widget.businessId) {
      // Show welcome message immediately for better UX
      setShowForm(false);
      setMessages([{
        id: 'welcome-msg',
        conversationId: 'preview',
        text: widget.welcomeMessage || 'Welcome! How can we help you today?',
        sender: 'business',
        senderName: 'AI Assistant',
        createdAt: Date.now(),
        metadata: { preview: true }
      }]);

      const createAnonymousConversation = async () => {
        try {
          // Use Promise.race to timeout after 5 seconds
          const result = await Promise.race([
            createChatConversation(widget.businessId!, widget.id!, {
              customerName: 'Preview User',
              customerEmail: `anonymous_${Date.now()}@preview.widget`
            }),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Timeout')), 5000)
            )
          ]) as { success: boolean; data: ChatConversation };

          if (result.success) {
            setConversation(result.data);
            subscribeToMessages(result.data.id, setMessages);
            // Don't send welcome message again since we already showed it
          }
        } catch (error) {
          console.error('Error creating conversation:', error);
          // Keep the preview welcome message even if backend fails
        }
      };

      // Create conversation in background without blocking UI
      createAnonymousConversation();
    }
  }, [isOpen, widget, conversation]);

  // Load stored email
  useEffect(() => {
    if (userEmail) {
      setFormData(prev => ({ ...prev, email: userEmail }));
    }
  }, [userEmail]);

  // Form submission with optimizations
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!widget.id || !widget.businessId) return;

    saveEmail(formData.email);
    setSending(true);

    // Show welcome message immediately for better UX
    setShowForm(false);
    setMessages([{
      id: 'welcome-msg',
      conversationId: 'preview',
      text: widget.welcomeMessage || 'Welcome! How can we help you today?',
      sender: 'business',
      senderName: 'AI Assistant',
      createdAt: Date.now(),
      metadata: { preview: true }
    }]);

    try {
      // Use Promise.race to timeout after 5 seconds
      const result = await Promise.race([
        createChatConversation(widget.businessId, widget.id, {
          customerName: formData.name,
          customerEmail: formData.email
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 5000)
        )
      ]) as { success: boolean; data: ChatConversation };

      if (result.success) {
        setConversation(result.data);
        subscribeToMessages(result.data.id, setMessages);
        // Don't send welcome message again since we already showed it
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      // Keep the preview welcome message even if backend fails
    } finally {
      setSending(false);
    }
  };

  // Send message with AI
  const handleSendMessage = async (messageText: string) => {
    if (!conversation || !messageText.trim()) return;

    setSending(true);

    try {
      await sendMessage(conversation.id, {
        text: messageText,
        sender: 'customer',
        senderName: formData.name || 'Preview User'
      });

      if (handoverMode === 'human') {
        await sendMessage(conversation.id, {
          text: "Thank you for your message. A human agent will respond shortly.",
          sender: 'business',
          senderName: 'Support Team',
          metadata: { human_mode: true }
        });
        setSending(false);
        return;
      }

      const aiConfig = widget.aiConfig;
      if (aiConfig?.enabled) {
        setAiThinking(true);

        const aiRequest: AIChatRequest = {
          message: messageText,
          widgetId: widget.id || '',
          conversationId: conversation.id,
          aiConfig: {
            enabled: true,
            provider: aiConfig.provider || 'openrouter',
            model: aiConfig.model || 'openai/gpt-5-mini',
            temperature: aiConfig.temperature || 0.7,
            maxTokens: aiConfig.maxTokens || 500,
            confidenceThreshold: aiConfig.confidenceThreshold || 0.6,
            maxRetrievalDocs: aiConfig.maxRetrievalDocs || 5,
            ragEnabled: aiConfig.ragEnabled || false,
            fallbackToHuman: aiConfig.fallbackToHuman !== undefined ? aiConfig.fallbackToHuman : true,
            embeddingProvider: aiConfig.embeddingProvider || 'openai',
            embeddingModel: aiConfig.embeddingModel || 'text-embedding-3-large',
            rerankerEnabled: aiConfig.rerankerEnabled !== undefined ? aiConfig.rerankerEnabled : true,
            rerankerModel: aiConfig.rerankerModel || 'rerank-2.5',
            systemPrompt: aiConfig.systemPrompt || 'support',
            customSystemPrompt: aiConfig.customSystemPrompt || ''
          },
          businessId: widget.businessId || '',
          customerName: formData.name || 'Preview User',
          customerEmail: formData.email || 'preview@example.com',
          customerHandover: widget.customerHandover ? {
            enabled: widget.customerHandover.enabled || false,
            showHandoverButton: widget.customerHandover.showHandoverButton || false,
            handoverButtonPosition: widget.customerHandover.handoverButtonPosition || 'bottom',
            handoverButtonText: widget.customerHandover.handoverButtonText || 'Talk to Human Agent',
            includeInQuickReplies: widget.customerHandover.includeInQuickReplies || false,
            autoDetectKeywords: widget.customerHandover.autoDetectKeywords || false,
            detectionKeywords: widget.customerHandover.detectionKeywords || [],
            handoverMessage: widget.customerHandover.handoverMessage || "I'll connect you with a human agent right away. Please wait a moment.",
            notificationToAgent: widget.customerHandover.notificationToAgent || true,
            allowCustomerToSwitch: widget.customerHandover.allowCustomerToSwitch || true,
            smartFallbackEnabled: widget.customerHandover.smartFallbackEnabled || true
          } : undefined
        };

        const aiResponse = await apiClient.sendAIMessage(aiRequest);

        if (aiResponse.success && aiResponse.data) {
          const metadata: Record<string, unknown> = {
            ai_generated: true,
            confidence: aiResponse.data.confidence,
            sources: aiResponse.data.sources,
            shouldFallbackToHuman: aiResponse.data.shouldFallbackToHuman
          };

          if (aiResponse.data.metadata?.handover_confirmed === true) {
            metadata.handover_confirmed = true;
          }

          await sendMessage(conversation.id, {
            text: aiResponse.data.response,
            sender: 'business',
            senderName: 'AI Assistant',
            metadata
          });
        } else {
          await sendMessage(conversation.id, {
            text: "I'm having trouble processing your request. Let me connect you with a human agent.",
            sender: 'business',
            senderName: 'AI Assistant',
            metadata: { ai_generated: true, fallback_message: true, error: aiResponse.error }
          });
        }
        setAiThinking(false);
      } else {
        await sendMessage(conversation.id, {
          text: widget.autoReply || 'Thanks for your message! We will get back to you shortly.',
          sender: 'business',
          senderName: 'Support Team'
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
      setAiThinking(false);
    }
  };

  // Handover functions
  const handleHandoverRequest = async () => {
    if (!conversation) return;

    const handoverMessage = widget.customerHandover?.handoverMessage ||
      "I'll connect you with a human agent right away. Please wait a moment.";

    await sendMessage(conversation.id, {
      text: handoverMessage,
      sender: 'business',
      senderName: 'AI Assistant',
      metadata: { handover_requested: true, timestamp: new Date().toISOString() }
    });

    setHandoverRequested(true);
    setHandoverMode('human');
    await requestHandover(conversation.id, 'button');

    setTimeout(async () => {
      await sendMessage(conversation.id, {
        text: "A human agent will be with you shortly. In the meantime, feel free to describe your issue.",
        sender: 'business',
        senderName: 'AI Assistant',
        metadata: { handover_info: true }
      });
    }, 1000);
  };

  const handleBackToAI = async () => {
    if (!conversation) return;
    setHandoverMode('ai');
    setHandoverRequested(false);
    await clearHandover(conversation.id);
    await sendMessage(conversation.id, {
      text: "You're now back to AI mode. How can I help you?",
      sender: 'business',
      senderName: 'AI Assistant'
    });
  };

  const handleNewConversation = async () => {
    setShowChatHistory(false);
    if (widget.id && widget.businessId) {
      const result = await createChatConversation(widget.businessId, widget.id, {
        customerName: formData.name,
        customerEmail: formData.email
      });

      if (result.success) {
        setConversation(result.data);
        setMessages([]);
        subscribeToMessages(result.data.id, setMessages);
        await sendMessage(result.data.id, {
          text: widget.welcomeMessage || 'Welcome! How can we help you today?',
          sender: 'business',
          senderName: 'AI Assistant'
        });
      }
    }
  };

  return (
    <>
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
        .glass-morphism {
          backdrop-filter: blur(16px);
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .premium-shadow-lg {
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12), 0 8px 24px rgba(0, 0, 0, 0.08);
        }
        .desktop-expanded {
          width: 100vw !important;
          height: 100vh !important;
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          border-radius: 0 !important;
          border: none !important;
          margin: 0 !important;
          padding: 0 !important;
          box-shadow: none !important;
          transform: none !important;
          background: white !important;
          z-index: 10000 !important;
        }
        .mobile-widget {
          width: 100vw !important;
          height: 100vh !important;
          max-width: 100vw !important;
          max-height: 100vh !important;
          min-width: 100vw !important;
          min-height: 100vh !important;
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          border-radius: 0 !important;
          border: none !important;
          margin: 0 !important;
          padding: 0 !important;
          box-shadow: none !important;
          transform: none !important;
          background: white !important;
          z-index: 10000 !important;
        }
        
        /* Force mobile widget to be truly full screen like SiteGPT */
        @media (max-width: 1024px) {
          .mobile-widget {
            width: 100vw !important;
            height: 100vh !important;
            max-width: 100vw !important;
            max-height: 100vh !important;
            min-width: 100vw !important;
            min-height: 100vh !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            border-radius: 0 !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            transform: none !important;
            background: white !important;
            z-index: 10000 !important;
          }
          
          /* Override any conflicting styles */
          .mobile-widget * {
            box-sizing: border-box !important;
          }
          
          /* Ensure mobile widget takes full screen on any device */
          .mobile-widget {
            width: 100vw !important;
            height: 100vh !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            border-radius: 0 !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            transform: none !important;
            background: white !important;
            z-index: 10000 !important;
          }
        }
        
        /* Small mobile screens - always expanded, no collapse option */
        @media (max-width: 768px) {
          .mobile-widget {
            width: 100vw !important;
            height: 100vh !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            border-radius: 0 !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            transform: none !important;
            background: white !important;
            z-index: 10000 !important;
          }
          
          /* Hide expand/collapse buttons on mobile - no collapse option */
          .mobile-widget button[title="Expand"],
          .mobile-widget button[title="Collapse"],
          .mobile-widget button[title="Chat History"] {
            display: none !important;
          }
          
          /* Force mobile to always be expanded */
          .mobile-widget {
            width: 100vw !important;
            height: 100vh !important;
            max-width: 100vw !important;
            max-height: 100vh !important;
            min-width: 100vw !important;
            min-height: 100vh !important;
          }
        }
        
        /* Hide expand/collapse buttons on mobile screens - mobile always expanded */
        @media (max-width: 1024px) {
          .mobile-widget button[title="Expand"],
          .mobile-widget button[title="Collapse"],
          .mobile-widget button[title="Chat History"] {
            display: none !important;
          }
          
        /* Mobile always expanded - no collapse option */
        .mobile-widget {
          width: 100vw !important;
          height: 100vh !important;
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          border-radius: 0 !important;
          border: none !important;
          margin: 0 !important;
          padding: 0 !important;
          box-shadow: none !important;
          transform: none !important;
          background: white !important;
          z-index: 10000 !important;
          max-width: 100vw !important;
          max-height: 100vh !important;
        }
        
        /* Mobile widget content - proper sizing and centering */
        .mobile-widget .flex-1 {
          max-width: 100% !important;
          overflow-x: hidden !important;
        }
        
        .mobile-widget .max-w-\[80\%\] {
          max-width: 85% !important;
        }
        
        .mobile-widget .px-4 {
          padding-left: 1rem !important;
          padding-right: 1rem !important;
        }
        
        .mobile-widget .py-3 {
          padding-top: 0.75rem !important;
          padding-bottom: 0.75rem !important;
        }
        
        /* Mobile message bubbles - proper sizing */
        .mobile-widget .space-y-3 > div {
          max-width: 100% !important;
          padding-left: 0.75rem !important;
          padding-right: 0.75rem !important;
        }
        
        /* Mobile input area - centered and proper width */
        .mobile-widget form {
          padding: 1rem !important;
          max-width: 100% !important;
        }
        
        .mobile-widget form .flex {
          max-width: 100% !important;
          gap: 0.5rem !important;
        }
        
        .mobile-widget input[type="text"] {
          max-width: calc(100% - 3rem) !important;
          min-width: 0 !important;
        }
        
        /* Mobile contact form - centered layout */
        .mobile-widget .space-y-4 {
          padding: 1rem !important;
          max-width: 100% !important;
        }
        
        .mobile-widget .space-y-4 > div {
          max-width: 100% !important;
        }
        
        .mobile-widget .space-y-4 input {
          max-width: 100% !important;
          width: 100% !important;
        }
        
        /* Mobile messages area - prevent stretching */
        .mobile-widget .flex-1.overflow-y-auto {
          max-width: 100% !important;
          padding: 0.75rem !important;
          overflow-x: hidden !important;
        }
        
        .mobile-widget .space-y-3 {
          max-width: 100% !important;
          padding: 0 !important;
        }
        
        /* Mobile message bubbles - proper width constraints */
        .mobile-widget .justify-end .max-w-\[80\%\] {
          max-width: 75% !important;
        }
        
        .mobile-widget .justify-start .max-w-\[80\%\] {
          max-width: 75% !important;
        }
        
        /* Mobile quick replies - proper sizing */
        .mobile-widget .flex-wrap {
          max-width: 100% !important;
          gap: 0.5rem !important;
        }
        
        .mobile-widget .flex-wrap button {
          max-width: calc(50% - 0.25rem) !important;
          min-width: 0 !important;
          flex: 1 1 auto !important;
        }
        
        /* Mobile header - proper sizing */
        .mobile-widget .flex.items-center.justify-between {
          max-width: 100% !important;
          padding: 0.75rem 1rem !important;
        }
        
        .mobile-widget .min-w-0 {
          max-width: calc(100% - 8rem) !important;
          min-width: 0 !important;
        }
        
        /* Mobile form elements - centered and proper width */
        .mobile-widget .w-full {
          max-width: 100% !important;
          width: 100% !important;
        }
        
        .mobile-widget .px-3 {
          padding-left: 0.75rem !important;
          padding-right: 0.75rem !important;
        }
        
        .mobile-widget .py-2\.5 {
          padding-top: 0.625rem !important;
          padding-bottom: 0.625rem !important;
        }
        
        /* Mobile layout specific classes */
        .mobile-widget.mobile-fullscreen {
          width: 100vw !important;
          height: 100vh !important;
          max-width: 100vw !important;
          max-height: 100vh !important;
          min-width: 100vw !important;
          min-height: 100vh !important;
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          border-radius: 0 !important;
          border: none !important;
          margin: 0 !important;
          padding: 0 !important;
          box-shadow: none !important;
          transform: none !important;
          background: white !important;
          z-index: 10000 !important;
        }
        
        /* Force fullscreen mobile layout */
        @media (max-width: 1024px) {
          .mobile-widget.mobile-fullscreen {
            width: 100vw !important;
            height: 100vh !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            border-radius: 0 !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            transform: none !important;
            background: white !important;
            z-index: 10000 !important;
          }
        }
        
        .mobile-widget.mobile-expanded {
          width: 95vw !important;
          height: 90vh !important;
          position: fixed !important;
          top: 5vh !important;
          left: 2.5vw !important;
          right: 2.5vw !important;
          bottom: 5vh !important;
          border-radius: 16px !important;
          border: 1px solid #e5e7eb !important;
          margin: 0 !important;
          padding: 0 !important;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12) !important;
          transform: none !important;
          background: white !important;
          z-index: 10000 !important;
        }
        
        .mobile-widget.mobile-shrinked {
          width: 85vw !important;
          height: 70vh !important;
          position: fixed !important;
          top: 15vh !important;
          left: 7.5vw !important;
          right: 7.5vw !important;
          bottom: 15vh !important;
          border-radius: 20px !important;
          border: 1px solid #e5e7eb !important;
          margin: 0 !important;
          padding: 0 !important;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12) !important;
          transform: none !important;
          background: white !important;
          z-index: 10000 !important;
        }
        
        /* Mobile-specific hiding classes */
        .mobile-only {
          display: none !important;
        }
        
        @media (max-width: 1024px) {
          .mobile-only {
            display: block !important;
          }
          .desktop-only {
            display: none !important;
          }
        }
        
        @media (min-width: 1025px) {
          .mobile-only {
            display: none !important;
          }
          .desktop-only {
            display: block !important;
          }
        }
      `}</style>

      <ChatButton
        isOpen={isOpen}
        isMinimized={isMinimized}
        onClick={() => {
          if (isMinimized) {
            setIsMinimized(false);
          } else {
            setIsOpen(!isOpen);
          }
        }}
        style={getButtonStyle()}
        animation={getAnimationClass()}
        hover={getHoverClass()}
        iconType={widget.iconType || 'default'}
        customIcon={widget.customIcon || ''}
        showTooltip={widget.showButtonTooltip !== false}
        tooltip={widget.buttonTooltip || 'Chat with us'}
        showBadge={widget.showBadge || false}
        badgeCount={widget.badgeCount || 0}
        badgeColor={widget.badgeColor || '#EF4444'}
        badgePosition={getBadgePositionClass()}
        badgeAnimation={getBadgeAnimationClass()}
        showOnlineDot={widget.showOnlineDot !== false}
        onlineDotColor={widget.onlineDotColor || '#10B981'}
        position={position}
        viewMode={viewMode}
      />

      {isOpen && !isMinimized && (
        <>
          <div className="fixed inset-0 bg-transparent z-[9999]" onClick={() => setIsOpen(false)} />

          <div
            className={`fixed ${position === 'bottom-right' ? 'bottom-4 right-4 sm:bottom-6 sm:right-6' : 'bottom-4 left-4 sm:bottom-6 sm:left-6'} ${viewMode === 'mobile'
              ? (widget.mobileLayout === 'fullscreen' && widget.mobileFullScreen
                ? 'mobile-widget mobile-fullscreen'
                : widget.mobileLayout === 'expanded'
                  ? 'mobile-widget mobile-expanded'
                  : 'mobile-widget mobile-shrinked')
              : isExpanded
                ? 'desktop-expanded'
                : 'glass-morphism premium-shadow-lg'
              } flex flex-col z-[10000] transition-all duration-300 ease-in-out`}
            style={{
              ...(viewMode === 'mobile' ? {
                // Mobile layout based on settings
                ...(widget.mobileLayout === 'fullscreen' ? {
                  // Full screen mobile - app-like experience
                  width: '100vw',
                  height: '100vh',
                  maxWidth: '100vw',
                  maxHeight: '100vh',
                  minWidth: '100vw',
                  minHeight: '100vh',
                  position: 'fixed',
                  top: '0',
                  left: '0',
                  right: '0',
                  bottom: '0',
                  borderRadius: '0px',
                  border: 'none',
                  margin: '0',
                  padding: '0',
                  boxShadow: 'none',
                  transform: 'none',
                  background: 'white'
                } : widget.mobileLayout === 'expanded' ? {
                  // Expanded mobile - larger but not full screen
                  width: '95vw',
                  height: '90vh',
                  maxWidth: '95vw',
                  maxHeight: '90vh',
                  position: 'fixed',
                  top: '5vh',
                  left: '2.5vw',
                  right: '2.5vw',
                  bottom: '5vh',
                  borderRadius: '16px',
                  border: '1px solid #e5e7eb',
                  margin: '0',
                  padding: '0',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.12)',
                  transform: 'none',
                  background: 'white'
                } : {
                  // Shrinked mobile - compact size
                  width: '85vw',
                  height: '70vh',
                  maxWidth: '85vw',
                  maxHeight: '70vh',
                  position: 'fixed',
                  top: '15vh',
                  left: '7.5vw',
                  right: '7.5vw',
                  bottom: '15vh',
                  borderRadius: '20px',
                  border: '1px solid #e5e7eb',
                  margin: '0',
                  padding: '0',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.12)',
                  transform: 'none',
                  background: 'white'
                }),
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                justifyContent: 'flex-start'
              } : isExpanded ? {
                // Desktop expanded - full screen
                width: '100vw',
                height: '100vh',
                maxWidth: '100vw',
                maxHeight: '100vh',
                top: '0',
                left: '0',
                right: '0',
                bottom: '0',
                borderRadius: '0px',
                border: 'none',
                margin: '0',
                padding: '0',
                boxShadow: 'none',
                transform: 'none',
                background: 'white'
              } : {
                // Desktop normal size
                width: Math.min(parseInt(dimensions.width), 420),
                height: parseInt(dimensions.height),
                maxHeight: 'calc(100vh - 120px)',
                maxWidth: 'calc(100vw - 48px)',
                borderRadius: '20px'
              })
            }}
          >
            <ChatHeader
              widget={widget}
              textColor={textColor}
              showChatHistory={showChatHistory}
              showForm={showForm}
              userEmail={userEmail}
              chatHistory={chatHistory}
              onBack={() => {
                if (showChatHistory) {
                  setShowChatHistory(false);
                } else {
                  saveConversation(userEmail, messages);
                  setShowForm(true);
                  setMessages([]);
                }
              }}
              onHistory={() => setShowChatHistory(true)}
              onClose={() => {
                saveConversation(userEmail, messages);
                setIsOpen(false);
              }}
              onExpand={() => {
                if (viewMode !== 'mobile') {
                  setIsExpanded(true);
                }
              }}
              onCollapse={() => {
                if (viewMode !== 'mobile') {
                  setIsExpanded(false);
                }
              }}
              isExpanded={isExpanded}
              iconType={widget.iconType || 'default'}
              customIcon={widget.customIcon || ''}
              headerSubtitle={widget.headerSubtitle || "We're here to help!"}
              viewMode={viewMode}
              primaryColor={primaryColor}
            />

            {showChatHistory ? (
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
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
                          clearEmail();
                          setShowChatHistory(false);
                          setShowForm(true);
                          setMessages([]);
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
                  </div>
                ) : (
                  <>
                    <button
                      onClick={handleNewConversation}
                      className="w-full p-3 border-2 border-dashed rounded-lg hover:bg-blue-50 transition-all"
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
                        onClick={handleNewConversation}
                        className="w-full p-3 bg-white border rounded-lg hover:shadow-md transition-all text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                            <MessageCircle className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{chat.lastMessage}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500">{chat.messageCount} messages</span>
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
            ) : showForm ? (
              <ContactForm
                widget={widget}
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleFormSubmit}
                sending={sending}
                primaryColor={primaryColor}
                viewMode={viewMode}
              />
            ) : (
              <>
                {/* Handover Button - Top */}
                {widget.customerHandover?.enabled &&
                  widget.customerHandover?.showHandoverButton &&
                  widget.customerHandover?.handoverButtonPosition === 'top' &&
                  !handoverRequested && (
                    <div className="px-3 py-1.5 border-b bg-gray-50">
                      <button
                        onClick={handleHandoverRequest}
                        className="w-full py-1.5 px-2.5 text-xs font-medium rounded-md border transition-all"
                        style={{ borderColor: primaryColor, color: primaryColor }}
                      >
                        <User className="w-3 h-3 inline mr-1" />
                        {widget.customerHandover?.handoverButtonText || 'Talk to Human Agent'}
                      </button>
                    </div>
                  )}

                {/* Human Mode Indicator */}
                {handoverMode === 'human' && (
                  <div className="px-4 py-2 border-b bg-emerald-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-emerald-900">Human Agent Mode</span>
                      </div>
                      {widget.customerHandover?.allowCustomerToSwitch && (
                        <button onClick={handleBackToAI} className="text-xs text-emerald-700 underline">
                          Back to AI
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Messages Area */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gradient-to-b from-gray-50/30 to-white/50">
                  {/* Floating Handover Button */}
                  {widget.customerHandover?.enabled &&
                    widget.customerHandover?.showHandoverButton &&
                    widget.customerHandover?.handoverButtonPosition === 'floating' &&
                    !handoverRequested && (
                      <button
                        onClick={handleHandoverRequest}
                        className="absolute top-3 right-3 z-10 py-1.5 px-2.5 text-xs rounded-full border shadow-md bg-white/95"
                        style={{ borderColor: primaryColor, color: primaryColor }}
                      >
                        <User className="w-3 h-3 inline mr-1" />
                        <span className="hidden sm:inline">Human</span>
                      </button>
                    )}

                  {messages.map((msg, idx) => (
                    <MessageBubble
                      key={msg.id || idx}
                      msg={msg}
                      isCustomer={msg.sender === 'customer'}
                      primaryColor={primaryColor}
                      formData={formData}
                    />
                  ))}

                  {/* Quick Replies */}
                  {messages.length === 1 && widget.quickReplies && widget.quickReplies.filter((r: string) => r.trim()).length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {widget.customerHandover?.enabled &&
                        widget.customerHandover?.includeInQuickReplies &&
                        !handoverRequested && (
                          <button
                            onClick={handleHandoverRequest}
                            className="px-2.5 py-1 text-xs border rounded-md"
                            style={{ borderColor: '#10B981', color: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.05)' }}
                          >
                            <User className="w-3 h-3 inline mr-1" />Human
                          </button>
                        )}

                      {widget.quickReplies?.filter((r: string) => r.trim()).map((reply: string, idx: number) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(reply)}
                          className="px-3 py-1.5 text-sm border-2 rounded-lg hover:shadow-md transition-all"
                          style={{ borderColor: primaryColor, color: primaryColor }}
                          disabled={aiThinking || sending}
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* AI Thinking */}
                  {aiThinking && (
                    <div className="flex items-end gap-2 justify-start">
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-gray-700" />
                      </div>
                      <div className="px-4 py-2.5 rounded-2xl bg-gray-100 border border-gray-200">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                          <span className="text-sm text-gray-700">AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* Handover Button - Bottom */}
                {widget.customerHandover?.enabled &&
                  widget.customerHandover?.showHandoverButton &&
                  widget.customerHandover?.handoverButtonPosition === 'bottom' &&
                  !handoverRequested && (
                    <div className="px-3 py-1.5 border-t bg-gray-50">
                      <button
                        onClick={handleHandoverRequest}
                        className="w-full py-1.5 px-2.5 text-xs font-medium rounded-md border transition-all"
                        style={{ borderColor: primaryColor, color: primaryColor }}
                      >
                        <User className="w-3 h-3 inline mr-1" />
                        {widget.customerHandover?.handoverButtonText || 'Talk to Human Agent'}
                      </button>
                    </div>
                  )}

                {/* Input */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (inputMessage.trim()) {
                      handleSendMessage(inputMessage);
                      setInputMessage('');
                    }
                  }}
                  className="p-4 border-t bg-white/80"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder={widget.placeholderText || 'Type your message...'}
                      className="flex-1 px-4 py-3 border rounded-2xl focus:ring-2 focus:ring-blue-500/20 text-sm bg-white/90"
                      disabled={sending || aiThinking}
                    />
                    <button
                      type="submit"
                      disabled={sending || aiThinking || !inputMessage.trim()}
                      className="p-3 text-white rounded-2xl hover:shadow-lg transition-all disabled:opacity-50"
                      style={{
                        background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`
                      }}
                    >
                      {sending || aiThinking ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </form>

                {/* Branding */}
                {(widget.showBranding !== false) && (
                  <div className="px-4 py-2 border-t bg-gray-50/50">
                    <p className="text-xs text-center text-gray-500">
                      Powered by <span className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Ragzy AI</span>
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
"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { getAgent, Agent } from "@/app/lib/agent-utils";
import { getAgentChannel, AgentChannel } from "@/app/lib/agent-channel-utils";
import { doc, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ChatWidgetIframePage() {
  const params = useParams();
  const agentId = params.agentId as string;
  const channelId = params.channelId as string;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [channel, setChannel] = useState<AgentChannel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Settings from channel
  const displayName = channel?.settings?.widgetTitle || agent?.name || "Assistant";
  const initialMessage = channel?.settings?.welcomeMessage || "Hi! What can I help you with?";
  const messagePlaceholder = channel?.settings?.placeholder || "Message...";
  const footerMessage = channel?.settings?.footerMessage || "Powered by Rexa";
  const appearance = channel?.settings?.appearance || 'light';
  const profilePictureUrl = channel?.settings?.profilePictureUrl || "";
  const primaryColor = channel?.settings?.primaryColor || "#2563eb";
  const chatBubbleColor = channel?.settings?.chatBubbleColor || "#2563eb";
  const aiInstructions = channel?.settings?.aiInstructions || "";
  const suggestedMessages = channel?.settings?.suggestedMessages || [];
  const aiModel = channel?.settings?.aiModel || "gpt-4o-mini";

  // Simple markdown renderer for AI responses
  const renderMarkdown = (text: string) => {
    if (!text) return text;
    
    let rendered = text;
    
    // Replace **bold** with <strong>
    rendered = rendered.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
    
    // Replace *italic* with <em> (but not if it's part of a list item)
    rendered = rendered.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em class="italic">$1</em>');
    
    // Handle bullet points - convert to proper HTML lists
    const lines = rendered.split('\n');
    const processedLines: string[] = [];
    let inList = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if this line is a bullet point
      if (line.match(/^\s*\*\s+(.+)$/)) {
        const content = line.replace(/^\s*\*\s+/, '');
        if (!inList) {
          processedLines.push('<ul class="list-disc list-inside space-y-1 my-2 ml-4">');
          inList = true;
        }
        processedLines.push(`<li class="text-sm">${content}</li>`);
      } else {
        // If we were in a list and this line is not a bullet point, close the list
        if (inList) {
          processedLines.push('</ul>');
          inList = false;
        }
        
        // Add the regular line
        if (line) {
          processedLines.push(line);
        } else {
          processedLines.push('<br>');
        }
      }
    }
    
    // Close any open list
    if (inList) {
      processedLines.push('</ul>');
    }
    
    rendered = processedLines.join('\n');
    
    // Replace double line breaks with paragraph breaks
    rendered = rendered.replace(/\n\n+/g, '</p><p class="mt-3">');
    
    // Replace single line breaks with <br>
    rendered = rendered.replace(/\n/g, '<br>');
    
    // Wrap in paragraph if it doesn't start with a tag
    if (!rendered.startsWith('<')) {
      rendered = '<p>' + rendered + '</p>';
    }
    
    return rendered;
  };

  // Widget colors based on appearance
  const widgetBgColor = appearance === 'dark' ? '#1a1a1a' : '#ffffff';
  const widgetHeaderBg = appearance === 'dark' ? '#262626' : '#ffffff';
  const widgetTextColor = appearance === 'dark' ? '#f5f5f5' : '#0a0a0a';
  const widgetBorderColor = appearance === 'dark' ? '#404040' : '#e5e5e5';
  const widgetMessagesBg = appearance === 'dark' ? '#0a0a0a' : '#f9fafb';
  const widgetBotMsgBg = appearance === 'dark' ? '#262626' : '#f3f4f6';
  const widgetInputBg = appearance === 'dark' ? '#171717' : '#f3f4f6';
  const widgetMutedText = appearance === 'dark' ? '#a3a3a3' : '#737373';
  const widgetFooterText = appearance === 'dark' ? '#737373' : '#a3a3a3';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Real-time listener for agent and channel changes
  useEffect(() => {
    if (!agentId || !channelId) return;

    const loadData = async () => {
      try {
        setLoadingData(true);

        // Load agent
        const agentResponse = await getAgent(agentId);
        if (agentResponse.success && agentResponse.data) {
          setAgent(agentResponse.data);
        } else {
          console.error('Failed to load agent:', agentResponse.error);
        }

        // Load channel
        const channelResponse = await getAgentChannel(channelId);
        if (channelResponse.success && channelResponse.data) {
          setChannel(channelResponse.data);
        } else {
          console.error('Failed to load channel:', channelResponse.error);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    loadData();

    // Set up real-time listeners
    const unsubscribeAgent = onSnapshot(
      doc(db, 'agents', agentId),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setAgent({
            id: doc.id,
            ...data,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
            updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
          } as Agent);
        }
      },
      (error) => {
        console.error('Error listening to agent:', error);
      }
    );

    const unsubscribeChannel = onSnapshot(
      doc(db, 'agentChannels', channelId),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          const channelData = {
            id: doc.id,
            ...data,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
            updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
          } as AgentChannel;
          console.log('Channel settings loaded:', channelData.settings);
          setChannel(channelData);
        } else {
          console.error('Channel document does not exist:', channelId);
        }
      },
      (error) => {
        console.error('Error listening to channel:', error);
      }
    );

    // Cleanup listeners on unmount
    return () => {
      unsubscribeAgent();
      unsubscribeChannel();
    };
  }, [agentId, channelId]);

  const handleSendMessage = async () => {
    if (!input.trim() || !agent || isSending || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const userInput = input;
    setInput('');
    setIsSending(true); // Show sending state immediately

    const assistantMessageId = (Date.now() + 1).toString();
    let assistantContent = '';

    setMessages(prev => [...prev, {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    }]);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
      const streamUrl = `${backendUrl}/api/ai/chat/stream`;

      // Use the AI model from channel settings, fallback to agent model
      let modelToUse = aiModel || agent.settings?.model || agent.aiConfig?.model || 'gpt-4o-mini';
      const supportedModels = ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gemini-2.0-flash-exp', 'gemini-1.5-flash', 'gemini-1.5-pro'];

      if (!supportedModels.includes(modelToUse)) {
        console.log(`Model ${modelToUse} not supported, using gpt-4o-mini instead`);
        modelToUse = 'gpt-4o-mini';
      }

      console.log('Sending message to AI with config:', {
        model: modelToUse,
        temperature: agent.settings?.temperature || agent.aiConfig?.temperature || 0.7,
        customSystemPrompt: aiInstructions ? aiInstructions.substring(0, 100) + '...' : 'none',
        agentId
      });

      // Prepare conversation history (limit to last 20 messages)
      const conversationHistory = messages
        .slice(-20) // Get last 20 messages only
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));
      
      // Add the current user message to history
      conversationHistory.push({
        role: 'user',
        content: userInput
      });

      // Switch from sending to loading (AI thinking)
      setIsSending(false);
      setIsLoading(true);

      // Small delay to ensure typing animation is visible
      await new Promise(resolve => setTimeout(resolve, 500));

      const response = await fetch(streamUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userInput,
          conversationHistory: conversationHistory, // Include conversation context
          agentId: agentId,
          aiConfig: {
            enabled: true,
            model: modelToUse,
            temperature: agent.settings?.temperature || agent.aiConfig?.temperature || 0.7,
            systemPrompt: 'custom',
            customSystemPrompt: aiInstructions || '',
            ragEnabled: true,
            embeddingProvider: 'voyage',
            embeddingModel: 'voyage-3-large', // Use voyage-3-large for consistency
            rerankerEnabled: true,
            rerankerModel: 'rerank-2.5-lite', // Use rerank-2.5-lite for consistency
            maxRetrievalDocs: 5,
            maxTokens: 500,
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
                // Only update content if we have actual content to show
                if (assistantContent.trim()) {
                  setMessages(prev => prev.map(msg =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: assistantContent }
                      : msg
                  ));
                }
              } else if (data.type === 'complete') {
                setMessages(prev => prev.map(msg =>
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
      setMessages(prev => prev.map(msg =>
        msg.id === assistantMessageId
          ? { ...msg, content: "I'm sorry, I encountered an error. Please try again." }
          : msg
      ));
    } finally {
      setIsSending(false);
      setIsLoading(false);
    }
  };

  const handleSuggestedMessageClick = (message: string) => {
    setInput(message);
  };

  if (loadingData) {
    return (
      <div
        className="flex h-screen items-center justify-center"
        style={{ backgroundColor: widgetBgColor }}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: primaryColor }}></div>
      </div>
    );
  }

  return (
    <div
      className="h-screen flex flex-col"
      style={{
        backgroundColor: widgetBgColor,
        color: widgetTextColor
      }}
    >
      {/* Chat Header */}
      <div
        className="p-4 border-b flex items-center gap-3"
        style={{
          borderColor: widgetBorderColor,
          backgroundColor: widgetHeaderBg
        }}
      >
        {profilePictureUrl ? (
          <Image
            src={profilePictureUrl}
            alt="Agent"
            width={40}
            height={40}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-semibold"
            style={{ backgroundColor: primaryColor, color: 'white' }}
          >
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h3 className="font-semibold text-sm" style={{ color: widgetTextColor }}>
            {displayName}
          </h3>
          <p className="text-xs" style={{ color: widgetMutedText }}>Online</p>
        </div>
      </div>

      {/* Chat Messages */}
      <div
        className="flex-1 p-4 space-y-3 overflow-y-auto"
        style={{ backgroundColor: widgetMessagesBg }}
      >
        {/* Initial Message */}
        {initialMessage && messages.length === 0 && (
          <div className="flex flex-col items-start gap-1">
            <div className="flex items-center gap-2 ml-10">
              <span className="text-xs font-medium" style={{ color: widgetMutedText }}>
                {displayName}
              </span>
            </div>
            <div className="flex items-start gap-2">
              {profilePictureUrl ? (
                <Image
                  src={profilePictureUrl}
                  alt="Agent"
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                  style={{ backgroundColor: primaryColor, color: 'white' }}
                >
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div
                className="rounded-2xl px-4 py-2 max-w-[80%]"
                style={{
                  backgroundColor: widgetBotMsgBg,
                  color: widgetTextColor
                }}
              >
                <p className="text-sm whitespace-pre-wrap">{initialMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Messages */}
        {messages.map((msg) => (
          msg.role === 'user' ? (
            <div key={msg.id} className="flex justify-end">
              <div
                className="rounded-2xl px-4 py-2 max-w-[80%]"
                style={{
                  backgroundColor: chatBubbleColor,
                  color: 'white'
                }}
              >
                <p className="text-sm">{msg.content}</p>
              </div>
            </div>
          ) : (
            <div key={msg.id} className="flex flex-col items-start gap-1">
              <div className="flex items-center gap-2 ml-10">
                <span className="text-xs font-medium" style={{ color: widgetMutedText }}>
                  {displayName}
                </span>
              </div>
              <div className="flex items-start gap-2">
                {profilePictureUrl ? (
                  <Image
                    src={profilePictureUrl}
                    alt="Agent"
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                    style={{ backgroundColor: primaryColor, color: 'white' }}
                  >
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div
                  className="rounded-2xl px-4 py-2 max-w-[80%]"
                  style={{
                    backgroundColor: widgetBotMsgBg,
                    color: widgetTextColor
                  }}
                >
                  {msg.content ? (
                      <div 
                        className="text-sm whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                      />
                    ) : (
                      /* Always show typing animation for empty assistant messages */
                        <div className="flex items-center space-x-3 py-3 px-2 bg-gray-50 rounded-md">
                          <div className="flex space-x-1">
                            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
                            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-sm text-gray-700 font-medium">
                            {isSending ? 'Sending message...' : 'AI is thinking...'}
                          </span>
                        </div>
                    )}
                </div>
              </div>
            </div>
          )
        ))}

        {/* Suggested Messages */}
        {suggestedMessages.length > 0 && messages.length === 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {suggestedMessages.slice(0, 3).map((msg: string, idx: number) => (
              <button
                key={idx}
                onClick={() => handleSuggestedMessageClick(msg)}
                className="px-3 py-2 border rounded-full text-xs transition-colors hover:opacity-80"
                style={{
                  backgroundColor: appearance === 'dark' ? widgetBotMsgBg : 'white',
                  borderColor: widgetBorderColor,
                  color: widgetTextColor
                }}
              >
                {msg}
              </button>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div
        className="p-4 border-t"
        style={{
          borderColor: widgetBorderColor,
          backgroundColor: widgetHeaderBg
        }}
      >
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{ backgroundColor: widgetInputBg }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && input.trim() && !isLoading && !isSending) {
                handleSendMessage();
              }
            }}
            placeholder={messagePlaceholder}
            className="flex-1 bg-transparent border-none outline-none text-sm"
            style={{ color: widgetTextColor }}
            disabled={isLoading || isSending}
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading || isSending}
            className="transition-colors disabled:opacity-50"
            style={{ color: input.trim() && !isLoading && !isSending ? primaryColor : '#9ca3af' }}
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
  );
}

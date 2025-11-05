"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Copy, Globe, ArrowUp, Check, ExternalLink, Plus, Settings } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/app/lib/workspace-auth-context";
import { getBusinessWidgets, type ChatWidget } from "@/app/lib/chat-utils";

export default function DeployPage() {
  const params = useParams();
  const widgetId = params.id as string;
  const { workspaceContext } = useAuth();
  
  const [chatWidgetEnabled, setChatWidgetEnabled] = useState(true);
  const [helpPageEnabled, setHelpPageEnabled] = useState(true);
  const [copiedChat, setCopiedChat] = useState(false);
  const [existingWidgets, setExistingWidgets] = useState<ChatWidget[]>([]);
  const [loading, setLoading] = useState(true);

  const loadExistingWidgets = useCallback(async () => {
    const workspaceId = workspaceContext?.currentWorkspace?.id;
    if (!workspaceId) return;

    try {
      setLoading(true);
      const result = await getBusinessWidgets(workspaceId);
      
      if (result.success) {
        setExistingWidgets(result.data);
      }
    } catch (error) {
      console.error('Error loading widgets:', error);
    } finally {
      setLoading(false);
    }
  }, [workspaceContext?.currentWorkspace?.id]);

  useEffect(() => {
    loadExistingWidgets();
  }, [loadExistingWidgets]);

  const handleCopyCode = () => {
    const embedCode = `<script src="https://your-domain.com/widget.js" data-widget-id="your-widget-id"></script>`;
    navigator.clipboard.writeText(embedCode);
    setCopiedChat(true);
    setTimeout(() => setCopiedChat(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">All channels</h1>
          <p className="text-gray-600">Manage your AI agent deployment across different channels</p>
        </div>

        {/* Section 1: Existing Channels Management */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Your Channels</h2>
              <p className="text-sm text-gray-600">Manage your existing AI agent deployments</p>
            </div>
            <div className="text-sm text-gray-500">
              {loading ? 'Loading...' : `${existingWidgets.length} channel${existingWidgets.length !== 1 ? 's' : ''}`}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <Card key={i} className="bg-white border-0 shadow-sm">
                  <CardContent className="p-6">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                      <div className="h-20 bg-gray-200 rounded mb-4"></div>
                      <div className="flex gap-2">
                        <div className="h-8 bg-gray-200 rounded w-24"></div>
                        <div className="h-8 bg-gray-200 rounded w-20"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : existingWidgets.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {existingWidgets.map((widget) => (
                <Card key={widget.id} className="bg-white border-0 shadow-sm hover:shadow-md transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{widget.name || 'Unnamed Widget'}</h3>
                          <p className="text-xs text-gray-500">Chat widget</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={widget.isActive}
                          onCheckedChange={() => {}}
                          className="data-[state=checked]:bg-blue-600"
                        />
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                      AI-powered chat widget for your website
                    </p>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-gray-200 hover:bg-gray-50 text-gray-700"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy embed code
                      </Button>
                      <Link href={`/dashboard/widgets/${widget.id}/deploy/chat-widget`}>
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Manage
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No channels yet</h3>
                <p className="text-gray-600 mb-6">Create your first AI agent channel to get started</p>
                <Link href="/dashboard/widgets">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Channel
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Section 2: Create New Channels */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Create New Channel</h2>
              <p className="text-sm text-gray-600">Deploy your AI agent across different channels</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Chat Widget Card */}
            <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
              <CardContent className="p-0">
                {/* Preview Section */}
                <div className="relative h-64 bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 overflow-hidden">
                  {/* Decorative Elements */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-200 rounded-full opacity-20 blur-3xl"></div>
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-200 rounded-full opacity-20 blur-3xl"></div>
                  
                  {/* Chat Bubble Preview */}
                  <div className="absolute bottom-6 right-6 w-72 bg-white rounded-2xl shadow-xl p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-medium">
                        AI
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-500 mb-1">Agent • Just now</div>
                        <div className="text-sm text-gray-900">Hi! What can I help you with today?</div>
                      </div>
                    </div>
                    
                    {/* Input Preview */}
                    <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-200">
                      <input
                        type="text"
                        placeholder="Type your message..."
                        className="flex-1 bg-transparent border-0 outline-none text-sm text-gray-900 placeholder:text-gray-400"
                        readOnly
                      />
                      <div className="w-6 h-6 rounded-lg bg-blue-500 flex items-center justify-center">
                        <ArrowUp className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Chat widget</h3>
                        <p className="text-xs text-gray-500">Embedded chat interface</p>
                      </div>
                    </div>
                    <Switch
                      checked={chatWidgetEnabled}
                      onCheckedChange={setChatWidgetEnabled}
                      className="data-[state=checked]:bg-blue-600"
                    />
                  </div>

                  <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                    Add a floating chat bubble to your website. When clicked, it opens your AI Agent so users can ask questions, get help, or explore your product.
                  </p>

                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyCode}
                      className="flex-1 border-gray-200 hover:bg-gray-50 text-gray-700"
                    >
                      {copiedChat ? (
                        <>
                          <Check className="w-4 h-4 mr-2 text-green-600" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy embed code
                        </>
                      )}
                    </Button>

                     <Link href={`/dashboard/widgets/${widgetId}/deploy/chat-widget`}>
                       <Button
                         size="sm"
                         className="bg-blue-600 hover:bg-blue-700 text-white"
                       >
                         Manage
                       </Button>
                     </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Help Page Card */}
            <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
              <CardContent className="p-0">
                {/* Preview Section */}
                <div className="relative h-64 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-100 overflow-hidden">
                  {/* Decorative Elements */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-orange-200 rounded-full opacity-20 blur-3xl"></div>
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-200 rounded-full opacity-20 blur-3xl"></div>
                  
                  {/* Browser Window Preview */}
                  <div className="absolute inset-6 bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
                    {/* Browser Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 bg-red-400 rounded-full"></div>
                        <div className="w-2.5 h-2.5 bg-yellow-400 rounded-full"></div>
                        <div className="w-2.5 h-2.5 bg-green-400 rounded-full"></div>
                      </div>
                      <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-md border border-gray-200">
                        <Globe className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-600">help.yourdomain.com</span>
                      </div>
                      <div className="w-16"></div>
                    </div>

                    {/* Browser Content */}
                    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center mb-3">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-2 text-center">
                        How can I help you today?
                      </h2>
                      <div className="w-full max-w-md">
                        <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                          <input
                            type="text"
                            placeholder="Ask me anything..."
                            className="flex-1 bg-transparent border-0 outline-none text-xs text-gray-900 placeholder:text-gray-400"
                            readOnly
                          />
                          <div className="w-5 h-5 rounded-md bg-orange-500 flex items-center justify-center">
                            <ArrowUp className="w-3 h-3 text-white" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                        <Globe className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Help page</h3>
                        <p className="text-xs text-gray-500">Standalone support portal</p>
                      </div>
                    </div>
                    <Switch
                      checked={helpPageEnabled}
                      onCheckedChange={setHelpPageEnabled}
                      className="data-[state=checked]:bg-orange-600"
                    />
                  </div>

                  <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                    Host your own help page and let users chat directly from it. Perfect for creating a dedicated support hub for your customers.
                  </p>

                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-gray-200 hover:bg-gray-50 text-gray-700"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View live page
                    </Button>

                    <Link href={`/dashboard/widgets/${widgetId}/deploy/help-page`}>
                      <Button
                        size="sm"
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        Manage
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Total Conversations</span>
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
            </div>
            <div className="text-2xl font-semibold text-gray-900">2,847</div>
            <div className="text-xs text-green-600 mt-1">+12.5% from last month</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Avg Response Time</span>
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="text-2xl font-semibold text-gray-900">1.2s</div>
            <div className="text-xs text-green-600 mt-1">-0.3s from last month</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">User Satisfaction</span>
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="text-2xl font-semibold text-gray-900">94.3%</div>
            <div className="text-xs text-green-600 mt-1">+2.1% from last month</div>
          </div>
        </div>
      </div>
    </div>
  );
}
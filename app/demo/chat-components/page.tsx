'use client';

import React, { useState } from 'react';
import ChatWidget from '@/app/components/chat-widget/ChatWidget';
import ChatIframe from '@/app/components/chat-widget/ChatIframe';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';

export default function ChatComponentsDemo() {
  const [showWidget, setShowWidget] = useState(false);
  const [widgetPosition, setWidgetPosition] = useState<'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'>('bottom-right');

  // Real agent data from the deploy page
  const agentId = "XHptkClQCsVUHa8obTrm";
  const workspaceSlug = "rasheed-m";
  const channelId = "p3pLCzxDV3E5DGYWIgOu";

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Next.js Chat Components Demo
          </h1>
          <p className="text-muted-foreground mb-4">
            Demonstration of React/Next.js chat widget and iframe components using real database configuration
          </p>
          <div className="flex gap-4">
            <Link 
              href={`/dashboard/${workspaceSlug}/agents/${agentId}/deploy/chat-widget`}
              className="text-blue-600 hover:text-blue-800 underline text-sm"
            >
              → Configure Widget Settings
            </Link>
            <Link 
              href={`/dashboard/${workspaceSlug}/agents/${agentId}/deploy`}
              className="text-blue-600 hover:text-blue-800 underline text-sm"
            >
              → View Deploy Page
            </Link>
          </div>
        </div>

        <Tabs defaultValue="widget" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="widget">Chat Widget Component</TabsTrigger>
            <TabsTrigger value="iframe">Chat Iframe Component</TabsTrigger>
          </TabsList>

          <TabsContent value="widget" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Chat Widget Component</CardTitle>
                <p className="text-sm text-muted-foreground">
                  A fully-featured React component with built-in chat functionality using dynamic database configuration
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-4">
                  <Button
                    onClick={() => setShowWidget(!showWidget)}
                    variant={showWidget ? "destructive" : "default"}
                  >
                    {showWidget ? 'Hide Widget' : 'Show Widget'}
                  </Button>

                  <select
                    value={widgetPosition}
                    onChange={(e) => setWidgetPosition(e.target.value as 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left')}
                    className="px-3 py-2 border border-border rounded-md bg-background"
                  >
                    <option value="bottom-right">Bottom Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="top-left">Top Left</option>
                  </select>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <h4 className="font-semibold text-purple-900 mb-2">🧪 Testing Responsive Design:</h4>
                  <ul className="text-sm text-purple-800 space-y-1">
                    <li>• <strong>Desktop:</strong> Click &quot;Show Widget&quot; to see the larger chat window</li>
                    <li>• <strong>Mobile:</strong> Use browser dev tools to simulate mobile view</li>
                    <li>• <strong>Positioning:</strong> Try different positions (bottom-right, bottom-left, etc.)</li>
                    <li>• <strong>Responsive Test:</strong> Resize your browser window to see adaptive behavior</li>
                  </ul>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Usage with Dynamic Data:</h4>
                  <pre className="text-sm bg-background p-3 rounded border overflow-x-auto">
{`import ChatWidget from '@/app/components/chat-widget/ChatWidget';

<ChatWidget
  agentId="${agentId}"
  workspaceSlug="${workspaceSlug}"
  channelId="${channelId}"
  baseUrl="http://localhost:3001"
  position="${widgetPosition}"
/>`}
                  </pre>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">✅ Responsive Features:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• <strong>Mobile:</strong> Full-screen chat experience with optimized touch interface</li>
                    <li>• <strong>Desktop:</strong> Larger 384px × 600px chat window for better usability</li>
                    <li>• <strong>Positioning:</strong> Smart positioning that adapts to screen size</li>
                    <li>• <strong>Button Size:</strong> Responsive chat button (48px mobile, 56px desktop)</li>
                    <li>• <strong>Message Bubbles:</strong> Adaptive max-width for better readability</li>
                    <li>• <strong>Close Button:</strong> Always positioned on the same side as chat button</li>
                  </ul>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-900 mb-2">📱 Dynamic Features:</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Loads configuration from database via Firestore</li>
                    <li>• Uses agent settings (model, temperature, instructions)</li>
                    <li>• Applies custom styling (colors, theme, images)</li>
                    <li>• Shows suggested messages from configuration</li>
                    <li>• Connects to backend AI chat API</li>
                    <li>• Real-time streaming responses</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="iframe" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Chat Iframe Component</CardTitle>
                <p className="text-sm text-muted-foreground">
                  A React wrapper for iframe-based chat integration with error handling and loading states
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Usage with Real Data:</h4>
                  <pre className="text-sm bg-background p-3 rounded border overflow-x-auto">
{`import ChatIframe from '@/app/components/chat-widget/ChatIframe';

<ChatIframe
  agentId="${agentId}"
  workspaceSlug="${workspaceSlug}"
  channelId="${channelId}"
  baseUrl="http://localhost:3001"
  width="100%"
  height={600}
  onLoad={() => console.log('Chat loaded')}
  onError={(error) => console.error('Chat error:', error)}
/>`}
                  </pre>
                </div>

                <div className="border border-border rounded-lg overflow-hidden">
                  <ChatIframe
                    agentId={agentId}
                    workspaceSlug={workspaceSlug}
                    channelId={channelId}
                    baseUrl="http://localhost:3001"
                    width="100%"
                    height={500}
                    onLoad={() => console.log('Demo iframe loaded')}
                    onError={(error) => console.error('Demo iframe error:', error)}
                  />
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-900 mb-2">✅ Enhanced Features:</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Loading states with spinner animation</li>
                    <li>• Error handling with retry functionality</li>
                    <li>• Automatic message passing between parent and iframe</li>
                    <li>• Configuration injection on iframe ready</li>
                    <li>• Sandbox security for safe iframe execution</li>
                    <li>• Responsive sizing with smooth transitions</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Migration from JavaScript to TSX Components</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-red-600 mb-3">❌ Old JavaScript Approach</h4>
                <ul className="text-sm space-y-2">
                  <li>• <strong>Static Files:</strong> embed.min.js, test-embed.html</li>
                  <li>• <strong>Manual Configuration:</strong> Hard-coded settings</li>
                  <li>• <strong>No Type Safety:</strong> Vanilla JavaScript</li>
                  <li>• <strong>Limited Styling:</strong> CSS-in-JS only</li>
                  <li>• <strong>Basic Error Handling:</strong> Console logs</li>
                  <li>• <strong>No State Management:</strong> Global variables</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-green-600 mb-3">✅ New TSX Components</h4>
                <ul className="text-sm space-y-2">
                  <li>• <strong>Dynamic Components:</strong> React with TypeScript</li>
                  <li>• <strong>Database Integration:</strong> Real-time configuration</li>
                  <li>• <strong>Type Safety:</strong> Full TypeScript support</li>
                  <li>• <strong>Tailwind Styling:</strong> Modern CSS framework</li>
                  <li>• <strong>Advanced Error Handling:</strong> UI feedback</li>
                  <li>• <strong>React State:</strong> Proper state management</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold text-yellow-900 mb-2">🔄 Migration Complete:</h4>
              <p className="text-sm text-yellow-800">
                All JavaScript-based files have been removed and replaced with modern TSX components that integrate 
                directly with your database configuration from the deploy page. The components now use real agent 
                settings, custom styling, and connect properly with the backend AI chat API.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Show the widget if enabled */}
        {showWidget && (
          <ChatWidget
            agentId={agentId}
            workspaceSlug={workspaceSlug}
            channelId={channelId}
            baseUrl="http://localhost:3001"
            position={widgetPosition}
          />
        )}
      </div>
    </div>
  );
}
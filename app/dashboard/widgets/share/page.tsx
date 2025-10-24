'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingDialog } from '../../../components/ui/loading-dialog';
import {
  Code,
  Copy,
  Check,
  ExternalLink,
  Globe,
  Smartphone,
  Zap,
  Sparkles,
  ArrowLeft,
  Bot,
  AlertCircle,
  FileCode,
  Package
} from 'lucide-react';
import Link from 'next/link';
import { getBusinessWidgets, type ChatWidget } from '@/app/lib/chat-utils';

export default function ShareWidgetPage() {
  const { companyContext } = useAuth();
  const [widgets, setWidgets] = useState<ChatWidget[]>([]);
  const [selectedWidget, setSelectedWidget] = useState<ChatWidget | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (companyContext?.company?.id) {
      loadWidgets();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyContext]);

  const loadWidgets = async () => {
    if (!companyContext?.company?.id) return;

    try {
      setLoading(true);
      const result = await getBusinessWidgets(companyContext.company.id);

      if (result.success) {
        setWidgets(result.data);
        // Auto-select first widget if available
        if (result.data.length > 0) {
          setSelectedWidget(result.data[0]);
        }
      }
    } catch (error) {
      console.error('Error loading widgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, codeType: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(codeType);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getEmbedCode = (widgetId: string) => {
    const baseUrl = window.location.origin;
    return `<!-- Rexa AI Chat Widget -->
<script>
  window.rexaWidgetConfig = {
    widgetId: '${widgetId}',
    baseUrl: '${baseUrl}'
  };
</script>
<script src="${baseUrl}/widget-embed.js" async></script>
<!-- End Rexa AI Chat Widget -->`;
  };

  const getReactCode = (widgetId: string) => {
    const baseUrl = window.location.origin;
    return `import { useEffect } from 'react';

export default function MyApp() {
  useEffect(() => {
    // Load Rexa Widget
    window.rexaWidgetConfig = {
      widgetId: '${widgetId}',
      baseUrl: '${baseUrl}'
    };

    const script = document.createElement('script');
    script.src = '${baseUrl}/widget-embed.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup on unmount
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div>
      {/* Your app content */}
    </div>
  );
}`;
  };

  const getNextJsCode = (widgetId: string) => {
    const baseUrl = window.location.origin;
    return `// app/layout.tsx or pages/_app.tsx
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        
        {/* Rexa AI Chat Widget */}
        <Script id="rexa-widget-config" strategy="beforeInteractive">
          {\`
            window.rexaWidgetConfig = {
              widgetId: '${widgetId}',
              baseUrl: '${baseUrl}'
            };
          \`}
        </Script>
        <Script 
          src="${baseUrl}/widget-embed.js" 
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}`;
  };

  const getWordPressCode = (widgetId: string) => {
    const baseUrl = window.location.origin;
    return `<!-- Add to WordPress Theme Footer (Appearance > Theme Editor > footer.php) -->
<!-- Or use a plugin like "Insert Headers and Footers" -->

<!-- Rexa AI Chat Widget -->
<script>
  window.rexaWidgetConfig = {
    widgetId: '${widgetId}',
    baseUrl: '${baseUrl}'
  };
</script>
<script src="${baseUrl}/widget-embed.js" async></script>
<!-- End Rexa AI Chat Widget -->`;
  };

  const getShopifyCode = (widgetId: string) => {
    const baseUrl = window.location.origin;
    return `<!-- Add to Shopify Theme (Online Store > Themes > Edit Code > theme.liquid) -->
<!-- Paste before closing </body> tag -->

<!-- Rexa AI Chat Widget -->
<script>
  window.rexaWidgetConfig = {
    widgetId: '${widgetId}',
    baseUrl: '${baseUrl}'
  };
</script>
<script src="${baseUrl}/widget-embed.js" async></script>
<!-- End Rexa AI Chat Widget -->`;
  };

  const getDirectLink = (widgetId: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/widget/${widgetId}`;
  };

  if (!companyContext?.company) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-50 to-blue-50/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mx-auto mb-6">
              <Bot className="w-12 h-12 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Set Up Your Company</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Please set up your company before sharing widgets.
            </p>
            <Link href="/dashboard/settings/team">
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all rounded-xl px-8 py-6 text-base">
                Set Up Company
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <LoadingDialog
          open={true}
          message="Loading Widgets"
          submessage="Fetching your widgets for sharing..."
        />
      </div>
    );
  }

  if (widgets.length === 0) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-50 to-blue-50/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mx-auto mb-6">
              <Bot className="w-12 h-12 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">No Widgets Yet</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Create your first widget before you can share it.
            </p>
            <Link href="/dashboard/widgets">
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all rounded-xl px-8 py-6 text-base">
                Create Widget
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-50 to-blue-50/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/widgets">
              <Button variant="outline" size="sm" className="h-10">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
                  <Code className="w-6 h-6 text-white" />
                </div>
                Share Widget
              </h1>
              <p className="text-gray-600">Deploy your chat widget to any platform</p>
            </div>
          </div>
        </div>

        {/* Widget Selector */}
        <Card className="mb-6 bg-white/95 backdrop-blur-md border-0 shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bot className="w-5 h-5 text-blue-600" />
              Select Widget to Share
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex-1 w-full">
                <Select
                  value={selectedWidget?.id}
                  onValueChange={(value) => {
                    const widget = widgets.find(w => w.id === value);
                    setSelectedWidget(widget || null);
                  }}
                >
                  <SelectTrigger className="h-12 border-2 border-gray-200">
                    <SelectValue placeholder="Choose a widget" />
                  </SelectTrigger>
                  <SelectContent>
                    {widgets.map((widget) => (
                      <SelectItem key={widget.id} value={widget.id}>
                        <div className="flex items-center gap-3 py-1">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: widget.primaryColor }}
                          >
                            <Bot className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold">{widget.name}</div>
                            <div className="text-xs text-gray-500">
                              {widget.isActive ? '🟢 Active' : '⚪ Inactive'}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedWidget && (
                <div className="flex gap-2">
                  <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-3 py-1.5">
                    <Sparkles className="w-3 h-3 mr-1" />
                    {selectedWidget.aiConfig?.enabled ? 'AI Enabled' : 'AI Disabled'}
                  </Badge>
                  <Badge className={selectedWidget.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}>
                    {selectedWidget.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              )}
            </div>

            {selectedWidget && !selectedWidget.isActive && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <strong>Widget is inactive:</strong> Activate your widget in the settings before deploying it to your website.
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedWidget && (
          <>
            {/* Integration Methods */}
            <Tabs defaultValue="website" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 h-auto p-1 bg-white/95 backdrop-blur-md border-0 shadow-md">
                <TabsTrigger value="website" className="py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
                  <Globe className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Website</span>
                  <span className="sm:hidden">Web</span>
                </TabsTrigger>
                <TabsTrigger value="react" className="py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
                  <FileCode className="w-4 h-4 mr-2" />
                  React
                </TabsTrigger>
                <TabsTrigger value="nextjs" className="py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
                  <Zap className="w-4 h-4 mr-2" />
                  Next.js
                </TabsTrigger>
                <TabsTrigger value="wordpress" className="py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
                  <Package className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">WordPress</span>
                  <span className="sm:hidden">WP</span>
                </TabsTrigger>
                <TabsTrigger value="shopify" className="py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
                  <Package className="w-4 h-4 mr-2" />
                  Shopify
                </TabsTrigger>
                <TabsTrigger value="direct" className="py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Direct Link</span>
                  <span className="sm:hidden">Link</span>
                </TabsTrigger>
              </TabsList>

              {/* Website/HTML Tab */}
              <TabsContent value="website" className="space-y-4">
                <Card className="bg-white/95 backdrop-blur-md border-0 shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="w-5 h-5 text-blue-600" />
                      HTML/Website Integration
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Add this code to your website before the closing <code className="bg-gray-100 px-2 py-1 rounded text-xs">&lt;/body&gt;</code> tag
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                        <code>{getEmbedCode(selectedWidget.id)}</code>
                      </pre>
                      <Button
                        onClick={() => copyToClipboard(getEmbedCode(selectedWidget.id), 'website')}
                        className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white border-0"
                        size="sm"
                      >
                        {copiedCode === 'website' ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="mt-6 space-y-3">
                      <h4 className="font-semibold text-gray-900">📝 Installation Steps:</h4>
                      <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside">
                        <li>Copy the code snippet above</li>
                        <li>Open your website&apos;s HTML file or template</li>
                        <li>Paste the code before the closing <code className="bg-gray-100 px-2 py-1 rounded">&lt;/body&gt;</code> tag</li>
                        <li>Save and publish your changes</li>
                        <li>The chat widget will appear on your website automatically</li>
                      </ol>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* React Tab */}
              <TabsContent value="react" className="space-y-4">
                <Card className="bg-white/95 backdrop-blur-md border-0 shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileCode className="w-5 h-5 text-blue-600" />
                      React Integration
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Add the widget to your React application
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                        <code>{getReactCode(selectedWidget.id)}</code>
                      </pre>
                      <Button
                        onClick={() => copyToClipboard(getReactCode(selectedWidget.id), 'react')}
                        className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white border-0"
                        size="sm"
                      >
                        {copiedCode === 'react' ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="mt-6 space-y-3">
                      <h4 className="font-semibold text-gray-900">📝 Installation Steps:</h4>
                      <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside">
                        <li>Copy the code snippet above</li>
                        <li>Add it to your main App component or layout</li>
                        <li>The widget will load when the component mounts</li>
                        <li>It will automatically clean up when the component unmounts</li>
                      </ol>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Next.js Tab */}
              <TabsContent value="nextjs" className="space-y-4">
                <Card className="bg-white/95 backdrop-blur-md border-0 shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-blue-600" />
                      Next.js Integration
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Add the widget to your Next.js application using the Script component
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                        <code>{getNextJsCode(selectedWidget.id)}</code>
                      </pre>
                      <Button
                        onClick={() => copyToClipboard(getNextJsCode(selectedWidget.id), 'nextjs')}
                        className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white border-0"
                        size="sm"
                      >
                        {copiedCode === 'nextjs' ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="mt-6 space-y-3">
                      <h4 className="font-semibold text-gray-900">📝 Installation Steps:</h4>
                      <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside">
                        <li>Copy the code snippet above</li>
                        <li>Add it to your <code className="bg-gray-100 px-2 py-1 rounded">app/layout.tsx</code> (App Router) or <code className="bg-gray-100 px-2 py-1 rounded">pages/_app.tsx</code> (Pages Router)</li>
                        <li>The Script component ensures optimal loading performance</li>
                        <li>The widget will be available across all pages</li>
                      </ol>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* WordPress Tab */}
              <TabsContent value="wordpress" className="space-y-4">
                <Card className="bg-white/95 backdrop-blur-md border-0 shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5 text-blue-600" />
                      WordPress Integration
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Add the widget to your WordPress site
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                        <code>{getWordPressCode(selectedWidget.id)}</code>
                      </pre>
                      <Button
                        onClick={() => copyToClipboard(getWordPressCode(selectedWidget.id), 'wordpress')}
                        className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white border-0"
                        size="sm"
                      >
                        {copiedCode === 'wordpress' ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="mt-6 space-y-3">
                      <h4 className="font-semibold text-gray-900">📝 Installation Steps:</h4>
                      <div className="space-y-4">
                        <div>
                          <p className="font-semibold text-sm text-gray-900 mb-2">Method 1: Using Theme Editor</p>
                          <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside ml-4">
                            <li>Go to <strong>Appearance → Theme Editor</strong></li>
                            <li>Find your theme&apos;s <code className="bg-gray-100 px-2 py-1 rounded">footer.php</code> file</li>
                            <li>Paste the code before the closing <code className="bg-gray-100 px-2 py-1 rounded">&lt;/body&gt;</code> tag</li>
                            <li>Click <strong>Update File</strong></li>
                          </ol>
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-gray-900 mb-2">Method 2: Using a Plugin (Recommended)</p>
                          <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside ml-4">
                            <li>Install <strong>&quot;Insert Headers and Footers&quot;</strong> plugin</li>
                            <li>Go to <strong>Settings → Insert Headers and Footers</strong></li>
                            <li>Paste the code in the <strong>Scripts in Footer</strong> section</li>
                            <li>Click <strong>Save</strong></li>
                          </ol>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Shopify Tab */}
              <TabsContent value="shopify" className="space-y-4">
                <Card className="bg-white/95 backdrop-blur-md border-0 shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5 text-blue-600" />
                      Shopify Integration
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Add the widget to your Shopify store
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                        <code>{getShopifyCode(selectedWidget.id)}</code>
                      </pre>
                      <Button
                        onClick={() => copyToClipboard(getShopifyCode(selectedWidget.id), 'shopify')}
                        className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white border-0"
                        size="sm"
                      >
                        {copiedCode === 'shopify' ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="mt-6 space-y-3">
                      <h4 className="font-semibold text-gray-900">📝 Installation Steps:</h4>
                      <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside">
                        <li>Go to <strong>Online Store → Themes</strong></li>
                        <li>Click <strong>Actions → Edit Code</strong> on your active theme</li>
                        <li>Find and open <code className="bg-gray-100 px-2 py-1 rounded">theme.liquid</code> in the Layout folder</li>
                        <li>Paste the code before the closing <code className="bg-gray-100 px-2 py-1 rounded">&lt;/body&gt;</code> tag</li>
                        <li>Click <strong>Save</strong></li>
                        <li>The widget will appear on all pages of your store</li>
                      </ol>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Direct Link Tab */}
              <TabsContent value="direct" className="space-y-4">
                <Card className="bg-white/95 backdrop-blur-md border-0 shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ExternalLink className="w-5 h-5 text-blue-600" />
                      Direct Link
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Share a direct link to your chat widget
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                        <input
                          type="text"
                          value={getDirectLink(selectedWidget.id)}
                          readOnly
                          className="flex-1 bg-transparent border-0 outline-none text-sm font-mono"
                        />
                        <Button
                          onClick={() => copyToClipboard(getDirectLink(selectedWidget.id), 'direct')}
                          variant="outline"
                          size="sm"
                        >
                          {copiedCode === 'direct' ? (
                            <>
                              <Check className="w-4 h-4 mr-2" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 mr-2" />
                              Copy
                            </>
                          )}
                        </Button>
                        <a
                          href={getDirectLink(selectedWidget.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="outline" size="sm">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Open
                          </Button>
                        </a>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-900">💡 Use Cases:</h4>
                        <ul className="space-y-2 text-sm text-gray-700 list-disc list-inside ml-4">
                          <li>Share in emails or SMS to customers</li>
                          <li>Add as a button link on your website</li>
                          <li>Share on social media</li>
                          <li>Test your widget before embedding</li>
                          <li>Use in QR codes for offline marketing</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Testing Guide */}
            <Card className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <Smartphone className="w-5 h-5" />
                  Testing Your Widget
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-blue-800">
                <p className="font-semibold">Before deploying to production:</p>
                <ol className="space-y-2 list-decimal list-inside ml-4">
                  <li>Test the widget on a staging/development site first</li>
                  <li>Check mobile responsiveness on different devices</li>
                  <li>Verify the chat functionality works correctly</li>
                  <li>Ensure AI responses are accurate (if enabled)</li>
                  <li>Test the widget in different browsers (Chrome, Safari, Firefox)</li>
                  <li>Check that the widget doesn&apos;t interfere with other site elements</li>
                </ol>
                <div className="mt-4 p-3 bg-blue-100 rounded-lg border border-blue-300">
                  <p className="font-semibold text-blue-900">💡 Pro Tip:</p>
                  <p className="text-blue-800 mt-1">
                    Use the Direct Link tab to test your widget in a standalone page before embedding it on your site.
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}


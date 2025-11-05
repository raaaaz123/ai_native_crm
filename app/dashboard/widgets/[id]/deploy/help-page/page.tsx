"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Check, Settings, Eye, Code, Palette, Globe, ArrowLeft, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function HelpPage() {
  const params = useParams();
  const widgetId = params.id as string;
  
  const [copied, setCopied] = useState(false);
  const [pageEnabled, setPageEnabled] = useState(true);
  const [pageSettings, setPageSettings] = useState({
    title: "How can I help you today?",
    subtitle: "Ask me anything and I'll do my best to help you find the answer.",
    placeholder: "Ask me anything...",
    theme: "light",
    showSearch: true,
    showCategories: true,
  });

  const handleCopyUrl = () => {
    const pageUrl = "https://help.yourdomain.com";
    navigator.clipboard.writeText(pageUrl);
    setCopied(true);
    toast.success("Page URL copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const pageUrl = "https://help.yourdomain.com";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href={`/dashboard/widgets/${widgetId}/deploy`}>
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Deploy
              </Button>
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
              <Globe className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-gray-900">Help Page</h1>
              <p className="text-gray-600">Configure and customize your standalone help page</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <Card className="bg-white border-0 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900">Page Status</CardTitle>
                  <Switch
                    checked={pageEnabled}
                    onCheckedChange={setPageEnabled}
                    className="data-[state=checked]:bg-orange-600"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${pageEnabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <span className="text-sm text-gray-600">
                    {pageEnabled ? 'Help page is live and accessible' : 'Help page is disabled'}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-sm text-gray-500">Live URL:</span>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-700">{pageUrl}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyUrl}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Configuration Tabs */}
            <Tabs defaultValue="content" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-gray-100">
                <TabsTrigger value="content" className="data-[state=active]:bg-white">
                  <Globe className="w-4 h-4 mr-2" />
                  Content
                </TabsTrigger>
                <TabsTrigger value="appearance" className="data-[state=active]:bg-white">
                  <Palette className="w-4 h-4 mr-2" />
                  Appearance
                </TabsTrigger>
                <TabsTrigger value="settings" className="data-[state=active]:bg-white">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </TabsTrigger>
                <TabsTrigger value="integration" className="data-[state=active]:bg-white">
                  <Code className="w-4 h-4 mr-2" />
                  Integration
                </TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-6 mt-6">
                <Card className="bg-white border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900">Page Content</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Page Title</Label>
                      <Input
                        value={pageSettings.title}
                        onChange={(e) => setPageSettings(prev => ({ ...prev, title: e.target.value }))}
                        className="mt-2"
                        placeholder="Enter page title..."
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700">Subtitle</Label>
                      <Textarea
                        value={pageSettings.subtitle}
                        onChange={(e) => setPageSettings(prev => ({ ...prev, subtitle: e.target.value }))}
                        className="mt-2"
                        rows={3}
                        placeholder="Enter page subtitle..."
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700">Search Placeholder</Label>
                      <Input
                        value={pageSettings.placeholder}
                        onChange={(e) => setPageSettings(prev => ({ ...prev, placeholder: e.target.value }))}
                        className="mt-2"
                        placeholder="Enter search placeholder..."
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Show Search Bar</Label>
                          <p className="text-xs text-gray-500">Display search functionality on the page</p>
                        </div>
                        <Switch
                          checked={pageSettings.showSearch}
                          onCheckedChange={(checked) => setPageSettings(prev => ({ ...prev, showSearch: checked }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Show Categories</Label>
                          <p className="text-xs text-gray-500">Display knowledge base categories</p>
                        </div>
                        <Switch
                          checked={pageSettings.showCategories}
                          onCheckedChange={(checked) => setPageSettings(prev => ({ ...prev, showCategories: checked }))}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="appearance" className="space-y-6 mt-6">
                <Card className="bg-white border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900">Appearance Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Theme</Label>
                      <select 
                        className="w-full mt-2 px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900"
                        value={pageSettings.theme}
                        onChange={(e) => setPageSettings(prev => ({ ...prev, theme: e.target.value }))}
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="auto">Auto</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Primary Color</Label>
                        <div className="mt-2 flex items-center gap-2">
                          <input type="color" className="w-10 h-10 rounded border border-gray-200" defaultValue="#f97316" />
                          <span className="text-sm text-gray-600">#f97316</span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Secondary Color</Label>
                        <div className="mt-2 flex items-center gap-2">
                          <input type="color" className="w-10 h-10 rounded border border-gray-200" defaultValue="#fb923c" />
                          <span className="text-sm text-gray-600">#fb923c</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700">Logo</Label>
                      <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Globe className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Click to upload logo</p>
                        <p className="text-xs text-gray-400">PNG, JPG up to 2MB</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6 mt-6">
                <Card className="bg-white border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900">Page Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Enable Analytics</Label>
                        <p className="text-xs text-gray-500">Track page views and user interactions</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Enable Feedback</Label>
                        <p className="text-xs text-gray-500">Allow users to rate responses</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Enable Chat History</Label>
                        <p className="text-xs text-gray-500">Save conversation history for users</p>
                      </div>
                      <Switch />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="integration" className="space-y-6 mt-6">
                <Card className="bg-white border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900">Integration Options</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Custom Domain</Label>
                      <div className="mt-2 flex items-center gap-2">
                        <Input
                          placeholder="help.yourdomain.com"
                          className="flex-1"
                        />
                        <Button variant="outline" size="sm">
                          Configure DNS
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700">Embed Code</Label>
                      <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <code className="text-sm text-gray-800 break-all">
                          {`<iframe src="${pageUrl}" width="100%" height="600" frameborder="0"></iframe>`}
                        </code>
                      </div>
                      <Button
                        variant="outline"
                        className="mt-3"
                        onClick={() => {
                          navigator.clipboard.writeText(`<iframe src="${pageUrl}" width="100%" height="600" frameborder="0"></iframe>`);
                          toast.success("Embed code copied!");
                        }}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Embed Code
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Preview Panel */}
          <div className="space-y-6">
            <Card className="bg-white border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Live Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative h-96 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg overflow-hidden">
                  {/* Browser Window Preview */}
                  <div className="absolute inset-4 bg-white rounded-lg shadow-lg flex flex-col overflow-hidden">
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

                    {/* Page Content */}
                    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center mb-3">
                        <Globe className="w-6 h-6 text-white" />
                      </div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-2 text-center">
                        {pageSettings.title}
                      </h2>
                      <p className="text-sm text-gray-600 text-center mb-4">
                        {pageSettings.subtitle}
                      </p>
                      <div className="w-full max-w-md">
                        <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                          <input
                            type="text"
                            placeholder={pageSettings.placeholder}
                            className="flex-1 bg-transparent border-0 outline-none text-xs text-gray-900 placeholder:text-gray-400"
                            readOnly
                          />
                          <div className="w-5 h-5 rounded-md bg-orange-500 flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-white border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.open(pageUrl, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Live Page
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleCopyUrl}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      URL Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Page URL
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Page Stats */}
            <Card className="bg-white border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Page Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Page Views</span>
                  <span className="text-lg font-semibold text-gray-900">3,247</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Unique Visitors</span>
                  <span className="text-lg font-semibold text-gray-900">1,892</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Avg Session Time</span>
                  <span className="text-lg font-semibold text-gray-900">2m 34s</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

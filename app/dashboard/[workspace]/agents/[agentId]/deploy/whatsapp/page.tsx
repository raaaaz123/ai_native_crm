'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2, Save, ExternalLink, AlertCircle } from 'lucide-react';
import { useAuth } from '@/app/lib/workspace-auth-context';
import { getAgent, Agent } from '@/app/lib/agent-utils';
import {
  getWhatsAppIntegration,
  saveWhatsAppIntegration,
  WhatsAppConnection
} from '@/app/lib/whatsapp-utils';
import { toast } from 'sonner';

export default function WhatsAppDeployPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceSlug = params.workspace as string;
  const agentId = params.agentId as string;
  const { workspaceContext } = useAuth();
  
  const workspaceId = workspaceContext?.currentWorkspace?.id || '';

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [existingIntegration, setExistingIntegration] = useState<WhatsAppConnection | null>(null);

  // Form state
  const [businessAccountId, setBusinessAccountId] = useState('');
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
  const [baseInstructions, setBaseInstructions] = useState('');

  // Business accounts and phone numbers from API
  const [businessAccounts, setBusinessAccounts] = useState<Array<{ id: string; name: string }>>([]);
  const [phoneNumbers, setPhoneNumbers] = useState<Array<{ id: string; display_phone_number: string; verified_name: string }>>([]);
  const [loadingPhoneNumbers, setLoadingPhoneNumbers] = useState(false);

  useEffect(() => {
    if (!workspaceId || !agentId) return;
    loadData();
  }, [workspaceId, agentId]);

  // Handle OAuth callback from URL params or dashboard redirect
  useEffect(() => {
    const code = searchParams.get('code') || searchParams.get('whatsapp_code');
    const state = searchParams.get('state') || searchParams.get('whatsapp_state');
    const error = searchParams.get('error') || searchParams.get('whatsapp_error');
    const connected = searchParams.get('whatsapp_connected');

    // If redirected from callback API with success
    if (connected === 'true') {
      toast.success('WhatsApp connected successfully!');
      router.replace(`/dashboard/${workspaceSlug}/agents/${agentId}/deploy/whatsapp`);
      loadData();
      return;
    }

    if (error) {
      toast.error(`WhatsApp connection failed: ${error}`);
      router.replace(`/dashboard/${workspaceSlug}/agents/${agentId}/deploy/whatsapp`);
      return;
    }

    if (code && state && workspaceId && agentId) {
      handleOAuthCallback(code, state);
    }
  }, [searchParams, workspaceId, agentId, workspaceSlug, router]);

  const loadData = async () => {
    if (!workspaceId || !agentId) return;

    setLoading(true);
    try {
      // Load agent
      const agentResponse = await getAgent(agentId);
      if (agentResponse.success) {
        setAgent(agentResponse.data);
        
        // Load base instructions from agent settings
        const agent = agentResponse.data;
        let instructions = '';
        
        // Try to get from aiConfig first, then settings
        if (agent.aiConfig?.customSystemPrompt) {
          instructions = agent.aiConfig.customSystemPrompt;
        } else if (agent.aiConfig?.systemPrompt && agent.aiConfig.systemPrompt !== 'support' && agent.aiConfig.systemPrompt !== 'sales' && agent.aiConfig.systemPrompt !== 'booking' && agent.aiConfig.systemPrompt !== 'technical' && agent.aiConfig.systemPrompt !== 'general') {
          instructions = agent.aiConfig.systemPrompt;
        } else if (agent.settings?.systemPrompt) {
          instructions = agent.settings.systemPrompt;
        }
        
        setBaseInstructions(instructions);
      }

      // Load existing WhatsApp integration
      const integration = await getWhatsAppIntegration(workspaceId, agentId);
      if (integration) {
        setExistingIntegration(integration);
        setBusinessAccounts(integration.businessAccounts || []);
        
        if (integration.businessAccountId) {
          setBusinessAccountId(integration.businessAccountId);
          // Load phone numbers for this business account
          await loadPhoneNumbers(integration.businessAccountId);
        }
        if (integration.phoneNumberId) {
          setPhoneNumberId(integration.phoneNumberId);
        }
        if (integration.phoneNumber) {
          setPhoneNumber(integration.phoneNumber);
        }
        if (integration.autoReplyEnabled !== undefined) {
          setAutoReplyEnabled(integration.autoReplyEnabled);
        }
        if (integration.baseInstructions) {
          setBaseInstructions(integration.baseInstructions);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadPhoneNumbers = async (businessAccId: string) => {
    if (!workspaceId || !agentId || !businessAccId) return;

    setLoadingPhoneNumbers(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://git-branch-m-main.onrender.com';
      const response = await fetch(
        `${backendUrl}/api/whatsapp/phone-numbers?workspace_id=${workspaceId}&agent_id=${agentId}&business_account_id=${businessAccId}`
      );

      const data = await response.json();

      if (response.ok && data.success) {
        const numbers = data.data.phone_numbers || [];
        setPhoneNumbers(numbers);
        
        // If no phone number is selected yet and we have numbers, select the first one
        if (!phoneNumberId && numbers.length > 0) {
          setPhoneNumberId(numbers[0].id);
          setPhoneNumber(numbers[0].display_phone_number);
        }
      } else {
        console.error('Failed to load phone numbers:', data.detail || data.error);
        if (response.status !== 404) {
          toast.error('Failed to load phone numbers');
        }
        setPhoneNumbers([]);
      }
    } catch (error) {
      console.error('Error loading phone numbers:', error);
      setPhoneNumbers([]);
    } finally {
      setLoadingPhoneNumbers(false);
    }
  };

  const handleBusinessAccountChange = async (value: string) => {
    setBusinessAccountId(value);
    setPhoneNumberId('');
    setPhoneNumber('');
    await loadPhoneNumbers(value);
  };

  const handleSave = async () => {
    if (!workspaceId || !agentId) {
      toast.error('Workspace or agent not found');
      return;
    }

    if (!phoneNumberId || !baseInstructions.trim()) {
      toast.error('Please select a phone number and provide base instructions');
      return;
    }

    setSaving(true);
    try {
      const success = await saveWhatsAppIntegration(workspaceId, agentId, {
        phoneNumberId,
        phoneNumber,
        businessAccountId,
        autoReplyEnabled,
        baseInstructions: baseInstructions.trim()
      });

      if (success) {
        toast.success('WhatsApp integration saved successfully!');
        // Reload integration data
        await loadData();
      } else {
        toast.error('Failed to save WhatsApp integration');
      }
    } catch (error) {
      console.error('Error saving WhatsApp integration:', error);
      toast.error('Failed to save WhatsApp integration');
    } finally {
      setSaving(false);
    }
  };

  const handleConnect = async (usePopup: boolean = false) => {
    if (!workspaceId || !agentId) {
      toast.error('Workspace or agent not found');
      return;
    }

    setConnecting(true);
    try {
      // Store redirect URL in localStorage for callback
      const redirectUrl = `/dashboard/${workspaceSlug}/agents/${agentId}/deploy/whatsapp`;
      localStorage.setItem('whatsapp_redirect_url', redirectUrl);

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://git-branch-m-main.onrender.com';
      const response = await fetch(`${backendUrl}/api/whatsapp/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspace_id: workspaceId,
          agent_id: agentId,
          workspace_slug: workspaceSlug, // Include slug for callback redirect
          use_popup: usePopup // Use simple page redirect (more reliable than popup)
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (usePopup) {
          // Open OAuth in popup window (like Chatbase)
          const authWindow = window.open(
            data.data.authorization_url,
            'whatsapp-auth',
            'width=600,height=700,scrollbars=yes,resizable=yes'
          );

          if (!authWindow) {
            toast.error('Please allow popups to connect with WhatsApp');
            setConnecting(false);
            return;
          }

          // Listen for OAuth callback message from popup
          const handleMessage = (event: MessageEvent) => {
            // Verify origin for security
            if (event.origin !== window.location.origin) {
              return;
            }

            if (event.data?.type === 'WHATSAPP_CONNECTED') {
              console.log('✅ Received WhatsApp connected message');
              window.removeEventListener('message', handleMessage);
              setConnecting(false);
              setTimeout(() => {
                loadData();
              }, 1000);
            } else if (event.data?.type === 'WHATSAPP_ERROR') {
              console.error('❌ WhatsApp connection error:', event.data.error);
              toast.error(event.data.error || 'Failed to connect WhatsApp');
              window.removeEventListener('message', handleMessage);
              setConnecting(false);
            }
          };

          window.addEventListener('message', handleMessage);

          // Check if popup is closed manually
          const checkClosed = setInterval(() => {
            if (authWindow?.closed) {
              clearInterval(checkClosed);
              window.removeEventListener('message', handleMessage);
              setConnecting(false);
              setTimeout(() => {
                loadData();
              }, 1000);
            }
          }, 1000);

          // Timeout after 5 minutes
          setTimeout(() => {
            clearInterval(checkClosed);
            if (authWindow && !authWindow.closed) {
              authWindow.close();
            }
            window.removeEventListener('message', handleMessage);
            setConnecting(false);
          }, 300000); // 5 minutes
        } else {
          // Page redirect mode (fallback)
          window.location.href = data.data.authorization_url;
        }
      } else {
        const errorMsg = data.detail || 'Failed to initiate WhatsApp connection';
        toast.error(errorMsg);
        
        // If popup mode failed, suggest trying page redirect mode
        if (usePopup && errorMsg.includes('couldn\'t be processed')) {
          console.log('⚠️ Popup mode failed, you may need to configure redirect URIs in Meta Dashboard');
          console.log('💡 Try adding yourself as an Administrator in Meta App Settings → Roles');
        }
        
        setConnecting(false);
        localStorage.removeItem('whatsapp_redirect_url');
      }
    } catch (error) {
      console.error('Error initiating WhatsApp connection:', error);
      toast.error('Failed to initiate WhatsApp connection');
      setConnecting(false);
      localStorage.removeItem('whatsapp_redirect_url');
    }
  };

  const handleOAuthCallback = async (code: string, state: string) => {
    if (!workspaceId || !agentId) return;

    setConnecting(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://git-branch-m-main.onrender.com';
      const response = await fetch(`${backendUrl}/api/whatsapp/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          state,
          workspace_id: workspaceId,
          agent_id: agentId
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('WhatsApp connected successfully!');
        // Clean URL and reload data
        router.replace(`/dashboard/${workspaceSlug}/agents/${agentId}/deploy/whatsapp`);
        await loadData();
      } else {
        toast.error(data.detail || 'Failed to complete WhatsApp connection');
      }
    } catch (error) {
      console.error('Error handling WhatsApp callback:', error);
      toast.error('Failed to complete WhatsApp connection');
    } finally {
      setConnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if WhatsApp is connected
  const isConnected = existingIntegration !== null && existingIntegration.accessToken;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6 sm:p-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push(`/dashboard/${workspaceSlug}/agents/${agentId}/deploy`)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Deploy
          </Button>
          <h1 className="text-3xl font-bold text-foreground mb-2">WhatsApp</h1>
          <p className="text-muted-foreground">
            Connect your AI agent to WhatsApp Business for automated customer messaging.
          </p>
        </div>

        {/* Important Notice */}
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h3 className="font-semibold text-yellow-900">Before You Start</h3>
                <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                  <li>The WhatsApp phone number can only be used by the agent, not on WhatsApp app</li>
                  <li>If you already use the number with WhatsApp, you must delete your account first</li>
                  <li>Disable two-step verification if previously used through Meta Developer</li>
                  <li>Ensure you have an approved display name</li>
                  <li>1000 free messages monthly, payment method needed for more</li>
                </ul>
                <a
                  href="https://business.whatsapp.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-yellow-700 hover:text-yellow-900 inline-flex items-center gap-1"
                >
                  Learn more about WhatsApp Business
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {!isConnected ? (
          // Not connected - show connect button
          <Card>
            <CardContent className="p-8">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Connect WhatsApp Business</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
                    Connect your Meta/Facebook account to enable WhatsApp Business messaging for your AI agent.
                  </p>
                </div>
                <div className="space-y-2">
                  <Button 
                    onClick={() => handleConnect(true)} 
                    disabled={connecting}
                    className="bg-green-600 hover:bg-green-700 w-full"
                  >
                    {connecting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      'Connect WhatsApp Business (Popup)'
                    )}
                  </Button>
                  <Button 
                    onClick={() => handleConnect(false)} 
                    disabled={connecting}
                    variant="outline"
                    className="w-full"
                  >
                    {connecting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      'Connect WhatsApp Business (Page Redirect)'
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    If popup mode fails, try page redirect mode. Make sure redirect URIs are configured in Meta Dashboard.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          // Connected - show configuration
          <>
            {/* WhatsApp Configuration */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>WhatsApp Business Configuration</CardTitle>
                <p className="text-sm text-muted-foreground font-normal mt-1">
                  Configure your WhatsApp Business phone number and auto-reply settings.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="business-account">Business Account</Label>
                  <p className="text-sm text-muted-foreground">
                    Select the WhatsApp Business account to use.
                  </p>
                  {businessAccounts.length === 0 ? (
                    <div className="p-4 border rounded-md bg-blue-50 border-blue-200">
                      <p className="text-sm text-blue-700">No business accounts found. Please set up a WhatsApp Business account first.</p>
                    </div>
                  ) : (
                    <Select value={businessAccountId} onValueChange={handleBusinessAccountChange}>
                      <SelectTrigger id="business-account">
                        <SelectValue placeholder="Select a business account" />
                      </SelectTrigger>
                      <SelectContent>
                        {businessAccounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {businessAccountId && (
                  <div className="space-y-2">
                    <Label htmlFor="phone-number">Phone Number</Label>
                    <p className="text-sm text-muted-foreground">
                      Select the WhatsApp phone number for customer messaging.
                    </p>
                    {loadingPhoneNumbers ? (
                      <div className="flex items-center gap-2 h-10 px-3 py-2 border rounded-md bg-muted">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Loading phone numbers...</span>
                      </div>
                    ) : phoneNumbers.length === 0 ? (
                      <div className="p-4 border rounded-md bg-blue-50 border-blue-200">
                        <p className="text-sm text-blue-700">No phone numbers found. Please add a phone number to your WhatsApp Business account.</p>
                      </div>
                    ) : (
                      <Select
                        value={phoneNumberId}
                        onValueChange={(value) => {
                          const selected = phoneNumbers.find(p => p.id === value);
                          if (selected) {
                            setPhoneNumberId(selected.id);
                            setPhoneNumber(selected.display_phone_number);
                          }
                        }}
                      >
                        <SelectTrigger id="phone-number">
                          <SelectValue placeholder="Select a phone number" />
                        </SelectTrigger>
                        <SelectContent>
                          {phoneNumbers.map((number) => (
                            <SelectItem key={number.id} value={number.id}>
                              {number.display_phone_number} - {number.verified_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}

                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="auto-reply">Enable Auto-Reply</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically respond to WhatsApp messages using your AI agent.
                      </p>
                    </div>
                    <Switch
                      id="auto-reply"
                      checked={autoReplyEnabled}
                      onCheckedChange={setAutoReplyEnabled}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    onClick={handleSave}
                    disabled={saving || !phoneNumberId || !baseInstructions.trim()}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* WhatsApp AI Settings */}
            <Card>
              <CardHeader>
                <CardTitle>WhatsApp AI Settings</CardTitle>
                <p className="text-sm text-muted-foreground font-normal mt-1">
                  Configure how your AI agent behaves when responding to WhatsApp messages.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="base-instructions">Base Instructions</Label>
                  <Textarea
                    id="base-instructions"
                    value={baseInstructions}
                    onChange={(e) => setBaseInstructions(e.target.value)}
                    placeholder="Enter base instructions for your AI agent..."
                    className="min-h-[200px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    These instructions define how your agent responds to WhatsApp messages. Instructions are loaded from your agent setup.
                  </p>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    onClick={handleSave}
                    disabled={saving || !phoneNumberId || !baseInstructions.trim()}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}


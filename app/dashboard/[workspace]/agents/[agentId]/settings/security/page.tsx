'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Shield,
  Lock,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Save,
  Loader2,
  Clock
} from 'lucide-react';
import { useAuth } from '@/app/lib/workspace-auth-context';
import { getAgent, updateAgent, type Agent } from '@/app/lib/agent-utils';
import { toast } from 'sonner';
import Link from 'next/link';

export default function SecuritySettingsPage() {
  const params = useParams();
  const workspaceSlug = params.workspace as string;
  const agentId = params.agentId as string;
  const { workspaceContext } = useAuth();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [originalFormData, setOriginalFormData] = useState({
    requireAuth: true,
    rateLimiting: true,
    rateLimit: 20,
    rateLimitWindow: 240,
    rateLimitMessage: 'Too many messages in a row',
    ipWhitelist: '',
    allowedDomains: '',
    sessionEncryption: true,
    dataRetention: 90,
    logLevel: 'info'
  });
  const [formData, setFormData] = useState({
    requireAuth: true,
    rateLimiting: true,
    rateLimit: 20,
    rateLimitWindow: 240,
    rateLimitMessage: 'Too many messages in a row',
    ipWhitelist: '',
    allowedDomains: '',
    sessionEncryption: true,
    dataRetention: 90,
    logLevel: 'info'
  });

  useEffect(() => {
    loadAgent();
  }, [agentId, workspaceContext]);

  const loadAgent = async () => {
    if (!agentId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await getAgent(agentId);
      
      if (response.success) {
        setAgent(response.data);
        
        // Load security config if it exists
        const agentData = response.data as Agent & { securityConfig?: Record<string, unknown> };
        if (agentData.securityConfig) {
          const loadedData = {
            requireAuth: agentData.securityConfig.requireAuth ?? true,
            rateLimiting: agentData.securityConfig.rateLimiting ?? true,
            rateLimit: agentData.securityConfig.rateLimit ?? 20,
            rateLimitWindow: agentData.securityConfig.rateLimitWindow ?? 240,
            rateLimitMessage: agentData.securityConfig.rateLimitMessage ?? 'Too many messages in a row',
            ipWhitelist: agentData.securityConfig.ipWhitelist ?? '',
            allowedDomains: agentData.securityConfig.allowedDomains ?? '',
            sessionEncryption: agentData.securityConfig.sessionEncryption ?? true,
            dataRetention: agentData.securityConfig.dataRetention ?? 90,
            logLevel: agentData.securityConfig.logLevel ?? 'info'
          };
          setOriginalFormData(loadedData);
          setFormData(loadedData);
        }
      } else {
        console.error('Failed to load agent:', response.error);
        setAgent(null);
      }
    } catch (error) {
      console.error('Error loading agent:', error);
      setAgent(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!agent || !agentId) {
      toast.error('Agent not found');
      return;
    }

    setSaving(true);
    try {
      // Update agent with security config
      const response = await updateAgent(agentId, {
        ...agent,
        securityConfig: formData
      });

      if (response.success) {
        toast.success('Security settings saved successfully!');
        setAgent(response.data);
        // Update original data to reflect saved state
        setOriginalFormData({ ...formData });
      } else {
        throw new Error(response.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    const resetData = {
      requireAuth: true,
      rateLimiting: true,
      rateLimit: 20,
      rateLimitWindow: 240,
      rateLimitMessage: 'Too many messages in a row',
      ipWhitelist: '',
      allowedDomains: '',
      sessionEncryption: true,
      dataRetention: 90,
      logLevel: 'info'
    };
    setFormData(resetData);
    setOriginalFormData(resetData);
    toast.success('Settings reset to defaults');
  };

  // Check if there are unsaved changes
  const hasUnsavedChanges = JSON.stringify(formData) !== JSON.stringify(originalFormData);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading security settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-2 sm:px-3 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <Link href={`/dashboard/${workspaceSlug}/agents/${agentId}/settings`}>
              <Button variant="outline" size="sm" className="border-border hover:bg-accent">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <Button 
              onClick={handleSave} 
              disabled={saving || !hasUnsavedChanges} 
              className="bg-primary hover:bg-primary/90 shadow-lg"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Security</h1>
          <p className="text-muted-foreground">Configure security settings and access control for your agent</p>
        </div>

        <div className="space-y-6">
          {/* Rate Limit */}
          <Card className="border border-border bg-card rounded-lg shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="w-5 h-5" />
                Rate Limit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Limit the number of messages sent from one device on the iframe and chat bubble (this limit will not be applied to you on chatbase.co, only on your website for your users to prevent abuse).
              </p>
              
              <div className="flex items-center justify-between py-2">
                <div className="flex-1">
                  <Label className="text-sm font-medium">Enable Rate Limiting</Label>
                  <p className="text-sm text-muted-foreground">Limit messages per user per time window</p>
                </div>
                <div className="ml-4">
                  <Switch 
                    checked={formData.rateLimiting}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, rateLimiting: checked }))}
                    className="data-[state=checked]:bg-[#10b981] data-[state=unchecked]:bg-neutral-300"
                  />
                </div>
              </div>
              
              {formData.rateLimiting && (
                <>
                  <Separator className="bg-border" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Limit to</Label>
                      <div className="flex items-center gap-2">
                        <Input 
                          type="number" 
                          min="1" 
                          max="1000"
                          value={formData.rateLimit}
                          onChange={(e) => setFormData(prev => ({ ...prev, rateLimit: parseInt(e.target.value) || 20 }))}
                          className="w-20 border-border focus-visible:ring-ring"
                        />
                        <span className="text-sm text-muted-foreground">messages</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Every</Label>
                      <div className="flex items-center gap-2">
                        <Input 
                          type="number" 
                          min="1" 
                          max="3600"
                          value={formData.rateLimitWindow}
                          onChange={(e) => setFormData(prev => ({ ...prev, rateLimitWindow: parseInt(e.target.value) || 240 }))}
                          className="w-20 border-border focus-visible:ring-ring"
                        />
                        <span className="text-sm text-muted-foreground">seconds</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Message to show when limit is hit</Label>
                    <Input 
                      value={formData.rateLimitMessage}
                      onChange={(e) => setFormData(prev => ({ ...prev, rateLimitMessage: e.target.value }))}
                      placeholder="Too many messages in a row"
                      className="border-border focus-visible:ring-ring"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Access Control */}
          <Card className="border border-border bg-card rounded-lg shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="w-5 h-5" />
                Access Control
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div className="flex-1">
                  <Label className="text-sm font-medium">Require Authentication</Label>
                  <p className="text-sm text-muted-foreground">Users must be authenticated to interact with the agent</p>
                </div>
                <div className="ml-4">
                  <Switch 
                    checked={formData.requireAuth}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requireAuth: checked }))}
                    className="data-[state=checked]:bg-[#10b981] data-[state=unchecked]:bg-neutral-300"
                  />
                </div>
              </div>
              
              <Separator className="bg-border" />
              
              <div>
                <Label className="text-sm font-medium mb-2 block">Allowed Domains</Label>
                <Textarea 
                  value={formData.allowedDomains}
                  onChange={(e) => setFormData(prev => ({ ...prev, allowedDomains: e.target.value }))}
                  placeholder="Enter allowed domains, one per line&#10;example.com&#10;*.mydomain.com"
                  rows={3}
                  className="border-border focus-visible:ring-ring"
                />
                <p className="text-xs text-muted-foreground mt-2">Leave empty to allow all domains</p>
              </div>
            </CardContent>
          </Card>

          {/* IP Whitelist */}
          <Card className="border border-border bg-card rounded-lg shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">IP Whitelist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Allowed IP Addresses</Label>
                <Textarea 
                  value={formData.ipWhitelist}
                  onChange={(e) => setFormData(prev => ({ ...prev, ipWhitelist: e.target.value }))}
                  placeholder="Enter IP addresses, one per line&#10;192.168.1.1&#10;10.0.0.0/8"
                  rows={4}
                  className="border-border focus-visible:ring-ring"
                />
                <p className="text-xs text-muted-foreground mt-2">Leave empty to allow all IPs</p>
              </div>
            </CardContent>
          </Card>

          {/* Data Security */}
          <Card className="border border-border bg-card rounded-lg shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lock className="w-5 h-5" />
                Data Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div className="flex-1">
                  <Label className="text-sm font-medium">Session Encryption</Label>
                  <p className="text-sm text-muted-foreground">Encrypt session data in transit</p>
                </div>
                <div className="ml-4">
                  <Switch 
                    checked={formData.sessionEncryption}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, sessionEncryption: checked }))}
                    className="data-[state=checked]:bg-[#10b981] data-[state=unchecked]:bg-neutral-300"
                  />
                </div>
              </div>
              
              <Separator className="bg-border" />
              
              <div>
                <Label className="text-sm font-medium mb-2 block">Data Retention (days)</Label>
                <Input 
                  type="number" 
                  min="1" 
                  max="365"
                  value={formData.dataRetention}
                  onChange={(e) => setFormData(prev => ({ ...prev, dataRetention: parseInt(e.target.value) || 90 }))}
                  className="w-32 border-border focus-visible:ring-ring"
                />
                <p className="text-xs text-muted-foreground mt-2">How long to keep conversation data</p>
              </div>
            </CardContent>
          </Card>

          {/* Reset Button */}
          <div className="flex justify-start pt-4">
            <Button 
              variant="outline" 
              onClick={handleReset}
              className="border-border rounded-lg"
            >
              Reset
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

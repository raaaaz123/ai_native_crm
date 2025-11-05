'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import {
  getNotionConnection,
  disconnectNotion,
  initiateNotionOAuth,
  type NotionConnection
} from '@/app/lib/notion-utils';

interface NotionConnectButtonProps {
  workspaceId: string;
  agentId?: string;
  onConnectionChange?: (connected: boolean) => void;
}

export function NotionConnectButton({
  workspaceId,
  agentId,
  onConnectionChange
}: NotionConnectButtonProps) {
  const [connection, setConnection] = useState<NotionConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  const loadConnection = useCallback(async () => {
    setLoading(true);
    try {
      const conn = await getNotionConnection(workspaceId);
      setConnection(conn);
      onConnectionChange?.(!!conn);
    } catch (error) {
      console.error('Error loading Notion connection:', error);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, onConnectionChange]);

  useEffect(() => {
    loadConnection();
  }, [loadConnection]);

  const handleConnect = () => {
    initiateNotionOAuth(workspaceId, agentId);
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Notion? This will not delete imported content.')) {
      return;
    }

    setDisconnecting(true);
    try {
      const success = await disconnectNotion(workspaceId);
      if (success) {
        setConnection(null);
        onConnectionChange?.(false);
      } else {
        alert('Failed to disconnect Notion. Please try again.');
      }
    } catch (error) {
      console.error('Error disconnecting Notion:', error);
      alert('An error occurred while disconnecting.');
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notion Integration</CardTitle>
          <CardDescription>Loading connection status...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (connection) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Notion Connected</span>
            <Badge variant="default" className="bg-green-500">Active</Badge>
          </CardTitle>
          <CardDescription>
            Connected to: <strong>{connection.notionWorkspaceName}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              You can now import pages and databases from your Notion workspace.
            </p>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDisconnect}
              disabled={disconnecting}
            >
              {disconnecting ? 'Disconnecting...' : 'Disconnect Notion'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connect to Notion</CardTitle>
        <CardDescription>
          Import pages and databases from your Notion workspace to your agent&apos;s knowledge base
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">What you can do:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Import individual Notion pages</li>
              <li>Import entire databases</li>
              <li>Keep your knowledge base synced with Notion content</li>
              <li>Automatically process and embed your content</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Permissions:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Read content from your workspace</li>
              <li>Access pages you select</li>
              <li>View page structure and content</li>
            </ul>
          </div>

          <Button onClick={handleConnect} className="w-full">
            <svg
              className="mr-2 h-4 w-4"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466l1.823 1.447zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933l3.222-.187zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z"/>
            </svg>
            Connect with Notion
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

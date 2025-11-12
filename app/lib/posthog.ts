'use client';

import posthog from 'posthog-js';
import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// Safer properties type to avoid explicit `any` while remaining flexible
type EventProperties = Record<string, unknown>;

// PostHog utility functions
export const posthogClient = typeof window !== 'undefined' ? posthog : null;

// Track page views
export function usePageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname && posthogClient) {
      let url = window.origin + pathname;
      if (searchParams && searchParams.toString()) {
        url = url + '?' + searchParams.toString();
      }
      posthogClient.capture('$pageview', {
        $current_url: url,
      });
    }
  }, [pathname, searchParams]);
}

// Track custom events
export function trackEvent(eventName: string, properties?: EventProperties) {
  if (posthogClient) {
    posthogClient.capture(eventName, properties);
  }
}

// Track user identification
// Use email as distinct_id if available, otherwise use userId
export function identifyUser(userId: string, properties?: EventProperties) {
  if (posthogClient) {
    // Use email as the distinct_id if available, otherwise use userId
    const distinctId = properties?.email || userId;
    posthogClient.identify(distinctId as string, {
      ...properties,
      user_id: userId, // Always include the user_id as a property
    });
  }
}

// Reset user (on logout)
export function resetUser() {
  if (posthogClient) {
    posthogClient.reset();
  }
}

// Major event tracking functions
export const events = {
  // Authentication events
  signUp: (method: string) => trackEvent('user_signed_up', { method }),
  signIn: (method: string) => trackEvent('user_signed_in', { method }),
  signOut: () => trackEvent('user_signed_out'),

  // Workspace events
  workspaceCreated: (workspaceId: string, workspaceName: string) =>
    trackEvent('workspace_created', { workspace_id: workspaceId, workspace_name: workspaceName }),
  workspaceSwitched: (workspaceId: string, workspaceName: string) =>
    trackEvent('workspace_switched', { workspace_id: workspaceId, workspace_name: workspaceName }),

  // Agent events
  agentCreated: (agentId: string, agentName: string) =>
    trackEvent('agent_created', { agent_id: agentId, agent_name: agentName }),
  agentDeleted: (agentId: string) => trackEvent('agent_deleted', { agent_id: agentId }),
  agentDeployed: (agentId: string, channel: string) =>
    trackEvent('agent_deployed', { agent_id: agentId, channel }),

  // Knowledge Base events
  knowledgeBaseItemAdded: (itemType: string, itemId: string) =>
    trackEvent('knowledge_base_item_added', { item_type: itemType, item_id: itemId }),
  knowledgeBaseItemDeleted: (itemId: string) =>
    trackEvent('knowledge_base_item_deleted', { item_id: itemId }),

  // Chat/Conversation events
  conversationStarted: (agentId: string, channel: string) =>
    trackEvent('conversation_started', { agent_id: agentId, channel }),
  messageSent: (agentId: string, messageLength: number) =>
    trackEvent('message_sent', { agent_id: agentId, message_length: messageLength }),
  messageReceived: (agentId: string) => trackEvent('message_received', { agent_id: agentId }),

  // Widget events
  widgetEmbedded: (agentId: string) => trackEvent('widget_embedded', { agent_id: agentId }),
  widgetCustomized: (agentId: string, customizations: string[]) =>
    trackEvent('widget_customized', { agent_id: agentId, customizations }),

  // Settings events
  settingsUpdated: (section: string) => trackEvent('settings_updated', { section }),

  // Navigation events
  buttonClicked: (buttonName: string, location: string) =>
    trackEvent('button_clicked', { button_name: buttonName, location }),
  linkClicked: (linkUrl: string, linkText: string) =>
    trackEvent('link_clicked', { link_url: linkUrl, link_text: linkText }),

  // Form events
  formSubmitted: (formName: string, success: boolean) =>
    trackEvent('form_submitted', { form_name: formName, success }),
  formAbandoned: (formName: string, step: number) =>
    trackEvent('form_abandoned', { form_name: formName, step }),

  // Feature usage
  featureUsed: (featureName: string, context?: EventProperties) =>
    trackEvent('feature_used', { feature_name: featureName, ...context }),

  // Error events
  errorOccurred: (errorMessage: string, errorType: string, context?: EventProperties) =>
    trackEvent('error_occurred', {
      error_message: errorMessage,
      error_type: errorType,
      ...context,
    }),
};


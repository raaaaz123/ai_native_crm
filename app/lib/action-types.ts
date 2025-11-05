export interface AgentAction {
  id: string;
  agentId: string;
  workspaceId: string;
  type: 'collect-leads' | 'custom-button' | 'calendly-slots' | 'custom-action';
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'draft';
  createdAt: Date;
  updatedAt: Date;
  configuration: CollectLeadsConfig | CustomButtonConfig | CalendlyConfig | CustomActionConfig;
}

export interface CollectLeadsConfig {
  general: {
    description: string;
    triggerCondition: string;
  };
  fields: CollectLeadsField[];
  messages: {
    successMessage: string;
    dismissMessage: string;
  };
  channels: {
    chatWidget: boolean;
    helpPage: boolean;
  };
}

export interface CollectLeadsField {
  id: string;
  name: string;
  label: string;
  placeholder: string;
  required: boolean;
  type: 'text' | 'email' | 'phone' | 'textarea';
}

export interface CustomButtonConfig {
  general: {
    actionName: string;
    description: string;
    whenToUse: string;
  };
  button: {
    buttonText: string;
    buttonUrl: string;
    openInNewTab?: boolean;
  };
  channels: {
    chatWidget: boolean;
    helpPage: boolean;
  };
}

export interface CalendlyConfig {
  general: {
    actionName: string;
    description: string;
    whenToUse: string;
  };
  calendly: {
    eventTypeUri: string;  // Selected Calendly event type
    eventTypeName: string;  // Display name of the event
    duration: number;  // Event duration in minutes
  };
  channels: {
    chatWidget: boolean;
    helpPage: boolean;
  };
}

export interface CustomActionConfig {
  // Placeholder for future custom action types
  [key: string]: unknown;
}

export interface CreateActionData {
  type: 'collect-leads' | 'custom-button' | 'calendly-slots' | 'custom-action';
  name: string;
  description: string;
  configuration: CollectLeadsConfig | CustomButtonConfig | CalendlyConfig | CustomActionConfig;
}

export interface UpdateActionData {
  name?: string;
  description?: string;
  status?: 'active' | 'inactive' | 'draft';
  configuration?: Partial<CollectLeadsConfig | CustomButtonConfig | CalendlyConfig | CustomActionConfig>;
}

export interface CollectLeadsSubmission {
  id: string;
  agentId: string;
  actionId: string;
  conversationId?: string;
  data: Record<string, string>;
  submittedAt: Date;
  ipAddress?: string;
  userAgent?: string;
}
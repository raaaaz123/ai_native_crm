
export interface Workspace {
  id: string;
  name: string;
  url: string; // URL slug for the workspace
  description?: string;
  ownerId: string; // User ID of the workspace owner
  createdAt: Date;
  updatedAt: Date;
  settings: {
    primaryColor: string;
    logo?: string;
    timezone: string;
    language: string;
  };
  members: WorkspaceMember[];
  subscription: {
    plan: 'free' | 'pro' | 'enterprise';
    status: 'active' | 'trial' | 'expired' | 'cancelled';
    trialEndsAt?: Date;
    expiresAt?: Date;
  };
}

export interface WorkspaceMember {
  id: string;
  userId: string;
  workspaceId: string;
  role: 'owner' | 'admin' | 'member';
  permissions: string[];
  joinedAt: Date;
  user: {
    id: string;
    email: string;
    displayName: string;
    photoURL?: string;
  };
}

export interface CreateWorkspaceData {
  name: string;
  url: string;
  description?: string;
  settings?: {
    primaryColor?: string;
    timezone?: string;
    language?: string;
  };
}

export interface UpdateWorkspaceData {
  name?: string;
  url?: string;
  description?: string;
  settings?: {
    primaryColor?: string;
    logo?: string;
    timezone?: string;
    language?: string;
  };
}

export interface WorkspaceInvite {
  id: string;
  workspaceId: string;
  email: string;
  role: 'admin' | 'member';
  invitedBy: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  status: 'pending' | 'accepted' | 'expired';
}

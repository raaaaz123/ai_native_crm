export interface Company {
  id: string;
  name: string;
  domain?: string;
  description?: string;
  logo?: string;
  createdAt: number;
  updatedAt: number;
  createdBy: string; // User ID of the admin who created the company
}

export interface CompanyMember {
  id: string;
  companyId: string;
  userId: string;
  email: string;
  role: 'admin' | 'member';
  permissions: Permission[];
  status: 'active' | 'pending' | 'suspended';
  invitedBy?: string; // User ID who invited this member
  invitedAt?: number;
  joinedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface CompanyInvite {
  id: string;
  companyId: string;
  email: string;
  role: 'admin' | 'member';
  permissions: Permission[];
  invitedBy: string; // User ID who sent the invite
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  token: string; // Unique token for invite acceptance
  expiresAt: number;
  createdAt: number;
  updatedAt: number;
}

export type Permission = 
  | 'conversations:read'
  | 'conversations:write'
  | 'conversations:delete'
  | 'reviews:read'
  | 'reviews:write'
  | 'reviews:delete'
  | 'analytics:read'
  | 'settings:read'
  | 'settings:write'
  | 'team:invite'
  | 'team:manage'
  | 'company:manage';

export interface PermissionSet {
  name: string;
  description: string;
  permissions: Permission[];
}

export const PERMISSION_SETS: Record<string, PermissionSet> = {
  admin: {
    name: 'Admin',
    description: 'Full access to all features',
    permissions: [
      'conversations:read',
      'conversations:write',
      'conversations:delete',
      'reviews:read',
      'reviews:write',
      'reviews:delete',
      'analytics:read',
      'settings:read',
      'settings:write',
      'team:invite',
      'team:manage',
      'company:manage'
    ]
  },
  review_manager: {
    name: 'Review Manager',
    description: 'Manage reviews and analytics',
    permissions: [
      'conversations:read',
      'reviews:read',
      'reviews:write',
      'reviews:delete',
      'analytics:read',
      'settings:read'
    ]
  },
  conversation_manager: {
    name: 'Conversation Manager',
    description: 'Manage customer conversations',
    permissions: [
      'conversations:read',
      'conversations:write',
      'conversations:delete',
      'reviews:read',
      'analytics:read',
      'settings:read'
    ]
  },
  viewer: {
    name: 'Viewer',
    description: 'Read-only access to conversations and reviews',
    permissions: [
      'conversations:read',
      'reviews:read',
      'analytics:read'
    ]
  }
};

export interface UserCompanyContext {
  company: Company;
  member: CompanyMember;
  permissions: Permission[];
  isAdmin: boolean;
}

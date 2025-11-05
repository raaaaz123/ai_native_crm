import { useAuth } from './workspace-auth-context';
import { Permission } from './company-types';

export function usePermissions() {
  const { user, workspaceContext } = useAuth();

  const permissions: string[] = (() => {
    const member = workspaceContext?.currentWorkspace?.members?.find(m => m.userId === user?.uid);
    return member?.permissions || [];
  })();

  const adminLike = (() => {
    const member = workspaceContext?.currentWorkspace?.members?.find(m => m.userId === user?.uid);
    const role = member?.role;
    return role === 'admin' || role === 'owner';
  })();

  const hasPermission = (permission: Permission): boolean => {
    return permissions.includes(permission);
  };

  const hasAnyPermission = (perms: Permission[]): boolean => {
    return perms.some(permission => permissions.includes(permission));
  };

  const hasAllPermissions = (perms: Permission[]): boolean => {
    return perms.every(permission => permissions.includes(permission));
  };

  const isAdmin = (): boolean => {
    return adminLike;
  };

  const canManageTeam = (): boolean => {
    return hasPermission('team:manage') || isAdmin();
  };

  const canInviteUsers = (): boolean => {
    return hasPermission('team:invite') || isAdmin();
  };

  const canManageConversations = (): boolean => {
    return hasPermission('conversations:write') || hasPermission('conversations:delete') || isAdmin();
  };

  const canManageReviews = (): boolean => {
    return hasPermission('reviews:write') || hasPermission('reviews:delete') || isAdmin();
  };

  const canViewAnalytics = (): boolean => {
    return hasPermission('analytics:read') || isAdmin();
  };

  const canManageSettings = (): boolean => {
    return hasPermission('settings:write') || isAdmin();
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
    canManageTeam,
    canInviteUsers,
    canManageConversations,
    canManageReviews,
    canViewAnalytics,
    canManageSettings,
    permissions,
    // Compat alias for legacy consumers expecting companyContext shape
    companyContext: { permissions, isAdmin: adminLike } as unknown as { permissions: string[]; isAdmin: boolean }
  };
}

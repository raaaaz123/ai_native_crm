import { useAuth } from './auth-context';
import { Permission } from './company-types';

export function usePermissions() {
  const { companyContext } = useAuth();

  const hasPermission = (permission: Permission): boolean => {
    if (!companyContext) return false;
    return companyContext.permissions.includes(permission);
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    if (!companyContext) return false;
    return permissions.some(permission => companyContext.permissions.includes(permission));
  };

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    if (!companyContext) return false;
    return permissions.every(permission => companyContext.permissions.includes(permission));
  };

  const isAdmin = (): boolean => {
    return companyContext?.isAdmin || false;
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
    permissions: companyContext?.permissions || [],
    companyContext
  };
}

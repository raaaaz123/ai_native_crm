"use client";

import { ReactNode } from 'react';
import { usePermissions } from '../../lib/use-permissions';
import { Permission } from '../../lib/company-types';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Lock } from 'lucide-react';

interface PermissionGuardProps {
  children: ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  fallback?: ReactNode;
  showFallback?: boolean;
}

export function PermissionGuard({ 
  children, 
  permission, 
  permissions = [], 
  requireAll = false,
  fallback,
  showFallback = true
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isAdmin } = usePermissions();

  const hasAccess = () => {
    if (isAdmin()) return true;
    
    if (permission) {
      return hasPermission(permission);
    }
    
    if (permissions.length > 0) {
      return requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions);
    }
    
    return true;
  };

  if (hasAccess()) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showFallback) {
    return null;
  }

  return (
    <Card className="bg-neutral-50 border-neutral-200">
      <CardContent className="p-8 text-center">
        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-neutral-400" />
        </div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          Access Restricted
        </h3>
        <p className="text-neutral-600 mb-4">
          You don&apos;t have permission to access this feature.
        </p>
        <div className="flex items-center justify-center space-x-2 text-sm text-neutral-500">
          <Shield className="w-4 h-4" />
          <span>Contact your administrator for access</span>
        </div>
      </CardContent>
    </Card>
  );
}

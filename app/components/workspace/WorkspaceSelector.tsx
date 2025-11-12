"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../lib/workspace-auth-context';
import {
  ChevronsUpDown,
  Plus,
  Crown,
  Loader2,
  Check
} from 'lucide-react';

interface WorkspaceSelectorProps {
  onCreateWorkspace?: () => void;
}

export function WorkspaceSelector({ onCreateWorkspace }: WorkspaceSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { workspaceContext, switchWorkspace } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleWorkspaceSwitch = async (workspaceId: string) => {
    try {
      await switchWorkspace(workspaceId);
      setIsOpen(false);

      // Find the workspace to get its URL slug
      const workspace = workspaceContext.userWorkspaces.find(w => w.id === workspaceId);
      if (workspace) {
        // Check if current path is workspace-scoped (format: /dashboard/[workspace]/...)
        const workspacePathPattern = /^\/dashboard\/[^\/]+\/.+/;

        if (pathname && workspacePathPattern.test(pathname)) {
          // If on a workspace-scoped page, preserve the page path
          const currentPath = pathname.replace(/^\/dashboard\/[^\/]+/, '') || '';
          const newPath = `/dashboard/${workspace.url}${currentPath}`;
          router.push(newPath);
        } else {
          // If on a non-workspace page (like /dashboard/basic-monthly), go to workspace home
          router.push(`/dashboard/${workspace.url}`);
        }
      }
    } catch (error) {
      console.error('Error switching workspace:', error);
    }
  };

  const currentWorkspace = workspaceContext.currentWorkspace;
  const userWorkspaces = workspaceContext.userWorkspaces;

  if (!currentWorkspace) {
    return (
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-2 px-3 py-2">
          <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
          <span className="text-sm text-gray-500">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-2.5 py-1.5 rounded-md hover:bg-muted/50 transition-colors min-w-0 cursor-pointer border border-transparent hover:border-border"
        suppressHydrationWarning
      >
        <div className="flex items-center space-x-1.5 min-w-0">
          <span className="text-muted-foreground text-sm">/</span>
          <p className="text-base font-medium text-foreground truncate max-w-32">
            {currentWorkspace.name}
          </p>
        </div>
        <ChevronsUpDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 bg-background rounded-lg shadow-xl border border-border py-1.5 z-50">
          {/* Current Workspace Header */}
          <div className="px-3 py-2.5 border-b border-border/50 bg-muted/30">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-primary via-primary/80 to-primary/60 rounded-md flex items-center justify-center text-primary-foreground text-base font-semibold shadow-sm">
                {currentWorkspace.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {currentWorkspace.name}
                </p>
                <div className="flex items-center space-x-1 mt-0.5">
                  <Crown className="w-3 h-3 text-yellow-500" />
                  <span className="text-xs text-muted-foreground">
                    {currentWorkspace.subscription.plan === 'free' ? 'Free' :
                     currentWorkspace.subscription.plan === 'pro' ? 'Pro' : 'Enterprise'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Workspace List */}
          <div className="py-1.5">
            {userWorkspaces.length > 1 && (
              <div className="px-3 py-1.5">
                <p className="text-xs font-medium text-muted-foreground">
                  Switch Workspace
                </p>
              </div>
            )}

            {userWorkspaces.map((workspace) => (
              <button
                key={workspace.id}
                onClick={() => handleWorkspaceSwitch(workspace.id)}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 text-left hover:bg-muted transition-colors ${
                  workspace.id === currentWorkspace.id ? 'bg-primary/10' : ''
                }`}
                suppressHydrationWarning
              >
                <div className="w-7 h-7 bg-gradient-to-br from-muted-foreground/20 to-muted-foreground/10 rounded-md flex items-center justify-center text-foreground text-sm font-semibold">
                  {workspace.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {workspace.name}
                  </p>
                </div>
                {workspace.id === currentWorkspace.id && (
                  <Check className="w-4 h-4 text-primary shrink-0" />
                )}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="border-t border-border/50 py-1.5">
            <button
              onClick={() => {
                onCreateWorkspace?.();
                setIsOpen(false);
              }}
              className="w-full flex items-center space-x-3 px-4 py-2.5 text-left hover:bg-primary/5 transition-colors group"
              suppressHydrationWarning
            >
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Plus className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Create Workspace</p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

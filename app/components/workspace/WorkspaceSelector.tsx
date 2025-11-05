"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../lib/workspace-auth-context';
import { Button } from '@/components/ui/button';
import {
  ChevronsUpDown,
  Plus,
  Settings,
  Users,
  Crown,
  Loader2
} from 'lucide-react';
import Link from 'next/link';

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
        // Get the current page path without the workspace slug
        const currentPath = pathname?.replace(/^\/dashboard\/[^\/]+/, '') || '';
        
        // Navigate to the new workspace URL
        const newPath = `/dashboard/${workspace.url}${currentPath}`;
        router.push(newPath);
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
        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors min-w-0 cursor-pointer"
        suppressHydrationWarning
      >
        <div className="flex items-center space-x-1 min-w-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
          <span className="text-gray-400 text-sm">/</span>
          <p className="text-sm font-medium text-gray-900 truncate max-w-32">
            {currentWorkspace.name}
          </p>
        </div>
        <ChevronsUpDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          {/* Current Workspace Header */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-lg font-semibold">
                {currentWorkspace.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {currentWorkspace.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {currentWorkspace.url}
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  <Crown className="w-3 h-3 text-yellow-500" />
                  <span className="text-xs text-gray-600">
                    {currentWorkspace.subscription.plan === 'free' ? 'Free Plan' : 
                     currentWorkspace.subscription.plan === 'pro' ? 'Pro Plan' : 'Enterprise Plan'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Workspace List */}
          <div className="py-2">
            <div className="px-4 py-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Your Workspaces
              </p>
            </div>
            
            {userWorkspaces.map((workspace) => (
              <button
                key={workspace.id}
                onClick={() => handleWorkspaceSwitch(workspace.id)}
                className={`w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors ${
                  workspace.id === currentWorkspace.id ? 'bg-blue-50' : ''
                }`}
                suppressHydrationWarning
              >
                <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-lg flex items-center justify-center text-white text-sm font-semibold">
                  {workspace.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {workspace.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {workspace.url}
                  </p>
                </div>
                {workspace.id === currentWorkspace.id && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="border-t border-gray-100 py-2">
            <button
              onClick={() => {
                onCreateWorkspace?.();
                setIsOpen(false);
              }}
              className="w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors"
              suppressHydrationWarning
            >
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <Plus className="w-4 h-4 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Create Workspace</p>
                <p className="text-xs text-gray-500">Start a new workspace</p>
              </div>
            </button>

            <Link
              href="/dashboard/settings/workspace"
              className="w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <Settings className="w-4 h-4 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Workspace Settings</p>
                <p className="text-xs text-gray-500">Manage workspace settings</p>
              </div>
            </Link>

            <Link
              href="/dashboard/settings/team"
              className="w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Team Members</p>
                <p className="text-xs text-gray-500">Manage team access</p>
              </div>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

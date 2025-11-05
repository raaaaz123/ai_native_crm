"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/workspace-auth-context';

export default function AgentsRedirectPage() {
  const router = useRouter();
  const { workspaceContext } = useAuth();

  useEffect(() => {
    if (workspaceContext?.currentWorkspace?.url) {
      // Redirect to the workspace-specific agents page
      router.replace(`/dashboard/${workspaceContext.currentWorkspace.url}/agents`);
    } else {
      // If no workspace, redirect to dashboard
      router.replace('/dashboard');
    }
  }, [workspaceContext?.currentWorkspace?.url, router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Redirecting to agents...</p>
      </div>
    </div>
  );
}
"use client";

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../lib/workspace-auth-context';
import { getWorkspace } from '../../lib/workspace-firestore-utils';

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = params.workspace as string;
  const { workspaceContext, switchWorkspace } = useAuth();

  useEffect(() => {
    const loadWorkspaceBySlug = async () => {
      if (!workspaceSlug) return;
      
      // Check if current workspace URL matches the slug
      if (workspaceContext.currentWorkspace?.url === workspaceSlug) {
        return; // Already on the correct workspace
      }
      
      // Find workspace by slug
      const result = await getWorkspace(workspaceSlug);
      if (result.success && result.data) {
        // Switch to this workspace if it's different from current
        if (workspaceContext.currentWorkspace?.id !== result.data.id) {
          await switchWorkspace(result.data.id);
        }
      } else {
        // If workspace not found by slug, redirect to current workspace URL
        if (workspaceContext.currentWorkspace?.url) {
          const currentPath = window.location.pathname.replace(/^\/dashboard\/[^\/]+/, '');
          router.replace(`/dashboard/${workspaceContext.currentWorkspace.url}${currentPath}`);
        }
      }
    };

    loadWorkspaceBySlug();
  }, [workspaceSlug, workspaceContext.currentWorkspace?.id, workspaceContext.currentWorkspace?.url, switchWorkspace, router]);

  return <>{children}</>;
}

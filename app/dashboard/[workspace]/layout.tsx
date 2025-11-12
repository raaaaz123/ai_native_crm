"use client";

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../lib/workspace-auth-context';
import { getWorkspaceBySlug } from '../../lib/workspace-firestore-utils';

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = params.workspace as string;
  const { user, loading, workspaceContext, switchWorkspace } = useAuth();

  useEffect(() => {
    const loadWorkspaceBySlug = async () => {
      // Wait for auth to load
      if (loading) return;
      
      // If not authenticated, redirect to sign in
      if (!user) {
        router.push('/signin');
        return;
      }
      
      if (!workspaceSlug) return;
      
      // Wait for workspace context to load
      if (workspaceContext.loading) return;
      
      // Check if current workspace URL matches the slug
      if (workspaceContext.currentWorkspace?.url === workspaceSlug) {
        return; // Already on the correct workspace
      }
      
      // Find workspace by slug
      const result = await getWorkspaceBySlug(workspaceSlug);
      if (result.success && result.data) {
        // Switch to this workspace if it's different from current
        if (workspaceContext.currentWorkspace?.id !== result.data.id) {
          try {
            await switchWorkspace(result.data.id);
          } catch (error) {
            console.error('Error switching workspace:', error);
            // If switch fails, redirect to sign in
            router.push('/signin');
          }
        }
      } else {
        // If workspace not found by slug, redirect to current workspace URL or dashboard
        if (workspaceContext.currentWorkspace?.url) {
          const currentPath = window.location.pathname.replace(/^\/dashboard\/[^\/]+/, '');
          router.replace(`/dashboard/${workspaceContext.currentWorkspace.url}${currentPath}`);
        } else {
          // If no current workspace, redirect to main dashboard
          router.replace('/dashboard');
        }
      }
    };

    loadWorkspaceBySlug();
  }, [workspaceSlug, user, loading, workspaceContext.currentWorkspace?.id, workspaceContext.currentWorkspace?.url, workspaceContext.loading, switchWorkspace, router]);

  return <>{children}</>;
}

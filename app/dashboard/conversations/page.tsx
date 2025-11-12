"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/lib/workspace-auth-context";
import { LoadingDialog } from "@/app/components/ui/loading-dialog";

/**
 * Legacy conversations page - redirects to workspace-scoped version
 * Kept for backwards compatibility
 */
export default function ConversationsRedirect() {
  const router = useRouter();
  const { workspaceContext, loading } = useAuth();

  useEffect(() => {
    // Redirect to workspace-scoped conversations page
    if (!loading && workspaceContext?.currentWorkspace?.url) {
      router.replace(`/dashboard/${workspaceContext.currentWorkspace.url}/conversations`);
    }
  }, [loading, workspaceContext?.currentWorkspace?.url, router]);

  return (
    <LoadingDialog
      open={true}
      message="Redirecting"
      submessage="Taking you to conversations..."
    />
  );
}

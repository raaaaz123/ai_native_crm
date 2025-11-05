'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SourcesPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = params.workspace as string;
  const agentId = params.agentId as string;

  useEffect(() => {
    // Redirect to files by default
    router.push(`/dashboard/${workspaceSlug}/agents/${agentId}/sources/files`);
  }, [workspaceSlug, agentId, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Sources...</h2>
        <p className="text-gray-600">Redirecting to agent sources</p>
      </div>
    </div>
  );
}

"use client";

import { useAuth } from '../../lib/auth-context';

export function UserDebugInfo() {
  const { user, userData, loading } = useAuth();

  if (loading) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-medium text-yellow-800 mb-2">🐛 Debug Info (Loading...)</h3>
        <p className="text-xs text-yellow-600">Loading user data...</p>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <h3 className="text-sm font-medium text-blue-800 mb-2">🐛 Debug Info</h3>
      
      <div className="space-y-2 text-xs">
        <div>
          <strong className="text-blue-700">Firebase User:</strong>
          <pre className="bg-white p-2 rounded mt-1 overflow-auto max-h-32">
            {JSON.stringify({
              uid: user?.uid,
              email: user?.email,
              displayName: user?.displayName,
              photoURL: user?.photoURL,
              emailVerified: user?.emailVerified
            }, null, 2)}
          </pre>
        </div>
        
        <div>
          <strong className="text-blue-700">Firestore User Data:</strong>
          <pre className="bg-white p-2 rounded mt-1 overflow-auto max-h-32">
            {JSON.stringify(userData, null, 2)}
          </pre>
        </div>
        
        <div className="text-blue-600">
          <strong>Status:</strong> {user ? '✅ Authenticated' : '❌ Not authenticated'}
        </div>
      </div>
    </div>
  );
}

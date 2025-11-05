'use client';

export const dynamic = 'force-dynamic';

import { useAuth } from '@/app/lib/workspace-auth-context';
import { useState } from 'react';
import { db } from '@/app/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function DebugMembershipPage() {
  const { user, workspaceContext } = useAuth();
  const [membershipData, setMembershipData] = useState<{ exists: boolean; data?: unknown; docId?: string; message?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkMembership = async () => {
    if (!user?.uid) {
      setError('No user authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check if user exists in companyMembers collection
      const membersRef = collection(db, 'companyMembers');
      const q = query(membersRef, where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setMembershipData({ exists: false, message: 'User not found in companyMembers collection' });
      } else {
        const memberDoc = querySnapshot.docs[0];
        setMembershipData({
          exists: true,
          data: memberDoc.data(),
          docId: memberDoc.id
        });
      }
    } catch (err: unknown) {
      setError(`Error checking membership: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const addUserToCompany = async () => {
    if (!user?.uid || !workspaceContext?.currentWorkspace?.id) {
      setError('Missing user ID or company ID');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { addDoc, collection } = await import('firebase/firestore');
      
      const memberData = {
        userId: user.uid,
        companyId: workspaceContext.currentWorkspace.id,
        role: 'admin', // Assuming admin role for now
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'companyMembers'), memberData);
      
      setMembershipData({
        exists: true,
        data: memberData,
        docId: docRef.id,
        message: 'Successfully added user to companyMembers collection'
      });
    } catch (err: unknown) {
      setError(`Error adding user to company: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug Company Membership</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">Current User Info:</h2>
          <p><strong>User ID:</strong> {user?.uid || 'Not authenticated'}</p>
          <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">Workspace Context:</h2>
          <p><strong>Workspace ID:</strong> {workspaceContext?.currentWorkspace?.id || 'No workspace'}</p>
          <p><strong>Workspace Name:</strong> {workspaceContext?.currentWorkspace?.name || 'N/A'}</p>
        </div>

        <div className="space-x-4">
          <button
            onClick={checkMembership}
            disabled={loading || !user?.uid}
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'Check Membership'}
          </button>

          <button
            onClick={addUserToCompany}
            disabled={loading || !user?.uid || !workspaceContext?.currentWorkspace?.id || membershipData?.exists}
            className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add to Company'}
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}

        {membershipData && (
          <div className="bg-white border p-4 rounded">
            <h2 className="font-semibold mb-2">Membership Status:</h2>
            <pre className="bg-gray-50 p-2 rounded text-sm overflow-auto">
              {JSON.stringify(membershipData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
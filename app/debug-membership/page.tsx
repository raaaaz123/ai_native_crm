'use client';

import { useAuth } from '@/app/lib/auth-context';
import { useEffect, useState } from 'react';
import { ensureUserMembership, checkUserMembership } from '@/app/lib/ensure-membership';

export default function DebugMembershipPage() {
  const { user, companyContext } = useAuth();
  const [membershipData, setMembershipData] = useState<any>(null);
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
      const result = await checkUserMembership(user.uid);
      
      if (!result.exists) {
        setMembershipData({ exists: false, message: 'User not found in companyMembers collection' });
      } else {
        setMembershipData({
          exists: true,
          data: result.memberData,
          docId: result.memberData?.id
        });
      }
    } catch (err: any) {
      setError(`Error checking membership: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addUserToCompany = async () => {
    if (!user?.uid) {
      setError('Missing user ID');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await ensureUserMembership(user.uid);
      
      if (result.success) {
        if (result.wasAdded) {
          setMembershipData({
            exists: true,
            message: 'Successfully added user to companyMembers collection'
          });
        } else {
          setMembershipData({
            exists: true,
            message: 'User already exists in companyMembers collection'
          });
        }
        
        // Refresh membership data
        await checkMembership();
      } else {
        setError(result.error || 'Failed to ensure membership');
      }
    } catch (err: any) {
      setError(`Error adding user to company: ${err.message}`);
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
          <h2 className="font-semibold mb-2">Company Context:</h2>
          <p><strong>Company ID:</strong> {companyContext?.company?.id || 'No company'}</p>
          <p><strong>Company Name:</strong> {companyContext?.company?.name || 'N/A'}</p>
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
            disabled={loading || !user?.uid || membershipData?.exists}
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
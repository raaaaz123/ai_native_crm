"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../lib/workspace-auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BrandLogo } from '../../components/brand';
import { 
  CheckCircle, 
  XCircle, 
  Users, 
  Shield, 
  Mail,
  Clock,
  AlertCircle
} from 'lucide-react';
import { 
  getCompany, 
  acceptInvite, 
  rejectInvite 
} from '../../lib/company-firestore-utils';
import { Company, CompanyInvite } from '../../lib/company-types';

export default function InviteAcceptancePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [invite, setInvite] = useState<CompanyInvite | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processing, setProcessing] = useState(false);

  const token = params.token as string;

  useEffect(() => {
    if (token) {
      loadInviteData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const loadInviteData = async () => {
    try {
      setLoading(true);
      setError('');

      // Find invite by token
      const { getDocs, query, where, collection } = await import('firebase/firestore');
      const { db } = await import('../../lib/firebase');
      
      const inviteQuery = query(
        collection(db, 'companyInvites'),
        where('token', '==', token),
        where('status', '==', 'pending')
      );
      
      const inviteSnapshot = await getDocs(inviteQuery);
      
      if (inviteSnapshot.empty) {
        setError('Invalid or expired invitation');
        return;
      }

      const inviteDoc = inviteSnapshot.docs[0];
      const inviteData = inviteDoc.data();
      
      // Check if invite is still valid
      if (inviteData.expiresAt < Date.now()) {
        setError('Invitation has expired');
        return;
      }

      const invite: CompanyInvite = {
        id: inviteDoc.id,
        companyId: inviteData.companyId,
        email: inviteData.email,
        role: inviteData.role,
        permissions: inviteData.permissions || [],
        invitedBy: inviteData.invitedBy,
        status: inviteData.status,
        token: inviteData.token,
        expiresAt: inviteData.expiresAt,
        createdAt: inviteData.createdAt?.toMillis() || Date.now(),
        updatedAt: inviteData.updatedAt?.toMillis() || Date.now()
      };

      setInvite(invite);

      // Load company details
      const companyResult = await getCompany(invite.companyId);
      if (companyResult.success && companyResult.data) {
        setCompany(companyResult.data);
      } else {
        setError('Company not found');
      }
    } catch (error) {
      console.error('Error loading invite data:', error);
      setError('Failed to load invitation details');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!user || !user.email || !invite) return;

    // Check if email matches
    if (invite.email !== user.email) {
      setError('This invitation is for a different email address');
      return;
    }

    try {
      setProcessing(true);
      setError('');

      const result = await acceptInvite(invite.id, user.uid, user.email);
      if (result.success) {
        setSuccess('Invitation accepted! Welcome to the team!');
        
        // Redirect to dashboard after a short delay to allow context update
        setTimeout(() => {
          router.push('/dashboard');
          // Force reload to ensure company context is updated
          window.location.href = '/dashboard';
        }, 1500);
      } else {
        setError(result.error || 'Failed to accept invitation');
      }
    } catch (error) {
      console.error('Error accepting invite:', error);
      setError('Failed to accept invitation');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectInvite = async () => {
    if (!invite) return;

    try {
      setProcessing(true);
      setError('');

      const result = await rejectInvite(invite.id);
      if (result.success) {
        setSuccess('Invitation rejected');
        
        // Redirect to signin after a short delay
        setTimeout(() => {
          router.push('/signin');
        }, 2000);
      } else {
        setError(result.error || 'Failed to reject invitation');
      }
    } catch (error) {
      console.error('Error rejecting invite:', error);
      setError('Failed to reject invitation');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error && !invite) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <BrandLogo size="lg" />
            </div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">
              Invalid Invitation
            </h1>
            <p className="text-neutral-600">
              This invitation link is invalid or has expired
            </p>
          </div>

          <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-6">{error}</p>
              <Button onClick={() => router.push('/signin')} className="w-full">
                Go to Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <BrandLogo size="lg" />
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            Team Invitation
          </h1>
          <p className="text-neutral-600">
            You&apos;ve been invited to join a team
          </p>
        </div>

        <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-primary-500" />
              <span>Invitation Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="p-4 bg-status-error-50 border border-status-error-200 rounded-lg">
                <p className="text-status-error-700 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-4 bg-semantic-success-50 border border-semantic-success-200 rounded-lg">
                <p className="text-semantic-success-700 text-sm">{success}</p>
              </div>
            )}

            {company && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <Shield className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900">
                      {company.name}
                    </h3>
                    {company.description && (
                      <p className="text-sm text-neutral-600">{company.description}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-neutral-500" />
                    <span className="text-sm text-neutral-600">Invited as:</span>
                    <span className="text-sm font-medium text-neutral-900 capitalize">
                      {invite?.role}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-neutral-500" />
                    <span className="text-sm text-neutral-600">Expires:</span>
                    <span className="text-sm text-neutral-900">
                      {invite?.expiresAt ? formatDate(invite.expiresAt) : 'Unknown'}
                    </span>
                  </div>
                </div>

                {!user ? (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-700 text-sm mb-3">
                      You need to sign in to accept this invitation.
                    </p>
                    <div className="flex space-x-3">
                      <Button 
                        onClick={() => router.push('/signin')} 
                        className="flex-1"
                      >
                        Sign In
                      </Button>
                      <Button 
                        onClick={() => router.push('/signup')} 
                        variant="outline" 
                        className="flex-1"
                      >
                        Sign Up
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {invite?.email !== user.email && (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-yellow-700 text-sm">
                          This invitation is for {invite?.email}, but you&apos;re signed in as {user.email}.
                        </p>
                      </div>
                    )}

                    <div className="flex space-x-3">
                      <Button
                        onClick={handleAcceptInvite}
                        disabled={processing || invite?.email !== user.email}
                        className="flex-1 bg-green-500 hover:bg-green-600"
                      >
                        {processing ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-2" />
                        )}
                        Accept Invitation
                      </Button>
                      <Button
                        onClick={handleRejectInvite}
                        disabled={processing}
                        variant="outline"
                        className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

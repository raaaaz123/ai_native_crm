"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/layout';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Users, 
  UserPlus, 
  Mail, 
  MoreVertical, 
  Trash2, 
  Crown,
  Shield,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  Copy,
  Link as LinkIcon,
  RefreshCw
} from 'lucide-react';
import {
  getCompanyMembers,
  inviteUserToCompany,
  removeCompanyMember,
  getUserInvites,
  acceptInvite,
  rejectInvite,
  updateAdminPermissions,
  updateMemberPermissions,
  getCompany,
  getCompanyInvites,
  revokeInvite,
  updateInvite,
  updateMemberRoleAndPermissions
} from '../../../lib/company-firestore-utils';
import { CompanyMember, CompanyInvite, Permission, PERMISSION_SETS } from '../../../lib/company-types';
import { PermissionGuard } from '../../../components/auth/PermissionGuard';
import { usePermissions } from '../../../lib/use-permissions';

export default function TeamManagementPage() {
  const router = useRouter();
  const { user, userData, companyContext, createCompany, refreshCompanyContext } = useAuth();
  const { canManageTeam, canInviteUsers } = usePermissions();
  
  // Debug permissions
  console.log('🔐 [Team Management] User permissions:', companyContext?.permissions);
  console.log('🔐 [Team Management] Can manage team:', canManageTeam);
  console.log('🔐 [Team Management] Can invite users:', canInviteUsers);
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [invites, setInvites] = useState<CompanyInvite[]>([]);
  const [receivedInvites, setReceivedInvites] = useState<CompanyInvite[]>([]);
  const [inviteCompanies, setInviteCompanies] = useState<Record<string, any>>({});
  const [sentInvites, setSentInvites] = useState<CompanyInvite[]>([]);
  const [inviteStatusFilter, setInviteStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected' | 'revoked'>('pending');
  const [loadingSentInvites, setLoadingSentInvites] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [editingInvite, setEditingInvite] = useState<CompanyInvite | null>(null);
  const [editInviteRole, setEditInviteRole] = useState<'admin' | 'member'>('member');
  const [editInvitePermissions, setEditInvitePermissions] = useState<Permission[]>([]);
  const [updatingInvite, setUpdatingInvite] = useState(false);
  
  // Edit member state
  const [editingMemberFromInvite, setEditingMemberFromInvite] = useState<CompanyInvite | null>(null);
  const [editMemberRole, setEditMemberRole] = useState<'admin' | 'member'>('member');
  const [editMemberPermissions, setEditMemberPermissions] = useState<Permission[]>([]);
  const [updatingMember, setUpdatingMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [invitesLoading, setInvitesLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Invite form state
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [invitePermissions, setInvitePermissions] = useState<Permission[]>([]);
  const [inviteLoading, setInviteLoading] = useState(false);
  
  // Quick invite state
  const [quickInviteEmail, setQuickInviteEmail] = useState('');
  const [showQuickInviteDialog, setShowQuickInviteDialog] = useState(false);
  const [quickInviteLoading, setQuickInviteLoading] = useState(false);
  
  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'accept' | 'reject' | 'remove';
    title: string;
    message: string;
    action: () => void;
  } | null>(null);
  
  // Permission editing state
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [editingMember, setEditingMember] = useState<CompanyMember | null>(null);
  const [memberPermissions, setMemberPermissions] = useState<Permission[]>([]);
  const [permissionLoading, setPermissionLoading] = useState(false);
  
  // Company creation modal state
  const [showCreateCompanyModal, setShowCreateCompanyModal] = useState(false);
  const [companyFormData, setCompanyFormData] = useState({
    name: '',
    description: '',
    domain: ''
  });
  const [creatingCompany, setCreatingCompany] = useState(false);
  
  // Manual token entry state
  const [showManualTokenEntry, setShowManualTokenEntry] = useState(false);

  // Load team data
  useEffect(() => {
    console.log('Team Management - Company Context:', companyContext);
    if (companyContext?.company.id) {
      loadTeamData();
    } else {
      // If no company context, stop loading but load user invitations
      setLoading(false);
      if (user?.email) {
        loadUserInvitations();
      }
    }
  }, [companyContext, user]);

  // Reload sent invites when filter changes
  useEffect(() => {
    if (companyContext?.company.id && canInviteUsers()) {
      loadSentInvites();
    }
  }, [inviteStatusFilter, companyContext]);

  // Load user invitations when no company
  const loadUserInvitations = async () => {
    if (!user?.email) return;
    
    try {
      setInvitesLoading(true);
      const result = await getUserInvites(user.email);
      
      if (result.success && result.data) {
        setReceivedInvites(result.data);
        
        // Fetch company details for each invite
        const companies: Record<string, any> = {};
        for (const invite of result.data) {
          const companyResult = await getCompany(invite.companyId);
          if (companyResult.success && companyResult.data) {
            companies[invite.companyId] = companyResult.data;
          }
        }
        setInviteCompanies(companies);
      }
    } catch (error) {
      console.error('Error loading user invitations:', error);
    } finally {
      setInvitesLoading(false);
    }
  };

  // Timeout to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        console.log('Team Management - Loading timeout, stopping loading');
        setLoading(false);
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(timer);
  }, [loading]);

  const loadTeamData = async () => {
    if (!companyContext?.company.id) return;

    try {
      setLoading(true);
      setError('');

      // Load company members
      const membersResult = await getCompanyMembers(companyContext.company.id);
      if (membersResult.success && membersResult.data) {
        setMembers(membersResult.data);
      }

      // Load user invites (for current user)
      if (user?.email) {
        const invitesResult = await getUserInvites(user.email);
        if (invitesResult.success && invitesResult.data) {
          setInvites(invitesResult.data);
        }
      }

      // Load sent invitations (for admins)
      if (canInviteUsers()) {
        await loadSentInvites();
      }
    } catch (error) {
      console.error('Error loading team data:', error);
      setError('Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  const loadSentInvites = async () => {
    if (!companyContext?.company.id) return;

    try {
      setLoadingSentInvites(true);
      const result = await getCompanyInvites(companyContext.company.id, inviteStatusFilter);
      
      if (result.success && result.data) {
        setSentInvites(result.data);
      }
    } catch (error) {
      console.error('Error loading sent invites:', error);
    } finally {
      setLoadingSentInvites(false);
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteEmail || !companyContext?.company.id || !user?.uid) {
      setError('Missing required information');
      return;
    }

    try {
      setInviteLoading(true);
      setError('');
      setSuccess('');

      const result = await inviteUserToCompany(
        companyContext.company.id,
        inviteEmail,
        inviteRole,
        invitePermissions,
        user.uid,
        companyContext.company.name,
        userData?.displayName || userData?.firstName || 'Admin'
      );

      if (result.success) {
        setSuccess(`Invitation sent to ${inviteEmail}`);
        setInviteEmail('');
        setInviteRole('member');
        setInvitePermissions([]);
        setShowInviteForm(false);
        loadTeamData(); // Reload to show updated data
        loadSentInvites(); // Reload sent invites
      } else {
        setError(result.error || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Error inviting user:', error);
      setError('Failed to send invitation');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberEmail: string) => {
    if (!companyContext?.company.id || !user?.uid) return;

    showConfirmation(
      'remove',
      'Remove Team Member',
      `Are you sure you want to remove ${memberEmail} from the team? This action cannot be undone.`,
      async () => {
        try {
          const result = await removeCompanyMember(
            companyContext.company.id,
            memberId,
            user.uid
          );

          if (result.success) {
            setSuccess('Member removed successfully');
            loadTeamData();
          } else {
            setError(result.error || 'Failed to remove member');
          }
        } catch (error) {
          console.error('Error removing member:', error);
          setError('Failed to remove member');
        }
      }
    );
  };

  const handleAcceptInvite = async (inviteId: string, companyName?: string) => {
    if (!user?.uid || !user?.email) return;
    
    const userEmail = user.email;

    showConfirmation(
      'accept',
      'Accept Invitation',
      `Are you sure you want to join ${companyName || 'this company'}? You will be added as a team member.`,
      async () => {
        try {
          const result = await acceptInvite(inviteId, user.uid, userEmail);
          if (result.success) {
            setSuccess('Invitation accepted! Welcome to the team!');
            // Reload the page to update company context
            window.location.reload();
          } else {
            setError(result.error || 'Failed to accept invitation');
          }
        } catch (error) {
          console.error('Error accepting invite:', error);
          setError('Failed to accept invitation');
        }
      }
    );
  };

  const handleRejectInvite = async (inviteId: string, companyName?: string) => {
    showConfirmation(
      'reject',
      'Reject Invitation',
      `Are you sure you want to reject the invitation from ${companyName || 'this company'}? This action cannot be undone.`,
      async () => {
        try {
          const result = await rejectInvite(inviteId);
          if (result.success) {
            setSuccess('Invitation rejected');
            loadTeamData();
          } else {
            setError(result.error || 'Failed to reject invitation');
          }
        } catch (error) {
          console.error('Error rejecting invite:', error);
          setError('Failed to reject invitation');
        }
      }
    );
  };

  const handleUpdatePermissions = async () => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      console.log('🔧 [Update Permissions] Starting permission update for user:', user.uid);
      const result = await updateAdminPermissions(user.uid);
      
      if (result.success) {
        setSuccess('Admin permissions updated successfully! Refreshing context...');
        console.log('✅ [Update Permissions] Permissions updated, refreshing company context...');
        
        // Refresh the company context to get updated permissions
        await refreshCompanyContext();
        
        // Reload team data to get updated permissions
        await loadTeamData();
        
        setSuccess('Admin permissions updated successfully! Context refreshed.');
      } else {
        console.error('❌ [Update Permissions] Failed to update permissions:', result.error);
        setError(result.error || 'Failed to update permissions');
      }
    } catch (error) {
      console.error('❌ [Update Permissions] Error updating permissions:', error);
      setError('Failed to update permissions');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!companyFormData.name.trim()) {
      setError('Company name is required');
      return;
    }

    try {
      setCreatingCompany(true);
      setError('');
      setSuccess('');

      await createCompany(
        companyFormData.name.trim(),
        companyFormData.description.trim() || undefined,
        companyFormData.domain.trim() || undefined
      );

      setSuccess('Company created successfully! Refreshing page...');
      setShowCreateCompanyModal(false);
      
      // Refresh the page to load the new company context
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error creating company:', error);
      setError((error as Error).message || 'Failed to create company');
    } finally {
      setCreatingCompany(false);
    }
  };

  const handleCompanyInputChange = (field: string, value: string) => {
    setCompanyFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleQuickInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!quickInviteEmail || !companyContext?.company.id || !user?.uid) {
      setError('Missing required information');
      return;
    }

    try {
      setQuickInviteLoading(true);
      setError('');
      setSuccess('');

      const result = await inviteUserToCompany(
        companyContext.company.id,
        quickInviteEmail,
        'member', // Default to member role for quick invite
        PERMISSION_SETS.member.permissions, // Default member permissions
        user.uid,
        companyContext.company.name,
        userData?.displayName || userData?.firstName || 'Admin'
      );

      if (result.success) {
        setSuccess(`Quick invitation sent to ${quickInviteEmail}`);
        setQuickInviteEmail('');
        setShowQuickInviteDialog(false);
        loadTeamData(); // Reload to show updated data
        loadSentInvites(); // Reload sent invites
      } else {
        setError(result.error || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Error sending quick invite:', error);
      setError('Failed to send invitation');
    } finally {
      setQuickInviteLoading(false);
    }
  };

  const showConfirmation = (type: 'accept' | 'reject' | 'remove', title: string, message: string, action: () => void) => {
    setConfirmAction({ type, title, message, action });
    setShowConfirmDialog(true);
  };

  const handleConfirmAction = () => {
    if (confirmAction) {
      confirmAction.action();
      setShowConfirmDialog(false);
      setConfirmAction(null);
    }
  };

  const handleEditPermissions = (member: CompanyMember) => {
    setEditingMember(member);
    setMemberPermissions([...member.permissions]);
    setShowPermissionDialog(true);
  };

  const handleUpdateMemberPermissions = async () => {
    if (!editingMember || !user?.uid) return;

    try {
      setPermissionLoading(true);
      setError('');
      setSuccess('');

      const result = await updateMemberPermissions(
        editingMember.id,
        memberPermissions,
        user.uid
      );

      if (result.success) {
        setSuccess(`Permissions updated for ${editingMember.email}`);
        setShowPermissionDialog(false);
        setEditingMember(null);
        setMemberPermissions([]);
        loadTeamData(); // Reload to show updated data
      } else {
        setError(result.error || 'Failed to update permissions');
      }
    } catch (error) {
      console.error('Error updating member permissions:', error);
      setError('Failed to update permissions');
    } finally {
      setPermissionLoading(false);
    }
  };

  const togglePermission = (permission: Permission) => {
    setMemberPermissions(prev => 
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const handleRevokeInvite = async (inviteId: string, inviteEmail: string) => {
    if (!user?.uid) return;

    showConfirmation(
      'remove',
      'Revoke Invitation',
      `Are you sure you want to revoke the invitation for ${inviteEmail}? They will no longer be able to join using this invitation.`,
      async () => {
        try {
          const result = await revokeInvite(inviteId, user.uid);
          
          if (result.success) {
            setSuccess(`Invitation revoked for ${inviteEmail}`);
            loadSentInvites(); // Reload sent invites
          } else {
            setError(result.error || 'Failed to revoke invitation');
          }
        } catch (error) {
          console.error('Error revoking invite:', error);
          setError('Failed to revoke invitation');
        }
      }
    );
  };

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setSuccess('Invitation token copied to clipboard!');
    
    // Clear copied state after 2 seconds
    setTimeout(() => {
      setCopiedToken(null);
    }, 2000);
  };

  const handleCopyInviteLink = (token: string) => {
    const inviteLink = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(inviteLink);
    setSuccess('Invitation link copied to clipboard!');
  };

  const handleEditInvite = (invite: CompanyInvite) => {
    setEditingInvite(invite);
    setEditInviteRole(invite.role);
    setEditInvitePermissions(invite.permissions);
  };

  const handleUpdateInvite = async () => {
    if (!editingInvite) return;

    setUpdatingInvite(true);
    try {
      const result = await updateInvite(editingInvite.id, {
        role: editInviteRole,
        permissions: editInvitePermissions
      });

      if (result.success) {
        setSuccess(`Invitation for ${editingInvite.email} updated successfully!`);
        setEditingInvite(null);
        loadSentInvites(); // Reload invites
      } else {
        setError(result.error || 'Failed to update invitation');
      }
    } catch (error) {
      console.error('Error updating invitation:', error);
      setError('Failed to update invitation');
    } finally {
      setUpdatingInvite(false);
    }
  };

  const toggleEditInvitePermission = (permission: Permission) => {
    setEditInvitePermissions(prev => 
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const handleEditMemberFromInvite = async (invite: CompanyInvite) => {
    // Find the actual member by email
    const member = members.find(m => m.email === invite.email);
    if (!member) {
      setError('Member not found');
      return;
    }

    setEditingMemberFromInvite(invite);
    setEditMemberRole(member.role);
    setEditMemberPermissions(member.permissions);
    setEditingMember(member);
  };

  const handleUpdateMemberFromInvite = async () => {
    if (!editingMember || !user?.uid) return;

    setUpdatingMember(true);
    try {
      const result = await updateMemberRoleAndPermissions(
        editingMember.id,
        editMemberRole,
        editMemberPermissions,
        user.uid
      );

      if (result.success) {
        setSuccess(`Permissions updated for ${editingMember.email}`);
        setEditingMemberFromInvite(null);
        setEditingMember(null);
        loadTeamData(); // Reload team data
        loadSentInvites(); // Reload sent invites to show updated info
      } else {
        setError(result.error || 'Failed to update permissions');
      }
    } catch (error) {
      console.error('Error updating member permissions:', error);
      setError('Failed to update permissions');
    } finally {
      setUpdatingMember(false);
    }
  };

  const toggleEditMemberPermission = (permission: Permission) => {
    setEditMemberPermissions(prev => 
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const getStatusBadgeColor = (status: string, expiresAt?: number) => {
    // Check if expired
    if (expiresAt && expiresAt < Date.now()) {
      return 'bg-gray-100 text-gray-800';
    }
    
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'revoked': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string, expiresAt?: number) => {
    if (expiresAt && expiresAt < Date.now()) {
      return <XCircle className="w-3 h-3" />;
    }
    
    switch (status) {
      case 'pending': return <Clock className="w-3 h-3" />;
      case 'accepted': return <CheckCircle className="w-3 h-3" />;
      case 'rejected': return <XCircle className="w-3 h-3" />;
      case 'revoked': return <Trash2 className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="w-4 h-4 text-yellow-600" />;
      case 'member': return <Users className="w-4 h-4 text-blue-600" />;
      default: return <Users className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPermissionSetName = (permissions: Permission[]) => {
    for (const [key, set] of Object.entries(PERMISSION_SETS)) {
      if (JSON.stringify(set.permissions.sort()) === JSON.stringify(permissions.sort())) {
        return set.name;
      }
    }
    return 'Custom';
  };

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
        </div>
      </Container>
    );
  }

  // If user is not a member of any company
  console.log('Team Management - Rendering with companyContext:', companyContext);
  if (!companyContext) {
    return (
      <Container>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Team Management</h1>
          <p className="text-neutral-600">Choose how you'd like to get started with your team</p>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">
              <strong>New to the platform?</strong> You can either create your own company or join an existing one using an invitation.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Create Company */}
          <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-primary-500" />
                <span>Create a Company</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-600 mb-6">
                <strong>For business owners and team leaders:</strong> Create your company profile and start inviting team members to collaborate.
              </p>
              <Dialog open={showCreateCompanyModal} onOpenChange={setShowCreateCompanyModal}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    Create Company
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create Company</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateCompany} className="space-y-4">
                    <div>
                      <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                        Company Name *
                      </label>
                      <Input
                        id="companyName"
                        type="text"
                        value={companyFormData.name}
                        onChange={(e) => handleCompanyInputChange('name', e.target.value)}
                        placeholder="Acme Inc."
                        disabled={creatingCompany}
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="companyDescription" className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        id="companyDescription"
                        value={companyFormData.description}
                        onChange={(e) => handleCompanyInputChange('description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Brief description of your company..."
                        rows={3}
                        disabled={creatingCompany}
                      />
                    </div>

                    <div>
                      <label htmlFor="companyDomain" className="block text-sm font-medium text-gray-700 mb-2">
                        Company Domain
                      </label>
                      <Input
                        id="companyDomain"
                        type="text"
                        value={companyFormData.domain}
                        onChange={(e) => handleCompanyInputChange('domain', e.target.value)}
                        placeholder="acme.com"
                        disabled={creatingCompany}
                      />
                      <p className="text-xs text-gray-500 mt-1">Optional: Your company's website domain</p>
                    </div>

                    <div className="flex space-x-3">
                      <Button
                        type="submit"
                        disabled={creatingCompany}
                        className="flex-1"
                      >
                        {creatingCompany ? 'Creating...' : 'Create Company'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCreateCompanyModal(false)}
                        disabled={creatingCompany}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Join Company */}
          <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-primary-500" />
                <span>Join a Company</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-600 mb-6">
                <strong>For team members:</strong> If you've been invited to join a company, your invitations will appear below.
              </p>

              {/* Received Invitations */}
              {invitesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                  <p className="text-neutral-600 text-sm">Loading invitations...</p>
                </div>
              ) : receivedInvites.length > 0 ? (
                <div className="space-y-4 mb-6">
                  <h3 className="text-sm font-semibold text-neutral-900">Your Invitations ({receivedInvites.length})</h3>
                  {receivedInvites.map((invite) => {
                    const company = inviteCompanies[invite.companyId];
                    return (
                      <div key={invite.id} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <Shield className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-base font-semibold text-neutral-900">
                                {company?.name || 'Company'}
                              </p>
                              {company?.description && (
                                <p className="text-xs text-neutral-600 mt-1 line-clamp-2">
                                  {company.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                {getRoleIcon(invite.role)}
                                <span className="text-xs text-neutral-600">
                                  {invite.role === 'admin' ? 'Admin Role' : 'Member Role'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200 flex-shrink-0">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 border-t border-blue-200">
                          <div className="text-xs text-neutral-600">
                            <span>Invited to: {invite.email}</span>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => handleAcceptInvite(invite.id, company?.name)}
                              className="bg-green-600 hover:bg-green-700 text-white border border-green-700 shadow-lg font-medium"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleRejectInvite(invite.id, company?.name)}
                              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground border border-destructive shadow-lg font-medium"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 px-4 bg-neutral-50 rounded-lg border border-neutral-200 mb-6">
                  <Mail className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                  <p className="text-neutral-600 text-sm font-medium mb-1">No pending invitations</p>
                  <p className="text-neutral-500 text-xs">Invitations from companies will appear here</p>
                </div>
              )}

              {/* Manual Token Entry Section */}
              <div className="pt-4 border-t border-neutral-200">
                <button
                  onClick={() => setShowManualTokenEntry(!showManualTokenEntry)}
                  className="w-full flex items-center justify-between p-3 bg-neutral-50 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-neutral-600" />
                    <span className="text-sm font-medium text-neutral-700">
                      Have an invitation token?
                    </span>
                  </div>
                  <span className="text-xs text-neutral-500">
                    {showManualTokenEntry ? 'Hide' : 'Show'}
                  </span>
                </button>
                
                {showManualTokenEntry && (
                  <div className="mt-3 space-y-3">
                    <div>
                      <label htmlFor="inviteToken" className="block text-sm font-medium text-neutral-700 mb-2">
                        Invitation Token
                      </label>
                      <Input
                        id="inviteToken"
                        type="text"
                        placeholder="Enter invitation token"
                        className="w-full"
                      />
                    </div>
                    <Button 
                      onClick={() => {
                        const token = (document.getElementById('inviteToken') as HTMLInputElement)?.value;
                        if (token) {
                          router.push(`/invite/${token}`);
                        } else {
                          alert('Please enter an invitation token');
                        }
                      }}
                      className="w-full"
                    >
                      Join with Token
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">Team Management</h1>
        <p className="text-neutral-600">Manage your team members and invitations</p>
        
        {/* Debug and Fix Permissions */}
        {companyContext?.member?.role === 'admin' && (
          <div className="mt-4 p-4 bg-primary-50 border border-primary-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-primary-800">Admin Permissions</h3>
                <p className="text-sm text-primary-700">
                  Current permissions: {companyContext.permissions.length} items
                </p>
                {!canManageTeam() && (
                  <div className="mt-2">
                    <p className="text-sm text-destructive font-medium">
                      ⚠️ Missing team management permissions
                    </p>
                    <p className="text-xs text-primary-600 mt-1">
                      Expected: team:manage, team:invite, company:manage
                    </p>
                    <p className="text-xs text-primary-600">
                      Current: {companyContext.permissions.join(', ') || 'None'}
                    </p>
                  </div>
                )}
                {canManageTeam() && (
                  <p className="text-sm text-green-700 mt-1">
                    ✅ All required permissions are present
                  </p>
                )}
              </div>
              <Button
                onClick={handleUpdatePermissions}
                disabled={loading}
                variant="outline"
                size="sm"
                className="bg-primary-100 hover:bg-primary-200 border-primary-300 text-primary-800"
              >
                {loading ? 'Updating...' : 'Edit Permissions'}
              </Button>
            </div>
          </div>
        )}
      </div>

      <PermissionGuard 
        permission="team:manage" 
        fallback={
          <div className="text-center py-12">
            <Shield className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Access Restricted</h3>
            <p className="text-neutral-600">You don&apos;t have permission to manage team members.</p>
          </div>
        }
      >

      {error && (
        <div className="mb-6 p-4 bg-status-error-50 border border-status-error-200 rounded-lg">
          <p className="text-status-error-700 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-semantic-success-50 border border-semantic-success-200 rounded-lg">
          <p className="text-semantic-success-700 text-sm">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Team Members */}
        <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-primary-500" />
                <span>Team Members ({members.length})</span>
              </CardTitle>
              {canInviteUsers() && (
                <Button
                  onClick={() => setShowInviteForm(!showInviteForm)}
                  size="sm"
                  className="bg-primary hover:bg-primary-600 text-primary-foreground border border-primary-700 shadow-lg"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite Member
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                <p className="text-neutral-600 mb-4">No team members yet</p>
                <p className="text-sm text-neutral-500">Invite team members to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-900">
                          {member.email}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          {getRoleIcon(member.role)}
                          <span className="text-xs text-neutral-500">
                            {member.role === 'admin' ? 'Admin' : 'Member'}
                          </span>
                          <Badge className={getStatusColor(member.status)}>
                            {member.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-neutral-500">
                        {getPermissionSetName(member.permissions)}
                      </span>
                      {companyContext?.isAdmin && (
                        <div className="flex items-center space-x-1">
                          <Button
                            size="sm"
                            onClick={() => handleEditPermissions(member)}
                            className="bg-primary hover:bg-primary-600 text-primary-foreground border border-primary-700 shadow-lg"
                            title="Edit Permissions"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {member.userId !== user?.uid && (
                            <Button
                              size="sm"
                              onClick={() => handleRemoveMember(member.id, member.email)}
                              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground border border-destructive shadow-lg"
                              title="Remove Member"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Invite Section */}
        {canInviteUsers() && (
          <Card className="bg-white/80 backdrop-blur-sm border border-white/20 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <UserPlus className="w-5 h-5 text-primary-500" />
                  <span>Quick Invite</span>
                </div>
                <Button
                  onClick={() => setShowQuickInviteDialog(true)}
                  size="sm"
                  className="bg-primary hover:bg-primary-600 text-primary-foreground border border-primary-700 shadow-lg"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Quick Invite
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <p className="text-sm text-neutral-600 mb-2">
                    Invite a new team member by email with default member permissions
                  </p>
                  <div className="flex space-x-2">
                    <Input
                      type="email"
                      placeholder="colleague@company.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="flex-1"
                    />
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member')}
                      className="px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                <Button
                  onClick={() => setShowInviteForm(true)}
                  className="bg-primary hover:bg-primary-600 text-primary-foreground border border-primary-700 shadow-lg"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Advanced Invite
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Invitations */}
        <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="w-5 h-5 text-primary-500" />
              <span>Invitations ({invites.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invites.length === 0 ? (
              <div className="text-center py-8">
                <Mail className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                <p className="text-neutral-600 mb-4">No pending invitations</p>
                <p className="text-sm text-neutral-500">Invitations will appear here when you receive them</p>
              </div>
            ) : (
              <div className="space-y-4">
                {invites.map((invite) => (
                  <div key={invite.id} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Mail className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-neutral-900">
                            Invitation from Company
                          </p>
                          <p className="text-xs text-neutral-500">
                            {invite.email}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-neutral-600">
                        <span className="inline-flex items-center gap-1">
                          {getRoleIcon(invite.role)}
                          {invite.role === 'admin' ? 'Admin' : 'Member'}
                        </span>
                        <span className="mx-2">•</span>
                        <span>{getPermissionSetName(invite.permissions)}</span>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptInvite(invite.id, 'this company')}
                          className="bg-green-600 hover:bg-green-700 text-white border border-green-700 shadow-lg font-medium"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleRejectInvite(invite.id, 'this company')}
                          className="bg-destructive hover:bg-destructive/90 text-destructive-foreground border border-destructive shadow-lg font-medium"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sent Invitations - Admin Only */}
        {canInviteUsers() && (
          <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Mail className="w-5 h-5 text-primary-500" />
                  <span>Sent Invitations ({sentInvites.length})</span>
                </CardTitle>
                <Button
                  onClick={() => loadSentInvites()}
                  size="sm"
                  variant="outline"
                  disabled={loadingSentInvites}
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingSentInvites ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Status Filter Tabs */}
              <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-neutral-200">
                {(['pending', 'accepted', 'rejected', 'revoked', 'all'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setInviteStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      inviteStatusFilter === status
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>

              {loadingSentInvites ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                  <p className="text-neutral-600 text-sm">Loading sent invitations...</p>
                </div>
              ) : sentInvites.length === 0 ? (
                <div className="text-center py-8">
                  <Mail className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                  <p className="text-neutral-600 mb-2">No {inviteStatusFilter === 'all' ? '' : inviteStatusFilter} invitations</p>
                  <p className="text-sm text-neutral-500">
                    {inviteStatusFilter === 'pending' ? 'Invite team members to see them here' : `No ${inviteStatusFilter} invitations found`}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sentInvites.map((invite) => {
                    const isExpired = invite.expiresAt < Date.now();
                    const statusText = isExpired ? 'Expired' : invite.status;
                    
                    return (
                      <div key={invite.id} className="p-4 bg-neutral-50 rounded-lg border border-neutral-200 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-semibold text-neutral-900">
                                {invite.email}
                              </p>
                              <Badge className={getStatusBadgeColor(invite.status, invite.expiresAt)}>
                                {getStatusIcon(invite.status, invite.expiresAt)}
                                <span className="ml-1 capitalize">{statusText}</span>
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-neutral-600">
                              {getRoleIcon(invite.role)}
                              <span>{invite.role === 'admin' ? 'Admin' : 'Member'}</span>
                              <span>•</span>
                              <span>Created {new Date(invite.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        {/* Token Display */}
                        <div className="flex items-center gap-2 mb-3 p-2 bg-white rounded border border-neutral-200">
                          <code className="flex-1 text-xs text-neutral-700 font-mono truncate">
                            {invite.token}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopyToken(invite.token)}
                            className="flex-shrink-0 h-7 px-2"
                            title="Copy Token"
                          >
                            <Copy className={`w-3 h-3 ${copiedToken === invite.token ? 'text-green-600' : 'text-neutral-600'}`} />
                          </Button>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCopyInviteLink(invite.token)}
                            className="flex-1 text-xs"
                          >
                            <LinkIcon className="w-3 h-3 mr-1" />
                            Copy Link
                          </Button>
                          {invite.status === 'pending' && !isExpired && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditInvite(invite)}
                                className="text-blue-600 hover:bg-blue-50 hover:border-blue-300"
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRevokeInvite(invite.id, invite.email)}
                                className="text-red-600 hover:bg-red-50 hover:border-red-300"
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Revoke
                              </Button>
                            </>
                          )}
                          {invite.status === 'accepted' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditMemberFromInvite(invite)}
                              className="text-blue-600 hover:bg-blue-50 hover:border-blue-300"
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Edit Permissions
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Invite Form Modal */}
      <Dialog open={showInviteForm} onOpenChange={setShowInviteForm}>
        <DialogContent className="sm:max-w-md bg-card border-2 border-border shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-card-foreground font-semibold">Invite Team Member</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleInviteUser} className="space-y-4">
            <div>
              <label htmlFor="inviteEmail" className="block text-sm font-medium text-muted-foreground mb-2">
                Email Address *
              </label>
              <Input
                id="inviteEmail"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="border-2 border-border focus:border-primary"
                required
              />
            </div>

            <div>
              <label htmlFor="inviteRole" className="block text-sm font-medium text-muted-foreground mb-2">
                Role
              </label>
              <select
                id="inviteRole"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member')}
                className="w-full px-3 py-2 border-2 border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Permission Set
              </label>
              <select
                value={getPermissionSetName(invitePermissions)}
                onChange={(e) => {
                  const selectedSet = Object.entries(PERMISSION_SETS).find(([_, set]) => set.name === e.target.value);
                  if (selectedSet) {
                    setInvitePermissions(selectedSet[1].permissions);
                  }
                }}
                className="w-full px-3 py-2 border-2 border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
              >
                {Object.entries(PERMISSION_SETS).map(([key, set]) => (
                  <option key={key} value={set.name}>
                    {set.name} - {set.description}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex space-x-3">
              <Button
                type="submit"
                disabled={inviteLoading}
                className="flex-1 bg-primary hover:bg-primary-600 text-primary-foreground border border-primary-700 shadow-lg font-medium"
              >
                {inviteLoading ? 'Sending...' : 'Send Invitation'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowInviteForm(false)}
                className="flex-1 bg-background text-foreground border-2 border-border hover:bg-accent font-medium"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Quick Invite Dialog */}
      <Dialog open={showQuickInviteDialog} onOpenChange={setShowQuickInviteDialog}>
        <DialogContent className="sm:max-w-md bg-card border-2 border-border shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-card-foreground font-semibold">Quick Invite</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleQuickInvite} className="space-y-4">
            <div>
              <label htmlFor="quickInviteEmail" className="block text-sm font-medium text-muted-foreground mb-2">
                Email Address *
              </label>
              <Input
                id="quickInviteEmail"
                type="email"
                value={quickInviteEmail}
                onChange={(e) => setQuickInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="border-2 border-border focus:border-primary"
                required
              />
            </div>
            
            <div className="p-3 bg-primary-50 border-2 border-primary-200 rounded-lg">
              <p className="text-sm text-primary-800 font-medium">
                <strong>Default Settings:</strong> Member role with standard permissions
              </p>
            </div>

            <div className="flex space-x-3">
              <Button
                type="submit"
                disabled={quickInviteLoading}
                className="flex-1 bg-primary hover:bg-primary-600 text-primary-foreground border border-primary-700 shadow-lg font-medium"
              >
                {quickInviteLoading ? 'Sending...' : 'Send Quick Invite'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowQuickInviteDialog(false)}
                className="flex-1 bg-background text-foreground border-2 border-border hover:bg-accent font-medium"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Invitation Dialog (Simplified) */}
      <Dialog open={editingInvite !== null} onOpenChange={() => setEditingInvite(null)}>
        <DialogContent className="sm:max-w-lg bg-card border-2 border-border shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-card-foreground font-semibold">
              Edit Invitation - {editingInvite?.email}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Role Selector */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Role
              </label>
              <select
                value={editInviteRole}
                onChange={(e) => {
                  const newRole = e.target.value as 'admin' | 'member';
                  setEditInviteRole(newRole);
                  // Auto-select permission set based on role
                  if (newRole === 'admin') {
                    setEditInvitePermissions(PERMISSION_SETS.FULL_ACCESS.permissions);
                  }
                }}
                className="w-full px-3 py-2 border-2 border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Permission Sets */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-3">
                Permissions
              </label>
              
              <div className="space-y-2">
                {Object.entries(PERMISSION_SETS).map(([key, set]) => {
                  const isSelected = JSON.stringify([...editInvitePermissions].sort()) === JSON.stringify([...set.permissions].sort());
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setEditInvitePermissions(set.permissions)}
                      className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                        isSelected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-card hover:border-primary-300'
                      }`}
                    >
                      <div className="font-semibold text-base mb-1">{set.name}</div>
                      <div className={`text-sm ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                        {set.description}
                      </div>
                      <div className={`text-xs mt-2 ${isSelected ? 'text-primary-foreground/60' : 'text-muted-foreground/60'}`}>
                        {set.permissions.length} permissions
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 text-sm text-muted-foreground">
                {editInvitePermissions.length} permissions selected
              </div>
            </div>

            <div className="flex space-x-3 pt-4 border-t border-border">
              <Button
                onClick={handleUpdateInvite}
                disabled={updatingInvite}
                className="flex-1 bg-primary hover:bg-primary-600 text-primary-foreground"
              >
                {updatingInvite ? 'Updating...' : 'Update Invitation'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingInvite(null)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Member Permissions Dialog (Simplified) */}
      <Dialog open={editingMemberFromInvite !== null} onOpenChange={() => {
        setEditingMemberFromInvite(null);
        setEditingMember(null);
      }}>
        <DialogContent className="sm:max-w-lg bg-card border-2 border-border shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-card-foreground font-semibold">
              Edit Permissions - {editingMember?.email}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Role Selector */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Role
              </label>
              <select
                value={editMemberRole}
                onChange={(e) => {
                  const newRole = e.target.value as 'admin' | 'member';
                  setEditMemberRole(newRole);
                  // Auto-select permission set based on role
                  if (newRole === 'admin') {
                    setEditMemberPermissions(PERMISSION_SETS.FULL_ACCESS.permissions);
                  }
                }}
                className="w-full px-3 py-2 border-2 border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Permission Sets */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-3">
                Permissions
              </label>
              
              <div className="space-y-2">
                {Object.entries(PERMISSION_SETS).map(([key, set]) => {
                  const isSelected = JSON.stringify([...editMemberPermissions].sort()) === JSON.stringify([...set.permissions].sort());
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setEditMemberPermissions(set.permissions)}
                      className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                        isSelected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-card hover:border-primary-300'
                      }`}
                    >
                      <div className="font-semibold text-base mb-1">{set.name}</div>
                      <div className={`text-sm ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                        {set.description}
                      </div>
                      <div className={`text-xs mt-2 ${isSelected ? 'text-primary-foreground/60' : 'text-muted-foreground/60'}`}>
                        {set.permissions.length} permissions
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 text-sm text-muted-foreground">
                {editMemberPermissions.length} permissions selected
              </div>
            </div>

            <div className="flex space-x-3 pt-4 border-t border-border">
              <Button
                onClick={handleUpdateMemberFromInvite}
                disabled={updatingMember}
                className="flex-1 bg-primary hover:bg-primary-600 text-primary-foreground"
              >
                {updatingMember ? 'Updating...' : 'Update Permissions'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingMemberFromInvite(null);
                  setEditingMember(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md bg-card border-2 border-border shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-card-foreground">
              {confirmAction?.type === 'accept' && <CheckCircle className="w-5 h-5 text-green-600" />}
              {confirmAction?.type === 'reject' && <XCircle className="w-5 h-5 text-destructive" />}
              {confirmAction?.type === 'remove' && <Trash2 className="w-5 h-5 text-destructive" />}
              <span className="font-semibold">{confirmAction?.title}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {confirmAction?.message}
            </p>
            <div className="flex space-x-3">
              <Button
                onClick={handleConfirmAction}
                className={`flex-1 text-white font-medium shadow-lg ${
                  confirmAction?.type === 'accept' 
                    ? 'bg-green-600 hover:bg-green-700 border border-green-700' 
                    : confirmAction?.type === 'reject' || confirmAction?.type === 'remove'
                    ? 'bg-destructive hover:bg-destructive/90 border border-destructive'
                    : 'bg-primary hover:bg-primary-600 border border-primary-700'
                }`}
              >
                {confirmAction?.type === 'accept' && 'Accept'}
                {confirmAction?.type === 'reject' && 'Reject'}
                {confirmAction?.type === 'remove' && 'Remove'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 bg-background text-foreground border-2 border-border hover:bg-accent font-medium"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Permission Edit Dialog */}
      <Dialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
        <DialogContent className="sm:max-w-2xl bg-card border-2 border-border shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-card-foreground font-semibold">
              Edit Permissions - {editingMember?.email}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(PERMISSION_SETS).map(([key, set]) => (
                <div key={key} className="space-y-2">
                  <h4 className="text-sm font-medium text-card-foreground">{set.name}</h4>
                  <p className="text-xs text-muted-foreground">{set.description}</p>
                  <div className="space-y-1">
                    {set.permissions.map((permission) => (
                      <label key={permission} className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          checked={memberPermissions.includes(permission)}
                          onChange={() => togglePermission(permission)}
                          className="rounded border-border focus:ring-primary"
                        />
                        <span className="text-muted-foreground">{permission}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div className="text-sm text-muted-foreground">
                {memberPermissions.length} permissions selected
              </div>
              <div className="flex space-x-3">
                <Button
                  onClick={handleUpdateMemberPermissions}
                  disabled={permissionLoading}
                  className="bg-primary hover:bg-primary-600 text-primary-foreground border border-primary-700 shadow-lg font-medium"
                >
                  {permissionLoading ? 'Updating...' : 'Update Permissions'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowPermissionDialog(false)}
                  className="bg-background text-foreground border-2 border-border hover:bg-accent font-medium"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      </PermissionGuard>

    </Container>
  );
}

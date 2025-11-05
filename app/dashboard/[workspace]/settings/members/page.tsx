"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/lib/workspace-auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Container } from '@/components/layout';
import {
  Users,
  UserPlus,
  Mail,
  Trash2,
  Crown,
  Shield,
  AlertCircle,
  Loader2,
  Search
} from 'lucide-react';
import { getWorkspaceMembers, removeWorkspaceMember } from '@/app/lib/workspace-firestore-utils';
import { WorkspaceMember } from '@/app/lib/workspace-types';
import Image from 'next/image';

export default function WorkspaceMembersSettingsPage() {
  const { user, workspaceContext } = useAuth();
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);

  const currentWorkspace = workspaceContext?.currentWorkspace;

  useEffect(() => {
    if (currentWorkspace) {
      loadMembers();
    }
  }, [currentWorkspace]);

  const loadMembers = async () => {
    if (!currentWorkspace) return;

    try {
      setLoading(true);
      setError('');

      const result = await getWorkspaceMembers(currentWorkspace.id);
      if (result.success && result.data) {
        setMembers(result.data);
      } else {
        setError(result.error || 'Failed to load members');
      }
    } catch (error) {
      console.error('Error loading members:', error);
      setError('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteEmail || !currentWorkspace || !user) {
      setError('Missing required information');
      return;
    }

    try {
      setInviteLoading(true);
      setError('');
      setSuccess('');

      // TODO: Implement invite functionality
      setSuccess(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
    } catch (error) {
      console.error('Error inviting member:', error);
      setError('Failed to send invitation');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberEmail: string) => {
    if (!currentWorkspace || !user) return;

    if (!confirm(`Are you sure you want to remove ${memberEmail} from the workspace?`)) {
      return;
    }

    try {
      setError('');
      setSuccess('');

      // Extract userId from memberId (format: userId_workspaceId)
      const userId = memberId.split('_')[0];
      const result = await removeWorkspaceMember(currentWorkspace.id, userId);

      if (result.success) {
        setSuccess('Member removed successfully');
        loadMembers();
      } else {
        setError(result.error || 'Failed to remove member');
      }
    } catch (error) {
      console.error('Error removing member:', error);
      setError('Failed to remove member');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-yellow-600" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-blue-600" />;
      case 'member':
        return <Users className="w-4 h-4 text-gray-600" />;
      default:
        return <Users className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'admin':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'member':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredMembers = members.filter(member =>
    member.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.user?.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!currentWorkspace) {
    return (
      <Container>
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">No Workspace Selected</h2>
          <p className="text-muted-foreground">Please select a workspace to manage its members.</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Team Members</h1>
        <p className="text-muted-foreground">
          Manage your workspace team members and invitations
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Members List */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-sm bg-card rounded-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Team Members ({filteredMembers.length})
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Manage your workspace team members
                  </CardDescription>
                </div>
              </div>

              {/* Search Bar */}
              <div className="mt-4 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search members by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-10 h-10 text-primary mx-auto mb-3 animate-spin" />
                  <p className="text-muted-foreground text-sm">Loading members...</p>
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">
                    {searchQuery ? 'No members found' : 'No team members yet'}
                  </p>
                  {!searchQuery && (
                    <p className="text-sm text-muted-foreground">
                      Invite team members to get started
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {member.user?.photoURL ? (
                          <Image
                            src={member.user.photoURL}
                            alt={member.user.displayName || 'User'}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-full border-2 border-border"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-white font-bold text-sm rounded-full border-2 border-border">
                            {member.user?.displayName?.charAt(0) || member.user?.email?.charAt(0) || 'U'}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">
                            {member.user?.displayName || member.user?.email || 'Unknown User'}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {member.user?.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge className={`${getRoleBadgeColor(member.role)} flex items-center gap-1`}>
                          {getRoleIcon(member.role)}
                          <span className="capitalize">{member.role}</span>
                        </Badge>

                        {member.role !== 'owner' && member.userId !== user?.uid && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveMember(member.id, member.user?.email || '')}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Invite Member */}
        <div>
          <Card className="border-0 shadow-sm bg-card rounded-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                Invite Member
              </CardTitle>
              <CardDescription>
                Add new members to your workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInviteMember} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="inviteEmail" className="text-sm font-medium text-foreground">
                    Email Address
                  </label>
                  <Input
                    id="inviteEmail"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    className="w-full"
                    disabled={inviteLoading}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={inviteLoading || !inviteEmail}
                  className="w-full bg-foreground hover:bg-foreground/90 text-background"
                >
                  {inviteLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Send Invitation
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t">
                <h4 className="text-sm font-semibold text-foreground mb-2">Invitation Info</h4>
                <p className="text-xs text-muted-foreground">
                  Invited members will receive an email with a link to join your workspace.
                  They will have member access by default.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Workspace Stats */}
          <Card className="border-0 shadow-sm bg-card rounded-xl mt-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-foreground">Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">Total Members</span>
                <span className="text-lg font-bold text-foreground">{members.length}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-t">
                <span className="text-sm text-muted-foreground">Admins</span>
                <span className="text-lg font-bold text-foreground">
                  {members.filter(m => m.role === 'admin' || m.role === 'owner').length}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-t">
                <span className="text-sm text-muted-foreground">Members</span>
                <span className="text-lg font-bold text-foreground">
                  {members.filter(m => m.role === 'member').length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Container>
  );
}

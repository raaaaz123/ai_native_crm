"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/workspace-auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/layout';
import { Badge } from '@/components/ui/badge';
import { LoadingDialog } from '../../components/ui/loading-dialog';
import { Users, Settings, Shield, Crown, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { getSubscriptionInfo, getPlanFeatures } from '@/app/lib/subscription-utils';

export default function SettingsPage() {
  const router = useRouter();
  const { user, userData, updateUserData, workspaceContext } = useAuth();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    displayName: ''
  });

  // Load user data when component mounts
  useEffect(() => {
    if (userData) {
      setFormData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        displayName: userData.displayName || ''
      });
      setPageLoading(false);
    }
  }, [userData]);

  // Show loading state while user data is loading
  if (pageLoading && !userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <LoadingDialog 
          open={true}
          message="Loading Settings" 
          submessage="Fetching your profile information..."
        />
      </div>
    );
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName) {
      setError('First name and last name are required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        displayName: `${formData.firstName} ${formData.lastName}`.trim()
      };

      await updateUserData(updateData);
      setSuccess('Profile updated successfully!');
    } catch (error: unknown) {
      setError((error as Error).message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (userData) {
      setFormData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        displayName: userData.displayName || ''
      });
    }
    setError('');
    setSuccess('');
  };

  // Calculate user since duration
  const getUserSince = () => {
    if (!userData?.createdAt) return 'Unknown';
    
    let createdDate: Date;
    const createdAt = userData.createdAt;
    
    // Handle different timestamp formats
    if (createdAt instanceof Date) {
      createdDate = createdAt;
    } else if (typeof createdAt === 'object' && 'toDate' in createdAt && typeof createdAt.toDate === 'function') {
      createdDate = createdAt.toDate();
    } else if (typeof createdAt === 'number') {
      createdDate = new Date(createdAt);
    } else if (typeof createdAt === 'string') {
      createdDate = new Date(createdAt);
    } else {
      return 'Unknown';
    }
    
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day';
    if (diffDays < 7) return `${diffDays} days`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''}`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''}`;
    return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? 's' : ''}`;
  };

  // Format date for display
  const formatDate = (date: unknown) => {
    if (!date) return 'Unknown';
    try {
      let dateObj: Date;
      
      if (date instanceof Date) {
        dateObj = date;
      } else if (typeof date === 'object' && date !== null && 'toDate' in date && typeof date.toDate === 'function') {
        dateObj = date.toDate();
      } else if (typeof date === 'number' || typeof date === 'string') {
        dateObj = new Date(date);
      } else {
        return 'Unknown';
      }
      
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <Container>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground mb-1">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Information - Main Card */}
        <div className="space-y-5">
          <Card className="border-0 shadow-sm bg-card rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-foreground">Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700 text-sm">{success}</p>
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-foreground mb-1.5">
                      First Name *
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring transition-all bg-background text-foreground"
                      placeholder="John"
                      disabled={loading}
                      suppressHydrationWarning={true}
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-foreground mb-1.5">
                      Last Name *
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring transition-all bg-background text-foreground"
                      placeholder="Doe"
                      disabled={loading}
                      suppressHydrationWarning={true}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-muted text-muted-foreground cursor-not-allowed"
                    placeholder="john@example.com"
                    suppressHydrationWarning={true}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                </div>

                <div className="flex gap-3 pt-1">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-foreground hover:bg-foreground/90 text-background"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    disabled={loading}
                    className="flex-1 border-border hover:bg-accent"
                  >
                    Reset
                  </Button>
                </div>
              </form>
                </CardContent>
              </Card>

          {/* Workspace Information - Compact */}
          {workspaceContext?.currentWorkspace ? (
            <Card className="border-0 shadow-sm bg-card rounded-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  Workspace
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h3 className="font-semibold text-foreground text-sm">{workspaceContext.currentWorkspace.name}</h3>
                  {workspaceContext.currentWorkspace.description && (
                    <p className="text-sm text-muted-foreground mt-1">{workspaceContext.currentWorkspace.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Role:</span>
                  <Badge className="bg-primary/10 text-primary border-0 text-xs">
                    Member
                  </Badge>
                </div>
                <div className="flex gap-2 pt-1">
                  <Link href="/dashboard/settings/team" className="flex-1">
                    <Button variant="outline" className="w-full text-sm h-9 border-border hover:bg-accent">
                      <Users className="w-3.5 h-3.5 mr-2" />
                      Team
                    </Button>
                  </Link>
                  <Link href="/dashboard/settings/workspace" className="flex-1">
                    <Button variant="outline" className="w-full text-sm h-9 border-border hover:bg-accent">
                      <Settings className="w-3.5 h-3.5 mr-2" />
                      Settings
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-sm bg-card rounded-xl">
              <CardContent className="text-center py-6">
                <Shield className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-1 text-sm">No Workspace</h3>
                <p className="text-xs text-muted-foreground mb-4">Create or join a workspace to get started</p>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => router.push('/dashboard')}
                    className="flex-1 bg-foreground hover:bg-foreground/90 text-background h-9 text-sm"
                  >
                    Create
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => router.push('/dashboard/settings/team')}
                    className="flex-1 border-border hover:bg-accent h-9 text-sm"
                  >
                    Join
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Compact Info */}
        <div className="space-y-5">
          {/* Profile Preview - Compact */}
          <Card className="border-0 shadow-sm bg-card rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-foreground">Profile Preview</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-center">
                {userData?.photoURL ? (
                  <Image
                    src={userData.photoURL}
                    alt="Profile"
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full border-2 border-border mx-auto mb-3"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center text-primary-foreground font-semibold text-base mx-auto mb-3">
                    {formData.firstName?.charAt(0) || formData.displayName?.charAt(0) || 'U'}
                  </div>
                )}
                
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  {formData.firstName && formData.lastName 
                    ? `${formData.firstName} ${formData.lastName}`
                    : formData.displayName || 'User'
                  }
                </h3>
                
                <p className="text-xs text-muted-foreground">{formData.email}</p>
              </div>
            </CardContent>
          </Card>

          {/* Subscription - Compact */}
          {userData && (() => {
            const subscriptionInfo = getSubscriptionInfo(userData);
            const planFeatures = getPlanFeatures(subscriptionInfo.plan);
            
            return (
              <Card className="border-0 shadow-sm bg-card rounded-xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                    <Crown className="w-4 h-4 text-primary" />
                    Subscription
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{subscriptionInfo.planDisplay}</h3>
                    <div className="mt-1.5">
                      {subscriptionInfo.isTrialActive ? (
                        <Badge className="bg-primary/10 text-primary border-0 text-xs">
                          Active
                        </Badge>
                      ) : (
                        <Badge className={
                          subscriptionInfo.status === 'active' 
                            ? 'bg-green-50 text-green-700 border-0 text-xs'
                            : 'bg-muted text-muted-foreground border-0 text-xs'
                        }>
                          {subscriptionInfo.statusDisplay}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    {planFeatures.slice(0, 3).map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs">
                        <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                    {planFeatures.length > 3 && (
                      <p className="text-xs text-muted-foreground pt-1">+{planFeatures.length - 3} more features</p>
                    )}
                  </div>

                  <div className="pt-2">
                    {subscriptionInfo.isTrialActive ? (
                      <Link href="/pricing">
                        <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm h-9">
                          <Crown className="w-3.5 h-3.5 mr-2" />
                          Upgrade Now
                        </Button>
                      </Link>
                    ) : (
                      <Button variant="outline" className="w-full text-sm h-9 border-border hover:bg-accent">
                        Manage Subscription
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {/* Account Info - Compact */}
          <Card className="border-0 shadow-sm bg-card rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-foreground">Account Info</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2.5">
              <div className="flex justify-between items-center py-1">
                <span className="text-xs text-muted-foreground">User since:</span>
                <span className="text-xs text-foreground font-medium">{getUserSince()}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-xs text-muted-foreground">Email verified:</span>
                <span className={`text-xs font-medium ${user?.emailVerified ? 'text-green-600' : 'text-red-600'}`}>
                  {user?.emailVerified ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-xs text-muted-foreground">Last login:</span>
                <span className="text-xs text-foreground">{formatDate(userData?.lastLoginAt)}</span>
              </div>
            </CardContent>
          </Card>
            </div>
          </div>
    </Container>
  );
}

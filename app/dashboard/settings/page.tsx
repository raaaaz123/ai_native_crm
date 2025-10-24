"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/layout';
import { Badge } from '@/components/ui/badge';
import { LoadingDialog } from '../../components/ui/loading-dialog';
import { Users, Settings, Shield, Crown, Clock, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { getSubscriptionInfo, formatDate, getPlanFeatures } from '@/app/lib/subscription-utils';

export default function SettingsPage() {
  const router = useRouter();
  const { user, userData, updateUserData, companyContext } = useAuth();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    role: '',
    displayName: ''
  });

  // Load user data when component mounts
  useEffect(() => {
    if (userData) {
      setFormData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        company: userData.company || '',
        role: userData.role || '',
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
        company: formData.company,
        role: formData.role,
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
        company: userData.company || '',
        role: userData.role || '',
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Settings</h1>
            <p className="text-sm sm:text-base text-gray-600">Manage your account settings and preferences</p>
          </div>

          {/* Company Information */}
          {companyContext ? (
            <Card className="bg-gradient-to-br from-blue-50/50 to-indigo-100/30 border-2 border-blue-500/40 rounded-2xl shadow-sm mb-6">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <span>Company Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {companyContext.company.name}
                    </h3>
                    {companyContext.company.description && (
                      <p className="text-sm text-gray-600 mb-4">{companyContext.company.description}</p>
                    )}
                    <div className="space-y-2.5">
                      {companyContext.company.domain && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">Domain:</span>
                          <span className="text-sm font-medium text-gray-900">{companyContext.company.domain}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Your Role:</span>
                        <Badge className={companyContext.isAdmin ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-blue-100 text-blue-800 border border-blue-300'}>
                          {companyContext.member.role}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col justify-center gap-3">
                    <Link href="/dashboard/settings/team" className="w-full">
                      <Button variant="outline" className="w-full justify-start border-2 border-blue-500/40 hover:border-blue-600 hover:bg-blue-50">
                        <Users className="w-4 h-4 mr-2" />
                        Manage Team
                      </Button>
                    </Link>
                    {companyContext.isAdmin && (
                      <Link href="/dashboard/settings/company" className="w-full">
                        <Button variant="outline" className="w-full justify-start border-2 border-blue-500/40 hover:border-blue-600 hover:bg-blue-50">
                          <Settings className="w-4 h-4 mr-2" />
                          Company Settings
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-gradient-to-br from-gray-50/50 to-gray-100/30 border-2 border-gray-300/40 rounded-2xl shadow-sm mb-6">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <Shield className="w-5 h-5 text-gray-600" />
                  <span>Company Setup</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Company Found</h3>
                  <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                    You&apos;re not part of any company yet. Create a company or join an existing one to get started.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button 
                      onClick={() => router.push('/dashboard/settings/company')}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                      Create Company
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => router.push('/dashboard/settings/team')}
                      className="border-2 border-blue-500 hover:border-blue-600 hover:bg-blue-50"
                    >
                      Join Company
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Subscription & Plan Information */}
          {userData && (() => {
            const subscriptionInfo = getSubscriptionInfo(userData);
            const planFeatures = getPlanFeatures(subscriptionInfo.plan);
            
            return (
              <Card className="bg-gradient-to-br from-purple-50/50 to-pink-100/30 border-2 border-purple-500/40 rounded-2xl shadow-sm mb-6">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                    <Crown className="w-5 h-5 text-purple-600" />
                    <span>Subscription & Plan</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Plan Overview */}
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-purple-100 rounded-xl">
                          <Crown className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">
                            {subscriptionInfo.planDisplay}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            {subscriptionInfo.isTrialActive ? (
                              <>
                                <Badge className="bg-blue-100 text-blue-800 border border-blue-300">
                                  Active Trial
                                </Badge>
                                <span className="text-sm text-gray-600">
                                  {subscriptionInfo.trialDaysRemaining} {subscriptionInfo.trialDaysRemaining === 1 ? 'day' : 'days'} left
                                </span>
                              </>
                            ) : (
                              <Badge className={
                                subscriptionInfo.status === 'active' 
                                  ? 'bg-green-100 text-green-800 border border-green-300'
                                  : 'bg-gray-100 text-gray-800 border border-gray-300'
                              }>
                                {subscriptionInfo.statusDisplay}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Trial/Subscription Dates */}
                      <div className="space-y-3">
                        {subscriptionInfo.isTrialActive && subscriptionInfo.trialEndDate && (
                          <>
                            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                              <div>
                                <p className="text-sm font-semibold text-blue-900">Trial Period</p>
                                <p className="text-xs text-blue-700 mt-1">
                                  Ends on {formatDate(subscriptionInfo.trialEndDate)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                              <div>
                                <p className="text-sm font-semibold text-amber-900">Upgrade to Continue</p>
                                <p className="text-xs text-amber-700 mt-1">
                                  Choose a plan before your trial expires to keep your data and features
                                </p>
                              </div>
                            </div>
                          </>
                        )}
                        
                        {subscriptionInfo.subscriptionEndDate && !subscriptionInfo.isTrialActive && (
                          <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                            <Calendar className="w-5 h-5 text-green-600 mt-0.5" />
                            <div>
                              <p className="text-sm font-semibold text-green-900">Subscription Active</p>
                              <p className="text-xs text-green-700 mt-1">
                                Renews on {formatDate(subscriptionInfo.subscriptionEndDate)}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Plan Features */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Plan Features:</h4>
                      <div className="space-y-2 mb-4">
                        {planFeatures.map((feature, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{feature}</span>
                          </div>
                        ))}
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2 mt-4">
                        {subscriptionInfo.isTrialActive ? (
                          <>
                            <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                              <Crown className="w-4 h-4 mr-2" />
                              Upgrade Now
                            </Button>
                            <Button variant="outline" className="w-full border-purple-300 text-purple-700 hover:bg-purple-50">
                              View All Plans
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button variant="outline" className="w-full border-purple-300 text-purple-700 hover:bg-purple-50">
                              Manage Subscription
                            </Button>
                            <Button variant="outline" className="w-full">
                              View Billing History
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Information */}
            <div className="lg:col-span-2">
              <Card className="bg-gradient-to-br from-white to-gray-50/30 border-2 border-gray-200 rounded-2xl shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Profile Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border-2 border-red-200 rounded-xl">
                      <p className="text-red-700 text-sm font-medium">{error}</p>
                    </div>
                  )}

                  {success && (
                    <div className="mb-4 p-3 bg-green-50 border-2 border-green-200 rounded-xl">
                      <p className="text-green-700 text-sm font-medium">{success}</p>
                    </div>
                  )}

                  <form onSubmit={handleSave} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 mb-1.5">
                          First Name *
                        </label>
                        <input
                          id="firstName"
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
                          placeholder="John"
                          disabled={loading}
                          suppressHydrationWarning={true}
                        />
                      </div>
                      <div>
                        <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700 mb-1.5">
                          Last Name *
                        </label>
                        <input
                          id="lastName"
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
                          placeholder="Doe"
                          disabled={loading}
                          suppressHydrationWarning={true}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Email Address
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={formData.email}
                        disabled
                        className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                        placeholder="john@example.com"
                        suppressHydrationWarning={true}
                      />
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>

                    <div>
                      <label htmlFor="company" className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Company
                      </label>
                      <input
                        id="company"
                        type="text"
                        value={formData.company}
                        onChange={(e) => handleInputChange('company', e.target.value)}
                        className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
                        placeholder="Acme Inc."
                        disabled={loading}
                        suppressHydrationWarning={true}
                      />
                    </div>

                    <div>
                      <label htmlFor="role" className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Role
                      </label>
                      <select
                        id="role"
                        value={formData.role}
                        onChange={(e) => handleInputChange('role', e.target.value)}
                        className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
                        disabled={loading}
                        suppressHydrationWarning={true}
                      >
                        <option value="">Select your role</option>
                        <option value="Sales Manager">Sales Manager</option>
                        <option value="Sales Representative">Sales Representative</option>
                        <option value="Marketing Manager">Marketing Manager</option>
                        <option value="Business Owner">Business Owner</option>
                        <option value="Customer Success">Customer Success</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <Button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-2.5"
                      >
                        {loading ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleReset}
                        disabled={loading}
                        className="flex-1 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 py-2.5"
                      >
                        Reset
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Profile Preview */}
            <div className="lg:col-span-1 space-y-4">
              <Card className="bg-gradient-to-br from-purple-50/50 to-pink-100/30 border-2 border-purple-500/40 rounded-2xl shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>Profile Preview</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    {userData?.photoURL ? (
                      <Image
                        src={userData.photoURL}
                        alt="Profile"
                        width={80}
                        height={80}
                        className="w-20 h-20 rounded-full border-4 border-white shadow-lg mx-auto mb-3"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-3 shadow-md">
                        {formData.firstName?.charAt(0) || formData.displayName?.charAt(0) || 'U'}
                      </div>
                    )}
                    
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      {formData.firstName && formData.lastName 
                        ? `${formData.firstName} ${formData.lastName}`
                        : formData.displayName || 'User'
                      }
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-2">{formData.email}</p>
                    
                    {formData.company && (
                      <p className="text-sm text-gray-700 font-medium mb-2">{formData.company}</p>
                    )}
                    
                    {formData.role && (
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full border border-blue-300">
                        {formData.role}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Account Information */}
              <Card className="bg-gradient-to-br from-green-50/50 to-emerald-100/30 border-2 border-green-500/40 rounded-2xl shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Account Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">User ID:</span>
                    <span className="text-gray-900 font-mono text-xs" title={user?.uid}>
                      {user?.uid?.slice(0, 8)}...
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Email Verified:</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${user?.emailVerified ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {user?.emailVerified ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">User since:</span>
                    <span className="text-gray-900 font-medium text-xs">
                      {getUserSince()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Last login:</span>
                    <span className="text-gray-900 text-xs">
                      {formatDate(userData?.lastLoginAt)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Additional User Details */}
              <Card className="bg-gradient-to-br from-amber-50/50 to-orange-100/30 border-2 border-amber-500/40 rounded-2xl shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Profile Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Display Name:</span>
                    <span className="text-gray-900 text-xs font-medium">
                      {userData?.displayName || 'Not set'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">First Name:</span>
                    <span className="text-gray-900 text-xs font-medium">
                      {userData?.firstName || 'Not set'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Last Name:</span>
                    <span className="text-gray-900 text-xs font-medium">
                      {userData?.lastName || 'Not set'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Company:</span>
                    <span className="text-gray-900 text-xs font-medium">
                      {userData?.company || 'Not set'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Role:</span>
                    <span className="text-gray-900 text-xs font-medium">
                      {userData?.role || 'Not set'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
    </Container>
  );
}

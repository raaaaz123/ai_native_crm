"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/layout';
import Image from 'next/image';

export default function SettingsPage() {
  const { user, userData, updateUserData } = useAuth();
  const [loading, setLoading] = useState(false);
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
    }
  }, [userData]);

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
    
    const createdDate = new Date(userData.createdAt);
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
  const formatDate = (date: any) => {
    if (!date) return 'Unknown';
    try {
      return new Date(date).toLocaleDateString('en-US', {
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
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">Settings</h1>
            <p className="text-neutral-600">Manage your account settings and preferences</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Information */}
            <div className="lg:col-span-2">
              <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Profile Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
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

                  <form onSubmit={handleSave} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-neutral-700 mb-2">
                          First Name *
                        </label>
                        <input
                          id="firstName"
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors bg-white/50"
                          placeholder="John"
                          disabled={loading}
                        />
                      </div>
                      <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-neutral-700 mb-2">
                          Last Name *
                        </label>
                        <input
                          id="lastName"
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors bg-white/50"
                          placeholder="Doe"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                        Email Address
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={formData.email}
                        disabled
                        className="w-full px-4 py-3 border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-500 cursor-not-allowed"
                        placeholder="john@example.com"
                      />
                      <p className="text-xs text-neutral-500 mt-1">Email cannot be changed</p>
                    </div>

                    <div>
                      <label htmlFor="company" className="block text-sm font-medium text-neutral-700 mb-2">
                        Company
                      </label>
                      <input
                        id="company"
                        type="text"
                        value={formData.company}
                        onChange={(e) => handleInputChange('company', e.target.value)}
                        className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors bg-white/50"
                        placeholder="Acme Inc."
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label htmlFor="role" className="block text-sm font-medium text-neutral-700 mb-2">
                        Role
                      </label>
                      <select
                        id="role"
                        value={formData.role}
                        onChange={(e) => handleInputChange('role', e.target.value)}
                        className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors bg-white/50"
                        disabled={loading}
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

                    <div className="flex space-x-4">
                      <Button
                        type="submit"
                        disabled={loading}
                        className="flex-1"
                      >
                        {loading ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleReset}
                        disabled={loading}
                        className="flex-1"
                      >
                        Reset
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Profile Preview */}
            <div className="lg:col-span-1">
              <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        className="w-20 h-20 rounded-full border-4 border-white shadow-lg mx-auto mb-4"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
                        {formData.firstName?.charAt(0) || formData.displayName?.charAt(0) || 'U'}
                      </div>
                    )}
                    
                    <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                      {formData.firstName && formData.lastName 
                        ? `${formData.firstName} ${formData.lastName}`
                        : formData.displayName || 'User'
                      }
                    </h3>
                    
                    <p className="text-sm text-neutral-500 mb-2">{formData.email}</p>
                    
                    {formData.company && (
                      <p className="text-sm text-neutral-600 mb-1">{formData.company}</p>
                    )}
                    
                    {formData.role && (
                      <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                        {formData.role}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Account Information */}
              <Card className="bg-white/80 backdrop-blur-sm border border-white/20 mt-6">
                <CardHeader>
                  <CardTitle className="text-sm">Account Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">User ID:</span>
                    <span className="text-neutral-900 font-mono text-xs" title={user?.uid}>
                      {user?.uid?.slice(0, 8)}...
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Email:</span>
                    <span className="text-neutral-900 text-xs" title={userData?.email}>
                      {userData?.email || 'Not provided'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Email Verified:</span>
                    <span className={`text-xs font-medium ${user?.emailVerified ? 'text-green-600' : 'text-red-600'}`}>
                      {user?.emailVerified ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">User since:</span>
                    <span className="text-neutral-900">
                      {getUserSince()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Account created:</span>
                    <span className="text-neutral-900 text-xs">
                      {formatDate(userData?.createdAt)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Last login:</span>
                    <span className="text-neutral-900 text-xs">
                      {formatDate(userData?.lastLoginAt)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Last updated:</span>
                    <span className="text-neutral-900 text-xs">
                      {formatDate(userData?.updatedAt)}
                    </span>
                  </div>
                  {userData?.photoURL && (
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Profile photo:</span>
                      <span className="text-neutral-900 text-xs truncate max-w-32" title={userData.photoURL}>
                        Google Photo
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Additional User Details */}
              <Card className="bg-white/80 backdrop-blur-sm border border-white/20 mt-6">
                <CardHeader>
                  <CardTitle className="text-sm">Profile Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Display Name:</span>
                    <span className="text-neutral-900 text-xs">
                      {userData?.displayName || 'Not set'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">First Name:</span>
                    <span className="text-neutral-900 text-xs">
                      {userData?.firstName || 'Not set'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Last Name:</span>
                    <span className="text-neutral-900 text-xs">
                      {userData?.lastName || 'Not set'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Company:</span>
                    <span className="text-neutral-900 text-xs">
                      {userData?.company || 'Not set'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Role:</span>
                    <span className="text-neutral-900 text-xs">
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

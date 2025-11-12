"use client";

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../lib/workspace-auth-context';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '../components/brand';
import { Users, Bot, Clock, Globe, AlertCircle, Mail } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Feature Showcase Component
const FeatureShowcase = () => (
  <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 items-center justify-center p-8 relative overflow-hidden">
    {/* Animated Background Elements */}
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
    </div>

    <div className="relative z-10 max-w-lg">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-3">
          Start Building with AI
        </h2>
        <p className="text-base text-muted-foreground">
          Join thousands of businesses automating customer engagement
        </p>
      </div>

      {/* Feature Cards */}
      <div className="space-y-4">
        <div className="group bg-card/50 backdrop-blur border border-border rounded-lg p-4 hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors flex-shrink-0">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm mb-0.5">AI-Powered Agents</h3>
              <p className="text-xs text-muted-foreground">
                Create intelligent agents that learn from your data
              </p>
            </div>
          </div>
        </div>

        <div className="group bg-card/50 backdrop-blur border border-border rounded-lg p-4 hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in delay-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center group-hover:bg-success/20 transition-colors flex-shrink-0">
              <Clock className="w-5 h-5 text-success" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm mb-0.5">Launch in Minutes</h3>
              <p className="text-xs text-muted-foreground">
                No coding required - deploy in just a few clicks
              </p>
            </div>
          </div>
        </div>

        <div className="group bg-card/50 backdrop-blur border border-border rounded-lg p-4 hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in delay-400">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center group-hover:bg-warning/20 transition-colors flex-shrink-0">
              <Globe className="w-5 h-5 text-warning" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm mb-0.5">Omnichannel Ready</h3>
              <p className="text-xs text-muted-foreground">
                Deploy across web, WhatsApp, and more
              </p>
            </div>
          </div>
        </div>

        <div className="group bg-card/50 backdrop-blur border border-border rounded-lg p-4 hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in delay-600">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-info/10 rounded-lg flex items-center justify-center group-hover:bg-info/20 transition-colors flex-shrink-0">
              <Users className="w-5 h-5 text-info" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm mb-0.5">Team Collaboration</h3>
              <p className="text-xs text-muted-foreground">
                Invite your team and manage together
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary mb-0.5">10K+</div>
          <div className="text-xs text-muted-foreground">Active Users</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-primary mb-0.5">Free</div>
          <div className="text-xs text-muted-foreground">To Start</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-primary mb-0.5">24/7</div>
          <div className="text-xs text-muted-foreground">Support</div>
        </div>
      </div>
    </div>

    <style jsx>{`
      @keyframes fade-in {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .animate-fade-in {
        animation: fade-in 0.5s ease-out forwards;
      }
      .delay-200 {
        animation-delay: 0.2s;
        opacity: 0;
      }
      .delay-400 {
        animation-delay: 0.4s;
        opacity: 0;
      }
      .delay-600 {
        animation-delay: 0.6s;
        opacity: 0;
      }
      .delay-1000 {
        animation-delay: 1s;
      }
    `}</style>
  </div>
);

function SignUpPageContent() {
  const [step, setStep] = useState<'initial' | 'complete' | 'company'>('initial');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    firstName: '',
    lastName: '',
    company: '',
    role: '',
    companyName: '',
    companyDescription: '',
    companyDomain: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailLinkSent, setEmailLinkSent] = useState(false);
  const [showEmailExistsDialog, setShowEmailExistsDialog] = useState(false);
  const [existingEmail, setExistingEmail] = useState('');
  const { signInWithGoogle, sendSignInLinkToEmail, updateUserData, user, createWorkspace } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const checkUserWorkspaces = useCallback(async (retryCount = 0) => {
    if (!user) {
      console.log('⚠️ [Signup Page] No user available, skipping workspace check');
      return;
    }
    
    // Wait a bit for auth context to fully load on first attempt
    if (retryCount === 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    try {
      console.log(`🔄 [Signup Page] Checking user workspaces (attempt ${retryCount + 1})...`);
      
      const { getUserWorkspaces } = await import('../lib/workspace-firestore-utils');
      const workspacesResult = await getUserWorkspaces(user.uid);
      
      if (workspacesResult.success && workspacesResult.data && workspacesResult.data.length > 0) {
        console.log('✅ [Signup Page] User has workspaces, redirecting to dashboard');
        router.push('/dashboard');
      } else {
        console.log('🆕 [Signup Page] User has no workspaces, creating default workspace...');
        
        // Get user data from Firestore to get accurate name
        const { getDoc, doc } = await import('firebase/firestore');
        const { db } = await import('../lib/firebase');
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.exists() ? userDoc.data() : null;
        
        const displayName = userData?.displayName || user.displayName || 'User';
        const firstName = userData?.firstName || user.displayName?.split(' ')[0] || 'User';
        const lastName = userData?.lastName || user.displayName?.split(' ').slice(1).join(' ') || '';
        
        const defaultWorkspaceName = `${displayName}'s Workspace`;
        const defaultWorkspaceUrl = `${firstName.toLowerCase()}-${lastName ? lastName.toLowerCase() + '-' : ''}${Date.now()}`;
        
        try {
          await createWorkspace(defaultWorkspaceName, defaultWorkspaceUrl, 'Your default workspace');
          console.log('✅ [Signup Page] Default workspace created for existing user, redirecting to dashboard');
          router.push('/dashboard');
        } catch (error) {
          console.error('❌ [Signup Page] Error creating default workspace for existing user:', error);
          
          // If it's a permission error and we haven't retried too many times, try again
          if ((error as Error).message.includes('permissions') && retryCount < 2) {
            console.log(`🔄 [Signup Page] Retrying workspace creation (attempt ${retryCount + 2})...`);
            setTimeout(() => checkUserWorkspaces(retryCount + 1), 1000);
            return;
          }
          
          setError('Failed to create workspace. Please try again.');
        }
      }
    } catch (error) {
      console.error('❌ [Signup Page] Error checking user workspaces:', error);
      
      // If it's a permission error and we haven't retried too many times, try again
      if ((error as Error).message.includes('permissions') && retryCount < 2) {
        console.log(`🔄 [Signup Page] Retrying workspace check (attempt ${retryCount + 2})...`);
        setTimeout(() => checkUserWorkspaces(retryCount + 1), 1000);
        return;
      }
      
      setError('Failed to check workspaces. Please try again.');
    }
  }, [user, router, createWorkspace]);

  useEffect(() => {
    const stepParam = searchParams.get('step');
    if (stepParam === 'complete' && user) {
      setStep('complete');
    } else if (user && stepParam !== 'complete') {
      // Add a small delay to ensure auth context is fully loaded
      const timer = setTimeout(() => {
        checkUserWorkspaces();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [user, router, searchParams, checkUserWorkspaces]);

  const handleGoogleSignUp = async () => {
    try {
      console.log('🚀 [Signup Page] Starting Google signup process...');
      setLoading(true);
      setError('');
      
      console.log('📞 [Signup Page] Calling signInWithGoogle...');
      const { user, isNewUser } = await signInWithGoogle();
      
      console.log('📊 [Signup Page] Google signup result:', {
        isNewUser,
        userId: user.uid,
        userEmail: user.email,
        userDisplayName: user.displayName
      });
      
      // Always redirect to dashboard - workspace will be created automatically
      // Google provides name and email, so user data is already complete
      console.log('✅ [Signup Page] Account created, redirecting to dashboard');
      router.push('/dashboard');
    } catch (error: unknown) {
      console.error('❌ [Signup Page] Error during Google signup:', error);
      const firebaseError = error as { code?: string; message?: string; customData?: { email?: string } };
      
      // Check if email is already in use (though unlikely with Google OAuth)
      if (firebaseError.code === 'auth/email-already-in-use') {
        const userEmail = firebaseError.customData?.email || '';
        setExistingEmail(userEmail);
        setShowEmailExistsDialog(true);
        setError(''); // Clear inline error since we're showing dialog
      } else {
        setError(firebaseError.message || 'Failed to sign up with Google');
      }
    } finally {
      console.log('🏁 [Signup Page] Google signup process completed');
      setLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📝 [Signup Page] Form submission started');
    console.log('📊 [Signup Page] Form data:', {
      fullName: formData.fullName,
      email: formData.email
    });
    
    if (!formData.fullName || !formData.email) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      console.log('🚀 [Signup Page] Sending email link...');
      
      // Store full name temporarily so we can use it when user completes sign-in
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('pendingFullName', formData.fullName);
      }
      
      // Send email link for passwordless sign-up/sign-in
      await sendSignInLinkToEmail(formData.email);
      
      console.log('✅ [Signup Page] Email link sent successfully');
      setEmailLinkSent(true);
    } catch (error: unknown) {
      const firebaseError = error as { code?: string; message?: string };
      
      console.error('❌ [Signup Page] Error sending email link:', firebaseError);
      console.error('❌ [Signup Page] Error code:', firebaseError.code);
      console.error('❌ [Signup Page] Error message:', firebaseError.message);
      
      // Show user-friendly error message
      const errorMessage = firebaseError.message || 'Failed to send sign-in link. Please check your email address and try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📝 [Profile Completion] Starting profile completion...');
    console.log('📊 [Profile Completion] Form data:', formData);
    
    if (!formData.firstName || !formData.lastName) {
      console.log('❌ [Profile Completion] Missing required fields');
      setError('Please provide your first and last name');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const profileData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        company: formData.company,
        role: formData.role,
        displayName: `${formData.firstName} ${formData.lastName}`.trim()
      };
      
      console.log('💾 [Profile Completion] Updating user data with:', profileData);
      
      await updateUserData(profileData);
      
      console.log('✅ [Profile Completion] Profile updated successfully, creating default workspace...');
      
      // Redirect to dashboard - workspace will be created by checkUserWorkspaces function
      console.log('✅ [Profile Completion] Profile updated, redirecting to dashboard');
      router.push('/dashboard');
    } catch (error: unknown) {
      console.error('❌ [Profile Completion] Error updating profile:', error);
      setError((error as Error).message || 'Failed to update profile');
    } finally {
      console.log('🏁 [Profile Completion] Profile completion process finished');
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.companyName) {
      setError('Company name is required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      console.log('🏢 [Company Creation] Creating company:', {
        name: formData.companyName,
        description: formData.companyDescription,
        domain: formData.companyDomain
      });
      
      console.log('✅ [Company Creation] Company created successfully, redirecting to dashboard');
      router.push('/dashboard');
    } catch (error: unknown) {
      console.error('❌ [Company Creation] Error creating company:', error);
      setError((error as Error).message || 'Failed to create company');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'company') {
    return (
      <div className="h-screen bg-background flex overflow-hidden">
        {/* Left Side - Form */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            {/* Logo */}
            <Link href="/" className="inline-flex items-center mb-8 hover:opacity-80 transition-opacity">
              <BrandLogo size="md" showText={true} />
            </Link>

            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Create your workspace
              </h1>
              <p className="text-muted-foreground">
                Set up your workspace to start collaborating with your team
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-foreground mb-2">
                  Workspace name *
                </label>
                <input
                  id="companyName"
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors bg-card text-foreground"
                  placeholder="Acme Inc."
                  disabled={loading}
                  suppressHydrationWarning
                />
              </div>

              <div>
                <label htmlFor="companyDescription" className="block text-sm font-medium text-foreground mb-2">
                  Description
                </label>
                <textarea
                  id="companyDescription"
                  value={formData.companyDescription}
                  onChange={(e) => handleInputChange('companyDescription', e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors bg-card text-foreground"
                  placeholder="Brief description of your company..."
                  rows={3}
                  disabled={loading}
                  suppressHydrationWarning
                />
              </div>

              <div>
                <label htmlFor="companyDomain" className="block text-sm font-medium text-foreground mb-2">
                  Workspace URL
                </label>
                <input
                  id="companyDomain"
                  type="text"
                  value={formData.companyDomain}
                  onChange={(e) => handleInputChange('companyDomain', e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors bg-card text-foreground"
                  placeholder="acme.com"
                  disabled={loading}
                  suppressHydrationWarning
                />
                <p className="text-xs text-muted-foreground mt-1">Optional: Your workspace URL slug</p>
              </div>

              <Button
                type="submit"
                disabled={loading}
                size="lg"
                className="w-full mt-6"
              >
                {loading ? 'Creating workspace...' : 'Create Workspace'}
              </Button>
            </form>
          </div>
        </div>

        {/* Right Side - Feature Showcase */}
        <FeatureShowcase />
      </div>
    );
  }

  if (step === 'complete') {
    return (
      <div className="h-screen bg-background flex overflow-hidden">
        {/* Left Side - Form */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            {/* Logo */}
            <Link href="/" className="inline-flex items-center mb-8 hover:opacity-80 transition-opacity">
              <BrandLogo size="md" showText={true} />
            </Link>

            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Complete your profile
              </h1>
              <p className="text-muted-foreground">
                Tell us a bit about yourself to get started
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleCompleteProfile} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-foreground mb-2">
                    First name *
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors bg-card text-foreground"
                    placeholder="John"
                    disabled={loading}
                    suppressHydrationWarning
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-foreground mb-2">
                    Last name *
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors bg-card text-foreground"
                    placeholder="Doe"
                    disabled={loading}
                    suppressHydrationWarning
                  />
                </div>
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium text-foreground mb-2">
                  Company
                </label>
                <input
                  id="company"
                  type="text"
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors bg-card text-foreground"
                  placeholder="Acme Inc."
                  disabled={loading}
                  suppressHydrationWarning
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-foreground mb-2">
                  Role
                </label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors bg-card text-foreground"
                  disabled={loading}
                  suppressHydrationWarning
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

              <div className="space-y-3 mt-6">
                <Button
                  type="submit"
                  disabled={loading}
                  size="lg"
                  className="w-full"
                >
                  {loading ? 'Completing profile...' : 'Complete Profile'}
                </Button>
                
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    You can create or join a company later from your dashboard
                  </p>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Right Side - Feature Showcase */}
        <FeatureShowcase />
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center mb-8 hover:opacity-80 transition-opacity">
            <BrandLogo size="md" showText={true} />
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Create your account
            </h1>
            <p className="text-muted-foreground">
              No password needed. We&apos;ll send you a secure link to get started.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          {/* Google Sign Up */}
          <Button
            onClick={handleGoogleSignUp}
            disabled={loading}
            variant="outline"
            size="lg"
            className="w-full mb-6 bg-card hover:bg-muted border-border"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {loading ? 'Creating account...' : 'Continue with Google'}
          </Button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-background text-muted-foreground">Or create with email</span>
            </div>
          </div>

          {/* Email Sign Up Form */}
          <form onSubmit={handleEmailSignUp} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-foreground mb-2">
                Full name *
              </label>
              <input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors bg-card text-foreground"
                placeholder="John Doe"
                disabled={loading}
                suppressHydrationWarning
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email address *
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors bg-card text-foreground"
                placeholder="you@example.com"
                disabled={loading}
                suppressHydrationWarning
                required
              />
            </div>


            <div className="flex items-start">
              <input
                id="terms"
                type="checkbox"
                className="h-4 w-4 text-primary focus:ring-primary border-border rounded mt-1"
                required
                suppressHydrationWarning
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-muted-foreground">
                I agree to the{' '}
                <Link href="/terms" className="text-primary hover:text-primary/80">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-primary hover:text-primary/80">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <Button
              type="submit"
              disabled={loading || emailLinkSent}
              size="lg"
              className="w-full mt-2"
            >
              {loading ? 'Sending link...' : emailLinkSent ? 'Link sent!' : 'Create account'}
            </Button>
          </form>

          {/* Email Link Sent Success Message */}
          {emailLinkSent && (
            <div className="mt-6 p-4 bg-success/10 border border-success/20 rounded-lg">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-success font-medium text-sm mb-1">Check your email!</p>
                  <p className="text-muted-foreground text-sm mb-2">
                    We&apos;ve sent a sign-in link to <span className="font-medium text-foreground">{formData.email}</span>. 
                    Click the link in the email to create your account and sign in.
                  </p>
                  <div className="mt-3 pt-3 border-t border-success/20">
                    <p className="text-xs text-muted-foreground font-medium mb-1">Didn&apos;t receive the email?</p>
                    <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                      <li>Check your spam/junk folder</li>
                      <li>Wait a few minutes (emails can take 1-5 minutes)</li>
                      <li>Make sure <span className="font-medium">{formData.email}</span> is correct</li>
                      <li>Try clicking &quot;Create account&quot; again</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-muted-foreground text-sm">
              Already have an account?{' '}
              <Link
                href="/signin"
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Feature Showcase */}
      <FeatureShowcase />

      {/* Email Already Exists Dialog */}
      <Dialog open={showEmailExistsDialog} onOpenChange={setShowEmailExistsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-warning/10 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-warning" />
              </div>
              <DialogTitle className="text-xl">Account Already Exists</DialogTitle>
            </div>
            <DialogDescription className="text-left pt-2">
              An account with the email <span className="font-medium text-foreground">{existingEmail}</span> already exists.
              <br /><br />
              Would you like to sign in instead?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowEmailExistsDialog(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowEmailExistsDialog(false);
                router.push('/signin');
              }}
              className="w-full sm:w-auto"
            >
              Sign In
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <SignUpPageContent />
    </Suspense>
  );
}
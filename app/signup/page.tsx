"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../lib/auth-context';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '../components/brand';


export default function SignUpPage() {
  const [step, setStep] = useState<'initial' | 'complete'>('initial');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    company: '',
    role: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signInWithGoogle, signUpWithEmail, updateUserData, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const stepParam = searchParams.get('step');
    if (stepParam === 'complete' && user) {
      setStep('complete');
    } else if (user && stepParam !== 'complete') {
      router.push('/dashboard');
    }
  }, [user, router, searchParams]);

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
      
      if (isNewUser) {
        console.log('🆕 [Signup Page] Processing new user...');
        
        // For new Google users, check if we have complete profile data
        // Google provides name and email, so we might have enough data
        const nameParts = user.displayName?.split(' ') || [];
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        console.log('👤 [Signup Page] Parsed name from Google:', { firstName, lastName });
        
        // If we have both first and last name from Google, go to dashboard
        // Otherwise, go to profile completion
        if (firstName && lastName) {
          console.log('✅ [Signup Page] Complete profile data available, redirecting to dashboard');
          router.push('/dashboard');
        } else {
          console.log('⚠️ [Signup Page] Incomplete profile data, going to profile completion');
          
          // Pre-fill the form with Google data
          const updatedFormData = {
            ...formData,
            firstName: firstName,
            lastName: lastName,
            email: user.email || ''
          };
          
          console.log('📝 [Signup Page] Pre-filling form with:', updatedFormData);
          setFormData(updatedFormData);
          setStep('complete');
        }
      } else {
        console.log('👤 [Signup Page] Existing user, redirecting to dashboard');
        router.push('/dashboard');
      }
    } catch (error: unknown) {
      console.error('❌ [Signup Page] Error during Google signup:', error);
      setError((error as Error).message || 'Failed to sign up with Google');
    } finally {
      console.log('🏁 [Signup Page] Google signup process completed');
      setLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const additionalData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        company: formData.company,
        role: formData.role,
        displayName: `${formData.firstName} ${formData.lastName}`.trim()
      };
      
      await signUpWithEmail(formData.email, formData.password, additionalData);
      
      // Check if we have complete profile data
      if (formData.firstName && formData.lastName) {
        // Profile is complete, go to dashboard
        router.push('/dashboard');
      } else {
        // Profile incomplete, go to complete step
        router.push('/signup?step=complete');
      }
    } catch (error: unknown) {
      setError((error as Error).message || 'Failed to create account');
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
      
      console.log('✅ [Profile Completion] Profile updated successfully, redirecting to dashboard');
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

  if (step === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <BrandLogo size="lg" />
            </div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">
              Complete your profile
            </h1>
            <p className="text-neutral-600">
              Tell us a bit about yourself to get started
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            {error && (
              <div className="mb-6 p-4 bg-status-error-50 border border-status-error-200 rounded-lg">
                <p className="text-status-error-700 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleCompleteProfile} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-neutral-700 mb-2">
                    First name *
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
                    Last name *
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

              <Button
                type="submit"
                disabled={loading}
                size="lg"
                className="w-full mt-6"
              >
                {loading ? 'Completing...' : 'Complete Profile'}
              </Button>
            </form>
          </div>
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
            Create your account
          </h1>
          <p className="text-neutral-600">
            Get started with your free account today
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
          {error && (
            <div className="mb-6 p-4 bg-status-error-50 border border-status-error-200 rounded-lg">
              <p className="text-status-error-700 text-sm">{error}</p>
            </div>
          )}

          <Button
            onClick={handleGoogleSignUp}
            disabled={loading}
            variant="outline"
            size="lg"
            className="w-full mb-6 bg-white hover:bg-neutral-50 border-neutral-200 text-neutral-700 font-medium"
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

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-neutral-500">Or create with email</span>
            </div>
          </div>

          <form onSubmit={handleEmailSignUp} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-neutral-700 mb-2">
                  First name
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
                  Last name
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
                Email address *
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors bg-white/50"
                placeholder="john@example.com"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
                Password *
              </label>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors bg-white/50"
                placeholder="Create a strong password"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 mb-2">
                Confirm password *
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors bg-white/50"
                placeholder="Confirm your password"
                disabled={loading}
              />
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

            <div className="flex items-start">
              <input
                id="terms"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded mt-1"
                required
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-neutral-700">
                I agree to the{' '}
                <Link href="/terms" className="text-primary-600 hover:text-primary-500">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-primary-600 hover:text-primary-500">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <Button
              type="submit"
              disabled={loading}
              size="lg"
              className="w-full"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-neutral-600">
              Already have an account?{' '}
              <Link
                href="/signin"
                className="text-primary-600 hover:text-primary-500 font-medium transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
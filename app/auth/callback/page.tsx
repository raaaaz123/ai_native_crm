"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/lib/workspace-auth-context';
import { isSignInWithEmailLink } from 'firebase/auth';
import { auth } from '@/app/lib/firebase';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/app/components/brand';
import { Mail, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<'checking' | 'prompting' | 'signing-in' | 'success' | 'error'>('checking');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const { signInWithEmailLink } = useAuth();

  useEffect(() => {
    const handleEmailLink = async () => {
      try {
        // Get the full URL
        const fullUrl = window.location.href;
        
        // Check if this is a sign-in with email link
        if (!isSignInWithEmailLink(auth, fullUrl)) {
          console.log('⚠️ [Auth Callback] Not an email link, redirecting...');
          router.push('/signin');
          return;
        }

        console.log('✅ [Auth Callback] Email link detected');

        // Get the email from localStorage (if user opened link on same device)
        let emailForSignIn = '';
        if (typeof window !== 'undefined') {
          emailForSignIn = window.localStorage.getItem('emailForSignIn') || '';
        }

        if (emailForSignIn) {
          // User opened link on the same device
          console.log('📧 [Auth Callback] Email found in localStorage:', emailForSignIn);
          setEmail(emailForSignIn);
          setStatus('signing-in');
          
          // Complete sign-in
          try {
            await signInWithEmailLink(emailForSignIn, fullUrl);
            console.log('✅ [Auth Callback] Sign-in successful');
            setStatus('success');
            
            // Redirect to dashboard after a brief delay
            setTimeout(() => {
              router.push('/dashboard');
            }, 1500);
          } catch (signInError: unknown) {
            const authError = signInError as { message?: string };
            console.error('❌ [Auth Callback] Sign-in error:', signInError);
            setError(authError?.message || 'Failed to complete sign-in');
            setStatus('error');
          }
        } else {
          // User opened link on a different device - need to ask for email
          console.log('⚠️ [Auth Callback] Email not found, prompting user...');
          setStatus('prompting');
        }
      } catch (callbackError: unknown) {
        const authError = callbackError as { message?: string };
        console.error('❌ [Auth Callback] Error:', callbackError);
        setError(authError?.message || 'An error occurred');
        setStatus('error');
      }
    };

    handleEmailLink();
  }, [router, signInWithEmailLink]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setStatus('signing-in');
    setError('');

    try {
      const fullUrl = window.location.href;
      await signInWithEmailLink(email, fullUrl);
      console.log('✅ [Auth Callback] Sign-in successful');
      setStatus('success');
      
      // Redirect to dashboard after a brief delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (signInError: unknown) {
      const authError = signInError as { message?: string };
      console.error('❌ [Auth Callback] Sign-in error:', signInError);
      setError(authError?.message || 'Failed to complete sign-in. Please check that this is the correct email address.');
      setStatus('prompting');
    }
  };

  const isSigningIn = status === 'signing-in';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="inline-flex items-center mb-8 hover:opacity-80 transition-opacity">
          <BrandLogo size="md" showText={true} />
        </Link>

        {/* Main Card */}
        <div className="bg-card border border-border rounded-lg p-8 shadow-lg">
          {/* Status: Checking */}
          {status === 'checking' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-center text-foreground mb-2">
                Verifying Link
              </h1>
              <p className="text-center text-muted-foreground">
                Please wait while we verify your sign-in link...
              </p>
            </>
          )}

          {/* Status: Prompting for Email */}
          {status === 'prompting' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-center text-foreground mb-2">
                Confirm Your Email
              </h1>
              <p className="text-center text-muted-foreground mb-6">
                For security, please enter the email address associated with this sign-in link.
              </p>

              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors bg-background text-foreground"
                    placeholder="you@example.com"
                    required
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                    <p className="text-destructive text-sm">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isSigningIn}
                >
                  {isSigningIn ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Continue
                    </>
                  )}
                </Button>
              </form>
            </>
          )}

          {/* Status: Signing In */}
          {status === 'signing-in' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-center text-foreground mb-2">
                Signing You In
              </h1>
              <p className="text-center text-muted-foreground">
                Completing your sign-in...
              </p>
            </>
          )}

          {/* Status: Success */}
          {status === 'success' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-success" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-center text-foreground mb-2">
                Success!
              </h1>
              <p className="text-center text-muted-foreground">
                You&apos;ve been signed in successfully. Redirecting to dashboard...
              </p>
            </>
          )}

          {/* Status: Error */}
          {status === 'error' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-destructive" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-center text-foreground mb-2">
                Sign-In Failed
              </h1>
              <p className="text-center text-muted-foreground mb-6">
                {error || 'An error occurred while completing your sign-in.'}
              </p>

              <div className="space-y-3">
                <Button
                  onClick={() => router.push('/signin')}
                  className="w-full"
                  size="lg"
                >
                  Go to Sign In
                </Button>
                <Button
                  onClick={() => {
                    setStatus('prompting');
                    setError('');
                  }}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  Try Again
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Help Text */}
        {status !== 'checking' && status !== 'signing-in' && status !== 'success' && (
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Need help?{' '}
              <Link href="/contact" className="text-primary hover:text-primary/80 font-medium">
                Contact Support
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}


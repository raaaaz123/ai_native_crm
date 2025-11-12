"use client";

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../lib/workspace-auth-context';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '../components/brand';
import { Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { sendEmailVerification } from 'firebase/auth';

function VerifyEmailPageContent() {
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || user?.email || '';

  // Check verification status periodically
  useEffect(() => {
    if (!user) return;

    const checkVerification = async () => {
      await user.reload();
      if (user.emailVerified) {
        console.log('✅ Email verified! Redirecting to dashboard...');
        router.push('/dashboard');
      }
    };

    // Check every 3 seconds
    const interval = setInterval(checkVerification, 3000);
    
    return () => clearInterval(interval);
  }, [user, router]);

  const handleCheckVerification = async () => {
    if (!user) {
      setError('No user found. Please sign up again.');
      return;
    }

    setChecking(true);
    setError('');

    try {
      await user.reload();
      
      if (user.emailVerified) {
        console.log('✅ Email verified! Redirecting to dashboard...');
        router.push('/dashboard');
      } else {
        setError('Email not verified yet. Please check your inbox and click the verification link.');
      }
    } catch (err) {
      console.error('Error checking verification:', err);
      setError('Failed to check verification status. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  const handleResendEmail = async () => {
    if (!user) {
      setError('No user found. Please sign up again.');
      return;
    }

    setResending(true);
    setError('');
    setResent(false);

    try {
      await sendEmailVerification(user, {
        url: `${window.location.origin}/verify-email?continue=/dashboard`,
        handleCodeInApp: false
      });
      setResent(true);
      console.log('✅ Verification email resent successfully');
    } catch (err) {
      console.error('Error resending verification email:', err);
      setError('Failed to resend verification email. Please try again later.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="inline-flex items-center mb-8 hover:opacity-80 transition-opacity">
          <BrandLogo size="md" showText={true} />
        </Link>

        {/* Main Card */}
        <div className="bg-card border border-border rounded-lg p-8 shadow-lg">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-primary" />
            </div>
          </div>

          {/* Header */}
          <h1 className="text-2xl font-bold text-center text-foreground mb-2">
            Verify Your Email
          </h1>
          <p className="text-center text-muted-foreground mb-6">
            We&apos;ve sent a verification link to
          </p>
          <p className="text-center font-medium text-foreground mb-6">
            {email}
          </p>

          {/* Instructions */}
          <div className="bg-muted/50 border border-border rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-sm text-foreground mb-2">
              Please check your inbox
            </h3>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Open the email from Ragzy</li>
              <li>Click the verification link</li>
              <li>Return to this page</li>
            </ol>
            <p className="text-xs text-muted-foreground mt-3">
              💡 Don&apos;t forget to check your spam folder
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {resent && (
            <div className="mb-4 p-3 bg-success/10 border border-success/20 rounded-lg flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
              <p className="text-success text-sm">Verification email sent! Please check your inbox.</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleCheckVerification}
              disabled={checking}
              className="w-full"
              size="lg"
            >
              {checking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  I&apos;ve Verified My Email
                </>
              )}
            </Button>

            <Button
              onClick={handleResendEmail}
              disabled={resending || resent}
              variant="outline"
              className="w-full"
              size="lg"
            >
              {resending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  {resent ? 'Email Sent!' : 'Resend Verification Email'}
                </>
              )}
            </Button>
          </div>

          {/* Auto-check notice */}
          <p className="text-xs text-center text-muted-foreground mt-4">
            ⚡ We&apos;ll automatically redirect you once verified
          </p>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Need help?{' '}
            <Link href="/contact" className="text-primary hover:text-primary/80 font-medium">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailPageContent />
    </Suspense>
  );
}


"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../lib/workspace-auth-context';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '../components/brand';
import { Sparkles, Zap, TrendingUp, MessageSquare, Mail } from 'lucide-react';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailLinkSent, setEmailLinkSent] = useState(false);
  const [emailLinkEmail, setEmailLinkEmail] = useState('');
  const { signInWithGoogle, signInWithEmail, sendSignInLinkToEmail, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      const { isNewUser } = await signInWithGoogle();
      
      if (isNewUser) {
        router.push('/signup?step=complete');
      } else {
        router.push('/dashboard');
      }
    } catch (error: unknown) {
      setError((error as Error).message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const signedInUser = await signInWithEmail(email, password);
      
      // Check if email is verified
      if (!signedInUser.emailVerified) {
        console.log('⚠️ Email not verified, redirecting to verification page');
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
        return;
      }
      
      router.push('/dashboard');
    } catch (error: unknown) {
      setError((error as Error).message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLinkSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await sendSignInLinkToEmail(email);
      setEmailLinkSent(true);
      setEmailLinkEmail(email);
    } catch (error: unknown) {
      const errorMessage = (error as Error).message || 'Failed to send sign-in link. Please check your email address and try again.';
      console.error('❌ [Sign In] Error sending email link:', error);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
              Welcome back
            </h1>
            <p className="text-muted-foreground">
              Sign in to your account to continue
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          {/* Google Sign In */}
          <Button
            onClick={handleGoogleSignIn}
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
            {loading ? 'Signing in...' : 'Continue with Google'}
          </Button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-background text-muted-foreground">Or continue with email</span>
            </div>
          </div>

          {/* Email Sign In Form */}
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors bg-card text-foreground"
                placeholder="Enter your email"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors bg-card text-foreground"
                placeholder="Enter your password"
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-muted-foreground">
                  Remember me
                </label>
              </div>
              <Link
                href="/forgot-password"
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={loading}
              size="lg"
              className="w-full"
            >
              {loading ? 'Signing in...' : 'Sign in'}
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
                    We&apos;ve sent a sign-in link to <span className="font-medium text-foreground">{emailLinkEmail}</span>. 
                    Click the link in the email to sign in.
                  </p>
                  <div className="mt-3 pt-3 border-t border-success/20">
                    <p className="text-xs text-muted-foreground font-medium mb-1">Didn&apos;t receive the email?</p>
                    <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                      <li>Check your spam/junk folder</li>
                      <li>Wait a few minutes (emails can take 1-5 minutes)</li>
                      <li>Make sure <span className="font-medium">{emailLinkEmail}</span> is correct</li>
                      <li>Try clicking &quot;Sign in with email link&quot; again</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Divider for Email Link Option */}
          {!emailLinkSent && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-background text-muted-foreground">Or</span>
                </div>
              </div>

              {/* Email Link Sign In */}
              <form onSubmit={handleEmailLinkSignIn} className="space-y-4">
                <Button
                  type="submit"
                  disabled={loading}
                  variant="outline"
                  size="lg"
                  className="w-full bg-card hover:bg-muted border-border"
                >
                  <Mail className="w-5 h-5 mr-3" />
                  {loading ? 'Sending link...' : 'Sign in with email link'}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  No password needed. We&apos;ll send you a secure link to sign in.
                </p>
              </form>
            </>
          )}

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-muted-foreground text-sm">
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>

          {/* Footer Links */}
          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground">
              By signing in, you agree to our{' '}
              <Link href="/terms" className="text-primary hover:text-primary/80">
                Terms
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-primary hover:text-primary/80">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Feature Showcase */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 items-center justify-center p-8 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 max-w-lg">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-3">
              AI-Powered Customer Engagement
            </h2>
            <p className="text-base text-muted-foreground">
              Transform your customer interactions with intelligent automation
            </p>
          </div>

          {/* Feature Cards */}
          <div className="space-y-4">
            <div className="group bg-card/50 backdrop-blur border border-border rounded-lg p-4 hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm mb-0.5">Smart AI Responses</h3>
                  <p className="text-xs text-muted-foreground">
                    Contextual conversations that understand and adapt
                  </p>
                </div>
              </div>
            </div>

            <div className="group bg-card/50 backdrop-blur border border-border rounded-lg p-4 hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in delay-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center group-hover:bg-success/20 transition-colors flex-shrink-0">
                  <Zap className="w-5 h-5 text-success" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm mb-0.5">Instant Deployment</h3>
                  <p className="text-xs text-muted-foreground">
                    Set up in minutes, not hours
                  </p>
                </div>
              </div>
            </div>

            <div className="group bg-card/50 backdrop-blur border border-border rounded-lg p-4 hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in delay-400">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center group-hover:bg-warning/20 transition-colors flex-shrink-0">
                  <MessageSquare className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm mb-0.5">Multi-Channel Support</h3>
                  <p className="text-xs text-muted-foreground">
                    WhatsApp, web chat, and more in one place
                  </p>
                </div>
              </div>
            </div>

            <div className="group bg-card/50 backdrop-blur border border-border rounded-lg p-4 hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in delay-600">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-info/10 rounded-lg flex items-center justify-center group-hover:bg-info/20 transition-colors flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-info" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm mb-0.5">Real-Time Analytics</h3>
                  <p className="text-xs text-muted-foreground">
                    Track performance and optimize engagement
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary mb-0.5">99%</div>
              <div className="text-xs text-muted-foreground">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary mb-0.5">&lt;1s</div>
              <div className="text-xs text-muted-foreground">Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary mb-0.5">24/7</div>
              <div className="text-xs text-muted-foreground">Available</div>
            </div>
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
}
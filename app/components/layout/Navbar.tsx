'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/workspace-auth-context';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '../brand';
import { Menu, X } from 'lucide-react';
import { events } from '@/app/lib/posthog';

export function Navbar() {
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return (
    <nav className={`border-b bg-background/95 backdrop-blur-md sticky top-0 z-50 transition-all duration-300 ${
      scrolled ? 'border-border shadow-md bg-background/98' : 'border-border/50'
    }`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-10">
            <Link href="/" className="flex items-center group">
              <BrandLogo size="lg" className="transition-transform duration-300 group-hover:scale-105" showText={true} />
            </Link>

            {/* Desktop Navigation - Enhanced */}
            <div className="hidden md:flex md:items-center md:gap-1">
              <Link 
                href="/pricing" 
                className="px-4 py-2 text-sm text-foreground/80 hover:text-foreground font-medium rounded-lg hover:bg-muted/50 transition-all duration-200 relative group"
                onClick={() => events.linkClicked('/pricing', 'Pricing')}
              >
                Pricing
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-200"></span>
              </Link>

              <Link 
                href="/documentation" 
                className="px-4 py-2 text-sm text-foreground/80 hover:text-foreground font-medium rounded-lg hover:bg-muted/50 transition-all duration-200 relative group"
                onClick={() => events.linkClicked('/documentation', 'Documentation')}
              >
                Documentation
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-200"></span>
              </Link>
            </div>
          </div>

          {/* Desktop Auth Buttons - Enhanced */}
          <div className="hidden md:flex md:items-center md:gap-3">
            {user ? (
              <>
                <Link href="/dashboard">
                  <Button 
                    variant="ghost" 
                    size="default" 
                    className="text-sm h-9 px-4 text-foreground/80 hover:text-foreground hover:bg-muted/50 transition-all duration-200"
                    onClick={() => events.buttonClicked('Dashboard', 'navbar')}
                  >
                    Dashboard
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => {
                    events.buttonClicked('Sign Out', 'navbar');
                    signOut();
                  }}
                  className="text-sm h-9 px-4 border-border hover:border-border-strong hover:bg-muted/50 transition-all duration-200"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/signin">
                  <Button 
                    variant="ghost" 
                    size="default" 
                    className="text-sm h-9 px-4 text-foreground/80 hover:text-foreground hover:bg-muted/50 transition-all duration-200"
                    onClick={() => events.buttonClicked('Sign In', 'navbar')}
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button 
                    size="default" 
                    className="text-sm h-9 px-5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md transition-all duration-200"
                    onClick={() => events.buttonClicked('Try for Free', 'navbar')}
                  >
                    Try for Free
                  </Button>
                </Link>
              </>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              suppressHydrationWarning
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-lg text-foreground/70 hover:text-foreground hover:bg-muted/50 transition-all duration-200"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu - Enhanced */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-background/98 backdrop-blur-md border-t border-border shadow-lg">
          <div className="px-4 py-4 space-y-1">
            <Link
              href="/pricing"
              className="block px-4 py-3 text-base font-medium text-foreground/80 hover:text-foreground hover:bg-muted/50 rounded-lg transition-all duration-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </Link>

            <Link
              href="/documentation"
              className="block px-4 py-3 text-base font-medium text-foreground/80 hover:text-foreground hover:bg-muted/50 rounded-lg transition-all duration-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              Documentation
            </Link>

            <div className="pt-4 mt-4 border-t border-border/60 space-y-2">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="block px-4 py-3 text-base font-medium text-foreground/80 hover:text-foreground hover:bg-muted/50 rounded-lg transition-all duration-200"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    suppressHydrationWarning
                    onClick={() => {
                      signOut();
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-3 text-base font-medium text-foreground/80 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all duration-200"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/signin"
                    className="block px-4 py-3 text-base font-medium text-foreground/80 hover:text-foreground hover:bg-muted/50 rounded-lg transition-all duration-200"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="block px-4 py-3 text-base font-semibold text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg text-center shadow-sm transition-all duration-200"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Try for Free
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
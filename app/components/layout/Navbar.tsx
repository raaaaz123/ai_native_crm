'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/workspace-auth-context';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '../brand';
import { Menu, X, ChevronDown } from 'lucide-react';

export function Navbar() {
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);
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
      scrolled ? 'border-border shadow-lg' : 'border-border/50 shadow-sm'
    }`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <BrandLogo className="h-8 w-auto" />
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:ml-10 md:flex md:items-center md:space-x-8">
              <div className="relative">
                <button 
                  suppressHydrationWarning
                  className="flex items-center text-foreground/70 hover:text-foreground font-medium transition-all duration-200 hover:scale-105"
                  onClick={() => setProductDropdownOpen(!productDropdownOpen)}
                >
                  Product
                  <ChevronDown className={`ml-1 h-4 w-4 transition-transform duration-200 ${productDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {productDropdownOpen && (
                  <div className="absolute left-0 mt-3 w-56 rounded-xl shadow-xl bg-card border border-border overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-2">
                      <Link href="#features" className="block px-4 py-3 text-sm text-foreground/70 hover:bg-muted hover:text-foreground rounded-lg transition-all duration-200 hover:scale-105">
                        Features
                      </Link>
                      <Link href="/pricing" className="block px-4 py-3 text-sm text-foreground/70 hover:bg-muted hover:text-foreground rounded-lg transition-all duration-200 hover:scale-105">
                        Pricing
                      </Link>
                      <Link href="#docs" className="block px-4 py-3 text-sm text-foreground/70 hover:bg-muted hover:text-foreground rounded-lg transition-all duration-200 hover:scale-105">
                        Documentation
                      </Link>
                    </div>
                  </div>
                )}
              </div>
              
              <Link href="/pricing" className="text-foreground/70 hover:text-foreground font-medium transition-all duration-200 hover:scale-105">
                Pricing
              </Link>
              
              <Link href="#docs" className="text-foreground/70 hover:text-foreground font-medium transition-all duration-200 hover:scale-105">
                Documentation
              </Link>
            </div>
          </div>
          
          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex md:items-center md:space-x-2">
            {user ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" className="text-foreground/70 hover:text-foreground font-semibold hover:bg-muted/50 transition-all duration-200 hover:scale-105 cursor-pointer">Dashboard</Button>
                </Link>
                <Button 
                  variant="outline" 
                  onClick={signOut}
                  className="border-2 border-border text-foreground/70 hover:bg-muted hover:border-border/80 rounded-md font-semibold transition-all duration-200 hover:scale-105 cursor-pointer"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/signin">
                  <Button variant="ghost" className="text-foreground/70 hover:text-foreground font-bold hover:bg-muted/50 transition-all duration-200 hover:scale-105 cursor-pointer">Sign In</Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md hover:shadow-lg transition-all duration-300 rounded-md px-5 hover:scale-105 cursor-pointer">Try for Free</Button>
                </Link>
              </>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              suppressHydrationWarning
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-lg text-foreground/60 hover:text-foreground hover:bg-muted transition-all duration-200 hover:scale-110 active:scale-95"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-background border-t border-border shadow-lg">
          <div className="px-4 pt-3 pb-4 space-y-1">
            <div className="py-1">
              <button 
                suppressHydrationWarning
                className="w-full text-left px-3 py-2 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-muted rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
                onClick={() => setProductDropdownOpen(!productDropdownOpen)}
              >
                <div className="flex justify-between items-center">
                  Product
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${productDropdownOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>
              
              {productDropdownOpen && (
                <div className="pl-3 mt-1 space-y-1">
                  <Link href="#features" className="block px-3 py-2 text-sm font-medium text-foreground/60 hover:text-foreground hover:bg-muted rounded-lg transition-all duration-200 hover:scale-105">
                    Features
                  </Link>
                  <Link href="/pricing" className="block px-3 py-2 text-sm font-medium text-foreground/60 hover:text-foreground hover:bg-muted rounded-lg transition-all duration-200 hover:scale-105">
                    Pricing
                  </Link>
                  <Link href="#docs" className="block px-3 py-2 text-sm font-medium text-foreground/60 hover:text-foreground hover:bg-muted rounded-lg transition-all duration-200 hover:scale-105">
                    Documentation
                  </Link>
                </div>
              )}
            </div>
            
            <Link href="/pricing" className="block px-3 py-2 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-muted rounded-lg transition-all duration-200 hover:scale-105">
              Pricing
            </Link>
            
            <Link href="#docs" className="block px-3 py-2 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-muted rounded-lg transition-all duration-200 hover:scale-105">
              Documentation
            </Link>
            
            <div className="pt-4 mt-3 border-t border-border space-y-1">
              {user ? (
                <>
                  <Link href="/dashboard" className="block px-3 py-2 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-muted rounded-lg transition-all duration-200 hover:scale-105 cursor-pointer">
                    Dashboard
                  </Link>
                  <button 
                    suppressHydrationWarning
                    onClick={signOut}
                    className="block w-full text-left px-3 py-2 text-sm font-medium text-foreground/70 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/signin" className="block px-3 py-2 text-sm font-bold text-foreground/70 hover:text-foreground hover:bg-muted rounded-lg transition-all duration-200 hover:scale-105 cursor-pointer">
                    Sign In
                  </Link>
                  <Link href="/signup" className="block px-3 py-2 mt-2 text-sm font-bold text-primary-foreground bg-primary hover:bg-primary/90 rounded-md text-center shadow-md transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer">
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
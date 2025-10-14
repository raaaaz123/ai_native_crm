'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/auth-context';
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
    <nav className={`border-b bg-white/95 backdrop-blur-md sticky top-0 z-50 transition-all duration-300 ${
      scrolled ? 'border-gray-200 shadow-lg' : 'border-gray-100 shadow-sm'
    }`}>
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <BrandLogo className="h-8 w-auto" />
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:ml-12 md:flex md:items-center md:space-x-10">
              <div className="relative">
                <button 
                  suppressHydrationWarning
                  className="flex items-center text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200"
                  onClick={() => setProductDropdownOpen(!productDropdownOpen)}
                >
                  Product
                  <ChevronDown className={`ml-1 h-4 w-4 transition-transform duration-200 ${productDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {productDropdownOpen && (
                  <div className="absolute left-0 mt-3 w-56 rounded-xl shadow-xl bg-white border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-2">
                      <Link href="#features" className="block px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors">
                        Features
                      </Link>
                      <Link href="#pricing" className="block px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors">
                        Pricing
                      </Link>
                      <Link href="#docs" className="block px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors">
                        Documentation
                      </Link>
                    </div>
                  </div>
                )}
              </div>
              
              <Link href="#pricing" className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200">
                Pricing
              </Link>
              
              <Link href="#docs" className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200">
                Documentation
              </Link>
            </div>
          </div>
          
          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {user ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" className="text-gray-700 hover:text-blue-600 font-medium hover:bg-blue-50/50">Dashboard</Button>
                </Link>
                <Button 
                  variant="outline" 
                  onClick={signOut}
                  className="border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 rounded-lg font-medium"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/signin">
                  <Button variant="ghost" className="text-gray-700 hover:text-blue-600 font-medium hover:bg-blue-50/50">Sign In</Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300 rounded-lg px-6">Get Started</Button>
                </Link>
              </>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              suppressHydrationWarning
              type="button"
              className="inline-flex items-center justify-center p-2.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
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
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
          <div className="px-6 pt-4 pb-6 space-y-2">
            <div className="py-2">
              <button 
                suppressHydrationWarning
                className="w-full text-left px-4 py-3 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                onClick={() => setProductDropdownOpen(!productDropdownOpen)}
              >
                <div className="flex justify-between items-center">
                  Product
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${productDropdownOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>
              
              {productDropdownOpen && (
                <div className="pl-4 mt-2 space-y-1">
                  <Link href="#features" className="block px-4 py-3 text-base font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    Features
                  </Link>
                  <Link href="#pricing" className="block px-4 py-3 text-base font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    Pricing
                  </Link>
                  <Link href="#docs" className="block px-4 py-3 text-base font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    Documentation
                  </Link>
                </div>
              )}
            </div>
            
            <Link href="#pricing" className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              Pricing
            </Link>
            
            <Link href="#docs" className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              Documentation
            </Link>
            
            <div className="pt-6 mt-4 border-t border-gray-200 space-y-2">
              {user ? (
                <>
                  <Link href="/dashboard" className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    Dashboard
                  </Link>
                  <button 
                    suppressHydrationWarning
                    onClick={signOut}
                    className="block w-full text-left px-4 py-3 text-base font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/signin" className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    Sign In
                  </Link>
                  <Link href="/signup" className="block px-4 py-3 mt-2 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg text-center shadow-md transition-all">
                    Get Started
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
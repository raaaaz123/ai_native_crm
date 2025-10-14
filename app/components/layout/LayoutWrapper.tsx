'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Show navbar/footer on landing page and auth pages, but not on dashboard pages
  const isLandingPage = pathname === '/';
  const isAuthPage = pathname.startsWith('/signin') || pathname.startsWith('/signup');
  const isDashboardPage = pathname.startsWith('/dashboard');
  
  // Don't show navbar/footer on dashboard pages
  if (isDashboardPage) {
    return <>{children}</>;
  }
  
  // Show navbar/footer on landing page and auth pages
  if (isLandingPage || isAuthPage) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </div>
    );
  }
  
  // For other pages (like widget pages), don't show navbar/footer
  return <>{children}</>;
}
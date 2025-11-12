'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Don't show navbar/footer on dashboard pages and widget pages
  const isDashboardPage = pathname?.startsWith('/dashboard');
  const isWidgetPage = pathname?.startsWith('/widget') || pathname?.startsWith('/chat');
  const isReviewPage = pathname?.startsWith('/review') && !pathname?.startsWith('/dashboard');
  const isConversationPage = pathname?.startsWith('/conversations') && !pathname?.startsWith('/dashboard');
  const isInvitePage = pathname?.startsWith('/invite');
  const isHelpPage = pathname?.startsWith('/help');
  const isAuthPage = pathname?.startsWith('/signin') || pathname?.startsWith('/signup');

  // Don't show navbar/footer on these pages
  if (isDashboardPage || isWidgetPage || isReviewPage || isConversationPage || isInvitePage || isHelpPage || isAuthPage) {
    return <>{children}</>;
  }
  
  // Show navbar/footer on all other pages (landing, auth, contact, pricing, 404, etc.)
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
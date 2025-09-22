"use client";

import { useState } from 'react';
import { useAuth } from '../lib/auth-context';
import { Sidebar } from '../components/layout/Sidebar';
import { MobileMenuButton } from '../components/layout/MobileMenuButton';
import { Container } from '@/components/layout';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userData, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-40">
          <Container>
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center space-x-4">
                <MobileMenuButton 
                  onClick={() => setSidebarOpen(true)} 
                  isOpen={sidebarOpen}
                />
                <div>
                  <h1 className="text-xl font-bold text-neutral-900">Dashboard</h1>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  {userData?.photoURL && (
                    <Image
                      src={userData.photoURL}
                      alt="Profile"
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                    />
                  )}
                  <div className="text-right">
                    <p className="text-sm font-medium text-neutral-900">
                      {userData?.displayName || user?.displayName || 'User'}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {userData?.email || user?.email}
                    </p>
                  </div>
                </div>
                
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  size="sm"
                  className="bg-white/50 hover:bg-white/80"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </Container>
        </header>

        {/* Page Content */}
        <main className="py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

"use client";

import { useState } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { MobileMenuButton } from '../components/layout/MobileMenuButton';
import { Container } from '@/components/layout';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main Content */}
      <div className="lg:ml-72">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-40">
          <Container>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-4">
                <MobileMenuButton 
                  onClick={() => setSidebarOpen(true)} 
                  isOpen={sidebarOpen}
                />
              </div>
              
            </div>
          </Container>
        </header>

        {/* Page Content */}
        <main className="py-0">
          {children}
        </main>
      </div>
    </div>
  );
}

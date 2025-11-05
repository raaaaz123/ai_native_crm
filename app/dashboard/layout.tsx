"use client";

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { AppSidebar } from '../components/layout/Sidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth } from '../lib/workspace-auth-context';
import { WorkspaceSelector } from '../components/workspace/WorkspaceSelector';
import { AgentWorkspaceSelector } from '../components/workspace/AgentWorkspaceSelector';
import { CreateWorkspaceModal } from '../components/workspace/CreateWorkspaceModal';
import { Button } from '@/components/ui/button';
import {
  Bell,
  HelpCircle,
  Settings,
  Search,
  User,
  ChevronDown,
  LogOut
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Toaster } from '@/components/ui/sonner';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [currentAgentName, setCurrentAgentName] = useState<string | null>(null);
  const [currentAgentId, setCurrentAgentId] = useState<string | null>(null);
  const { userData, signOut } = useAuth();
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Check if we're on an agent page and extract agent info
  useEffect(() => {
    const agentPageMatch = pathname?.match(/\/dashboard\/([^\/]+)\/agents\/([^\/]+)/);
    const isAgentPage = !!agentPageMatch && agentPageMatch[2] !== 'agents';

    if (isAgentPage && agentPageMatch) {
      const agentId = agentPageMatch[2];
      setCurrentAgentId(agentId);

      // Load agent name from Firestore
      const loadAgentName = async () => {
        try {
          const agentDoc = await getDoc(doc(db, 'agents', agentId));
          if (agentDoc.exists()) {
            setCurrentAgentName(agentDoc.data().name || 'Agent');
          }
        } catch (error) {
          console.error('Error loading agent:', error);
        }
      };

      loadAgentName();
    } else {
      setCurrentAgentId(null);
      setCurrentAgentName(null);
    }
  }, [pathname]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="pt-16">
        {/* Fixed Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" suppressHydrationWarning />

            {/* Conditional Selector - Show AgentWorkspaceSelector on agent pages */}
            {currentAgentId && currentAgentName ? (
              <AgentWorkspaceSelector
                currentAgentId={currentAgentId}
                currentAgentName={currentAgentName}
                onCreateWorkspace={() => setShowCreateWorkspace(true)}
              />
            ) : (
              <WorkspaceSelector
                onCreateWorkspace={() => setShowCreateWorkspace(true)}
              />
            )}
          </div>

          {/* Right Side */}
          <div className="ml-auto flex items-center gap-3 px-4">
            {/* Search */}
            <div className="hidden sm:flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg bg-white/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 w-64"
                  suppressHydrationWarning
                />
              </div>
            </div>

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Bell className="w-4 h-4" />
            </Button>

            {/* Help */}
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <HelpCircle className="w-4 h-4" />
            </Button>

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <Button
                variant="ghost"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 h-8 px-2"
                suppressHydrationWarning
              >
                {userData?.photoURL ? (
                  <Image
                    src={userData.photoURL}
                    alt="Profile"
                    width={24}
                    height={24}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-xs font-semibold" suppressHydrationWarning>
                    {userData?.firstName?.charAt(0) || userData?.displayName?.charAt(0) || 'U'}
                  </div>
                )}
                <ChevronDown className="w-3 h-3" />
              </Button>

              {/* User Dropdown */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                  <div className="border-t border-gray-100 my-1"></div>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      signOut();
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex flex-1 flex-col gap-4 p-4 overflow-y-auto">
          {children}
        </div>
      </SidebarInset>

      {/* Create Workspace Modal */}
      <CreateWorkspaceModal
        isOpen={showCreateWorkspace}
        onClose={() => setShowCreateWorkspace(false)}
      />

      {/* Toast Notifications */}
      <Toaster />
    </SidebarProvider>
  );
}

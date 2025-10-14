"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '../../lib/auth-context';
import { 
  Home, 
  Settings, 
  ChevronLeft,
  MessageCircle,
  BookOpen,
  Bot,
  Star,
  LogOut,
  Users
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: <Home className="w-5 h-5" />
  },
  {
    name: 'Conversations',
    href: '/dashboard/conversations',
    icon: <MessageCircle className="w-5 h-5" />
  },
  {
    name: 'Widgets',
    href: '/dashboard/widgets',
    icon: <Bot className="w-5 h-5" />
  },
  {
    name: 'Knowledge Base',
    href: '/dashboard/knowledge-base',
    icon: <BookOpen className="w-5 h-5" />
  },
  {
    name: 'Review Forms',
    href: '/dashboard/review-forms',
    icon: <Star className="w-5 h-5" />
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: <Settings className="w-5 h-5" />
  },
  {
    name: 'Team Management',
    href: '/dashboard/settings/team',
    icon: <Users className="w-5 h-5" />
  }
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { userData, signOut } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      // Redirect to home page after successful sign out
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-72 bg-gradient-to-b from-white to-gray-50/50 shadow-2xl z-50 transform transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:shadow-lg lg:border-r lg:border-gray-200
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
                <Home className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Rexa CRM</p>
                <p className="text-xs text-gray-500">Dashboard</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={`
                    group flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                    ${isActive 
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                >
                  <span className={`transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                    {item.icon}
                  </span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Profile Section - Moved to Bottom */}
          <div className="px-4 py-5 border-t border-gray-200 bg-gradient-to-b from-transparent to-gray-50/50">
            <div className="flex items-center space-x-3 mb-4 px-3 py-3 bg-white rounded-xl border border-gray-200 shadow-sm">
              {mounted && userData?.photoURL ? (
                <Image
                  src={userData.photoURL}
                  alt="Profile"
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-xl border-2 border-blue-100 shadow-sm"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-md">
                  {mounted ? (userData?.firstName?.charAt(0) || userData?.displayName?.charAt(0) || 'U') : 'U'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {mounted ? (userData?.displayName || userData?.firstName || 'User') : 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {mounted ? (userData?.email || 'No email') : 'Loading...'}
                </p>
              </div>
            </div>
            
            {/* Sign Out Button */}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl text-sm font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300 transition-all shadow-sm hover:shadow-md"
              suppressHydrationWarning
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="text-xs text-gray-400 text-center font-medium">
              AI Native CRM v1.0
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

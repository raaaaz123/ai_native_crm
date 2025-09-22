"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '../../lib/auth-context';
import { 
  Home, 
  Users, 
  Building2, 
  FileText, 
  BarChart3, 
  Settings, 
  ChevronLeft,
  Menu,
  MessageCircle,
  BookOpen
} from 'lucide-react'

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
    name: 'Contacts',
    href: '/dashboard/contacts',
    icon: <Users className="w-5 h-5" />
  },
  {
    name: 'Companies',
    href: '/dashboard/companies',
    icon: <Building2 className="w-5 h-5" />
  },
  {
    name: 'Conversations',
    href: '/dashboard/conversations',
    icon: <MessageCircle className="w-5 h-5" />
  },
  {
    name: 'Knowledge Base',
    href: '/dashboard/knowledge-base',
    icon: <BookOpen className="w-5 h-5" />
  },
  {
    name: 'Deals',
    href: '/dashboard/deals',
    icon: <FileText className="w-5 h-5" />
  },
  {
    name: 'Activities',
    href: '/dashboard/activities',
    icon: <FileText className="w-5 h-5" />
  },
  {
    name: 'Reports',
    href: '/dashboard/reports',
    icon: <BarChart3 className="w-5 h-5" />
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: <Settings className="w-5 h-5" />
  }
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { userData } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:shadow-none lg:border-r lg:border-neutral-200
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-end p-4 border-b border-neutral-200">
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Section */}
          <div className="p-4 border-b border-neutral-200">
            <div className="flex items-center space-x-3">
              {mounted && userData?.photoURL ? (
                <Image
                  src={userData.photoURL}
                  alt="Profile"
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-semibold text-sm">
                  {mounted ? (userData?.firstName?.charAt(0) || userData?.displayName?.charAt(0) || 'U') : 'U'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate">
                  {mounted ? (userData?.displayName || userData?.firstName || 'User') : 'User'}
                </p>
                <p className="text-xs text-neutral-500 truncate">
                  {mounted ? (userData?.email || 'No email') : 'Loading...'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={`
                    flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isActive 
                      ? 'bg-primary-50 text-primary-700' 
                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                    }
                  `}
                >
                  <span className={isActive ? 'text-primary-500' : 'text-neutral-400'}>
                    {item.icon}
                  </span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-3 border-t border-neutral-200">
            <div className="text-xs text-neutral-500 text-center">
              AI Native CRM v1.0
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

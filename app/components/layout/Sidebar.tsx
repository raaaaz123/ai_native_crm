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
  ChevronDown,
  ChevronRight,
  MessageCircle,
  BookOpen,
  Bot,
  Star,
  LogOut,
  Users,
  Share2,
  BarChart3,
  UserCog,
  Building2,
  Mail,
  Bell,
  Shield,
  Palette,
  MessageSquare,
  Activity,
  Crown,
  Clock
} from 'lucide-react';
import { getSubscriptionInfo } from '../../lib/subscription-utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SubMenuItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

interface MenuItem {
  name: string;
  href?: string;
  icon: React.ReactNode;
  subItems?: SubMenuItem[];
  badge?: string;
}

const navigationItems: MenuItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: <Home className="w-5 h-5" />
  },
  {
    name: 'Conversations',
    href: '/dashboard/conversations',
    icon: <MessageCircle className="w-5 h-5" />,
    subItems: [
      {
        name: 'All Conversations',
        href: '/dashboard/conversations',
        icon: <MessageSquare className="w-4 h-4" />
      },
      {
        name: 'Active Chats',
        href: '/dashboard/conversations?status=active',
        icon: <Activity className="w-4 h-4" />,
        badge: 'Live'
      },
      {
        name: 'Pending',
        href: '/dashboard/conversations?status=pending',
        icon: <MessageCircle className="w-4 h-4" />
      },
      {
        name: 'Resolved',
        href: '/dashboard/conversations?status=resolved',
        icon: <MessageCircle className="w-4 h-4" />
      }
    ]
  },
  {
    name: 'Chat Widgets',
    icon: <Bot className="w-5 h-5" />,
    subItems: [
      {
        name: 'All Widgets',
        href: '/dashboard/widgets',
        icon: <Bot className="w-4 h-4" />
      },
      {
        name: 'Share Widget',
        href: '/dashboard/widgets/share',
        icon: <Share2 className="w-4 h-4" />
      },
      {
        name: 'Widget Analytics',
        href: '/dashboard/widgets?tab=analytics',
        icon: <BarChart3 className="w-4 h-4" />
      },
      {
        name: 'Customize',
        href: '/dashboard/widgets?tab=customize',
        icon: <Palette className="w-4 h-4" />
      }
    ]
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
    icon: <Settings className="w-5 h-5" />,
    subItems: [
      {
        name: 'General',
        href: '/dashboard/settings',
        icon: <Settings className="w-4 h-4" />
      },
      {
        name: 'Team Management',
        href: '/dashboard/settings/team',
        icon: <Users className="w-4 h-4" />
      },
      {
        name: 'Company Profile',
        href: '/dashboard/settings/company',
        icon: <Building2 className="w-4 h-4" />
      },
      {
        name: 'User Profile',
        href: '/dashboard/settings/profile',
        icon: <UserCog className="w-4 h-4" />
      },
      {
        name: 'Notifications',
        href: '/dashboard/settings/notifications',
        icon: <Bell className="w-4 h-4" />
      },
      {
        name: 'Email Settings',
        href: '/dashboard/settings/email',
        icon: <Mail className="w-4 h-4" />
      },
      {
        name: 'Security',
        href: '/dashboard/settings/security',
        icon: <Shield className="w-4 h-4" />
      }
    ]
  }
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { userData, signOut } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [currentSearch, setCurrentSearch] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Track URL search params changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentSearch(window.location.search);
      
      // Poll for search param changes (Next.js client-side navigation doesn't trigger popstate)
      const interval = setInterval(() => {
        if (window.location.search !== currentSearch) {
          setCurrentSearch(window.location.search);
        }
      }, 100);
      
      return () => clearInterval(interval);
    }
  }, [currentSearch]);

  useEffect(() => {
    // Auto-expand menu items that contain the current path or query params
    const itemsToExpand: string[] = [];
    navigationItems.forEach(item => {
      if (item.subItems) {
        const hasActiveChild = item.subItems.some(subItem => {
          // Check for query param matches
          if (subItem.href.includes('?') && typeof window !== 'undefined') {
            const [path, query] = subItem.href.split('?');
            if (pathname === path) {
              const urlParams = new URLSearchParams(window.location.search);
              const hrefParams = new URLSearchParams(query);
              for (const [key, value] of hrefParams.entries()) {
                if (urlParams.get(key) === value) return true;
              }
            }
          }
          return pathname === subItem.href || pathname?.startsWith(subItem.href + '/');
        });
        if (hasActiveChild) {
          itemsToExpand.push(item.name);
        }
      }
    });
    setExpandedItems(itemsToExpand);
  }, [pathname, currentSearch]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const toggleExpand = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  const isActive = (href: string) => {
    if (!pathname) return false;
    
    // For paths with query params
    if (href.includes('?')) {
      const [path, query] = href.split('?');
      
      // Check if pathname matches
      if (pathname !== path) return false;
      
      // Check if query params match
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const hrefParams = new URLSearchParams(query);
        
        // If href has params, all must match
        for (const [key, value] of hrefParams.entries()) {
          if (urlParams.get(key) !== value) return false;
        }
        return true;
      }
    }
    
    // For exact path matches (no query params in href)
    if (pathname === href) {
      // If we're at /dashboard/conversations with no params, only match /dashboard/conversations (not query variants)
      if (typeof window !== 'undefined' && window.location.search && href === '/dashboard/conversations') {
        return false; // Don't match if URL has query params but href doesn't
      }
      return true;
    }
    
    // For parent routes (but not dashboard to avoid always highlighting it)
    if (href !== '/dashboard' && pathname.startsWith(href + '/')) return true;
    
    return false;
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
        fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-50 transform transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:shadow-lg lg:border-r lg:border-gray-200
      `}>
        <div className="flex flex-col h-full">
          {/* Modern Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
                <Home className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Rexa CRM</p>
                <p className="text-xs text-gray-500 font-medium">AI-Powered</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-lg hover:bg-white/80 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Navigation with Sub-menus */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
            {navigationItems.map((item) => {
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const isExpanded = expandedItems.includes(item.name);
              const isItemActive = item.href ? isActive(item.href) : false;

              return (
                <div key={item.name}>
                  {/* Main Menu Item */}
                  {hasSubItems ? (
                    item.href ? (
                      // Has href - clickable with toggle
                      <div className="flex items-center gap-1">
                        <Link
                          href={item.href}
                          onClick={onClose}
                          className={`
                            group flex-1 flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                            ${isItemActive
                              ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700' 
                              : isExpanded
                              ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700'
                              : 'text-gray-700 hover:bg-gray-50'
                            }
                          `}
                        >
                          <div className="flex items-center space-x-3">
                            <span className={`transition-colors ${isItemActive || isExpanded ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                              {item.icon}
                            </span>
                            <span>{item.name}</span>
                          </div>
                        </Link>
                        <button
                          onClick={() => toggleExpand(item.name)}
                          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    ) : (
                      // No href - just toggle
                      <button
                        onClick={() => toggleExpand(item.name)}
                        className={`
                          group w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                          ${isExpanded
                            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700' 
                            : 'text-gray-700 hover:bg-gray-50'
                          }
                        `}
                      >
                        <div className="flex items-center space-x-3">
                          <span className={`transition-colors ${isExpanded ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                            {item.icon}
                          </span>
                          <span>{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.badge && (
                            <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">
                              {item.badge}
                            </span>
                          )}
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </button>
                    )
                  ) : (
                    <Link
                      href={item.href || '#'}
                      onClick={onClose}
                      className={`
                        group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                        ${isItemActive
                          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm' 
                          : 'text-gray-700 hover:bg-gray-50'
                        }
                      `}
                    >
                      <div className="flex items-center space-x-3">
                        <span className={`transition-colors ${isItemActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                          {item.icon}
                        </span>
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  )}

                  {/* Sub Menu Items */}
                  {hasSubItems && isExpanded && (
                    <div className="mt-1 ml-4 pl-4 border-l-2 border-blue-200 space-y-1">
                      {item.subItems!.map((subItem) => {
                        const isSubItemActive = isActive(subItem.href);
                        return (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            onClick={onClose}
                            className={`
                              group flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-200
                              ${isSubItemActive
                                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 font-medium shadow-sm border-l-2 border-blue-600' 
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-2 border-transparent'
                              }
                            `}
                          >
                            <div className="flex items-center space-x-2.5">
                              <span className={`transition-colors ${isSubItemActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                                {subItem.icon}
                              </span>
                              <span className="text-xs">{subItem.name}</span>
                            </div>
                            {subItem.badge && (
                              <span className={`px-1.5 py-0.5 text-xs font-semibold rounded-full ${
                                subItem.badge === 'Live' 
                                  ? 'bg-green-100 text-green-700 animate-pulse'
                                  : subItem.badge === 'New'
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {subItem.badge}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Subscription Plan Section */}
          {mounted && userData && (
            <div className="px-3 py-3 border-t border-gray-100">
              <Link href="/dashboard/settings">
                <div className="px-3 py-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 hover:border-blue-300 transition-all cursor-pointer hover:shadow-md">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-semibold text-blue-900">
                        {(() => {
                          const subInfo = getSubscriptionInfo(userData);
                          return subInfo.planDisplay;
                        })()}
                      </span>
                    </div>
                    {(() => {
                      const subInfo = getSubscriptionInfo(userData);
                      return subInfo.isTrialActive && (
                        <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                          Trial
                        </span>
                      );
                    })()}
                  </div>
                  {(() => {
                    const subInfo = getSubscriptionInfo(userData);
                    return subInfo.isTrialActive ? (
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        <span className="text-xs text-blue-700">
                          {subInfo.trialDaysRemaining} {subInfo.trialDaysRemaining === 1 ? 'day' : 'days'} remaining
                        </span>
                      </div>
                    ) : (
                      <div className="text-xs text-blue-700">
                        {subInfo.statusDisplay}
                      </div>
                    );
                  })()}
                </div>
              </Link>
            </div>
          )}

          {/* User Profile Section */}
          <div className="px-3 py-4 border-t border-gray-100 bg-gradient-to-b from-transparent to-gray-50/50">
            <div className="flex items-center space-x-3 mb-3 px-3 py-3 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
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
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300 transition-all shadow-sm hover:shadow-md"
              suppressHydrationWarning
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-gray-100">
            <div className="text-xs text-gray-400 text-center font-medium">
              AI Native CRM v1.0
            </div>
          </div>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </>
  );
}

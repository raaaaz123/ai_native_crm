"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '../../lib/workspace-auth-context';
import {
  Home,
  Settings,
  ChevronRight,
  MessageCircle,
  Bot,
  LogOut,
  Users,
  BarChart3,
  Shield,
  MessageSquare,
  Activity,
  Crown,
  Play,
  Rocket,
  UserPlus,
  ArrowLeft,
  Zap,
  Globe,
  ExternalLink,
  FileIcon,
  AlignLeft,
  FileText,
  Sheet,
  CreditCard,
  Building2
} from 'lucide-react';
import { getSubscriptionInfo } from '../../lib/subscription-utils';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';

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

const getNavigationItems = (workspaceSlug?: string): MenuItem[] => [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: <Home className="w-4 h-4" />
  },
  {
    name: 'Conversations',
    href: workspaceSlug ? `/dashboard/${workspaceSlug}/conversations` : '/dashboard/conversations',
    icon: <MessageCircle className="w-4 h-4" />
  },
  {
    name: 'Agents',
    href: workspaceSlug ? `/dashboard/${workspaceSlug}/agents` : '/dashboard/agents',
    icon: <Bot className="w-4 h-4" />
  },
  {
    name: 'Workspace Settings',
    icon: <Settings className="w-4 h-4" />,
    subItems: [
      {
        name: 'General',
        href: workspaceSlug ? `/dashboard/${workspaceSlug}/settings/general` : '/dashboard/settings/general',
        icon: <Building2 className="w-4 h-4" />
      },
      {
        name: 'Members',
        href: workspaceSlug ? `/dashboard/${workspaceSlug}/settings/members` : '/dashboard/settings/members',
        icon: <Users className="w-4 h-4" />
      },
      {
        name: 'Plans',
        href: workspaceSlug ? `/dashboard/${workspaceSlug}/settings/plans` : '/dashboard/settings/plans',
        icon: <Crown className="w-4 h-4" />
      },
      {
        name: 'Billing',
        href: workspaceSlug ? `/dashboard/${workspaceSlug}/settings/billing` : '/dashboard/settings/billing',
        icon: <CreditCard className="w-4 h-4" />
      }
    ]
  }
];

// Widget-specific menu items
const widgetMenuItems: MenuItem[] = [
  {
    name: 'Playground',
    href: '#', // Will be dynamically set based on current widget
    icon: <Play className="w-5 h-5" />
  },
  {
    name: 'Deploy',
    href: '#', // Will be dynamically set based on current widget
    icon: <Rocket className="w-5 h-5" />
  },
  {
    name: 'Contacts',
    href: '#', // Will be dynamically set based on current widget
    icon: <UserPlus className="w-5 h-5" />
  }
];

// Agent-specific menu items
const agentMenuItems: MenuItem[] = [
  {
    name: 'Playground',
    href: '#', // Will be dynamically set based on current agent
    icon: <Play className="w-5 h-5" />
  },
  {
    name: 'Conversations',
    href: '#', // Will be dynamically set based on current agent
    icon: <MessageCircle className="w-5 h-5" />
  },
  {
    name: 'Deploy',
    href: '#', // Will be dynamically set based on current agent
    icon: <Rocket className="w-5 h-5" />
  },
  {
    name: 'Actions',
    href: '#', // Will be dynamically set based on current agent
    icon: <Activity className="w-5 h-5" />
  },
  {
    name: 'Contacts',
    href: '#', // Will be dynamically set based on current agent
    icon: <Users className="w-5 h-5" />
  },
  {
    name: 'Sources',
    href: '#', // Will be dynamically set based on current agent
    icon: <FileText className="w-5 h-5" />,
    subItems: [
      {
        name: 'Files',
        href: '#', // Will be dynamically set
        icon: <FileIcon className="w-4 h-4" />
      },
      {
        name: 'Text',
        href: '#', // Will be dynamically set
        icon: <AlignLeft className="w-4 h-4" />
      },
      {
        name: 'Website',
        href: '#', // Will be dynamically set
        icon: <Globe className="w-4 h-4" />
      },
      {
        name: 'FAQ',
        href: '#', // Will be dynamically set
        icon: <MessageSquare className="w-4 h-4" />
      },
      {
        name: 'Notion',
        href: '#', // Will be dynamically set
        icon: <FileText className="w-4 h-4" />
      },
      {
        name: 'Google Sheets',
        href: '#', // Will be dynamically set
        icon: <Sheet className="w-4 h-4" />
      }
    ]
  },
  {
    name: 'Settings',
    href: '#', // Will be dynamically set based on current agent
    icon: <Settings className="w-5 h-5" />,
    subItems: [
      {
        name: 'General',
        href: '#', // Will be dynamically set
        icon: <Settings className="w-4 h-4" />
      },
      {
        name: 'AI Configuration',
        href: '#', // Will be dynamically set
        icon: <Zap className="w-4 h-4" />
      },
      {
        name: 'Security',
        href: '#', // Will be dynamically set
        icon: <Shield className="w-4 h-4" />
      },
      {
        name: 'Custom Domains',
        href: '#', // Will be dynamically set
        icon: <Globe className="w-4 h-4" />
      },
      {
        name: 'Integrations',
        href: '#', // Will be dynamically set
        icon: <ExternalLink className="w-4 h-4" />
      }
    ]
  },
  {
    name: 'Analytics',
    href: '#', // Will be dynamically set based on current agent
    icon: <BarChart3 className="w-5 h-5" />
  }
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { userData, signOut } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [currentSearch, setCurrentSearch] = useState('');

  // Extract workspace slug from URL
  const workspaceSlug = pathname?.match(/\/dashboard\/([^\/]+)/)?.[1];
  
  // Check if we're in a widget-specific page
  const isWidgetPage = pathname?.includes('/dashboard/widgets/') && pathname !== '/dashboard/widgets';
  const currentWidgetId = isWidgetPage ? pathname.split('/').pop() : null;

  // Check if we're in an agent-specific page (including sub-pages like playground, deploy, settings, analytics)
  // Pattern: /dashboard/[workspace]/agents/[agentId] or /dashboard/[workspace]/agents/[agentId]/[subpage]
  const agentPageMatch = pathname?.match(/\/dashboard\/([^\/]+)\/agents\/([^\/]+)/);
  const isAgentPage = !!agentPageMatch && agentPageMatch[2] !== 'agents';
  const currentAgentId = isAgentPage ? agentPageMatch[2] : null;

  // Check if we're on the knowledge base creation page
  const isKnowledgeBasePage = pathname?.includes('/create-new-agent/knowledgebase');

  // Update widget menu items with proper URLs
  const getWidgetMenuItems = () => {
    if (!currentWidgetId) return widgetMenuItems;
    
    return widgetMenuItems.map(item => ({
      ...item,
      href: workspaceSlug 
        ? `/dashboard/${workspaceSlug}/widgets/${currentWidgetId}/${item.name.toLowerCase()}`
        : `/dashboard/widgets/${currentWidgetId}/${item.name.toLowerCase()}`
    }));
  };

  // Update agent menu items with proper URLs
  const getAgentMenuItems = () => {
    if (!currentAgentId) return agentMenuItems;
    
    return agentMenuItems.map(item => {
      const baseHref = workspaceSlug 
        ? `/dashboard/${workspaceSlug}/agents/${currentAgentId}`
        : `/dashboard/agents/${currentAgentId}`;
      
      // Handle Sources with sub-items
      if (item.name === 'Sources' && item.subItems) {
        const subItemSlugMap: Record<string, string> = {
          'Files': 'files',
          'Text': 'text',
          'Website': 'website',
          'FAQ': 'faq',
          'Notion': 'notion',
          'Google Sheets': 'google-sheets'
        };

        return {
          ...item,
          href: `${baseHref}/sources`,
          subItems: item.subItems.map(subItem => ({
            ...subItem,
            href: `${baseHref}/sources/${subItemSlugMap[subItem.name] || subItem.name.toLowerCase()}`
          }))
        };
      }

      // Handle Settings with sub-items
      if (item.name === 'Settings' && item.subItems) {
        // Map sub-item names to their URL slugs
        const subItemSlugMap: Record<string, string> = {
          'General': 'general',
          'AI Configuration': 'ai',
          'Security': 'security',
          'Custom Domains': 'domains',
          'Integrations': 'integrations'
        };

        return {
          ...item,
          href: `${baseHref}/settings`,
          subItems: item.subItems.map(subItem => ({
            ...subItem,
            href: `${baseHref}/settings/${subItemSlugMap[subItem.name] || subItem.name.toLowerCase().replace(/\s+/g, '-')}`
          }))
        };
      }
      
      // Regular items
      return {
        ...item,
        href: `${baseHref}/${item.name.toLowerCase()}`
      };
    });
  };

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
    const navigationItems = getNavigationItems(workspaceSlug);
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
  }, [pathname, currentSearch, workspaceSlug]);

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

    // For parent routes - exclude all dashboard routes to avoid always highlighting them
    // This includes both '/dashboard' and '/dashboard/[workspace]'
    const isDashboardRoute = href === '/dashboard' || href.match(/^\/dashboard\/[^\/]+$/);
    if (!isDashboardRoute && pathname.startsWith(href + '/')) return true;

    return false;
  };

  // Knowledge base source types
  const knowledgeSourceTypes = [
    { id: 'files', label: 'Files', icon: <FileIcon className="w-4 h-4" /> },
    { id: 'text', label: 'Text', icon: <AlignLeft className="w-4 h-4" /> },
    { id: 'website', label: 'Website', icon: <Globe className="w-4 h-4" /> },
    { id: 'faq', label: 'FAQ', icon: <MessageCircle className="w-4 h-4" /> },
    { id: 'notion', label: 'Notion', icon: <FileText className="w-4 h-4" /> },
    { id: 'google-sheets', label: 'Google Sheets', icon: <Sheet className="w-4 h-4" /> }
  ];

  return (
    <Sidebar>
      <SidebarHeader className="pt-16 pb-3 px-1">
        {/* Back to Agents button when in widget or agent page */}
        {(isWidgetPage || isAgentPage) && (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="text-muted-foreground hover:text-foreground">
                <Link href={workspaceSlug ? `/dashboard/${workspaceSlug}/agents` : '/dashboard/agents'}>
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Agents</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarHeader>

      <SidebarContent className="pt-0 px-1">
        <SidebarGroup className="px-0">
          {/* Show Knowledge Base Types on knowledgebase page */}
          {isKnowledgeBasePage ? (
            <>
              <SidebarGroupLabel className="mb-1">Knowledge Sources</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {knowledgeSourceTypes.map((type) => {
                    const currentType = mounted && typeof window !== 'undefined'
                      ? new URLSearchParams(window.location.search).get('type') || 'website'
                      : 'website';
                    const isTypeActive = currentType === type.id;

                    return (
                      <SidebarMenuItem key={type.id}>
                        <SidebarMenuButton
                          asChild
                          isActive={isTypeActive}
                          suppressHydrationWarning
                        >
                          <Link
                            href={`${pathname}?type=${type.id}`}
                            suppressHydrationWarning
                          >
                            {type.icon}
                            <span>{type.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </>
          ) : (
            <SidebarGroupContent>
              <SidebarMenu>
                {/* Show different menus based on context */}
                {(() => {
                  let menuItems;
                  if (isWidgetPage) {
                    menuItems = getWidgetMenuItems();
                  } else if (isAgentPage) {
                    menuItems = getAgentMenuItems();
                  } else {
                    menuItems = getNavigationItems(workspaceSlug);
                  }

                  return menuItems.map((item) => {
                  const isItemActive = item.href ? isActive(item.href) : false;
                  const hasSubItems = item.subItems && item.subItems.length > 0;
                  
                  // Check if any sub-item is active
                  const hasActiveSubItem = hasSubItems && item.subItems?.some(subItem => 
                    subItem.href && (pathname === subItem.href || pathname?.startsWith(subItem.href + '/'))
                  );
                  
                  // Auto-expand if sub-item is active
                  const isExpanded = hasSubItems && (expandedItems.includes(item.name) || hasActiveSubItem);

                  // If item has sub-items, render expandable menu
                  if (hasSubItems) {
                    return (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton 
                          onClick={() => toggleExpand(item.name)}
                          isActive={isItemActive || hasActiveSubItem}
                        >
                          {item.icon}
                          <span>{item.name}</span>
                          {item.badge && (
                            <span className="ml-auto px-2 py-0.5 text-xs font-semibold bg-primary/10 text-primary rounded-full">
                              {item.badge}
                            </span>
                          )}
                          <ChevronRight 
                            className={`ml-auto transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                          />
                        </SidebarMenuButton>
                        {isExpanded && (
                          <SidebarMenuSub>
                            {item.subItems?.map((subItem) => {
                              const isSubItemActive = !!(subItem.href && (
                                pathname === subItem.href || pathname?.startsWith(subItem.href + '/')
                              ));
                              return (
                                <SidebarMenuSubItem key={subItem.name}>
                                  <SidebarMenuSubButton asChild isActive={isSubItemActive}>
                                    <Link href={subItem.href || '#'}>
                                      {subItem.icon}
                                      <span>{subItem.name}</span>
                                      {subItem.badge && (
                                        <span className="ml-auto px-2 py-0.5 text-xs font-semibold bg-primary/10 text-primary rounded-full">
                                          {subItem.badge}
                                        </span>
                                      )}
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              );
                            })}
                          </SidebarMenuSub>
                        )}
                      </SidebarMenuItem>
                    );
                  }

                  // Regular item without sub-items
                  return (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton asChild isActive={isItemActive}>
                        <Link href={item.href || '#'}>
                          {item.icon}
                          <span>{item.name}</span>
                          {item.badge && (
                            <span className="ml-auto px-2 py-0.5 text-xs font-semibold bg-primary/10 text-primary rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                });
              })()}
              </SidebarMenu>
            </SidebarGroupContent>
          )}
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="mt-auto px-1 pb-3">
        {/* Subscription Plan Section - Compact */}
        {mounted && userData && (
          <div className="px-2 py-2 mb-2 rounded-md bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/60">
            <Link
              href={workspaceSlug ? `/dashboard/${workspaceSlug}/settings/plans` : '/dashboard/settings/plans'}
              className="block group"
            >
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-blue-100 text-blue-600">
                  <Crown className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800">
                    {(() => {
                      const subInfo = getSubscriptionInfo(userData);
                      return subInfo.planDisplay;
                    })()}
                  </p>
                  {(() => {
                    const subInfo = getSubscriptionInfo(userData);
                    return subInfo.isTrialActive ? (
                      <p className="text-[10px] text-gray-600 font-medium">
                        {subInfo.trialDaysRemaining} {subInfo.trialDaysRemaining === 1 ? 'day' : 'days'} left
                      </p>
                    ) : (
                      <p className="text-[10px] text-gray-600 font-medium">
                        {subInfo.statusDisplay}
                      </p>
                    );
                  })()}
                </div>
                <div className="text-[10px] text-blue-600 group-hover:text-blue-700 font-medium">→</div>
              </div>
            </Link>
          </div>
        )}

        <SidebarSeparator className="mb-2" />

        {/* Sign Out Button */}
        <SidebarGroup className="px-0">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleSignOut} suppressHydrationWarning className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Footer */}
        <div className="px-3 py-2 mt-2">
          <div className="text-xs text-muted-foreground/60 text-center font-medium">
            Rexa Engage v1.0
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

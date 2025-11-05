"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../lib/workspace-auth-context';
import { Button } from '@/components/ui/button';
import {
  ChevronsUpDown,
  Plus,
  Settings,
  Users,
  Crown,
  Bot,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Agent } from '../../lib/agent-types';

interface AgentWorkspaceSelectorProps {
  currentAgentId?: string;
  currentAgentName?: string;
  onCreateWorkspace?: () => void;
}

export function AgentWorkspaceSelector({
  currentAgentId,
  currentAgentName,
  onCreateWorkspace
}: AgentWorkspaceSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { workspaceContext, switchWorkspace } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Load agents for the current workspace
  useEffect(() => {
    const loadAgents = async () => {
      if (!workspaceContext.currentWorkspace?.id) {
        setLoadingAgents(false);
        return;
      }

      try {
        setLoadingAgents(true);
        const agentsRef = collection(db, 'agents');
        const q = query(
          agentsRef,
          where('workspaceId', '==', workspaceContext.currentWorkspace.id),
          orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        const agentsList = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || new Date(),
            updatedAt: data.updatedAt?.toDate?.() || new Date(),
            stats: {
              ...data.stats,
              lastActiveAt: data.stats?.lastActiveAt?.toDate?.()
            }
          } as Agent;
        });

        setAgents(agentsList);
      } catch (error) {
        console.error('Error loading agents:', error);
      } finally {
        setLoadingAgents(false);
      }
    };

    loadAgents();
  }, [workspaceContext.currentWorkspace?.id]);

  const handleWorkspaceSwitch = async (workspaceId: string) => {
    try {
      await switchWorkspace(workspaceId);
      setIsOpen(false);

      // Find the workspace to get its URL slug
      const workspace = workspaceContext.userWorkspaces.find(w => w.id === workspaceId);
      if (workspace) {
        // Navigate to agents page in the new workspace
        router.push(`/dashboard/${workspace.url}/agents`);
      }
    } catch (error) {
      console.error('Error switching workspace:', error);
    }
  };

  const handleAgentSwitch = (agentId: string) => {
    setIsOpen(false);
    const workspace = workspaceContext.currentWorkspace;
    if (workspace) {
      // Navigate to the agent's playground
      router.push(`/dashboard/${workspace.url}/agents/${agentId}/playground`);
    }
  };

  const currentWorkspace = workspaceContext.currentWorkspace;
  const userWorkspaces = workspaceContext.userWorkspaces;

  if (!currentWorkspace) {
    return (
      <div className="flex items-center space-x-2">
        <Button
          onClick={onCreateWorkspace}
          className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium"
          suppressHydrationWarning
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Workspace
        </Button>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors min-w-0 cursor-pointer"
        suppressHydrationWarning
      >
        <div className="flex items-center space-x-2 min-w-0">
          {/* Workspace Icon */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
          <span className="text-gray-400 text-sm">/</span>

          {/* Current Workspace */}
          <p className="text-sm font-medium text-gray-900 truncate max-w-24">
            {currentWorkspace.name}
          </p>

          {/* Agent separator and name if on agent page */}
          {currentAgentName && (
            <>
              <span className="text-gray-400 text-sm">/</span>
              <Bot className="w-4 h-4 text-gray-600 flex-shrink-0" />
              <p className="text-sm font-medium text-gray-900 truncate max-w-32">
                {currentAgentName}
              </p>
            </>
          )}
        </div>
        <ChevronsUpDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 max-h-[600px] overflow-y-auto">
          {/* Current Workspace Header */}
          <div className="px-4 py-3 border-b border-gray-100">
            <Link
              href={`/dashboard/${currentWorkspace.url}/agents`}
              onClick={() => setIsOpen(false)}
              className="flex items-center space-x-3 hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-lg font-semibold flex-shrink-0">
                {currentWorkspace.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                  {currentWorkspace.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {currentWorkspace.url}
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  <Crown className="w-3 h-3 text-yellow-500" />
                  <span className="text-xs text-gray-600">
                    {currentWorkspace.subscription.plan === 'free' ? 'Free Plan' :
                     currentWorkspace.subscription.plan === 'pro' ? 'Pro Plan' : 'Enterprise Plan'}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
            </Link>
          </div>

          {/* Current Workspace Agents */}
          {currentAgentName && (
            <div className="py-2">
              <div className="px-4 py-2 flex items-center justify-between">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Agents in {currentWorkspace.name}
                </p>
                <Link
                  href={`/dashboard/${currentWorkspace.url}/agents`}
                  onClick={() => setIsOpen(false)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  View all
                </Link>
              </div>

              {loadingAgents ? (
                <div className="px-4 py-2 text-xs text-gray-500">Loading agents...</div>
              ) : agents.length > 0 ? (
                <div className="space-y-1">
                  {agents.slice(0, 5).map((agent) => (
                    <button
                      key={agent.id}
                      onClick={() => handleAgentSwitch(agent.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors ${
                        agent.id === currentAgentId ? 'bg-blue-50' : ''
                      }`}
                      suppressHydrationWarning
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center text-white flex-shrink-0">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {agent.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {agent.status === 'active' ? 'Active' : agent.status === 'training' ? 'Training' : 'Inactive'}
                        </p>
                      </div>
                      {agent.id === currentAgentId && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-2 text-xs text-gray-500">No agents yet</div>
              )}
            </div>
          )}

          {/* Workspace List */}
          <div className="py-2 border-t border-gray-100">
            <div className="px-4 py-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Switch Workspace
              </p>
            </div>

            {userWorkspaces.map((workspace) => (
              <button
                key={workspace.id}
                onClick={() => handleWorkspaceSwitch(workspace.id)}
                className={`w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors ${
                  workspace.id === currentWorkspace.id ? 'bg-blue-50' : ''
                }`}
                suppressHydrationWarning
              >
                <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-lg flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                  {workspace.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {workspace.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {workspace.url}
                  </p>
                </div>
                {workspace.id === currentWorkspace.id && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="border-t border-gray-100 py-2">
            <button
              onClick={() => {
                onCreateWorkspace?.();
                setIsOpen(false);
              }}
              className="w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors"
              suppressHydrationWarning
            >
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Plus className="w-4 h-4 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Create Workspace</p>
                <p className="text-xs text-gray-500">Start a new workspace</p>
              </div>
            </button>

            <Link
              href={`/dashboard/${currentWorkspace.url}/settings/general`}
              className="w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Settings className="w-4 h-4 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Workspace Settings</p>
                <p className="text-xs text-gray-500">Manage workspace settings</p>
              </div>
            </Link>

            <Link
              href={`/dashboard/${currentWorkspace.url}/settings/members`}
              className="w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Team Members</p>
                <p className="text-xs text-gray-500">Manage team access</p>
              </div>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

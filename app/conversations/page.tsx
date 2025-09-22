'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import { 
  subscribeToConversations,
  ChatConversation 
} from '../lib/chat-utils';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  MessageCircle, 
  Search, 
  Clock, 
  User,
  Mail,
  MoreVertical
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

export default function ConversationsPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'closed'>('all');

  useEffect(() => {
    if (!user?.uid) return;

    // Subscribe to real-time conversations
    const unsubscribe = subscribeToConversations(user.uid, (updatedConversations) => {
      setConversations(updatedConversations);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    // Filter conversations based on search and status
    let filtered = conversations;

    if (searchTerm) {
      filtered = filtered.filter(conv => 
        conv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(conv => conv.status === statusFilter);
    }

    setFilteredConversations(filtered);
  }, [conversations, searchTerm, statusFilter]);

  const getStatusColor = (status: ChatConversation['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (timestamp: Date | { toDate: () => Date } | null | undefined) => {
    if (!timestamp) return '';
    const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
    return formatDistanceToNow(date, { addSuffix: true });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Conversations</h1>
          <p className="text-gray-600 mt-2">Manage all your customer conversations</p>
        </div>
        <div className="flex gap-4">
          <Link href="/dashboard">
            <Button variant="outline">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('all')}
                size="sm"
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'active' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('active')}
                size="sm"
              >
                Active
              </Button>
              <Button
                variant={statusFilter === 'closed' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('closed')}
                size="sm"
              >
                Closed
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversations List */}
      {filteredConversations.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversations found</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Your customer conversations will appear here once they start chatting'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredConversations.map((conversation) => (
            <Card key={conversation.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="font-semibold text-gray-900">
                          {conversation.customerName}
                        </span>
                      </div>
                      <Badge className={getStatusColor(conversation.status)}>
                        {conversation.status}
                      </Badge>
                      {conversation.unreadCount > 0 && (
                        <Badge variant="destructive">
                          {conversation.unreadCount} new
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <Mail className="h-4 w-4" />
                      <span>{conversation.customerEmail}</span>
                    </div>

                    {conversation.lastMessage && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-3">
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {conversation.lastMessage}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {conversation.lastMessageAt 
                            ? `Last message ${formatTime(new Date(conversation.lastMessageAt))}`
                            : `Started ${formatTime(new Date(conversation.createdAt))}`
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Link href={`/conversations/${conversation.id}`}>
                      <Button size="sm">
                        View Chat
                      </Button>
                    </Link>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {conversations.length}
            </div>
            <div className="text-sm text-gray-600">Total Conversations</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {conversations.filter(c => c.status === 'active').length}
            </div>
            <div className="text-sm text-gray-600">Active</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {conversations.reduce((sum, c) => sum + c.unreadCount, 0)}
            </div>
            <div className="text-sm text-gray-600">Unread Messages</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
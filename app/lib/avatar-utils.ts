// Avatar utilities for consistent avatar display across the application

export interface AvatarConfig {
  type: 'customer' | 'business' | 'ai';
  name?: string;
  email?: string;
  userId?: string;
}

// Default avatar URLs for different user types
export const DEFAULT_AVATARS = {
  customer: '/avatars/default.svg',
  business: '/avatars/default.svg',
  ai: '/avatars/default.svg'
};

// Generate consistent avatar based on user info
export function generateAvatarUrl(config: AvatarConfig): string {
  const { type, name, email, userId } = config;
  
  // For AI, always use AI avatar
  if (type === 'ai') {
    return DEFAULT_AVATARS.ai;
  }
  
  // For business users, use business avatar or generate from name
  if (type === 'business') {
    if (name) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3b82f6&color=ffffff&size=40&bold=true`;
    }
    return DEFAULT_AVATARS.business;
  }
  
  // For customers, generate colorful avatar from name or email
  if (type === 'customer') {
    const identifier = name || email || userId || 'Customer';
    const colors = ['ef4444', 'f97316', 'eab308', '22c55e', '06b6d4', '3b82f6', '8b5cf6', 'ec4899'];
    const colorIndex = identifier.length % colors.length;
    const color = colors[colorIndex];
    
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(identifier)}&background=${color}&color=ffffff&size=40&bold=true`;
  }
  
  return DEFAULT_AVATARS.customer;
}

// Get avatar for message sender
export function getMessageAvatar(sender: string, senderName: string, metadata?: Record<string, unknown>): string {
  // Check if it's an AI-generated message
  if (metadata?.ai_generated) {
    return generateAvatarUrl({ type: 'ai' });
  }
  
  // Check sender type
  if (sender === 'business') {
    return generateAvatarUrl({ 
      type: 'business', 
      name: senderName 
    });
  }
  
  if (sender === 'customer') {
    return generateAvatarUrl({ 
      type: 'customer', 
      name: senderName 
    });
  }
  
  // Default fallback
  return generateAvatarUrl({ type: 'customer', name: senderName });
}

// Get avatar for user profile
export function getUserAvatar(userType: 'customer' | 'business', name?: string, email?: string): string {
  return generateAvatarUrl({ 
    type: userType, 
    name: name || email || 'User' 
  });
}

// Avatar component props
export interface AvatarProps {
  src: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

// Size classes for avatars
export const AVATAR_SIZES = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8', 
  lg: 'w-10 h-10',
  xl: 'w-12 h-12'
};

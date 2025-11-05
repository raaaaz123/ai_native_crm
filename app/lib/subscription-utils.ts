/**
 * Subscription & Trial Management Utilities
 */

export interface SubscriptionInfo {
  plan: string;
  planDisplay: string;
  status: 'active' | 'expired' | 'cancelled';
  statusDisplay: string;
  isTrialActive: boolean;
  trialDaysRemaining: number;
  trialEndDate?: Date;
  subscriptionEndDate?: Date;
  isPaid: boolean;
}

/**
 * Get subscription information for a user
 */
export function getSubscriptionInfo(userData: {
  subscriptionPlan?: string;
  subscriptionStatus?: string;
  trialStartDate?: Date | { toDate?: () => Date } | unknown;
  trialEndDate?: Date | { toDate?: () => Date } | unknown;
  subscriptionEndDate?: Date | { toDate?: () => Date } | unknown;
} | null | undefined): SubscriptionInfo {
  // Handle null/undefined userData
  if (!userData) {
    return {
      plan: 'free_trial',
      planDisplay: 'Free Trial',
      status: 'active',
      statusDisplay: 'Active',
      isTrialActive: false,
      trialDaysRemaining: 0,
      isPaid: false
    };
  }

  const plan = userData.subscriptionPlan || 'free_trial';
  const status = (userData.subscriptionStatus || 'active') as 'active' | 'expired' | 'cancelled';
  
  // Convert Firestore timestamps to Date objects
  const convertToDate = (value: unknown): Date | undefined => {
    if (!value) return undefined;
    if (value instanceof Date) return value;
    
    // Handle Firestore Timestamp objects
    if (typeof value === 'object' && value !== null) {
      try {
        // Check if it's a Firestore Timestamp with toDate method
        if ('toDate' in value && typeof (value as { toDate?: () => Date }).toDate === 'function') {
          return (value as { toDate: () => Date }).toDate();
        }
        
        // Check if it's a Firestore Timestamp with toMillis method
        if ('toMillis' in value && typeof (value as { toMillis?: () => number }).toMillis === 'function') {
          const millis = (value as { toMillis: () => number }).toMillis();
          return new Date(millis);
        }
        
        // Check if it has seconds and nanoseconds (Firestore Timestamp structure)
        if ('seconds' in value && 'nanoseconds' in value) {
          const timestampValue = value as { seconds?: unknown; nanoseconds?: unknown };
          const seconds = timestampValue.seconds;
          const nanoseconds = timestampValue.nanoseconds;
          if (typeof seconds === 'number' && typeof nanoseconds === 'number') {
            return new Date(seconds * 1000 + nanoseconds / 1000000);
          }
        }
        
        // Check if it's a plain object with timestamp properties
        if ('_seconds' in value && '_nanoseconds' in value) {
          const timestampValue = value as { _seconds?: unknown; _nanoseconds?: unknown };
          const seconds = timestampValue._seconds;
          const nanoseconds = timestampValue._nanoseconds;
          if (typeof seconds === 'number' && typeof nanoseconds === 'number') {
            return new Date(seconds * 1000 + nanoseconds / 1000000);
          }
        }
      } catch (error) {
        console.warn('Error converting Firestore timestamp to Date:', error, value);
        return undefined;
      }
    }
    
    return undefined;
  };

  const trialEnd = convertToDate(userData.trialEndDate);
  const subscriptionEnd = convertToDate(userData.subscriptionEndDate);

  // Calculate trial days remaining
  let trialDaysRemaining = 0;
  let isTrialActive = false;
  
  if (plan === 'free_trial' && trialEnd) {
    const now = new Date();
    const diffTime = trialEnd.getTime() - now.getTime();
    trialDaysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    isTrialActive = trialDaysRemaining > 0;
  }

  // Get plan display name
  const planDisplayMap: Record<string, string> = {
    'free_trial': 'Free Trial',
    'starter': 'Starter Plan',
    'professional': 'Professional Plan',
    'enterprise': 'Enterprise Plan'
  };

  // Get status display
  const statusDisplayMap: Record<string, string> = {
    'active': isTrialActive ? `${trialDaysRemaining} days left` : 'Active',
    'expired': 'Expired',
    'cancelled': 'Cancelled'
  };

  return {
    plan,
    planDisplay: planDisplayMap[plan] || 'Free Trial',
    status,
    statusDisplay: statusDisplayMap[status] || 'Active',
    isTrialActive,
    trialDaysRemaining: Math.max(0, trialDaysRemaining),
    trialEndDate: trialEnd,
    subscriptionEndDate: subscriptionEnd,
    isPaid: !['free_trial'].includes(plan)
  };
}

/**
 * Format date for display
 */
export function formatDate(date?: Date): string {
  if (!date) return 'N/A';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

/**
 * Get plan features
 */
export function getPlanFeatures(plan: string): string[] {
  const features: Record<string, string[]> = {
    'free_trial': [
      '14-day full access',
      'Unlimited chat widgets',
      'Knowledge base uploads',
      'Review forms',
      'Team collaboration',
      'Email support'
    ],
    'starter': [
      '1 chat widget',
      '1,000 conversations/month',
      'Basic knowledge base',
      'Email support',
      'Basic analytics'
    ],
    'professional': [
      'Unlimited chat widgets',
      '10,000 conversations/month',
      'Advanced knowledge base',
      'Priority email & chat support',
      'Advanced analytics',
      'Custom branding',
      'API access'
    ],
    'enterprise': [
      'Unlimited everything',
      'Dedicated account manager',
      '24/7 phone support',
      'Custom integrations',
      'SLA guarantee',
      'Advanced security',
      'On-premise deployment option'
    ]
  };

  return features[plan] || features['free_trial'];
}

/**
 * Get plan pricing
 */
export function getPlanPricing(plan: string): { monthly: number; yearly: number; currency: string } {
  const pricing: Record<string, { monthly: number; yearly: number }> = {
    'free_trial': { monthly: 0, yearly: 0 },
    'starter': { monthly: 29, yearly: 290 },
    'professional': { monthly: 99, yearly: 990 },
    'enterprise': { monthly: 299, yearly: 2990 }
  };

  return {
    ...pricing[plan] || pricing['starter'],
    currency: 'USD'
  };
}


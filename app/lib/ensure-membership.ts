import { 
  collection, 
  doc, 
  addDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { getUserCompanyContext } from './company-firestore-utils';

export interface EnsureMembershipResult {
  success: boolean;
  wasAdded: boolean;
  error?: string;
}

/**
 * Ensures that a user is properly added to the companyMembers collection
 * This fixes the permissions issue where users have a company context but
 * are not in the companyMembers collection
 */
export async function ensureUserMembership(userId: string): Promise<EnsureMembershipResult> {
  try {
    console.log('🔍 [Ensure Membership] Checking membership for user:', userId);
    
    // First, check if user already exists in companyMembers
    const membersRef = collection(db, 'companyMembers');
    const memberQuery = query(membersRef, where('userId', '==', userId));
    const memberSnapshot = await getDocs(memberQuery);
    
    if (!memberSnapshot.empty) {
      console.log('✅ [Ensure Membership] User already exists in companyMembers');
      return { success: true, wasAdded: false };
    }
    
    console.log('❌ [Ensure Membership] User not found in companyMembers, checking company context...');
    
    // Get user's company context to see if they should have a company
    const companyResult = await getUserCompanyContext(userId);
    
    if (!companyResult.success || !companyResult.data?.company) {
      console.log('❌ [Ensure Membership] User has no company context');
      return { 
        success: false, 
        wasAdded: false, 
        error: 'User has no company context' 
      };
    }
    
    const { company } = companyResult.data;
    console.log('🏢 [Ensure Membership] Found company context:', company.name, company.id);
    
    // Add user to companyMembers collection
    const memberData = {
      companyId: company.id,
      userId: userId,
      email: '', // Will be updated when available
      role: 'admin' as const, // Default to admin for now
      permissions: [
        'conversations:read',
        'conversations:write',
        'conversations:delete',
        'reviews:read',
        'reviews:write',
        'reviews:delete',
        'analytics:read',
        'settings:read',
        'settings:write',
        'team:invite',
        'team:manage',
        'company:manage'
      ],
      status: 'active' as const,
      joinedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    console.log('➕ [Ensure Membership] Adding user to companyMembers:', memberData);
    const memberRef = await addDoc(collection(db, 'companyMembers'), memberData);
    console.log('✅ [Ensure Membership] Successfully added user to companyMembers with ID:', memberRef.id);
    
    return { success: true, wasAdded: true };
    
  } catch (error) {
    console.error('❌ [Ensure Membership] Error ensuring user membership:', error);
    return { 
      success: false, 
      wasAdded: false, 
      error: error instanceof Error ? error.message : 'Failed to ensure membership' 
    };
  }
}

/**
 * Checks if a user exists in the companyMembers collection
 */
export async function checkUserMembership(userId: string): Promise<{ exists: boolean; memberData?: any }> {
  try {
    const membersRef = collection(db, 'companyMembers');
    const memberQuery = query(membersRef, where('userId', '==', userId));
    const memberSnapshot = await getDocs(memberQuery);
    
    if (memberSnapshot.empty) {
      return { exists: false };
    }
    
    const memberDoc = memberSnapshot.docs[0];
    return { 
      exists: true, 
      memberData: { id: memberDoc.id, ...memberDoc.data() } 
    };
  } catch (error) {
    console.error('Error checking user membership:', error);
    return { exists: false };
  }
}
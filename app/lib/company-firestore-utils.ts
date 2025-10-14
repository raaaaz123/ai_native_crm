import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  deleteDoc,
  serverTimestamp,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Company, CompanyMember, CompanyInvite, Permission, UserCompanyContext } from './company-types';
import { v4 as uuidv4 } from 'uuid';
import { sendInvitationEmail } from './email-utils';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Company Management
export async function createCompany(
  name: string, 
  createdBy: string, 
  description?: string, 
  domain?: string
): Promise<ApiResponse<Company>> {
  try {
    console.log('Creating company:', { name, createdBy, description, domain });
    
    const companyData = {
      name,
      description: description || '',
      domain: domain || '',
      logo: '',
      createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const companyRef = await addDoc(collection(db, 'companies'), companyData);
    
    // Create the admin member
    const adminMemberData = {
      companyId: companyRef.id,
      userId: createdBy,
      email: '', // Will be updated when user data is available
      role: 'admin' as const,
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

    console.log('👤 [Create Company] Creating admin member:', adminMemberData);
    const memberRef = await addDoc(collection(db, 'companyMembers'), adminMemberData);
    console.log('✅ [Create Company] Admin member created with ID:', memberRef.id);

    const company: Company = {
      id: companyRef.id,
      name,
      description: description || '',
      domain: domain || '',
      logo: '',
      createdBy,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    console.log('✅ [Create Company] Company created successfully:', company);
    return { success: true, data: company };
  } catch (error) {
    console.error('Error creating company:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create company' 
    };
  }
}

export async function getCompany(companyId: string): Promise<ApiResponse<Company>> {
  try {
    console.log('🏢 [Get Company] Fetching company:', companyId);
    const companyDoc = await getDoc(doc(db, 'companies', companyId));
    console.log('🏢 [Get Company] Company document exists:', companyDoc.exists());
    
    if (!companyDoc.exists()) {
      console.log('❌ [Get Company] Company not found');
      return { success: false, error: 'Company not found' };
    }

    const data = companyDoc.data();
    console.log('🏢 [Get Company] Company data:', data);
    
    const company: Company = {
      id: companyDoc.id,
      name: data.name,
      description: data.description || '',
      domain: data.domain || '',
      logo: data.logo || '',
      createdBy: data.createdBy,
      createdAt: data.createdAt?.toMillis() || Date.now(),
      updatedAt: data.updatedAt?.toMillis() || Date.now()
    };

    console.log('✅ [Get Company] Company loaded successfully:', company);
    return { success: true, data: company };
  } catch (error) {
    console.error('Error getting company:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get company' 
    };
  }
}

export async function updateCompany(
  companyId: string, 
  updates: Partial<Company>
): Promise<ApiResponse<Company>> {
  try {
    const companyRef = doc(db, 'companies', companyId);
    await updateDoc(companyRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });

    const result = await getCompany(companyId);
    return result;
  } catch (error) {
    console.error('Error updating company:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update company' 
    };
  }
}

// Company Members Management
export async function getCompanyMembers(companyId: string): Promise<ApiResponse<CompanyMember[]>> {
  try {
    const q = query(
      collection(db, 'companyMembers'),
      where('companyId', '==', companyId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const members = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        companyId: data.companyId,
        userId: data.userId,
        email: data.email,
        role: data.role,
        permissions: data.permissions || [],
        status: data.status,
        invitedBy: data.invitedBy,
        invitedAt: data.invitedAt?.toMillis(),
        joinedAt: data.joinedAt?.toMillis(),
        createdAt: data.createdAt?.toMillis() || Date.now(),
        updatedAt: data.updatedAt?.toMillis() || Date.now()
      } as CompanyMember;
    });

    return { success: true, data: members };
  } catch (error) {
    console.error('Error getting company members:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get company members' 
    };
  }
}

export async function getUserCompanyContext(userId: string): Promise<ApiResponse<UserCompanyContext>> {
  try {
    console.log('🔍 [Get Company Context] Looking for user:', userId);
    
    // Get user's company membership
    const q = query(
      collection(db, 'companyMembers'),
      where('userId', '==', userId),
      where('status', '==', 'active')
    );
    
    console.log('🔍 [Get Company Context] Query created, executing...');
    const querySnapshot = await getDocs(q);
    console.log('🔍 [Get Company Context] Query result:', querySnapshot.size, 'documents found');
    
    if (querySnapshot.empty) {
      console.log('❌ [Get Company Context] No company membership found for user');
      return { success: false, error: 'User is not a member of any company' };
    }

    // Log all membership documents
    console.log('📋 [Get Company Context] All membership documents:');
    querySnapshot.docs.forEach((doc, index) => {
      console.log(`  ${index + 1}. Doc ID: ${doc.id}, Data:`, doc.data());
    });

    // Try each membership document until we find a valid company
    let companyResult = null;
    let memberData = null;
    let memberDoc = null;
    
    for (let i = 0; i < querySnapshot.docs.length; i++) {
      memberDoc = querySnapshot.docs[i];
      memberData = memberDoc.data();
      console.log(`👤 [Get Company Context] Trying membership ${i + 1}:`, memberData);
      console.log(`🏢 [Get Company Context] Company ID from member:`, memberData.companyId);
      
      // Get company details
      companyResult = await getCompany(memberData.companyId);
      if (companyResult.success && companyResult.data) {
        console.log(`✅ [Get Company Context] Found valid company for membership ${i + 1}`);
        break;
      } else {
        console.log(`❌ [Get Company Context] Company not found for membership ${i + 1}:`, companyResult.error);
      }
    }
    
    if (!companyResult || !companyResult.success || !companyResult.data || !memberDoc || !memberData) {
      console.log('❌ [Get Company Context] No valid company found for any membership');
      console.log('🧹 [Get Company Context] This might indicate orphaned membership records');
      return { success: false, error: 'Company not found for any membership' };
    }

    const member: CompanyMember = {
      id: memberDoc.id,
      companyId: memberData.companyId,
      userId: memberData.userId,
      email: memberData.email,
      role: memberData.role,
      permissions: memberData.permissions || [],
      status: memberData.status,
      invitedBy: memberData.invitedBy,
      invitedAt: memberData.invitedAt?.toMillis(),
      joinedAt: memberData.joinedAt?.toMillis(),
      createdAt: memberData.createdAt?.toMillis() || Date.now(),
      updatedAt: memberData.updatedAt?.toMillis() || Date.now()
    };

    const context: UserCompanyContext = {
      company: companyResult.data,
      member,
      permissions: member.permissions,
      isAdmin: member.role === 'admin'
    };

    return { success: true, data: context };
  } catch (error) {
    console.error('Error getting user company context:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get user company context' 
    };
  }
}

// Invitation Management
export async function inviteUserToCompany(
  companyId: string,
  email: string,
  role: 'admin' | 'member',
  permissions: Permission[],
  invitedBy: string,
  companyName?: string,
  inviterName?: string
): Promise<ApiResponse<CompanyInvite>> {
  try {
    console.log('Inviting user to company:', { companyId, email, role, permissions, invitedBy });
    
    // Check if user is already a member
    const existingMemberQuery = query(
      collection(db, 'companyMembers'),
      where('companyId', '==', companyId),
      where('email', '==', email)
    );
    const existingMemberSnapshot = await getDocs(existingMemberQuery);
    
    if (!existingMemberSnapshot.empty) {
      return { success: false, error: 'User is already a member of this company' };
    }

    // Check for existing pending invite
    const existingInviteQuery = query(
      collection(db, 'companyInvites'),
      where('companyId', '==', companyId),
      where('email', '==', email),
      where('status', '==', 'pending')
    );
    const existingInviteSnapshot = await getDocs(existingInviteQuery);
    
    if (!existingInviteSnapshot.empty) {
      return { success: false, error: 'User already has a pending invitation' };
    }

    const token = uuidv4();
    const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days from now

    const inviteData = {
      companyId,
      email,
      role,
      permissions,
      invitedBy,
      status: 'pending' as const,
      token,
      expiresAt,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const inviteRef = await addDoc(collection(db, 'companyInvites'), inviteData);
    
    const invite: CompanyInvite = {
      id: inviteRef.id,
      companyId,
      email,
      role,
      permissions,
      invitedBy,
      status: 'pending',
      token,
      expiresAt,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    console.log('Invitation created successfully:', invite);

    // Send invitation email
    if (companyName && inviterName) {
      try {
        const emailResult = await sendInvitationEmail({
          to: email,
          companyName,
          inviterName,
          inviteToken: token,
          role,
          permissions
        });
        
        if (!emailResult.success) {
          console.warn('Failed to send invitation email:', emailResult.error);
          // Don't fail the invitation if email fails
        }
      } catch (emailError) {
        console.warn('Error sending invitation email:', emailError);
        // Don't fail the invitation if email fails
      }
    }

    return { success: true, data: invite };
  } catch (error) {
    console.error('Error inviting user to company:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to invite user' 
    };
  }
}

export async function getUserInvites(email: string): Promise<ApiResponse<CompanyInvite[]>> {
  try {
    const q = query(
      collection(db, 'companyInvites'),
      where('email', '==', email),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const invites = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        companyId: data.companyId,
        email: data.email,
        role: data.role,
        permissions: data.permissions || [],
        invitedBy: data.invitedBy,
        status: data.status,
        token: data.token,
        expiresAt: data.expiresAt,
        createdAt: data.createdAt?.toMillis() || Date.now(),
        updatedAt: data.updatedAt?.toMillis() || Date.now()
      } as CompanyInvite;
    });

    return { success: true, data: invites };
  } catch (error) {
    console.error('Error getting user invites:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get user invites' 
    };
  }
}

export async function acceptInvite(
  inviteId: string, 
  userId: string, 
  userEmail: string
): Promise<ApiResponse<CompanyMember>> {
  try {
    console.log('Accepting invite:', { inviteId, userId, userEmail });
    
    const inviteRef = doc(db, 'companyInvites', inviteId);
    const inviteDoc = await getDoc(inviteRef);
    
    if (!inviteDoc.exists()) {
      return { success: false, error: 'Invitation not found' };
    }

    const inviteData = inviteDoc.data();
    
    // Check if invite is still valid
    if (inviteData.status !== 'pending') {
      return { success: false, error: 'Invitation is no longer valid' };
    }

    if (inviteData.expiresAt < Date.now()) {
      return { success: false, error: 'Invitation has expired' };
    }

    if (inviteData.email !== userEmail) {
      return { success: false, error: 'Invitation email does not match user email' };
    }

    const batch = writeBatch(db);

    // Create company member
    const memberData = {
      companyId: inviteData.companyId,
      userId,
      email: userEmail,
      role: inviteData.role,
      permissions: inviteData.permissions,
      status: 'active' as const,
      invitedBy: inviteData.invitedBy,
      invitedAt: inviteData.createdAt,
      joinedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const memberRef = doc(collection(db, 'companyMembers'));
    batch.set(memberRef, memberData);

    // Update invite status
    batch.update(inviteRef, {
      status: 'accepted',
      updatedAt: serverTimestamp()
    });

    await batch.commit();

    const member: CompanyMember = {
      id: memberRef.id,
      companyId: inviteData.companyId,
      userId,
      email: userEmail,
      role: inviteData.role,
      permissions: inviteData.permissions,
      status: 'active',
      invitedBy: inviteData.invitedBy,
      invitedAt: inviteData.createdAt?.toMillis(),
      joinedAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    console.log('Invite accepted successfully:', member);
    return { success: true, data: member };
  } catch (error) {
    console.error('Error accepting invite:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to accept invitation' 
    };
  }
}

export async function rejectInvite(inviteId: string): Promise<ApiResponse<void>> {
  try {
    const inviteRef = doc(db, 'companyInvites', inviteId);
    await updateDoc(inviteRef, {
      status: 'rejected',
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error rejecting invite:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to reject invitation' 
    };
  }
}

export async function getCompanyInvites(
  companyId: string,
  statusFilter: 'all' | 'pending' | 'accepted' | 'rejected' | 'revoked' = 'pending'
): Promise<ApiResponse<CompanyInvite[]>> {
  try {
    let q;
    
    if (statusFilter === 'all') {
      q = query(
        collection(db, 'companyInvites'),
        where('companyId', '==', companyId),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, 'companyInvites'),
        where('companyId', '==', companyId),
        where('status', '==', statusFilter),
        orderBy('createdAt', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    const invites = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        companyId: data.companyId,
        email: data.email,
        role: data.role,
        permissions: data.permissions || [],
        invitedBy: data.invitedBy,
        status: data.status,
        token: data.token,
        expiresAt: data.expiresAt,
        createdAt: data.createdAt?.toMillis() || Date.now(),
        updatedAt: data.updatedAt?.toMillis() || Date.now(),
        revokedBy: data.revokedBy,
        revokedAt: data.revokedAt?.toMillis()
      } as CompanyInvite & { revokedBy?: string; revokedAt?: number };
    });

    return { success: true, data: invites };
  } catch (error) {
    console.error('Error getting company invites:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get company invites',
      data: []
    };
  }
}

export async function revokeInvite(
  inviteId: string,
  revokedBy: string
): Promise<ApiResponse<void>> {
  try {
    const inviteRef = doc(db, 'companyInvites', inviteId);
    const inviteDoc = await getDoc(inviteRef);
    
    if (!inviteDoc.exists()) {
      return { success: false, error: 'Invitation not found' };
    }

    const inviteData = inviteDoc.data();
    
    // Only allow revoking pending invitations
    if (inviteData.status !== 'pending') {
      return { success: false, error: `Cannot revoke ${inviteData.status} invitation` };
    }

    await updateDoc(inviteRef, {
      status: 'revoked',
      revokedBy,
      revokedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log('Invitation revoked successfully:', inviteId);
    return { success: true };
  } catch (error) {
    console.error('Error revoking invite:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to revoke invitation' 
    };
  }
}

export async function updateInvite(
  inviteId: string,
  updates: {
    role?: 'admin' | 'member';
    permissions?: Permission[];
  }
): Promise<ApiResponse<void>> {
  try {
    const inviteRef = doc(db, 'companyInvites', inviteId);
    const inviteDoc = await getDoc(inviteRef);
    
    if (!inviteDoc.exists()) {
      return { success: false, error: 'Invitation not found' };
    }

    const inviteData = inviteDoc.data();
    
    // Only allow updating pending invitations
    if (inviteData.status !== 'pending') {
      return { success: false, error: `Cannot update ${inviteData.status} invitation` };
    }

    const updateData: any = {
      updatedAt: serverTimestamp()
    };

    if (updates.role !== undefined) {
      updateData.role = updates.role;
    }

    if (updates.permissions !== undefined) {
      updateData.permissions = updates.permissions;
    }

    await updateDoc(inviteRef, updateData);

    console.log('Invitation updated successfully:', inviteId);
    return { success: true };
  } catch (error) {
    console.error('Error updating invite:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update invitation' 
    };
  }
}

export async function updateMemberRoleAndPermissions(
  memberId: string,
  role: 'admin' | 'member',
  permissions: Permission[],
  updatedBy: string
): Promise<ApiResponse<void>> {
  try {
    console.log('🔧 [Update Member] Updating role and permissions for member:', memberId);
    
    // Check if the person updating is an admin
    const updaterQuery = query(
      collection(db, 'companyMembers'),
      where('userId', '==', updatedBy),
      where('role', '==', 'admin'),
      where('status', '==', 'active')
    );
    const updaterSnapshot = await getDocs(updaterQuery);
    
    if (updaterSnapshot.empty) {
      return { success: false, error: 'Only admins can update member roles and permissions' };
    }

    const memberRef = doc(db, 'companyMembers', memberId);
    const memberDoc = await getDoc(memberRef);
    
    if (!memberDoc.exists()) {
      return { success: false, error: 'Member not found' };
    }

    await updateDoc(memberRef, {
      role,
      permissions,
      updatedAt: serverTimestamp()
    });

    console.log('✅ [Update Member] Role and permissions updated successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ [Update Member] Error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update member' 
    };
  }
}

export async function removeCompanyMember(
  companyId: string, 
  memberId: string, 
  removedBy: string
): Promise<ApiResponse<void>> {
  try {
    // Check if the person removing is an admin
    const removerQuery = query(
      collection(db, 'companyMembers'),
      where('companyId', '==', companyId),
      where('userId', '==', removedBy),
      where('role', '==', 'admin')
    );
    const removerSnapshot = await getDocs(removerQuery);
    
    if (removerSnapshot.empty) {
      return { success: false, error: 'Only admins can remove members' };
    }

    await deleteDoc(doc(db, 'companyMembers', memberId));
    return { success: true };
  } catch (error) {
    console.error('Error removing company member:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to remove member' 
    };
  }
}

export async function updateMemberPermissions(
  memberId: string,
  permissions: Permission[],
  updatedBy: string
): Promise<ApiResponse<void>> {
  try {
    console.log('🔧 [Update Member Permissions] Updating permissions for member:', memberId);
    
    // Check if the person updating is an admin
    const updaterQuery = query(
      collection(db, 'companyMembers'),
      where('userId', '==', updatedBy),
      where('role', '==', 'admin'),
      where('status', '==', 'active')
    );
    const updaterSnapshot = await getDocs(updaterQuery);
    
    if (updaterSnapshot.empty) {
      return { success: false, error: 'Only admins can update member permissions' };
    }

    // Update the member's permissions
    const memberRef = doc(db, 'companyMembers', memberId);
    await updateDoc(memberRef, {
      permissions: permissions,
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ [Update Member Permissions] Permissions updated successfully');
    return { success: true };
  } catch (error) {
    console.error('Error updating member permissions:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update member permissions' 
    };
  }
}

// Utility function to update admin permissions for existing users
export async function updateAdminPermissions(userId: string): Promise<ApiResponse<void>> {
  try {
    console.log('🔧 [Update Admin Permissions] Updating permissions for user:', userId);
    
    // Get user's company membership
    const q = query(
      collection(db, 'companyMembers'),
      where('userId', '==', userId),
      where('role', '==', 'admin'),
      where('status', '==', 'active')
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return { success: false, error: 'No admin membership found for user' };
    }

    const memberDoc = querySnapshot.docs[0];
    const memberData = memberDoc.data();
    
    // Check if permissions need updating
    const currentPermissions = memberData.permissions || [];
    const expectedPermissions = [
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
    ];
    
    // Check if permissions are already correct
    const hasAllPermissions = expectedPermissions.every(permission => 
      currentPermissions.includes(permission)
    );
    
    if (hasAllPermissions && currentPermissions.length === expectedPermissions.length) {
      console.log('✅ [Update Admin Permissions] Permissions already up to date');
      return { success: true };
    }
    
    // Update permissions
    await updateDoc(memberDoc.ref, {
      permissions: expectedPermissions,
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ [Update Admin Permissions] Permissions updated successfully');
    return { success: true };
  } catch (error) {
    console.error('Error updating admin permissions:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update admin permissions' 
    };
  }
}

// Utility function to clean up orphaned membership records
export async function cleanupOrphanedMemberships(userId: string): Promise<ApiResponse<number>> {
  try {
    console.log('🧹 [Cleanup] Starting cleanup for user:', userId);
    
    // Get all memberships for the user
    const q = query(
      collection(db, 'companyMembers'),
      where('userId', '==', userId),
      where('status', '==', 'active')
    );
    
    const querySnapshot = await getDocs(q);
    console.log('🧹 [Cleanup] Found', querySnapshot.size, 'membership records');
    
    let deletedCount = 0;
    const batch = writeBatch(db);
    
    for (const docSnapshot of querySnapshot.docs) {
      const memberData = docSnapshot.data();
      const companyId = memberData.companyId;
      
      // Check if company exists
      const companyDoc = await getDoc(doc(db, 'companies', companyId));
      if (!companyDoc.exists()) {
        console.log('🧹 [Cleanup] Deleting orphaned membership for company:', companyId);
        batch.delete(docSnapshot.ref);
        deletedCount++;
      }
    }
    
    if (deletedCount > 0) {
      await batch.commit();
      console.log('🧹 [Cleanup] Deleted', deletedCount, 'orphaned membership records');
    } else {
      console.log('🧹 [Cleanup] No orphaned records found');
    }
    
    return { success: true, data: deletedCount };
  } catch (error) {
    console.error('Error cleaning up orphaned memberships:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to cleanup orphaned memberships' 
    };
  }
}

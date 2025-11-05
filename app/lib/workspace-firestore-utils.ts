import { 
  collection, 
  doc, 
  addDoc, 
  setDoc,
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  Workspace, 
  WorkspaceMember, 
  CreateWorkspaceData, 
  UpdateWorkspaceData,
  WorkspaceInvite 
} from './workspace-types';

// Workspace Collection
const WORKSPACES_COLLECTION = 'workspaces';
const WORKSPACE_MEMBERS_COLLECTION = 'workspace_members';
const WORKSPACE_INVITES_COLLECTION = 'workspace_invites';

// Create a new workspace
export async function createWorkspace(
  ownerId: string, 
  workspaceData: CreateWorkspaceData
): Promise<{ success: boolean; data?: Workspace; error?: string }> {
  try {
    console.log('🏢 [Create Workspace] Starting workspace creation:', { ownerId, workspaceData });
    
    // Check if workspace URL is already taken (with error handling)
    console.log('🔍 [Create Workspace] Checking if URL is available:', workspaceData.url);
    try {
      const urlQuery = query(
        collection(db, WORKSPACES_COLLECTION),
        where('url', '==', workspaceData.url)
      );
      const urlSnapshot = await getDocs(urlQuery);
      
      if (!urlSnapshot.empty) {
        console.log('❌ [Create Workspace] URL is already taken');
        return { success: false, error: 'Workspace URL is already taken' };
      }
      
      console.log('✅ [Create Workspace] URL is available, creating workspace...');
    } catch (urlCheckError) {
      console.warn('⚠️ [Create Workspace] URL check failed, proceeding with creation:', urlCheckError);
      // Continue with workspace creation even if URL check fails
    }

    // Create workspace document
    console.log('📝 [Create Workspace] Creating workspace document...');
    const workspaceRef = await addDoc(collection(db, WORKSPACES_COLLECTION), {
      name: workspaceData.name,
      url: workspaceData.url,
      description: workspaceData.description || '',
      ownerId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      settings: {
        primaryColor: workspaceData.settings?.primaryColor || '#3b82f6',
        timezone: workspaceData.settings?.timezone || 'UTC',
        language: workspaceData.settings?.language || 'en',
        ...workspaceData.settings
      },
      subscription: {
        plan: 'free',
        status: 'active'
      }
    });
    
    console.log('✅ [Create Workspace] Workspace document created:', workspaceRef.id);

    // Add owner as workspace member
    console.log('👤 [Create Workspace] Adding owner as workspace member...');
    const memberId = `${ownerId}_${workspaceRef.id}`;
    await setDoc(doc(db, WORKSPACE_MEMBERS_COLLECTION, memberId), {
      userId: ownerId,
      workspaceId: workspaceRef.id,
      role: 'owner',
      permissions: ['*'], // Owner has all permissions
      joinedAt: serverTimestamp()
    });
    
    console.log('✅ [Create Workspace] Owner added as workspace member:', memberId);

    // Get the created workspace
    const workspaceDoc = await getDoc(workspaceRef);
    if (workspaceDoc.exists()) {
      const data = workspaceDoc.data();
      const workspace: Workspace = {
        id: workspaceDoc.id,
        name: data.name,
        url: data.url,
        ownerId: data.ownerId,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        settings: data.settings || {
          primaryColor: '#3b82f6',
          timezone: 'UTC',
          language: 'en'
        },
        members: [], // Will be populated separately
        subscription: data.subscription || {
          plan: 'free',
          status: 'active',
          trialEndsAt: data.createdAt?.toDate() || new Date()
        }
      };

      return { success: true, data: workspace };
    }

    return { success: false, error: 'Failed to create workspace' };
  } catch (error) {
    console.error('❌ [Create Workspace] Error creating workspace:', error);
    
    // Handle specific Firestore errors
    if (error instanceof Error) {
      if (error.message.includes('permission')) {
        return { success: false, error: 'Permission denied. Please check your authentication status.' };
      } else if (error.message.includes('network')) {
        return { success: false, error: 'Network error. Please check your connection.' };
      } else {
        return { success: false, error: `Failed to create workspace: ${error.message}` };
      }
    }
    
    return { success: false, error: 'Failed to create workspace' };
  }
}

// Get workspace by ID
export async function getWorkspace(workspaceId: string): Promise<{ success: boolean; data?: Workspace; error?: string }> {
  try {
    const workspaceDoc = await getDoc(doc(db, WORKSPACES_COLLECTION, workspaceId));
    
    if (!workspaceDoc.exists()) {
      return { success: false, error: 'Workspace not found' };
    }

    const data = workspaceDoc.data();
    const workspace: Workspace = {
      id: workspaceDoc.id,
      name: data.name,
      url: data.url,
      ownerId: data.ownerId,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      settings: data.settings || {
        primaryColor: '#3b82f6',
        timezone: 'UTC',
        language: 'en'
      },
      members: [], // Will be populated separately
      subscription: data.subscription || {
        plan: 'free',
        status: 'active',
        trialEndsAt: data.createdAt?.toDate() || new Date()
      }
    };

    return { success: true, data: workspace };
  } catch (error) {
    console.error('Error getting workspace:', error);
    return { success: false, error: (error as Error).message };
  }
}

// Get workspaces for a user
export async function getUserWorkspaces(userId: string): Promise<{ success: boolean; data?: Workspace[]; error?: string }> {
  try {
    // Get all workspace memberships for this user
    const membersQuery = query(
      collection(db, WORKSPACE_MEMBERS_COLLECTION),
      where('userId', '==', userId)
    );
    const membersSnapshot = await getDocs(membersQuery);
    
    if (membersSnapshot.empty) {
      return { success: true, data: [] };
    }

    const workspaceIds = membersSnapshot.docs.map(doc => doc.data().workspaceId);
    
    // Get workspace details
    const workspaces: Workspace[] = [];
    for (const workspaceId of workspaceIds) {
      const workspaceResult = await getWorkspace(workspaceId);
      if (workspaceResult.success && workspaceResult.data) {
        workspaces.push(workspaceResult.data);
      }
    }

    return { success: true, data: workspaces };
  } catch (error) {
    console.error('Error getting user workspaces:', error);
    return { success: false, error: (error as Error).message };
  }
}

// Update workspace
export async function updateWorkspace(
  workspaceId: string, 
  updateData: UpdateWorkspaceData
): Promise<{ success: boolean; data?: Workspace; error?: string }> {
  try {
    const workspaceRef = doc(db, WORKSPACES_COLLECTION, workspaceId);
    
    // Check if URL is being changed and if it's available
    if (updateData.url) {
      const urlQuery = query(
        collection(db, WORKSPACES_COLLECTION),
        where('url', '==', updateData.url)
      );
      const urlSnapshot = await getDocs(urlQuery);
      
      if (!urlSnapshot.empty && urlSnapshot.docs[0].id !== workspaceId) {
        return { success: false, error: 'Workspace URL is already taken' };
      }
    }

    await updateDoc(workspaceRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });

    // Get updated workspace
    const result = await getWorkspace(workspaceId);
    return result;
  } catch (error) {
    console.error('Error updating workspace:', error);
    return { success: false, error: (error as Error).message };
  }
}

// Delete workspace
export async function deleteWorkspace(workspaceId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Delete workspace members
    const membersQuery = query(
      collection(db, WORKSPACE_MEMBERS_COLLECTION),
      where('workspaceId', '==', workspaceId)
    );
    const membersSnapshot = await getDocs(membersQuery);
    
    for (const memberDoc of membersSnapshot.docs) {
      await deleteDoc(memberDoc.ref);
    }

    // Delete workspace invites
    const invitesQuery = query(
      collection(db, WORKSPACE_INVITES_COLLECTION),
      where('workspaceId', '==', workspaceId)
    );
    const invitesSnapshot = await getDocs(invitesQuery);
    
    for (const inviteDoc of invitesSnapshot.docs) {
      await deleteDoc(inviteDoc.ref);
    }

    // Delete workspace
    await deleteDoc(doc(db, WORKSPACES_COLLECTION, workspaceId));

    return { success: true };
  } catch (error) {
    console.error('Error deleting workspace:', error);
    return { success: false, error: (error as Error).message };
  }
}

// Get workspace members
export async function getWorkspaceMembers(workspaceId: string): Promise<{ success: boolean; data?: WorkspaceMember[]; error?: string }> {
  try {
    const membersQuery = query(
      collection(db, WORKSPACE_MEMBERS_COLLECTION),
      where('workspaceId', '==', workspaceId),
      orderBy('joinedAt', 'asc')
    );
    const membersSnapshot = await getDocs(membersQuery);
    
    const members: WorkspaceMember[] = membersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      joinedAt: doc.data().joinedAt?.toDate() || new Date()
    })) as WorkspaceMember[];

    return { success: true, data: members };
  } catch (error) {
    console.error('Error getting workspace members:', error);
    return { success: false, error: (error as Error).message };
  }
}

// Add member to workspace
export async function addWorkspaceMember(
  workspaceId: string,
  userId: string,
  role: 'admin' | 'member' = 'member'
): Promise<{ success: boolean; error?: string }> {
  try {
    const memberId = `${userId}_${workspaceId}`;
    
    // Check if user is already a member
    const memberDoc = await getDoc(doc(db, WORKSPACE_MEMBERS_COLLECTION, memberId));
    
    if (memberDoc.exists()) {
      return { success: false, error: 'User is already a member of this workspace' };
    }

    // Add member
    await setDoc(doc(db, WORKSPACE_MEMBERS_COLLECTION, memberId), {
      userId,
      workspaceId,
      role,
      permissions: role === 'admin' ? ['read', 'write', 'manage'] : ['read', 'write'],
      joinedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error adding workspace member:', error);
    return { success: false, error: (error as Error).message };
  }
}

// Remove member from workspace
export async function removeWorkspaceMember(
  workspaceId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const memberId = `${userId}_${workspaceId}`;
    const memberDoc = doc(db, WORKSPACE_MEMBERS_COLLECTION, memberId);
    const memberSnapshot = await getDoc(memberDoc);
    
    if (!memberSnapshot.exists()) {
      return { success: false, error: 'User is not a member of this workspace' };
    }

    await deleteDoc(memberDoc);

    return { success: true };
  } catch (error) {
    console.error('Error removing workspace member:', error);
    return { success: false, error: (error as Error).message };
  }
}

// Create workspace invite
export async function createWorkspaceInvite(
  workspaceId: string,
  email: string,
  role: 'admin' | 'member',
  invitedBy: string
): Promise<{ success: boolean; data?: WorkspaceInvite; error?: string }> {
  try {
    // Generate invite token
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Set expiration date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const inviteRef = await addDoc(collection(db, WORKSPACE_INVITES_COLLECTION), {
      workspaceId,
      email,
      role,
      invitedBy,
      token,
      expiresAt: Timestamp.fromDate(expiresAt),
      createdAt: serverTimestamp(),
      status: 'pending'
    });

    const inviteDoc = await getDoc(inviteRef);
    if (inviteDoc.exists()) {
      const invite = {
        id: inviteDoc.id,
        ...inviteDoc.data(),
        expiresAt: inviteDoc.data().expiresAt?.toDate() || new Date(),
        createdAt: inviteDoc.data().createdAt?.toDate() || new Date()
      } as WorkspaceInvite;

      return { success: true, data: invite };
    }

    return { success: false, error: 'Failed to create invite' };
  } catch (error) {
    console.error('Error creating workspace invite:', error);
    return { success: false, error: (error as Error).message };
  }
}

// Accept workspace invite
export async function acceptWorkspaceInvite(
  token: string,
  userId: string
): Promise<{ success: boolean; data?: Workspace; error?: string }> {
  try {
    // Find invite by token
    const inviteQuery = query(
      collection(db, WORKSPACE_INVITES_COLLECTION),
      where('token', '==', token),
      where('status', '==', 'pending')
    );
    const inviteSnapshot = await getDocs(inviteQuery);
    
    if (inviteSnapshot.empty) {
      return { success: false, error: 'Invalid or expired invite' };
    }

    const inviteDoc = inviteSnapshot.docs[0];
    const inviteData = inviteDoc.data();
    
    // Check if invite is expired
    if (inviteData.expiresAt.toDate() < new Date()) {
      return { success: false, error: 'Invite has expired' };
    }

    // Add user to workspace
    const memberId = `${userId}_${inviteData.workspaceId}`;
    await setDoc(doc(db, WORKSPACE_MEMBERS_COLLECTION, memberId), {
      userId,
      workspaceId: inviteData.workspaceId,
      role: inviteData.role,
      permissions: inviteData.role === 'admin' ? ['read', 'write', 'manage'] : ['read', 'write'],
      joinedAt: serverTimestamp()
    });

    // Update invite status
    await updateDoc(inviteDoc.ref, {
      status: 'accepted'
    });

    // Get workspace details
    const workspaceResult = await getWorkspace(inviteData.workspaceId);
    return workspaceResult;
  } catch (error) {
    console.error('Error accepting workspace invite:', error);
    return { success: false, error: (error as Error).message };
  }
}

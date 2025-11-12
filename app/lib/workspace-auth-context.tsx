"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendSignInLinkToEmail as firebaseSendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink as firebaseSignInWithEmailLink,
  ActionCodeSettings
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from './firebase';
import {
  createWorkspace,
  getUserWorkspaces,
  getWorkspace
} from './workspace-firestore-utils';
import { Workspace } from './workspace-types';
import { events, identifyUser, resetUser } from './posthog';

interface UserData {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  firstName?: string;
  lastName?: string;
  createdAt?: Date | ReturnType<typeof serverTimestamp>;
  lastLoginAt?: Date | ReturnType<typeof serverTimestamp>;
  updatedAt?: Date | ReturnType<typeof serverTimestamp>;
  // Subscription fields
  subscriptionPlan?: 'free_trial' | 'starter' | 'professional' | 'enterprise';
  subscriptionStatus?: 'active' | 'expired' | 'cancelled';
  trialStartDate?: Date | ReturnType<typeof serverTimestamp>;
  trialEndDate?: Date | ReturnType<typeof serverTimestamp>;
  subscriptionStartDate?: Date | ReturnType<typeof serverTimestamp>;
  subscriptionEndDate?: Date | ReturnType<typeof serverTimestamp>;
}

interface WorkspaceContext {
  currentWorkspace: Workspace | null;
  userWorkspaces: Workspace[];
  loading: boolean;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  workspaceContext: WorkspaceContext;
  loading: boolean;
  signInWithGoogle: () => Promise<{ user: User; isNewUser: boolean }>;
  signInWithEmail: (email: string, password: string) => Promise<User>;
  signUpWithEmail: (email: string, password: string, fullName?: string) => Promise<User>;
  sendSignInLinkToEmail: (email: string) => Promise<void>;
  signInWithEmailLink: (email: string, emailLink: string) => Promise<User>;
  signOut: () => Promise<void>;
  updateUserData: (data: Partial<UserData>) => Promise<void>;
  createWorkspace: (name: string, url: string, description?: string) => Promise<{ success: boolean; error?: string }>;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  refreshWorkspaceContext: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [workspaceContext, setWorkspaceContext] = useState<WorkspaceContext>({
    currentWorkspace: null,
    userWorkspaces: [],
    loading: true
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔐 [Auth State] Auth state changed:', user ? 'User logged in' : 'User logged out');
      
      if (user) {
        console.log('👤 [Auth State] User details:', {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          emailVerified: user.emailVerified
        });
      }
      
      setUser(user);
      
      if (user) {
        // Fetch additional user data from Firestore
        try {
          console.log('🔍 [Auth State] Fetching user data from Firestore...');
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          
          if (userDoc.exists()) {
            console.log('📋 [Auth State] User document found in Firestore');
            const userData = userDoc.data() as UserData;
            console.log('📊 [Auth State] User data from Firestore:', userData);
            
            // Check if user has verified email but data is incomplete
            if ((userData as any).pendingVerification && user.emailVerified) {
              console.log('✅ [Auth State] Email verified! Completing user setup...');
              
              // Parse the temporary name
              const tempName = (userData as any).tempName || '';
              let firstName = '';
              let lastName = '';
              let displayName = '';
              
              if (tempName && tempName.trim()) {
                const nameParts = tempName.trim().split(' ');
                firstName = nameParts[0] || '';
                lastName = nameParts.slice(1).join(' ') || '';
                displayName = tempName.trim();
              } else {
                displayName = user.email?.split('@')[0] || 'User';
                firstName = displayName;
              }
              
              // Complete user data
              const now = new Date();
              const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
              
              const completeUserData: UserData = {
                uid: user.uid,
                email: user.email || '',
                displayName: displayName,
                firstName: firstName,
                lastName: lastName,
                ...(user.photoURL && { photoURL: user.photoURL }),
                createdAt: userData.createdAt || serverTimestamp(),
                lastLoginAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                subscriptionPlan: 'free_trial',
                subscriptionStatus: 'active',
                trialStartDate: serverTimestamp(),
                trialEndDate: trialEnd
              };
              
              console.log('💾 [Auth State] Saving complete user data:', completeUserData);
              await setDoc(doc(db, 'users', user.uid), completeUserData);
              
              setUserData(completeUserData);
              
              // Identify user in PostHog
              identifyUser(user.uid, {
                email: user.email || '',
                name: displayName,
                firstName: firstName,
                lastName: lastName,
                uid: user.uid,
                emailVerified: true
              });
              
              // Send welcome email
              import('./email-client').then(({ sendWelcomeEmailToUser }) => {
                sendWelcomeEmailToUser({
                  email: user.email || '',
                  name: displayName
                }).then(result => {
                  if (result.success) {
                    console.log('✅ [Auth State] Welcome email sent successfully!');
                  } else {
                    console.warn('⚠️ [Auth State] Failed to send welcome email:', result.error);
                  }
                }).catch(err => {
                  console.warn('⚠️ [Auth State] Error sending welcome email:', err);
                });
              });
              
              console.log('✅ [Auth State] User setup completed after verification');
            } else {
              setUserData(userData);
              
              // Identify user in PostHog with email
              identifyUser(user.uid, {
                email: user.email || userData.email,
                name: user.displayName || userData.displayName,
                uid: user.uid,
              });
            }
          } else {
            console.log('🆕 [Auth State] User document not found, creating basic user data...');
            
            // Create basic user data if it doesn't exist
            const basicUserData: UserData = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || '',
              ...(user.photoURL && { photoURL: user.photoURL }),
              createdAt: serverTimestamp(),
              lastLoginAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            };
            
            console.log('💾 [Auth State] Creating basic user document:', basicUserData);
            await setDoc(doc(db, 'users', user.uid), basicUserData);
            
            const stateData = {
              ...basicUserData,
              createdAt: new Date(),
              lastLoginAt: new Date(),
              updatedAt: new Date()
            };
            
            console.log('🔄 [Auth State] Setting user data state:', stateData);
            setUserData(stateData);
            
            // Identify user in PostHog with email
            identifyUser(user.uid, {
              email: user.email || '',
              name: user.displayName || '',
              uid: user.uid,
            });
          }

          // Load workspace context
          console.log('🏢 [Auth State] Loading workspace context...');
          await loadWorkspaceContext(user.uid);
        } catch (error) {
          console.error('❌ [Auth State] Error fetching user data:', error);
        }
      } else {
        console.log('🔄 [Auth State] Clearing user data state');
        setUserData(null);
        setWorkspaceContext({
          currentWorkspace: null,
          userWorkspaces: [],
          loading: false
        });
      }
      
      console.log('🏁 [Auth State] Auth state processing completed');
      setLoading(false);
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadWorkspaceContext = useCallback(async (userId: string) => {
    try {
      console.log('🔄 [Workspace Context] Loading workspaces for user:', userId);
      
      const workspacesResult = await getUserWorkspaces(userId);
      if (workspacesResult.success && workspacesResult.data) {
        console.log('✅ [Workspace Context] Workspaces loaded:', workspacesResult.data);
        
        // Set the first workspace as current, or create a default one if none exist
        let currentWorkspace = workspacesResult.data[0] || null;
        
        if (!currentWorkspace && userData) {
          console.log('🆕 [Workspace Context] No workspaces found, creating default workspace...');
          
          // Create default workspace with user's name
          const defaultWorkspaceName = `${userData.displayName || userData.firstName || 'My'}'s Workspace`;
          const defaultWorkspaceUrl = `${userData.displayName?.toLowerCase().replace(/\s+/g, '-') || 'my-workspace'}-${Date.now()}`;
          
          try {
            const createResult = await createWorkspace(userId, {
              name: defaultWorkspaceName,
              url: defaultWorkspaceUrl,
              description: 'Your default workspace'
            });
            
            if (createResult.success && createResult.data) {
              currentWorkspace = createResult.data;
              console.log('✅ [Workspace Context] Default workspace created:', currentWorkspace);
            } else {
              console.error('❌ [Workspace Context] Failed to create default workspace:', createResult.error);
            }
          } catch (error) {
            console.error('❌ [Workspace Context] Error creating default workspace:', error);
          }
        }
        
        setWorkspaceContext({
          currentWorkspace,
          userWorkspaces: workspacesResult.data,
          loading: false
        });
      } else {
        console.log('ℹ️ [Workspace Context] No workspaces found:', workspacesResult.error);
        setWorkspaceContext({
          currentWorkspace: null,
          userWorkspaces: [],
          loading: false
        });
      }
    } catch (error) {
      console.error('❌ [Workspace Context] Error loading workspace context:', error);
      setWorkspaceContext({
        currentWorkspace: null,
        userWorkspaces: [],
        loading: false
      });
    }
  }, [userData]);

  const signInWithGoogle = async (): Promise<{ user: User; isNewUser: boolean }> => {
    try {
      console.log('🔵 [Google Auth] Starting Google sign-in process...');
      
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      console.log('🟢 [Google Auth] Google authentication successful');
      console.log('📊 [Google Auth] User data from Google:', {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified
      });
      
      // Check if user already exists in Firestore
      console.log('🔍 [Firestore] Checking if user exists in database...');
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const isNewUser = !userDoc.exists();
      
      console.log('📋 [Firestore] User document exists:', !isNewUser);
      
      if (isNewUser) {
        console.log('🆕 [Firestore] Creating new user document...');
        
        // Extract name parts from Google display name
        const nameParts = user.displayName?.split(' ') || [];
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        console.log('👤 [User Data] Parsed name:', { firstName, lastName });
        
        // Create new user document with Google data
        const now = new Date();
        const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days from now
        
        const newUserData: UserData = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          ...(user.photoURL && { photoURL: user.photoURL }),
          firstName: firstName,
          lastName: lastName,
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          // Initialize 14-day free trial
          subscriptionPlan: 'free_trial',
          subscriptionStatus: 'active',
          trialStartDate: serverTimestamp(),
          trialEndDate: trialEnd
        };
        
        console.log('💾 [Firestore] Saving new user data:', newUserData);
        
        await setDoc(doc(db, 'users', user.uid), newUserData);
        
        console.log('✅ [Firestore] New user document created successfully');
        
        setUserData({
          ...newUserData,
          createdAt: new Date(),
          lastLoginAt: new Date(),
          updatedAt: new Date()
        });
        
        // Identify user in PostHog with email (before tracking events)
        identifyUser(user.uid, {
          email: user.email || '',
          name: user.displayName || '',
          uid: user.uid,
          method: 'google'
        });
        
        // Track sign up event
        events.signUp('google');
        
        console.log('🔄 [State] User data state updated');
        
        // Send welcome email asynchronously (don't block signup flow)
        const userName = newUserData.displayName || `${firstName} ${lastName}`.trim() || 'User';
        console.log('📧 Triggering welcome email for new Google user:', userName);
        
        // Import and send welcome email (async, non-blocking)
        import('./email-client').then(({ sendWelcomeEmailToUser }) => {
          sendWelcomeEmailToUser({
            email: user.email || '',
            name: userName
          }).then(result => {
            if (result.success) {
              console.log('✅ Welcome email sent successfully to:', user.email);
            } else {
              console.warn('⚠️ Failed to send welcome email:', result.error);
            }
          }).catch(err => {
            console.warn('⚠️ Error sending welcome email:', err);
          });
        });
      } else {
        console.log('👤 [Firestore] Updating existing user...');
        
        // Update last login time
        const existingData = userDoc.data() as UserData;
        console.log('📊 [Firestore] Existing user data:', existingData);
        
        const updatedData = {
          ...existingData,
          lastLoginAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        console.log('💾 [Firestore] Updating user with:', updatedData);
        
        await setDoc(doc(db, 'users', user.uid), updatedData, { merge: true });
        
        console.log('✅ [Firestore] User document updated successfully');
        
        setUserData({
          ...updatedData,
          lastLoginAt: new Date(),
          updatedAt: new Date()
        });
        
        // Identify user in PostHog with email (before tracking events)
        identifyUser(user.uid, {
          email: user.email || '',
          name: user.displayName || '',
          uid: user.uid,
          method: 'google'
        });
        
        // Track sign in event
        events.signIn('google');
        
        console.log('🔄 [State] User data state updated');
      }
      
      console.log('🎉 [Google Auth] Sign-in process completed successfully');
      console.log('📤 [Google Auth] Returning result:', { isNewUser, userId: user.uid });
      
      return { user, isNewUser };
    } catch (error) {
      console.error('❌ [Google Auth] Error during sign-in:', error);
      const firebaseError = error as { code?: string; message?: string; stack?: string };
      console.error('❌ [Google Auth] Error details:', {
        code: firebaseError.code,
        message: firebaseError.message,
        stack: firebaseError.stack
      });
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string): Promise<User> => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Update last login time
      await setDoc(doc(db, 'users', result.user.uid), {
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      // Identify user in PostHog with email (before tracking events)
      identifyUser(result.user.uid, {
        email: result.user.email || '',
        uid: result.user.uid,
        method: 'email'
      });
      
      // Track sign in event
      events.signIn('email');
      
      return result.user;
    } catch (error) {
      console.error('Error signing in with email:', error);
      events.errorOccurred('Sign in failed', 'authentication_error', { method: 'email' });
      throw error;
    }
  };

  const sendSignInLinkToEmail = async (email: string): Promise<void> => {
    try {
      console.log('📧 [Email Link] Sending sign-in link to:', email);
      
      // Get the current origin
      const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const callbackUrl = `${origin}/auth/callback`;
      
      console.log('🔗 [Email Link] Callback URL:', callbackUrl);
      console.log('🌐 [Email Link] Origin:', origin);
      
      const actionCodeSettings: ActionCodeSettings = {
        // URL to redirect back to after clicking the link
        url: callbackUrl,
        // This must be true for email link sign-in
        handleCodeInApp: true,
      };
      
      console.log('⚙️ [Email Link] Action code settings:', actionCodeSettings);
      
      await firebaseSendSignInLinkToEmail(auth, email, actionCodeSettings);
      
      // Save the email locally so we don't need to ask for it again
      // if the user opens the link on the same device
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('emailForSignIn', email);
      }
      
      console.log('✅ [Email Link] Sign-in link sent successfully');
      console.log('📬 [Email Link] Check your inbox at:', email);
      console.log('💡 [Email Link] Note: Email may take a few minutes to arrive. Check spam folder if not in inbox.');
      
      // Track event
      events.buttonClicked('email_link_signin_requested', 'signin_page');
    } catch (error: any) {
      console.error('❌ [Email Link] Error sending sign-in link:', error);
      console.error('❌ [Email Link] Error code:', error?.code);
      console.error('❌ [Email Link] Error message:', error?.message);
      
      // Provide user-friendly error messages
      let errorMessage = 'Failed to send sign-in link';
      if (error?.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address. Please check and try again.';
      } else if (error?.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled. Please contact support.';
      } else if (error?.code === 'auth/user-not-found') {
        // This is actually OK for sign-up flow
        errorMessage = 'Failed to send link. Please try again.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      events.errorOccurred('Email link send failed', 'authentication_error', { 
        error: error?.message || 'Unknown error',
        code: error?.code
      });
      
      throw new Error(errorMessage);
    }
  };

  const signInWithEmailLink = async (email: string, emailLink: string): Promise<User> => {
    try {
      console.log('🔗 [Email Link] Completing sign-in with email link');
      
      const result = await firebaseSignInWithEmailLink(auth, email, emailLink);
      const user = result.user;
      
      console.log('✅ [Email Link] Sign-in successful:', user.uid);
      
      // Clear email from storage
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('emailForSignIn');
      }
      
      // Check if this is a new user
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const isNewUser = !userDoc.exists();
      
      // Get pending full name from localStorage if available (from signup page)
      let pendingFullName = '';
      if (typeof window !== 'undefined') {
        pendingFullName = window.localStorage.getItem('pendingFullName') || '';
        if (pendingFullName) {
          window.localStorage.removeItem('pendingFullName');
        }
      }
      
      // Parse name: use pendingFullName if available, otherwise use email username
      let firstName = '';
      let lastName = '';
      let displayName = '';
      
      if (pendingFullName && pendingFullName.trim()) {
        const nameParts = pendingFullName.trim().split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
        displayName = pendingFullName.trim();
      } else {
        // Fallback to email username
        const emailUsername = email.split('@')[0];
        displayName = emailUsername.charAt(0).toUpperCase() + emailUsername.slice(1);
        firstName = displayName;
      }
      
      if (isNewUser) {
        console.log('🆕 [Email Link] New user detected, creating user document...');
        console.log('👤 [Email Link] Using name:', { firstName, lastName, displayName });
        
        // Create user document
        const now = new Date();
        const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
        
        const newUserData: UserData = {
          uid: user.uid,
          email: user.email || '',
          displayName: displayName,
          firstName: firstName,
          lastName: lastName,
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          subscriptionPlan: 'free_trial',
          subscriptionStatus: 'active',
          trialStartDate: serverTimestamp(),
          trialEndDate: trialEnd
        };
        
        await setDoc(doc(db, 'users', user.uid), newUserData);
        setUserData({
          ...newUserData,
          createdAt: new Date(),
          lastLoginAt: new Date(),
          updatedAt: new Date()
        });
        
        // Track sign up event
        events.signUp('email_link');
        
        // Send welcome email
        import('./email-client').then(({ sendWelcomeEmailToUser }) => {
          sendWelcomeEmailToUser({
            email: user.email || '',
            name: displayName
          }).catch(err => {
            console.warn('⚠️ [Email Link] Failed to send welcome email:', err);
          });
        });
      } else {
        // Update last login time for existing user
        await setDoc(doc(db, 'users', user.uid), {
          lastLoginAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });
        
        // Track sign in event
        events.signIn('email_link');
      }
      
      // Identify user in PostHog
      const userData = userDoc.exists() ? userDoc.data() as UserData : null;
      const finalDisplayName = userData?.displayName || displayName;
      identifyUser(user.uid, {
        email: user.email || '',
        name: finalDisplayName,
        uid: user.uid,
        method: 'email_link',
        emailVerified: user.emailVerified
      });
      
      return user;
    } catch (error) {
      console.error('❌ [Email Link] Error completing sign-in:', error);
      events.errorOccurred('Email link sign-in failed', 'authentication_error', {
        error: (error as Error).message
      });
      throw error;
    }
  };

  const signUpWithEmail = async (
    email: string, 
    password: string, 
    fullName?: string
  ): Promise<User> => {
    try {
      console.log('📝 [Email Signup] Starting email signup...');
      console.log('📊 [Email Signup] Email:', email, 'Full Name:', fullName);
      
      // Create Firebase auth user
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;
      
      console.log('✅ [Email Signup] Firebase auth user created:', user.uid);
      
      // Send email verification FIRST before saving any data
      try {
        console.log('📧 [Email Signup] Sending verification email to:', user.email);
        await sendEmailVerification(user, {
          url: `${window.location.origin}/verify-email?continue=/dashboard`,
          handleCodeInApp: false
        });
        console.log('✅ [Email Signup] Verification email sent successfully');
      } catch (verificationError) {
        console.error('❌ [Email Signup] Failed to send verification email:', verificationError);
        // Delete the user if we can't send verification email
        await user.delete();
        throw new Error('Failed to send verification email. Please try again.');
      }
      
      // Store minimal data temporarily (will be completed after verification)
      const tempUserData = {
        uid: user.uid,
        email: user.email || '',
        emailVerified: false,
        pendingVerification: true,
        tempName: fullName, // Store temporarily
        createdAt: serverTimestamp()
      };
      
      console.log('💾 [Email Signup] Saving temporary user data:', tempUserData);
      await setDoc(doc(db, 'users', user.uid), tempUserData);
      
      // Track sign up event
      events.signUp('email');
      
      console.log('🎉 [Email Signup] Signup completed, awaiting verification');
      
      return user;
    } catch (error) {
      console.error('❌ [Email Signup] Error during signup:', error);
      throw error;
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      // Track sign out event
      events.signOut();
      resetUser();
      
      await firebaseSignOut(auth);
      setUserData(null);
      setWorkspaceContext({
        currentWorkspace: null,
        userWorkspaces: [],
        loading: false
      });
    } catch (error) {
      console.error('Error signing out:', error);
      events.errorOccurred('Sign out failed', 'authentication_error');
      throw error;
    }
  };

  const updateUserData = async (data: Partial<UserData>): Promise<void> => {
    if (!user) {
      console.error('❌ [Update User Data] No user logged in');
      throw new Error('No user logged in');
    }
    
    try {
      console.log('🔄 [Update User Data] Starting user data update...');
      console.log('📊 [Update User Data] Current user:', { uid: user.uid, email: user.email });
      console.log('📝 [Update User Data] Data to update:', data);
      
      const updateData = {
        ...data,
        updatedAt: serverTimestamp()
      };
      
      console.log('💾 [Update User Data] Saving to Firestore:', updateData);
      
      await setDoc(doc(db, 'users', user.uid), updateData, { merge: true });
      
      console.log('✅ [Update User Data] Firestore update successful');
      
      setUserData(prev => {
        const newData = prev ? { 
          ...prev, 
          ...data, 
          updatedAt: new Date() 
        } : null;
        
        console.log('🔄 [Update User Data] State updated:', newData);
        return newData;
      });
      
      console.log('🎉 [Update User Data] User data update completed successfully');
    } catch (error) {
      console.error('❌ [Update User Data] Error updating user data:', error);
      const firebaseError = error as { code?: string; message?: string; stack?: string };
      console.error('❌ [Update User Data] Error details:', {
        code: firebaseError.code,
        message: firebaseError.message,
        stack: firebaseError.stack
      });
      throw error;
    }
  };

  const createWorkspaceHandler = async (name: string, url: string, description?: string) => {
    if (!user) {
      console.error('❌ [Create Workspace] No user available');
      throw new Error('User must be logged in to create a workspace');
    }

    console.log('🏢 [Create Workspace] Creating workspace:', { name, url, description, userId: user.uid });
    
    try {
      const result = await createWorkspace(user.uid, { 
        name, 
        url, 
        description 
      });
      
      if (!result.success) {
        // Return the error instead of throwing it - UI will handle the error display
        return { success: false, error: result.error || 'Failed to create workspace' };
      }

      console.log('✅ [Create Workspace] Workspace created successfully, reloading context...');
      
      // Track workspace creation
      if (result.data) {
        events.workspaceCreated(result.data.id, result.data.name);
        
        // Send workspace created email notification
        try {
          const { sendWorkspaceCreatedEmail } = await import('./email-utils');
          const userName = user.displayName || user.email || 'User';
          await sendWorkspaceCreatedEmail(
            user.email || '',
            userName,
            result.data.name
          );
        } catch (emailError) {
          // Don't fail workspace creation if email fails
          console.error('❌ [Create Workspace] Failed to send workspace created email:', emailError);
        }
      }
      
      // Reload workspace context
      await loadWorkspaceContext(user.uid);
      
      console.log('✅ [Create Workspace] Workspace context reloaded');
      
      return { success: true };
    } catch (error) {
      // Return the error instead of throwing it - UI will handle the error display
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create workspace' 
      };
    }
  };

  const switchWorkspace = async (workspaceId: string) => {
    if (!user) {
      throw new Error('User must be logged in to switch workspace');
    }

    console.log('🔄 [Switch Workspace] Switching to workspace:', workspaceId);
    
    const result = await getWorkspace(workspaceId);
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Workspace not found');
    }

    // Track workspace switch
    events.workspaceSwitched(result.data.id, result.data.name);

    setWorkspaceContext(prev => ({
      ...prev,
      currentWorkspace: result.data!
    }));
  };

  const refreshWorkspaceContext = async (): Promise<void> => {
    if (!user) return;
    
    try {
      console.log('🔄 [Refresh Workspace Context] Refreshing workspace context for user:', user.uid);
      await loadWorkspaceContext(user.uid);
    } catch (error) {
      console.error('❌ [Refresh Workspace Context] Error refreshing workspace context:', error);
    }
  };

  const value: AuthContextType = {
    user,
    userData,
    workspaceContext,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    sendSignInLinkToEmail,
    signInWithEmailLink,
    signOut,
    updateUserData,
    createWorkspace: createWorkspaceHandler,
    switchWorkspace,
    refreshWorkspaceContext
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Provide a safe fallback during prerender or outside provider to avoid build-time errors
    return {
      user: null,
      userData: null,
      workspaceContext: { currentWorkspace: null, userWorkspaces: [], loading: true },
      loading: true,
      signInWithGoogle: async () => { throw new Error('Auth not available'); },
      signInWithEmail: async () => { throw new Error('Auth not available'); },
      signUpWithEmail: async () => { throw new Error('Auth not available'); },
      sendSignInLinkToEmail: async () => { throw new Error('Auth not available'); },
      signInWithEmailLink: async () => { throw new Error('Auth not available'); },
      signOut: async () => {},
      updateUserData: async () => {},
      createWorkspace: async () => ({ success: false, error: 'Auth not available' }),
      switchWorkspace: async () => {},
      refreshWorkspaceContext: async () => {},
    } as AuthContextType;
  }
  return context;
}

export type { UserData, AuthContextType, WorkspaceContext };

"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from './firebase';

interface UserData {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  role?: string;
  createdAt?: Date | any; // Allow serverTimestamp
  lastLoginAt?: Date | any; // Allow serverTimestamp
  updatedAt?: Date | any; // Allow serverTimestamp
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  signInWithGoogle: () => Promise<{ user: User; isNewUser: boolean }>;
  signInWithEmail: (email: string, password: string) => Promise<User>;
  signUpWithEmail: (email: string, password: string, additionalData?: Partial<UserData>) => Promise<User>;
  signOut: () => Promise<void>;
  updateUserData: (data: Partial<UserData>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
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
            setUserData(userData);
          } else {
            console.log('🆕 [Auth State] User document not found, creating basic user data...');
            
            // Create basic user data if it doesn't exist
            const basicUserData: UserData = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || '',
              photoURL: user.photoURL || undefined,
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
          }
        } catch (error) {
          console.error('❌ [Auth State] Error fetching user data:', error);
        }
      } else {
        console.log('🔄 [Auth State] Clearing user data state');
        setUserData(null);
      }
      
      console.log('🏁 [Auth State] Auth state processing completed');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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
        const newUserData: UserData = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          photoURL: user.photoURL || undefined,
          firstName: firstName,
          lastName: lastName,
          // Set default values for optional fields
          company: '',
          role: '',
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
          updatedAt: serverTimestamp()
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
        
        console.log('🔄 [State] User data state updated');
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
        
        console.log('🔄 [State] User data state updated');
      }
      
      console.log('🎉 [Google Auth] Sign-in process completed successfully');
      console.log('📤 [Google Auth] Returning result:', { isNewUser, userId: user.uid });
      
      return { user, isNewUser };
    } catch (error) {
      console.error('❌ [Google Auth] Error during sign-in:', error);
      console.error('❌ [Google Auth] Error details:', {
        code: (error as any).code,
        message: (error as any).message,
        stack: (error as any).stack
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
      
      return result.user;
    } catch (error) {
      console.error('Error signing in with email:', error);
      throw error;
    }
  };

  const signUpWithEmail = async (
    email: string, 
    password: string, 
    additionalData?: Partial<UserData>
  ): Promise<User> => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;
      
      // Create user document in Firestore
      const newUserData: UserData = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || undefined,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...additionalData
      };
      
      await setDoc(doc(db, 'users', user.uid), newUserData);
      setUserData({
        ...newUserData,
        createdAt: new Date(),
        lastLoginAt: new Date(),
        updatedAt: new Date()
      });
      
      return user;
    } catch (error) {
      console.error('Error signing up with email:', error);
      throw error;
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await firebaseSignOut(auth);
      setUserData(null);
    } catch (error) {
      console.error('Error signing out:', error);
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
      console.error('❌ [Update User Data] Error details:', {
        code: (error as any).code,
        message: (error as any).message,
        stack: (error as any).stack
      });
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    userData,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    updateUserData
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export type { UserData, AuthContextType };
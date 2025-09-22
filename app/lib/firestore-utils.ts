import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  serverTimestamp,
  Timestamp,
  startAfter,
  endBefore,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from './firebase';

// Enterprise Firestore features:
// - Advanced query engine with MongoDB compatibility
// - Documents up to 4 MiB (vs 1 MiB in Standard)
// - Better performance for complex queries
// - Enhanced indexing capabilities

// Helper function to convert Firestore timestamps to JavaScript dates
export const convertTimestamps = (data: any): any => {
  if (!data) return data;
  
  const converted = { ...data };
  
  // Convert Firestore timestamps to JavaScript dates
  Object.keys(converted).forEach(key => {
    if (converted[key] instanceof Timestamp) {
      converted[key] = converted[key].toDate();
    }
  });
  
  return converted;
};

// User operations
export const createUserDocument = async (userId: string, userData: any) => {
  try {
    const userDoc = {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp()
    };
    
    await setDoc(doc(db, 'users', userId), userDoc);
    return { success: true, data: userDoc };
  } catch (error) {
    console.error('Error creating user document:', error);
    throw new Error('Failed to create user document');
  }
};

export const updateUserDocument = async (userId: string, updates: any) => {
  try {
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp()
    };
    
    await setDoc(doc(db, 'users', userId), updateData, { merge: true });
    return { success: true, data: updateData };
  } catch (error) {
    console.error('Error updating user document:', error);
    throw new Error('Failed to update user document');
  }
};

export const getUserDocument = async (userId: string) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return { success: true, data: convertTimestamps(userDoc.data()) };
    }
    return { success: false, data: null };
  } catch (error) {
    console.error('Error getting user document:', error);
    throw new Error('Failed to get user document');
  }
};

// Contact operations
export const createContact = async (userId: string, contactData: any) => {
  try {
    const contact = {
      ...contactData,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'contacts'), contact);
    return { success: true, id: docRef.id, data: contact };
  } catch (error) {
    console.error('Error creating contact:', error);
    throw new Error('Failed to create contact');
  }
};

export const getUserContacts = async (userId: string) => {
  try {
    const q = query(
      collection(db, 'contacts'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const contacts = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    }));
    
    return { success: true, data: contacts };
  } catch (error) {
    console.error('Error getting user contacts:', error);
    throw new Error('Failed to get contacts');
  }
};

// Deal operations
export const createDeal = async (userId: string, dealData: any) => {
  try {
    const deal = {
      ...dealData,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'deals'), deal);
    return { success: true, id: docRef.id, data: deal };
  } catch (error) {
    console.error('Error creating deal:', error);
    throw new Error('Failed to create deal');
  }
};

export const getUserDeals = async (userId: string) => {
  try {
    const q = query(
      collection(db, 'deals'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const deals = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    }));
    
    return { success: true, data: deals };
  } catch (error) {
    console.error('Error getting user deals:', error);
    throw new Error('Failed to get deals');
  }
};

// Activity operations
export const createActivity = async (userId: string, activityData: any) => {
  try {
    const activity = {
      ...activityData,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'activities'), activity);
    return { success: true, id: docRef.id, data: activity };
  } catch (error) {
    console.error('Error creating activity:', error);
    throw new Error('Failed to create activity');
  }
};

export const getUserActivities = async (userId: string, limitCount: number = 10) => {
  try {
    const q = query(
      collection(db, 'activities'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const activities = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    }));
    
    return { success: true, data: activities };
  } catch (error) {
    console.error('Error getting user activities:', error);
    throw new Error('Failed to get activities');
  }
};

// Advanced query functions leveraging Enterprise edition capabilities

// Paginated queries with cursor-based pagination
export const getPaginatedContacts = async (
  userId: string, 
  pageSize: number = 20, 
  lastDoc?: QueryDocumentSnapshot
) => {
  try {
    let q = query(
      collection(db, 'contacts'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    );

    if (lastDoc) {
      q = query(
        collection(db, 'contacts'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(pageSize)
      );
    }
    
    const querySnapshot = await getDocs(q);
    const contacts = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    }));
    
    return { 
      success: true, 
      data: contacts,
      lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
      hasMore: querySnapshot.docs.length === pageSize
    };
  } catch (error) {
    console.error('Error getting paginated contacts:', error);
    throw new Error('Failed to get paginated contacts');
  }
};

// Complex queries with multiple filters (Enterprise edition optimized)
export const getDealsByStatusAndStage = async (
  userId: string, 
  status: string, 
  stage: string
) => {
  try {
    const q = query(
      collection(db, 'deals'),
      where('userId', '==', userId),
      where('status', '==', status),
      where('stage', '==', stage),
      orderBy('value', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const deals = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    }));
    
    return { success: true, data: deals };
  } catch (error) {
    console.error('Error getting deals by status and stage:', error);
    throw new Error('Failed to get deals by status and stage');
  }
};

// Search contacts by company (Enterprise edition supports better text search)
export const searchContactsByCompany = async (
  userId: string, 
  companyName: string
) => {
  try {
    // Note: For more advanced text search, consider using Algolia or similar
    // Enterprise edition provides better performance for these queries
    const q = query(
      collection(db, 'contacts'),
      where('userId', '==', userId),
      where('company', '>=', companyName),
      where('company', '<=', companyName + '\uf8ff'),
      orderBy('company'),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const contacts = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data())
    }));
    
    return { success: true, data: contacts };
  } catch (error) {
    console.error('Error searching contacts by company:', error);
    throw new Error('Failed to search contacts by company');
  }
};

// Bulk operations (Enterprise edition handles larger documents better)
export const createBulkContacts = async (userId: string, contacts: any[]) => {
  try {
    const results = [];
    
    // Enterprise edition can handle larger batch operations
    for (const contact of contacts) {
      const contactData = {
        ...contact,
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'contacts'), contactData);
      results.push({ id: docRef.id, ...contactData });
    }
    
    return { success: true, data: results };
  } catch (error) {
    console.error('Error creating bulk contacts:', error);
    throw new Error('Failed to create bulk contacts');
  }
};

// Analytics and reporting queries (Enterprise edition optimized)
export const getDealAnalytics = async (userId: string) => {
  try {
    const q = query(
      collection(db, 'deals'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const deals = querySnapshot.docs.map(doc => convertTimestamps(doc.data()));
    
    // Calculate analytics
    const totalValue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0);
    const statusCounts = deals.reduce((acc, deal) => {
      acc[deal.status] = (acc[deal.status] || 0) + 1;
      return acc;
    }, {});
    
    return { 
      success: true, 
      data: {
        totalDeals: deals.length,
        totalValue,
        statusCounts,
        averageValue: deals.length > 0 ? totalValue / deals.length : 0
      }
    };
  } catch (error) {
    console.error('Error getting deal analytics:', error);
    throw new Error('Failed to get deal analytics');
  }
};

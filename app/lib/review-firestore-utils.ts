import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { ReviewForm, ReviewSubmission, ReviewField, ReviewFormSettings } from './review-types';

// Helper function to convert Firestore timestamps to JavaScript dates
export const convertTimestamps = <T = Record<string, unknown>>(data: Record<string, unknown> | undefined): T => {
  if (!data) return data as T;
  
  const converted = { ...data };
  
  // Convert Firestore timestamps to JavaScript dates
  Object.keys(converted).forEach(key => {
    const value = converted[key];
    if (value instanceof Timestamp) {
      converted[key] = value.toDate().toISOString();
    }
  });
  
  return converted as T;
};

// Review Form Operations
export const createReviewForm = async (businessId: string, formData: {
  title: string;
  description: string;
  fields: Omit<ReviewField, 'id'>[];
  settings: ReviewFormSettings;
}): Promise<{ success: boolean; data?: ReviewForm; error?: string }> => {
  try {
    console.log('Creating review form for businessId:', businessId);
    console.log('Form data:', formData);
    
    const formRef = doc(collection(db, 'reviewForms'));
    const formId = formRef.id;
    
    const now = new Date().toISOString();
    const form: ReviewForm = {
      id: formId,
      businessId,
      title: formData.title,
      description: formData.description,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      fields: formData.fields.map((field, index) => ({
        ...field,
        id: `field_${Date.now()}_${index}`,
        order: index
      })),
      settings: formData.settings
    };

    console.log('Saving form to Firestore:', form);
    await setDoc(formRef, form);
    console.log('Form saved successfully');
    return { success: true, data: form };
  } catch (error) {
    console.error('Error creating review form:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorCode = error && typeof error === 'object' && 'code' in error ? String(error.code) : undefined;
    console.error('Error details:', {
      code: errorCode,
      message: errorMessage,
      businessId,
      formData
    });
    return { 
      success: false, 
      error: `Failed to create review form: ${errorMessage}` 
    };
  }
};

export const getBusinessReviewForms = async (businessId: string): Promise<{ success: boolean; data?: ReviewForm[]; error?: string }> => {
  try {
    console.log('Fetching review forms for businessId:', businessId);
    
    const formsRef = collection(db, 'reviewForms');
    
    // Try the compound query first (with index)
    try {
      const q = query(
        formsRef,
        where('businessId', '==', businessId),
        orderBy('createdAt', 'desc')
      );
      
      console.log('Executing compound Firestore query...');
      const querySnapshot = await getDocs(q);
      console.log('Query executed, found', querySnapshot.docs.length, 'forms');
      
      const forms = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Form data from Firestore:', data);
        return convertTimestamps<ReviewForm>(data);
      });

      console.log('Converted forms:', forms);
      return { success: true, data: forms };
    } catch (indexError) {
      console.log('Compound query failed, trying simple query:', indexError);
      
      // Fallback: Simple query without orderBy (no index required)
      const simpleQuery = query(
        formsRef,
        where('businessId', '==', businessId)
      );
      
      const querySnapshot = await getDocs(simpleQuery);
      console.log('Simple query executed, found', querySnapshot.docs.length, 'forms');
      
      const forms = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return convertTimestamps<ReviewForm>(data);
      });

      // Sort manually since we can't use orderBy without index
      forms.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      console.log('Converted and sorted forms:', forms);
      return { success: true, data: forms };
    }
  } catch (error) {
    console.error('Error fetching review forms:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorCode = error && typeof error === 'object' && 'code' in error ? String(error.code) : undefined;
    console.error('Error details:', {
      code: errorCode,
      message: errorMessage,
      businessId
    });
    return { 
      success: false, 
      error: `Failed to fetch review forms: ${errorMessage}` 
    };
  }
};

export const getReviewForm = async (formId: string): Promise<{ success: boolean; data?: ReviewForm; error?: string }> => {
  try {
    const formRef = doc(db, 'reviewForms', formId);
    const formSnap = await getDoc(formRef);
    
    if (!formSnap.exists()) {
      return { success: false, error: 'Review form not found' };
    }

    const formData = convertTimestamps(formSnap.data()) as ReviewForm;
    return { success: true, data: formData };
  } catch (error) {
    console.error('Error fetching review form:', error);
    return { success: false, error: 'Failed to fetch review form' };
  }
};

export const updateReviewForm = async (formId: string, updates: Partial<ReviewForm>): Promise<{ success: boolean; data?: ReviewForm; error?: string }> => {
  try {
    const formRef = doc(db, 'reviewForms', formId);
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    await updateDoc(formRef, updateData);
    
    // Fetch updated form
    const formSnap = await getDoc(formRef);
    if (!formSnap.exists()) {
      return { success: false, error: 'Review form not found after update' };
    }
    const formData = convertTimestamps<ReviewForm>(formSnap.data());
    
    return { success: true, data: formData };
  } catch (error) {
    console.error('Error updating review form:', error);
    return { success: false, error: 'Failed to update review form' };
  }
};

export const deleteReviewForm = async (formId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const formRef = doc(db, 'reviewForms', formId);
    await deleteDoc(formRef);
    
    // Also delete all submissions for this form
    const submissionsRef = collection(db, 'reviewSubmissions');
    const q = query(submissionsRef, where('formId', '==', formId));
    const querySnapshot = await getDocs(q);
    
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting review form:', error);
    return { success: false, error: 'Failed to delete review form' };
  }
};

// Review Submission Operations
interface DeviceInfo {
  platform?: string;
  browser?: string;
  os?: string;
  [key: string]: unknown;
}

export const submitReviewForm = async (formId: string, responses: { fieldId: string; value: unknown }[], userInfo?: {
  email?: string;
  name?: string;
  phone?: string;
}, deviceInfo?: DeviceInfo): Promise<{ success: boolean; data?: { submissionId: string }; error?: string }> => {
  try {
    // First, get the form to validate it exists and is active
    const formResult = await getReviewForm(formId);
    if (!formResult.success || !formResult.data) {
      return { success: false, error: 'Review form not found' };
    }

    if (!formResult.data.isActive) {
      return { success: false, error: 'Review form is not active' };
    }

    const submissionRef = doc(collection(db, 'reviewSubmissions'));
    const submissionId = submissionRef.id;
    
    const submission: ReviewSubmission = {
      id: submissionId,
      formId,
      businessId: formResult.data.businessId,
      submittedAt: new Date().toISOString(),
      userInfo: {
        ...userInfo,
        device: deviceInfo ? {
          userAgent: typeof deviceInfo.userAgent === 'string' ? deviceInfo.userAgent : 'Unknown',
          platform: typeof deviceInfo.platform === 'string' ? deviceInfo.platform : 'Unknown',
          browser: typeof deviceInfo.browser === 'string' ? deviceInfo.browser : 'Unknown',
          screenResolution: typeof deviceInfo.screenResolution === 'string' ? deviceInfo.screenResolution : 'Unknown',
          timezone: typeof deviceInfo.timezone === 'string' ? deviceInfo.timezone : 'Unknown'
        } : undefined,
        location: {
          country: 'Unknown', // In production, get from IP geolocation
          region: 'Unknown',
          city: 'Unknown'
        }
      },
      responses: responses.map(response => {
        const fieldType = formResult.data!.fields.find(f => f.id === response.fieldId)?.type || 'text';
        // Validate and convert value based on field type
        let typedValue: string | number | boolean | string[] = String(response.value);
        if (fieldType === 'rating' && typeof response.value === 'number') {
          typedValue = response.value;
        } else if (fieldType === 'checkbox' && Array.isArray(response.value)) {
          typedValue = response.value as string[];
        } else if (fieldType === 'checkbox' && typeof response.value === 'boolean') {
          typedValue = response.value;
        }
        
        return {
          fieldId: response.fieldId,
          value: typedValue,
          fieldType
        };
      }),
      isAnonymous: !userInfo?.email && !userInfo?.name
    };

    await setDoc(submissionRef, submission);
    return { success: true, data: { submissionId } };
  } catch (error) {
    console.error('Error submitting review form:', error);
    return { success: false, error: 'Failed to submit review form' };
  }
};

export const getReviewFormSubmissions = async (formId: string): Promise<{ success: boolean; data?: ReviewSubmission[]; error?: string }> => {
  try {
    const submissionsRef = collection(db, 'reviewSubmissions');
    
    // Try the compound query first (with index)
    try {
      const q = query(
        submissionsRef,
        where('formId', '==', formId),
        orderBy('submittedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const submissions = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return convertTimestamps<ReviewSubmission>(data || {});
      });

      return { success: true, data: submissions };
    } catch (indexError) {
      console.log('Compound query failed for submissions, trying simple query:', indexError);
      
      // Fallback: Simple query without orderBy (no index required)
      const simpleQuery = query(
        submissionsRef,
        where('formId', '==', formId)
      );
      
      const querySnapshot = await getDocs(simpleQuery);
      const submissions = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return convertTimestamps<ReviewSubmission>(data || {});
      });

      // Sort manually since we can't use orderBy without index
      submissions.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      
      return { success: true, data: submissions };
    }
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return { success: false, error: 'Failed to fetch submissions' };
  }
};

interface ReviewFormAnalytics {
  totalSubmissions: number;
  completionRate: number;
  averageRating: number;
  fieldAnalytics: Array<{
    fieldId: string;
    fieldLabel: string;
    fieldType: string;
    responseCount: number;
    averageValue: number | null;
    commonResponses: unknown[];
  }>;
  locationStats: Array<{ country: string; count: number }>;
  deviceStats: Array<{ platform: string; browser: string; count: number }>;
  timeStats: unknown[];
}

export const getReviewFormAnalytics = async (formId: string): Promise<{ success: boolean; data?: ReviewFormAnalytics; error?: string }> => {
  try {
    const formResult = await getReviewForm(formId);
    if (!formResult.success || !formResult.data) {
      return { success: false, error: 'Review form not found' };
    }

    const submissionsResult = await getReviewFormSubmissions(formId);
    if (!submissionsResult.success) {
      return { success: false, error: 'Failed to fetch submissions' };
    }

    const submissions = submissionsResult.data || [];
    const form = formResult.data;

    // Calculate analytics
    const totalSubmissions = submissions.length;
    const completionRate = 100.0; // All submitted forms are considered complete

    // Calculate average rating
    let averageRating = 0.0;
    const ratingResponses: number[] = [];
    submissions.forEach(submission => {
      submission.responses.forEach(response => {
        if (response.fieldType === 'rating' && typeof response.value === 'number') {
          ratingResponses.push(response.value);
        }
      });
    });

    if (ratingResponses.length > 0) {
      averageRating = ratingResponses.reduce((sum, rating) => sum + rating, 0) / ratingResponses.length;
    }

    // Field analytics
    const fieldAnalytics = form.fields.map(field => {
      const fieldResponses: unknown[] = [];
      submissions.forEach(submission => {
        const response = submission.responses.find(r => r.fieldId === field.id);
        if (response) {
          fieldResponses.push(response.value);
        }
      });

      // Calculate average for rating fields
      let averageValue: number | null = null;
      if (field.type === 'rating' && fieldResponses.length > 0) {
        const numericResponses = fieldResponses.filter((val): val is number => typeof val === 'number');
        if (numericResponses.length > 0) {
          averageValue = numericResponses.reduce((sum, val) => sum + val, 0) / numericResponses.length;
        }
      }

      return {
        fieldId: field.id,
        fieldLabel: field.label,
        fieldType: field.type,
        responseCount: fieldResponses.length,
        averageValue,
        commonResponses: []
      };
    });

    // Location stats
    const locationStats: { country: string; count: number }[] = [];
    const countryCounts: { [key: string]: number } = {};
    submissions.forEach(submission => {
      const country = submission.userInfo.location?.country || 'Unknown';
      countryCounts[country] = (countryCounts[country] || 0) + 1;
    });

    Object.entries(countryCounts).forEach(([country, count]) => {
      locationStats.push({ country, count });
    });

    // Device stats
    const deviceStats: { platform: string; browser: string; count: number }[] = [];
    const deviceCounts: { [key: string]: number } = {};
    submissions.forEach(submission => {
      const platform = submission.userInfo.device?.platform || 'Unknown';
      const browser = submission.userInfo.device?.browser || 'Unknown';
      const key = `${platform} - ${browser}`;
      deviceCounts[key] = (deviceCounts[key] || 0) + 1;
    });

    Object.entries(deviceCounts).forEach(([key, count]) => {
      const [platform, browser] = key.split(' - ');
      deviceStats.push({ platform, browser, count });
    });

    const analytics = {
      totalSubmissions,
      completionRate,
      averageRating,
      fieldAnalytics,
      locationStats,
      deviceStats,
      timeStats: []
    };

    return { success: true, data: analytics };
  } catch (error) {
    console.error('Error calculating analytics:', error);
    return { success: false, error: 'Failed to calculate analytics' };
  }
};

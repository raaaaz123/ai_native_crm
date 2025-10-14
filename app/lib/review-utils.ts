import { ReviewForm, ReviewSubmission, ReviewAnalytics, ReviewField } from './review-types';
import {
  createReviewForm as createReviewFormFirestore,
  getBusinessReviewForms as getBusinessReviewFormsFirestore,
  getReviewForm as getReviewFormFirestore,
  submitReviewForm as submitReviewFormFirestore,
  getReviewFormSubmissions as getReviewFormSubmissionsFirestore,
  getReviewFormAnalytics as getReviewFormAnalyticsFirestore,
  updateReviewForm as updateReviewFormFirestore,
  deleteReviewForm as deleteReviewFormFirestore
} from './review-firestore-utils';

export interface CreateReviewFormData {
  title: string;
  description: string;
  fields: Omit<ReviewField, 'id'>[];
  settings: {
    allowAnonymous: boolean;
    requireEmail: boolean;
    showProgress: boolean;
    redirectUrl?: string;
    thankYouMessage: string;
    collectLocation: boolean;
    collectDeviceInfo: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function createReviewForm(
  businessId: string,
  formData: CreateReviewFormData
): Promise<ApiResponse<ReviewForm>> {
  return await createReviewFormFirestore(businessId, formData);
}

export async function getBusinessReviewForms(
  businessId: string
): Promise<ApiResponse<ReviewForm[]>> {
  return await getBusinessReviewFormsFirestore(businessId);
}

export async function getReviewForm(
  formId: string
): Promise<ApiResponse<ReviewForm>> {
  return await getReviewFormFirestore(formId);
}

export async function submitReviewForm(
  formId: string,
  responses: { fieldId: string; value: string | number | boolean | string[] }[],
  userInfo?: {
    email?: string;
    name?: string;
    phone?: string;
  }
): Promise<ApiResponse<{ submissionId: string }>> {
  const deviceInfo = {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
  
  return await submitReviewFormFirestore(formId, responses, userInfo, deviceInfo);
}

export async function getReviewFormSubmissions(
  formId: string
): Promise<ApiResponse<ReviewSubmission[]>> {
  return await getReviewFormSubmissionsFirestore(formId);
}

export async function getReviewFormAnalytics(
  formId: string
): Promise<ApiResponse<ReviewAnalytics>> {
  return await getReviewFormAnalyticsFirestore(formId) as ApiResponse<ReviewAnalytics>;
}

export async function updateReviewForm(
  formId: string,
  updates: Partial<ReviewForm>
): Promise<ApiResponse<ReviewForm>> {
  return await updateReviewFormFirestore(formId, updates);
}

export async function deleteReviewForm(
  formId: string
): Promise<ApiResponse<void>> {
  return await deleteReviewFormFirestore(formId);
}

export interface ReviewForm {
  id: string;
  businessId: string;
  title: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  fields: ReviewField[];
  settings: ReviewFormSettings;
}

export interface ReviewField {
  id: string;
  type: 'text' | 'textarea' | 'rating' | 'select' | 'checkbox' | 'email' | 'phone' | 'date';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // For select and checkbox fields
  minRating?: number;
  maxRating?: number;
  ratingType?: 'stars' | 'hearts' | 'thumbs';
  order: number;
}

export interface ReviewFormSettings {
  allowAnonymous: boolean;
  requireEmail: boolean;
  showProgress: boolean;
  redirectUrl?: string;
  thankYouMessage: string;
  collectLocation: boolean;
  collectDeviceInfo: boolean;
}

export interface ReviewSubmission {
  id: string;
  formId: string;
  businessId: string;
  submittedAt: string;
  userInfo: {
    email?: string;
    name?: string;
    phone?: string;
    location?: {
      country?: string;
      region?: string;
      city?: string;
      coordinates?: { lat: number; lng: number };
    };
    device?: {
      userAgent: string;
      platform: string;
      browser: string;
      screenResolution: string;
      timezone: string;
    };
  };
  responses: ReviewResponse[];
  isAnonymous: boolean;
}

export interface ReviewResponse {
  fieldId: string;
  value: string | number | boolean | string[];
  fieldType: string;
}

export interface ReviewAnalytics {
  totalSubmissions: number;
  completionRate: number;
  averageRating?: number;
  fieldAnalytics: FieldAnalytics[];
  locationStats: LocationStats[];
  deviceStats: DeviceStats[];
  timeStats: TimeStats[];
}

export interface FieldAnalytics {
  fieldId: string;
  fieldLabel: string;
  fieldType: string;
  responseCount: number;
  averageValue?: number;
  commonResponses: { value: string; count: number }[];
}

export interface LocationStats {
  country: string;
  region?: string;
  city?: string;
  count: number;
}

export interface DeviceStats {
  platform: string;
  browser: string;
  count: number;
}

export interface TimeStats {
  date: string;
  submissions: number;
}

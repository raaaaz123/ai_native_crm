"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Star, 
  Heart, 
  ThumbsUp, 
  CheckCircle,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { ReviewForm, ReviewField } from '@/app/lib/review-types';
import { getReviewForm, submitReviewForm } from '@/app/lib/review-utils';

export default function ReviewFormPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params.formId as string;
  
  const [form, setForm] = useState<ReviewForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    if (formId) {
      loadForm();
    }
  }, [formId]);

  const loadForm = async () => {
    try {
      const result = await getReviewForm(formId);
      if (result.success && result.data) {
        setForm(result.data);
      } else {
        console.error('Failed to load form:', result.error);
        // Handle error - maybe redirect to 404
      }
    } catch (error) {
      console.error('Error loading form:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResponseChange = (fieldId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleUserInfoChange = (field: string, value: string) => {
    setUserInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!form) return false;

    // Check required fields
    for (const field of form.fields) {
      if (field.required && (!responses[field.id] || responses[field.id] === '')) {
        alert(`Please fill in the required field: ${field.label}`);
        return false;
      }
    }

    // Check if email is required
    if (form.settings.requireEmail && !userInfo.email.trim()) {
      alert('Email is required for this form');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!form || !validateForm()) return;

    setSubmitting(true);
    try {
      const responseData = Object.entries(responses).map(([fieldId, value]) => ({
        fieldId,
        value
      }));

      const result = await submitReviewForm(formId, responseData, userInfo);
      
      if (result.success) {
        setSubmitted(true);
        
        // Redirect if URL is provided
        if (form.settings.redirectUrl) {
          setTimeout(() => {
            window.location.href = form.settings.redirectUrl!;
          }, 2000);
        }
      } else {
        alert('Failed to submit review: ' + result.error);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('An error occurred while submitting your review');
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field: ReviewField) => {
    const value = responses[field.id] || '';

    switch (field.type) {
      case 'text':
        return (
          <div key={field.id} className="space-y-3">
            <Label htmlFor={field.id} className="text-neutral-800 font-semibold text-lg">
              {field.label}
              {field.required && <span className="text-primary-600 ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              value={value}
              onChange={(e) => handleResponseChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              className="border-neutral-300 focus:border-primary-500 focus:ring-primary-500 text-lg py-3"
            />
          </div>
        );

      case 'textarea':
        return (
          <div key={field.id} className="space-y-3">
            <Label htmlFor={field.id} className="text-neutral-800 font-semibold text-lg">
              {field.label}
              {field.required && <span className="text-primary-600 ml-1">*</span>}
            </Label>
            <Textarea
              id={field.id}
              value={value}
              onChange={(e) => handleResponseChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              rows={4}
              required={field.required}
              className="border-neutral-300 focus:border-primary-500 focus:ring-primary-500 text-lg py-3 resize-none"
            />
          </div>
        );

      case 'email':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              type="email"
              value={value}
              onChange={(e) => handleResponseChange(field.id, e.target.value)}
              placeholder={field.placeholder || 'your@email.com'}
              required={field.required}
            />
          </div>
        );

      case 'phone':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              type="tel"
              value={value}
              onChange={(e) => handleResponseChange(field.id, e.target.value)}
              placeholder={field.placeholder || '+1 (555) 123-4567'}
              required={field.required}
            />
          </div>
        );

      case 'date':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              type="date"
              value={value}
              onChange={(e) => handleResponseChange(field.id, e.target.value)}
              required={field.required}
            />
          </div>
        );

      case 'rating':
        const minRating = field.minRating || 1;
        const maxRating = field.maxRating || 5;
        const ratingValue = value || 0;
        
        return (
          <div key={field.id} className="space-y-4">
            <Label className="text-neutral-800 font-semibold text-lg">
              {field.label}
              {field.required && <span className="text-primary-600 ml-1">*</span>}
            </Label>
            <div className="flex items-center justify-center space-x-3 py-4">
              {Array.from({ length: maxRating - minRating + 1 }, (_, i) => {
                const rating = minRating + i;
                const isActive = rating <= ratingValue;
                
                return (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => handleResponseChange(field.id, rating)}
                    className={`p-3 transition-all duration-200 transform hover:scale-110 ${
                      isActive ? 'text-primary-500' : 'text-neutral-300'
                    } hover:text-primary-400`}
                  >
                    {field.ratingType === 'hearts' ? (
                      <Heart className={`w-8 h-8 ${isActive ? 'fill-current' : ''}`} />
                    ) : field.ratingType === 'thumbs' ? (
                      <ThumbsUp className={`w-8 h-8 ${isActive ? 'fill-current' : ''}`} />
                    ) : (
                      <Star className={`w-8 h-8 ${isActive ? 'fill-current' : ''}`} />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="text-center">
              <span className="text-lg font-medium text-neutral-600">
                {ratingValue > 0 ? `${ratingValue} out of ${maxRating}` : 'Please select a rating'}
              </span>
            </div>
          </div>
        );

      case 'select':
        return (
          <div key={field.id} className="space-y-3">
            <Label htmlFor={field.id} className="text-neutral-800 font-semibold text-lg">
              {field.label}
              {field.required && <span className="text-primary-600 ml-1">*</span>}
            </Label>
            <select
              id={field.id}
              value={value}
              onChange={(e) => handleResponseChange(field.id, e.target.value)}
              required={field.required}
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg bg-white shadow-sm"
            >
              <option value="">Select an option</option>
              {field.options?.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        );

      case 'checkbox':
        const checkboxValues = value || [];
        return (
          <div key={field.id} className="space-y-4">
            <Label className="text-neutral-800 font-semibold text-lg">
              {field.label}
              {field.required && <span className="text-primary-600 ml-1">*</span>}
            </Label>
            <div className="space-y-3">
              {field.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-3 p-4 bg-white rounded-lg border border-neutral-200 hover:border-primary-300 transition-colors">
                  <Checkbox
                    id={`${field.id}-${index}`}
                    checked={checkboxValues.includes(option)}
                    onCheckedChange={(checked) => {
                      const newValues = checked
                        ? [...checkboxValues, option]
                        : checkboxValues.filter((v: string) => v !== option);
                      handleResponseChange(field.id, newValues);
                    }}
                    className="w-5 h-5"
                  />
                  <Label htmlFor={`${field.id}-${index}`} className="text-lg text-neutral-700 cursor-pointer flex-1">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-background to-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-16 w-16 text-primary-600 mx-auto mb-6" />
          <p className="text-neutral-600 text-lg font-medium">Loading review form...</p>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-background to-neutral-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-neutral-200/50">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">⚠️</span>
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-4">Form Not Found</h1>
          <p className="text-neutral-600 text-lg leading-relaxed mb-6">The review form you're looking for doesn't exist or has been removed.</p>
          <Button 
            onClick={() => router.push('/')}
            className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold px-6 py-3"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-background to-neutral-100 flex items-center justify-center">
        <div className="text-center max-w-lg mx-auto p-8 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-neutral-200/50">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <CheckCircle className="w-10 h-10 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-4">Thank You!</h1>
          <p className="text-neutral-600 text-lg leading-relaxed mb-6">{form.settings.thankYouMessage}</p>
          {form.settings.redirectUrl && (
            <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
              <p className="text-primary-800 font-medium">Redirecting you shortly...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const sortedFields = form.fields.sort((a, b) => a.order - b.order);
  const progress = form.settings.showProgress 
    ? ((currentStep + 1) / sortedFields.length) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-background to-neutral-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Progress Bar */}
        {form.settings.showProgress && (
          <div className="mb-8">
            <div className="flex items-center justify-between text-sm text-neutral-600 mb-3">
              <span className="font-medium">Progress</span>
              <span className="font-semibold">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-3 shadow-inner">
              <div 
                className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-500 ease-out shadow-sm"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <Card className="bg-white/95 backdrop-blur-sm border border-neutral-200/50 shadow-xl">
          <CardHeader className="text-center bg-gradient-to-r from-primary-50 to-neutral-50 border-b border-neutral-200/50">
            <CardTitle className="text-3xl font-bold text-neutral-900 mb-2">
              {form.title}
            </CardTitle>
            {form.description && (
              <p className="text-neutral-600 text-lg leading-relaxed">{form.description}</p>
            )}
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* User Info Section */}
            {(form.settings.requireEmail || !form.settings.allowAnonymous) && (
              <div className="border-t border-neutral-200 pt-8">
                <div className="bg-neutral-50 rounded-lg p-6 mb-6">
                  <h3 className="text-xl font-semibold text-neutral-900 mb-2 flex items-center gap-2">
                    <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 text-sm font-bold">i</span>
                    </div>
                    Your Information
                  </h3>
                  <p className="text-neutral-600 text-sm">Please provide your contact details</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="name" className="text-neutral-700 font-medium">Name</Label>
                    <Input
                      id="name"
                      value={userInfo.name}
                      onChange={(e) => handleUserInfoChange('name', e.target.value)}
                      placeholder="Your name"
                      className="mt-2 border-neutral-300 focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-neutral-700 font-medium">
                      Email {form.settings.requireEmail && <span className="text-primary-600">*</span>}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={userInfo.email}
                      onChange={(e) => handleUserInfoChange('email', e.target.value)}
                      placeholder="your@email.com"
                      required={form.settings.requireEmail}
                      className="mt-2 border-neutral-300 focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="phone" className="text-neutral-700 font-medium">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={userInfo.phone}
                      onChange={(e) => handleUserInfoChange('phone', e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className="mt-2 border-neutral-300 focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-8">
              {sortedFields.map((field, index) => (
                <div key={field.id} className="bg-neutral-50/50 rounded-lg p-6 border border-neutral-200/50">
                  {renderField(field)}
                </div>
              ))}
            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-8 border-t border-neutral-200">
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                size="lg"
                className="px-12 py-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <span>Submit Review</span>
                    <div className="ml-2 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/workspace-auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/layout';
import { 
  createReviewForm,
  CreateReviewFormData
} from '../../../lib/review-utils';
import { ReviewField, ReviewFormSettings } from '../../../lib/review-types';
import ReviewFormBuilder from '../../../components/review/ReviewFormBuilder';
import { 
  ArrowLeft,
  Save,
  Eye,
  Loader2
} from 'lucide-react';

export default function CreateReviewFormPage() {
  const { user, loading, workspaceContext } = useAuth();
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  const handleCreateForm = async (formData: {
    title: string;
    description: string;
    fields: ReviewField[];
    settings: ReviewFormSettings;
  }) => {
    if (!user?.uid || !workspaceContext?.currentWorkspace?.id || creating) {
      console.log('Missing required data for form creation:', { 
        userId: !!user?.uid, 
        workspaceId: !!workspaceContext?.currentWorkspace?.id 
      });
      alert('Unable to create form. Please ensure you have proper workspace access.');
      return;
    }
    
    setCreating(true);
    try {
      console.log('Creating review form with data:', formData);
      console.log('Using workspace ID:', workspaceContext.currentWorkspace.id);
      
      // Convert fields to Omit<ReviewField, 'id'>[] format
      const createFormData: CreateReviewFormData = {
        title: formData.title,
        description: formData.description,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        fields: formData.fields.map(({ id: _id, ...field }) => field) as Omit<ReviewField, 'id'>[],
        settings: formData.settings
      };
      
      const result = await createReviewForm(workspaceContext.currentWorkspace.id, createFormData);
      console.log('Review form creation result:', result);
      
      if (result.success) {
        console.log('Review form created successfully:', result.data);
        // Redirect to the forms list page
        router.push('/dashboard/review-forms');
      } else {
        console.error('Failed to create review form:', result.error);
        alert('Failed to create review form: ' + result.error);
      }
    } catch (error) {
      console.error('Error creating review form:', error);
      alert('An error occurred while creating the form. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/review-forms');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-background to-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-16 w-16 text-primary-600 mx-auto mb-6" />
          <p className="text-neutral-600 text-lg font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-background to-neutral-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-neutral-200/50">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">🔒</span>
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-4">Access Denied</h1>
          <p className="text-neutral-600 text-lg leading-relaxed mb-6">Please sign in to create review forms.</p>
          <Button 
            onClick={() => router.push('/signin')}
            className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold px-6 py-3"
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-background to-neutral-100">
      <Container>
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-8">
            <Button 
              variant="ghost" 
              onClick={() => router.push('/dashboard/review-forms')}
              className="flex items-center gap-2 text-neutral-600 hover:text-primary-600 hover:bg-primary-50"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Review Forms
            </Button>
          </div>
          
          <div className="text-center">
            <div className="inline-flex items-center gap-3 bg-primary-100 text-primary-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
              Create New Form
            </div>
            <h1 className="text-5xl font-bold text-neutral-900 mb-6">
              Create Review Form
            </h1>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed">
              Build custom feedback forms to collect customer reviews, ratings, and insights. 
              Create forms that match your brand and gather valuable customer feedback.
            </p>
          </div>
        </div>

        {/* Form Builder */}
        <div className="max-w-6xl mx-auto">
          <Card className="bg-white/95 backdrop-blur-sm border border-neutral-200/50 shadow-2xl">
            <CardHeader className="text-center bg-gradient-to-r from-primary-50 to-neutral-50 border-b border-neutral-200/50">
              <CardTitle className="text-3xl font-bold text-neutral-900 mb-2">
                Form Builder
              </CardTitle>
              <p className="text-neutral-600 text-lg">
                Design your review form with our intuitive drag-and-drop builder
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <ReviewFormBuilder
                onSave={handleCreateForm}
                onCancel={handleCancel}
                loading={creating}
              />
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="mt-20 max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-neutral-900 mb-6">
              Powerful Form Features
            </h2>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              Everything you need to create effective review forms
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-white/95 backdrop-blur-sm border border-neutral-200/50 hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Save className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-4">
                  Multiple Field Types
                </h3>
                <p className="text-neutral-600 leading-relaxed">
                  Text, ratings, dropdowns, checkboxes, and more to capture comprehensive feedback
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/95 backdrop-blur-sm border border-neutral-200/50 hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Eye className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-4">
                  Real-time Analytics
                </h3>
                <p className="text-neutral-600 leading-relaxed">
                  Track submissions, completion rates, and analyze customer feedback patterns
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/95 backdrop-blur-sm border border-neutral-200/50 hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <ArrowLeft className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-4">
                  Easy Sharing
                </h3>
                <p className="text-neutral-600 leading-relaxed">
                  Share forms via direct links or embed widgets on your website
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-20 text-center">
          <Card className="bg-gradient-to-r from-primary-500 to-primary-600 text-white border-0 max-w-5xl mx-auto shadow-2xl">
            <CardContent className="p-12">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-8">
                <span className="text-3xl">🚀</span>
              </div>
              <h3 className="text-3xl font-bold mb-6">
                Ready to Collect Customer Feedback?
              </h3>
              <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto leading-relaxed">
                Start building your first review form and begin gathering valuable customer insights today.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Button 
                  variant="secondary" 
                  size="lg"
                  onClick={() => router.push('/dashboard/review-forms')}
                  className="bg-white text-primary-600 hover:bg-neutral-50 font-semibold px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  View All Forms
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => window.open('/docs', '_blank')}
                  className="border-white text-white hover:bg-white hover:text-primary-600 font-semibold px-8 py-4 text-lg transition-all duration-300"
                >
                  Learn More
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Container>
    </div>
  );
}

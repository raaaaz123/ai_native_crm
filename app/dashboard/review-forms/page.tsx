"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/layout';
import { 
  getBusinessReviewForms
} from '../../lib/review-utils';
import { ReviewForm } from '../../lib/review-types';
import ReviewFormsList from '../../components/review/ReviewFormsList';
import { 
  Plus,
  Star
} from 'lucide-react';

export default function ReviewFormsPage() {
  const { user, loading, companyContext } = useAuth();
  const router = useRouter();
  
  // Review Forms State
  const [reviewForms, setReviewForms] = useState<ReviewForm[]>([]);
  const [loadingReviewForms, setLoadingReviewForms] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin');
    }
  }, [user, loading, router]);

  const loadReviewForms = async () => {
    if (!user?.uid || !companyContext?.company?.id) {
      console.log('Missing required data for review forms loading:', { 
        userId: !!user?.uid, 
        companyId: !!companyContext?.company?.id 
      });
      setLoadingReviewForms(false);
      return;
    }
    
    setLoadingReviewForms(true);
    try {
      console.log('Loading review forms for company:', companyContext.company.id);
      const result = await getBusinessReviewForms(companyContext.company.id);
      console.log('Review forms result:', result);
      
      if (result.success && result.data) {
        setReviewForms(result.data);
      } else {
        console.error('Failed to load review forms:', result.error);
        setReviewForms([]);
      }
    } catch (error) {
      console.error('Error loading review forms:', error);
      setReviewForms([]);
    } finally {
      setLoadingReviewForms(false);
    }
  };

  useEffect(() => {
    if (user?.uid && companyContext?.company?.id) {
      loadReviewForms();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, companyContext?.company?.id]);


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Container>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">Review Forms</h1>
        <p className="text-neutral-600">Create and manage customer feedback forms to collect reviews and ratings</p>
      </div>

      {/* Review Forms Section */}
      <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Star className="w-6 h-6 text-primary-500" />
              <CardTitle>Review Forms</CardTitle>
              <span className="text-sm text-neutral-500">({reviewForms.length} forms)</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline"
                size="sm"
                onClick={loadReviewForms}
                className="flex items-center space-x-1"
              >
                <span>Refresh</span>
              </Button>
              <Button 
                className="flex items-center space-x-2"
                onClick={() => router.push('/dashboard/review-forms/create')}
              >
                <Plus className="w-4 h-4" />
                <span>Create Review Form</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ReviewFormsList
            forms={reviewForms}
            loading={loadingReviewForms}
            onCreateNew={() => router.push('/dashboard/review-forms/create')}
            onEdit={(form) => {
              // TODO: Implement edit functionality
              console.log('Edit form:', form);
            }}
            onDelete={(formId) => {
              // TODO: Implement delete functionality
              console.log('Delete form:', formId);
            }}
            onViewAnalytics={(formId) => {
              router.push(`/dashboard/review/${formId}/analytics`);
            }}
            onViewSubmissions={(formId) => {
              router.push(`/dashboard/review/${formId}/submissions`);
            }}
          />
        </CardContent>
      </Card>
    </Container>
  );
}

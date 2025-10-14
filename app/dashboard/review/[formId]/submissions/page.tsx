"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../lib/auth-context';
import { Container } from '@/components/layout';
import ReviewSubmissions from '@/app/components/review/ReviewSubmissions';
import { getReviewForm, getReviewFormSubmissions } from '../../../../lib/review-utils';
import { ReviewForm, ReviewSubmission } from '../../../../lib/review-types';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ReviewSubmissionsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading, companyContext } = useAuth();
  const formId = params.formId as string;
  
  const [form, setForm] = useState<ReviewForm | null>(null);
  const [submissions, setSubmissions] = useState<ReviewSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin');
      return;
    }

    if (user && formId && companyContext?.company?.id) {
      loadData();
    }
  }, [user, authLoading, formId, router, companyContext?.company?.id]);

  const loadData = async () => {
    if (!formId || !companyContext?.company?.id) {
      console.log('Missing required data for submissions loading:', { 
        formId: !!formId, 
        companyId: !!companyContext?.company?.id 
      });
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      // Load form details
      const formResult = await getReviewForm(formId);
      if (formResult.success && formResult.data) {
        // Validate that the form belongs to the current company
        if (formResult.data.businessId !== companyContext.company.id) {
          console.error('Form does not belong to current company');
          setForm(null);
          setLoading(false);
          return;
        }
        setForm(formResult.data);
      } else {
        console.error('Failed to load form:', formResult.error);
        setForm(null);
        setLoading(false);
        return;
      }

      // Load submissions
      const submissionsResult = await getReviewFormSubmissions(formId);
      if (submissionsResult.success) {
        setSubmissions(submissionsResult.data || []);
      } else {
        console.error('Failed to load submissions:', submissionsResult.error);
        setSubmissions([]);
      }
    } catch (error) {
      console.error('Error loading submissions data:', error);
      setForm(null);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadData();
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-primary-600 mx-auto mb-4" />
          <p className="text-neutral-600">Loading submissions...</p>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Form Not Found</h1>
          <p className="text-neutral-600 mb-4">The review form you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Container>
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">Form Submissions</h1>
        <p className="text-neutral-600">{form.title}</p>
      </div>

      <ReviewSubmissions
        form={form}
        submissions={submissions}
        loading={loading}
        onRefresh={handleRefresh}
      />
    </Container>
  );
}

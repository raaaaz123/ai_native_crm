"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/layout';
import { Input } from '@/components/ui/input';
import { Shield, ArrowLeft } from 'lucide-react';

export default function CompanyCreationPage() {
  const router = useRouter();
  const { createCompany } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    domain: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Company name is required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      await createCompany(
        formData.name.trim(),
        formData.description.trim() || undefined,
        formData.domain.trim() || undefined
      );

      setSuccess('Company created successfully! Redirecting to dashboard...');
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error creating company:', error);
      setError((error as Error).message || 'Failed to create company');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <div className="mb-8">
        <Button 
          variant="outline" 
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">Create Company</h1>
        <p className="text-neutral-600">Set up your company to start collaborating with your team</p>
      </div>

      <div className="max-w-2xl">
        <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-primary-500" />
              <span>Company Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-6 p-4 bg-status-error-50 border border-status-error-200 rounded-lg">
                <p className="text-status-error-700 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-semantic-success-50 border border-semantic-success-200 rounded-lg">
                <p className="text-semantic-success-700 text-sm">{success}</p>
              </div>
            )}

            <form onSubmit={handleCreateCompany} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-2">
                  Company Name *
                </label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Acme Inc."
                  disabled={loading}
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-neutral-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                  placeholder="Brief description of your company..."
                  rows={3}
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="domain" className="block text-sm font-medium text-neutral-700 mb-2">
                  Company Domain
                </label>
                <Input
                  id="domain"
                  type="text"
                  value={formData.domain}
                  onChange={(e) => handleInputChange('domain', e.target.value)}
                  placeholder="acme.com"
                  disabled={loading}
                />
                <p className="text-xs text-neutral-500 mt-1">Optional: Your company&apos;s website domain</p>
              </div>

              <div className="flex space-x-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Creating...' : 'Create Company'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}

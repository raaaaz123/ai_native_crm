"use client";

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Download, 
  MapPin, 
  Monitor, 
  Mail, 
  Phone,
  ChevronDown,
  ChevronUp,
  MessageSquare
} from 'lucide-react';
import { ReviewSubmission, ReviewForm } from '@/app/lib/review-types';

interface ReviewSubmissionsProps {
  form: ReviewForm;
  submissions: ReviewSubmission[];
  loading: boolean;
  onRefresh: () => void;
}

export default function ReviewSubmissions({
  form,
  submissions,
  loading,
  onRefresh
}: ReviewSubmissionsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = searchTerm === '' || 
      submission.userInfo.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.userInfo.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterBy === 'all' || 
      (filterBy === 'anonymous' && submission.isAnonymous) ||
      (filterBy === 'with-contact' && !submission.isAnonymous);

    return matchesSearch && matchesFilter;
  });

  const sortedSubmissions = filteredSubmissions.sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      case 'oldest':
        return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
      case 'name':
        return (a.userInfo.name || '').localeCompare(b.userInfo.name || '');
      default:
        return 0;
    }
  });

  const exportData = () => {
    const csvData = sortedSubmissions.map(submission => {
      const row: Record<string, string | number> = {
        'Submission ID': submission.id,
        'Submitted At': new Date(submission.submittedAt).toLocaleString(),
        'Email': submission.userInfo.email || '',
        'Name': submission.userInfo.name || '',
        'Phone': submission.userInfo.phone || '',
        'Country': submission.userInfo.location?.country || '',
        'Region': submission.userInfo.location?.region || '',
        'City': submission.userInfo.location?.city || '',
        'Device': submission.userInfo.device?.platform || '',
        'Browser': submission.userInfo.device?.browser || '',
        'Screen Resolution': submission.userInfo.device?.screenResolution || '',
        'Timezone': submission.userInfo.device?.timezone || '',
        'Anonymous': submission.isAnonymous ? 'Yes' : 'No'
      };

      // Add response data
      submission.responses.forEach(response => {
        const field = form.fields.find(f => f.id === response.fieldId);
        const fieldLabel = field?.label || `Field ${response.fieldId}`;
        row[fieldLabel] = Array.isArray(response.value) 
          ? response.value.join(', ') 
          : (typeof response.value === 'boolean' ? String(response.value) : response.value);
      });

      return row;
    });

    if (csvData.length === 0) return;

    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `review-form-${form.id}-submissions.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getFieldResponse = (submission: ReviewSubmission, fieldId: string) => {
    const response = submission.responses.find(r => r.fieldId === fieldId);
    return response?.value || 'No response';
  };

  const formatResponseValue = (value: string | number | boolean | string[], fieldType: string) => {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (fieldType === 'rating' && typeof value === 'number') {
      return `${value}/5 ⭐`;
    }
    return String(value);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
        <p className="text-neutral-600 mt-2">Loading submissions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Form Submissions</h2>
          <p className="text-neutral-600">{form.title} - {submissions.length} total submissions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onRefresh} disabled={loading}>
            Refresh
          </Button>
          <Button onClick={exportData} disabled={submissions.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
                <Input
                  placeholder="Search submissions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Submissions</option>
              <option value="with-contact">With Contact Info</option>
              <option value="anonymous">Anonymous</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">By Name</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Submissions List */}
      {sortedSubmissions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-700 mb-2">No Submissions Found</h3>
            <p className="text-neutral-500">
              {searchTerm || filterBy !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'No submissions have been received for this form yet'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedSubmissions.map((submission) => (
            <Card key={submission.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-neutral-900">
                        {submission.userInfo.name || submission.userInfo.email || 'Anonymous User'}
                      </h4>
                      {submission.isAnonymous && (
                        <Badge variant="secondary">Anonymous</Badge>
                      )}
                      <Badge variant="outline">
                        {new Date(submission.submittedAt).toLocaleDateString()}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-neutral-500 mb-3">
                      {submission.userInfo.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          <span>{submission.userInfo.email}</span>
                        </div>
                      )}
                      {submission.userInfo.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          <span>{submission.userInfo.phone}</span>
                        </div>
                      )}
                      {submission.userInfo.location?.country && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{submission.userInfo.location.country}</span>
                          {submission.userInfo.location.city && (
                            <span>, {submission.userInfo.location.city}</span>
                          )}
                        </div>
                      )}
                      {submission.userInfo.device?.platform && (
                        <div className="flex items-center gap-1">
                          <Monitor className="w-4 h-4" />
                          <span>{submission.userInfo.device.platform}</span>
                          {submission.userInfo.device.browser && (
                            <span> • {submission.userInfo.device.browser}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedSubmission(
                      expandedSubmission === submission.id ? null : submission.id
                    )}
                  >
                    {expandedSubmission === submission.id ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {/* Quick Preview of Key Responses */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                  {form.fields.slice(0, 3).map((field) => {
                    const response = getFieldResponse(submission, field.id);
                    return (
                      <div key={field.id} className="bg-neutral-50 rounded-lg p-3">
                        <div className="text-sm font-medium text-neutral-700 mb-1">
                          {field.label}
                        </div>
                        <div className="text-sm text-neutral-600">
                          {formatResponseValue(response, field.type)}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Expanded View */}
                {expandedSubmission === submission.id && (
                  <div className="border-t pt-4 mt-4">
                    <h5 className="font-medium text-neutral-900 mb-3">All Responses</h5>
                    <div className="space-y-3">
                      {form.fields.map((field) => {
                        const response = getFieldResponse(submission, field.id);
                        return (
                          <div key={field.id} className="flex items-start gap-4">
                            <div className="w-1/3">
                              <div className="font-medium text-neutral-700">{field.label}</div>
                              <div className="text-sm text-neutral-500 capitalize">{field.type}</div>
                            </div>
                            <div className="flex-1">
                              <div className="text-neutral-900">
                                {formatResponseValue(response, field.type)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  Users, 
  MessageSquare, 
  MapPin, 
  Monitor, 
  TrendingUp,
  Star,
  Download,
  RefreshCw
} from 'lucide-react';
import { ReviewAnalytics as ReviewAnalyticsType, ReviewSubmission } from '@/app/lib/review-types';

interface ReviewAnalyticsProps {
  formId: string;
  submissions: ReviewSubmission[];
  analytics: ReviewAnalyticsType | null;
  loading: boolean;
  onRefresh: () => void;
}

export default function ReviewAnalytics({
  formId,
  submissions,
  analytics,
  loading,
  onRefresh
}: ReviewAnalyticsProps) {
  const exportData = () => {
    const csvData = submissions.map(submission => {
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
        'Anonymous': submission.isAnonymous ? 'Yes' : 'No'
      };

      // Add response data
      submission.responses.forEach(response => {
        row[`Response ${response.fieldId}`] = Array.isArray(response.value) 
          ? response.value.join(', ') 
          : (typeof response.value === 'boolean' ? String(response.value) : response.value);
      });

      return row;
    });

    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `review-form-${formId}-submissions.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getAverageRating = () => {
    if (!analytics?.fieldAnalytics) return 0;
    
    const ratingField = analytics.fieldAnalytics.find(field => field.fieldType === 'rating');
    return ratingField?.averageValue || 0;
  };

  const getTopCountries = () => {
    if (!analytics?.locationStats) return [];
    return analytics.locationStats.slice(0, 5);
  };

  const getTopDevices = () => {
    if (!analytics?.deviceStats) return [];
    return analytics.deviceStats.slice(0, 5);
  };

  const getRecentSubmissions = () => {
    return submissions
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, 10);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
        <p className="text-neutral-600 mt-2">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Analytics Dashboard</h2>
          <p className="text-neutral-600">Insights and statistics for your review form</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onRefresh} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportData} disabled={submissions.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Total Submissions</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {analytics?.totalSubmissions || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Completion Rate</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {analytics?.completionRate ? `${Math.round(analytics.completionRate)}%` : '0%'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Average Rating</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {getAverageRating().toFixed(1)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-neutral-600">Response Rate</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {submissions.length > 0 ? '100%' : '0%'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Location Analytics */}
      {analytics?.locationStats && analytics.locationStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Geographic Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getTopCountries().map((location, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{location.country}</span>
                    {location.region && (
                      <span className="text-sm text-neutral-500">({location.region})</span>
                    )}
                  </div>
                  <Badge variant="secondary">{location.count} submissions</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Device Analytics */}
      {analytics?.deviceStats && analytics.deviceStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              Device & Browser Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getTopDevices().map((device, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{device.platform}</span>
                    <span className="text-sm text-neutral-500">({device.browser})</span>
                  </div>
                  <Badge variant="secondary">{device.count} users</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Field Analytics */}
      {analytics?.fieldAnalytics && analytics.fieldAnalytics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Field Response Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.fieldAnalytics.map((field, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{field.fieldLabel}</h4>
                    <Badge variant="outline">{field.fieldType}</Badge>
                  </div>
                  <div className="text-sm text-neutral-600 mb-2">
                    {field.responseCount} responses
                    {field.averageValue && (
                      <span className="ml-2">
                        • Average: {field.averageValue.toFixed(1)}
                      </span>
                    )}
                  </div>
                  {field.commonResponses && field.commonResponses.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-neutral-700">Common responses:</p>
                      {field.commonResponses.slice(0, 3).map((response, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="text-neutral-600">&ldquo;{response.value}&rdquo;</span>
                          <span className="text-neutral-500">{response.count} times</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Submissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Recent Submissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {getRecentSubmissions().length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No submissions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {getRecentSubmissions().map((submission) => (
                <div key={submission.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {submission.userInfo.name || submission.userInfo.email || 'Anonymous'}
                      </span>
                      {submission.isAnonymous && (
                        <Badge variant="secondary" className="text-xs">Anonymous</Badge>
                      )}
                    </div>
                    <span className="text-sm text-neutral-500">
                      {new Date(submission.submittedAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-sm text-neutral-600">
                    {submission.userInfo.location?.country && (
                      <span className="mr-4">
                        📍 {submission.userInfo.location.country}
                        {submission.userInfo.location.city && `, ${submission.userInfo.location.city}`}
                      </span>
                    )}
                    {submission.userInfo.device?.platform && (
                      <span>
                        💻 {submission.userInfo.device.platform}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

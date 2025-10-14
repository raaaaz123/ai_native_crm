"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Star, 
  Copy, 
  ExternalLink, 
  Plus,
  Share2,
  BarChart3,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Users,
  MessageSquare
} from 'lucide-react';
import { ReviewForm } from '@/app/lib/review-types';

interface ReviewFormsListProps {
  forms: ReviewForm[];
  loading: boolean;
  onCreateNew: () => void;
  onEdit: (form: ReviewForm) => void;
  onDelete: (formId: string) => void;
  onViewAnalytics: (formId: string) => void;
  onViewSubmissions: (formId: string) => void;
}

export default function ReviewFormsList({
  forms,
  loading,
  onCreateNew,
  onEdit,
  onDelete,
  onViewAnalytics,
  onViewSubmissions,
}: ReviewFormsListProps) {
  const [showActions, setShowActions] = useState<string | null>(null);

  const copyFormUrl = (formId: string) => {
    const formUrl = `${window.location.origin}/review/${formId}`;
    navigator.clipboard.writeText(formUrl);
    // You could add a toast notification here
  };

  const getEmbedCode = (formId: string): string => {
    return `<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${window.location.origin}/review-embed.js';
    script.setAttribute('data-widget-id', '${formId}');
    script.setAttribute('data-position', 'bottom-right');
    script.setAttribute('data-button-text', 'Leave a Review');
    script.setAttribute('data-primary-color', '#3b82f6');
    script.setAttribute('data-button-size', 'medium');
    document.head.appendChild(script);
  })();
</script>`;
  };

  const getFieldTypeIcon = (type: string) => {
    switch (type) {
      case 'rating': return <Star className="w-3 h-3" />;
      case 'text': return <MessageSquare className="w-3 h-3" />;
      case 'email': return <MessageSquare className="w-3 h-3" />;
      default: return <MessageSquare className="w-3 h-3" />;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
        <p className="text-neutral-600 mt-2">Loading review forms...</p>
      </div>
    );
  }

  if (forms.length === 0) {
    return (
      <div className="text-center py-12">
        <Star className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-neutral-700 mb-2">No Review Forms Yet</h3>
        <p className="text-neutral-500 mb-6">Create your first review form to start collecting customer feedback</p>
        <Button onClick={onCreateNew} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Your First Form
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {forms.map((form) => (
        <Card key={form.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-neutral-900">{form.title}</h3>
                  <Badge variant={form.isActive ? "default" : "secondary"}>
                    {form.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                
                {form.description && (
                  <p className="text-neutral-600 mb-3">{form.description}</p>
                )}

                <div className="flex items-center gap-4 text-sm text-neutral-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{form.fields.length} fields</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    <span>Created {new Date(form.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Field Types Preview */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {form.fields.slice(0, 5).map((field, index) => (
                    <div key={field.id} className="flex items-center gap-1 px-2 py-1 bg-neutral-100 rounded text-xs">
                      {getFieldTypeIcon(field.type)}
                      <span className="capitalize">{field.type}</span>
                      {field.required && <span className="text-red-500">*</span>}
                    </div>
                  ))}
                  {form.fields.length > 5 && (
                    <div className="px-2 py-1 bg-neutral-100 rounded text-xs">
                      +{form.fields.length - 5} more
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyFormUrl(form.id)}
                    className="flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    Copy URL
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const embedCode = getEmbedCode(form.id);
                      navigator.clipboard.writeText(embedCode);
                    }}
                    className="flex items-center gap-1"
                  >
                    <Share2 className="w-3 h-3" />
                    Embed
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/review/${form.id}`, '_blank')}
                    className="flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Preview
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewSubmissions(form.id)}
                    className="flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    Submissions
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewAnalytics(form.id)}
                    className="flex items-center gap-1"
                  >
                    <BarChart3 className="w-3 h-3" />
                    Analytics
                  </Button>

                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowActions(showActions === form.id ? null : form.id)}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                    
                    {showActions === form.id && (
                      <div className="absolute right-0 top-8 bg-white border rounded-lg shadow-lg z-10 min-w-[120px]">
                        <button
                          onClick={() => {
                            onEdit(form);
                            setShowActions(null);
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 flex items-center gap-2"
                        >
                          <Edit className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            onDelete(form.id);
                            setShowActions(null);
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 flex items-center gap-2 text-red-600"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

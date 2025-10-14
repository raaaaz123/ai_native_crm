"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Star, 
  Heart, 
  ThumbsUp,
  Text,
  Mail,
  Phone,
  Calendar,
  CheckSquare,
  ChevronDown,
  Save,
  Loader2
} from 'lucide-react';
import { ReviewField, ReviewFormSettings } from '@/app/lib/review-types';

interface ReviewFormBuilderProps {
  onSave: (formData: {
    title: string;
    description: string;
    fields: ReviewField[];
    settings: ReviewFormSettings;
  }) => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ReviewFormBuilder({ onSave, onCancel, loading = false }: ReviewFormBuilderProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<ReviewField[]>([]);
  const [settings, setSettings] = useState<ReviewFormSettings>({
    allowAnonymous: true,
    requireEmail: false,
    showProgress: true,
    thankYouMessage: 'Thank you for your feedback!',
    collectLocation: true,
    collectDeviceInfo: true,
  });

  const addField = (type: ReviewField['type']) => {
    const newField: ReviewField = {
      id: `field_${Date.now()}`,
      type,
      label: '',
      required: false,
      order: fields.length,
      ...(type === 'rating' && { minRating: 1, maxRating: 5, ratingType: 'stars' }),
      ...(type === 'select' && { options: ['Option 1', 'Option 2'] }),
    };
    setFields([...fields, newField]);
  };

  const updateField = (fieldId: string, updates: Partial<ReviewField>) => {
    setFields(fields.map(field => 
      field.id === fieldId ? { ...field, ...updates } : field
    ));
  };

  const removeField = (fieldId: string) => {
    setFields(fields.filter(field => field.id !== fieldId));
  };

  const moveField = (fieldId: string, direction: 'up' | 'down') => {
    const currentIndex = fields.findIndex(field => field.id === fieldId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= fields.length) return;

    const newFields = [...fields];
    [newFields[currentIndex], newFields[newIndex]] = [newFields[newIndex], newFields[currentIndex]];
    
    // Update order values
    newFields.forEach((field, index) => {
      field.order = index;
    });
    
    setFields(newFields);
  };

  const getFieldIcon = (type: ReviewField['type']) => {
    switch (type) {
      case 'text': return <Text className="w-4 h-4" />;
      case 'textarea': return <Text className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'phone': return <Phone className="w-4 h-4" />;
      case 'date': return <Calendar className="w-4 h-4" />;
      case 'rating': return <Star className="w-4 h-4" />;
      case 'select': return <ChevronDown className="w-4 h-4" />;
      case 'checkbox': return <CheckSquare className="w-4 h-4" />;
      default: return <Text className="w-4 h-4" />;
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      alert('Please enter a form title');
      return;
    }

    if (fields.length === 0) {
      alert('Please add at least one field to the form');
      return;
    }

    // Validate fields
    for (const field of fields) {
      if (!field.label.trim()) {
        alert(`Please enter a label for all fields`);
        return;
      }
    }

    onSave({
      title: title.trim(),
      description: description.trim(),
      fields,
      settings,
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
      {/* Form Basic Info */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">1</span>
          </div>
          <h2 className="text-2xl font-bold text-neutral-900">Form Details</h2>
        </div>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Form Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Customer Feedback Form"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please share your experience with us..."
              rows={3}
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">2</span>
            </div>
            <h2 className="text-2xl font-bold text-neutral-900">Form Fields</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => addField('text')}
              className="flex items-center gap-1"
            >
              <Text className="w-4 h-4" />
              Text
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addField('textarea')}
              className="flex items-center gap-1"
            >
              <Text className="w-4 h-4" />
              Textarea
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addField('rating')}
              className="flex items-center gap-1"
            >
              <Star className="w-4 h-4" />
              Rating
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addField('select')}
              className="flex items-center gap-1"
            >
              <ChevronDown className="w-4 h-4" />
              Select
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addField('checkbox')}
              className="flex items-center gap-1"
            >
              <CheckSquare className="w-4 h-4" />
              Checkbox
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addField('email')}
              className="flex items-center gap-1"
            >
              <Mail className="w-4 h-4" />
              Email
            </Button>
          </div>
        </div>
        {fields.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Text className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No fields added yet. Click the buttons above to add form fields.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {fields
              .sort((a, b) => a.order - b.order)
              .map((field, index) => (
              <div key={field.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-gray-400" />
                    {getFieldIcon(field.type)}
                    <span className="font-medium capitalize">{field.type}</span>
                    <span className="text-sm text-gray-500">#{index + 1}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveField(field.id, 'up')}
                      disabled={index === 0}
                    >
                      ↑
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveField(field.id, 'down')}
                      disabled={index === fields.length - 1}
                    >
                      ↓
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeField(field.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label>Field Label *</Label>
                    <Input
                      value={field.label}
                      onChange={(e) => updateField(field.id, { label: e.target.value })}
                      placeholder="Enter field label"
                      className="mt-1"
                    />
                  </div>

                  {field.type === 'text' && (
                    <div>
                      <Label>Placeholder</Label>
                      <Input
                        value={field.placeholder || ''}
                        onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                        placeholder="Enter placeholder text"
                        className="mt-1"
                      />
                    </div>
                  )}

                  {field.type === 'rating' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Min Rating</Label>
                        <Input
                          type="number"
                          value={field.minRating || 1}
                          onChange={(e) => updateField(field.id, { minRating: parseInt(e.target.value) })}
                          min="1"
                          max="10"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Max Rating</Label>
                        <Input
                          type="number"
                          value={field.maxRating || 5}
                          onChange={(e) => updateField(field.id, { maxRating: parseInt(e.target.value) })}
                          min="1"
                          max="10"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Rating Type</Label>
                        <select
                          value={field.ratingType || 'stars'}
                          onChange={(e) => updateField(field.id, { ratingType: e.target.value as 'stars' | 'hearts' | 'thumbs' })}
                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value="stars">Stars</option>
                          <option value="hearts">Hearts</option>
                          <option value="thumbs">Thumbs</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {field.type === 'select' && (
                    <div>
                      <Label>Options (one per line)</Label>
                      <Textarea
                        value={field.options?.join('\n') || ''}
                        onChange={(e) => updateField(field.id, { 
                          options: e.target.value.split('\n').filter(opt => opt.trim()) 
                        })}
                        placeholder="Option 1&#10;Option 2&#10;Option 3"
                        rows={3}
                        className="mt-1"
                      />
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`required-${field.id}`}
                      checked={field.required}
                      onCheckedChange={(checked) => updateField(field.id, { required: checked })}
                    />
                    <Label htmlFor={`required-${field.id}`}>Required field</Label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Settings */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">3</span>
          </div>
          <h2 className="text-2xl font-bold text-neutral-900">Form Settings</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Allow Anonymous Submissions</Label>
              <p className="text-sm text-gray-500">Users can submit without providing contact info</p>
            </div>
            <Switch
              checked={settings.allowAnonymous}
              onCheckedChange={(checked) => setSettings({ ...settings, allowAnonymous: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Require Email</Label>
              <p className="text-sm text-gray-500">Force users to provide email address</p>
            </div>
            <Switch
              checked={settings.requireEmail}
              onCheckedChange={(checked) => setSettings({ ...settings, requireEmail: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Show Progress Bar</Label>
              <p className="text-sm text-gray-500">Display progress indicator during form filling</p>
            </div>
            <Switch
              checked={settings.showProgress}
              onCheckedChange={(checked) => setSettings({ ...settings, showProgress: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Collect Location Data</Label>
              <p className="text-sm text-gray-500">Automatically collect user location (country, region, city)</p>
            </div>
            <Switch
              checked={settings.collectLocation}
              onCheckedChange={(checked) => setSettings({ ...settings, collectLocation: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Collect Device Information</Label>
              <p className="text-sm text-gray-500">Automatically collect device and browser info</p>
            </div>
            <Switch
              checked={settings.collectDeviceInfo}
              onCheckedChange={(checked) => setSettings({ ...settings, collectDeviceInfo: checked })}
            />
          </div>

          <div>
            <Label>Thank You Message</Label>
            <Textarea
              value={settings.thankYouMessage}
              onChange={(e) => setSettings({ ...settings, thankYouMessage: e.target.value })}
              placeholder="Thank you for your feedback!"
              rows={2}
              className="mt-1"
            />
          </div>

          <div>
            <Label>Redirect URL (Optional)</Label>
            <Input
              value={settings.redirectUrl || ''}
              onChange={(e) => setSettings({ ...settings, redirectUrl: e.target.value })}
              placeholder="https://example.com/thank-you"
              className="mt-1"
            />
            <p className="text-sm text-gray-500 mt-1">URL to redirect users after form submission</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-4 pt-8 border-t border-neutral-200">
        <Button variant="outline" onClick={onCancel} size="lg">
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={loading} size="lg" className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 disabled:from-primary-100 disabled:to-primary-200 disabled:text-primary-800 text-white font-semibold shadow-lg hover:shadow-xl disabled:shadow-none disabled:cursor-not-allowed transition-all duration-300">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Create Form
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

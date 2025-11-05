'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/app/lib/workspace-auth-context';
 
import {
  createAgentKnowledgeItem,
  getAgentKnowledgeItems,
  deleteAgentKnowledgeItem,
  type AgentKnowledgeItem
} from '@/app/lib/agent-knowledge-utils';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Plus, X, Trash2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

export default function FAQSourcePage() {
  const params = useParams();
  const agentId = params.agentId as string;
  const { workspaceContext } = useAuth();

  const [title, setTitle] = useState('');
  const [faqs, setFaqs] = useState<FAQItem[]>([{ question: '', answer: '' }]);
  const [saving, setSaving] = useState(false);
  const [existingFAQs, setExistingFAQs] = useState<AgentKnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  

  useEffect(() => {
    if (agentId) {
      loadExistingFAQs();
    }
  }, [agentId]);

  

  const loadExistingFAQs = async () => {
    try {
      setLoading(true);
      const result = await getAgentKnowledgeItems(agentId);

      if (result.success) {
        // Filter only FAQ type items
        const faqItems = result.data.filter(item => item.type === 'faq');
        setExistingFAQs(faqItems);
      }
    } catch (error) {
      console.error('Error loading FAQs:', error);
    } finally {
      setLoading(false);
    }
  };

  const addFAQ = () => {
    setFaqs([...faqs, { question: '', answer: '' }]);
  };

  const removeFAQ = (index: number) => {
    setFaqs(faqs.filter((_, i) => i !== index));
  };

  const updateFAQ = (index: number, field: 'question' | 'answer', value: string) => {
    const updated = [...faqs];
    updated[index][field] = value;
    setFaqs(updated);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setUploadStatus('error');
      setUploadMessage('Please enter a title for the FAQ collection');
      return;
    }

    const validFAQs = faqs.filter(faq => faq.question.trim() && faq.answer.trim());
    if (validFAQs.length === 0) {
      setUploadStatus('error');
      setUploadMessage('Please add at least one FAQ with both question and answer');
      return;
    }

    if (!workspaceContext?.currentWorkspace?.id) {
      setUploadStatus('error');
      setUploadMessage('Workspace not found');
      return;
    }

    

    try {
      setSaving(true);
      setUploadStatus('uploading');
      setUploadMessage(`Saving ${validFAQs.length} FAQ(s)...`);

      // Save each FAQ individually
      for (let i = 0; i < validFAQs.length; i++) {
        const faq = validFAQs[i];
        setUploadMessage(`Saving FAQ ${i + 1} of ${validFAQs.length}...`);

        const result = await createAgentKnowledgeItem(
          agentId,
          workspaceContext?.currentWorkspace?.id,
          {
            
            title: `${title} - Q${i + 1}`,
            content: `Q: ${faq.question}\n\nA: ${faq.answer}`,
            type: 'faq',
            faqQuestion: faq.question,
            faqAnswer: faq.answer,
            embeddingProvider: 'voyage',
            embeddingModel: 'voyage-3'
          }
        );

        if (!result.success) {
          throw new Error(result.error || 'Failed to save FAQ');
        }
      }

      setUploadStatus('success');
      setUploadMessage(`Successfully saved ${validFAQs.length} FAQ(s)!`);

      // Reload existing FAQs
      await loadExistingFAQs();

      // Reset form
      setTitle('');
      setFaqs([{ question: '', answer: '' }]);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setUploadStatus('idle');
        setUploadMessage('');
      }, 3000);
    } catch (error) {
      setUploadStatus('error');
      setUploadMessage(error instanceof Error ? error.message : 'Failed to save FAQs');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) {
      return;
    }

    try {
      setUploadStatus('uploading');
      setUploadMessage('Deleting FAQ...');

      const result = await deleteAgentKnowledgeItem(id);

      if (result.success) {
        setUploadStatus('success');
        setUploadMessage('FAQ deleted successfully!');
        await loadExistingFAQs();

        setTimeout(() => {
          setUploadStatus('idle');
          setUploadMessage('');
        }, 2000);
      } else {
        throw new Error(result.error || 'Failed to delete FAQ');
      }
    } catch (error) {
      setUploadStatus('error');
      setUploadMessage(error instanceof Error ? error.message : 'Failed to delete FAQ');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4 lg:p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-semibold text-foreground">FAQ Management</h1>
          </div>
          <p className="text-muted-foreground">
            Create and manage frequently asked questions to train your AI agent
          </p>
        </div>

        {/* Status Message */}
        {uploadStatus !== 'idle' && uploadMessage && (
          <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 border ${
            uploadStatus === 'success' ? 'bg-green-50 text-green-800 border-green-200' :
            uploadStatus === 'error' ? 'bg-red-50 text-red-800 border-red-200' :
            'bg-blue-50 text-blue-800 border-blue-200'
          }`}>
            {uploadStatus === 'success' && <CheckCircle className="w-4 h-4" />}
            {uploadStatus === 'error' && <AlertCircle className="w-4 h-4" />}
            {uploadStatus === 'uploading' && <Loader2 className="w-4 h-4 animate-spin" />}
            <span className="text-sm font-medium">{uploadMessage}</span>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Add New FAQ */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-4">
                <Plus className="w-4 h-4 text-primary" />
                <h2 className="text-lg font-medium text-foreground">Add New FAQ Collection</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-sm font-medium text-foreground mb-2 block">
                    FAQ Collection Title *
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Product FAQ, Support FAQ, Billing Questions"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-foreground">
                      Questions & Answers *
                    </Label>
                    <Button
                      onClick={addFAQ}
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-primary border-primary/20 hover:bg-primary/5"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add FAQ
                    </Button>
                  </div>

                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {faqs.map((faq, index) => (
                      <div key={index} className="bg-muted rounded-lg p-3">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 bg-primary/10 rounded flex items-center justify-center">
                              <span className="text-xs font-medium text-primary">{index + 1}</span>
                            </div>
                            <span className="text-sm font-medium text-foreground">
                              FAQ #{index + 1}
                            </span>
                          </div>
                          {faqs.length > 1 && (
                            <button
                              onClick={() => removeFAQ(index)}
                              className="p-1 hover:bg-destructive/10 rounded transition-colors"
                            >
                              <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                            </button>
                          )}
                        </div>

                        <div className="space-y-3">
                          <div>
                            <Label className="text-xs font-medium text-foreground mb-1 block">
                              Question
                            </Label>
                            <Input
                              value={faq.question}
                              onChange={(e) => updateFAQ(index, 'question', e.target.value)}
                              placeholder="What question do customers frequently ask?"
                              className="text-sm"
                            />
                          </div>

                          <div>
                            <Label className="text-xs font-medium text-foreground mb-1 block">
                              Answer
                            </Label>
                            <Textarea
                              value={faq.answer}
                              onChange={(e) => updateFAQ(index, 'answer', e.target.value)}
                              rows={2}
                              placeholder="Provide a clear and helpful answer..."
                              className="text-sm resize-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setTitle('');
                      setFaqs([{ question: '', answer: '' }]);
                    }}
                    disabled={saving}
                    size="sm"
                  >
                    Clear All
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={!title.trim() || saving}
                    className="bg-primary hover:bg-primary/90"
                    size="sm"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Save FAQ Collection
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Existing FAQs */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg border p-4 sticky top-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-4 h-4 text-primary" />
                <h3 className="text-lg font-medium text-foreground">Existing FAQs</h3>
              </div>

              {loading ? (
                <div className="text-center py-6">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">Loading FAQs...</p>
                </div>
              ) : existingFAQs.length === 0 ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">No FAQs yet</p>
                  <p className="text-xs text-muted-foreground">Add your first FAQ collection to get started</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {existingFAQs.map((item) => (
                    <div key={item.id} className="bg-muted rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-foreground text-sm line-clamp-1">{item.title}</h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          className="ml-2 p-1 h-6 w-6 text-muted-foreground hover:text-destructive border-none hover:bg-destructive/10"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <div className="bg-background rounded p-2 border">
                          <p className="text-xs font-medium text-primary mb-1">Q:</p>
                          <p className="text-xs text-foreground line-clamp-2">{item.faqQuestion}</p>
                        </div>
                        <div className="bg-background rounded p-2 border">
                          <p className="text-xs font-medium text-green-600 mb-1">A:</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">{item.faqAnswer}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        Added {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth-context';
import { getBusinessWidgets, ChatWidget } from '../../lib/chat-utils';
import { 
  createKnowledgeBaseItem, 
  subscribeToKnowledgeBaseItems, 
  deleteKnowledgeBaseItem,
  KnowledgeBaseItem 
} from '../../lib/knowledge-base-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Plus,
  FileText,
  Upload,
  Search,
  Edit,
  Trash2,
  Download,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';

export default function KnowledgeBasePage() {
  const { user } = useAuth();
  const [widgets, setWidgets] = useState<ChatWidget[]>([]);
  const [selectedWidget, setSelectedWidget] = useState<ChatWidget | null>(null);
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeBaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newItem, setNewItem] = useState({
    title: '',
    content: '',
    type: 'text' as 'text' | 'pdf'
  });
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (user?.uid) {
      loadWidgets();
    }
  }, [user?.uid]);

  useEffect(() => {
    if (selectedWidget) {
      loadKnowledgeItems(selectedWidget.id);
    }
  }, [selectedWidget]);

  const loadWidgets = async () => {
    if (!user?.uid) return;

    try {
      const result = await getBusinessWidgets(user.uid);
      if (result.success) {
        setWidgets(result.data);
        if (result.data.length > 0) {
          setSelectedWidget(result.data[0]);
        }
      }
    } catch (error) {
      console.error('Error loading widgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadKnowledgeItems = async (widgetId: string) => {
    setLoadingItems(true);
    try {
      console.log('Loading knowledge base items for widget:', widgetId);
      
      // Subscribe to real-time knowledge base items
      const unsubscribe = subscribeToKnowledgeBaseItems(widgetId, (items) => {
        console.log('Knowledge base items updated:', items);
        setKnowledgeItems(items);
        setLoadingItems(false);
      });

      // Store unsubscribe function for cleanup
      return unsubscribe;
    } catch (error) {
      console.error('Error loading knowledge items:', error);
      setLoadingItems(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
        setNewItem(prev => ({
          ...prev,
          title: file.name.replace('.pdf', ''),
          type: 'pdf'
        }));
      } else {
        alert('Please select a PDF file');
      }
    }
  };

  const handleCreateItem = async () => {
    if (!selectedWidget || !newItem.title.trim() || !user?.uid) return;

    if (newItem.type === 'pdf' && !selectedFile) {
      alert('Please select a PDF file');
      return;
    }

    setUploading(true);
    try {
      console.log('Creating knowledge base item:', {
        widgetId: selectedWidget.id,
        ...newItem,
        file: selectedFile
      });

      const result = await createKnowledgeBaseItem(user.uid, selectedWidget.id, {
        title: newItem.title,
        content: newItem.content,
        type: newItem.type,
        file: selectedFile || undefined
      });

      if (result.success) {
        console.log('Knowledge base item created successfully:', result.data);
        setShowCreateForm(false);
        setNewItem({ title: '', content: '', type: 'text' });
        setSelectedFile(null);
      } else {
        console.error('Failed to create knowledge base item:', result.error);
        alert('Failed to create knowledge base item: ' + result.error);
      }
    } catch (error) {
      console.error('Error creating knowledge base item:', error);
      alert('Error creating knowledge base item');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this knowledge base item?')) return;

    try {
      const result = await deleteKnowledgeBaseItem(itemId);
      if (result.success) {
        console.log('Knowledge base item deleted successfully');
      } else {
        console.error('Failed to delete knowledge base item:', result.error);
        alert('Failed to delete knowledge base item: ' + result.error);
      }
    } catch (error) {
      console.error('Error deleting knowledge base item:', error);
      alert('Error deleting knowledge base item');
    }
  };

  const filteredItems = knowledgeItems.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Knowledge Base</h1>
        <p className="text-gray-600">Manage knowledge base content for your chat widgets</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Widget Selection */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Select Widget
              </CardTitle>
            </CardHeader>
            <CardContent>
              {widgets.length === 0 ? (
                <p className="text-gray-500 text-sm">No widgets found. Create a widget first.</p>
              ) : (
                <div className="space-y-2">
                  {widgets.map((widget) => (
                    <button
                      key={widget.id}
                      onClick={() => setSelectedWidget(widget)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedWidget?.id === widget.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-medium text-sm">{widget.name}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {knowledgeItems.filter(item => item.widgetId === widget.id).length} items
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Knowledge Base Content */}
        <div className="lg:col-span-3">
          {selectedWidget ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      Knowledge Base: {selectedWidget.name}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Manage knowledge base content for this widget
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowCreateForm(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Search */}
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search knowledge base..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Create Form */}
                {showCreateForm && (
                  <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <h3 className="font-semibold mb-4">Add New Knowledge Base Item</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Title
                        </label>
                        <Input
                          value={newItem.title}
                          onChange={(e) => setNewItem(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Enter title..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Type
                        </label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              value="text"
                              checked={newItem.type === 'text'}
                              onChange={(e) => setNewItem(prev => ({ ...prev, type: e.target.value as 'text' | 'pdf' }))}
                            />
                            Text Content
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              value="pdf"
                              checked={newItem.type === 'pdf'}
                              onChange={(e) => setNewItem(prev => ({ ...prev, type: e.target.value as 'text' | 'pdf' }))}
                            />
                            PDF Document
                          </label>
                        </div>
                      </div>

                      {newItem.type === 'text' ? (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Content
                          </label>
                          <Textarea
                            value={newItem.content}
                            onChange={(e) => setNewItem(prev => ({ ...prev, content: e.target.value }))}
                            placeholder="Enter knowledge base content..."
                            rows={6}
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            PDF File
                          </label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            <input
                              type="file"
                              accept=".pdf"
                              onChange={handleFileSelect}
                              className="hidden"
                              id="pdf-upload"
                            />
                            <label
                              htmlFor="pdf-upload"
                              className="cursor-pointer flex flex-col items-center gap-2"
                            >
                              <Upload className="w-8 h-8 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                {selectedFile ? selectedFile.name : 'Click to upload PDF'}
                              </span>
                              <span className="text-xs text-gray-500">
                                Only PDF files are supported
                              </span>
                            </label>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          onClick={handleCreateItem}
                          disabled={!newItem.title.trim() || uploading || (newItem.type === 'pdf' && !selectedFile)}
                        >
                          {uploading ? 'Creating...' : 'Create Item'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowCreateForm(false);
                            setNewItem({ title: '', content: '', type: 'text' });
                            setSelectedFile(null);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Knowledge Items List */}
                {loadingItems ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                    <p className="text-gray-600">Loading knowledge base items...</p>
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No knowledge base items</h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm ? 'No items match your search' : 'Create your first knowledge base item'}
                    </p>
                    {!searchTerm && (
                      <Button onClick={() => setShowCreateForm(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add First Item
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredItems.map((item) => (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-gray-900">{item.title}</h3>
                              <Badge variant={item.type === 'text' ? 'default' : 'secondary'}>
                                {item.type === 'text' ? 'Text' : 'PDF'}
                              </Badge>
                            </div>
                            
                            {item.type === 'text' ? (
                              <p className="text-gray-600 text-sm line-clamp-3">{item.content}</p>
                            ) : (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <FileText className="w-4 h-4" />
                                <span>{item.fileName}</span>
                                {item.fileSize && (
                                  <span>({(item.fileSize / 1024 / 1024).toFixed(1)} MB)</span>
                                )}
                              </div>
                            )}
                            
                            <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                              <span>Created: {format(new Date(item.createdAt), 'MMM dd, yyyy')}</span>
                              <span>Updated: {format(new Date(item.updatedAt), 'MMM dd, yyyy')}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            {item.type === 'pdf' && item.fileUrl && (
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                            )}
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeleteItem(item.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Widget</h3>
                <p className="text-gray-600">
                  Choose a widget from the left panel to manage its knowledge base
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

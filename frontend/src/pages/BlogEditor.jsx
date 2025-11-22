import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { AuthContext, API } from '@/App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Eye, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

const BlogEditor = () => {
  const { blogId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState(null);
  const [isPublished, setIsPublished] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (blogId) {
      fetchBlog();
    }
  }, [blogId]);

  const fetchBlog = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/blogs/${blogId}`);
      const blog = response.data;
      setTitle(blog.title);
      setContent(blog.content);
      setIsPublished(blog.is_published);
      if (blog.cover_image) {
        setCoverImagePreview(blog.cover_image);
      }
    } catch (error) {
      toast.error('Failed to load blog');
      navigate('/feed');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverImage(file);
      setCoverImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      formData.append('is_published', isPublished);
      if (coverImage) {
        formData.append('cover_image', coverImage);
      }

      if (blogId) {
        await axios.put(`${API}/blogs/${blogId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Blog updated successfully');
      } else {
        const response = await axios.post(`${API}/blogs`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Blog created successfully');
        navigate(`/blog/${response.data.id}`);
      }
    } catch (error) {
      toast.error('Failed to save blog');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this blog?')) return;

    try {
      await axios.delete(`${API}/blogs/${blogId}`);
      toast.success('Blog deleted successfully');
      navigate('/feed');
    } catch (error) {
      toast.error('Failed to delete blog');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-[#00ff88] text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 glass border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <Button
            data-testid="back-btn"
            variant="ghost"
            onClick={() => navigate('/feed')}
            className="text-white hover:text-[#00ff88]"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>

          <div className="flex items-center gap-3">
            <Button
              data-testid="preview-btn"
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
              className="border-gray-700 text-white hover:bg-[#1a1a1a]"
            >
              <Eye className="w-4 h-4 mr-2" />
              {showPreview ? 'Edit' : 'Preview'}
            </Button>
            <Button
              data-testid="save-btn"
              onClick={handleSave}
              disabled={saving}
              className="bg-[#00ff88] hover:bg-[#00dd77] text-black font-semibold"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
            {blogId && (
              <Button
                data-testid="delete-btn"
                variant="destructive"
                onClick={handleDelete}
              >
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {!showPreview ? (
          <div className="space-y-6">
            {/* Cover Image */}
            <div>
              <Label htmlFor="cover" className="text-gray-300 mb-2 block">
                Cover Image
              </Label>
              {coverImagePreview ? (
                <div className="relative">
                  <img
                    src={coverImagePreview}
                    alt="Cover"
                    className="w-full h-64 object-cover rounded-xl"
                  />
                  <Button
                    data-testid="remove-cover-btn"
                    onClick={() => {
                      setCoverImage(null);
                      setCoverImagePreview(null);
                    }}
                    className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 rounded-full p-2"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <label
                  htmlFor="cover"
                  className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-700 rounded-xl cursor-pointer hover:border-[#00ff88] transition-colors"
                >
                  <Upload className="w-12 h-12 text-gray-500 mb-2" />
                  <p className="text-gray-500">Click to upload cover image</p>
                  <input
                    data-testid="cover-image-input"
                    id="cover"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Title */}
            <div>
              <Label htmlFor="title" className="text-gray-300 mb-2 block">
                Title
              </Label>
              <Input
                data-testid="title-input"
                id="title"
                type="text"
                placeholder="Enter your blog title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-3xl font-bold bg-[#1a1a1a] border-gray-700 text-white placeholder-gray-600"
                style={{ fontFamily: 'Space Grotesk' }}
              />
            </div>

            {/* Content */}
            <div>
              <Label htmlFor="content" className="text-gray-300 mb-2 block">
                Content (Markdown supported)
              </Label>
              <Textarea
                data-testid="content-textarea"
                id="content"
                placeholder="Write your story... (Supports Markdown)"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full min-h-[500px] bg-[#1a1a1a] border-gray-700 text-white placeholder-gray-600 font-mono"
              />
            </div>

            {/* Publish Toggle */}
            <div className="flex items-center justify-between glass p-4 rounded-xl">
              <div>
                <Label htmlFor="publish" className="text-white font-semibold">
                  Publish
                </Label>
                <p className="text-sm text-gray-400">Make this blog visible to everyone</p>
              </div>
              <Switch
                data-testid="publish-toggle"
                id="publish"
                checked={isPublished}
                onCheckedChange={setIsPublished}
              />
            </div>
          </div>
        ) : (
          <div className="glass p-8 rounded-2xl">
            {coverImagePreview && (
              <img
                src={coverImagePreview}
                alt="Cover"
                className="w-full h-96 object-cover rounded-xl mb-8"
              />
            )}
            <h1
              className="text-5xl font-bold mb-6"
              style={{ fontFamily: 'Space Grotesk' }}
            >
              {title || 'Untitled'}
            </h1>
            <div className="markdown-content prose prose-invert max-w-none">
              <ReactMarkdown>{content || 'No content yet...'}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogEditor;
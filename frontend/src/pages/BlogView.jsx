import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { AuthContext, API } from '@/App';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Heart, MessageSquare, Share2, Edit, Eye } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import {
  FacebookShareButton,
  TwitterShareButton,
  LinkedinShareButton,
  WhatsappShareButton,
  FacebookIcon,
  TwitterIcon,
  LinkedinIcon,
  WhatsappIcon,
} from 'react-share';

const BlogView = () => {
  const { blogId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [liked, setLiked] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [loading, setLoading] = useState(true);

  const shareUrl = window.location.href;

  useEffect(() => {
    fetchBlog();
    fetchComments();
    if (user) {
      checkLiked();
    }
  }, [blogId, user]);

  const fetchBlog = async () => {
    try {
      const response = await axios.get(`${API}/blogs/${blogId}`);
      setBlog(response.data);
    } catch (error) {
      toast.error('Blog not found');
      navigate('/feed');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await axios.get(`${API}/blogs/${blogId}/comments`);
      setComments(response.data);
    } catch (error) {
      console.error('Failed to fetch comments');
    }
  };

  const checkLiked = async () => {
    try {
      const response = await axios.get(`${API}/blogs/${blogId}/liked`);
      setLiked(response.data.liked);
    } catch (error) {
      console.error('Failed to check like status');
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast.error('Please login to like');
      return;
    }

    try {
      const response = await axios.post(`${API}/blogs/${blogId}/like`);
      setLiked(response.data.liked);
      setBlog((prev) => ({
        ...prev,
        likes: prev.likes + (response.data.liked ? 1 : -1),
      }));
    } catch (error) {
      toast.error('Failed to like');
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to comment');
      return;
    }

    if (!newComment.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('text', newComment);

      const response = await axios.post(
        `${API}/blogs/${blogId}/comments`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      setComments([response.data, ...comments]);
      setNewComment('');
      toast.success('Comment added');
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success('Link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-[#00ff88] text-xl">Loading...</div>
      </div>
    );
  }

  if (!blog) return null;

  const isOwner = user && user.id === blog.user_id;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 glass border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <Button
            data-testid="back-to-feed-btn"
            variant="ghost"
            onClick={() => navigate('/feed')}
            className="text-white hover:text-[#00ff88]"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Feed
          </Button>

          {isOwner && (
            <Button
              data-testid="edit-blog-btn"
              onClick={() => navigate(`/editor/${blogId}`)}
              className="bg-[#00ff88] hover:bg-[#00dd77] text-black font-semibold"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Blog Header */}
        <div className="mb-8">
          {blog.cover_image && (
            <img
              src={blog.cover_image}
              alt={blog.title}
              className="w-full h-96 object-cover rounded-2xl mb-8"
            />
          )}

          <h1
            className="text-5xl md:text-6xl font-bold mb-6"
            style={{ fontFamily: 'Space Grotesk' }}
            data-testid="blog-title"
          >
            {blog.title}
          </h1>

          <div className="flex items-center justify-between mb-6">
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => navigate(`/profile/${blog.username}`)}
            >
              <Avatar className="w-12 h-12">
                <AvatarFallback className="bg-[#1a1a1a]">{blog.username[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold hover:text-[#00ff88]">@{blog.username}</p>
                <p className="text-sm text-gray-500">
                  {new Date(blog.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-gray-400">
                <Eye className="w-5 h-5" />
                <span>{blog.views || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Blog Content */}
        <div className="glass p-8 rounded-2xl mb-8">
          <div className="markdown-content prose prose-invert max-w-none" data-testid="blog-content">
            <ReactMarkdown>{blog.content}</ReactMarkdown>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            data-testid="like-btn"
            onClick={handleLike}
            variant="outline"
            className={`border-gray-700 ${liked ? 'text-red-500 border-red-500' : 'text-white'} hover:bg-[#1a1a1a]`}
          >
            <Heart className={`w-5 h-5 mr-2 ${liked ? 'fill-red-500' : ''}`} />
            {blog.likes || 0} Likes
          </Button>

          <div className="relative">
            <Button
              data-testid="share-btn"
              onClick={() => setShowShareMenu(!showShareMenu)}
              variant="outline"
              className="border-gray-700 text-white hover:bg-[#1a1a1a]"
            >
              <Share2 className="w-5 h-5 mr-2" />
              Share
            </Button>

            {showShareMenu && (
              <div className="absolute top-full mt-2 left-0 glass rounded-xl p-4 min-w-[250px]">
                <div className="flex gap-2 mb-3">
                  <FacebookShareButton url={shareUrl} quote={blog.title}>
                    <FacebookIcon size={32} round />
                  </FacebookShareButton>
                  <TwitterShareButton url={shareUrl} title={blog.title}>
                    <TwitterIcon size={32} round />
                  </TwitterShareButton>
                  <LinkedinShareButton url={shareUrl} title={blog.title}>
                    <LinkedinIcon size={32} round />
                  </LinkedinShareButton>
                  <WhatsappShareButton url={shareUrl} title={blog.title}>
                    <WhatsappIcon size={32} round />
                  </WhatsappShareButton>
                </div>
                <Button
                  data-testid="copy-link-btn"
                  onClick={copyToClipboard}
                  className="w-full bg-[#00ff88] hover:bg-[#00dd77] text-black"
                >
                  Copy Link
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Comments Section */}
        <div className="glass p-6 rounded-2xl" data-testid="comments-section">
          <h3
            className="text-2xl font-bold mb-6 flex items-center gap-2"
            style={{ fontFamily: 'Space Grotesk' }}
          >
            <MessageSquare className="w-6 h-6" />
            Comments ({comments.length})
          </h3>

          {/* Add Comment */}
          {user ? (
            <form onSubmit={handleComment} className="mb-6">
              <Textarea
                data-testid="comment-input"
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="bg-[#1a1a1a] border-gray-700 text-white mb-3"
              />
              <Button
                data-testid="post-comment-btn"
                type="submit"
                className="bg-[#00ff88] hover:bg-[#00dd77] text-black font-semibold"
              >
                Post Comment
              </Button>
            </form>
          ) : (
            <p className="text-gray-400 mb-6">Please login to comment</p>
          )}

          {/* Comments List */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No comments yet. Be the first!</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="bg-[#1a1a1a] p-4 rounded-xl" data-testid={`comment-${comment.id}`}>
                  <div className="flex items-start gap-3">
                    <Avatar
                      className="w-10 h-10 cursor-pointer"
                      onClick={() => navigate(`/profile/${comment.username}`)}
                    >
                      <AvatarImage src={comment.user_picture} />
                      <AvatarFallback className="bg-[#0a0a0a]">{comment.username[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p
                          className="font-semibold cursor-pointer hover:text-[#00ff88]"
                          onClick={() => navigate(`/profile/${comment.username}`)}
                        >
                          @{comment.username}
                        </p>
                        <span className="text-sm text-gray-500">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-300">{comment.text}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogView;
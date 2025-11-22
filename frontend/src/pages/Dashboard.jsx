import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext, API } from '@/App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BookOpen, Plus, Search, LogOut, User, Settings as SettingsIcon, Heart, MessageSquare, Eye } from 'lucide-react';
import { toast } from 'sonner';

const Dashboard = () => {
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async (query = '') => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/blogs`, {
        params: { search: query }
      });
      setBlogs(response.data);
    } catch (error) {
      toast.error('Failed to fetch blogs');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchBlogs(searchQuery);
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`);
      setUser(null);
      navigate('/');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 glass border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/feed')}>
            <BookOpen className="w-8 h-8 text-[#00ff88]" />
            <span className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>NightBlog</span>
          </div>

          <div className="flex items-center gap-4">
            <Button
              data-testid="new-post-btn"
              onClick={() => navigate('/editor')}
              className="bg-[#00ff88] hover:bg-[#00dd77] text-black font-semibold rounded-full flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Post
            </Button>

            <div className="relative group">
              <Avatar className="cursor-pointer w-10 h-10" data-testid="user-avatar">
                <AvatarImage src={user?.picture} />
                <AvatarFallback className="bg-[#1a1a1a]">{user?.name?.[0]}</AvatarFallback>
              </Avatar>

              <div className="absolute right-0 mt-2 w-48 glass rounded-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <button
                  data-testid="profile-menu-btn"
                  onClick={() => navigate(`/profile/${user?.username}`)}
                  className="w-full px-4 py-3 text-left hover:bg-[#1a1a1a] flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  My Profile
                </button>
                <button
                  data-testid="settings-menu-btn"
                  onClick={() => navigate('/settings')}
                  className="w-full px-4 py-3 text-left hover:bg-[#1a1a1a] flex items-center gap-2"
                >
                  <SettingsIcon className="w-4 h-4" />
                  Settings
                </button>
                <button
                  data-testid="logout-btn"
                  onClick={handleLogout}
                  className="w-full px-4 py-3 text-left hover:bg-[#1a1a1a] flex items-center gap-2 text-red-400"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
            <Input
              data-testid="search-input"
              type="text"
              placeholder="Search by title or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[#1a1a1a] border-gray-700 rounded-full text-white placeholder-gray-500 focus:border-[#00ff88]"
            />
          </div>
        </form>

        {/* Blog Feed */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-pulse text-[#00ff88]">Loading blogs...</div>
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-12 glass rounded-2xl">
            <p className="text-gray-400 text-lg">No blogs found. Be the first to write!</p>
            <Button
              onClick={() => navigate('/editor')}
              className="mt-4 bg-[#00ff88] hover:bg-[#00dd77] text-black font-semibold rounded-full"
            >
              Create First Post
            </Button>
          </div>
        ) : (
          <div className="space-y-6" data-testid="blog-feed">
            {blogs.map((blog) => (
              <div
                key={blog.id}
                data-testid={`blog-card-${blog.id}`}
                className="glass rounded-2xl overflow-hidden card-hover cursor-pointer"
                onClick={() => navigate(`/blog/${blog.id}`)}
              >
                {blog.cover_image && (
                  <img
                    src={blog.cover_image}
                    alt={blog.title}
                    className="w-full h-64 object-cover"
                  />
                )}
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar
                      className="w-10 h-10 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/profile/${blog.username}`);
                      }}
                    >
                      <AvatarFallback className="bg-[#1a1a1a]">{blog.username[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p
                        className="font-semibold hover:text-[#00ff88]"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/profile/${blog.username}`);
                        }}
                      >
                        @{blog.username}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(blog.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <h2
                    className="text-3xl font-bold mb-3"
                    style={{ fontFamily: 'Space Grotesk' }}
                  >
                    {blog.title}
                  </h2>

                  <p className="text-gray-400 line-clamp-3 mb-4">
                    {blog.content.substring(0, 200)}...
                  </p>

                  <div className="flex items-center gap-6 text-gray-500">
                    <div className="flex items-center gap-2">
                      <Heart className="w-5 h-5" />
                      <span>{blog.likes || 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      <span>{blog.views || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
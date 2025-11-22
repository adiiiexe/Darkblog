import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { AuthContext, API } from '@/App';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Settings as SettingsIcon, Heart, Eye } from 'lucide-react';
import { toast } from 'sonner';

const ProfileView = () => {
  const { username } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, [username]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/users/${username}`);
      setProfile(response.data.user);
      setBlogs(response.data.blogs);
    } catch (error) {
      toast.error('User not found');
      navigate('/feed');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-[#00ff88] text-xl">Loading...</div>
      </div>
    );
  }

  if (!profile) return null;

  const isOwnProfile = user && user.username === username;
  const themeColor = profile.theme_color || '#00ff88';

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

          {isOwnProfile && (
            <Button
              data-testid="edit-profile-btn"
              onClick={() => navigate('/settings')}
              className="bg-[#00ff88] hover:bg-[#00dd77] text-black font-semibold"
            >
              <SettingsIcon className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Profile Header */}
        <div
          className="glass rounded-3xl p-8 mb-8"
          style={{
            borderTop: `4px solid ${themeColor}`,
            boxShadow: `0 0 40px ${themeColor}20`,
          }}
          data-testid="profile-header"
        >
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <Avatar className="w-32 h-32">
              <AvatarImage src={profile.picture} />
              <AvatarFallback
                className="text-4xl"
                style={{ backgroundColor: themeColor + '30', color: themeColor }}
              >
                {profile.name[0]}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center md:text-left">
              <h1
                className="text-4xl md:text-5xl font-bold mb-2"
                style={{ fontFamily: 'Space Grotesk' }}
                data-testid="profile-name"
              >
                {profile.name}
              </h1>
              <p className="text-xl text-gray-400 mb-4" data-testid="profile-username">
                @{profile.username}
              </p>
              <p className="text-gray-300 mb-4" data-testid="profile-bio">
                {profile.bio || 'No bio yet.'}
              </p>
              <div className="flex items-center justify-center md:justify-start gap-6 text-gray-400">
                <div>
                  <span className="text-2xl font-bold" style={{ color: themeColor }}>
                    {blogs.length}
                  </span>
                  <span className="ml-2">Posts</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Blog Posts */}
        <div>
          <h2
            className="text-3xl font-bold mb-6"
            style={{ fontFamily: 'Space Grotesk' }}
          >
            Published Posts
          </h2>

          {blogs.length === 0 ? (
            <div className="glass p-12 rounded-2xl text-center">
              <p className="text-gray-400 text-lg">No published posts yet.</p>
              {isOwnProfile && (
                <Button
                  onClick={() => navigate('/editor')}
                  className="mt-4 bg-[#00ff88] hover:bg-[#00dd77] text-black font-semibold rounded-full"
                >
                  Write Your First Post
                </Button>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6" data-testid="user-blogs">
              {blogs.map((blog) => (
                <div
                  key={blog.id}
                  data-testid={`blog-${blog.id}`}
                  className="glass rounded-2xl overflow-hidden card-hover cursor-pointer"
                  onClick={() => navigate(`/blog/${blog.id}`)}
                  style={{
                    borderBottom: `3px solid ${themeColor}`,
                  }}
                >
                  {blog.cover_image && (
                    <img
                      src={blog.cover_image}
                      alt={blog.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-6">
                    <h3
                      className="text-2xl font-bold mb-3"
                      style={{ fontFamily: 'Space Grotesk' }}
                    >
                      {blog.title}
                    </h3>
                    <p className="text-gray-400 line-clamp-2 mb-4">
                      {blog.content.substring(0, 150)}...
                    </p>
                    <div className="flex items-center gap-4 text-gray-500">
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4" />
                        <span>{blog.likes || 0}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        <span>{blog.views || 0}</span>
                      </div>
                      <span className="text-sm">
                        {new Date(blog.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
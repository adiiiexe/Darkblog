import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext, API } from '@/App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Upload, Save } from 'lucide-react';
import { toast } from 'sonner';

const THEME_COLORS = [
  { name: 'Neon Green', value: '#00ff88' },
  { name: 'Cyber Blue', value: '#00d4ff' },
  { name: 'Hot Pink', value: '#ff006e' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Orange', value: '#fb923c' },
  { name: 'Red', value: '#ef4444' },
];

const Settings = () => {
  const { user, checkAuth } = useContext(AuthContext);
  const navigate = useNavigate();
  const [bio, setBio] = useState(user?.bio || '');
  const [themeColor, setThemeColor] = useState(user?.theme_color || '#00ff88');
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(user?.picture || null);
  const [saving, setSaving] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('bio', bio);
      formData.append('theme_color', themeColor);
      if (profilePicture) {
        formData.append('profile_picture', profilePicture);
      }

      await axios.put(`${API}/users/profile`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      await checkAuth();
      toast.success('Profile updated successfully');
      navigate(`/profile/${user.username}`);
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 glass border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <Button
            data-testid="back-btn"
            variant="ghost"
            onClick={() => navigate(`/profile/${user?.username}`)}
            className="text-white hover:text-[#00ff88]"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Profile
          </Button>

          <Button
            data-testid="save-profile-btn"
            onClick={handleSave}
            disabled={saving}
            className="bg-[#00ff88] hover:bg-[#00dd77] text-black font-semibold"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1
          className="text-4xl font-bold mb-8"
          style={{ fontFamily: 'Space Grotesk' }}
        >
          Profile Settings
        </h1>

        <div className="space-y-8">
          {/* Profile Picture */}
          <div className="glass p-6 rounded-2xl">
            <Label className="text-gray-300 mb-4 block text-lg font-semibold">
              Profile Picture
            </Label>
            <div className="flex items-center gap-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={previewUrl} />
                <AvatarFallback className="bg-[#1a1a1a] text-2xl">
                  {user?.name[0]}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="profile-pic"
                className="cursor-pointer"
              >
                <div className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] hover:bg-[#252525] rounded-lg transition-colors">
                  <Upload className="w-4 h-4" />
                  <span>Upload New Picture</span>
                </div>
                <input
                  data-testid="profile-picture-input"
                  id="profile-pic"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Bio */}
          <div className="glass p-6 rounded-2xl">
            <Label htmlFor="bio" className="text-gray-300 mb-4 block text-lg font-semibold">
              Bio
            </Label>
            <Textarea
              data-testid="bio-textarea"
              id="bio"
              placeholder="Tell us about yourself..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full min-h-[120px] bg-[#1a1a1a] border-gray-700 text-white placeholder-gray-600"
              maxLength={200}
            />
            <p className="text-sm text-gray-500 mt-2">
              {bio.length}/200 characters
            </p>
          </div>

          {/* Theme Color */}
          <div className="glass p-6 rounded-2xl">
            <Label className="text-gray-300 mb-4 block text-lg font-semibold">
              Theme Color
            </Label>
            <p className="text-gray-400 mb-4">
              Choose a color that represents your profile. This color will be used for accents on your profile page.
            </p>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {THEME_COLORS.map((color) => (
                <button
                  key={color.value}
                  data-testid={`theme-color-${color.name.toLowerCase().replace(' ', '-')}`}
                  onClick={() => setThemeColor(color.value)}
                  className={`relative p-4 rounded-xl transition-all ${
                    themeColor === color.value
                      ? 'ring-4 ring-white scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{
                    backgroundColor: color.value,
                    boxShadow: `0 0 20px ${color.value}40`,
                  }}
                >
                  <div className="text-xs font-semibold text-white text-center">
                    {color.name}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="glass p-6 rounded-2xl">
            <Label className="text-gray-300 mb-4 block text-lg font-semibold">
              Profile Preview
            </Label>
            <div
              className="bg-[#1a1a1a] rounded-xl p-6"
              style={{
                borderTop: `4px solid ${themeColor}`,
                boxShadow: `0 0 30px ${themeColor}20`,
              }}
            >
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={previewUrl} />
                  <AvatarFallback
                    style={{ backgroundColor: themeColor + '30', color: themeColor }}
                  >
                    {user?.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>
                    {user?.name}
                  </h3>
                  <p className="text-gray-400">@{user?.username}</p>
                </div>
              </div>
              <p className="text-gray-300">{bio || 'No bio yet.'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BookOpen, Edit3, Heart, MessageSquare, Users } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    const redirectUrl = `${window.location.origin}/feed`;
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-96 h-96 bg-[#00ff88] rounded-full blur-[120px]"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#00d4ff] rounded-full blur-[120px]"></div>
        </div>

        {/* Navbar */}
        <nav className="relative z-10 px-6 py-6 flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-[#00ff88]" />
            <span className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>NightBlog</span>
          </div>
          <Button
            data-testid="login-btn"
            onClick={handleLogin}
            className="bg-[#00ff88] hover:bg-[#00dd77] text-black font-semibold px-8 py-2 rounded-full"
          >
            Sign In
          </Button>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 md:py-32">
          <div className="text-center space-y-8">
            <h1
              className="text-5xl md:text-7xl lg:text-8xl font-bold leading-tight"
              style={{ fontFamily: 'Space Grotesk' }}
            >
              Write in the
              <span className="block text-[#00ff88]">Dark</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
              A minimalist blogging platform for night owls. Create, share, and discover stories in a beautiful dark environment.
            </p>
            <Button
              data-testid="get-started-btn"
              onClick={handleLogin}
              className="bg-[#00ff88] hover:bg-[#00dd77] text-black font-bold text-lg px-12 py-6 rounded-full mt-8"
            >
              Get Started
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <h2
          className="text-4xl md:text-5xl font-bold text-center mb-16"
          style={{ fontFamily: 'Space Grotesk' }}
        >
          Why <span className="text-[#00ff88]">NightBlog?</span>
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="glass p-8 rounded-2xl card-hover">
            <Edit3 className="w-12 h-12 text-[#00ff88] mb-4" />
            <h3 className="text-2xl font-bold mb-3" style={{ fontFamily: 'Space Grotesk' }}>Markdown Editor</h3>
            <p className="text-gray-400">Write with ease using our powerful markdown editor with real-time preview.</p>
          </div>
          <div className="glass p-8 rounded-2xl card-hover">
            <Users className="w-12 h-12 text-[#00d4ff] mb-4" />
            <h3 className="text-2xl font-bold mb-3" style={{ fontFamily: 'Space Grotesk' }}>Custom Profiles</h3>
            <p className="text-gray-400">Personalize your profile with custom theme colors and showcase your best work.</p>
          </div>
          <div className="glass p-8 rounded-2xl card-hover">
            <Heart className="w-12 h-12 text-[#ff006e] mb-4" />
            <h3 className="text-2xl font-bold mb-3" style={{ fontFamily: 'Space Grotesk' }}>Engage & Share</h3>
            <p className="text-gray-400">Like, comment, and share posts with the community.</p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="glass p-12 rounded-3xl">
          <h2
            className="text-4xl md:text-5xl font-bold mb-6"
            style={{ fontFamily: 'Space Grotesk' }}
          >
            Ready to start writing?
          </h2>
          <p className="text-xl text-gray-400 mb-8">Join thousands of writers sharing their stories.</p>
          <Button
            data-testid="join-now-btn"
            onClick={handleLogin}
            className="bg-[#00ff88] hover:bg-[#00dd77] text-black font-bold text-lg px-12 py-6 rounded-full"
          >
            Join Now - It's Free
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 mt-20">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-500">
          <p>&copy; 2025 NightBlog. Built for night owls, by night owls.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
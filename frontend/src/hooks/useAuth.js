import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const useAuthHandler = (setUser, setLoading) => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      const hash = window.location.hash;
      
      // Check for session_id in URL fragment
      if (hash && hash.includes('session_id=')) {
        const sessionId = hash.split('session_id=')[1].split('&')[0];
        
        try {
          setLoading(true);
          
          // Exchange session_id for user data
          const formData = new FormData();
          formData.append('session_id', sessionId);
          
          const response = await axios.post(`${API}/auth/session`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            withCredentials: true
          });
          
          setUser(response.data.user);
          
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
          
          toast.success('Welcome to NightBlog!');
          navigate('/feed');
        } catch (error) {
          console.error('Auth error:', error);
          toast.error('Authentication failed');
          navigate('/');
        } finally {
          setLoading(false);
        }
      }
    };

    handleAuth();
  }, [location, navigate, setUser, setLoading]);
};

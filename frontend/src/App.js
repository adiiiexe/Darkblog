import { useEffect, useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import BlogEditor from "./pages/BlogEditor";
import BlogView from "./pages/BlogView";
import ProfileView from "./pages/ProfileView";
import Settings from "./pages/Settings";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

axios.defaults.withCredentials = true;

export const AuthContext = React.createContext(null);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      setUser(null);
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

  return (
    <AuthContext.Provider value={{ user, setUser, checkAuth }}>
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={user ? <Navigate to="/feed" /> : <Landing />} />
            <Route path="/feed" element={user ? <Dashboard /> : <Navigate to="/" />} />
            <Route path="/editor" element={user ? <BlogEditor /> : <Navigate to="/" />} />
            <Route path="/editor/:blogId" element={user ? <BlogEditor /> : <Navigate to="/" />} />
            <Route path="/blog/:blogId" element={<BlogView />} />
            <Route path="/profile/:username" element={<ProfileView />} />
            <Route path="/settings" element={user ? <Settings /> : <Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" />
      </div>
    </AuthContext.Provider>
  );
}

export default App;
export { API };
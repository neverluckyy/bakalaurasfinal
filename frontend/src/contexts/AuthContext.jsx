import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    // Check if we have a token in localStorage
    const token = localStorage.getItem('authToken');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get('/api/auth/me', {
        withCredentials: true
      });
      setUser(response.data.user);
    } catch (error) {
      // Handle rate limit errors (429) more gracefully
      if (error.response?.status === 429) {
        // Rate limited - don't clear token, just log and continue
        console.warn('Rate limit reached for auth check. Please wait a moment.');
        // Don't clear user data on rate limit - keep current user state
        return;
      }
      // Token might be invalid, clear it
      localStorage.removeItem('authToken');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', 
        { email, password }, 
        { withCredentials: true }
      );
      
      // Store token in localStorage if provided
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
      }
      
      setUser(response.data.user);
      return { success: true };
    } catch (error) {
      // Handle rate limit errors specifically
      if (error.response?.status === 429) {
        return { 
          success: false, 
          error: 'Too many login attempts. Please wait a moment and try again.'
        };
      }
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed'
      };
    }
  };

  const register = async (email, password, display_name, avatar_key) => {
    try {
      const response = await axios.post('/api/auth/register', 
        { 
          email, 
          password, 
          display_name, 
          avatar_key,
          terms_accepted: true,
          privacy_accepted: true
        }, 
        { withCredentials: true }
      );
      
      // Store token in localStorage if provided
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
      }
      
      // Set user (even if email not verified - user can log in)
      if (response.data.user) {
        setUser(response.data.user);
      }
      
      return { 
        success: true,
        user: response.data.user 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Registration failed' 
      };
    }
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout', {}, { withCredentials: true });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear token from localStorage
      localStorage.removeItem('authToken');
      setUser(null);
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

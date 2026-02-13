import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { TOKEN_KEY } from '../api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (!api.isConfigured()) {
      setAuthChecked(true);
      return;
    }
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setAuthChecked(true);
      return;
    }
    api.me()
      .then((data) => {
        setUser({ id: data.id, name: data.name, email: data.email, phone: data.phone });
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
      })
      .finally(() => setAuthChecked(true));
  }, []);

  const login = async (email, password) => {
    try {
      const data = await api.login({ email, password });
      if (!data || !data.access_token) {
        throw new Error('Login failed: No token received');
      }
      localStorage.setItem(TOKEN_KEY, data.access_token);
      if (data.user) {
        setUser({ id: data.user.id, name: data.user.name, email: data.user.email, phone: data.user.phone });
        return { success: true, user: data.user };
      }
      throw new Error('Login failed: No user data received');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const signup = async (name, email, password, phone) => {
    await api.signup({ name, email, password, phone });
    return { success: true };
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  const [signInRequested, setSignInRequested] = useState(0);
  const openSignIn = useCallback(() => setSignInRequested((n) => n + 1), []);

  const updateUser = (data) => {
    setUser((prev) => (prev ? { ...prev, ...data } : null));
  };

  const value = {
    user,
    login,
    signup,
    logout,
    updateUser,
    openSignIn,
    signInRequested,
    isAuthenticated: !!user,
    authChecked,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

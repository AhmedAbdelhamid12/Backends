import { createContext, useState, useContext, useEffect, useCallback, useMemo, useRef } from 'react';
import apiClient from '../services/apiClient';

const AuthContext = createContext();

/**
 * AuthProvider - Enhanced authentication context with better error handling
 * Features:
 * - Automatic token refresh
 * - User session persistence
 * - Optimized re-renders with useMemo
 * - Comprehensive error handling
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const authCheckRef = useRef(false);

  // Logout - clears auth state and storage
  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setError(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete apiClient.defaults.headers.common['Authorization'];
  }, []);

  // Fetch current user from backend
  const fetchUser = useCallback(async () => {
    try {
      setError(null);
      const { data } = await apiClient.get('/users/me');
      const userData = data.data?.user || data.user || data.data;
      setUser(userData);
      // Cache user in localStorage for faster initial load
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setError('Failed to load user profile');
      logout();
      return null;
    } finally {
      setLoading(false);
    }
  }, [logout]);

  // Initialize auth on mount
  useEffect(() => {
    // Prevent double-running in strict mode
    if (authCheckRef.current) return;
    authCheckRef.current = true;

    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      // Try to load cached user
      const cachedUser = localStorage.getItem('user');
      if (cachedUser) {
        try {
          setUser(JSON.parse(cachedUser));
        } catch (e) {
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    }
  }, [token, fetchUser]);

  // Login with credentials
  const login = useCallback(async (email, password) => {
    try {
      setError(null);
      const { data } = await apiClient.post('/auth/login', { email, password });
      const authToken = data.data?.accessToken || data.accessToken;
      const userData = data.data?.user || data.user || data.data;
      
      if (!authToken || !userData) {
        throw new Error('Invalid response from server');
      }
      
      // Set token and user
      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(userData));
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      
      setToken(authToken);
      setUser(userData);
      
      console.log(`✅ Login successful: ${userData.name} (${userData.role})`);
      return userData;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      setError(errorMessage);
      console.error('Login failed:', errorMessage);
      throw error;
    }
  }, []);

  // Refresh authentication
  const refreshAuth = useCallback(async () => {
    if (token) {
      return fetchUser();
    }
    return null;
  }, [token, fetchUser]);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      token,
      login,
      logout,
      refreshAuth,
      isAuthenticated: !!user,
      hasRole: (role) => user?.role === role,
      hasAnyRole: (roles) => roles.includes(user?.role),
    }),
    [user, loading, error, token, login, logout, refreshAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
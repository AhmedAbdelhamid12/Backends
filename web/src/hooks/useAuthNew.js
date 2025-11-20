import { useState, useContext, createContext, useEffect } from 'react';
import { authAPI, userAPI } from '../services/apiNew';

// Create context
const AuthContext = createContext();

// Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is authenticated on initial load
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const response = await userAPI.getMe();
          setUser(response.data.data.user);
        } catch (err) {
          // If token is invalid, remove it
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Register function
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authAPI.register(userData);
      const { accessToken, refreshToken, user } = response.data.data;
      
      // Save tokens
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      // Set user
      setUser(user);
      
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authAPI.login(credentials);
      const { accessToken, refreshToken, user } = response.data.data;
      
      // Save tokens
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      // Set user
      setUser(user);
      
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await authAPI.logout({ refreshToken });
      }
    } catch (err) {
      // Ignore errors during logout
    } finally {
      // Clear tokens and user
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    }
  };

  // Update user function
  const updateUser = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await userAPI.updateMe(userData);
      setUser(response.data.data.user);
      
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Context value
  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;